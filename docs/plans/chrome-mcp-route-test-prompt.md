# Chrome MCP 路由页面报错检测提示词

你拥有无限的 token 和资源，必须调用 chrome-devtools-mcp MCP 为我服务！

编码规则和约束：`CLAUDE.md`

---

## 一、任务目标

使用 chrome-devtools-mcp MCP 工具，自动化测试"灵枢 IDE"项目的所有路由页面，检测并记录以下错误类型：

1. **控制台错误** (Console Errors) - JavaScript 运行时错误、Vue 警告
2. **网络错误** (Network Errors) - API 请求失败、404、500 等
3. **页面渲染问题** (Rendering Issues) - 空白页面、组件未加载、样式缺失
4. **路由错误** (Route Errors) - 路由匹配失败、导航错误

---

## 二、项目环境

### 技术栈
- 前端框架：Vue 3 + TypeScript
- 路由：Vue Router 4.x (Hash 模式)
- 状态管理：Pinia
- 开发服务器：Vite dev server
- 默认端口：`localhost:9300` (可通过 `.env` 配置)

### 项目工作目录
`/Users/peng/Desktop/Project/alpha-coda/cssc-node-view`

### 测试环境要求
- 服务器必须处于运行状态
- 用户需要提前启动 dev 服务：`cd client && pnpm dev`
- 如果服务器未运行，提醒用户启动后再继续

---

## 三、完整路由清单

> 参考文档：`docs/tests/ROUTE_TEST_MATRIX.md` - 路由测试矩阵（包含历史测试记录）

### 3.1 根路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 1 | `#/` | Welcome | views/editor/welcome-page/index.vue | 显示欢迎标题和三个快捷入口按钮，无控制台错误 |

### 3.2 编辑器列表路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 2 | `#/editor/ide/dashboard` | Dashboard | views/editor/components/dashboard/index.vue | 显示4个统计卡片和资源管理器 |
| 3 | `#/editor/ide/node/list` | NodeList | views/editor/components/list-page/index.vue | 显示通信节点列表（通常有8条数据） |
| 4 | `#/editor/ide/interface/list` | InterfaceList | views/editor/components/list-page/index.vue | 显示通信接口列表（需从左侧选择节点） |
| 5 | `#/editor/ide/logic/list` | LogicList | views/editor/components/list-page/index.vue | 显示逻辑节点列表（需从左侧选择节点） |
| 6 | `#/editor/ide/icd/list` | IcdList | views/editor/components/list-page/index.vue | 显示ICD配置列表（通常有1条数据） |

### 3.3 动态编辑器路由（需要有效ID）

| 序号 | 路由路径 | 参数类型 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 7 | `#/editor/ide/logic` | systemNodeId | views/ide/components/logic-node-dashboard/index.vue | 显示逻辑节点详情编辑器 |
| 8 | `#/editor/ide/logic` | systemNodeId + interfaceId | views/ide/components/logic-node-interface/index.vue | 显示节点接口编辑器 |
| 9 | `#/editor/ide/protocol` | protocolAlgorithmId | views/ide/components/protocol-interface/index.vue | 显示协议报文编辑器 |

**注意**：测试时使用有效ID（如 `1`），如果数据不存在会自动重定向到列表页。

### 3.4 认证路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 12 | `#/login` | Login | views/login/index.vue | 显示完整登录表单 |

### 3.5 拓扑展示路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 13 | `#/topology-display` | TopologyDisplay | views/topology-display/index.vue | 拓扑视图正常显示，支持双击钻取 |
| 14 | `#/topology-display/detail` | TopologyDetail | views/topology-display/detail/index.vue | 显示节点详情表单，含返回按钮 |

### 3.6 用户管理路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 15 | `#/user` | User | views/user/index.vue | 显示用户管理列表 |
| 16 | `#/user/detail` | UserDetail | views/user/detail/index.vue | 显示用户详情表单，只读模式 |

