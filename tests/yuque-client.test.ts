import { describe, expect, test, vi } from "vitest";

import { YuqueMcpError } from "../src/errors.js";
import { YuqueClient, yuquePaths, type YuqueFetch } from "../src/yuque-client.js";

function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("yuquePaths", () => {
  test("builds read and write endpoints", () => {
    expect(yuquePaths.getCurrentUser()).toBe("user");
    expect(yuquePaths.listGroups("alice")).toBe("users/alice/groups");
    expect(yuquePaths.getGroup("team")).toBe("groups/team");
    expect(yuquePaths.createGroup()).toBe("groups");
    expect(yuquePaths.updateGroup("team")).toBe("groups/team");
    expect(yuquePaths.deleteGroup("team")).toBe("groups/team");
    expect(yuquePaths.listGroupUsers("team")).toBe("groups/team/users");
    expect(yuquePaths.addGroupUser("team", "alice")).toBe("groups/team/users/alice");
    expect(yuquePaths.removeGroupUser("team", "alice")).toBe("groups/team/users/alice");
    expect(yuquePaths.listRepos({ group: "design" })).toBe("groups/design/repos");
    expect(yuquePaths.createRepo({ user: "alice" })).toBe("users/alice/repos");
    expect(yuquePaths.updateRepo("alice/repo")).toBe("repos/alice%2Frepo");
    expect(yuquePaths.deleteRepo("alice/repo")).toBe("repos/alice%2Frepo");
    expect(yuquePaths.getDoc("team/repo", "intro")).toBe("repos/team%2Frepo/docs/intro");
    expect(yuquePaths.createDoc("team/repo")).toBe("repos/team%2Frepo/docs");
    expect(yuquePaths.updateDoc("team/repo", "intro")).toBe("repos/team%2Frepo/docs/intro");
    expect(yuquePaths.deleteDoc("team/repo", "intro")).toBe("repos/team%2Frepo/docs/intro");
    expect(yuquePaths.updateToc("team/repo")).toBe("repos/team%2Frepo/toc");
  });
});

