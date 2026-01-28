# 前端架构重构设计文档

## 一、架构概览

### 1.1 应用级布局 (BasicLayout)

**文件位置**: `layouts/basic-layout/index.vue`
**根容器类名**: `.cssc-basic-layout`

```
BasicLayout (应用级布局 - 简化版)
├── AppHeader (应用级顶栏)
├── 主内容区 = router-view
└── AppFooter (应用级底栏)
```

**使用路由**: `/user`, `/settings`, `/hierarchy-settings`, `/database-manager`, `/topology-display` 等

**说明**: 已移除侧边栏，简化为 Header + Content + Footer 结构

### 1.2 Editor 模式布局 (IdeLayout)

**文件位置**: `views/ide/index.vue`
**根容器类名**: `.ide-layout`

```
IdeLayout (IDE 专用布局)
├── AppHeader (应用级顶栏)
├── 主内容区
│   ├── ResourceExplorer (左侧资源浏览器)
│   └── TabWorkbench (中间多标签页工作台)
└── AppFooter (应用级底栏)
```

**使用路由**: `/#/editor/ide/*` (通过路由嵌套实现)

### 1.3 欢迎页布局

**文件位置**: `views/editor/welcome-page/index.vue`

直接渲染，无包裹布局。

**使用路由**: `/` (根路径)

---

## 二、组件目录结构

### 2.1 目录结构规范

**组件必须使用目录结构组织**，禁止使用扁平的单文件结构。

**正确格式**（目录结构）：
```
components/
└── editor-toolbar/
    ├── index.vue          # 组件主文件
    └── index.scss         # 组件样式文件
```

**错误格式**（扁平结构）：
```
components/
├── editor-toolbar.vue     # 禁止使用
└── editor-toolbar.scss    # 禁止使用
```

### 2.2 目录结构优势

1. **更好的模块化** - 每个组件拥有独立的目录
2. **更好的扩展性** - 组件需要添加子组件、工具函数或测试文件时，可直接放在同一目录下
3. **一致的导入路径** - 统一使用目录名导入，无需指定文件名
4. **便于维护** - 相关文件集中管理

### 2.3 Vue 文件固定结构规范

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

**结构说明**：
1. **`<template>`** - 必须在第一位，包含模板内容
2. **`<script setup lang="ts">`** - 必须在第二位，使用 Composition API + TypeScript
   - 无逻辑时保留空标签或添加说明注释
   - 禁止使用 `<script setup>`（缺少 lang="ts"）
   - 禁止使用 `<script lang="ts" setup>`（属性顺序错误）
3. **`<style lang="scss" src="./index.scss">`** - 必须在最后一位
   - 引用同目录下的 `index.scss` 文件
   - 无样式时创建空的 `index.scss` 文件

**错误示例**：
```vue
<!-- 错误：缺少 lang="ts" -->
<script setup>
</script>

<!-- 错误：属性顺序错误 -->
<script lang="ts" setup>
</script>

<!-- 错误：使用 Options API（应转换为 setup） -->
<script>
export default {
  // ...
}
</script>

<!-- 错误：内联样式用于静态状态 -->
<div :style="{ backgroundColor: isActive ? 'blue' : 'gray' }">
```

**正确示例**：
```vue
<template>
  <div :class="{ active: isActive }">
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('Hello');
const isActive = ref(true);
</script>

<style lang="scss" src="./index.scss"></style>
```

**内联样式使用原则**：
- **允许使用**：真正动态的值（如上下文菜单位置 `top: y + 'px'`）
- **允许使用**：动态宽度（如侧边栏宽度 `width: asideWidth + 'px'`）
- **允许使用**：动态缩进（如字段层级 `paddingLeft: level * 20 + 'px'`）
- **避免使用**：可以用 CSS 类修饰符处理的静态状态样式

### 2.4 完整目录结构示例

