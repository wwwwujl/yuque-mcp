import { createHttpError, toYuqueMcpError, YuqueMcpError } from "./errors.js";

export type YuqueFetch = typeof fetch;
type SleepFn = (ms: number) => Promise<void>;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
}

interface ClientConfig {
  yuqueToken: string;
  yuqueEndpoint: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface ListReposRequest {
  user?: string;
  group?: string;
  type?: "Book" | "Design" | "Column" | "all";
  offset?: number;
  include_membered?: boolean;
}

export interface GetRepoRequest {
  namespace: string;
  type?: "Book" | "Design" | "Column";
}

export interface GetDocRequest {
  namespace: string;
  doc_id_or_slug: string;
  raw?: 0 | 1;
}

export interface CreateDocRequest {
  namespace: string;
  title: string;
  body: string;
  slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
}

export interface UpdateDocRequest {
  namespace: string;
  doc_id_or_slug: string;
  title?: string;
  body?: string;
  new_slug?: string;
  public?: 0 | 1 | 2;
  format?: "markdown" | "html" | "lake";
}

export interface DeleteDocRequest {
  namespace: string;
  doc_id_or_slug: string;
}

export interface ListDocsRequest {
  namespace: string;
  offset?: number;
  limit?: number;
}

export interface UpdateTocRequest {
  namespace: string;
  action: "appendNode" | "prependNode" | "insertNode" | "moveNode" | "removeNode" | "editNode";
  action_mode?: "child" | "sibling";
  doc_ids?: string;
  node_uuid?: string;
  target_uuid?: string;
  to_uuid?: string;
  title?: string;
  node_type?: "DOC" | "TITLE";
  insert_ahead?: 0 | 1;
  url?: string;
  open_window?: 0 | 1;
  visible?: 0 | 1;
}

export interface CreateRepoRequest {
  user?: string;
  group?: string;
  name: string;
  slug: string;
  type?: "Book" | "Design" | "Column";
  description?: string;
  public?: 0 | 1 | 2;
}

export interface UpdateRepoRequest {
  namespace: string;
  name?: string;
  slug?: string;
  description?: string;
  public?: 0 | 1 | 2;
}

export interface DeleteRepoRequest {
  namespace: string;
}

export interface GetGroupRequest {
  login: string;
}

export interface CreateGroupRequest {
  name: string;
  login: string;
  description?: string;
}

export interface UpdateGroupRequest {
  login: string;
  name?: string;
  new_login?: string;
  description?: string;
}

export interface DeleteGroupRequest {
  login: string;
}

export interface ListGroupUsersRequest {
  login: string;
}

export interface AddGroupUserRequest {
  group: string;
  user: string;
  role?: 0 | 1;
}

export interface RemoveGroupUserRequest {
  group: string;
  user: string;
}

export const yuquePaths = {
  getCurrentUser: () => "user",
  listGroups: (login?: string) => (login ? `users/${encodeURIComponent(login)}/groups` : "groups"),
  getGroup: (login: string) => `groups/${encodeURIComponent(login)}`,
  createGroup: () => "groups",
  updateGroup: (login: string) => `groups/${encodeURIComponent(login)}`,
  deleteGroup: (login: string) => `groups/${encodeURIComponent(login)}`,
  listGroupUsers: (login: string) => `groups/${encodeURIComponent(login)}/users`,
  addGroupUser: (group: string, user: string) =>
    `groups/${encodeURIComponent(group)}/users/${encodeURIComponent(user)}`,
  removeGroupUser: (group: string, user: string) =>
    `groups/${encodeURIComponent(group)}/users/${encodeURIComponent(user)}`,
  listRepos: (params: { user?: string; group?: string }) => {
    if (params.user) {
      return `users/${encodeURIComponent(params.user)}/repos`;
    }

    if (params.group) {
      return `groups/${encodeURIComponent(params.group)}/repos`;
    }

    throw new Error("Either user or group must be provided.");
  },
  createRepo: (params: { user?: string; group?: string }) => {
    if (params.user) {
      return `users/${encodeURIComponent(params.user)}/repos`;
    }

    if (params.group) {
      return `groups/${encodeURIComponent(params.group)}/repos`;
    }

    throw new Error("Either user or group must be provided.");
  },
  getRepo: (namespace: string) => `repos/${encodeURIComponent(namespace)}`,
  updateRepo: (namespace: string) => `repos/${encodeURIComponent(namespace)}`,
  deleteRepo: (namespace: string) => `repos/${encodeURIComponent(namespace)}`,
  getRepoToc: (namespace: string) => `repos/${encodeURIComponent(namespace)}/toc`,
  updateToc: (namespace: string) => `repos/${encodeURIComponent(namespace)}/toc`,
  listDocs: (namespace: string) => `repos/${encodeURIComponent(namespace)}/docs`,
  getDoc: (namespace: string, docIdOrSlug: string) =>
    `repos/${encodeURIComponent(namespace)}/docs/${encodeURIComponent(docIdOrSlug)}`,
  createDoc: (namespace: string) => `repos/${encodeURIComponent(namespace)}/docs`,
  updateDoc: (namespace: string, docIdOrSlug: string) =>
    `repos/${encodeURIComponent(namespace)}/docs/${encodeURIComponent(docIdOrSlug)}`,
  deleteDoc: (namespace: string, docIdOrSlug: string) =>
    `repos/${encodeURIComponent(namespace)}/docs/${encodeURIComponent(docIdOrSlug)}`,
} as const;

function sleepDefault(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const possible = payload.message;
  if (typeof possible === "string" && possible.trim().length > 0) {
    return possible;
  }

  return null;
}

export class YuqueClient {
  private readonly token: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: YuqueFetch;
  private readonly sleep: SleepFn;

