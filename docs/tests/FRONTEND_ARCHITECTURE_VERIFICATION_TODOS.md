# 前端架构验证检查项

> 创建日期: 2025-01-10
> 更新日期: 2026-01-10
>
> 核心思路：先锚定主干（全局布局架构），再全局复审（一致性闭环），最后深挖枝节（细节穿透）
>
> 验证工具：chrome-devtools-mcp + 实际DOM检查 + 控制台验证
>
> **重要教训**：不能仅凭代码文件存在就断言布局正确，必须通过浏览器实际验证DOM结构和视觉布局
>
> **响应式设计规范**：本项目不需要考虑响应式设计，禁止使用 `@media` 查询进行屏幕尺寸适配
> **例外**：无障碍相关的 `@media` 查询应保留，如：
> - `@media (prefers-reduced-motion: reduce)` - 减少动画
> - `@media (prefers-contrast: high)` - 高对比度模式

---

## 零、强制测试流程规范（**绝对强制，违者视为失败**）

### 禁止虚假完成！禁止批量处理！

**严厉禁止以下行为，违者视为任务失败**：
- 禁止一次性访问所有页面然后声称"已完成"
- 禁止批量截图/检查然后说"全部通过"
- 禁止跳过验证直接声称架构正确
- 禁止只做表面功夫不深入检查
- 禁止"刷"完所有页面后虚假报告
- 禁止用"经过验证"等空洞词汇代替实际验证过程

**绝对强制执行的流程**：

#### 第一步：清点并列出所有任务
**首先必须明确任务总数，不得跳过此步骤**。

使用 Glob 查找路由配置文件，列出完整页面清单：
```
页面总数：XX 个（必须明确数字）
1. /#/ - WelcomePage (无布局)
2. /#/login - Login (无布局)
3. /#/editor/ide/dashboard - Dashboard (EditorLayout)
4. /#/user - User (BasicLayout)
...
```

**输出要求**：必须明确报告"共发现 XX 个页面需要验证"。

#### 第二步：创建 Todo List（强制）
**必须使用 TodoWrite 工具**为每个页面创建检查项。

**禁止**：只在脑海中列任务、用文字列表代替 TodoWrite、批量创建后不逐个标记。

```markdown
1. [ ] /#/ - WelcomePage 架构验证
2. [ ] /#/login - Login 架构验证
3. [ ] /#/editor/ide/dashboard - Dashboard 架构验证
...
共 XX 个待检查项
```

#### 第三步：逐个测试验证（核心）
**每次只处理一个页面，完成并验证通过后，才能进行下一个**。

**操作流程**：
1. 选中第一个待测页面（标记为 in_progress）
2. 使用 chrome-devtools-mcp 工具自主打开该页面
3. 截图并分析页面，逐项验证所有架构检查点（布局结构、类名匹配、样式规范）
4. **必须调用子代理交叉验证**：使用 Task 工具调用 code-reviewer 或其他子代理进行二次确认
5. 子代理确认通过后，才标记该页面为 completed
6. 发现问题立即修复，修复后使用 MCP 工具刷新页面重新验证
7. 该页面完全通过后，才能进行下一个页面

**禁止行为**：
- 禁止同时标记多个页面为 in_progress
- 禁止在一个页面未完成时就开始下一个页面
- 禁止不调用子代理验收就标记完成
- 禁止用"看起来没问题"等主观判断代替验证

#### 第四步：最终确认
**只有当所有页面 Todo 状态均为 completed 时，才能声称架构验证完成**。

**验证公式**：
```
实际完成 = (所有页面 Todo 状态均为 completed) AND (MCP 工具截图验证通过)
若任何一个页面为 pending/in_progress，则验证未完成
```

#### 子代理验收机制
**每个页面完成后，必须调用子代理进行验收**：

```javascript
// 调用 code-reviewer 子代理验收
Task({
  subagent_type: 'code-reviewer',
  prompt: '验收 /#/editor/ide/dashboard 页面的架构是否符合设计文档要求...'
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
- [completed] /#/ - WelcomePage 架构验证
- [completed] /#/login - Login 架构验证
- [completed] /#/editor/ide/dashboard - Dashboard 架构验证
- [in_progress] /#/user - User 架构验证 ← 当前
- [pending] /#/settings - Settings 架构验证
...
```

**禁止**：报告"已完成80%"但无法提供具体的 completed/in_progress/pending 状态列表。

---

## 核查方法论

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           三阶段核查逻辑                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  第一阶段：主干层 - 架构与布局的全局校验                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  - 启动服务，访问各路由                                               │ │
│  │  - 使用浏览器开发工具检查 DOM 结构                                     │ │
│  │  - 截图并分析页面，对照检查项逐项验证                                  │ │
│  │  - 验证布局结构是否匹配设计文档                                         │ │
│  │  - 验证类名与 SCSS 定义是否匹配                                         │ │
│  │  - 确认无空白模块、无缺失元素                                           │ │
│  │  -> 输出架构级核查结果，完成「主干是否稳固」的定性判断                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  第二阶段：复审层 - 主干层的一致性闭环                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  - 交叉核验已输出的架构核查结果                                         │ │
│  │  - 确认：布局无偏离规划、无全局级报错/异常                               │ │
│  │  - 确认：筛选栏完全符合「一行展示所有选项、无收起/高级按钮」要求              │ │
│  │  - 确认：DOM 类名与 SCSS 定义完全匹配                                   │ │
│  │  -> 形成主干层的核查闭环                                                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  第三阶段：枝节层 - 模块内的细节穿透                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  - 针对每个模块，逐一核查                                              │ │
│  │  - 交互逻辑、样式规范（字体 12/14/16px）                                │ │
│  │  - 控制台错误输出机制等细节                                             │ │
│  │  -> 确保枝节不影响主干稳定性                                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**重要：使用 MCP 工具自主完成验证！AI 应该自己截图查看页面，对照检查项逐项验证。**

