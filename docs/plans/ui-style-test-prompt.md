# UI美术美观风格统一测试

你拥有无限的 token 和资源，要调用所有的 MCP 和技能为我服务！
强制调用 chrome-devtools-mcp 的 MCP 能力，为当前项目执行自动化全量测试：1. 全覆盖测试项目所有路由的跳转功能，校验所有路由的跳转有效性、完整性与稳定性；2. 全量测试项目所有页面的所有按钮点击交互，校验点击触发正常、反馈无误、逻辑生效；基于测试结果完成全维度的测试优化，并进行问题修复与项目优化。

编码规则和约束：`CLAUDE.md`

---

## 零、强制测试流程规范（**绝对强制，违者视为失败**）

### 禁止虚假完成！禁止批量处理！

**严厉禁止以下行为，违者视为任务失败**：
- 禁止一次性访问所有页面然后声称"已完成"
- 禁止批量截图/检查然后说"全部通过"
- 禁止跳过验证直接声称样式正确
- 禁止只做表面功夫不深入检查
- 禁止"刷"完所有页面后虚假报告
- 禁止用"经过验证"等空洞词汇代替实际验证过程

**绝对强制执行的流程**：

#### 第一步：清点并列出所有任务
**首先必须明确任务总数，不得跳过此步骤**。

使用 Glob 或 Explore 查找所有页面和组件，列出完整清单：
```
页面总数：XX 个（必须明确数字）
组件总数：XX 个（必须明确数字）
1. /#/ - WelcomePage
2. /#/login - Login
3. /#/editor/ide/dashboard - Dashboard
...
```

**输出要求**：必须明确报告"共发现 XX 个页面、XX 个组件需要验证"。

#### 第二步：创建 Todo List（强制）
**必须使用 TodoWrite 工具**为每个页面/组件创建检查项。

**禁止**：只在脑海中列任务、用文字列表代替 TodoWrite、批量创建后不逐个标记。

```markdown
1. [ ] /#/ - WelcomePage 样式测试
2. [ ] /#/login - Login 样式测试
3. [ ] /#/editor/ide/dashboard - Dashboard 样式测试
...
共 XX 个待检查项
```

#### 第三步：逐个测试验证（核心）
**每次只处理一个页面，完成并验证通过后，才能进行下一个**。

**操作流程**：
1. 选中第一个待测页面（标记为 in_progress）
2. 使用 chrome-devtools-mcp 工具自主打开该页面
3. 截图并分析页面，逐项验证所有样式检查点
4. **必须调用子代理交叉验证**：使用 Task 工具调用 code-reviewer 进行样式审查
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
  prompt: '验收 /#/editor/ide/dashboard 页面的UI风格是否符合设计规范...'
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
- [completed] /#/ - WelcomePage 样式测试
- [completed] /#/login - Login 样式测试
- [completed] /#/editor/ide/dashboard - Dashboard 样式测试
- [in_progress] /#/user - User 样式测试 ← 当前
- [pending] /#/settings - Settings 样式测试
...
```

**禁止**：报告"已完成80%"但无法提供具体的 completed/in_progress/pending 状态列表。

---

## 一、任务定义

**核心职责**：专注于 UI 美术风格的统一性、视觉一致性和美观度

**不需要关心**：功能逻辑是否正确、交互流程是否合理、业务逻辑是否完整

**测试范围限定**：
- 只检查浅色模式下的UI风格，不检查暗色模式
- 不需要考虑响应式/移动端适配
- 禁止修改主题切换相关逻辑
- **禁止使用 @media 查询进行屏幕尺寸适配**

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
| 架构设计 | `docs/plans/2025-01-10-frontend-architecture-refactor-design.md` | 布局层级、组件结构 |
| 路由测试矩阵 | `docs/tests/ROUTE_TEST_MATRIX.md` | 完整路由清单、历史测试记录 |
| Chrome MCP指南 | `docs/plans/chrome-mcp-route-test-prompt.md` | chrome-devtools-mcp MCP 使用 |

**当前路由格式规范（重要）**：

**核心原则**：
- React/Vue Router 使用 hash 模式
- 禁止使用路径参数格式（如 `:type`, `:id`, `:subType`, `:subId`）
- 必须使用查询参数（query）格式传递所有参数

**正确与错误示例对比**：

| 场景 | 正确格式（使用 query） | 错误格式（使用路径参数） |
|------|----------------------|----------------------|
| IDE 详情页 | `/#/editor/ide?type=interface&id=1007` | `/#/editor/ide/interface/1007` |
| IDE 详情页（带子ID） | `/#/editor/ide?type=interface&id=1007&subId=1` | `/#/editor/ide/interface/1007/1` |
| 路由跳转代码 | `router.push({ path: '/editor/ide', query: { type: 'interface', id: '1007' } })` | `router.push(\`/editor/ide/interface/\${id}\`)` |

