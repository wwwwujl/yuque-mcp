import { describe, expect, test } from "vitest";

import {
  AddGroupUserInputSchema,
  CreateDocFromFileInputSchema,
  CreateGroupInputSchema,
  CreateRepoInputSchema,
  CreateDocInputSchema,
  CreateDocWithTocInputSchema,
  DeleteGroupInputSchema,
  DeleteRepoInputSchema,
  DeleteDocInputSchema,
  GetDocInputSchema,
  GetGroupInputSchema,
  ListGroupUsersInputSchema,
  ListDocsInputSchema,
  ListReposInputSchema,
  RemoveGroupUserInputSchema,
  SearchAndReadInputSchema,
  SearchDocsInputSchema,
  UpdateDocFromFileInputSchema,
  UpdateGroupInputSchema,
  UpdateRepoInputSchema,
  UpdateTocInputSchema,
  UpdateDocInputSchema,
} from "../src/schemas.js";

describe("ListReposInputSchema", () => {
  test("requires exactly one of user or group", () => {
    expect(ListReposInputSchema.safeParse({ type: "all", offset: 0, include_membered: false }).success).toBe(
      false,
    );

    expect(
      ListReposInputSchema.safeParse({
        user: "alice",
        group: "team",
        type: "all",
        offset: 0,
        include_membered: false,
      }).success,
    ).toBe(false);
  });

  test("accepts user-only input", () => {
    const parsed = ListReposInputSchema.parse({
      user: "alice",
      type: "Book",
    });

    expect(parsed.user).toBe("alice");
    expect(parsed.group).toBeUndefined();
    expect(parsed.offset).toBe(0);
    expect(parsed.include_membered).toBe(false);
  });
});

describe("GetDocInputSchema", () => {
  test("defaults raw to 1", () => {
    const parsed = GetDocInputSchema.parse({
      namespace: "team/repo",
      slug: "intro",
    });

    expect(parsed.raw).toBe(1);
  });

  test("requires exactly one of slug or doc_id", () => {
    expect(
      GetDocInputSchema.safeParse({
        namespace: "team/repo",
      }).success,
    ).toBe(false);

    expect(
      GetDocInputSchema.safeParse({
        namespace: "team/repo",
        slug: "intro",
        doc_id: "123",
      }).success,
    ).toBe(false);
  });
});

describe("SearchDocsInputSchema", () => {
  test("enforces limit upper bound", () => {
    expect(
      SearchDocsInputSchema.safeParse({
        namespace: "team/repo",
        query: "api",
        limit: 101,
      }).success,
    ).toBe(false);
  });
});

describe("CreateDocInputSchema", () => {
  test("requires title and body", () => {
    expect(
      CreateDocInputSchema.safeParse({
        namespace: "team/repo",
        title: "hello",
      }).success,
    ).toBe(false);
  });

  test("accepts html format and public=2", () => {
    const parsed = CreateDocInputSchema.parse({
      namespace: "team/repo",
      title: "hello",
      body: "<p>world</p>",
      format: "html",
      public: 2,
    });

    expect(parsed.format).toBe("html");
    expect(parsed.public).toBe(2);
  });
});

describe("CreateDocWithTocInputSchema", () => {
  test("accepts parent_uuid", () => {
    const parsed = CreateDocWithTocInputSchema.parse({
      namespace: "team/repo",
      title: "hello",
      body: "# world",
      parent_uuid: "uuid-1",
    });

    expect(parsed.parent_uuid).toBe("uuid-1");
  });
});

describe("UpdateDocInputSchema", () => {
  test("requires at least one update field", () => {
    expect(
      UpdateDocInputSchema.safeParse({
        namespace: "team/repo",
        slug: "hello",
      }).success,
    ).toBe(false);
  });

  test("accepts partial update", () => {
    const parsed = UpdateDocInputSchema.parse({
      namespace: "team/repo",
      doc_id: "123",
      body: "new body",
    });

    expect(parsed.body).toBe("new body");
  });

  test("requires exactly one of slug or doc_id", () => {
    expect(
      UpdateDocInputSchema.safeParse({
        namespace: "team/repo",
        slug: "intro",
        doc_id: "1",
        body: "x",
      }).success,
    ).toBe(false);
  });
});

describe("DeleteDocInputSchema", () => {
  test("requires namespace, slug, and delete confirmation fields", () => {
    expect(
      DeleteDocInputSchema.safeParse({
        namespace: "team/repo",
        slug: "intro",
      }).success,
    ).toBe(false);
  });

  test("accepts doc_id path", () => {
    const parsed = DeleteDocInputSchema.parse({
      namespace: "team/repo",
      doc_id: "123",
      confirm: true,
      confirm_text: "DELETE DOC team/repo/123",
    });

    expect(parsed.doc_id).toBe("123");
  });

  test("requires confirm=true", () => {
    expect(
      DeleteDocInputSchema.safeParse({
        namespace: "team/repo",
        slug: "intro",
        confirm: false,
        confirm_text: "DELETE DOC team/repo/intro",
      }).success,
    ).toBe(false);
  });
});

