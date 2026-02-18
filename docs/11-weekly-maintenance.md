# 开源维护周清单（yuque-mcp）

这份清单用于让项目稳定迭代，不会“发布后失管”。

## 每周固定动作（建议 60-120 分钟）

1. 收敛收件箱（Issue / PR）
   - 处理新 issue：标注 `bug` / `enhancement` / `question`
   - 给每个新 issue 一个状态：`accepted`、`needs-info`、`out-of-scope`
   - 对超过 7 天未回复的 issue 做一次跟进

2. 质量和安全巡检
   - 本地跑一次：
     ```bash
     npm run check
     npm test
     npm run build
     ```
   - 检查依赖风险：
     ```bash
     npm audit --production
     ```
   - 若有高危漏洞，先发补丁版本（patch）

3. 版本与发布判断
   - 有 bug 修复：发 patch（如 `1.0.5 -> 1.0.6`）
   - 有新能力且兼容：发 minor（如 `1.0.x -> 1.1.0`）
   - 有不兼容改动：发 major
   - 发布前确认 `package.json`、`server.json`、tag 三者版本一致

4. 文档同步
   - 检查 `README.md` 与 `README.zh-CN.md` 是否和当前工具能力一致
   - 若工具契约有变更，同步更新：
     - `docs/03-tool-contract.md`
     - `docs/04-api-mapping.md`
     - `CHANGELOG.md`

5. 社区与路线图
   - 在 issue 里关闭已完成项
   - 把下周要做的 1-3 项写入 `tasks/TODO.md`

## 推荐每周节奏（示例）

- 周一：Issue/PR 分流与答复
- 周二：修复高优先级 bug
- 周三：补测试和文档
- 周四：发布与验证（npm + MCP Registry）
- 周五：整理 changelog 和下周计划

## 每月补充动作（每 4 周一次）

- 复盘过去一个月：
  - 新增 issue 数
  - 关闭 issue 数
  - 平均响应时间
- 评估是否需要新增维护者或 CODEOWNERS 调整
- 检查安全策略是否需要升级（删除保护、日志脱敏、权限边界）