  public constructor(
    config: ClientConfig,
    deps?: {
      fetchImpl?: YuqueFetch;
      sleep?: SleepFn;
    },
  ) {
    this.token = config.yuqueToken;
    this.endpoint = config.yuqueEndpoint;
    this.timeoutMs = config.timeoutMs;
    this.maxRetries = config.maxRetries;
    this.fetchImpl = deps?.fetchImpl ?? fetch;
    this.sleep = deps?.sleep ?? sleepDefault;
  }

  public async getCurrentUser(): Promise<unknown> {
    return this.request(yuquePaths.getCurrentUser());
  }

  public async listGroups(login?: string): Promise<unknown> {
    return this.request(yuquePaths.listGroups(login));
  }

  public async getGroup(input: GetGroupRequest): Promise<unknown> {
    return this.request(yuquePaths.getGroup(input.login));
  }

  public async createGroup(input: CreateGroupRequest): Promise<unknown> {
    return this.request(yuquePaths.createGroup(), {
      method: "POST",
      body: {
        name: input.name,
        login: input.login,
        description: input.description,
      },
    });
  }

  public async updateGroup(input: UpdateGroupRequest): Promise<unknown> {
    return this.request(yuquePaths.updateGroup(input.login), {
      method: "PUT",
      body: {
        name: input.name,
        login: input.new_login,
        description: input.description,
      },
    });
  }

  public async deleteGroup(input: DeleteGroupRequest): Promise<unknown> {
    return this.request(yuquePaths.deleteGroup(input.login), {
      method: "DELETE",
    });
  }

  public async listGroupUsers(input: ListGroupUsersRequest): Promise<unknown> {
    return this.request(yuquePaths.listGroupUsers(input.login));
  }

  public async addGroupUser(input: AddGroupUserRequest): Promise<unknown> {
    return this.request(yuquePaths.addGroupUser(input.group, input.user), {
      method: "PUT",
      body: {
        role: input.role,
      },
    });
  }

  public async removeGroupUser(input: RemoveGroupUserRequest): Promise<unknown> {
    return this.request(yuquePaths.removeGroupUser(input.group, input.user), {
      method: "DELETE",
    });
  }

  public async listRepos(input: ListReposRequest): Promise<unknown> {
    const normalizedType = input.type === "all" ? undefined : input.type;

    return this.request(yuquePaths.listRepos(input), {
      query: {
        type: normalizedType,
        offset: input.offset,
        include_membered: input.include_membered,
      },
    });
  }

  public async getRepo(input: GetRepoRequest): Promise<unknown> {
    return this.request(yuquePaths.getRepo(input.namespace), {
      query: {
        type: input.type,
      },
    });
  }

  public async createRepo(input: CreateRepoRequest): Promise<unknown> {
    return this.request(yuquePaths.createRepo(input), {
      method: "POST",
      body: {
        name: input.name,
        slug: input.slug,
        type: input.type,
        description: input.description,
        public: input.public,
      },
    });
  }

  public async updateRepo(input: UpdateRepoRequest): Promise<unknown> {
    return this.request(yuquePaths.updateRepo(input.namespace), {
      method: "PUT",
      body: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        public: input.public,
      },
    });
  }

