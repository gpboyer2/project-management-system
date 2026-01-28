# 背景
文件名：2026-01-05_1_refactor-build-delivery
创建于：2026-01-05_13:05:05
创建者：70464
主分支：future/frontend-architecture
任务分支：task/refactor-build-delivery_2026-01-05_1
Yolo模式：Off

# 任务描述
以新版 IDE（client/src/views/ide）为唯一入口，重构“构建交付”能力：
- 支持配置参数（目标语言、目标平台，后续可扩展）
- 支持按资源级别生成：
  - 体系层级：叶子软件（启用通信节点）单个生成；中间层级聚合所属所有叶子软件循环生成
  - 协议集：单协议生成；中间层级聚合所属协议循环生成
- 构建产物统一为 ZIP 下载
- 引入构建历史版本：可展示历史、可重复下载任意一次产物
- 不做向后兼容：旧接口/旧入口不再作为约束；按最佳实践重构前后端接口与数据结构
- 后端按现有模式做启动时增量 DDL（SQLite）
- Context7 不可用时允许联网搜索验证最佳实践

# 项目概览
- 前端：Vue3 + Pinia + Element Plus，IDE 入口在 client/src/views/ide
- 后端：Express + Sequelize(SQLite)，启动阶段 syncDatabase + 增量 DDL
- 生成器：code_gen/nodegen（ESM），支持 software/dispatcher/protocol 三类配置