**路由规范验证状态（2026-01-11 验证通过）**：
- 路由配置：无动态路径参数（除 404 通配符外）
- router.push 调用：全部使用 query 参数格式
- route.params 使用：无（全部使用 route.query）
- RouterLink 组件：全部使用静态路径
- 验证结论：代码已符合规范，无需修改

**IDE 模块路由格式**：

详情页路由（统一格式）：
- 路由格式：`/#/editor/ide?type={type}&id={resourceId}`
- type 参数：node | interface | logic | icd | packet
- id 参数：资源 ID
- 可选参数：subId（子资源ID）
- 示例：
  - `/#/editor/ide?type=node&id=1`
  - `/#/editor/ide?type=interface&id=2`
  - `/#/editor/ide?type=interface&id=1007&subId=1`

特殊页面：
- 仪表板：`/#/editor/ide/dashboard`
- 欢迎页：`#/`
- 登录页：`#/login`

**实现要点**：
- 路由组件根据 `route.query.type` 动态加载对应的编辑器组件
- 不需要路由名称映射，直接使用 query 参数判断类型
- 所有参数必须通过 query 传递，禁止使用路径参数

---

## 四、Vue 文件固定结构验证（必读）

### 4.1 Vue 文件结构规范

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
- 禁止使用 `<script setup>`（缺少 lang="ts"）
- 禁止使用 `<script lang="ts" setup>`（属性顺序错误）
- style lang="scss" src="./index.scss" 标签必须在最后一位
- 无样式时必须创建空的 index.scss 文件
- 禁止使用内联 style 属性处理静态状态样式

### 4.2 样式统一管理原则

1. 所有样式统一维护在 `./index.scss` 中
2. 禁止在 Vue 文件 `<style>` 标签内编写样式
3. 禁止使用内联 `style` 属性处理动态样式
4. 动态样式使用 CSS 类名修饰符
5. 全局样式变量统一定义

### 4.3 CSS/SCSS 选择器规范

**必须遵循**：
- 根据HTML和Vue的嵌套结构，使用完整路径选择器
- 禁止使用嵌套选择器中的 "&" 符号
- 禁止使用 "%" 符号
- 所有选择器必须使用完整路径，确保可追溯性

### 4.3.1 SCSS 模块导入规范（2026-01-11 更新）

**核心原则：必须使用 `@use` 替代 `@import`**

| 导入类型 | 语法 | 说明 |
|---------|------|------|
| SCSS 文件 | `@use 'path/to/file' as *;` | 导入 SCSS 模块，使用 `as *` 直接引入变量和 mixin |
| CSS 文件 | `@import 'path/to/file.css';` | CSS 文件必须使用 `@import`（不支持 `@use`） |

**`@use` 规则约束**：
- `@use` 必须写在文件最开头，在任何其他规则之前
- 唯一可以放在 `@use` 之前的是注释
- CSS 文件的 `@import` 应该放在 `@use` 之后

**正确示例**：
```scss
// 文件顶部：注释
@use '@/views/ide/index.scss' as *;

// CSS 文件导入（在 @use 之后）
@import 'remixicon/fonts/remixicon.css';

// 其他样式规则
.component { }
```

**错误示例**：
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

### 4.4 颜色使用规范（2026-01-11 更新）

- 禁止使用硬编码颜色值（如 `#ffffff`、`rgb(255, 255, 255)`、`rgba(0, 0, 0, 0.1)`）
- 所有颜色必须使用 CSS 变量引用（如 `var(--color-bg-container)`）
- 全局 CSS 变量统一在 `client/src/styles/index.scss` 中定义
- 使用通用的 `--component-*` 变量，所有模块共享
- 禁止使用"模块专用变量"概念
- 全局变量只在 `:root` 中定义一处
- 如需新的颜色变量，在 `index.scss` 中添加语义化的变量名
- 同一功能状态的颜色必须统一

### 4.5 图标使用规范

- 项目已安装 `@tabler/icons-react` (v3.36.0)
- 所有新功能图标必须使用此库
- 禁止手搓 SVG 图标组件
- 图标尺寸、线条粗细应保持一致

### 4.6 间距系统规范

- 使用统一的间距单位（如 4px、8px、12px、16px、24px、32px）
- 组件内边距遵循统一的间距阶梯
- 组件外边距遵循统一的间距阶梯
- 相同级别的组件应使用相同的间距

