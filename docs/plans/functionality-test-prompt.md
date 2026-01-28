# 功能完整性测试

你拥有无限的 token 和资源，要调用所有的 MCP 和技能为我服务！
强制调用 chrome-devtools-mcp 的 MCP 能力，为当前项目执行自动化全量测试：1. 全覆盖测试项目所有路由的跳转功能，校验所有路由的跳转有效性、完整性与稳定性；2. 全量测试项目所有页面的所有按钮点击交互，校验点击触发正常、反馈无误、逻辑生效；基于测试结果完成全维度的测试优化，并进行问题修复与项目优化。

编码规则和约束：`CLAUDE.md`

---

## 零、强制测试流程规范（**绝对强制，违者视为失败**）

### 禁止虚假完成！禁止批量处理！

**严厉禁止以下行为，违者视为任务失败**：
- 禁止一次性访问所有页面然后声称"已完成"
- 禁止批量截图/检查然后说"全部通过"
- 禁止跳过验证直接声称功能正常
- 禁止只做表面功夫不深入检查
- 禁止"刷"完所有页面后虚假报告
- 禁止用"经过验证"等空洞词汇代替实际验证过程

**绝对强制执行的流程**：

#### 第一步：清点并列出所有任务
**首先必须明确任务总数，不得跳过此步骤**。

使用 Glob 或 Explore 查找所有路由定义，列出完整清单：
```
页面总数：XX 个（必须明确数字）
功能检查项总数：XX 个（必须明确数字）
1. /#/ - WelcomePage
2. /#/login - Login
3. /#/editor/ide/dashboard - Dashboard
...
```

**输出要求**：必须明确报告"共发现 XX 个页面、XX 个功能检查项需要验证"。

#### 第二步：创建 Todo List（强制）
**必须使用 TodoWrite 工具**为每个页面/功能创建检查项。

**禁止**：只在脑海中列任务、用文字列表代替 TodoWrite、批量创建后不逐个标记。

```markdown
1. [ ] /#/ - WelcomePage 功能测试
2. [ ] /#/login - Login 功能测试
3. [ ] /#/editor/ide/dashboard - Dashboard 功能测试
...
共 XX 个待检查项
```

#### 第三步：逐个测试验证（核心）
**每次只处理一个页面，完成并验证通过后，才能进行下一个**。

**操作流程**：
1. 选中第一个待测页面（标记为 in_progress）
2. 使用 chrome-devtools-mcp 工具自主打开该页面
3. 截图并分析页面，逐项验证所有功能点
4. **必须调用子代理交叉验证**：使用 Task 工具调用 code-reviewer 或 systematic-debugging 进行二次确认
5. 子代理确认通过后，才标记该页面为 completed
6. 发现问题立即修复，修复后使用 MCP 工具刷新页面重新验证
7. 该页面完全通过后，才能进行下一个页面

**禁止行为**：
- 禁止同时标记多个页面为 in_progress
- 禁止在一个页面未完成时就开始下一个页面
- 禁止不调用子代理验收就标记完成
- 禁止用"看起来没问题"等主观判断代替验证

#### 第四步：最终确认
**只有当所有页面 Todo 状态均为 completed 时，才能声称测试完成**。

**验证公式**：
```
实际完成 = (所有页面 Todo 状态均为 completed) AND (MCP 工具截图验证通过)
若任何一个页面为 pending/in_progress，则测试未完成
```

#### 子代理验收机制
**每个页面完成后，必须调用子代理进行验收**：

```javascript
// 调用 code-reviewer 子代理验收
Task({
  subagent_type: 'code-reviewer',
  prompt: '验收 /#/editor/ide/dashboard 页面的功能是否完整可用...'
})

// 或调用 systematic-debugging 进行深度检查
Task({
  subagent_type: 'systematic-debugging',
  prompt: '验证 /#/editor/ide/dashboard 页面的数据加载、缓存、错误处理...'
})
```

**验收通过标准**：
- 子代理明确确认符合要求
- 通过 MCP 工具截图验证页面正常
- Todo 状态更新为 completed

#### 进度报告要求
**每次完成一个页面后，必须报告进度**：