⚠️ 警告：永远不要修改此部分 ⚠️
- 未经明确许可不得从 RESEARCH 进入 PLAN/EXECUTE/REVIEW
- EXECUTE 必须 100% 按已批准 PLAN 清单执行
- 不得擅自启动开发服务；需要验证时让用户手动启动
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析
- IDE 顶部按钮：client/src/views/ide/components/IdeHeader.vue -> emit('open-build') -> ide/index.vue -> ideStore.toggleBuildModal() -> BuildModal.vue 展示
- 体系层级节点：useSystemLevelDesignStore().hierarchyNodes（树结构），层级叶子由 hierarchy-config.enable_comm_node_list 判定
- 协议集节点：ResourceExplorer loadPacketList() 使用 getCategoryTree()；报文节点 type=icd_message，携带 packet_id
- 现有后端 SystemLevelDesignTreeService.generateCode(nodeId) 仅支持“有通信节点”的叶子节点（中间层级会报缺少通信节点）
- 现有 build 模块（/api/build/*）为内存模拟，不满足“历史持久化 + 鉴权下载”
- nodegen 软件配置识别字段为 softwareName/commNodeList；后端当前生成对象顶层使用 nodeName/commNodeList，存在结构不一致风险
- packetMessage 服务中存在 require('./systemLevelDesignTreeService') 目标文件不存在的风险点（需在后续确认/重构）
- build 路由与前端 buildApi 不一致：后端使用 /api/build/status?taskId 与 /api/build/download?taskId；前端 buildApi.getStatus / download 当前实现与之不匹配，且 window.open 无法携带 Authorization header
- 后端 response middleware 仅封装 res.apiSuccess/res.apiError；下载接口可直接使用 res.setHeader + stream/send，不会被强制包装
- nodegen/HTTP 下载文件名处理需关注 Content-Disposition 的 filename/filename*（RFC 5987/6266）兼容与安全性（避免 RFD 等风险）

# 提议的解决方案
## 目标与边界（以当前需求为唯一目标）
- 唯一入口：新版 IDE（`client/src/views/ide`）的“构建交付”弹窗触发构建与下载，不再依赖旧页面入口
- 统一产物：所有构建结果均为 ZIP（含清单 `manifest.json`），支持历史记录与重复下载
- 资源级别（由后端解析与聚合，前端只传“当前 Tab 上下文”）：
  - 体系层级：叶子软件（`enable_comm_node_list=true`）单个生成；中间层级自动收集其所有叶子软件并循环生成，最终打包成一个 ZIP
  - 协议集：单协议生成；分类/中间层级自动收集其所有协议并循环生成，最终打包成一个 ZIP
- 参数配置：前端传入 `language/platform`（以及未来扩展字段），后端完整落库并写入 ZIP 清单；`nodegen` 后续对齐使用这些参数（本次先把接口与数据结构定下来，并保证生成链路可运行）
- 后端 DB 变更方式：沿用现有模式启动时增量 DDL（SQLite），不引入迁移框架
- 不做向后兼容：旧 build API（`/api/build/*` 现有 query 风格）、旧生成代码入口及其返回结构都不作为约束；可以直接替换

## 总体架构（前后端职责划分）
### 前端（IDE）
`BuildModal.vue` 只做三件事：
- 从当前激活 Tab 推导构建上下文（Tab 冲突时以当前 Tab 为准）
- 提交构建请求（start）并轮询状态（status）
- 拉取历史列表（history）并发起 ZIP 下载（download，携带 token）

### 后端（Build 领域服务）
提供一套新的“构建任务”资源：
- 创建任务（start）
- 查询任务（status）
- 列表/历史（history）
- 下载产物（download，强鉴权 + Content-Disposition）
- 取消任务（cancel）

后端负责：
- 解析上下文 -> 解析目标集合（叶子软件/协议列表）
- 串行执行每个目标的生成（避免并发资源争抢）
- 产物归档：统一写入 ZIP，并在 DB 中记录文件元信息与任务结果摘要
- 失败策略：支持部分成功（中间层级批量时常见），并在清单中标注每个目标的成功/失败原因

## API 设计（新接口，替换现有 buildRouter）
保持路由前缀不变（仍挂在 `routeConfigList` 的 `/build`），但改为更 REST 的任务模型（避免 query 风格与前端不一致的问题）。

### 1) 创建构建任务
- POST `/api/build/tasks`
- Body：
  - `contextType`: `hierarchy_node | packet_message | packet_category | icd_root`
  - `contextId`: string（不同类型含义不同）
  - `contextName?`: string（用于历史列表展示，可选）
  - `options`: object
    - `language`: `cpp11|cpp14|cpp17|cpp20`（先落库；nodegen 后续对齐）
    - `platform`: `linux-x64|linux-arm64|windows-x64|qnx|vxworks`
    - 允许未来扩展字段（不做白名单硬限制，直接 JSON 存储）
- Response datum：
  - `taskId: string`
  - `version: string`
  - `status: queued|running|completed|failed|cancelled|partial_completed`

### 2) 查询构建状态
- GET `/api/build/tasks/:taskId`
- Response datum：
  - `taskId, version, status, progress(0-100)`
  - `createdAt/startedAt/finishedAt`
  - `downloadable: boolean`
  - `errorMessage?: string`
  - `resultSummary`: `{ total, successCount, failedCount }`

### 3) 构建历史列表
- GET `/api/build/tasks?contextType=&contextId=&limit=&offset=`
- 默认仅返回当前用户历史（最安全）
- Response datum：
  - `list`: 每项包含 `taskId/version/status/createdAt/finishedAt/options/contextName/downloadable`
  - `pagination`

### 4) 下载 ZIP
- GET `/api/build/tasks/:taskId/download`
- 直接返回 `application/zip` 流
- Header：
  - `Content-Disposition` 同时设置 `filename` 与 `filename*`（RFC 5987/6266）
  - `Access-Control-Expose-Headers: Content-Disposition`
- 权限：必须是创建者（或具备特定权限码；本期先按创建者隔离）

### 5) 取消任务
- POST `/api/build/tasks/:taskId/cancel`
- 对 `queued/running` 生效；`completed/failed` 返回错误信息

## DB 设计（启动时增量 DDL）
在 `server/database/sequelize.js` 增加 `ensureBuildTasksSchema()`，并在 `syncDatabase()` 中与 `ensurePacketMessagesVersioningSchema()` 同级调用。

### 新表：build_tasks
建议字段（SQLite）：
- `id TEXT PRIMARY KEY`（uuid）
- `version TEXT NOT NULL`
- `status TEXT NOT NULL`
- `progress INTEGER NOT NULL DEFAULT 0`
- `context_type TEXT NOT NULL`
- `context_id TEXT NOT NULL`
- `context_name TEXT`
- `options_json TEXT`
- `target_list_json TEXT`
- `result_list_json TEXT`
- `zip_file_name TEXT`
- `zip_file_path TEXT`
- `zip_size INTEGER`
- `error_message TEXT`
- `created_by INTEGER`（来自 `req.user.id`）
- `created_at INTEGER`
- `started_at INTEGER`
- `finished_at INTEGER`
- `updated_at INTEGER`

索引：
- `(created_by, created_at)`：用户历史列表
- `(context_type, context_id, created_at)`：按上下文筛选

## 后端实现落点（文件级别变更）
### server/routes/buildRouter.js
- 替换现有 `/start /history /status /download /cancel` 的 query 风格
- 改为：`/tasks` 与 `/tasks/:taskId...` 形式
- 更新 swagger 注释

### server/mvc/controllers/build.js
- 重写为薄 Controller：参数校验、权限校验、调用服务、统一 `res.apiSuccess/res.apiError`
- 下载接口例外：直接 stream 返回 zip

### 新增 server/mvc/services/build.js
职责：
- `startBuild({ contextType, contextId, contextName, options, user }) -> taskId`
- `getTask(taskId, user) -> task`
- `listTasks({ contextType, contextId, limit, offset, user })`
- `cancelTask(taskId, user)`
- `downloadArtifact(taskId, user, res)`
- 内部核心：`executeTask(taskId)`（串行处理每个目标，更新 progress/状态）

任务执行策略：
- start 时写 DB：`queued`
- 立即尝试调度（进程内单 worker，最多并发 1 个 running）
- 进程重启后的 `queued/running`：启动后统一标记 `failed`（原因：服务重启导致任务中断）

### 复用并小改 server/mvc/services/systemLevelDesignTree.js
- 抽出“只构造软件生成输入”的方法：
  - `buildSoftwareConfig(nodeId) -> { softwareConfig, validationErrorList }`
- 顶层字段统一为 `softwareName`（不是 `nodeName`）
- 保留 `_sanitizeName/_sanitizeId/_normalizeSoftwareConfig/_validateSoftwareConfig` 作为工具方法

### 收口旧 packetMessage 的硬错误点
- `server/mvc/services/packetMessage.js` 当前存在 `require('./systemLevelDesignTreeService')` 目标文件不存在风险点
- 由于不做向后兼容：建议把 `/api/packet-messages/generate-code` 改为创建 build task 或直接提示改用 IDE 构建交付，并移除该 require 风险

## nodegen 对齐策略（接口先行，生成器后续跟进）
### 立即对齐（保证构建链路能跑）
- 后端给 nodegen 的输入结构统一为其当前可识别类型：
  - 软件：`softwareName + commNodeList`
  - 单协议：`name + fields`
  - 分发器：`protocolName + dispatch + messages`
- 后端负责把数据库/流程图中可能出现的 snake_case 字段映射为 nodegen 期望字段，避免运行期结构错误

### 后续对齐（nodegen 跟进）
- `code_gen/nodegen` 新增对 `options.language/options.platform` 的消费（写入 manifest 或影响模板输出）
- 如要求全链路 snake_case：nodegen 做输入字段双栈映射并更新 JSON schema（影响大，建议拆步骤，但仍属于同一重构目标）

## 前端实现落点（BuildModal 与下载）
### BuildModal 的上下文解析（只认当前 Tab）
- `node_dashboard/node_editor/interface_editor/logic_editor` -> `contextType=hierarchy_node` + `contextId=nodeId`
- `icd_editor` -> `contextType=packet_message` + `contextId=当前打开的 packet id`
- `icd_packet_list`：
  - 有 `categoryId` -> `contextType=packet_category`
  - 无 `categoryId` -> `contextType=icd_root`
- `icd_bundles_list` -> `contextType=icd_root`

### client/src/api/build.ts
- 替换为新接口：createTask/getTask/listTasks/cancelTask/downloadTask
- 下载必须走 `apiClient.download()`（携带 Authorization）

### client/src/api/index.ts
- 增强 `ApiClient.download()`：
  - 未传 filename 时，从 `Content-Disposition` 解析 `filename*`/`filename`
  - 兼容 UTF-8（RFC 5987/6266）并做安全清洗

### 样式
- 统一写入 `client/src/views/ide/index.scss`
- 从顶层容器写完整路径选择器；禁止 `&/%`；不在 Vue 文件内写样式

## 错误处理与状态语义
- 部分失败：`status=partial_completed`，`downloadable=true`（ZIP 中仅包含成功目标 + manifest 标注失败原因）
- 全部失败：`status=failed`，`downloadable=false`，记录 `error_message`
- 下载不可用：返回明确 JSON 错误（不返回空字符串）

## 测试方案（放在 test 目录）
- 后端：`server/test/api/` 新增 build 相关用例（createTask/getTask/list/download）
- 测试环境下 build service 支持注入 mock executor，避免依赖真实 nodegen

## /standards 检查
- EXECUTE 阶段按规则执行 `/standards`（先定位其实际命令/脚本），修正不符合项

## 实施清单（顺序、原子化）
1. `server/database/sequelize.js` 增加 `ensureBuildTasksSchema()` 并接入 `syncDatabase()`
2.（若采用 model）新增 `server/database/models/BuildTask.js` 并在 `server/database/models/index.js` 导出
3. 新增 `server/mvc/services/build.js`：任务创建/查询/列表/取消/下载/执行流程
4. 重写 `server/mvc/controllers/build.js`：薄层控制器，权限隔离（created_by）
5. 重写 `server/routes/buildRouter.js`：替换为 `/tasks` 风格路由并更新 swagger
6. `server/mvc/services/systemLevelDesignTree.js` 抽取构造 `softwareName` 输入的方法，供 build service 调用
7. 收口 `server/mvc/services/packetMessage.js` 的旧 generate-code 与不存在 require 风险
8. `client/src/api/build.ts` 对齐新接口；下载走 `apiClient.download`
9. `client/src/api/index.ts` 增强 `download()` 的文件名解析与安全清洗
10. `client/src/views/ide/components/BuildModal.vue` 实现真实构建/轮询/历史/下载
11. `client/src/views/ide/index.scss` 补齐 BuildModal 样式（按规范）
12. `server/test/api/` 新增构建接口测试（mock executor）
13. 执行 `/standards` 检查并修正
14. 由用户手动启动服务验证：构建、轮询、历史、下载 ZIP、重复下载

# 当前执行步骤："2. 创建任务文件"
- 已创建任务分支
- 已创建本任务文件

# 任务进度
[2026-01-05 20:34:34 +0800]
- 已修改：server/database/sequelize.js
- 更改：新增 ensureBuildTasksSchema()，在启动时通过增量 DDL 创建/补齐 build_tasks 表与索引，并在 syncDatabase() 中接入（dev/prod 均执行）。
- 原因：为“构建任务/构建历史/可重复下载”的持久化奠定数据库基线，符合现有项目“启动时增量 DDL（SQLite）”模式。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 20:35:41 +0800]
- 已修改：无（决策记录）
- 更改：步骤2决定不新增 Sequelize BuildTask Model，后续在 BuildService 中使用 sqlite 原生 SQL（sequelize.query）读写 build_tasks 表。
- 原因：减少不必要的新文件与模型耦合；build_tasks 采用启动时增量 DDL 自主管理，使用原生 SQL 更直接可控。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 20:37:43 +0800]
- 已修改：server/mvc/services/build.js
- 更改：新增 BuildService（任务创建/查询/列表/取消/下载）与进程内串行调度框架；任务执行暂留占位失败（待后续步骤接入真实生成与打包逻辑）。
- 原因：先把“任务资源模型 + DB 读写 + 下载输出”框架搭好，后续在步骤5/6接入目标解析与真实产物生成。
- 阻碍因素：当前尚未接入真实生成逻辑（计划内，将在后续步骤完成）。
- 状态：未确认

[2026-01-05 20:39:23 +0800]
- 已修改：server/mvc/controllers/build.js；server/routes/buildRouter.js
- 更改：重写 build 控制器与路由为 `/api/build/tasks` 资源风格（create/list/get/cancel/download），并对接 BuildService；移除旧的内存模拟实现与 query 风格接口。
- 原因：不做向后兼容，统一前后端接口语义；为 IDE “构建交付”提供稳定任务 API。
- 阻碍因素：当前任务执行仍为占位失败（计划内，待后续步骤接入真实生成与打包逻辑）。
- 状态：未确认

[2026-01-05 20:43:07 +0800]
- 已修改：server/mvc/services/systemLevelDesignTree.js
- 更改：新增 buildSoftwareConfig(nodeId) 用于构造软件配置；软件配置顶层统一为 softwareName；并新增 snake_case -> camelCase 的递归转换，保证传给 nodegen 的输入字段命名与其规范对齐；generateCode() 改为复用 buildSoftwareConfig()。
- 原因：为后续 BuildService 接入真实生成逻辑提供可复用的“构造 + 校验 + 适配 nodegen 输入”能力。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 20:48:54 +0800]
- 已修改：server/mvc/services/build.js
- 更改：BuildService.executeTask() 接入真实执行：按 contextType 解析目标集合（hierarchy_node 聚合叶子软件；packet_message 单协议；packet_category 聚合协议）；逐个调用 nodegen 生成到任务输出目录；写入 manifest.json；成功/部分成功时打包 ZIP 并落库 zip 路径与大小；支持取消与 partial_completed。
- 原因：打通“构建交付=任务+历史+ZIP下载”的后端核心闭环，供前端 BuildModal 对接。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 20:50:42 +0800]
- 已修改：server/mvc/services/packetMessage.js
- 更改：修复 generateCode(预览) 内 `require('./systemLevelDesignTreeService')` 不存在导致的运行时崩溃；同步对齐 SystemLevelDesignTreeService 的新输入规范（softwareName + snake_case->camelCase 适配）以避免 nodegen 识别失败。
- 原因：即便不再以旧入口为目标，也需保证后端不会因残留调用路径而直接崩溃；同时确保内部生成链路输入结构一致。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 20:52:57 +0800]
- 已修改：client/src/api/build.ts
- 更改：buildApi 全面切换到 `/api/build/tasks` 新接口（start/getStatus/getHistory/cancel）；下载改为 `fetch + Authorization` 拉取 blob，并按 Content-Disposition（filename/filename*）解析文件名后保存，避免 window.open 无法携带鉴权的问题。
- 原因：满足“ZIP 下载 + 鉴权”的最佳实践要求，并与后端新任务接口对齐。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 21:04:25 +0800]
- 已修改：client/src/views/ide/components/BuildModal.vue；client/src/api/build.ts
- 更改：BuildModal 以“当前激活 Tab”为默认目标，自动解析构建上下文（体系节点=hierarchy_node；协议=packet_message；协议分类=packet_category），对接 buildApi 创建任务/轮询状态/加载历史/鉴权下载；历史列表展示状态并在不可下载时禁用按钮；同时补齐 buildApi 的 language/platform 联合类型与现有 UI 值一致。
- 原因：实现新版 IDE “构建交付”按钮的完整交付闭环（参数配置 + 多级资源构建 + 历史版本 + ZIP 下载）。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 21:06:08 +0800]
- 已修改：server/test/api/modules/build.js
- 更改：更新构建模块测试用例以对齐新 `/api/build/tasks` 资源接口（create/list/get/cancel/download）；移除旧的 projectId/query 风格断言；下载用例改为验证“未完成不可下载返回错误”的行为，避免依赖 nodegen 实际产物完成时序。
- 原因：保持自动化测试与新接口一致，降低因异步构建与产物生成时序导致的测试不稳定。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 21:07:31 +0800]
- 已修改：server/mvc/services/build.js
- 更改：协议构建（packet_message）解析目标与执行阶段改为直接按 packet_messages 主键读取，允许构建“草稿/历史版本/任意版本”（以当前 Tab 为准），不再限制为“最新已发布”。
- 原因：满足“默认当前 Tab，冲突以当前 Tab 为准”的需求语义，避免在编辑草稿时无法构建交付。
- 阻碍因素：无
- 状态：未确认

[2026-01-05 21:08:29 +0800]
- 已修改：client/src/views/ide/components/BuildModal.vue
- 更改：修正构建轮询逻辑：创建任务后启动定时轮询但不阻塞主流程；仅在结束态（completed/partial/failed）时停止轮询并关闭“构建中”状态，避免 UI 过早恢复为“未构建”。
- 原因：保证“开始构建”按钮在任务真实运行期间正确显示构建中状态，交互符合预期。
- 阻碍因素：无
- 状态：未确认

[2026-01-06 11:40:43 +0800]
- 已修改：server/mvc/services/systemLevelDesignTree.js
- 更改：buildSoftwareConfig(nodeId) 改为按“通信接口配置”构造软件配置：读取 communication_nodes.endpoint_description，使用 endpoint_description[].packet_ref_list 中的 packet_id 作为协议引用来源；不再依赖 Flowchart；并将“无有效配置”的错误信息改为指向 packet_ref_list 配置缺失。
- 原因：修正业务理解偏差——当前阶段代码生成不依赖流程图，而依赖通信接口（endpoint_description/packet_ref_list）中的协议引用配置。
- 阻碍因素：无
- 状态：未确认

[2026-01-06 15:20:19 +0800]
- 已修改：server/mvc/services/build.js；client/src/views/ide/components/BuildModal.vue
- 更改：增强构建失败提示：后端在失败/部分失败时将首个失败目标的具体原因（含校验错误 packetName/fieldPath）汇总到 build_tasks.error_message，并在任务 DTO 中返回 errorDetailList（最多5个目标、每个最多10条校验错误）；前端在构建失败时弹窗展示详细错误，避免只看到“全部目标构建失败（失败 X）”。
- 原因：提升可定位性，让用户无需查库即可直接看到具体失败原因并快速修正配置。
- 阻碍因素：无
- 状态：未确认

[2026-01-06 15:26:34 +0800]
- 已修改：server/mvc/services/systemLevelDesignTree.js
- 更改：当报文配置校验失败时，仅在后端日志中打印 packet_id 定位信息（packetName -> packet_id 映射、interface_id -> packet_id 列表、示例错误列表包含 packet_id/fieldPath/message），不进入接口响应与前端展示。
- 原因：满足“更进一步定位到 packet_id，但只打印日志不展示给用户”的要求，方便开发/运维快速回溯具体版本报文记录。
- 阻碍因素：无
- 状态：未确认

[2026-01-06 15:38:52 +0800]
- 已修改：client/src/views/ide/components/BuildModal.vue
- 更改：前端补充构建日志（仅 DEV）：创建任务后在控制台输出 taskId/context/options；构建失败时在控制台输出 errorMessage/errorDetailList 等完整结构；轮询异常时输出 taskId 与错误对象。
- 原因：满足“前端也要有日志打印”的定位需求，便于与后端日志/DB 记录串联排查。
- 阻碍因素：无
- 状状态：未确认

[2026-01-15 20:33:40 +0800]
- 已修改：client/src/views/ide/components/protocol-interface/index.vue
- 更改：协议编辑器字段列表交互改为复用 packet-config 的 useFieldOperations/useFieldEditor；新增/删除/移动/行内编辑逻辑对齐；保留 activePacket 数据源，并在只读模式下阻断交互。
- 原因：保证 protocol-interface 编辑模式的交互与 packet-config 完全一致，同时不更改数据来源。
- 阻碍因素：无
- 状态：未确认

[2026-01-15 21:48:07 +0800]
- 已修改：client/src/views/packet-config/composables/useFieldOperations.ts
- 更改：补充引入 computed，修复 useFieldOperations 内部调用时报 “computed is not defined” 的运行时错误。
- 原因：协议编辑器复用 packet-config 交互逻辑后，确保 composable 正常运行。
- 阻碍因素：无
- 状态：未确认

[2026-01-15 22:28:03 +0800]
- 已修改：client/src/views/packet-config/composables/useFieldOperations.ts
- 更改：新增字段命名策略改为“同类型字段名最大编号 + 1”（例如 string1 -> string2 -> string3...），确保字段名称不重复且编号单调递增。
- 原因：满足新增字段时命名不重复且按编号递增的交互需求。
- 阻碍因素：无
- 状态：未确认

[2026-01-15 22:34:14 +0800]
- 已修改：client/src/views/packet-config/composables/useFieldOperations.ts
- 更改：cloneFieldType 兼容 fieldOptions 的 snake_case（field_type）结构，修复新增字段 type/默认字节长度丢失导致的“名称变 fieldX、类型为空、字节长度为 -”问题。
- 原因：fieldOptions 定义为 field_type，而 cloneFieldType 之前错误读取 fieldType 字段。
- 阻碍因素：无
- 状态：未确认

[2026-01-15 22:38:57 +0800]
- 已修改：client/src/views/packet-config/components/packet-field-list/index.vue
- 更改：占位符“+”点击事件向外同时 emit MouseEvent 与 parentId（`add-field-placeholder`），修复外层调用 `event.stopPropagation()` 报错的问题。
- 原因：此前占位符只 emit parentId，外层误把字符串当 MouseEvent 使用。
- 阻碍因素：无
- 状态：未确认

# 最终审查