---

## 第一阶段：主干层 - 架构与布局全局校验

### 1.1 全局布局框架验证

- [ ] 1. 启动前端开发服务器，确认服务正常运行且无编译错误
- [ ] 2. 访问首页 `/#/`，使用 chrome-devtools-mcp 获取 DOM 快照，验证 BasicLayout 结构完整
- [ ] 3. 检查 BasicLayout 根容器类名是否正确（`.cssc-basic-layout`），确认 flex 布局生效
- [ ] 4. 验证 BasicLayout 内部结构：AppHeader → 内容区 → AppFooter，无多余包裹层
- [ ] 5. 验证页面高度为 100vh，占满整个视口，无意外滚动条
- [ ] 6. 验证 AppHeader 在页面顶部正确渲染，Logo、菜单、搜索框、用户信息完整显示
- [ ] 7. 验证 AppFooter 在页面底部正确渲染，状态信息、用户、保存时间、系统资源完整显示
- [ ] 8. 访问 `/#/editor/ide/dashboard`，使用 chrome-devtools-mcp 获取 DOM 快照，验证 EditorLayout 结构完整
- [ ] 9. 检查 EditorLayout 根容器类名是否正确（`.ide-layout`），**确认不是** `.ide-container`
- [ ] 10. 验证 EditorLayout 三栏布局：ResourceExplorer（左）+ TabWorkbench（中）+ 工具箱/属性面板（右）
- [ ] 11. 验证 EditorLayout 高度为 100vh，占满整个视口
- [ ] 12. 验证三栏布局比例协调，左侧栏宽度固定，中间栏弹性伸缩，右侧栏可折叠

### 1.2 模块分区验证

- [ ] 17. 验证 ResourceExplorer 在左侧正确渲染，树形结构展开/折叠功能正常
- [ ] 18. 验证 ResourceExplorer 根节点正确显示：体系层级、协议与算法两大分组
- [ ] 19. 验证体系层级分组下正确显示系统层级树节点
- [ ] 20. 验证协议与算法分组下正确显示：公共数据字典、协议集子节点
- [ ] 21. 验证 TabWorkbench 在中间区域正确渲染，标签页栏位于内容区顶部
- [ ] 22. 验证 TabWorkbench 标签页激活态样式明显，当前标签与未激活标签视觉区分清晰
- [ ] 23. 验证 TabWorkbench 内容区正确渲染当前激活标签对应的内容
- [ ] 24. 验证 TabWorkbench 空状态显示：无标签时显示"请点击左侧节点开始"提示
- [ ] 25. 验证右侧栏（工具箱/属性面板）在右侧正确渲染，宽度固定
- [ ] 26. 验证右侧栏折叠功能正常，折叠后中间区域自动扩展

### 1.3 路由与布局对应验证

- [ ] 30. 访问 `/#/editor/ide/dashboard`，验证页面使用 EditorLayout（而非 BasicLayout）
- [ ] 31. 访问 `/#/editor/ide?type=interface&id=xxx`，验证页面使用 EditorLayout
- [ ] 32. 访问 `/#/editor/ide?type=logic&id=xxx`，验证页面使用 EditorLayout
- [ ] 33. 访问 `/#/topology-display`，验证页面使用 BasicLayout（简化版：Header + Content + Footer）
- [ ] 34. 访问 `/#/user`，验证页面使用 BasicLayout（简化版：Header + Content + Footer）
- [ ] 35. 访问 `/#/hierarchy-settings`，验证页面使用 BasicLayout（简化版：Header + Content + Footer）
- [ ] 36. 访问 `/#/database-manager`，验证页面使用 BasicLayout（简化版：Header + Content + Footer）
- [ ] 37. 验证路由切换时布局正确切换，无残留布局类名或样式

**IDE 模块路由格式规范**（2026-01-11 更新）：

**核心原则**：
- 禁止使用路径参数格式（如 `:type`, `:id`, `:subType`, `:subId`）
- 必须使用 query 参数传递所有类型和标识信息
- 所有 IDE 相关路由统一使用 `/#/editor/ide` 路径

**正确格式**：
- 基础格式：`/#/editor/ide?type=xxx&id=xxx`
- 扩展格式：`/#/editor/ide?type=xxx&id=xxx&subId=xxx`
- 示例1：`/#/editor/ide?type=interface&id=1007`
- 示例2：`/#/editor/ide?type=interface&id=1007&subId=1`
- 示例3：`/#/editor/ide?type=logic&id=sw_adas_plan_01`
- 示例4：`/#/editor/ide/dashboard`（无类型参数，显示仪表板）

**错误格式（禁止使用）**：
- 错误1：`/#/editor/ide/interface/1007`（使用路径参数传递 ID）
- 错误2：`/#/editor/ide/:type/:id`（使用路径参数定义路由）
- 错误3：`/#/editor/ide/interface?id=1007`（使用路径类型而非 query 参数）
- 错误4：`/#/editor/ide/:type`（使用路径参数定义类型）

**参数说明**：
- `type`：编辑器类型，可选值：`node`、`interface`、`logic`、`icd`、`packet`
- `id`：资源 ID（如协议 ID、节点 ID 等）
- `subId`：子资源 ID（如协议中的报文 ID）

**路由类型获取说明**：
- useEditorData 中的 editor_type 直接从 `route.query.type` 获取
- 不需要任何路由名称映射（ROUTE_NAME_TO_TYPE）
- 不需要根据路径推断类型
- 直接使用 query 参数的值作为编辑器类型

**路由规范验证状态（2026-01-11 验证通过）**：
- 路由配置：无动态路径参数（除 404 通配符 `/:pathMatch(.*)*` 外）
- router.push 调用：全部使用 query 参数格式
- route.params 使用：无（全部使用 route.query）
- RouterLink 组件：全部使用静态路径
- 验证结论：代码已符合规范，无需修改