```markdown
进度：X/YY（XX.X%）
- [completed] /#/ - WelcomePage 功能测试
- [completed] /#/login - Login 功能测试
- [completed] /#/editor/ide/dashboard - Dashboard 功能测试
- [in_progress] /#/editor/ide/node/list - NodeList 功能测试 ← 当前
- [pending] /#/editor/ide/interface/list - InterfaceList 功能测试
...
```

**禁止**：报告"已完成80%"但无法提供具体的 completed/in_progress/pending 状态列表。

---

## 一、任务定义

**核心职责**：专注于功能的完整性、可用性和稳定性

**不需要关心**：UI美观程度、交互流程的流畅度、视觉风格是否统一

---

## 二、环境信息

```
前端: http://localhost:9300
后端: http://localhost:9200

chrome-devtools-mcp 已也经启动！
chrome-devtools-mcp 启动命令:
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug http://localhost:9300
```

项目工作目录：`/Users/peng/Desktop/Project/alpha-coda/cssc-node-view/client`

---

## 三、必读文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构设计 | `docs/plans/2025-01-10-frontend-architecture-refactor-design.md` | 布局层级、组件目录结构、Vue 文件结构规范 |
| 路由测试矩阵 | `docs/tests/ROUTE_TEST_MATRIX.md` | 完整路由清单、历史测试记录 |
| Chrome MCP指南 | `docs/plans/chrome-mcp-route-test-prompt.md` | chrome-devtools-mcp MCP 使用 |

**IDE 模块路由格式**：`/#/editor/ide/*`

---

## 四、Vue 文件结构规范

**所有 Vue 文件必须遵循以下固定结构**：

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 组件逻辑
// 如无逻辑，保留空标签或添加说明注释
</script>

<style lang="scss" src="./index.scss"></style>
```

**验证检查项**：
- template 标签必须在第一位
- script setup lang="ts" 标签必须在第二位
- style lang="scss" src="./index.scss" 标签必须在最后一位
- 禁止使用内联 style 属性处理静态状态样式

---

## 五、SCSS 模块导入规范（2026-01-11 更新）

### 5.1 核心原则：必须使用 `@use` 替代 `@import`

| 导入类型 | 语法 | 说明 |
|---------|------|------|
| SCSS 文件 | `@use 'path/to/file' as *;` | 导入 SCSS 模块，使用 `as *` 直接引入变量和 mixin |
| CSS 文件 | `@import 'path/to/file.css';` | CSS 文件必须使用 `@import`（不支持 `@use`） |

### 5.2 `@use` 规则约束

- `@use` 必须写在文件最开头，在任何其他规则之前
- 唯一可以放在 `@use` 之前的是注释
- CSS 文件的 `@import` 应该放在 `@use` 之后

### 5.3 正确示例

```scss
// 文件顶部：注释
@use '@/views/ide/index.scss' as *;

// CSS 文件导入（在 @use 之后）
@import 'remixicon/fonts/remixicon.css';

// 其他样式规则
.component { }
```

### 5.4 错误示例

```scss
// 错误：@import 在 @use 之前
@import 'remixicon/fonts/remixicon.css';
@use '@/views/ide/index.scss' as *;

// 错误：使用 @import 导入 SCSS
@import '@/views/ide/index.scss';

// 错误：@use 不在文件开头
.component { }
@use '@/views/ide/index.scss' as *;
```

### 5.5 验证检查项

- SCSS 模块导入使用 `@use` 而非 `@import`
- CSS 文件导入（如 remixicon.css）保留 `@import` 语法
- `@use` 语句位于文件最开头（在注释之后）
- `@use` 使用 `as *` 语法导入变量和 mixin
- 构建成功，无 SCSS 语法错误

---

## 六、命名规范检查项（重要）

### 6.1 TypeScript 类型定义命名

- [ ] 验证 interface/type 名称使用 camelCase（如 CacheLoadOptions、FieldConfig、TabInfo）
- [ ] 验证类型定义内部的字段名使用 snake_case
- [ ] 验证变量名（含局部变量）使用 snake_case
- [ ] 验证集合变量名使用 snake_case + list 后缀

**命名规范说明**：
- TypeScript 的 `interface` 和 `type` 名称使用 camelCase：`interface CacheLoadOptions<T> { ... }`
- 这是 TypeScript 社区的通用惯例，与变量名的 snake_case 规范不同
- 类型定义内部的字段名仍使用 snake_case：`interface CacheLoadOptions<T> { cache_key: string }`

---

## 七、核心功能验证清单

### 7.1 路由系统验证

#### 路由定义完整性
- 所有定义的路由都能正确匹配
- query 参数正确解析（type、id、subId）
- 可选参数处理正确（如 subId）
- 通配符路由处理正确
- 路由嵌套层级正确

#### 路由格式验证（2026-01-11 更新）

**核心原则**：React/Vue Router 使用 hash 模式，所有参数必须通过 query 参数传递，严格禁止使用路径参数格式。

**禁止使用路径参数格式**：
- 禁止：`/:type`, `/:id`, `/:subType`, `/:subId` 等路径参数
- 例如：`/#/editor/ide/interface/1007` 是错误的
- 例如：`/#/settings/user/detail/123` 是错误的