```
client/src/
├── layouts/
│   └── basic-layout/       # 应用级布局容器
│       ├── index.vue
│       └── index.scss
│
├── components/
│   ├── app-header/         # 应用级顶栏
│   │   ├── index.vue
│   │   └── index.scss
│   ├── app-footer/         # 应用级底栏（公用）
│   │   ├── index.vue
│   │   └── index.scss
│   ├── base/               # 基础组件
│   │   ├── base-button/
│   │   ├── base-modal/
│   │   └── base-table/
│   └── node-view/          # 节点视图组件
│       ├── editor/
│       ├── nodes/
│       └── tools/
│
├── views/
│   ├── ide/                # IDE 主布局
│   │   ├── index.vue
│   │   ├── index.scss
│   │   └── components/
│   │       ├── resource-explorer/
│   │       ├── tab-workbench/
│   │       ├── interface-editor/
│   │       ├── logic-editor/
│   │       ├── node-editor/
│   │       ├── node-dashboard/
│   │       ├── packet-definition-editor/
│   │       └── ...
│   ├── editor/             # 编辑器视图
│   │   ├── welcome-page/
│   │   ├── editor-layout/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   └── list-page/
│   │   └── index.scss
│   ├── packet-config/      # 报文配置
│   ├── flowchart/          # 流程图
│   └── ...
│
└── composables/
    └── useVisitedRoutes.ts # 访问路由管理
```

### 2.5 索引文件规范

**组件目录的 index.ts 导出规范**：
```typescript
// 正确：使用目录导入，省略 index.vue 后缀
export { default as EditorToolbar } from './editor-toolbar';

// 错误：禁止使用 .vue 后缀
export { default as EditorToolbar } from './editor-toolbar.vue';
```

### 2.6 命名规范（重要）

| 类别 | 规范 | 示例 |
|------|------|------|
| 变量名（含局部变量） | snake_case | `const grid_strategy = ...` |
| 集合变量名 | snake_case + list 后缀 | `const account_list = ...` |
| TypeScript interface/type 名称 | camelCase | `interface CacheLoadOptions<T> { ... }` |
| 类型定义内部的字段名 | snake_case | `interface CacheLoadOptions<T> { cache_key: string }` |

**类型定义命名说明**：
- TypeScript 的 `interface` 和 `type` 名称使用 camelCase（如 CacheLoadOptions、FieldConfig、TabInfo）
- 这是 TypeScript 社区的通用惯例，与变量名的 snake_case 规范不同
- 类型定义内部的字段名仍使用 snake_case，保持与后端 API 一致

---

## 三、路由与布局对应关系

| 路由范围 | 使用布局 | 布局组件 | 说明 |
|---------|---------|----------|------|
| `/` | 无布局 | WelcomePage | 欢迎页 |
| `/login` | 无布局 | Login | 登录页 |
| `/#/editor/ide/*` | IdeLayout | views/ide/index.vue | IDE 模块（仪表板、列表、编辑器） |
| `/#/editor` | 重定向 | - | 重定向到 /#/editor/ide/dashboard |
| `/#/user` | BasicLayout | layouts/basic-layout | 用户管理 |
| `/#/settings` | BasicLayout | layouts/basic-layout | 系统设置 |
| `/#/hierarchy-settings` | BasicLayout | layouts/basic-layout | 体系层级配置 |
| `/#/database-manager` | BasicLayout | layouts/basic-layout | 数据管理 |
| `/#/topology-display` | BasicLayout | layouts/basic-layout | 拓扑展示 |
| `/#/:pathMatch(.*)*` | 无布局 | 404 | 404 页面 |

---

## 四、路由规范

### 4.1 路由模式

项目使用 **Hash 模式**，URL 格式：`/#/path`

### 4.2 路由结构（2026-01-11 更新）