### 1.4 类名与 SCSS 匹配验证（**关键**）

- [ ] 41. 读取 `ide/index.vue`，记录所有使用的类名
- [ ] 42. 读取 `ide/index.scss`，记录所有定义的类名
- [ ] 43. 逐一对比，确认 Vue 模板类名与 SCSS 定义类名**完全一致**
- [ ] 44. 确认 DOM 中**不存在** `.ide-container` 类名（应为 `.ide-layout`）
- [ ] 45. 确认 DOM 中**不存在** `.ide-main` 类名（应为 `.ide-layout-main`）
- [ ] 46. 确认 DOM 中**不存在** `.ide-workbench` 类名（应为 `.ide-layout-workbench`）
- [ ] 47. 确认 `ide.scss` 文件已被删除（避免与 `index.scss` 混淆）
- [ ] 48. 验证 SCSS 文件正确导入（`./index.scss` 而非 `./ide.scss`）
- [ ] 49. 验证 AppHeader 使用的 `.ide-header` 类在 `index.scss` 中有定义
- [ ] 50. 验证 AppFooter 使用的 `.ide-footer` 类在 `index.scss` 中有定义

### 1.5 全量内容加载状态验证

- [ ] 51. 验证 ResourceExplorer 树结构完整加载，无空白节点或加载失败
- [ ] 52. 验证体系层级树节点数据完整，无缺失的层级节点
- [ ] 53. 验证协议集树节点数据完整，报文分类和报文正确显示
- [ ] 54. 验证 TabWorkbench 标签页列表完整，无丢失的访问记录
- [ ] 55. 验证 AppHeader 系统名称正确显示（"系统1_v1.0"）
- [ ] 56. 验证 AppFooter 用户名正确显示，非"未登录"状态
- [ ] 57. 验证页面无空白模块，所有区域均有内容或合理占位
- [ ] 58. 验证页面无缺失元素，无图标不显示、文字截断等问题

---

## 第二阶段：复审层 - 主干层一致性闭环

### 2.1 交叉核验架构一致性

- [ ] 60. 验证所有 BasicLayout 页面顶栏/内容区/底栏位置一致
- [ ] 61. 验证所有 BasicLayout 页面 AppHeader 高度、样式一致
- [ ] 62. 验证所有 BasicLayout 页面 AppFooter 高度、样式一致
- [ ] 63. 验证所有 EditorLayout 页面三栏布局比例一致
- [ ] 64. 验证所有 EditorLayout 页面左侧栏宽度一致
- [ ] 65. 验证所有 EditorLayout 页面标签页栏样式一致
- [ ] 66. 验证所有页面主内容区域滚动行为一致
- [ ] 67. 验证所有页面底栏状态信息同步更新

### 2.2 布局偏离规划检查

- [ ] 70. 对比设计文档，验证 BasicLayout 结构无偏离
- [ ] 71. 对比设计文档，验证 EditorLayout 三栏布局无偏离
- [ ] 72. 验证 AppHeader 元素排列符合设计：Logo → 系统名称 → 菜单 → 搜索 → 构建 → 用户
- [ ] 73. 验证 AppFooter 元素排列符合设计：左侧状态 → 中间时间 → 右侧资源
- [ ] 74. 验证 ResourceExplorer 树结构分组符合设计：体系层级、协议与算法
- [ ] 75. 验证 TabWorkbench 标签页交互符合设计：点击切换、点击关闭、拖拽排序
- [ ] 76. 验证页面颜色主题一致，无页面间颜色突兀变化
- [ ] 77. 验证字体使用一致，无页面间字体大小突兀变化

### 2.3 全局级报错/异常检查

- [ ] 79. 打开浏览器控制台，确认无 JavaScript 错误
- [ ] 80. 确认无 Vue 组件渲染失败错误
- [ ] 81. 确认无路由跳转失败错误
- [ ] 82. 确认无 API 请求失败错误（除预期的 404 外）
- [ ] 83. 确认无 CSS 加载失败错误（Network 面板检查 SCSS 文件）
- [ ] 84. 确认无组件导入失败错误（检查 import 语句）
- [ ] 85. 确认无静态资源加载失败（图片、图标等）
- [ ] 86. 确认无 WebSocket 连接错误（如适用）
- [ ] 87. 记录所有控制台警告，评估是否需要处理

### 2.4 筛选栏规范验证（**核心要求**）

- [ ] 88. 检查所有列表页面的筛选条件区域
- [ ] 89. 验证筛选栏所有选项在一行完整展示
- [ ] 90. 确认筛选栏**不存在**"高级"按钮
- [ ] 91. 确认筛选栏**不存在**"收起/展开"按钮
- [ ] 92. 验证筛选选项数量较多时，采用横向滚动或压缩显示，**绝不**折叠

### 2.5 DOM 类名与 SCSS 定义一致性闭环

- [ ] 93. 使用浏览器开发工具检查 DOM，确认所有类名都在 SCSS 中有对应定义
- [ ] 94. 验证无未定义的类名（控制台无 "Unknown class name" 警告）
- [ ] 95. 验证无冗余的类名（SCSS 中定义但未使用的类）
- [ ] 96. 验证无重复的样式定义（同一类名在多个文件中定义）
- [ ] 97. 验证样式文件导入顺序正确，无覆盖问题

---

## 第三阶段：枝节层 - 模块内细节穿透

### 3.1 交互逻辑验证

- [ ] 100. 验证 ResourceExplorer 树节点点击交互，右侧内容正确切换
- [ ] 101. 验证 ResourceExplorer 树节点展开/折叠交互，动画流畅
- [ ] 102. 验证 ResourceExplorer 树节点右键菜单，菜单选项正确
- [ ] 103. 验证 TabWorkbench 标签页切换，内容区正确切换
- [ ] 104. 验证 TabWorkbench 标签页关闭，关闭后无残留
- [ ] 105. 验证 TabWorkbench 标签页拖拽排序（如支持）
- [ ] 106. 验证 TabWorkbench 标签页右键菜单，菜单选项正确
- [ ] 107. 验证右侧栏折叠按钮，折叠后图标正确变化
- [ ] 108. 验证 AppHeader 搜索框 Ctrl+P 快捷键，搜索弹窗正确显示
- [ ] 109. 验证 AppHeader 构建按钮，弹窗正确显示
- [ ] 110. 验证 AppHeader 用户菜单，下拉选项正确
- [ ] 111. 验证 AppFooter 状态信息，数据实时更新