**正确格式示例**：
- `/#/` → 欢迎页或首页
- `/#/editor/ide/dashboard` → 仪表板
- `/#/editor/ide?type=node&id=xxx` → 通信节点编辑器
- `/#/editor/ide?type=interface&id=xxx` → 接口编辑器
- `/#/editor/ide?type=interface&id=xxx&subId=1` → 接口编辑器（带子资源ID）
- `/#/editor/ide?type=logic&id=xxx` → 逻辑编辑器
- `/#/editor/ide?type=icd&id=xxx` → ICD编辑器
- `/#/editor/ide?type=packet&id=xxx` → 报文编辑器
- `/#/settings/user/detail?id=123` → 用户详情页（使用 query 参数）

**禁止格式示例**：
- `/#/editor/ide/interface/1007`（路径参数格式，禁止使用）
- `/#/editor/ide/node/:id`（路径参数格式，禁止使用）
- `/#/settings/user/detail/123`（路径参数格式，禁止使用）
- 任何使用路径参数（如 `:id`, `:type`, `:subId`）的路由格式

**参数说明**：
- type: 资源类型（node/interface/logic/icd/packet）
- id: 资源ID
- subId: 子资源ID（可选，用于接口编辑器的子报文）

**路由跳转代码示例**：
```typescript
// 正确：统一路径，query 传递参数
router.push({
  path: '/editor/ide',
  query: { type: 'interface', id: interfaceId }
});

// 错误：使用路径参数传递 ID（禁止）
router.push(`/editor/ide/interface/${interfaceId}`);
```

**路由规范验证状态（2026-01-11 验证通过）**：
- 路由配置：无动态路径参数（除 404 通配符 `/:pathMatch(.*)*` 外）
- router.push 调用：全部使用 query 参数格式
- route.params 使用：无（全部使用 route.query）
- RouterLink 组件：全部使用静态路径
- 验证结论：代码已符合规范，无需修改

#### 路由守卫验证
- beforeEach 守卫正确触发
- 无效 type query 参数被拦截并重定向
- 无效 id query 参数被拦截
- 缺失必需参数时有合理处理
- 权限检查正常工作（如有）
- 无重定向循环

#### 路由跳转验证
- `router.push` 跳转正常
- `router.replace` 替换正常
- 路由跳转携带 query 参数正确（type、id、subId）
- 跳转到不存在的路由有处理
- 跳转触发组件更新

### 7.2 数据加载验证

#### 五种资源类型加载

支持资源类型：node（通信节点）、interface（接口）、logic（逻辑）、icd（ICD配置）、packet（协议包）

- node 类型数据能正确加载
- interface 类型数据能正确加载
- logic 类型数据能正确加载
- icd 类型数据能正确加载
- packet 类型数据能正确加载
- 每种类型的数据格式正确解析
- 列表数据正确显示
- 详情数据正确显示

#### API 映射验证
- 资源类型正确映射到 API 端点
- 列表 API 调用正确
- 详情 API 调用正确
- 创建/更新 API 调用正确
- 删除 API 调用正确

#### 加载状态验证
- 首次加载显示 loading 状态
- loading 状态在数据返回后消失
- 缓存命中时不显示 loading
- 加载期间禁用操作（如按钮）
- loading 组件正确显示

