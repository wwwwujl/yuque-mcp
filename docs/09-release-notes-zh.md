# Yuque MCP 发布说明（中文）

更新时间：2026-02-17  
适用版本：`1.0.2`

## 1. 发布结论

当前 `yuque-mcp` 已具备发布条件，可用于生产场景（建议先灰度）。

## 2. 已实现能力

- 用户与分组：获取当前用户、分组查询、分组增删改。
- 知识库（Repo）：查询、增删改、目录（TOC）读取与更新。
- 文档（Doc）：查询、增删改，支持 `slug` 或 `doc_id` 双标识。
- 组合工具：`yuque_get_my_repositories`、`yuque_get_repository_overview`、`yuque_search_and_read`、`yuque_create_document_with_toc`。
- 文件工具：`yuque_create_doc_from_file`、`yuque_update_doc_from_file`。
- 搜索：`yuque_search_docs` 为客户端分页检索（按标题/slug/描述匹配）。

## 3. 发布前检查（必须执行）

```bash
npm run check
npm test
npm run build
```

建议再执行本地 MCP 冒烟：

只读冒烟：

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace npm run smoke
```

写入冒烟（包含清理）：

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace \
YUQUE_SMOKE_ENABLE_WRITE=true \
YUQUE_ALLOW_DELETE=true \
YUQUE_DELETE_NAMESPACE_ALLOWLIST=your/test-namespace \
npm run smoke
```

## 4. 生产环境安全基线

- Token 仅通过环境变量注入：`YUQUE_TOKEN`。
- 不打印 Token，不写入代码，不写入日志。
- 删除默认关闭：`YUQUE_ALLOW_DELETE=false`。
- 如必须删除，仅对白名单 namespace 开启：`YUQUE_DELETE_NAMESPACE_ALLOWLIST`。
- 所有删除工具都要求二次确认，规则如下：
1. `confirm` 必须为 `true`。
2. `confirm_text` 必须完全匹配：
3. 文档删除：`DELETE DOC <namespace>/<docRef>`。
4. 知识库删除：`DELETE REPO <namespace>`。
5. 分组删除：`DELETE GROUP <login>`。

## 5. 推荐环境变量

```bash
export YUQUE_TOKEN=***
export YUQUE_ENDPOINT=https://www.yuque.com/api/v2/
export YUQUE_TIMEOUT_MS=10000
export YUQUE_MAX_RETRIES=2
export YUQUE_ALLOW_DELETE=false
```

## 6. 已知限制

- 部分语雀账号/租户对分组写接口有限制，`POST/PUT/DELETE /groups/...` 可能返回 `404/403`（上游能力限制，不是本 MCP 代码缺失）。
- `yuque_search_docs` 不是语雀服务端全文检索，而是客户端分页扫描后匹配。

## 7. Codex MCP 接入命令

```bash
codex mcp add yuque-local -- node dist/server.js
codex mcp list
codex mcp get yuque-local
```

## 8. 发布后建议

- 先在测试知识库灰度 1-2 天，再放开生产知识库写入。
- 对删除能力保持默认关闭，仅在受控窗口短时开启。
- 定期轮换 `YUQUE_TOKEN`。