describe("Group schemas", () => {
  test("GetGroupInputSchema requires login", () => {
    expect(GetGroupInputSchema.safeParse({}).success).toBe(false);
  });

  test("CreateGroupInputSchema requires name/login", () => {
    expect(CreateGroupInputSchema.safeParse({ name: "Team" }).success).toBe(false);
  });

  test("UpdateGroupInputSchema requires at least one change field", () => {
    expect(
      UpdateGroupInputSchema.safeParse({
        login: "team",
      }).success,
    ).toBe(false);
  });

  test("DeleteGroupInputSchema requires confirmation fields", () => {
    expect(
      DeleteGroupInputSchema.safeParse({
        login: "team",
        confirm: true,
      }).success,
    ).toBe(false);
  });

  test("DeleteGroupInputSchema requires confirm=true", () => {
    expect(
      DeleteGroupInputSchema.safeParse({
        login: "team",
        confirm: false,
        confirm_text: "DELETE GROUP team",
      }).success,
    ).toBe(false);
  });

  test("ListGroupUsersInputSchema requires login", () => {
    expect(ListGroupUsersInputSchema.safeParse({}).success).toBe(false);
  });

  test("AddGroupUserInputSchema accepts optional role", () => {
    const parsed = AddGroupUserInputSchema.parse({
      group: "team",
      user: "alice",
      role: 1,
    });

    expect(parsed.group).toBe("team");
    expect(parsed.role).toBe(1);
  });

  test("RemoveGroupUserInputSchema requires group and user", () => {
    expect(RemoveGroupUserInputSchema.safeParse({ group: "team" }).success).toBe(false);
  });
});

describe("Repo write schemas", () => {
  test("CreateRepoInputSchema requires exactly one user/group", () => {
    expect(
      CreateRepoInputSchema.safeParse({
        name: "My Repo",
        slug: "my-repo",
        type: "Book",
      }).success,
    ).toBe(false);

    expect(
      CreateRepoInputSchema.safeParse({
        user: "alice",
        group: "team",
        name: "My Repo",
        slug: "my-repo",
      }).success,
    ).toBe(false);
  });

  test("UpdateRepoInputSchema requires at least one change field", () => {
    expect(
      UpdateRepoInputSchema.safeParse({
        namespace: "alice/my-repo",
      }).success,
    ).toBe(false);
  });

  test("DeleteRepoInputSchema requires confirmation fields", () => {
    expect(
      DeleteRepoInputSchema.safeParse({
        namespace: "alice/my-repo",
      }).success,
    ).toBe(false);
  });

  test("DeleteRepoInputSchema requires confirm=true", () => {
    expect(
      DeleteRepoInputSchema.safeParse({
        namespace: "alice/my-repo",
        confirm: false,
        confirm_text: "DELETE REPO alice/my-repo",
      }).success,
    ).toBe(false);
  });
});

describe("UpdateTocInputSchema", () => {
  test("requires at least one toc target field", () => {
    expect(
      UpdateTocInputSchema.safeParse({
        namespace: "team/repo",
        action: "appendNode",
      }).success,
    ).toBe(false);
  });

  test("accepts append action payload", () => {
    const parsed = UpdateTocInputSchema.parse({
      namespace: "team/repo",
      action: "appendNode",
      action_mode: "child",
      doc_ids: "123",
      node_type: "DOC",
      url: "https://example.com",
      open_window: 1,
      visible: 1,
    });

    expect(parsed.action).toBe("appendNode");
    expect(parsed.doc_ids).toBe("123");
    expect(parsed.url).toBe("https://example.com");
  });
});

describe("ListDocsInputSchema", () => {
  test("applies pagination defaults", () => {
    const parsed = ListDocsInputSchema.parse({
      namespace: "team/repo",
    });

    expect(parsed.offset).toBe(0);
    expect(parsed.limit).toBe(20);
  });
});

describe("SearchAndReadInputSchema", () => {
  test("defaults read_first=true", () => {
    const parsed = SearchAndReadInputSchema.parse({
      namespace: "team/repo",
      query: "hello",
    });

    expect(parsed.read_first).toBe(true);
  });
});

describe("File doc schemas", () => {
  test("CreateDocFromFileInputSchema requires file_path", () => {
    expect(
      CreateDocFromFileInputSchema.safeParse({
        namespace: "team/repo",
      }).success,
    ).toBe(false);
  });

  test("UpdateDocFromFileInputSchema requires exactly one doc ref", () => {
    expect(
      UpdateDocFromFileInputSchema.safeParse({
        namespace: "team/repo",
        file_path: "/tmp/a.md",
      }).success,
    ).toBe(false);

    expect(
      UpdateDocFromFileInputSchema.safeParse({
        namespace: "team/repo",
        file_path: "/tmp/a.md",
        slug: "intro",
        doc_id: "1",
      }).success,
    ).toBe(false);
  });
});
