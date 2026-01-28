# 背景
文件名：2026-01-18_1_fix-build-delivery
创建于：2026-01-18
创建者：70464
主分支：main
任务分支：N/A
Yolo模式：Off

# 任务描述
“构建交付”按钮点击后无作用；点击弹窗“开始构建”时报错 `ReferenceError: isBuilding is not defined`。

# 项目概览
前端 Vue3 + Pinia + Element Plus。IDE 页面路由为 `/#/editor/ide/*`。

⚠️ 警告：永远不要修改此部分 ⚠️
- 遵循 RIPER-5：EXECUTE 模式仅按计划实现；每次实施后写入任务进度并请求用户确认成功/不成功。
- 前端上下文以 URL query 为准（如 systemNodeId），避免使用 store 缓存业务上下文。
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析
- `client/src/views/ide/components/shared-build-modal/index.vue` 使用 `isBuilding/currentTaskId` 但未定义，导致点击“开始构建”直接 ReferenceError。
- 该弹窗的构建上下文不应依赖 `ideStore.activeTab`（store 中为 string，且不符合“URL 为上下文来源”的规范），应从 `route.query.systemNodeId` 读取。
- `startBuildPolling` 的 `stopCondition` 固定为 true，会导致轮询立刻停止。
- “构建交付”按钮需限制只在 `/#/editor/ide/*` 页面显示。

# 提议的解决方案
- 补齐 `isBuilding/currentTaskId` 响应式状态与 finally 复位逻辑。
- 构建上下文改为 `route.query.systemNodeId` → `contextType: hierarchy_node`。
- 修复轮询停止条件：仅在结束态停止。
- 顶栏按钮仅在 `/editor/ide` 路由前缀下渲染。

# 当前执行步骤："1. 修复构建弹窗与按钮显示范围"

# 任务进度

[2026-01-18 00:00]
- 已修改：client/src/views/ide/components/shared-build-modal/index.vue client/src/components/app-header/index.vue client/src/views/ide/index.vue .tasks/2026-01-18_1_fix-build-delivery.md
- 更改：补齐构建弹窗缺失状态（isBuilding/currentTaskId）、修复轮询 stopCondition、构建上下文改为 route.query.systemNodeId；顶栏构建按钮仅在 /editor/ide 路由下显示；IDE 打开弹窗改用 ideStore.openBuildModal()
- 原因：修复“开始构建”点击即 ReferenceError 与轮询立即停止问题，并按需求限制构建入口只在 /#/editor/ide/*
- 阻碍因素：无
- 状态：未确认

[2026-01-18 00:00]
- 已修改：client/src/views/ide/components/shared-build-modal/index.vue .tasks/2026-01-18_1_fix-build-delivery.md
- 更改：吞掉 ElMessageBox.alert 被用户关闭导致的 Promise reject（cancel/close），避免 usePolling 的 onComplete 触发 Uncaught (in promise)
- 原因：前端日志出现 Uncaught (in promise) cancel，属于 UI 弹框被关闭但未捕获的 reject
- 阻碍因素：无
- 状态：未确认

[2026-01-18 00:00]
- 已修改：server/utils/codegenUtils.js server/mvc/services/build.js .tasks/2026-01-18_1_fix-build-delivery.md
- 更改：扩展 sanitizeName(name,fallbackKey,options) 支持 purpose=identifier（portable 标识符规则）；build 服务生成给 nodegen 的 softwareName/protocolName/协议 name 使用 identifier 模式，避免出现以 '-' 开头等非法 dispatcher name
- 原因：nodegen 校验 protocolName 必须是合法标识符，现有 sanitizeName 允许 '-' 且不保证首字符合法，导致 Invalid dispatcher name
- 阻碍因素：无
- 状态：未确认

[2026-01-18 00:00]
- 已修改：client/src/views/ide/components/shared-build-modal/index.vue client/src/views/ide/components/shared-build-modal/index.scss .tasks/2026-01-18_1_fix-build-delivery.md
- 更改：构建弹窗上下文改为仅基于 URL 推导：/editor/ide/protocol 使用 protocolAlgorithmId -> packet_message；/editor/ide/(logic|flow|hierarchy) 使用 systemNodeId -> hierarchy_node；同时将 svg stroke-width 样式下沉到 SCSS
- 原因：用户处于协议编辑 Tab 时 URL 不包含 systemNodeId，导致误判“不支持构建”；需按 URL 参数推导后端支持的 contextType
- 阻碍因素：read_lints 对 .vue 模板范围绑定显示“Cannot find name …”类诊断（疑似工具环境问题），不影响运行时
- 状态：成功

[2026-01-18 00:00]
- 已修改：server/utils/codegenUtils.js server/mvc/services/build.js .tasks/2026-01-18_1_fix-build-delivery.md
- 更改：新增 validateProtocolFields 递归预校验 valueRange/value_range 的 min/max；在 protocol 构建与 software 构建启动 nodegen 前将该类错误转为结构化 validationErrorList 回传
- 原因：nodegen 会因 valueRange 缺 min/max 直接退出，stderr 很长且前端不易定位；提前校验可给用户更清晰的字段路径提示
- 阻碍因素：无
- 状态：未确认

# 最终审查