### 3.2 样式规范验证

- [ ] 112. 使用浏览器开发工具检查标题字体大小为 16px
- [ ] 113. 使用浏览器开发工具检查正文字体大小为 14px
- [ ] 114. 使用浏览器开发工具检查辅助文字字体大小为 12px
- [ ] 115. 验证按钮 hover 状态样式正确
- [ ] 116. 验证按钮 active 状态样式正确
- [ ] 117. 验证输入框 focus 状态样式正确
- [ ] 118. 验证链接 hover 状态样式正确
- [ ] 119. 验证弹窗遮罩层样式正确
- [ ] 120. 验证滚动条样式统一

### 3.3 控制台错误输出机制验证

- [ ] 121. 触发路由错误（访问不存在的路由），验证 404 页面正确显示
- [ ] 122. 触发 API 错误（如无权限访问），验证错误提示正确显示
- [ ] 123. 触发表单验证错误（如必填项为空），验证错误提示正确显示
- [ ] 124. 验证所有错误信息使用中文提示
- [ ] 125. 验证错误提示包含解决方案或操作指引
- [ ] 126. 验证无未捕获的 Promise rejection
- [ ] 127. 验证无未定义的变量访问错误

### 3.4 Vue 文件固定结构验证（**新增**）

**验证状态**：已完成（2026-01-10 更新）

**Vue 文件固定结构要求**：
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
- [x] 139. template 标签必须在第一位
- [x] 140. script setup lang="ts" 标签必须在第二位
- [x] 141. 禁止使用 `<script setup>`（缺少 lang="ts"）
- [x] 142. 禁止使用 `<script lang="ts" setup>`（属性顺序错误）
- [x] 143. style lang="scss" src="./index.scss" 标签必须在最后一位
- [x] 144. 无样式时创建空的 index.scss 文件
- [x] 145. 禁止使用内联 style 属性处理静态状态样式

**修复详情**：
- 修复了 64 个不符合固定结构的 Vue 文件
- 为缺少样式的组件创建了空的 index.scss 文件
- 将内联样式迁移到 SCSS 文件
- 统一所有 style 标签格式为 `<style lang="scss" src="./index.scss"></style>`

### 3.5 文件结构验证

**验证状态**：已完成迁移（2026-01-10 更新）

- [x] 128. 验证 layouts 目录结构完整，包含 basic-layout
- [x] 129. 验证 components 目录结构完整，包含 app-header、app-footer、base 等
- [x] 130. 验证组件样式文件与组件文件同目录存放
- [x] 131. 验证样式文件命名与组件文件命名一致
- [x] 132. 验证无孤立的样式文件（无对应组件）
- [x] 133. 验证所有组件使用目录结构组织（xxx/index.vue + xxx/index.scss）
- [x] 134. 确认不存在扁平结构的组件文件（如 xxx.vue 直接放在 components/ 下）
- [x] 135. 验证组件目录包含 index.vue 和 index.scss（如有样式）
- [x] 136. 验证 index.ts 导出路径使用目录导入，无 .vue 后缀

**已迁移组件清单**（80+ 组件已完成目录结构迁移）：

**布局组件（1个）：**
- layouts/basic-layout/index.vue + index.scss

**应用级组件（2个）：**
- components/app-header/index.vue + index.scss
- components/app-footer/index.vue + index.scss

**基础组件（3个）：**
- components/base/base-button/index.vue + index.scss
- components/base/base-modal/index.vue + index.scss
- components/base/base-table/index.vue + index.scss

**节点视图组件（4个）：**
- components/node-view/editor/index.vue + index.scss
- components/node-view/nodes/vue-node/index.vue + index.scss
- components/node-view/tools/palette/index.vue + index.scss
- components/node-view/tools/setting/index.vue + index.scss

**IDE 主布局（4个）：**
- views/ide/index.vue + index.scss
- views/ide/components/resource-explorer/index.vue + index.scss
- views/ide/components/tab-workbench/index.vue + index.scss
- views/ide/components/tree-node/index.vue + index.scss

**IDE 编辑器（5个）：**
- views/ide/components/interface-editor/index.vue + index.scss
- views/ide/components/logic-editor/index.vue + index.scss
- views/ide/components/node-editor/index.vue + index.scss
- views/ide/components/node-dashboard/index.vue + index.scss
- views/ide/components/packet-definition-editor/index.vue + index.scss

**Interface Editor 新布局结构（2026-01-11 更新）：**
- 布局层级：
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
- 组件复用：BasicInfoPanel、FieldList、EditorAside、AddFieldMenu（来自 packet-definition-editor/components）
- 样式文件：interface-editor/index.scss

**IDE 弹窗（6个）：**
- views/ide/components/build-modal/index.vue + index.scss
- views/ide/components/connection-config-dialog/index.vue + index.scss
- views/ide/components/export-dialog/index.vue + index.scss
- views/ide/components/import-dialog/index.vue + index.scss
- views/ide/components/protocol-diff-dialog/index.vue + index.scss
- views/ide/components/version-history-dialog/index.vue + index.scss

**IDE 列表（1个）：**
- views/ide/components/icd-bundles-list/index.vue + index.scss