```
/                           欢迎页（首页）
/editor                     编辑器根路径（重定向到 /editor/ide/dashboard）
/editor/ide                 IDE 主路由（使用 IdeLayout）
  /editor/ide/dashboard     仪表板
  /editor/ide/node/list     通信节点列表（路径推断类型）
  /editor/ide/interface/list 通信接口列表（路径推断类型）
  /editor/ide/logic/list    逻辑节点列表（路径推断类型）
  /editor/ide/icd/list      ICD配置（路径推断类型）
  /editor/ide/packet/list   报文列表（路径推断类型）
  /editor/ide?type=node&id=xxx     节点编辑器（query 参数）
  /editor/ide?type=interface&id=xxx 接口编辑器（query 参数）
  /editor/ide?type=logic&id=xxx     逻辑编辑器（query 参数）
  /editor/ide?type=icd&id=xxx       ICD编辑器（query 参数）
  /editor/ide?type=packet&id=xxx    报文编辑器（query 参数）
/topology-display          拓扑展示
/topology-display/detail   拓扑详情
/user                      用户管理
/user/detail               用户详情
/settings                  系统设置
/hierarchy-settings        体系层级配置
/database-manager          数据管理
/login                     登录页
/:pathMatch(.*)*           404 页面
```

**路由规范说明**：
- IDE 模块所有路由必须使用 `/#/editor/ide/*` 格式
- 直接访问 `/#/editor` 会自动重定向到 `/#/editor/ide/dashboard`
- **编辑器类型通过 query 参数 `type` 传递**（`node`、`interface`、`logic`、`icd`、`packet`）
- **列表页类型通过路由路径推断**（`/editor/ide/node/list` -> `node`）
- **不再使用路由名称映射（ROUTE_NAME_TO_TYPE）**
- 资源 ID 通过 query 参数 `id` 传递
- 统一编辑器路由格式：`/editor/ide?type=xxx&id=xxx`
- 统一列表页路由格式：`/editor/ide/{type}/list`

**禁止使用路径参数（重要）**：
- 禁止使用路径参数格式（如 `:type`, `:id`, `:subType`, `:subId`）
- 禁止格式：`/#/editor/ide/:type/:id` 或 `/#/editor/ide/interface/1007`
- 所有参数必须通过 query 参数传递（如 `?type=xxx&id=xxx&subId=xxx`）
- 正确示例：`/#/editor/ide?type=interface&id=1007`
- 正确示例：`/#/editor/ide?type=interface&id=1007&subId=1`
- 错误示例：`/#/editor/ide/interface/1007`
- 错误示例：`/#/editor/ide/:type/:id`
- 错误示例：`/#/editor/ide/:type/:id/:subId`

**路由规范验证状态（2026-01-11 验证通过）**：
- 路由配置：无动态路径参数（除 404 通配符 `/:pathMatch(.*)*` 外，这是 Vue Router 4.x 标准用法）
- router.push 调用：全部使用 query 参数格式
- route.params 使用：无（全部使用 route.query）
- RouterLink 组件：全部使用静态路径
- 验证结论：代码已符合规范，无需修改

### 4.3 Meta 字段规范

| 字段 | 类型 | 说明 |
|-----|------|------|
| `layout` | String | 布局类型：'basic' \| 'dashboard' \| 'editor' \| null |
| `title` | String | 页面标题 |
| `icon` | String | 图标类名 |
| `hidden` | Boolean | 是否在菜单中隐藏 |
| `cache` | Boolean | 是否缓存（KeepAlive） |
| `order` | Number | 排序权重 |

**layout 字段说明**：
- `'basic'` - 使用 BasicLayout
- `'dashboard'` - 使用 DashboardLayout
- `'editor'` - 使用 EditorLayout
- `null` 或不指定 - 默认使用 BasicLayout

### 4.4 动态路由规范（2026-01-11 更新）

**核心原则：**
1. 不再使用路由名称映射（ROUTE_NAME_TO_TYPE）
2. 禁止使用路径参数（`:type`, `:id`, `:subType`, `:subId`）
3. 所有参数通过 query 参数传递（`?type=xxx&id=xxx&subId=xxx`）

**编辑器路由格式：** `/#/editor/ide?type=xxx&id=xxx`

**路由参数说明：**
- `type` - query 参数，资源类型（`node` | `interface` | `logic` | `icd` | `packet`）
- `id` - query 参数，资源 ID
- `subId` - query 参数，子资源 ID（可选）

**类型获取方式：**
- 编辑器组件：`editor_type` 直接从 `route.query.type` 获取
- 列表页组件：通过路由路径推断类型（PATH_TO_TYPE 映射）