#### 错误处理验证
- 网络错误有提示
- 404 错误有提示
- 500 错误有提示
- 超时错误有提示
- 错误后能重试
- 数据不存在自动跳转列表页

#### 数据格式验证
- 使用 `response.status` 判断成功/失败
- 成功时正确读取 `response.datum`
- 失败时正确显示 `response.message`
- 不使用 try-catch 处理业务错误
- 分页数据正确解析

#### 分页功能验证
- 分页参数正确传递（current_page、page_size）
- 总数正确显示
- 页码切换正常工作
- 每页数量切换正常工作
- 边界页码处理正确（首页、末页）
- 数据为空时显示正确

### 7.3 缓存机制验证

#### 缓存创建验证
- 首次访问创建缓存
- 缓存键包含资源类型和 ID
- 缓存键唯一不冲突
- 缓存数据完整保存
- 缓存时间戳正确记录

#### 缓存读取验证
- 5分钟内再次访问使用缓存
- 缓存数据正确返回
- 使用缓存时不显示 loading
- 缓存读取不触发 API 请求
- 缓存数据与原始数据一致

#### 缓存过期验证
- 超过5分钟缓存过期
- 过期后重新请求数据
- 过期后显示 loading
- 过期缓存被清理或标记
- 缓存时长可配置

#### 缓存清理验证
- 刷新操作清除缓存
- 保存操作清除缓存
- 删除操作清除缓存
- 缓存清理后重新加载
- 缓存空间有上限（如需要）

#### 缓存并发验证
- 并发请求同一资源时去重
- 第一个请求进行中，后续等待
- 第一个请求完成，后续使用缓存
- 无重复的网络请求
- 无竞态条件

### 7.4 仪表板功能验证

#### 统计数据加载
- 五种资源统计数据并行加载
- 加载状态正确显示
- 加载失败不影响其他统计
- 统计数据正确计算
- 统计数据实时更新

#### 卡片显示验证
- 统计卡片正确显示数字
- 卡片有对应的图标
- 卡片有对应的标签
- 空数据显示为 0 或 "-"
- 卡片样式统一

#### 快速导航验证
- 点击卡片跳转到对应列表页
- 跳转携带正确参数
- 跳转后 Tab 正确更新
- 卡片 hover 有反馈

### 7.5 列表页功能验证

#### 列表数据显示
- 列表数据正确渲染
- 列表字段正确映射
- 数据为空时有空状态提示
- 加载失败时有错误提示
- 长列表有滚动

#### 列表交互验证
- 点击行跳转到详情页
- 点击事件正确处理
- 跳转携带正确的 query 参数（type、id）
- 行 hover 有视觉反馈
- 可选中的行有选中状态

#### 搜索功能验证
- 搜索输入框可用
- 搜索参数正确传递
- 搜索结果正确显示
- 搜索为空时显示全部
- 搜索支持防抖
- 清空搜索恢复列表

#### 筛选功能验证
- 筛选条件正确设置
- 筛选参数正确传递
- 筛选结果正确显示
- 多条件筛选正确组合
- 清空筛选恢复列表

#### 排序功能验证
- 排序字段正确设置
- 升序/降序切换正常
- 排序参数正确传递
- 排序结果正确显示
- 排序状态有图标指示

### 7.6 编辑器功能验证

#### 数据回显验证
- 详情数据正确回显到表单
- 各字段类型正确映射
- 日期时间正确格式化
- 枚举值正确显示
- 关联数据正确显示
- 嵌套数据正确展开

#### 表单验证验证
- 必填项有验证
- 格式验证正确（邮箱、URL等）
- 长度验证正确
- 自定义验证规则正常
- 验证错误提示清晰
- 验证时机合理（blur/submit）

#### 保存功能验证
- 点击保存触发 API 调用
- 保存参数格式正确
- 保存成功有提示
- 保存成功刷新数据
- 保存失败显示错误
- 保存中禁用按钮
- 未修改时保存不触发

#### 取消功能验证
- 点击取消有确认提示（如已修改）
- 确认取消后返回列表
- 未修改时直接返回
- 取消不保存修改