**IDE 子组件（12个）：**
- views/ide/components/interface-editor/components/packet-list-panel/index.vue + index.scss
- views/ide/components/interface-editor/components/interface-toolbar/index.vue + index.scss
- views/ide/components/logic-editor/components/logic-toolbar/index.vue + index.scss
- views/ide/components/logic-editor/components/logic-toolbox/index.vue + index.scss
- views/ide/components/logic-editor/components/logic-properties/index.vue + index.scss
- views/ide/components/logic-editor/components/logic-stats/index.vue + index.scss
- views/ide/components/resource-explorer/components/tree-context-menu/index.vue + index.scss
- views/ide/components/resource-explorer/components/tree-node-edit-dialog/index.vue + index.scss
- views/ide/components/packet-definition-editor/components/add-field-menu/index.vue
- views/ide/components/packet-definition-editor/components/basic-info-panel/index.vue
- views/ide/components/packet-definition-editor/components/field-list/index.vue
- views/ide/components/packet-definition-editor/components/field-toolbox/index.vue

**编辑器视图（4个）：**
- views/editor/welcome-page/index.vue + index.scss
- views/editor/editor-layout/index.vue + index.scss
- views/editor/components/dashboard/index.vue + index.scss
- views/editor/components/list-page/index.vue + index.scss

**报文配置（12个）：**
- views/packet-config/index.vue + index.scss
- views/packet-config/packet-list/index.vue + index.scss
- views/packet-config/packet-simulator/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/index.vue + index.scss
- views/packet-config/components/add-field-menu/index.vue + index.scss
- views/packet-config/components/code-preview-dialog/index.vue + index.scss
- views/packet-config/components/editor-toolbar/index.vue + index.scss
- views/packet-config/components/field-type-tree/index.vue + index.scss
- views/packet-config/components/packet-basic-info/index.vue + index.scss
- views/packet-config/components/packet-protocol-content/index.vue + index.scss
- views/packet-config/components/publish-dialog/index.vue + index.scss
- views/packet-config/components/publish-topology/index.vue + index.scss

**报文配置子组件（6个）：**
- views/packet-config/packet-detail-editor/editor-aside/components/array-field-editor/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/components/command-field-editor/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/components/field-editor-header/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/components/float-field-editor/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/components/numeric-field-editor/index.vue + index.scss
- views/packet-config/packet-detail-editor/editor-aside/components/value-range-list/index.vue + index.scss

**流程图（5个）：**
- views/flowchart/index.vue
- views/flowchart/components/flowchart-header/index.vue + index.scss
- views/flowchart/components/flowchart-import-dialog/index.vue + index.scss
- views/flowchart/components/flowchart-palette/index.vue + index.scss
- views/flowchart/components/flowchart-properties/index.vue + index.scss

**其他视图（12个）：**
- views/app/index.vue + index.scss
- views/error/404/index.vue + index.scss
- views/login/index.vue + index.scss
- views/user/index.vue + index.scss
- views/user/detail/index.vue + index.scss
- views/settings/index.vue + index.scss
- views/hierarchy-settings/index.vue + index.scss
- views/database-manager/index.vue + index.scss
- views/topology-display/index.vue + index.scss
- views/topology-display/detail/index.vue + index.scss
- views/system-level-design/index.vue + index.scss

**全局样式文件：**
- styles/app/index.scss（从 app.scss 迁移）
- styles/dialog-global/index.scss（从 dialog-global.scss 迁移）

**组件目录结构规范**：
- 正确：`components/editor-toolbar/index.vue` + `components/editor-toolbar/index.scss`
- 错误：`components/editor-toolbar.vue` + `components/editor-toolbar.scss`

### 3.6 路由与配置验证

- [ ] 146. 验证路由 meta.layout 配置正确
- [ ] 147. 验证路由 meta.title 配置正确
- [ ] 148. 验证路由 meta.icon 配置正确
- [ ] 149. 验证路由 meta.cache 配置正确
- [ ] 150. 验证 query 参数解析正确（route.query.type, route.query.id, route.query.subId）
- [ ] 151. 验证路由守卫拦截逻辑正确

**路由参数验证（重要）**：
- [ ] 152. 验证 IDE 编辑器路由不使用路径参数（如 `:type`, `:id`）
- [ ] 153. 验证 IDE 编辑器路由使用 query 参数传递类型和 ID
- [ ] 154. 验证路由跳转代码使用 `router.push({ path: '/editor/ide', query: { type, id } })` 格式
- [ ] 155. 验证不存在 `router.push(\`/editor/ide/${type}/${id}\`)` 格式的跳转代码

### 3.7 Interface Editor 布局验证（2026-01-11 更新）

**验证状态**：待验证

**布局结构**：
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

**验证检查项**：
- [ ] 152. 访问 interface-editor 路由，验证根容器类名为 `.ide-interface-editor`
- [ ] 153. 验证左侧报文列表 `.ide-interface-packets` 宽度为 180px
- [ ] 154. 验证右侧内容区 `.ide-interface-content` 存在且占据剩余空间 (flex: 1)
- [ ] 155. 验证顶部控制栏 `.ide-interface-content-toolbox` 存在且高度固定
- [ ] 156. 验证底部内容区 `.ide-interface-content-main` 使用 flex 布局
- [ ] 157. 验证左侧信息区 `.ide-interface-cm-info` 存在且占据剩余空间
- [ ] 158. 验证右侧属性面板 `.ide-interface-cm-attr` 存在且宽度为 280px
- [ ] 159. 验证 BasicInfoPanel 组件正确渲染
- [ ] 160. 验证 FieldList 组件正确渲染
- [ ] 161. 验证 EditorAside 组件正确渲染
- [ ] 162. 验证 AddFieldMenu 组件正确渲染
- [ ] 163. 验证所有 CSS 类名在 index.scss 中有定义
- [ ] 164. 验证布局在不同内容高度下滚动行为正确
- [ ] 165. 验证报文列表选中状态 `.ide-packet-item--active` 样式正确

### 3.8 样式复用验证