**路由配置：**
- 所有编辑器使用统一路由配置
- 类型从 `route.query.type` 获取

**useEditorData 使用规范：**
```typescript
// useEditorData composable
import { useEditorData } from '@/composables/useEditorData';

const { editorType, editorId, loadData, loadList } = useEditorData();

// editor_type 直接从 route.query.type 获取
// 不再使用 ROUTE_NAME_TO_TYPE 映射
const editor_type = computed(() => {
  return route.query.type as string || '';
});
```

**列表页类型推断（PATH_TO_TYPE）：**
```typescript
// 列表页组件通过路由路径推断类型
const PATH_TO_TYPE: Record<string, string> = {
  'node/list': 'node',
  'interface/list': 'interface',
  'logic/list': 'logic',
  'icd/list': 'icd',
  'packet/list': 'packet',
};

// 优先从 query 参数获取类型
const queryType = route.query.type as string;
if (queryType) return queryType;

// 否则根据路由路径推断类型
const path = route.path as string;
for (const [pathSegment, type] of Object.entries(PATH_TO_TYPE)) {
  if (path.endsWith(pathSegment)) {
    return type;
  }
}
```

**路由示例：**
```
/#/editor/ide/dashboard               仪表板
/#/editor/ide/node/list               通信节点列表（路径推断类型）
/#/editor/ide/interface/list          接口报文列表（路径推断类型）
/#/editor/ide/logic/list              逻辑节点列表（路径推断类型）
/#/editor/ide/icd/list                ICD协议集列表（路径推断类型）
/#/editor/ide/packet/list             报文列表（路径推断类型）
/#/editor/ide?type=node&id=xxx        节点编辑器（query 参数类型）
/#/editor/ide?type=interface&id=1007  接口编辑器（query 参数类型）
/#/editor/ide?type=interface&id=1007&subId=1  接口编辑器（带 subId）
/#/editor/ide?type=logic&id=xxx       逻辑编辑器（query 参数类型）
/#/editor/ide?type=icd&id=xxx         ICD编辑器（query 参数类型）
/#/editor/ide?type=packet&id=xxx      报文编辑器（query 参数类型）
```

**路由跳转代码规范：**
```typescript
// 正确：编辑器使用统一路径，query 传递类型和 ID
router.push({
  path: '/editor/ide',
  query: { type: 'interface', id: interfaceId }
});

// 正确：带 subId
router.push({
  path: '/editor/ide',
  query: { type: 'interface', id: interfaceId, subId: subId }
});

// 正确：列表页使用路径，不需要 query 参数
router.push('/editor/ide/node/list');
router.push('/editor/ide/interface/list');

// 错误：使用路径参数传递类型（禁止）
router.push({
  path: '/editor/ide/interface',
  query: { id: interfaceId }
});

// 错误：使用路径参数传递 ID（禁止）
router.push(`/editor/ide/interface/${interfaceId}`);

// 错误：使用路径参数（禁止）
router.push(`/editor/ide/${type}/${id}`);

// 错误：使用路径参数加 subId（禁止）
router.push(`/editor/ide/${type}/${id}/${subId}`);
```

### 4.5 路由命名规范

| 模式 | 示例 | 说明 |
|-----|------|------|
| 列表页 | `XxxList` | 通信节点：NodeList |
| 详情页 | `XxxDetail` | 用户详情：UserDetail |
| 编辑页 | `XxxEditor` | 逻辑编辑器：LogicEditor |
| 操作页 | `动词+名词` | 新增节点：AddNode |

### 4.6 路由类型传递机制（2026-01-11 新增）

**核心原则：不再使用 ROUTE_NAME_TO_TYPE 映射**

编辑器类型通过以下两种方式传递：

#### 方式一：Query 参数（编辑器页面）
适用于：编辑器详情页、需要明确指定类型的场景

```typescript
// 路由格式
router.push({
  path: '/editor/ide',
  query: { type: 'interface', id: interfaceId }
});

// 组件中获取类型
import { useEditorData } from '@/composables/useEditorData';
const { editorType } = useEditorData();
// editorType.value = 'interface'

// 或直接获取
const route = useRoute();
const editorType = computed(() => route.query.type as string);
```

