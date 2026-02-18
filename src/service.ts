import { readFile, realpath, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";

import {
  normalizeDoc,
  normalizeDocs,
  normalizeGroup,
  normalizeGroupUser,
  normalizeGroupUsers,
  normalizeGroups,
  normalizeRepo,
  normalizeRepos,
  normalizeToc,
  normalizeUser,
} from "./normalizers.js";
import { YuqueMcpError } from "./errors.js";
import type {
  CreateGroupRequest,
  CreateRepoRequest,
  CreateDocRequest,
  AddGroupUserRequest,
  DeleteGroupRequest,
  DeleteRepoRequest,
  DeleteDocRequest,
  GetDocRequest,
  GetGroupRequest,
  GetRepoRequest,
  ListDocsRequest,
  ListReposRequest,
  ListGroupUsersRequest,
  RemoveGroupUserRequest,
  UpdateGroupRequest,
  UpdateRepoRequest,
  UpdateDocRequest,
  UpdateTocRequest,
} from "./yuque-client.js";

export interface YuqueApi {
  getCurrentUser(): Promise<unknown>;
  listGroups(login?: string): Promise<unknown>;
  getGroup(input: GetGroupRequest): Promise<unknown>;
  createGroup(input: CreateGroupRequest): Promise<unknown>;
  updateGroup(input: UpdateGroupRequest): Promise<unknown>;
  deleteGroup(input: DeleteGroupRequest): Promise<unknown>;
  listGroupUsers(input: ListGroupUsersRequest): Promise<unknown>;
  addGroupUser(input: AddGroupUserRequest): Promise<unknown>;
  removeGroupUser(input: RemoveGroupUserRequest): Promise<unknown>;
  listRepos(input: ListReposRequest): Promise<unknown>;
  createRepo(input: CreateRepoRequest): Promise<unknown>;
  getRepo(input: GetRepoRequest): Promise<unknown>;
  updateRepo(input: UpdateRepoRequest): Promise<unknown>;
  deleteRepo(input: DeleteRepoRequest): Promise<unknown>;
  getRepoToc(namespace: string): Promise<unknown>;
  listDocs(input: ListDocsRequest): Promise<unknown>;
  getDoc(input: GetDocRequest): Promise<unknown>;
  createDoc(input: CreateDocRequest): Promise<unknown>;
  updateDoc(input: UpdateDocRequest): Promise<unknown>;
  deleteDoc(input: DeleteDocRequest): Promise<unknown>;
  updateToc(input: UpdateTocRequest): Promise<unknown>;
}

interface SearchInput {
  namespace: string;
  query: string;
  limit: number;
}

interface SearchAndReadInput extends SearchInput {
  read_first: boolean;
}

const SEARCH_PAGE_LIMIT = 100;

interface GetMyRepositoriesInput {
  type?: "Book" | "Design" | "Column" | "all";
  offset?: number;
  include_membered?: boolean;
}

interface GetRepositoryOverviewInput {
  namespace: string;
}

interface DocReferenceInput {
  slug?: string;
  doc_id?: string;
}

interface GetDocInput extends DocReferenceInput {
  namespace: string;
  raw?: 0 | 1;
}

interface UpdateDocInput extends DocReferenceInput {
  namespace: string;
  title?: string;
  body?: string;
  new_slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
}

interface CreateDocWithTocInput {
  namespace: string;
  title: string;
  body: string;
  slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
  parent_uuid?: string;
}

interface CreateDocFromFileInput {
  namespace: string;
  file_path: string;
  title?: string;
  slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
  parent_uuid?: string;
}

interface UpdateDocFromFileInput extends DocReferenceInput {
  namespace: string;
  file_path: string;
  title?: string;
  new_slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
}

interface WriteSafetyPolicy {
  allowWrite: boolean;
  writeNamespaceAllowlist: string[];
  writeGroupAllowlist: string[];
  allowDelete: boolean;
  deleteNamespaceAllowlist: string[];
  fileRoot: string;
  fileMaxBytes: number;
  fileAllowedExtensions: string[];
}

interface DeleteWithConfirmation {
  confirm: true;
  confirm_text: string;
}

type DeleteDocInput = DocReferenceInput &
  DeleteWithConfirmation & {
    namespace: string;
  };
type DeleteRepoInput = DeleteRepoRequest & DeleteWithConfirmation;
type DeleteGroupInput = DeleteGroupRequest & DeleteWithConfirmation;

const DEFAULT_WRITE_POLICY: WriteSafetyPolicy = {
  allowWrite: false,
  writeNamespaceAllowlist: [],
  writeGroupAllowlist: [],
  allowDelete: false,
  deleteNamespaceAllowlist: [],
  fileRoot: process.cwd(),
  fileMaxBytes: 1024 * 1024,
  fileAllowedExtensions: [".md", ".markdown", ".txt"],
};

export class YuqueToolService {
  public constructor(
    private readonly client: YuqueApi,
    private readonly writeSafety: WriteSafetyPolicy = DEFAULT_WRITE_POLICY,
  ) {}

  private static asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private static extractTocArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }

    const record = YuqueToolService.asRecord(value);
    const toc = record.toc;
    if (Array.isArray(toc)) {
      return toc;
    }

    return [];
  }

  private static resolveDocRef(input: DocReferenceInput): string {
    if (input.slug) {
      return input.slug;
    }

    if (input.doc_id) {
      return input.doc_id;
    }

    throw new YuqueMcpError({
      code: "VALIDATION_ERROR",
      message: "Exactly one of slug or doc_id must be provided.",
    });
  }

  private static extractMarkdownTitle(content: string): string | null {
    for (const line of content.split(/\r?\n/u)) {
      const stripped = line.trim();
      if (stripped.startsWith("# ")) {
        return stripped.slice(2).trim() || null;
      }

      if (stripped.length > 0) {
        return null;
      }
    }

    return null;
  }

  private ensureDeleteEnabled() {
    if (!this.writeSafety.allowDelete) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Delete operation is disabled by server policy. Set YUQUE_ALLOW_DELETE=true to enable.",
      });
    }
  }

  private ensureWriteEnabled() {
    if (!this.writeSafety.allowWrite) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Write operation is disabled by server policy. Set YUQUE_ALLOW_WRITE=true to enable.",
      });
    }
  }

  private ensureWriteNamespaceAllowed(namespace: string) {
    if (
      this.writeSafety.writeNamespaceAllowlist.length > 0 &&
      !this.writeSafety.writeNamespaceAllowlist.includes(namespace)
    ) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Write operation blocked for this namespace by server policy.",
        details: { namespace },
      });
    }
  }

  private ensureWriteGroupAllowed(login: string) {
    if (
      this.writeSafety.writeGroupAllowlist.length > 0 &&
      !this.writeSafety.writeGroupAllowlist.includes(login)
    ) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Write operation blocked for this group by server policy.",
        details: { group: login },
      });
    }
  }

  private validateWriteOwnerAndNamespace(owner: string, slug: string) {
    this.ensureWriteNamespaceAllowed(`${owner}/${slug}`);
  }

  private async readLocalDocFile(filePath: string): Promise<{ content: string; resolvedPath: string }> {
    let resolvedRoot: string;
    try {
      resolvedRoot = await realpath(resolve(this.writeSafety.fileRoot));
    } catch {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Configured file root does not exist or is not accessible.",
        details: {
          fileRoot: this.writeSafety.fileRoot,
        },
      });
    }

    let resolvedPath: string;
    try {
      resolvedPath = await realpath(resolve(filePath));
    } catch {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Local file does not exist or is not accessible.",
        details: {
          filePath,
        },
      });
    }

    const relPath = relative(resolvedRoot, resolvedPath);
    if (relPath.startsWith("..") || isAbsolute(relPath)) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Local file is outside allowed root directory.",
        details: {
          filePath,
          fileRoot: resolvedRoot,
        },
      });
    }

    const extension = extname(resolvedPath).toLowerCase();
    if (
      this.writeSafety.fileAllowedExtensions.length > 0 &&
      !this.writeSafety.fileAllowedExtensions.includes(extension)
    ) {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Local file extension is not allowed by server policy.",
        details: {
          filePath,
          extension,
          allowedExtensions: this.writeSafety.fileAllowedExtensions,
        },
      });
    }

    const info = await stat(resolvedPath);

    if (!info.isFile()) {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Local file path must point to a regular file.",
        details: {
          filePath,
        },
      });
    }

    if (info.size > this.writeSafety.fileMaxBytes) {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Local file exceeds allowed size limit.",
        details: {
          filePath,
          size: info.size,
          maxBytes: this.writeSafety.fileMaxBytes,
        },
      });
    }

    const content = await readFile(resolvedPath, "utf8");
    return {
      content,
      resolvedPath,
    };
  }

  private ensureDeleteTargetAllowed(target: string) {
    if (
      this.writeSafety.deleteNamespaceAllowlist.length > 0 &&
      !this.writeSafety.deleteNamespaceAllowlist.includes(target)
    ) {
      throw new YuqueMcpError({
        code: "PERMISSION_DENIED",
        message: "Delete operation blocked for this target by server policy.",
        details: { target },
      });
    }
  }

  private ensureDeleteConfirmation(confirmText: string, expectedPhrase: string) {
    if (confirmText !== expectedPhrase) {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Delete confirmation text mismatch.",
        details: {
          expected: expectedPhrase,
        },
      });
    }
  }

  private async resolveAlternativeNamespace(namespace: string): Promise<string | null> {
    try {
      const repo = await this.getRepo({
        namespace,
      });
      if (repo.namespace && repo.namespace !== namespace) {
        return repo.namespace;
      }
    } catch {
      // Ignore lookup failures; caller decides whether fallback is possible.
    }

    return null;
  }

  private async tryAttachDocToToc(
    namespace: string,
    docId: number | null,
    docSlug: string | null,
    parentUuid?: string,
  ) {
    if (docId === null) {
      return {
        updated: false,
        reason: "doc_id_unavailable",
      };
    }

    const docIdString = String(docId);

    try {
      await this.updateToc({
        namespace,
        action: "appendNode",
        action_mode: "child",
        doc_ids: docIdString,
        target_uuid: parentUuid,
        node_type: "DOC",
      });
      return {
        updated: true,
        reason: "api_update_toc",
      };
    } catch (error) {
      const tocItems = await this.getRepoToc(namespace);
      const alreadyPresent = tocItems.some(
        (item) =>
          (item.id !== null && String(item.id) === docIdString) ||
          (docSlug !== null && item.slug === docSlug),
      );
      if (alreadyPresent) {
        return {
          updated: false,
          reason: "already_in_toc",
        };
      }

      if (
        error instanceof YuqueMcpError &&
        (error.statusCode === 400 || error.statusCode === 422)
      ) {
        return {
          updated: false,
          reason: "attach_not_required_or_unsupported",
          error: {
            code: error.code,
            statusCode: error.statusCode,
            message: error.message,
          },
        };
      }

      throw error;
    }
  }

  public async getCurrentUser() {
    const raw = await this.client.getCurrentUser();
    return normalizeUser(raw);
  }

  public async listGroups(login?: string) {
    if (login) {
      const raw = await this.client.listGroups(login);
      return normalizeGroups(raw);
    }

    try {
      const raw = await this.client.listGroups();
      return normalizeGroups(raw);
    } catch (error) {
      if (!(error instanceof YuqueMcpError) || error.code !== "NOT_FOUND") {
        throw error;
      }

      const user = normalizeUser(await this.client.getCurrentUser());
      if (!user.login) {
        throw error;
      }

      const fallback = await this.client.listGroups(user.login);
      return normalizeGroups(fallback);
    }
  }

  public async getGroup(input: GetGroupRequest) {
    const raw = await this.client.getGroup(input);
    return normalizeGroup(raw);
  }

  public async listGroupUsers(input: ListGroupUsersRequest) {
    const raw = await this.client.listGroupUsers(input);
    return normalizeGroupUsers(raw);
  }

  public async addGroupUser(input: AddGroupUserRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteGroupAllowed(input.group);

    const raw = await this.client.addGroupUser(input);
    return normalizeGroupUser(raw);
  }

  public async removeGroupUser(input: RemoveGroupUserRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteGroupAllowed(input.group);

    const raw = await this.client.removeGroupUser(input);
    const record = YuqueToolService.asRecord(raw);
    const hasUserShape = Object.keys(record).length > 0;
    return {
      group: input.group,
      user: input.user,
      removed: true,
      membership: hasUserShape ? normalizeGroupUser(raw) : null,
    };
  }

  public async createGroup(input: CreateGroupRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteGroupAllowed(input.login);

    const raw = await this.client.createGroup(input);
    return normalizeGroup(raw);
  }

  public async updateGroup(input: UpdateGroupRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteGroupAllowed(input.login);
    if (input.new_login) {
      this.ensureWriteGroupAllowed(input.new_login);
    }

    const raw = await this.client.updateGroup(input);
    return normalizeGroup(raw);
  }

  public async deleteGroup(input: DeleteGroupInput) {
    this.ensureWriteEnabled();
    this.ensureWriteGroupAllowed(input.login);
    this.ensureDeleteEnabled();
    this.ensureDeleteTargetAllowed(input.login);
    this.ensureDeleteConfirmation(input.confirm_text, `DELETE GROUP ${input.login}`);

    const raw = await this.client.deleteGroup(input);
    const record = YuqueToolService.asRecord(raw);
    const hasGroupShape = Object.keys(record).length > 0;

    return {
      login: input.login,
      deleted: true,
      group: hasGroupShape ? normalizeGroup(raw) : null,
    };
  }

  public async getMyRepositories(input: GetMyRepositoriesInput = {}) {
    const user = await this.getCurrentUser();
    if (!user.login) {
      throw new YuqueMcpError({
        code: "VALIDATION_ERROR",
        message: "Current user login is unavailable.",
      });
    }

    const repos = await this.listRepos({
      user: user.login,
      type: input.type,
      offset: input.offset,
      include_membered: input.include_membered,
    });

    return {
      user,
      repos,
    };
  }

  public async listRepos(input: ListReposRequest) {
    const raw = await this.client.listRepos(input);
    return normalizeRepos(raw);
  }

  public async createRepo(input: CreateRepoRequest) {
    this.ensureWriteEnabled();
    const owner = input.user ?? input.group;
    if (owner) {
      if (input.group) {
        this.ensureWriteGroupAllowed(input.group);
      }
      this.validateWriteOwnerAndNamespace(owner, input.slug);
    }

    const raw = await this.client.createRepo(input);
    return normalizeRepo(raw);
  }

  public async getRepo(input: GetRepoRequest) {
    const raw = await this.client.getRepo(input);
    return normalizeRepo(raw);
  }

  public async updateRepo(input: UpdateRepoRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);

    const raw = await this.client.updateRepo(input);
    return normalizeRepo(raw);
  }

  public async deleteRepo(input: DeleteRepoInput) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);
    this.ensureDeleteEnabled();
    this.ensureDeleteTargetAllowed(input.namespace);
    this.ensureDeleteConfirmation(input.confirm_text, `DELETE REPO ${input.namespace}`);

    const raw = await this.client.deleteRepo(input);
    const record = YuqueToolService.asRecord(raw);
    const hasRepoShape = Object.keys(record).length > 0;

    return {
      namespace: input.namespace,
      deleted: true,
      repo: hasRepoShape ? normalizeRepo(raw) : null,
    };
  }

  public async getRepoToc(namespace: string) {
    let primaryError: unknown = null;
    try {
      const raw = await this.client.getRepoToc(namespace);
      const primary = normalizeToc(raw);
      if (primary.length > 0) {
        return primary;
      }

      const alternative = await this.resolveAlternativeNamespace(namespace);
      if (!alternative) {
        return primary;
      }

      const fallbackRaw = await this.client.getRepoToc(alternative);
      const fallback = normalizeToc(fallbackRaw);
      return fallback.length > 0 ? fallback : primary;
    } catch (error) {
      primaryError = error;
    }

    const alternative = await this.resolveAlternativeNamespace(namespace);
    if (!alternative) {
      throw primaryError;
    }

    try {
      const fallbackRaw = await this.client.getRepoToc(alternative);
      return normalizeToc(fallbackRaw);
    } catch {
      throw primaryError;
    }
  }

  public async getRepositoryOverview(input: GetRepositoryOverviewInput) {
    const repo = await this.getRepo({
      namespace: input.namespace,
    });
    const toc = await this.getRepoToc(input.namespace);

    return {
      repo,
      toc,
    };
  }

  public async listDocs(input: ListDocsRequest) {
    const raw = await this.client.listDocs(input);
    return normalizeDocs(raw);
  }

  public async getDoc(input: GetDocInput) {
    const raw = await this.client.getDoc({
      namespace: input.namespace,
      doc_id_or_slug: YuqueToolService.resolveDocRef(input),
      raw: input.raw,
    });
    return normalizeDoc(raw);
  }

  public async searchDocs(input: SearchInput) {
    const query = input.query.toLowerCase();
    const items: ReturnType<typeof normalizeDocs> = [];
    let total = 0;
    let offset = 0;

    while (true) {
      const docs = await this.listDocs({
        namespace: input.namespace,
        offset,
        limit: SEARCH_PAGE_LIMIT,
      });

      if (docs.length === 0) {
        break;
      }

      for (const doc of docs) {
        const title = doc.title ?? "";
        const slug = doc.slug ?? "";
        const description = doc.description ?? "";
        const payload = `${title} ${slug} ${description}`.toLowerCase();
        if (!payload.includes(query)) {
          continue;
        }

        total += 1;
        if (items.length < input.limit) {
          items.push(doc);
        }
      }

      offset += docs.length;
      if (docs.length < SEARCH_PAGE_LIMIT) {
        break;
      }
    }

    return {
      query: input.query,
      total,
      items,
    };
  }

  public async searchAndRead(input: SearchAndReadInput) {
    const search = await this.searchDocs(input);
    let firstDoc: ReturnType<typeof normalizeDoc> | null = null;

    if (input.read_first && search.items.length > 0) {
      const first = search.items[0];
      if (first) {
        const ref = first.slug ?? (first.id !== null ? String(first.id) : null);
        if (ref) {
          firstDoc = await this.getDoc({
            namespace: input.namespace,
            slug: first.slug ?? undefined,
            doc_id: first.slug ? undefined : ref,
            raw: 1,
          });
        }
      }
    }

    return {
      ...search,
      first_doc: firstDoc,
      read_first: input.read_first,
    };
  }

  public async createDoc(input: CreateDocRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);

    const raw = await this.client.createDoc(input);
    return normalizeDoc(raw);
  }

  public async createDocWithToc(input: CreateDocWithTocInput) {
    const created = await this.createDoc({
      namespace: input.namespace,
      title: input.title,
      body: input.body,
      slug: input.slug,
      public: input.public,
      format: input.format,
    });

    const toc = await this.tryAttachDocToToc(input.namespace, created.id, created.slug, input.parent_uuid);

    return {
      doc: created,
      toc,
    };
  }

  public async updateDoc(input: UpdateDocInput) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);

    const raw = await this.client.updateDoc({
      namespace: input.namespace,
      doc_id_or_slug: YuqueToolService.resolveDocRef(input),
      title: input.title,
      body: input.body,
      new_slug: input.new_slug,
      public: input.public,
      format: input.format,
    });
    return normalizeDoc(raw);
  }

  public async deleteDoc(input: DeleteDocInput) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);
    this.ensureDeleteEnabled();
    this.ensureDeleteTargetAllowed(input.namespace);

    const docRef = YuqueToolService.resolveDocRef(input);
    this.ensureDeleteConfirmation(input.confirm_text, `DELETE DOC ${input.namespace}/${docRef}`);

    const raw = await this.client.deleteDoc({
      namespace: input.namespace,
      doc_id_or_slug: docRef,
    });
    const record = YuqueToolService.asRecord(raw);
    const hasDocShape = Object.keys(record).length > 0;

    return {
      namespace: input.namespace,
      docRef,
      slug: input.slug ?? null,
      docId: input.doc_id ?? null,
      deleted: true,
      doc: hasDocShape ? normalizeDoc(raw) : null,
    };
  }

  public async createDocFromFile(input: CreateDocFromFileInput) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);
    const localFile = await this.readLocalDocFile(input.file_path);
    const content = localFile.content;
    const inferredTitle = YuqueToolService.extractMarkdownTitle(content);
    const title = input.title ?? inferredTitle ?? basename(localFile.resolvedPath);

    const result = await this.createDocWithToc({
      namespace: input.namespace,
      title,
      body: content,
      slug: input.slug,
      public: input.public,
      format: input.format,
      parent_uuid: input.parent_uuid,
    });

    return {
      ...result,
      source_file: localFile.resolvedPath,
    };
  }

  public async updateDocFromFile(input: UpdateDocFromFileInput) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);
    const localFile = await this.readLocalDocFile(input.file_path);
    const content = localFile.content;
    const inferredTitle = YuqueToolService.extractMarkdownTitle(content);
    const title = input.title ?? inferredTitle ?? undefined;

    const doc = await this.updateDoc({
      namespace: input.namespace,
      slug: input.slug,
      doc_id: input.doc_id,
      body: content,
      title,
      new_slug: input.new_slug,
      public: input.public,
      format: input.format,
    });

    return {
      doc,
      source_file: localFile.resolvedPath,
    };
  }

  public async updateToc(input: UpdateTocRequest) {
    this.ensureWriteEnabled();
    this.ensureWriteNamespaceAllowed(input.namespace);

    let raw: unknown;
    let effectiveNamespace = input.namespace;
    try {
      raw = await this.client.updateToc(input);
    } catch (error) {
      const alternative = await this.resolveAlternativeNamespace(input.namespace);
      if (!alternative) {
        throw error;
      }

      raw = await this.client.updateToc({
        ...input,
        namespace: alternative,
      });
      effectiveNamespace = alternative;
    }
    const items = YuqueToolService.extractTocArray(raw);

    return {
      namespace: input.namespace,
      effectiveNamespace,
      action: input.action,
      items: normalizeToc(items),
      raw: items.length > 0 ? null : raw ?? null,
    };
  }
}