- [ ] 166. 验证 AppHeader 复用 `.ide-header*` 样式类
- [ ] 167. 验证 AppFooter 复用 `.ide-footer*` 样式类
- [ ] 168. 验证 AppTabs 复用 `.ide-tabs*` 样式类
- [ ] 169. 验证无重复定义的样式
- [ ] 170. 验证样式变量使用一致

### 3.9 代码规范验证

- [ ] 171. 验证 SCSS 样式无 `&` 嵌套符号
- [ ] 172. 验证 SCSS 样式使用完整路径选择器
- [ ] 173. 验证代码注释使用中文
- [ ] 174. 验证代码无 AI 签名或版权信息
- [ ] 175. 验证变量命名使用 snake_case
- [ ] 176. 验证 TypeScript interface/type 名称使用 camelCase
- [ ] 177. 验证类型定义内部的字段名使用 snake_case

**命名规范说明**：
- 变量名（含局部变量）使用 snake_case：`const grid_strategy = ...`
- TypeScript interface/type 名称使用 camelCase：`interface CacheLoadOptions<T> { ... }`
- 类型定义内部的字段名使用 snake_case：`interface CacheLoadOptions<T> { cache_key: string }`
- 这是 TypeScript 社区的通用惯例，interface/type 名称使用 camelCase 与变量名规范不同

### 3.10 性能验证

- [ ] 176. 验证页面首次加载时间在可接受范围内
- [ ] 177. 验证路由切换无明显卡顿
- [ ] 178. 验证大数据量列表渲染性能
- [ ] 179. 验证无内存泄漏（路由切换后组件正确销毁）

### 3.11 响应式设计规范验证（重要）

**验证状态**：已通过（2026-01-10）

- [x] 180. 验证所有样式文件不包含屏幕尺寸适配的 @media 查询
- [x] 181. 验证无移动端、平板等不同设备的适配代码
- [x] 182. 验证页面按固定尺寸设计（桌面端 1920x1080 为基准）
- [x] 183. 确认无障碍相关的 @media 查询已保留：
  - `@media (prefers-reduced-motion: reduce)` - 减少动画
  - `@media (prefers-contrast: high)` - 高对比度模式

**验证详情**：
- 搜索范围：`client/src/**/*.scss`
- 发现的 @media 查询：
  - `@media (prefers-reduced-motion: reduce)` - index.scss:1462
  - `@media (prefers-contrast: high)` - index.scss:1471（使用 `html` 选择器，不嵌套 `:root`）
- 结论：所有 @media 查询均为无障碍相关，符合"本项目不需要考虑响应式设计"的规范

### 3.12 SCSS 模块导入规范验证（2026-01-11 更新）

**验证状态**：已完成

- [x] 184. 验证 SCSS 模块导入使用 `@use` 替代 `@import`
- [x] 185. 确认 CSS 文件导入（如 remixicon.css）保留 `@import` 语法
- [x] 186. 验证 `@use` 语句位于文件最开头（在注释之后）
- [x] 187. 验证 `@use` 使用 `as *` 语法导入变量和 mixin
- [x] 188. 确认构建成功，无 SCSS 语法错误

**迁移完成的文件**：
- `src/styles/index.scss` - 主样式入口（@use 移至文件顶部）
- `src/layouts/basic-layout/index.scss` - 布局样式（@import 替换为 @use）

**正确示例**：
```scss
// 文件顶部：注释
@use '@/views/ide/index.scss' as *;

// CSS 文件导入（在 @use 之后）
@import 'remixicon/fonts/remixicon.css';

// 其他样式规则
.component { }
```

---

## 验证方法说明

### 使用浏览器开发工具进行 DOM 验证

1. 使用 chrome-devtools-mcp 工具导航到测试页面（如 `/#/editor/ide/dashboard`）
2. 使用浏览器开发者工具检查 DOM 结构
3. 检查根容器类名是否为 `.ide-layout`（而非 `.ide-container`）
4. 检查子元素类名是否与 SCSS 定义一致
5. 截图分析页面，确认布局不是"上下两层"**

### 类名匹配验证方法

1. 读取组件 Vue 文件，记录使用的类名
2. 读取对应的 SCSS 文件，记录定义的类名
3. 逐一对比，确保完全匹配
4. 特别注意：组件类名与 SCSS 定义必须**逐字一致**

---

## 常见问题检查清单

### 问题1：布局是"上下两层"

**症状**：页面显示为上下两大块，中间内容区域不显示

**根本原因**：类名与 SCSS 定义不匹配，导致 flexbox 布局未生效

**检查点**：
- 根容器类名是否为 `.ide-layout`（而非 `.ide-container`）
- `.ide-layout-main` 类名是否正确（而非 `.ide-main`）
- SCSS 文件是否正确导入（`./index.scss` 而非 `./ide.scss`）
- 类名是否与 SCSS 定义完全匹配

### 问题2：筛选栏不符合规范

**症状**：筛选栏有"高级"或"收起"按钮，筛选选项被折叠

**检查点**：
- 筛选栏所有选项是否在一行完整展示
- 是否存在"高级"按钮
- 是否存在"收起/展开"按钮
- 选项较多时是否采用横向滚动或压缩显示

### 问题3：全量内容未加载

**症状**：页面有空白模块，数据未显示

**检查点**：
- ResourceExplorer 树结构是否完整
- TabWorkbench 标签页列表是否完整
- AppHeader/AppFooter 信息是否完整
- 控制台是否有加载错误

---

## 历史问题记录

### 2025-01-10：类名不匹配导致布局失效

**问题描述**：
- Vue 模板使用 `.ide-container`、`.ide-main`、`.ide-workbench`
- SCSS 文件定义 `.ide-layout`、`.ide-layout-main`、`.ide-layout-workbench`
- 原 `ide.scss` 文件未被导入，导致样式失效

**发现过程**：
1. 用户反馈页面布局是"上下两层"
2. 通过浏览器开发工具检查实际 DOM 结构
3. 发现根容器使用 `.ide-container`，但 SCSS 中未定义该类
4. 发现 `ide.scss` 文件存在但未被导入