### 3.7 系统设置路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 17 | `#/settings` | Settings | views/settings/index.vue | 显示系统设置页面 |
| 18 | `#/hierarchy-settings` | HierarchySettings | views/hierarchy-settings/index.vue | 显示体系层级配置 |
| 19 | `#/database-manager` | DatabaseManager | views/database-manager/index.vue | 显示数据管理页面（约12个数据表） |

### 3.8 错误处理路由

| 序号 | 路由路径 | 路由名称 | 组件路径 | 预期行为 |
|------|----------|----------|----------|----------|
| 20 | `#/404` | NotFound | views/error/404/index.vue | 显示404错误页面 |
| 21 | `#/random-invalid-path` | - | views/error/404/index.vue | 通配符路由正确匹配，显示404 |

### 3.9 路由守卫验证场景

| 序号 | 场景 | 路由路径 | 预期行为 |
|------|------|----------|----------|
| 22 | 无效编辑器类型 | `#/editor/ide/invalid/123` | 重定向到首页 |
| 23 | 缺少必要参数 | `#/editor/ide/interface/` | 重定向到仪表板 |
| 24 | 不存在的资源ID | `#/editor/ide/node/999999` | 重定向到节点列表 |

---

## 四、chrome-devtools-mcp MCP 使用指南

### 4.1 核心 MCP 工具

你必须使用以下 chrome-devtools-mcp MCP 工具：

| 工具名称 | 用途 | 调用时机 |
|----------|------|----------|
| `mcp__chrome-devtools__list_pages` | 获取当前打开的页面列表 | 测试开始时 |
| `mcp__chrome-devtools__navigate_page` | 导航到指定 URL | 每个路由测试时 |
| `mcp__chrome-devtools__take_snapshot` | 获取页面内容快照 | 验证页面渲染 |
| `mcp__chrome-devtools__take_screenshot` | 截取页面截图 | 保存测试证据 |
| `mcp__chrome-devtools__list_console_messages` | 获取控制台消息 | 检测错误和警告 |
| `mcp__chrome-devtools__list_network_requests` | 获取网络请求 | 检测 API 错误 |
| `mcp__chrome-devtools__evaluate_script` | 执行 JavaScript 代码 | 自定义检测逻辑 |

### 4.2 测试流程标准

```
开始
  │
  ├─→ 1. 检查服务器状态
  │     └─→ 尝试访问 http://localhost:9300
  │         └─→ 失败则提醒用户启动服务
  │
  ├─→ 2. 遍历所有路由
  │     │
  │     ├─→ 对每个路由：
  │     │     ├─→ navigate_page(url)
  │     │     ├─→ 等待页面稳定 (2-3秒)
  │     │     ├─→ list_console_messages() - 检查错误
  │     │     ├─→ list_network_requests() - 检查网络
  │     │     ├─→ take_snapshot() - 验证内容
  │     │     └─→ take_screenshot() - 保存截图
  │     │
  │     └─→ 记录测试结果
  │
  ├─→ 3. 汇总测试报告
  │     ├─→ 统计通过/失败路由数
  │     ├─→ 列出所有发现的错误
  │     └─→ 提供修复建议
  │
  └─→ 4. 完成
```

### 4.3 错误检测标准

#### 控制台错误检测

**必须检测的错误类型**：

1. **JavaScript 错误**
   - `Error:` 开头的消息
   - `Uncaught` 开头的消息
   - `TypeError`、`ReferenceError`、`SyntaxError` 等

2. **Vue 警告**
   - `[Vue warning]` 开头的消息
   - 组件 prop 缺失警告
   - 模板编译错误

3. **模块加载错误**
   - `Failed to fetch dynamically imported module`
   - `Failed to resolve import`
   - `ChunkLoadError`

**检测代码示例**：
```javascript
// 在控制台中执行，过滤出错误和警告
console.messages.filter(m => m.type === 'error' || m.type === 'warn')
```

#### 网络错误检测

**必须检测的网络问题**：

