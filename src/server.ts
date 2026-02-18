#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import {
  CreateDocFromFileInputSchema,
  CreateGroupInputSchema,
  CreateRepoInputSchema,
  CreateDocInputSchema,
  CreateDocWithTocInputSchema,
  DeleteGroupInputSchema,
  DeleteRepoInputSchema,
  DeleteDocInputSchema,
  EmptyInputSchema,
  GetDocInputSchema,
  GetGroupInputSchema,
  GetMyRepositoriesInputSchema,
  GetRepoInputSchema,
  ListDocsInputSchema,
  ListGroupsInputSchema,
  ListReposInputSchema,
  NamespaceInputSchema,
  SearchAndReadInputSchema,
  SearchDocsInputSchema,
  UpdateDocFromFileInputSchema,
  UpdateGroupInputSchema,
  UpdateRepoInputSchema,
  UpdateDocInputSchema,
  UpdateTocInputSchema,
} from "./schemas.js";
import { YuqueToolService } from "./service.js";
import { createFailureEnvelope, createSuccessEnvelope, toToolResult } from "./tool-response.js";
import { YuqueClient } from "./yuque-client.js";

function withEnvelope<TArgs, TResult>(
  toolName: string,
  handler: (args: TArgs) => Promise<TResult>,
) {
  return async (args: TArgs) => {
    try {
      const data = await handler(args);
      return toToolResult(createSuccessEnvelope(toolName, data));
    } catch (error) {
      return toToolResult(createFailureEnvelope(toolName, error), true);
    }
  };
}