**解决方案**：
1. 修改 Vue 模板类名与 SCSS 定义一致
2. 删除未使用的 `ide.scss` 文件

**教训**：
- **必须通过浏览器开发工具实际检查 DOM 结构**
- **不能仅凭代码文件存在就断言布局正确**
- **必须验证类名与 SCSS 定义的匹配关系**
- **必须使用 MCP 工具截图查看页面，确认视觉布局正确**

---

## 附录A：路由布局验证清单

### 路由清单

| # | 路由 | 名称 | 布局类型 | 组件 | 状态 |
|---|------|------|----------|------|------|
| 1 | `/` | Welcome | 无布局 | WelcomePage | [ ] |
| 2 | `/login` | Login | 无布局 | Login | [ ] |
| 3 | `/editor/ide/dashboard` | Dashboard | EditorLayout | Dashboard | [ ] |
| 4 | `/editor/ide/node/list` | NodeList | EditorLayout | ListPage | [ ] |
| 5 | `/editor/ide?type=node&id=xxx` | NodeEditor | EditorLayout | EditorLayout | [ ] |
| 6 | `/editor/ide/interface/list` | InterfaceList | EditorLayout | ListPage | [ ] |
| 7 | `/editor/ide?type=interface&id=xxx` | InterfaceEditor | EditorLayout | EditorLayout | [ ] |
| 8 | `/editor/ide/logic/list` | LogicList | EditorLayout | ListPage | [ ] |
| 9 | `/editor/ide?type=logic&id=xxx` | LogicEditor | EditorLayout | EditorLayout | [ ] |
| 10 | `/editor/ide/icd/list` | IcdList | EditorLayout | ListPage | [ ] |
| 11 | `/editor/ide?type=icd&id=xxx` | IcdEditor | EditorLayout | EditorLayout | [ ] |
| 12 | `/editor/ide/packet/list` | PacketList | EditorLayout | ListPage | [ ] |
| 13 | `/editor/ide?type=packet&id=xxx` | PacketEditor | EditorLayout | EditorLayout | [ ] |
| 14 | `/topology-display` | TopologyDisplay | BasicLayout | TopologyDisplay | [ ] |
| 15 | `/topology-display/detail` | TopologyDetail | BasicLayout | TopologyDetail | [ ] |
| 16 | `/user` | User | BasicLayout | User | [ ] |
| 17 | `/user/detail` | UserDetail | BasicLayout | UserDetail | [ ] |
| 18 | `/settings` | Settings | BasicLayout | Settings | [ ] |
| 19 | `/hierarchy-settings` | HierarchySettings | BasicLayout | HierarchySettings | [ ] |
| 20 | `/database-manager` | DatabaseManager | BasicLayout | DatabaseManager | [ ] |
| 21 | `/:pathMatch(.*)*` | NotFound | 无布局 | 404 | [ ] |

### 路由布局验证方法

1. **导航到路由** - 使用 chrome-devtools-mcp 工具自主导航到目标路由
2. **获取 DOM 快照** - 截图获取页面结构
3. **文字可视化** - 将快照转换为树状文字布局
4. **保存到文档** - 更新到 `ROUTE_LAYOUT_VISUALIZATION.md`

**详细布局文档**: 参见 `ROUTE_LAYOUT_VISUALIZATION.md`

### 布局类型识别

**EditorLayout 特征**:
- 根容器类名: `.ide-layout`
- 包含: banner (AppHeader) + complementary (ResourceExplorer) + 内容区 + contentinfo (AppFooter)
- 使用路由: `/editor/ide/*` 系列

**BasicLayout 特征**:
- 根容器类名: `.cssc-basic-layout`
- 包含: banner (AppHeader) + complementary (Sidebar) + main + contentinfo (AppFooter)
- 使用路由: `/user`, `/settings`, `/hierarchy-settings`, `/database-manager`, `/topology-display` 等

---

## 附录B：设计文档对照表

| 验证项 | 设计文档章节 | 对应内容 |
|--------|-------------|----------|
| BasicLayout | 1.1 | 应用级布局结构 |
| DashboardLayout | 1.2 | Dashboard 模式布局 |
| EditorLayout | 1.3 | Editor 模式布局 |
| 组件目录结构 | 二 | layouts/ 和 components/ 目录 |
| AppHeader | 3.1 | 应用级顶栏功能清单 |
| AppFooter | 3.2 | 应用级底栏功能清单 |
| 路由规范 | 四 | 路由模式、Meta 字段、动态路由 |
| 迁移策略 | 六 | 组件分类、样式复用、实施顺序 |
| 样式复用 | 6.3 | 直接复用现有 `.ide-*` 样式类 |

---

*文档版本: 4.8*
*检查项总数: 179 + 21路由验证 + 4路由参数验证*
*最后更新: 2026-01-11（路由规范强化：明确禁止使用路径参数格式（:type, :id, :subType, :subId），必须使用 query 参数传递所有类型和标识信息）*

## 全局 CSS 变量规范（2026-01-11 更新）

### 变量命名规范

- 禁止使用"模块专用变量"概念
- 全局变量就是通用的，所有人都要遵守
- 原 `--ide-*` 变量已重命名为通用的 `--component-*` 变量

### 禁止硬编码颜色（2026-01-11 更新）

- 禁止使用硬编码颜色值（如 `#ffffff`、`rgb(255, 255, 255)`、`rgba(0, 0, 0, 0.1)`）
- 所有颜色必须使用 CSS 变量引用（如 `var(--color-bg-container)`）
- 全局 CSS 变量统一定义在 `client/src/styles/index.scss` 中的 `:root` 选择器内
- 如需新的颜色变量，在 `index.scss` 中添加语义化的变量名
- 已完成颜色转换：60+ 文件，200+ 处硬编码颜色已转换为 CSS 变量