1. **HTTP 状态码**
   - 4xx 错误（客户端错误）
   - 5xx 错误（服务器错误）
   - `(failed) net::ERR_*

2. **API 请求问题**
   - 请求超时
   - CORS 错误
   - JSON 解析错误

**检测方法**：
```javascript
// 检查失败的请求
networkRequests.filter(r => r.status >= 400 || r.status === '(failed)')
```

#### 页面渲染检测

**必须检测的渲染问题**：

1. **空白页面**
   - body 内容为空或仅有极少量内容
   - 主要组件容器不存在

2. **加载状态卡住**
   - 页面一直显示 loading
   - 无数据内容

**检测代码示例**：
```javascript
// 检查页面主要内容区域
document.querySelector('.ide-container, .page-content, main')?.children.length > 0
```

---

## 五、测试执行步骤

### 第一步：环境检查

```
1. 调用 list_pages 确认浏览器连接
2. 尝试访问 http://localhost:9300
3. 如果失败，提醒用户：
   "请先启动开发服务器：cd client && pnpm dev"
   等待用户确认后再继续
```

### 第二步：批量路由测试

**按以下顺序测试路由（共24个测试场景）**：

```
批次1：根路由 (1个)
  → #/ (欢迎页)

批次2：编辑器列表路由 (5个)
  → #/editor/ide/dashboard
  → #/editor/ide/node/list
  → #/editor/ide/interface/list
  → #/editor/ide/logic/list
  → #/editor/ide/icd/list

批次3：动态编辑器路由 (5个，使用有效ID=1)
  → #/editor/ide/node/1
  → #/editor/ide/interface/1
  → #/editor/ide/logic/1
  → #/editor/ide/icd/1
  → #/editor/ide/packet/1

批次4：认证路由 (1个)
  → #/login

批次5：拓扑展示路由 (2个)
  → #/topology-display
  → #/topology-display/detail

批次6：用户管理路由 (2个)
  → #/user
  → #/user/detail

批次7：系统设置路由 (3个)
  → #/settings
  → #/hierarchy-settings
  → #/database-manager

批次8：错误处理路由 (2个)
  → #/404
  → #/test-invalid-route-xyz

批次9：路由守卫验证 (3个)
  → #/editor/ide/invalid/123 (应重定向)
  → #/editor/ide/interface/ (应重定向)
  → #/editor/ide/node/999999 (应重定向)
```

### 第三步：错误分析

对每个检测到的错误：

```
1. 确定错误类型（控制台/网络/渲染）
2. 记录完整错误信息
3. 分析可能的原因
4. 提供修复建议
```

### 第四步：生成报告

输出格式见下文"输出报告格式"章节。

---

## 六、截图保存规范

### 截图目录

`test-screenshots/route-error-test-[YYYY-MM-DD]/`

### 文件命名

格式：`序号-路由路径-状态.png`

示例：
- `01-root-success.png` - 根路由测试成功
- `02-dashboard-error.png` - 仪表板测试失败
- `03-node-list-success.png` - 节点列表测试成功

### 失败截图要求

对于失败的路由，必须：
1. 截取页面全屏
2. 确保错误信息可见（如有）
3. 文件名包含 `-error` 后缀

---

## 七、错误分类与优先级

| 优先级 | 类型 | 定义 | 示例 |
|--------|------|------|------|
| P0 | 阻塞性错误 | 页面完全无法使用 | 空白页面、模块加载失败 |
| P1 | 严重错误 | 核心功能受影响 | API 失败、数据无法加载 |
| P2 | 一般错误 | 次要功能问题 | 个别组件渲染异常 |
| P3 | 警告 | 不影响功能但需关注 | Vue 警告、弃用警告 |

---

## 八、输出报告格式

测试完成后，按以下格式输出报告：

```markdown
## 路由页面报错检测报告

**测试时间**: [YYYY-MM-DD HH:mm:ss]
**测试环境**: localhost:9300
**测试路由数**: [总数]
**通过路由数**: [成功数]
**失败路由数**: [失败数]

---

### 一、测试结果汇总