#### 克隆功能验证（如有）
- 克隆模式正确加载数据
- ID 字段被清空
- 其他字段保持不变
- 保存时创建新记录

### 7.7 表单组件验证

#### 输入框组件
- 输入框可以输入
- 输入值正确绑定
- placeholder 正确显示
- 禁用状态生效
- 只读状态生效
- 最大长度限制生效
- 输入类型生效（text/number/email等）

#### 选择框组件
- 下拉选项正确显示
- 选择值正确绑定
- 清空选择功能可用
- 禁用选项生效
- 分组选项正确显示

#### 日期选择器
- 日期选择器正常弹出
- 日期选择正确绑定
- 日期格式正确显示
- 日期范围选择正常（如有）

### 7.8 操作反馈验证

#### 成功提示验证
- 操作成功有提示
- 提示内容清晰
- 提示自动消失
- 提示可手动关闭
- 提示位置合理

#### 错误提示验证
- 操作失败有提示
- 错误信息准确
- 错误原因可理解
- 错误提示有建议

#### 确认对话框验证
- 危险操作有确认
- 确认内容描述后果
- 确认按钮文字明确
- 取消按钮易于点击

### 7.9 权限控制验证（如有）

#### 路由权限验证
- 无权限路由被拦截
- 拦截后跳转合理
- 权限变更后路由可访问

#### 功能权限验证
- 无权限按钮隐藏或禁用
- 无权限操作被拦截

### 7.10 数据一致性验证

#### 列表与详情一致性
- 列表数据与详情一致
- 更新后列表刷新
- 删除后列表移除
- 创建后列表添加

#### 多标签页一致性
- 同一资源多 Tab 数据一致
- 更新后其他 Tab 刷新
- 删除后其他 Tab 关闭或提示

### 7.11 边界条件验证

#### 空数据验证
- 空列表有友好提示
- 空详情有友好提示
- 空搜索有提示
- 空状态有操作引导

#### 超长数据验证
- 超长文本正确截断或换行
- 超长列表分页正常
- 超长输入有长度限制

#### 特殊字符验证
- 特殊字符正确显示
- 特殊字符输入不被过滤
- HTML 标签正确转义

#### 网络异常验证
- 断网时操作有提示
- 网络恢复后可重试
- 超时有提示

### 7.12 性能功能验证

#### 加载性能验证
- 首屏加载时间可接受
- 路由切换流畅
- 大列表加载有分页

#### 运行性能验证
- 列表滚动流畅
- 表格渲染不卡顿
- 无内存泄漏

---

## 八、Interface Editor 功能验证（2026-01-11 更新）

### Interface Editor 新布局结构

**布局层级**：
```
ide-interface-editor (flex row, height: 100%)
├── ide-interface-packets (width: 180px, 左侧报文列表)
└── ide-interface-content (右侧内容区, NEW)
    ├── ide-interface-content-toolbox (顶部控制栏)
    └── ide-interface-content-main (底部内容区, 左右布局)
        ├── ide-interface-cm-info (左侧信息区)
        │   ├── ide-interface-cm-info-base (基本信息面板)
        │   └── ide-interface-cm-info-files (字段表格)
        └── ide-interface-cm-attr (右侧属性面板, 280px)
```

**组件复用**：
- BasicInfoPanel（来自 packet-definition-editor/components）
- FieldList（来自 packet-definition-editor/components）
- EditorAside（来自 packet-definition-editor/components）
- AddFieldMenu（来自 packet-definition-editor/components）

### 8.1 报文列表功能验证

- [ ] 报文列表数据正确加载
- [ ] 报文列表项点击能正确切换 activePacket
- [ ] 报文列表选中状态正确更新
- [ ] 报文列表为空时显示空状态提示
- [ ] 报文列表加载失败时有错误提示

### 8.2 顶部控制栏功能验证

- [ ] 当前选中报文名称正确显示
- [ ] 报文版本号正确显示
- [ ] 报文 message_id 正确显示
- [ ] 保存按钮点击能正确保存报文数据
- [ ] 重置按钮点击能重置为原始数据
- [ ] 预览按钮点击能打开预览弹窗
- [ ] 历史版本按钮点击能打开版本历史
- [ ] 编辑状态（editing）与历史状态（history）与只读状态（readonly）正确区分