### 通用组件变量列表

| 变量名 | 用途 | 默认值（light 主题） |
|--------|------|---------------------|
| `--component-bg-elevated` | 提升背景 | #f8fafc |
| `--component-bg-surface` | 表面背景 | #ffffff |
| `--component-border` | 边框颜色 | #e2e8f0 |
| `--component-primary` | 主色调 | #3b82f6 |
| `--component-text-primary` | 主文本 | #1e293b |
| `--component-text-secondary` | 次文本 | #64748b |
| `--component-text-tertiary` | 辅助文本 | #94a3b8 |
| `--component-header-bg` | 顶栏背景 | #3b82f6 |
| `--component-header-color` | 顶栏颜色 | #ffffff |
| `--component-tree-hover` | 树节点悬停 | #e2e8f0 |
| `--component-tree-selected` | 树节点选中 | #dbeafe |
| `--component-tree-selected-color` | 树节点选中文字 | #1d4ed8 |
| `--component-tabs-bar-bg` | 标签栏背景 | #f1f5f9 |
| `--component-tab-bg` | 标签背景 | #f8fafc |
| `--component-tab-active-bg` | 激活标签背景 | #ffffff |
| `--component-input-bg` | 输入框背景 | #ffffff |
| `--component-input-border` | 输入框边框 | #e2e8f0 |
| `--component-menu-bg` | 菜单背景 | #ffffff |

### 主题切换规范

- 默认主题为 light，不跟随系统
- main.js 强制覆盖为 light 主题（不再从 localStorage 恢复）
- 主题切换通过 `data-theme` 属性控制
- 深色主题值在 `[data-theme="dark"]` 选择器中定义
- 禁止使用 `prefers-color-scheme` 媒体查询自动切换
- 全局变量只在 `:root` 中定义一处，高对比度模式使用 `html` 选择器覆盖
- main.js 在 app mount 之前初始化主题，确保默认为 light
- 主题切换由用户主动控制，不自动跟随系统

### 修复历史（2026-01-10）

**问题1：主题初始化会从 localStorage 恢复**
- 症状：如果用户之前选择了 dark 主题，刷新页面后会自动恢复为 dark
- 根因：main.js 从 localStorage 读取并应用保存的主题
- 解决：main.js 强制覆盖为 light，不再从 localStorage 恢复主题
- 影响：无论用户之前保存了什么主题，刷新页面后始终默认为 light

**问题2：主题持久化导致刷新后主题恢复**
- 症状：即使 main.js 强制设置 light，pinia 插件仍然会从 localStorage 恢复旧值
- 根因：stores/app.ts 的 `persist` 配置没有排除 theme 字段
- 解决：在 stores/app.ts 中添加 `persist.paths: ['language', 'sidebarCollapsed']`，排除 theme
- 影响：主题状态不再持久化，每次刷新都默认为 light

**问题3：模块专用变量定义**
- 症状：`packet-list/index.scss` 和 `editor/index.scss` 使用了 Element Plus 专有变量
- 根因：部分模块使用了 `--el-*` 变量，这些变量未在全局定义
- 解决：
  - 移除 `packet-list/index.scss` 中重复的 Element Plus 变量定义
  - 将 `editor/index.scss` 中的 Element Plus 变量替换为全局通用变量
- 影响：所有样式统一使用全局变量系统

**问题4：组件样式使用硬编码颜色**
- 症状：部分组件样式文件使用硬编码的 rgb() 颜色值，导致主题切换失效
- 根因：开发人员直接使用硬编码颜色而不是 CSS 变量
- 解决：以下组件的样式文件已修复，所有硬编码颜色替换为 CSS 变量
  - `resource-explorer/index.scss` - 资源浏览器样式
  - `tree-node/index.scss` - 树节点样式
  - `build-modal/index.scss` - 构建弹窗样式
  - `export-dialog/index.scss` - 导出弹窗样式
  - `protocol-diff-dialog/index.scss` - 协议对比弹窗样式
  - `version-history-dialog/index.scss` - 版本历史弹窗样式
- 影响：所有 IDE 组件样式正确响应主题切换

**问题5：全量硬编码颜色转换（2026-01-11）**
- 症状：大量 SCSS 文件使用硬编码颜色值（#ffffff、rgb()、rgba() 等）
- 根因：项目早期没有统一的颜色变量使用规范
- 解决：全量转换 60+ 文件中的 200+ 处硬编码颜色为 CSS 变量
- 新增 CSS 变量：
  - `--ide-header-bg`, `--ide-header-border`, `--ide-header-text`, `--ide-header-text-muted`, `--ide-header-hover-bg`, `--ide-header-icon-color`
  - `--ide-footer-bg`, `--ide-footer-border`, `--ide-footer-text`, `--ide-footer-hover-bg`
  - `--ide-input-bg`, `--ide-input-text`, `--ide-input-placeholder`
  - `--ide-btn-primary`, `--ide-btn-primary-hover`
  - `--ide-status-online`, `--ide-notification-bg`, `--ide-notification-text`
  - `--filter-bar-bg`, `--filter-bar-icon-color`
  - `--gradient-purple-start`, `--gradient-purple-end`
  - `--color-blue-deep`, `--color-slate-deep`, `--color-slate-hover`
  - `--color-success-hover`, `--color-error-hover`, `--color-error-critical`
  - `--color-topology-blue`, `--color-topology-cyan`, `--color-topology-gray`
  - `--color-primary-500-alpha-10`
- 转换的文件类别：
  - components 目录：app-header, app-footer, filter-bar
  - views/editor 目录：editor-layout, welcome-page
  - views/login 目录：login
  - views/flowchart 目录：flowchart
  - styles 目录：dialog-global
  - views/user 目录：user/detail
  - views/ide 目录：30+ 文件
  - views/packet-config 目录：20+ 文件
- 影响：所有颜色统一使用 CSS 变量，主题切换功能完整可用