---

## 五、CSS 变量与主题约束（重要）

### 全局 CSS 变量规范

**核心原则**：
- 全局 CSS 变量统一定义在 `client/src/styles/index.scss` 中的 `:root` 选择器内
- 禁止存在"模块专用变量"概念，全局变量就是通用的
- 变量命名使用通用前缀（如 `--component-*`），而非模块特定前缀
- 全局变量只在 `:root` 中定义一处，高对比度模式使用 `html` 选择器覆盖

### 主题默认与切换规范

**默认主题**：
- 应用始终默认使用浅色（light）主题
- 禁止自动跟随系统设置
- 禁止使用 `prefers-color-scheme` 媒体查询

**禁止硬编码颜色（2026-01-11 更新）**：
- 样式中的颜色值必须引用 CSS 变量
- 禁止直接硬编码颜色值（如 `#0f172a`, `#1e293b`, `#ffffff`, `rgb(255, 255, 255)`）
- 硬编码颜色会导致主题切换失效
- 如需新的颜色变量，在 `client/src/styles/index.scss` 中添加语义化的变量名

---

## 六、视觉设计系统检查项

### 6.1 色彩系统
- 主色调统一，不超过3种主要颜色
- 文字颜色层级分明
- 背景色层级分明
- 边框颜色层级分明
- 功能色统一（成功、错误、警告、信息）
- 颜色语义化使用正确

### 6.2 字体排版系统
- 字体大小层级清晰
- 字重使用合理
- 行高与段落间距统一
- 文字对齐正确

### 6.3 间距与布局系统
- 组件内边距统一
- 组件外边距统一
- 圆角系统统一
- 布局对齐正确

### 6.4 图标系统
- 图标尺寸统一
- 图标线条粗细统一
- 图标颜色统一
- 图标与文字搭配合理

### 6.5 按钮与控件系统
- 按钮层级分明
- 按钮尺寸统一
- 按钮状态样式完整
- 输入框样式统一
- 选择控件样式统一

### 6.6 卡片与容器系统
- 卡片样式统一
- 卡片内容布局统一
- 模态框与弹窗样式统一
- 侧边栏与抽屉样式统一

### 6.7 列表与表格系统
- 列表样式统一
- 表格样式统一
- 排序与筛选样式统一

### 6.8 反馈与提示系统
- 加载状态样式统一
- 成功提示样式统一
- 错误提示样式统一
- 警告与确认样式统一

### 6.9 导航系统
- 顶部导航样式统一
- 侧边导航样式统一
- 面包屑导航样式统一
- Tab 导航样式统一

### 6.10 数据可视化
- 图表样式统一
- 数据标签与徽章样式统一

### 6.11 空状态与占位符
- 空状态样式统一
- 占位符与骨架屏样式统一

### 6.12 动画与过渡
- 过渡动画流畅
- 加载动画样式统一

---

## 十四、Interface Editor 布局验证（2026-01-11 更新）

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

### Interface Editor 样式验证项

- [ ] 验证左侧报文列表 (ide-interface-packets) 宽度为 180px
- [ ] 验证右侧内容区 (ide-interface-content) 占据剩余空间 (flex: 1)
- [ ] 验证顶部控制栏 (ide-interface-content-toolbox) 高度固定，不随内容变化
- [ ] 验证底部内容区 (ide-interface-content-main) 使用 flex 布局，左右分区
- [ ] 验证左侧信息区 (ide-interface-cm-info) 占据剩余空间 (flex: 1)
- [ ] 验证右侧属性面板 (ide-interface-cm-attr) 宽度为 280px，固定不变
- [ ] 验证报文列表边框颜色使用 var(--color-border-secondary)
- [ ] 验证属性面板背景色使用 var(--color-bg-secondary)
- [ ] 验证所有分割线颜色一致
- [ ] 验证控制栏按钮样式统一（primary、success、danger）
- [ ] 验证选中报文项高亮样式（ide-packet-item--active）

---

## 七、命名规范检查项（重要）

### 7.1 TypeScript 类型定义命名

- [ ] 验证 interface/type 名称使用 camelCase（如 CacheLoadOptions、FieldConfig、TabInfo）
- [ ] 验证类型定义内部的字段名使用 snake_case
- [ ] 验证变量名（含局部变量）使用 snake_case
- [ ] 验证集合变量名使用 snake_case + list 后缀