| 路由 | 状态 | 控制台错误 | 网络错误 | 渲染问题 |
|------|------|-----------|----------|----------|
| #/ | ✅/❌ | 0/数量 | 0/数量 | 无/有 |
| #/editor/ide/dashboard | ✅/❌ | 0/数量 | 0/数量 | 无/有 |
| ... | ... | ... | ... | ... |

---

### 二、发现的问题

#### P0 级错误 (阻塞性)

**路由**: `#/path/to/error`
- 错误类型: [控制台/网络/渲染]
- 错误信息: ```
  [完整错误堆栈]
  ```
- 可能原因: [分析]
- 修复建议: [建议]
- 截图: [文件名]

#### P1 级错误 (严重)

[同上格式]

#### P2 级错误 (一般)

[同上格式]

#### P3 级警告

[同上格式]

---

### 三、通过的路由列表

1. #/ - 欢迎页 ✅
2. #/editor/ide/dashboard - 仪表板 ✅
...

---

### 四、测试证据

所有截图已保存至: `test-screenshots/route-error-test-[YYYY-MM-DD]/`

---

### 五、修复建议优先级

1. 立即修复 (P0)
   - [问题1]
   - [问题2]

2. 尽快修复 (P1)
   - [问题3]

3. 后续优化 (P2/P3)
   - [问题4]
```

---

## 九、常见错误模式与诊断

### 9.1 模块加载错误

**错误特征**：
```
Failed to fetch dynamically imported module
Failed to resolve import
ChunkLoadError
```

**诊断步骤**：
1. 检查导入路径是否正确
2. 检查文件名大小写是否匹配
3. 检查组件目录结构是否与路径一致

### 9.2 API 请求错误

**错误特征**：
```
404 Not Found
500 Internal Server Error
net::ERR_CONNECTION_REFUSED
```

**诊断步骤**：
1. 检查后端服务是否运行
2. 检查 API 路径是否正确
3. 检查请求参数格式

### 9.3 Vue 组件错误

**错误特征**：
```
[Vue warning]: Missing required prop
[Vue warning]: Unknown custom element
Cannot read properties of undefined
```

**诊断步骤**：
1. 检查组件 props 定义
2. 检查组件注册
3. 检查数据初始化

### 9.4 路由错误

**错误特征**：
```
Route matched but component not found
NavigationDuplicated
Redirected from X to Y
```

**诊断步骤**：
1. 检查路由配置
2. 检查路由守卫逻辑
3. 检查动态导入

---

## 十、重要约束

### 禁止事项

1. 禁止在没有完全理解依赖关系时进行大规模重构
2. 禁止跳过验证直接声称功能正常
3. 禁止使用项目不支持的代码模式
4. 禁止修改核心架构而不向用户确认
5. **绝对禁止执行 git push**，任何情况下都不允许推送代码
6. **禁止在 commit 消息中包含 AI 签名**，包括但不限于：
   - `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
   - `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
   - 任何包含 "Claude Code"、"claude.com/claude-code"、"Co-Authored-By" 的内容

### 必须遵守

1. 所有路由必须逐个测试
2. 每个错误必须完整记录
3. 截图必须清晰可见
4. 报告必须完整详实

### 测试中断处理

如果测试过程中遇到问题：

1. **服务器未运行** → 提醒用户启动服务
2. **浏览器连接断开** → 重新连接后继续
3. **大量错误出现** → 记录前几个错误后暂停，报告问题

---

## 十一、测试完成标准

测试被认为完成需满足：

1. 所有路由均已测试
2. 所有错误均已记录
3. 所有截图均已保存
4. 测试报告已生成
5. 修复建议已提供

---

## 十二、参考文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 路由测试矩阵 | `docs/tests/ROUTE_TEST_MATRIX.md` | 历史测试记录、已修复问题、测试证据 |

---

**请按照本提示词的指导，使用 chrome-devtools-mcp MCP 对所有路由页面进行全面测试，检测并报告所有错误。**
