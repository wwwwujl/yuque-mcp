import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface ToolErrorPayload {
  code: string;
  message: string;
  statusCode?: number | null;
  details?: unknown;
}

interface ToolSuccessEnvelope<TData> {
  ok: true;
  data: TData;
  meta?: unknown;
}

interface ToolFailureEnvelope {
  ok: false;
  error: ToolErrorPayload;
  meta?: unknown;
}

type ToolEnvelope<TData> = ToolSuccessEnvelope<TData> | ToolFailureEnvelope;

interface ToolTextContent {
  type: "text";
  text: string;
}

interface ToolCallResultLike {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  isError?: boolean;
}

interface NormalizedDoc {
  id: number | null;
  slug: string | null;
  title: string | null;
}

interface TocItem {
  id: number | null;
  uuid: string | null;
  slug: string | null;
  title: string | null;
}

function pickTextContent(result: ToolCallResultLike): ToolTextContent {
  if (!Array.isArray(result.content)) {
    throw new Error("Tool result does not contain content.");
  }

  const item = result.content.find(
    (block): block is ToolTextContent => block?.type === "text" && typeof block.text === "string",
  );

  if (!item) {
    throw new Error("Tool result does not contain text content.");
  }

  return item;
}

function parseEnvelope<TData>(toolName: string, result: ToolCallResultLike): ToolEnvelope<TData> {
  const text = pickTextContent(result).text;
  let parsed: ToolEnvelope<TData>;
  try {
    parsed = JSON.parse(text) as ToolEnvelope<TData>;
  } catch {
    throw new Error(`[${toolName}] non-JSON tool payload: ${text.slice(0, 200)}`);
  }
  if (!parsed || typeof parsed !== "object" || !("ok" in parsed)) {
    throw new Error(`[${toolName}] tool envelope shape is invalid.`);
  }

  return parsed;
}

async function callToolOk<TData>(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<TData> {
  const result = (await client.callTool({
    name,
    arguments: args,
  })) as ToolCallResultLike;
  const envelope = parseEnvelope<TData>(name, result);

  if (!envelope.ok) {
    throw new Error(`[${name}] ${envelope.error.code}: ${envelope.error.message}`);
  }

  return envelope.data;
}

function envRecord(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }
  return env;
}

function resolveDocRef(doc: NormalizedDoc): { slug?: string; doc_id?: string; docRef: string } {
  if (doc.slug) {
    return {
      slug: doc.slug,
      docRef: doc.slug,
    };
  }

  if (doc.id !== null) {
    const docId = String(doc.id);
    return {
      doc_id: docId,
      docRef: docId,
    };
  }

  throw new Error("Cannot resolve document reference from doc payload.");
}