#### 方式二：路径推断（列表页面）
适用于：列表页，通过 URL 路径自动推断类型

```typescript
// 路由格式
router.push('/editor/ide/node/list');
router.push('/editor/ide/interface/list');

// 列表页组件中推断类型
const PATH_TO_TYPE: Record<string, string> = {
  'node/list': 'node',
  'interface/list': 'interface',
  'logic/list': 'logic',
  'icd/list': 'icd',
  'packet/list': 'packet',
};

const currentEditorType = computed(() => {
  // 优先从 query 参数获取类型
  const queryType = route.query.type as string;
  if (queryType) return queryType;

  // 否则根据路由路径推断类型
  const path = route.path as string;
  for (const [pathSegment, type] of Object.entries(PATH_TO_TYPE)) {
    if (path.endsWith(pathSegment)) {
      return type;
    }
  }
  return '';
});
```

#### useEditorData 使用规范

```typescript
import { useEditorData } from '@/composables/useEditorData';

// 编辑器页面：通过 query 参数获取类型
const { editorType, editorId, loadData, loadList } = useEditorData();

// editorType 直接从 route.query.type 获取
const editor_type = computed(() => {
  return route.query.type as string || '';
});

// 列表页：需要通过路径推断类型后再传递给 useEditorData
// 或直接使用组件内部的类型推断逻辑
```

#### 类型传递场景对照表

| 场景 | 类型来源 | 路由格式 | 组件类型获取方式 |
|-----|---------|---------|----------------|
| 编辑器详情页 | query 参数 | `/#/editor/ide?type=xxx&id=xxx` | `route.query.type` |
| 列表页 | 路径推断 | `/#/editor/ide/{type}/list` | `PATH_TO_TYPE` 映射 |
| 仪表板 | 固定值 | `/#/editor/ide/dashboard` | 无需类型 |
| 资源浏览器 | 树节点选择 | - | 组件内部状态 |

---

## 五、组件分类原则

### A 类：提取为通用组件（迁移到 components/）

| 组件名 | 说明 |
|--------|------|
| AppHeader | 顶栏 |
| AppFooter | 底栏 |

### B 类：保留在原位（继续在 ide/components/）

| 组件名 | 说明 |
|--------|------|
| ResourceExplorer | 资源浏览器（含业务逻辑） |
| TreeNode | 树节点组件 |
| NodeEditor | 节点编辑器 |
| NodeDashboard | 节点概览页 |
| LogicEditor | 逻辑编辑器 |
| InterfaceEditor | 接口编辑器 |
| PacketDefinitionEditor | 报文结构定义编辑器 |
| IcdBundleEditor | ICD协议集编辑器 |
| IcdBundlesList | ICD协议集列表 |
| IcdPacketList | ICD报文列表 |
| 所有弹窗组件 | BuildModal, ConnectionConfigDialog 等 |

### C 类：新建组件

| 位置 | 组件名 | 说明 |
|------|--------|------|
| layouts/basic-layout/ | BasicLayout | 应用级布局容器 |
| layouts/dashboard-layout/ | DashboardLayout | Dashboard模式布局 |
| layouts/editor-layout/ | EditorLayout | Editor模式布局 |

---

## 六、样式复用策略

### 6.1 现有样式类复用

**原则：直接复用现有 `.ide-*` 样式类，不重命名**

| 组件 | 复用的样式类 |
|------|-------------|
| AppHeader | `.ide-header`, `.ide-header-*` |
| AppFooter | `.ide-footer`, `.ide-footer-*` |

### 6.2 新增样式类

| 样式类 | 用途 |
|--------|------|
| `.basic-layout` | BasicLayout 容器 |
| `.dashboard-layout` | DashboardLayout 容器 |
| `.editor-layout` | EditorLayout 容器 |

### 6.3 响应式设计规范

**本项目不需要考虑响应式设计**

- 禁止使用 `@media` 查询进行屏幕尺寸适配
- 所有页面按固定尺寸设计（桌面端 1920x1080 为基准）
- 不需要考虑移动端、平板等不同设备的适配
- 例外：无障碍相关的 `@media` 查询可以保留