### 8.3 基本信息面板功能验证

- [ ] BasicInfoPanel 组件正确接收 packet-data props
- [ ] BasicInfoPanel 组件正确接收 readonly props
- [ ] 基本信息表单字段正确显示（名称、版本、描述等）
- [ ] 基本信息表单输入正确绑定到 activePacket
- [ ] 基本信息面板展开/折叠状态正确管理
- [ ] 只读模式下基本信息表单正确禁用

### 8.4 字段表格功能验证

- [ ] FieldList 组件正确接收 packet-data props
- [ ] FieldList 组件正确接收 readonly props
- [ ] FieldList 组件正确接收 flattened-fields props
- [ ] 字段列表正确显示所有字段
- [ ] 字段展开/折叠功能正常
- [ ] 字段选中功能正常（selected-index）
- [ ] 字段编辑功能正常（editing-field-id）
- [ ] 字段添加功能正常（field-add 事件）
- [ ] 字段删除功能正常（remove 事件）
- [ ] 字段拖拽排序功能正常（field-reorder 事件）
- [ ] 字段双击进入编辑状态
- [ ] 字段长度输入正常（length-input 事件）
- [ ] 字段字节长度输入正常（byte-length-input 事件）
- [ ] 字段字节长度选择正常（byte-length-select 事件）
- [ ] 添加字段菜单显示功能正常（show-add-menu 事件）

### 8.5 右侧属性面板功能验证

- [ ] EditorAside 组件正确接收 selected-field props
- [ ] EditorAside 组件正确接收 field-list props
- [ ] EditorAside 组件正确接收 readonly props
- [ ] 未选中字段时显示空状态提示
- [ ] 选中字段后正确显示字段属性
- [ ] 字段属性修改正确更新到数据
- [ ] 关闭属性面板后选中状态清除

### 8.6 useFieldOperations Composable 功能验证

- [ ] selected-field-index 状态正确管理
- [ ] editing-field-id 状态正确管理
- [ ] add-field-menu-visible 状态正确管理
- [ ] add-field-menu-position 位置正确计算
- [ ] flattened-fields 扁平化字段列表正确计算
- [ ] toggle-field-expand 功能正常
- [ ] start-editing 功能正常
- [ ] finish-editing 功能正常
- [ ] handle-field-add 功能正常
- [ ] handle-field-reorder 功能正常
- [ ] remove-field 功能正常
- [ ] show-add-field-menu 功能正常
- [ ] hide-add-field-menu 功能正常
- [ ] add-field-from-menu 功能正常
- [ ] handle-field-double-click 功能正常
- [ ] update-field-property 功能正常

---

## 九、子代理使用规范

### 子代理类型与用途

| 子代理类型 | 用途 | 使用场景 |
|------------|------|----------|
| Explore | 快速探索代码库 | 查找路由配置、搜索功能实现 |
| general-purpose | 执行复杂多步骤任务 | 多轮代码搜索、功能问题分析 |
| code-reviewer | 代码审查 | 测试完成后审查功能代码质量 |

### 并行调用规范

**可以并行调用的场景**：
- 探索多个独立目录
- 分析多个独立功能
- 测试多种资源类型

**必须串行调用的场景**：
- 依赖前序结果
- 同一资源分析
- 问题修复流程

---

## 十、测试执行流程

### 第一步：代码审查

1. 调用 Explore 子代理查找路由配置文件
2. 调用 Explore 子代理查找路由守卫逻辑
3. 调用 Explore 子代理查找数据加载层
4. 调用 Explore 子代理查找 API 调用代码
5. 调用 Explore 子代理查找错误处理逻辑
6. 调用 Explore 子代理查找缓存实现
7. 验证 SCSS 模块导入使用 `@use` 而非 `@import`（CSS 文件除外）

### 第二步：静态代码检查

执行命令：`/cc:lint`

如果有错误，必须先修复再继续。

### 第三步：启动开发环境

1. 检查服务是否就绪
2. 如未就绪，提醒用户启动：`cd client && pnpm dev`

### 第四步：浏览器可视化验证

**重要：使用 MCP 工具自主完成验证！**