export function buildServer(service: YuqueToolService): McpServer {
  const server = new McpServer({
    name: "yuque-mcp",
    version: "1.0.3",
  });

  server.registerTool(
    "yuque_get_current_user",
    {
      description: "Get current Yuque user profile.",
      inputSchema: EmptyInputSchema,
    },
    withEnvelope("yuque_get_current_user", async () => service.getCurrentUser()),
  );

  server.registerTool(
    "yuque_list_groups",
    {
      description: "List groups for current user or a provided login.",
      inputSchema: ListGroupsInputSchema,
    },
    withEnvelope("yuque_list_groups", async (args) => service.listGroups(args.login)),
  );

  server.registerTool(
    "yuque_get_group",
    {
      description: "Get a group by login or id.",
      inputSchema: GetGroupInputSchema,
    },
    withEnvelope("yuque_get_group", async (args) => service.getGroup(args)),
  );

  server.registerTool(
    "yuque_create_group",
    {
      description: "Create a new Yuque group.",
      inputSchema: CreateGroupInputSchema,
    },
    withEnvelope("yuque_create_group", async (args) => service.createGroup(args)),
  );

  server.registerTool(
    "yuque_update_group",
    {
      description: "Update an existing Yuque group.",
      inputSchema: UpdateGroupInputSchema,
    },
    withEnvelope("yuque_update_group", async (args) => service.updateGroup(args)),
  );

  server.registerTool(
    "yuque_delete_group",
    {
      description: "Delete a Yuque group (requires confirmation).",
      inputSchema: DeleteGroupInputSchema,
    },
    withEnvelope("yuque_delete_group", async (args) => service.deleteGroup(args)),
  );

  server.registerTool(
    "yuque_list_repos",
    {
      description: "List repos under a user or group.",
      inputSchema: ListReposInputSchema,
    },
    withEnvelope("yuque_list_repos", async (args) => service.listRepos(args)),
  );

  server.registerTool(
    "yuque_get_my_repositories",
    {
      description: "Get current user and repositories in one call.",
      inputSchema: GetMyRepositoriesInputSchema,
    },
    withEnvelope("yuque_get_my_repositories", async (args) => service.getMyRepositories(args)),
  );

  server.registerTool(
    "yuque_get_repo",
    {
      description: "Get a repo by namespace.",
      inputSchema: GetRepoInputSchema,
    },
    withEnvelope("yuque_get_repo", async (args) => service.getRepo(args)),
  );

  server.registerTool(
    "yuque_create_repo",
    {
      description: "Create a new Yuque repository under user or group.",
      inputSchema: CreateRepoInputSchema,
    },
    withEnvelope("yuque_create_repo", async (args) => service.createRepo(args)),
  );

  server.registerTool(
    "yuque_update_repo",
    {
      description: "Update an existing Yuque repository.",
      inputSchema: UpdateRepoInputSchema,
    },
    withEnvelope("yuque_update_repo", async (args) => service.updateRepo(args)),
  );

  server.registerTool(
    "yuque_delete_repo",
    {
      description: "Delete a Yuque repository (requires confirmation).",
      inputSchema: DeleteRepoInputSchema,
    },
    withEnvelope("yuque_delete_repo", async (args) => service.deleteRepo(args)),
  );

  server.registerTool(
    "yuque_get_repo_toc",
    {
      description: "Get repo TOC entries.",
      inputSchema: NamespaceInputSchema,
    },
    withEnvelope("yuque_get_repo_toc", async (args) => service.getRepoToc(args.namespace)),
  );

  server.registerTool(
    "yuque_get_repository_overview",
    {
      description: "Get repository details and TOC in one call.",
      inputSchema: NamespaceInputSchema,
    },
    withEnvelope("yuque_get_repository_overview", async (args) =>
      service.getRepositoryOverview({
        namespace: args.namespace,
      }),
    ),
  );

  server.registerTool(
    "yuque_list_docs",
    {
      description: "List docs under a repo namespace with pagination.",
      inputSchema: ListDocsInputSchema,
    },
    withEnvelope("yuque_list_docs", async (args) => service.listDocs(args)),
  );

  server.registerTool(
    "yuque_get_doc",
    {
      description: "Get a single doc by namespace and either slug or doc_id.",
      inputSchema: GetDocInputSchema,
    },
    withEnvelope("yuque_get_doc", async (args) => service.getDoc(args)),
  );

  server.registerTool(
    "yuque_search_docs",
    {
      description: "Client-side search over listed docs by title, slug, and description.",
      inputSchema: SearchDocsInputSchema,
    },
    withEnvelope("yuque_search_docs", async (args) => service.searchDocs(args)),
  );

  server.registerTool(
    "yuque_create_doc",
    {
      description: "Create a new Yuque doc.",
      inputSchema: CreateDocInputSchema,
    },
    withEnvelope("yuque_create_doc", async (args) => service.createDoc(args)),
  );

  server.registerTool(
    "yuque_create_document_with_toc",
    {
      description: "Create a document and attach it to TOC in one call.",
      inputSchema: CreateDocWithTocInputSchema,
    },
    withEnvelope("yuque_create_document_with_toc", async (args) => service.createDocWithToc(args)),
  );

  server.registerTool(
    "yuque_update_doc",
    {
      description: "Update an existing Yuque doc by slug or doc_id.",
      inputSchema: UpdateDocInputSchema,
    },
    withEnvelope("yuque_update_doc", async (args) => service.updateDoc(args)),
  );

  server.registerTool(
    "yuque_delete_doc",
    {
      description: "Delete a Yuque doc by namespace and slug/doc_id (requires confirmation).",
      inputSchema: DeleteDocInputSchema,
    },
    withEnvelope("yuque_delete_doc", async (args) => service.deleteDoc(args)),
  );

  server.registerTool(
    "yuque_update_toc",
    {
      description: "Update Yuque repository TOC nodes.",
      inputSchema: UpdateTocInputSchema,
    },
    withEnvelope("yuque_update_toc", async (args) => service.updateToc(args)),
  );

  server.registerTool(
    "yuque_search_and_read",
    {
      description: "Search docs and optionally read the first hit in one call.",
      inputSchema: SearchAndReadInputSchema,
    },
    withEnvelope("yuque_search_and_read", async (args) => service.searchAndRead(args)),
  );

  server.registerTool(
    "yuque_create_doc_from_file",
    {
      description: "Create document from local file content and attach to TOC.",
      inputSchema: CreateDocFromFileInputSchema,
    },
    withEnvelope("yuque_create_doc_from_file", async (args) => service.createDocFromFile(args)),
  );

  server.registerTool(
    "yuque_update_doc_from_file",
    {
      description: "Update document body from local file content.",
      inputSchema: UpdateDocFromFileInputSchema,
    },
    withEnvelope("yuque_update_doc_from_file", async (args) => service.updateDocFromFile(args)),
  );

  return server;
}

export async function startServer(): Promise<void> {
  const config = loadConfig();
  const client = new YuqueClient(config);
  const service = new YuqueToolService(client, {
    allowDelete: config.allowDelete,
    deleteNamespaceAllowlist: config.deleteNamespaceAllowlist,
  });
  const server = buildServer(service);
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isMainModule) {
  startServer().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown startup error.";
    // Keep startup logs minimal and free of secrets.
    // eslint-disable-next-line no-console
    console.error(`Yuque MCP server failed to start: ${message}`);
    process.exit(1);
  });
}