async function main() {
  const namespace = process.env.YUQUE_SMOKE_NAMESPACE?.trim();
  if (!namespace) {
    throw new Error("YUQUE_SMOKE_NAMESPACE is required.");
  }

  const writeEnabled = process.env.YUQUE_SMOKE_ENABLE_WRITE === "true";
  const runId = Date.now().toString(36);
  const slugA = `codex-smoke-${runId}-a`;
  const slugB = `codex-smoke-${runId}-b`;
  const titleA = `Codex Smoke ${runId} A`;
  const titleB = `Codex Smoke ${runId} B`;

  const client = new Client(
    {
      name: "yuque-mcp-smoke",
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/server.js"],
    cwd: process.cwd(),
    env: envRecord(),
    stderr: "pipe",
  });

  const stderrChunks: string[] = [];
  if (transport.stderr) {
    transport.stderr.on("data", (chunk) => {
      stderrChunks.push(Buffer.from(chunk).toString("utf8"));
    });
  }

  const cleanupQueue: Array<{ slug?: string; doc_id?: string; docRef: string }> = [];

  try {
    await client.connect(transport);
    console.log("[smoke] connected to local MCP server");

    const listTools = await client.listTools();
    const toolNames = new Set(listTools.tools.map((tool) => tool.name));
    const required = [
      "yuque_get_current_user",
      "yuque_list_repos",
      "yuque_get_repo",
      "yuque_get_repo_toc",
      "yuque_list_docs",
      "yuque_search_docs",
      "yuque_get_doc",
      "yuque_create_doc",
      "yuque_update_doc",
      "yuque_delete_doc",
      "yuque_create_document_with_toc",
      "yuque_update_toc",
    ];
    for (const toolName of required) {
      if (!toolNames.has(toolName)) {
        throw new Error(`Missing expected tool: ${toolName}`);
      }
    }
    console.log(`[smoke] tools ok (${required.length} required)`);

    const currentUser = await callToolOk<{ login: string | null }>(client, "yuque_get_current_user", {});
    if (!currentUser.login) {
      throw new Error("Current user login is empty.");
    }

    await callToolOk(client, "yuque_list_repos", {
      user: currentUser.login,
      type: "all",
      offset: 0,
      include_membered: false,
    });
    await callToolOk(client, "yuque_get_repo", {
      namespace,
    });
    await callToolOk(client, "yuque_get_repository_overview", {
      namespace,
    });
    await callToolOk(client, "yuque_list_docs", {
      namespace,
      offset: 0,
      limit: 20,
    });
    await callToolOk(client, "yuque_search_docs", {
      namespace,
      query: "smoke",
      limit: 5,
    });
    console.log("[smoke] read suite ok");

    if (!writeEnabled) {
      console.log("[smoke] write suite skipped (set YUQUE_SMOKE_ENABLE_WRITE=true to run)");
      return;
    }

    const createdA = await callToolOk<NormalizedDoc>(client, "yuque_create_doc", {
      namespace,
      title: titleA,
      body: `# ${titleA}\n\ncreated by smoke test`,
      slug: slugA,
      public: 0,
      format: "markdown",
    });
    const refA = resolveDocRef(createdA);
    cleanupQueue.push(refA);

    await callToolOk(client, "yuque_get_doc", {
      namespace,
      slug: refA.slug,
      doc_id: refA.doc_id,
      raw: 1,
    });

    await callToolOk(client, "yuque_update_doc", {
      namespace,
      slug: refA.slug,
      doc_id: refA.doc_id,
      body: `# ${titleA}\n\nupdated by smoke test`,
      format: "markdown",
    });

    const createdB = await callToolOk<{ doc: NormalizedDoc }>(client, "yuque_create_document_with_toc", {
      namespace,
      title: titleB,
      body: `# ${titleB}\n\ncreated via create_document_with_toc`,
      slug: slugB,
      public: 0,
      format: "markdown",
    });
    const refB = resolveDocRef(createdB.doc);
    cleanupQueue.push(refB);

    const toc = await callToolOk<TocItem[]>(client, "yuque_get_repo_toc", {
      namespace,
    });
    const targetNode = toc.find(
      (item) =>
        (refB.slug && item.slug === refB.slug) ||
        (refB.doc_id && item.id !== null && String(item.id) === refB.doc_id),
    );
    if (targetNode?.uuid) {
      await callToolOk(client, "yuque_update_toc", {
        namespace,
        action: "editNode",
        node_uuid: targetNode.uuid,
        title: targetNode.title ?? titleB,
      });
    }

    for (const docRef of cleanupQueue.reverse()) {
      await callToolOk(client, "yuque_delete_doc", {
        namespace,
        slug: docRef.slug,
        doc_id: docRef.doc_id,
        confirm: true,
        confirm_text: `DELETE DOC ${namespace}/${docRef.docRef}`,
      });
    }

    console.log("[smoke] write suite ok (create/update/toc/delete with cleanup)");
  } finally {
    await transport.close().catch(() => undefined);
    if (stderrChunks.length > 0) {
      console.error("[smoke] server stderr captured (truncated):");
      console.error(stderrChunks.join("").slice(0, 1000));
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown smoke failure.";
  console.error(`[smoke] failed: ${message}`);
  process.exit(1);
});