### 6.4 SCSS 模块导入规范（2026-01-11 更新）

**核心原则：必须使用 `@use` 替代 `@import`**

SCSS 模块导入规范：

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

**迁移完成的文件**：
- `src/styles/index.scss` - 主样式入口
- `src/layouts/basic-layout/index.scss` - 布局样式

---

## 七、CSS 变量与主题约束（重要）

### 7.1 全局 CSS 变量规范

**核心原则**：
- 全局 CSS 变量统一定义在 `client/src/styles/index.scss` 中的 `:root` 选择器内
- 禁止存在"模块专用变量"概念，全局变量就是通用的，所有人都要遵守
- 变量命名使用通用前缀（如 `--component-*`），而非模块特定前缀（如 `--ide-*`）

**变量定义要求**：
- 全局变量只在 `:root` 中定义一处
- 高对比度模式使用 `html` 选择器覆盖变量值
- 禁止在组件样式文件中重新定义全局变量

### 7.2 主题默认与切换规范

**默认主题**：
- 应用始终默认使用浅色（light）主题
- main.js 强制覆盖为 light，不再从 localStorage 恢复之前保存的主题
- 确保每次刷新页面后都是 light 主题，除非用户在当前会话中主动切换

**主题持久化规范（2026-01-10 更新）**：
- app store 的 `persist.paths` 配置排除 `theme` 字段
- 主题状态不再持久化到 localStorage
- 每次刷新页面后都默认为 light 主题
- 用户需要每次会话重新切换主题（这是预期行为）

**主题切换**：
- 主题切换由用户主动控制（通过 app store 的 toggleTheme/setTheme 方法）
- 禁止自动跟随系统设置
- 禁止使用 `prefers-color-scheme` 媒体查询
- 用户切换主题后，仅在当前会话有效
- 刷新页面后恢复为 light 主题

### 7.3 样式代码规范

**禁止硬编码颜色（2026-01-11 更新）**：
- 样式中的颜色值必须引用 CSS 变量
- 禁止直接硬编码颜色值（如 `#0f172a`, `#1e293b`, `#ffffff`, `rgb(255, 255, 255)`）
- 硬编码颜色会导致主题切换失效
- 如需新的颜色变量，在 `client/src/styles/index.scss` 中添加语义化的变量名

**颜色引用示例**：
```scss
// 正确：使用 CSS 变量
color: var(--component-text-primary);
background-color: var(--component-bg-elevated);

// 错误：硬编码颜色
color: #1e293b;
background-color: #0f172a;
```

---

## 八、状态管理

**继续使用 `useIdeStore`，无需新建 store**

现有状态（保留）：
- `sidebarCollapsed` - 侧边栏折叠状态
- `theme` - 主题设置
- `selectedTreeNodeId` - 树节点选中状态
- `tabTitles` - Tab 自定义标题映射

---

## 九、迁移原则

**核心原则：全面迁移统一，保留业务组件，复用现有资源**

1. **保留原 IDE 模块的业务组件** - 不删除任何现有业务代码
2. **提取通用布局组件** - 将 Header、Footer、Tabs 等提取为通用组件
3. **复用现有样式** - 直接使用现有的 `.ide-*` 样式类
4. **继续使用 ide store** - 状态管理保持不变
5. **先创建后替换** - 新组件创建完成并验证后，再修改现有代码引用

---

## 十、组件目录结构迁移完成状态

### 10.1 已完成迁移的组件（2026-01-10 更新）

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

**IDE 组件 - 主布局：**
- views/ide/index.vue + index.scss
- views/ide/components/resource-explorer/index.vue + index.scss
- views/ide/components/tab-workbench/index.vue + index.scss
- views/ide/components/tree-node/index.vue + index.scss

**IDE 组件 - 编辑器：**
- views/ide/components/interface-editor/index.vue + index.scss
  - 新布局结构：左侧报文列表 + 右侧内容区（顶部控制栏 + 底部左右布局）
  - 右侧内容区：ide-interface-content
  - 顶部控制栏：ide-interface-content-toolbox
  - 底部内容区：ide-interface-content-main（左右布局）
    - 左侧信息区：ide-interface-cm-info（基本信息+字段表格）
    - 右侧属性面板：ide-interface-cm-attr（字段属性编辑）
  - 组件复用：BasicInfoPanel、FieldList、EditorAside、AddFieldMenu