测试方法：
1. 使用 chrome-devtools-mcp 工具自主打开对应页面
2. 截图并分析页面，对照检查项逐项验证
3. 打开一个网页，验证一个是否符合要求
4. 发现不符合的项，直接说明问题并提供修复方案
5. 修复后使用 MCP 工具刷新页面重新验证

#### 路由访问测试
1. 依次访问所有定义的路由格式
2. 验证页面能正确加载
3. 验证数据能正确显示
4. 验证参数能正确解析

#### 数据加载测试
1. 测试五种资源类型的列表加载
2. 测试五种资源类型的详情加载
3. 测试缓存机制（重复访问）
4. 测试缓存过期（等待5分钟或手动清除）
5. 测试错误处理（模拟错误响应）

#### 表单功能测试
1. 测试表单数据回显
2. 测试必填项验证
3. 测试保存功能
4. 测试取消功能

#### 边界条件测试
1. 测试空数据状态
2. 测试超长数据
3. 测试特殊字符

### 第五步：问题分析与修复

1. 调用 `superpowers:systematic-debugging` 技能
2. 在关键位置添加 `console.log` 追踪问题
3. 使用 MCP 工具重新测试并验证
4. 分析根因并修复
5. 使用 MCP 工具验证修复效果

---

## 十一、常见问题诊断指南

### 页面空白且无接口请求（P0级）

**诊断流程**（按顺序执行）：
1. 验证路由匹配
2. 验证组件渲染
3. 验证数据加载触发
4. 验证路由守卫逻辑

### 数据加载失败

**诊断流程**：
1. 检查 API 映射是否正确
2. 检查请求参数格式
3. 检查响应格式是否符合预期
4. 检查错误处理逻辑

### 缓存不生效

**诊断流程**：
1. 检查缓存键生成逻辑
2. 检查缓存读取逻辑
3. 检查缓存过期时间
4. 检查缓存清除逻辑

### 表单保存失败

**诊断流程**：
1. 检查表单验证是否通过
2. 检查 API 调用参数
3. 检查响应处理逻辑
4. 检查错误提示显示

---

## 十二、输出格式

```markdown
## 功能完整性测试报告 - [日期]

### 一、路由系统验证
| 路由格式 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|------|
| /#/ | 欢迎页 | ... | ... |
| /#/editor/ide/dashboard | 仪表板 | ... | ... |

### 二、数据加载验证
| 资源类型 | 列表加载 | 详情加载 | 缓存机制 | 错误处理 |
|----------|----------|----------|----------|----------|
| node | ... | ... | ... | ... |
| interface | ... | ... | ... | ... |

### 三、表单功能验证
| 功能 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 数据回显 | ... | ... | ... |
| 表单验证 | ... | ... | ... |
| 保存功能 | ... | ... | ... |

### 四、列表功能验证
| 功能 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 列表显示 | ... | ... | ... |
| 搜索功能 | ... | ... | ... |

### 五、边界条件验证
| 场景 | 预期 | 实际 | 状态 |
|------|------|------|------|
| 空数据 | ... | ... | ... |

### 六、发现的问题
| 序号 | 问题描述 | 位置 | 严重程度 | 当前状态 | 复现步骤 |
|------|----------|------|----------|----------|----------|
| 1 | ... | ... | ... | ... | ... |

### 七、代码变更
- 修改文件：[文件路径]
- 变更说明：[详细说明]

### 八、下一步计划
- [待完成任务]
```

---

## 十三、问题严重程度定义

| 级别 | 定义 | 处理方式 |
|------|------|----------|
| P0 | 阻塞性，功能完全不可用 | 立即修复 |
| P1 | 严重，核心功能受影响 | 优先修复 |
| P2 | 一般，次要功能问题 | 也要修复 |
| P3 | 轻微，体验问题 | 也要修复 |

---

## 十四、禁止事项

1. 禁止在没有完全理解依赖关系时进行大规模重构
2. 禁止跳过验证直接声称功能正常
3. 禁止使用项目不支持的代码模式
4. 禁止修改核心架构而不向用户确认
5. **绝对禁止执行 git push**
6. **禁止在 commit 消息中包含 AI 签名**

---

**请专注于功能的完整性和可用性，确保每个功能都能正常工作，每个边界情况都有合理处理。**
