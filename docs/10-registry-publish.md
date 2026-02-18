# MCP Registry 发布指南（本项目）

本指南用于将 `yuque-mcp` 发布到官方 MCP Registry。

## 1. 一次性准备

1. 确保 GitHub 仓库为 `https://github.com/wwwwujl/yuque-mcp`
2. 确保 `package.json` 含有：
   - `version`
   - `mcpName`（必须与 `server.json.name` 一致）
3. 确保 `server.json` 存在且字段完整
4. npm 账号可发布 `package.json.name` 对应包名
   - 当前建议包名：`@wwwwujl/yuque-mcp`

## 2. GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 中添加：

- `NPM_TOKEN`：npm 发布令牌（必须）

说明：
- 工作流使用 GitHub OIDC 登录 MCP Registry，不需要额外的 `MCP_GITHUB_TOKEN`。

## 3. 发布触发方式

工作流文件：`.github/workflows/publish-mcp.yml`  
触发条件：推送 `v*` 标签（例如 `v1.0.3`）

```bash
git tag v1.0.3
git push origin v1.0.3
```

## 4. 工作流做了什么

1. 安装依赖（`npm ci`）
2. 校验版本一致性：
   - Git tag 版本 = `package.json.version`
   - Git tag 版本 = `server.json.version`
   - `package.json.mcpName` = `server.json.name`
3. 运行 `check/test/build`
4. 发布 npm 包
5. 使用 `mcp-publisher login github-oidc` 鉴权
6. 发布 `server.json` 到 MCP Registry

## 5. 发布后验证

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.wwwwujl/yuque-mcp"
```

如果返回结果里包含该 `name`，说明发布成功。

## 6. 常见失败与处理

- npm 发布失败（包名冲突）
  - 更换 `package.json.name` 为你的可用包名
  - 同步更新 `server.json.packages[0].identifier`
- Registry 发布失败（名称校验失败）
  - 检查 `package.json.mcpName` 与 `server.json.name` 完全一致
  - `io.github.wwwwujl/*` 前缀必须与发布者身份一致
- 版本校验失败
  - 推标签前先把 `package.json` 与 `server.json` 版本改成同一值
