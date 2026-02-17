import { describe, expect, test, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { YuqueMcpError } from "../src/errors.js";
import type { YuqueApi } from "../src/service.js";
import { YuqueToolService } from "../src/service.js";

function createApiMock(overrides: Partial<YuqueApi> = {}): YuqueApi {
  return {
    getCurrentUser: vi.fn(),
    listGroups: vi.fn(),
    getGroup: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    listRepos: vi.fn(),
    createRepo: vi.fn(),
    getRepo: vi.fn(),
    updateRepo: vi.fn(),
    deleteRepo: vi.fn(),
    getRepoToc: vi.fn(),
    listDocs: vi.fn(),
    getDoc: vi.fn(),
    createDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateToc: vi.fn(),
    ...overrides,
  };
}

describe("YuqueToolService", () => {
  test("listGroups falls back to users/{login}/groups on top-level 404", async () => {
    const listGroups = vi
      .fn()
      .mockRejectedValueOnce(
        new YuqueMcpError({
          code: "NOT_FOUND",
          message: "Not Found",
          statusCode: 404,
        }),
      )
      .mockResolvedValueOnce([{ id: 1, login: "team", name: "Team" }]);

    const service = new YuqueToolService(
      createApiMock({
        getCurrentUser: vi.fn().mockResolvedValue({ login: "alice" }),
        listGroups,
      }),
    );

    const result = await service.listGroups();
    expect(listGroups).toHaveBeenNthCalledWith(1);
    expect(listGroups).toHaveBeenNthCalledWith(2, "alice");
    expect(result).toHaveLength(1);
    expect(result[0]?.login).toBe("team");
  });

  test("searchDocs filters title, slug, and description with limit", async () => {
    const service = new YuqueToolService(
      createApiMock({
        listDocs: vi.fn().mockResolvedValue([
          { id: 1, title: "API Overview", slug: "api-overview", description: "service intro" },
          { id: 2, title: "Setup", slug: "project-setup", description: "configure API token" },
          { id: 3, title: "Glossary", slug: "terms", description: "terminology" },
        ]),
      }),
    );

    const result = await service.searchDocs({
      namespace: "team/repo",
      query: "api",
      limit: 1,
    });

    expect(result.query).toBe("api");
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe("API Overview");
  });

  test("searchDocs paginates beyond first 100 docs", async () => {
    const pageOne = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      title: `Doc ${index + 1}`,
      slug: `doc-${index + 1}`,
      description: index === 50 ? "contains keyword" : "no match",
    }));
    const pageTwo = [
      { id: 101, title: "Page 2 match", slug: "page-2-match", description: "keyword here" },
      { id: 102, title: "Page 2 plain", slug: "page-2-plain", description: "none" },
    ];

    const listDocs = vi
      .fn()
      .mockResolvedValueOnce(pageOne)
      .mockResolvedValueOnce(pageTwo);
    const service = new YuqueToolService(
      createApiMock({
        listDocs,
      }),
    );

    const result = await service.searchDocs({
      namespace: "team/repo",
      query: "keyword",
      limit: 10,
    });

    expect(listDocs).toHaveBeenNthCalledWith(1, {
      namespace: "team/repo",
      offset: 0,
      limit: 100,
    });
    expect(listDocs).toHaveBeenNthCalledWith(2, {
      namespace: "team/repo",
      offset: 100,
      limit: 100,
    });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.slug).toBe("doc-51");
    expect(result.items[1]?.slug).toBe("page-2-match");
  });

  test("searchAndRead returns first doc details", async () => {
    const service = new YuqueToolService(
      createApiMock({
        listDocs: vi.fn().mockResolvedValue([{ id: 1, title: "API", slug: "api", description: "x" }]),
        getDoc: vi.fn().mockResolvedValue({
          id: 1,
          slug: "api",
          title: "API",
          body: "# API",
          body_html: "<h1>API</h1>",
        }),
      }),
    );

    const result = await service.searchAndRead({
      namespace: "team/repo",
      query: "api",
      limit: 10,
      read_first: true,
    });

    expect(result.total).toBe(1);
    expect(result.first_doc?.slug).toBe("api");
  });

  test("getMyRepositories combines current user and repos", async () => {
    const listRepos = vi.fn().mockResolvedValue([{ id: 1, name: "KB", slug: "kb" }]);
    const service = new YuqueToolService(
      createApiMock({
        getCurrentUser: vi.fn().mockResolvedValue({
          id: 10,
          login: "alice",
          name: "Alice",
        }),
        listRepos,
      }),
    );

    const result = await service.getMyRepositories({
      type: "Book",
      offset: 5,
      include_membered: true,
    });

    expect(listRepos).toHaveBeenCalledWith({
      user: "alice",
      type: "Book",
      offset: 5,
      include_membered: true,
    });
    expect(result.user.login).toBe("alice");
    expect(result.repos).toHaveLength(1);
  });

  test("getRepositoryOverview combines repo and toc", async () => {
    const service = new YuqueToolService(
      createApiMock({
        getRepo: vi.fn().mockResolvedValue({
          id: 1,
          name: "KB",
          slug: "kb",
        }),
        getRepoToc: vi.fn().mockResolvedValue([
          {
            id: 100,
            uuid: "uuid-1",
            type: "DOC",
            title: "Intro",
            slug: "intro",
            depth: 1,
          },
        ]),
      }),
    );

    const result = await service.getRepositoryOverview({
      namespace: "team/kb",
    });

    expect(result.repo.slug).toBe("kb");
    expect(result.toc).toHaveLength(1);
    expect(result.toc[0]?.uuid).toBe("uuid-1");
  });

  test("createDoc and updateDoc normalize response shape", async () => {
    const rawDoc = {
      id: 100,
      slug: "hello",
      title: "Hello",
      description: "desc",
      format: "markdown",
      public: 0,
      word_count: 12,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
      body: "# Hello",
      body_html: "<h1>Hello</h1>",
      likes_count: 1,
      comments_count: 0,
      pinned: false,
    };

    const service = new YuqueToolService(
      createApiMock({
        createDoc: vi.fn().mockResolvedValue(rawDoc),
        updateDoc: vi.fn().mockResolvedValue(rawDoc),
      }),
    );

    const created = await service.createDoc({
      namespace: "team/repo",
      title: "Hello",
      body: "# Hello",
    });
    const updated = await service.updateDoc({
      namespace: "team/repo",
      slug: "hello",
      body: "# Updated",
    });

    expect(created.slug).toBe("hello");
    expect(created.bodyHtml).toBe("<h1>Hello</h1>");
    expect(updated.id).toBe(100);
  });

  test("createDocWithToc returns doc and toc status", async () => {
    const updateToc = vi.fn().mockResolvedValue({ ok: true });
    const service = new YuqueToolService(
      createApiMock({
        createDoc: vi.fn().mockResolvedValue({
          id: 100,
          slug: "hello",
          title: "Hello",
        }),
        updateToc,
      }),
    );

    const result = await service.createDocWithToc({
      namespace: "team/repo",
      title: "Hello",
      body: "# Hello",
    });

    expect(updateToc).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "team/repo",
        action: "appendNode",
        doc_ids: "100",
      }),
    );
    expect(result.doc.slug).toBe("hello");
    expect(result.toc.updated).toBe(true);
  });

  test("createRepo and updateRepo normalize response shape", async () => {
    const rawRepo = {
      id: 10,
      type: "Book",
      name: "Knowledge Base",
      slug: "kb",
      namespace: "team/kb",
      user: { login: "team" },
      description: "docs",
      public: 0,
      items_count: 12,
      docs_count: 8,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };

    const service = new YuqueToolService(
      createApiMock({
        createRepo: vi.fn().mockResolvedValue(rawRepo),
        updateRepo: vi.fn().mockResolvedValue(rawRepo),
      }),
    );

    const created = await service.createRepo({
      user: "team",
      name: "Knowledge Base",
      slug: "kb",
      type: "Book",
      public: 0,
    });
    const updated = await service.updateRepo({
      namespace: "team/kb",
      description: "updated",
    });

    expect(created.namespace).toBe("team/kb");
    expect(created.userLogin).toBe("team");
    expect(updated.docsCount).toBe(8);
  });

  test("createGroup and updateGroup normalize response shape", async () => {
    const rawGroup = {
      id: 20,
      login: "team",
      name: "Team",
      description: "group desc",
      avatar_url: "https://example.com/avatar.png",
    };

    const service = new YuqueToolService(
      createApiMock({
        createGroup: vi.fn().mockResolvedValue(rawGroup),
        updateGroup: vi.fn().mockResolvedValue(rawGroup),
      }),
    );

    const created = await service.createGroup({
      name: "Team",
      login: "team",
    });
    const updated = await service.updateGroup({
      login: "team",
      description: "new desc",
    });

    expect(created.login).toBe("team");
    expect(created.avatarUrl).toContain("example.com");
    expect(updated.id).toBe(20);
  });

  test("deleteDoc returns stable deletion payload", async () => {
    const service = new YuqueToolService(
      createApiMock({
        deleteDoc: vi.fn().mockResolvedValue({
          id: 11,
          slug: "intro",
          title: "Intro",
        }),
      }),
      { allowDelete: true, deleteNamespaceAllowlist: [] },
    );

    const result = await service.deleteDoc({
      namespace: "team/repo",
      slug: "intro",
      confirm: true,
      confirm_text: "DELETE DOC team/repo/intro",
    });

    expect(result.deleted).toBe(true);
    expect(result.namespace).toBe("team/repo");
    expect(result.docRef).toBe("intro");
    expect(result.slug).toBe("intro");
    expect(result.doc?.title).toBe("Intro");
  });

  test("deleteDoc supports doc_id reference", async () => {
    const service = new YuqueToolService(
      createApiMock({
        deleteDoc: vi.fn().mockResolvedValue({
          id: 11,
          slug: "intro",
          title: "Intro",
        }),
      }),
      { allowDelete: true, deleteNamespaceAllowlist: [] },
    );

    const result = await service.deleteDoc({
      namespace: "team/repo",
      doc_id: "11",
      confirm: true,
      confirm_text: "DELETE DOC team/repo/11",
    });

    expect(result.docRef).toBe("11");
    expect(result.docId).toBe("11");
  });

  test("deleteRepo returns stable deletion payload", async () => {
    const service = new YuqueToolService(
      createApiMock({
        deleteRepo: vi.fn().mockResolvedValue({
          id: 12,
          slug: "kb",
          namespace: "team/kb",
          name: "KB",
        }),
      }),
      { allowDelete: true, deleteNamespaceAllowlist: [] },
    );

    const result = await service.deleteRepo({
      namespace: "team/kb",
      confirm: true,
      confirm_text: "DELETE REPO team/kb",
    });

    expect(result.deleted).toBe(true);
    expect(result.namespace).toBe("team/kb");
    expect(result.repo?.name).toBe("KB");
  });

  test("deleteGroup returns stable deletion payload", async () => {
    const service = new YuqueToolService(
      createApiMock({
        deleteGroup: vi.fn().mockResolvedValue({
          id: 13,
          login: "sandbox-team",
          name: "Sandbox Team",
        }),
      }),
      {
        allowDelete: true,
        deleteNamespaceAllowlist: ["sandbox-team"],
      },
    );

    const result = await service.deleteGroup({
      login: "sandbox-team",
      confirm: true,
      confirm_text: "DELETE GROUP sandbox-team",
    });

    expect(result.deleted).toBe(true);
    expect(result.login).toBe("sandbox-team");
    expect(result.group?.name).toBe("Sandbox Team");
  });

  test("deleteDoc is blocked when delete policy disabled", async () => {
    const service = new YuqueToolService(createApiMock());

    await expect(
      service.deleteDoc({
        namespace: "team/repo",
        slug: "intro",
        confirm: true,
        confirm_text: "DELETE DOC team/repo/intro",
      }),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
  });

  test("deleteDoc is blocked when namespace is outside allowlist", async () => {
    const service = new YuqueToolService(
      createApiMock(),
      {
        allowDelete: true,
        deleteNamespaceAllowlist: ["team/sandbox"],
      },
    );

    await expect(
      service.deleteDoc({
        namespace: "team/repo",
        slug: "intro",
        confirm: true,
        confirm_text: "DELETE DOC team/repo/intro",
      }),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
  });

  test("deleteRepo is blocked when namespace is outside allowlist", async () => {
    const service = new YuqueToolService(createApiMock(), {
      allowDelete: true,
      deleteNamespaceAllowlist: ["team/sandbox"],
    });

    await expect(
      service.deleteRepo({
        namespace: "team/repo",
        confirm: true,
        confirm_text: "DELETE REPO team/repo",
      }),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
  });

  test("deleteGroup is blocked when login is outside allowlist", async () => {
    const service = new YuqueToolService(createApiMock(), {
      allowDelete: true,
      deleteNamespaceAllowlist: ["sandbox-team"],
    });

    await expect(
      service.deleteGroup({
        login: "prod-team",
        confirm: true,
        confirm_text: "DELETE GROUP prod-team",
      }),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
  });

  test("delete confirmation text must exactly match expected phrase", async () => {
    const service = new YuqueToolService(
      createApiMock({
        deleteDoc: vi.fn(),
      }),
      { allowDelete: true, deleteNamespaceAllowlist: [] },
    );

    await expect(
      service.deleteDoc({
        namespace: "team/repo",
        slug: "intro",
        confirm: true,
        confirm_text: "delete doc team/repo/intro",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  test("updateToc extracts toc items from response", async () => {
    const service = new YuqueToolService(
      createApiMock({
        updateToc: vi.fn().mockResolvedValue({
          toc: [
            { title: "A", slug: "a", depth: 1, url: "/a" },
            { title: "B", slug: "b", depth: 2, url: "/b" },
          ],
        }),
      }),
    );

    const result = await service.updateToc({
      namespace: "team/repo",
      action: "appendNode",
      doc_ids: "123",
    });

    expect(result.namespace).toBe("team/repo");
    expect(result.action).toBe("appendNode");
    expect(result.items).toHaveLength(2);
    expect(result.raw).toBeNull();
  });

  test("createDocFromFile reads file body and infers title", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yuque-mcp-"));
    const filePath = join(dir, "test.md");
    await writeFile(filePath, "# File Title\n\nbody", "utf8");

    try {
      const service = new YuqueToolService(
        createApiMock({
          createDoc: vi.fn().mockResolvedValue({
            id: 1,
            slug: "file-title",
            title: "File Title",
          }),
          updateToc: vi.fn().mockResolvedValue({ ok: true }),
        }),
      );

      const result = await service.createDocFromFile({
        namespace: "team/repo",
        file_path: filePath,
      });

      expect(result.source_file).toBe(filePath);
      expect(result.doc.title).toBe("File Title");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("updateDocFromFile updates document body", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yuque-mcp-"));
    const filePath = join(dir, "update.md");
    await writeFile(filePath, "# Updated\n\nnew body", "utf8");

    try {
      const updateDoc = vi.fn().mockResolvedValue({
        id: 2,
        slug: "intro",
        title: "Updated",
        body: "new body",
      });
      const service = new YuqueToolService(
        createApiMock({
          updateDoc,
        }),
      );

      const result = await service.updateDocFromFile({
        namespace: "team/repo",
        slug: "intro",
        file_path: filePath,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: "team/repo",
          doc_id_or_slug: "intro",
        }),
      );
      expect(result.source_file).toBe(filePath);
      expect(result.doc.title).toBe("Updated");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
