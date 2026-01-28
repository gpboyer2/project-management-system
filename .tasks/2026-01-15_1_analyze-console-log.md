# 背景
文件名：2026-01-15_1_analyze-console-log
创建于：2026-01-15_1
创建者：Claude
主分支：main
任务分支：task/analyze-console-log_2026-01-15_1
Yolo模式：Off

# 任务描述
分析前端 console 的报错，解决 WebSocket 连接错误。

# 项目概览
日志显示大量的 WebSocket 连接超时和失败，尝试连接 `ws://localhost:9300`。
后端 WebSocket 服务实际运行在 `9210` 端口。
前端开发服务器（Vite）运行在 `9300` 端口，且没有配置 WebSocket 代理。

⚠️ 警告：永远不要修改此部分 ⚠️
1. 声明模式 [MODE: RESEARCH]
2. 系统思维与辩证思维
3. 严格遵循 RIPER-5 协议步骤
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析
[代码调查结果]
- 日志显示 `ws://localhost:9300` 连接失败。
- `FrontendLogger` (client/src/utils/frontend-logger.ts) 默认使用 window.location.host (localhost:9300) 作为 WebSocket 地址。
- `vite.config.ts` 只有 `/api` 代理到 `9200`，没有 WebSocket 代理。
- `server/etc/config.js` 显示 WebSocket 端口为 `9210`。

# 提议的解决方案
[行动计划]
- 方案 A: 修改 `vite.config.ts`，添加 `/socket.io` 的代理到 `ws://localhost:9210`。
- 方案 B: 修改 `FrontendLogger`，允许通过环境变量配置 WebSocket URL。

# 当前执行步骤："3. 分析与任务相关的代码"
- 分析生产环境部署配置。

# 任务进度
[2026-01-15]
- 读取 LOG 文件，发现 WebSocket 连接错误。
- 确定端口不匹配问题 (Front: 9300, WS: 9210)。
- 检查 vite.config.ts 发现缺少 WS 代理。

# 最终审查
[完成后的总结]
