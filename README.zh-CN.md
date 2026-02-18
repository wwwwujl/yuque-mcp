# yuque-mcp（中文说明）

English README: [README.md](./README.md)

## 项目目标

构建一个生产可用的语雀 MCP 服务，让 Codex 可以：
- 浏览用户、分组、知识库、文档
- 读取文档内容（支持 raw）
- 执行文档/知识库/分组的安全写操作
- 管理分组成员（查询/新增或更新/移除）
- 更新知识库目录（TOC）
- 通过组合工具提升常见操作效率

## 已实现能力

- 读工具：用户、分组、知识库、文档、目录、分页检索
- 写工具：分组 CRUD、知识库 CRUD、文档 CRUD、TOC 更新
- 分组成员工具：`yuque_list_group_users`、`yuque_add_group_user`、`yuque_remove_group_user`
- 组合工具：
  - `yuque_get_my_repositories`
  - `yuque_get_repository_overview`
  - `yuque_search_and_read`
  - `yuque_create_document_with_toc`
- 文件工具：
  - `yuque_create_doc_from_file`
  - `yuque_update_doc_from_file`

## 本地运行

```bash
npm install
npm run check
npm test
npm run build
```

开发模式：

```bash
npm run dev
```

生产启动：

```bash
npm run start
```

## 环境变量

- `YUQUE_TOKEN`（必填）
- `YUQUE_ENDPOINT`（可选，默认 `https://www.yuque.com/api/v2/`）
- `YUQUE_TIMEOUT_MS`（可选，默认 `10000`）
- `YUQUE_MAX_RETRIES`（可选，默认 `2`，仅读请求重试）
- `YUQUE_ALLOW_WRITE`（可选，默认 `false`）
- `YUQUE_WRITE_NAMESPACE_ALLOWLIST`（可选，repo/doc/toc 写入白名单）
- `YUQUE_WRITE_GROUP_ALLOWLIST`（可选，分组写入白名单）
- `YUQUE_ALLOW_DELETE`（可选，默认 `false`）
- `YUQUE_DELETE_NAMESPACE_ALLOWLIST`（可选，删除白名单）
- `YUQUE_FILE_ROOT`（可选，默认当前工作目录）
- `YUQUE_FILE_MAX_BYTES`（可选，默认 `1048576`）
- `YUQUE_FILE_ALLOWED_EXTENSIONS`（可选，默认 `.md,.markdown,.txt`）

## 写入安全策略

- 所有写工具默认关闭：`YUQUE_ALLOW_WRITE=false`
- 需要开启写入：`YUQUE_ALLOW_WRITE=true`
- 建议配置白名单：
  - `YUQUE_WRITE_NAMESPACE_ALLOWLIST=your/test-namespace`
  - `YUQUE_WRITE_GROUP_ALLOWLIST=your-test-group-login`

## 删除安全策略

- 删除默认关闭：`YUQUE_ALLOW_DELETE=false`
- 删除需要同时满足：
  - `YUQUE_ALLOW_WRITE=true`
  - `confirm: true`
  - `confirm_text` 精确匹配
- 确认文本格式：
  - 文档：`DELETE DOC <namespace>/<docRef>`
  - 知识库：`DELETE REPO <namespace>`
  - 分组：`DELETE GROUP <login>`

## 冒烟测试

只读：

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace npm run smoke
```

写入（含自动清理）：

```bash
YUQUE_SMOKE_NAMESPACE=your/test-namespace \
YUQUE_SMOKE_ENABLE_WRITE=true \
YUQUE_ALLOW_WRITE=true \
YUQUE_ALLOW_DELETE=true \
YUQUE_DELETE_NAMESPACE_ALLOWLIST=your/test-namespace \
npm run smoke
```

## 发布相关

- 官方 Registry 元数据：`server.json`
- 自动发布工作流：`.github/workflows/publish-mcp.yml`
- 中文发布说明：`docs/09-release-notes-zh.md`
- 官方发布操作指南：`docs/10-registry-publish.md`

## 开源协作与维护

- 贡献指南：`CONTRIBUTING.md`
- 安全策略：`SECURITY.md`
- 每周维护清单：`docs/11-weekly-maintenance.md`
- 投诉与下架流程：`docs/12-complaint-and-takedown.md`
- 免责声明：`DISCLAIMER.md`