describe("YuqueClient request mapping", () => {
  test("maps list repos query and auth header", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: [],
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.listRepos({
      user: "alice",
      type: "Book",
      offset: 10,
      include_membered: true,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://www.yuque.com/api/v2/users/alice/repos?type=Book&offset=10&include_membered=true",
    );
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>)["X-Auth-Token"]).toBe("test-token");
  });

  test("omits type query when type is all", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: [],
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.listRepos({
      user: "alice",
      type: "all",
      offset: 0,
      include_membered: false,
    });

    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/users/alice/repos?offset=0&include_membered=false");
  });

  test("sends POST body for create doc", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: { id: 1, slug: "hello" },
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.createDoc({
      namespace: "team/repo",
      title: "Hello",
      body: "World",
      format: "markdown",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Frepo/docs");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("\"title\":\"Hello\"");
    expect(String(init?.body)).toContain("\"body\":\"World\"");
  });

  test("maps list docs pagination query", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: [],
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.listDocs({
      namespace: "team/repo",
      offset: 10,
      limit: 25,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Frepo/docs?offset=10&limit=25");
    expect(init?.method).toBe("GET");
  });

  test("sends PUT body for update toc", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: [],
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.updateToc({
      namespace: "team/repo",
      action: "appendNode",
      doc_ids: "123",
      action_mode: "child",
      url: "https://example.com",
      open_window: 1,
      visible: 1,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Frepo/toc");
    expect(init?.method).toBe("PUT");
    expect(String(init?.body)).toContain("\"action\":\"appendNode\"");
    expect(String(init?.body)).toContain("\"doc_ids\":\"123\"");
    expect(String(init?.body)).toContain("\"url\":\"https://example.com\"");
    expect(String(init?.body)).toContain("\"open_window\":1");
    expect(String(init?.body)).toContain("\"visible\":1");
  });

  test("sends POST body for create group", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: { id: 1, login: "team" },
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.createGroup({
      name: "Team",
      login: "team",
      description: "desc",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/groups");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("\"name\":\"Team\"");
    expect(String(init?.body)).toContain("\"login\":\"team\"");
  });

  test("sends PUT body for update group", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: { id: 1, login: "new-team" },
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.updateGroup({
      login: "team",
      name: "New Team",
      new_login: "new-team",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/groups/team");
    expect(init?.method).toBe("PUT");
    expect(String(init?.body)).toContain("\"name\":\"New Team\"");
    expect(String(init?.body)).toContain("\"login\":\"new-team\"");
  });

  test("sends DELETE request for delete group", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: null,
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.deleteGroup({
      login: "team",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/groups/team");
    expect(init?.method).toBe("DELETE");
  });

  test("maps group user membership endpoints", async () => {
    const fetchMock = vi
      .fn<YuqueFetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { login: "alice", role: 1 },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: null,
        }),
      );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.listGroupUsers({
      login: "team",
    });
    await client.addGroupUser({
      group: "team",
      user: "alice",
      role: 1,
    });
    await client.removeGroupUser({
      group: "team",
      user: "alice",
    });

    const [listUrl, listInit] = fetchMock.mock.calls[0] ?? [];
    const [addUrl, addInit] = fetchMock.mock.calls[1] ?? [];
    const [removeUrl, removeInit] = fetchMock.mock.calls[2] ?? [];

    expect(String(listUrl)).toBe("https://www.yuque.com/api/v2/groups/team/users");
    expect(listInit?.method).toBe("GET");
    expect(String(addUrl)).toBe("https://www.yuque.com/api/v2/groups/team/users/alice");
    expect(addInit?.method).toBe("PUT");
    expect(String(addInit?.body)).toContain("\"role\":1");
    expect(String(removeUrl)).toBe("https://www.yuque.com/api/v2/groups/team/users/alice");
    expect(removeInit?.method).toBe("DELETE");
  });

  test("sends POST body for create repo", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: { id: 1, namespace: "team/kb" },
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.createRepo({
      user: "team",
      name: "KB",
      slug: "kb",
      type: "Book",
      public: 0,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/users/team/repos");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("\"name\":\"KB\"");
    expect(String(init?.body)).toContain("\"slug\":\"kb\"");
    expect(String(init?.body)).toContain("\"type\":\"Book\"");
  });

  test("sends PUT body for update repo", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: { id: 1, namespace: "team/kb" },
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.updateRepo({
      namespace: "team/kb",
      description: "updated",
      public: 1,
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Fkb");
    expect(init?.method).toBe("PUT");
    expect(String(init?.body)).toContain("\"description\":\"updated\"");
    expect(String(init?.body)).toContain("\"public\":1");
  });

  test("sends DELETE request for delete repo", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: null,
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.deleteRepo({
      namespace: "team/kb",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Fkb");
    expect(init?.method).toBe("DELETE");
  });

  test("sends DELETE request for delete doc", async () => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(200, {
        data: null,
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await client.deleteDoc({
      namespace: "team/repo",
      doc_id_or_slug: "intro",
    });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://www.yuque.com/api/v2/repos/team%2Frepo/docs/intro");
    expect(init?.method).toBe("DELETE");
  });
});

describe("YuqueClient error mapping and retry", () => {
  test.each([
    [401, "AUTH_ERROR"],
    [403, "PERMISSION_DENIED"],
    [404, "NOT_FOUND"],
    [429, "RATE_LIMITED"],
    [500, "UPSTREAM_ERROR"],
  ] as const)("maps status %s to %s", async (status, code) => {
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(status, {
        message: "upstream",
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 0,
      },
      { fetchImpl: fetchMock },
    );

    await expect(client.getCurrentUser()).rejects.toMatchObject({
      code,
      statusCode: status,
    } satisfies Partial<YuqueMcpError>);
  });

  test("retries GET for transient 500", async () => {
    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn<YuqueFetch>()
      .mockResolvedValueOnce(
        jsonResponse(500, {
          message: "temporary",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { id: 1 },
        }),
      );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 2,
      },
      { fetchImpl: fetchMock, sleep: sleepMock },
    );

    const result = await client.getCurrentUser();
    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  test("does not retry non-idempotent write request", async () => {
    const sleepMock = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn<YuqueFetch>().mockResolvedValue(
      jsonResponse(500, {
        message: "temporary",
      }),
    );

    const client = new YuqueClient(
      {
        yuqueToken: "test-token",
        yuqueEndpoint: "https://www.yuque.com/api/v2/",
        timeoutMs: 5000,
        maxRetries: 2,
      },
      { fetchImpl: fetchMock, sleep: sleepMock },
    );

    await expect(
      client.createDoc({
        namespace: "team/repo",
        title: "x",
        body: "y",
      }),
    ).rejects.toBeInstanceOf(YuqueMcpError);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledTimes(0);
  });
});