  public async deleteRepo(input: DeleteRepoRequest): Promise<unknown> {
    return this.request(yuquePaths.deleteRepo(input.namespace), {
      method: "DELETE",
    });
  }

  public async getRepoToc(namespace: string): Promise<unknown> {
    return this.request(yuquePaths.getRepoToc(namespace));
  }

  public async listDocs(input: ListDocsRequest): Promise<unknown> {
    return this.request(yuquePaths.listDocs(input.namespace), {
      query: {
        offset: input.offset,
        limit: input.limit,
      },
    });
  }

  public async getDoc(input: GetDocRequest): Promise<unknown> {
    return this.request(yuquePaths.getDoc(input.namespace, input.doc_id_or_slug), {
      query: {
        raw: input.raw ?? 1,
      },
    });
  }

  public async createDoc(input: CreateDocRequest): Promise<unknown> {
    return this.request(yuquePaths.createDoc(input.namespace), {
      method: "POST",
      body: {
        title: input.title,
        body: input.body,
        slug: input.slug,
        public: input.public,
        format: input.format,
      },
    });
  }

  public async updateDoc(input: UpdateDocRequest): Promise<unknown> {
    return this.request(yuquePaths.updateDoc(input.namespace, input.doc_id_or_slug), {
      method: "PUT",
      body: {
        title: input.title,
        body: input.body,
        slug: input.new_slug,
        public: input.public,
        format: input.format,
      },
    });
  }

  public async deleteDoc(input: DeleteDocRequest): Promise<unknown> {
    return this.request(yuquePaths.deleteDoc(input.namespace, input.doc_id_or_slug), {
      method: "DELETE",
    });
  }

  public async updateToc(input: UpdateTocRequest): Promise<unknown> {
    return this.request(yuquePaths.updateToc(input.namespace), {
      method: "PUT",
      body: {
        action: input.action,
        action_mode: input.action_mode,
        doc_ids: input.doc_ids,
        node_uuid: input.node_uuid,
        target_uuid: input.target_uuid,
        to_uuid: input.to_uuid,
        title: input.title,
        node_type: input.node_type,
        insert_ahead: input.insert_ahead,
        url: input.url,
        open_window: input.open_window,
        visible: input.visible,
      },
    });
  }

  private shouldRetry(method: HttpMethod, statusCode: number | null, attempt: number): boolean {
    if (method !== "GET") {
      return false;
    }

    if (attempt >= this.maxRetries) {
      return false;
    }

    if (statusCode === null) {
      return true;
    }

    return statusCode === 429 || statusCode >= 500;
  }

  private getBackoffMs(attempt: number): number {
    const exp = 200 * 2 ** attempt;
    return Math.min(exp, 1500);
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.endpoint);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  private async parsePayload(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  private unwrapData(payload: unknown): unknown {
    if (!isRecord(payload)) {
      return payload;
    }

    if ("data" in payload) {
      return payload.data;
    }

    return payload;
  }

  private toRequestBody(body?: Record<string, unknown>): string | undefined {
    if (!body) {
      return undefined;
    }

    const compact: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        compact[key] = value;
      }
    }

    return JSON.stringify(compact);
  }

  private async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const method = options.method ?? "GET";
    const url = this.buildUrl(path, options.query);
    const requestBody = this.toRequestBody(options.body);
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchImpl(url, {
          method,
          headers: {
            Accept: "application/json",
            "X-Auth-Token": this.token,
            ...(requestBody ? { "Content-Type": "application/json" } : {}),
          },
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const payload = await this.parsePayload(response);

        if (!response.ok) {
          const mapped = createHttpError(response.status, extractMessage(payload), {
            method,
            path,
          });

          if (this.shouldRetry(method, response.status, attempt)) {
            attempt += 1;
            await this.sleep(this.getBackoffMs(attempt));
            continue;
          }

          throw mapped;
        }

        return this.unwrapData(payload);
      } catch (error) {
        clearTimeout(timeout);
        const mapped = toYuqueMcpError(error);

        if (this.shouldRetry(method, mapped.statusCode, attempt)) {
          attempt += 1;
          await this.sleep(this.getBackoffMs(attempt));
          continue;
        }

        if (mapped instanceof YuqueMcpError) {
          throw mapped;
        }

        throw new YuqueMcpError({
          code: "UNKNOWN_ERROR",
          message: "Unknown Yuque client error.",
        });
      }
    }
  }
}