- views/ide/components/logic-editor/index.vue + index.scss
- views/ide/components/node-editor/index.vue + index.scss
- views/ide/components/node-dashboard/index.vue + index.scss
- views/ide/components/packet-definition-editor/index.vue + index.scss

**IDE 组件 - 弹窗：**
- views/ide/components/build-modal/index.vue + index.scss
- views/ide/components/connection-config-dialog/index.vue + index.scss
- views/ide/components/export-dialog/index.vue + index.scss
- views/ide/components/import-dialog/index.vue + index.scss
- views/ide/components/protocol-diff-dialog/index.vue + index.scss
- views/ide/components/version-history-dialog/index.vue + index.scss

**IDE 组件 - 列表：**
- views/ide/components/icd-bundles-list/index.vue + index.scss

**IDE 子组件：**
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

**编辑器视图（2个）：**
- views/editor/welcome-page/index.vue + index.scss
- views/editor/editor-layout/index.vue + index.scss

**编辑器组件（2个）：**
- views/editor/components/dashboard/index.vue + index.scss
- views/editor/components/list-page/index.vue + index.scss

**报文配置组件：**
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

**流程图组件（4个）：**
- views/flowchart/index.vue
- views/flowchart/components/flowchart-header/index.vue + index.scss
- views/flowchart/components/flowchart-import-dialog/index.vue + index.scss
- views/flowchart/components/flowchart-palette/index.vue + index.scss
- views/flowchart/components/flowchart-properties/index.vue + index.scss

**网络可视化组件：**
- components/vis-network/index.vue + index.scss
- components/filter-bar/index.vue + index.scss

**其他视图组件（12个）：**
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

**总计：85+ 组件已完成目录结构迁移**

### 10.2 迁移完成说明

**组件目录结构规范已全面应用**：
- 所有组件文件移至 `component-name/index.vue`
- 所有样式文件移至 `component-name/index.scss`
- 样式引用统一使用 `<style lang="scss" src="./index.scss"></style>`
- 为缺少样式的组件创建了占位 index.scss 文件

### 10.3 样式引用规范

**正确格式**：
```vue
<style lang="scss" src="./index.scss"></style>
```

**错误格式**：
```vue
<style lang="scss" src="../index.scss?scope=header"></style>
<style lang="scss" src="./field-type-tree.scss"></style>
```

### 10.4 动态样式处理规范

**内联样式使用原则**：
- **允许使用**：真正动态的值（如上下文菜单位置 `top: y + 'px'`）
- **允许使用**：动态宽度（如侧边栏宽度 `width: asideWidth + 'px'`）
- **允许使用**：动态缩进（如字段层级 `paddingLeft: level * 20 + 'px'`）
- **避免使用**：可以用 CSS 类修饰符处理的静态状态样式

**示例**：
```vue
<!-- 允许：真正动态的定位 -->
<div :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">

<!-- 允许：动态宽度 -->
<aside :style="{ width: asideVisible ? asideWidth + 'px' : '0' }">

<!-- 允许：动态缩进 -->
<div :style="{ paddingLeft: (field.level || 0) * 20 + 'px' }">

<!-- 避免：应该用 CSS 类处理的状态 -->
<!-- <div :style="{ backgroundColor: isActive ? 'blue' : 'gray' }"> -->
<div :class="{ 'active': isActive }">
```

---

*文档创建日期: 2025-01-10*
*最后更新日期: 2026-01-11（动态路由规范重构：不再使用 ROUTE_NAME_TO_TYPE，编辑器类型从 query.type 获取，列表页通过路径推断，明确禁止使用路径参数格式）*

---

## 十一、测试验证规范（**绝对强制，违者视为失败**）

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
4. **必须调用子代理交叉验证**：使用 Task 工具调用 code-reviewer 进行二次确认
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