**命名规范说明**：
- TypeScript 的 `interface` 和 `type` 名称使用 camelCase：`interface CacheLoadOptions<T> { ... }`
- 这是 TypeScript 社区的通用惯例，与变量名的 snake_case 规范不同
- 类型定义内部的字段名仍使用 snake_case：`interface CacheLoadOptions<T> { cache_key: string }`

---

## 八、样式代码质量检查项

### 8.1 代码组织
- 样式统一在 index.scss 中
- 选择器按页面/组件分组
- 相关样式就近放置
- 全局变量定义在顶部

### 7.2 选择器质量
- 选择器路径完整
- 不使用过深嵌套
- 不使用通配符选择器
- 不使用 !important（除特殊情况）
- 选择器命名语义化

### 7.3 样式复用
- 相同样式提取为类
- 使用 CSS 变量管理重复值
- 不重复定义相同样式

### 7.4 响应式设计验证（重要）
- 确认所有样式文件不包含屏幕尺寸适配的 @media 查询
- 确认只保留无障碍相关的 @media 查询

---

## 八、子代理使用规范

### 子代理类型与用途

| 子代理类型 | 用途 | 使用场景 |
|------------|------|----------|
| Explore | 快速探索代码库 | 查找样式文件、搜索样式定义 |
| general-purpose | 执行复杂多步骤任务 | 多轮样式搜索、样式问题分析 |
| code-reviewer | 代码审查 | 测试完成后审查样式代码质量 |

### 并行调用规范

**可以并行调用的场景**：
- 探索多个独立目录
- 分析多个独立组件样式
- 搜索多个样式问题

**必须串行调用的场景**：
- 依赖前序结果
- 同一资源分析
- 样式修复流程

---

## 九、测试执行流程

### 第一步：样式结构审查

1. 调用 Explore 子代理查找所有 .scss 样式文件
2. 读取 `client/index.scss`，分析现有样式组织
3. 验证选择器是否符合完整路径规范
4. 验证 SCSS 模块导入是否使用 `@use` 而非 `@import`（CSS 文件除外）
5. 分析内联 style 属性使用情况

### 第二步：浏览器可视化验证

**重要：使用 MCP 工具自主完成验证！**

测试方法：
1. 使用 chrome-devtools-mcp 工具自主打开对应页面
2. 截图并分析页面，对照检查项逐项验证
3. 打开一个网页，验证一个是否符合要求
4. 发现不符合的项，直接说明问题并提供修复方案
5. 修复后使用 MCP 工具刷新页面重新验证

### 第三步：视觉走查

按以下顺序进行：
1. 色彩系统检查
2. 字体排版检查
3. 间距布局检查
4. 组件样式检查
5. 状态样式检查

### 第四步：问题记录与修复

1. 记录问题位置（文件:行号）
2. 说明违反哪条规范
3. 提供修复方案
4. 使用 MCP 工具刷新页面验证修复效果

---

## 十、输出格式

```markdown
## UI风格测试报告 - [日期]

### 一、样式结构审查
- 样式统一管理检查：状态/问题描述
- 选择器规范检查：状态/问题描述
- 内联样式检查：状态/问题描述
- 样式变量检查：状态/问题描述

### 二、视觉设计系统检查
- 色彩系统：状态/问题描述
- 字体排版：状态/问题描述
- 间距与布局：状态/问题描述
- 图标系统：状态/问题描述
- 按钮与控件：状态/问题描述
- 卡片与容器：状态/问题描述
- 列表与表格：状态/问题描述
- 反馈与提示：状态/问题描述
- 导航系统：状态/问题描述

### 三、发现的问题

| 序号 | 问题描述 | 位置 | 违反规范 | 严重程度 | 当前状态 |
|------|----------|------|----------|----------|----------|
| 1 | ... | ... | ... | ... | ... |

### 四、下一步计划
- [待完成任务]
```

---

## 十一、问题严重程度定义

| 级别 | 定义 | 处理方式 |
|------|------|----------|
| P0 | 严重破坏视觉一致性问题 | 立即修复 |
| P1 | 明显影响视觉体验问题 | 优先修复 |
| P2 | 一般视觉问题 | 也要修复 |
| P3 | 轻微视觉优化建议 | 也要修复 |

---

## 十二、禁止事项

1. 禁止在没有完全理解依赖关系时进行大规模重构
2. 禁止跳过验证直接声称功能正常
3. 禁止使用项目不支持的代码模式
4. 禁止修改核心架构而不向用户确认
5. **绝对禁止执行 git push**
6. **禁止在 commit 消息中包含 AI 签名**

---

**请专注于 UI 美术风格的统一性和美观度，用挑剔的眼光发现每一个视觉不一致的地方，并提出修复方案。**
