# 路由驱动架构改造实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将前端项目从"单路由 + Store 驱动的组件切换"改造为"路由驱动"架构，所有状态变化通过路由变化触发，Tab 系统作为路由栈的可视化表现。

**Architecture:**
- 路由是唯一真理来源，所有导航通过 router.push 实现
- 路由结构：`/#/editor/ide/:type/:id?params`，支持扩展查询参数
- Store 最小化，只保存 UI 状态；数据缓存层独立管理
- 组件通过路由参数获取数据，支持浏览器前进/后退

**Tech Stack:** Vue 3, Vue Router 4.x, Pinia, TypeScript

---

## Task 1: 创建路由配置文件

**Files:**
- Create: `client/src/router/editor-routes.ts`

**Step 1: 创建编辑器路由配置模块**

```typescript
/**
 * 编辑器路由配置
 * 路由结构：/#/editor/ide/:type/:id?params
 */
import type { RouteRecordRaw } from 'vue-router';

export const editorRoutes: RouteRecordRaw[] = [
  // 欢迎页/空状态
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/views/editor/welcome-page/index.vue'),
    meta: {
      title: '灵枢 IDE',
      cache: false,
    }
  },

  // 编辑器主路由（使用 IdeLayout 作为父布局）
  {
    path: '/editor/ide',
    component: () => import('@/views/ide/index.vue'),
    meta: {
      title: 'IDE 编辑器',
    },
    children: [
      // 仪表板
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/editor/components/dashboard/index.vue'),
        meta: {
          title: '仪表板',
          icon: 'ri-dashboard-line',
          order: 1,
          cache: true,
        }
      },

      // 节点列表
      {
        path: 'node/list',
        name: 'NodeList',
        component: () => import('@/views/editor/components/list-page/index.vue'),
        meta: {
          title: '通信节点',
          icon: 'ri-node-tree',
          order: 2,
          cache: true,
        }
      },

      // 接口列表
      {
        path: 'interface/list',
        name: 'InterfaceList',
        component: () => import('@/views/editor/components/list-page/index.vue'),
        meta: {
          title: '通信接口',
          icon: 'ri-plug-line',
          order: 3,
          cache: true,
        }
      },

      // 逻辑列表
      {
        path: 'logic/list',
        name: 'LogicList',
        component: () => import('@/views/editor/components/list-page/index.vue'),
        meta: {
          title: '逻辑节点',
          icon: 'ri-flow-chart',
          order: 4,
          cache: true,
        }
      },

      // ICD 列表
      {
        path: 'icd/list',
        name: 'IcdList',
        component: () => import('@/views/editor/components/list-page/index.vue'),
        meta: {
          title: 'ICD配置',
          icon: 'ri-file-list-line',
          order: 5,
          cache: true,
        }
      },

      // 报文列表
      {
        path: 'packet/list',
        name: 'PacketList',
        component: () => import('@/views/editor/components/list-page/index.vue'),
        meta: {
          title: '报文列表',
          icon: 'ri-file-text-line',
          order: 6,
          cache: true,
        }
      },

      // 编辑器统一路由（动态路由）
      {
        path: ':type/:id',
        name: 'Editor',
        component: () => import('@/views/editor/editor-layout/index.vue'),
        meta: {
          title: '编辑器',
          hidden: true,
          requiresData: true,
          cache: false,
        },
      },
    ],
  },

  // 编辑器根路径重定向到仪表板
  {
    path: '/editor',
    redirect: '/editor/ide/dashboard',
  },
];

// 有效编辑器类型
export const VALID_EDITOR_TYPES = [
  'node',
  'interface',
  'logic',
  'icd',
  'packet',
] as const;

export type EditorType = typeof VALID_EDITOR_TYPES[number];
```

**Step 2: 提交**

```bash
git add client/src/router/editor-routes.ts
git commit -m "feat(router): 创建编辑器路由配置模块"
```

---

## Task 2: 更新主路由配置

**Files:**
- Modify: `client/src/router/index.ts:12-50`

**Step 1: 导入并使用编辑器路由**

在文件顶部添加导入：
```typescript
import { editorRoutes } from './editor-routes';
```

**Step 2: 替换 IDE 路由配置**

将原有路由配置替换为：
```typescript
const routes: RouteRecordRaw[] = [
  // 编辑器路由系统
  ...editorRoutes,

  // 保留的独立路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true,
      noAuth: true
    }
  },

  // 拓扑展示（独立视图）
  {
    path: '/topology-display',
    name: 'TopologyDisplay',
    component: () => import('@/views/topology-display/index.vue'),
    meta: {
      title: '拓扑展示',
      icon: 'ri-share-circle-line',
      cache: true,
    }
  },
  {
    path: '/topology-display/detail',
    name: 'TopologyDetail',
    component: () => import('@/views/topology-display/detail.vue'),
    meta: {
      title: '节点详情',
      icon: 'ri-share-circle-line',
      hidden: true,
      cache: false,
    }
  },

  // 用户管理
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/user/index.vue'),
    meta: {
      title: '用户管理',
      icon: 'ri-user-line',
      cache: true,
    }
  },
  {
    path: '/user/detail',
    name: 'UserDetail',
    component: () => import('@/views/user/detail.vue'),
    meta: {
      title: '用户详情',
      icon: 'ri-user-line',
      hidden: true,
      cache: false,
    }
  },

  // 系统设置
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/index.vue'),
    meta: {
      title: '系统设置',
      icon: 'ri-settings-3-line',
      hidden: true,
      cache: true,
    }
  },

  // 体系层级配置
  {
    path: '/hierarchy-settings',
    name: 'HierarchySettings',
    component: () => import('@/views/hierarchy-settings/index.vue'),
    meta: {
      title: '体系层级配置',
      icon: 'ri-node-tree',
      hidden: true,
      cache: true,
    }
  },

  // 数据管理
  {
    path: '/database-manager',
    name: 'DatabaseManager',
    component: () => import('@/views/database-manager/index.vue'),
    meta: {
      title: '数据管理',
      icon: 'ri-database-2-line',
      hidden: true,
      cache: true,
    }
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      hidden: true
    }
  }
];
```

**Step 3: 提交**

```bash
git add client/src/router/index.ts
git commit -m "feat(router): 更新主路由配置，引入编辑器路由系统"
```

---

## Task 3: 创建数据缓存工具

**Files:**
- Create: `client/src/utils/editorCache.ts`

**Step 1: 实现数据缓存工具**

```typescript
/**
 * 编辑器数据缓存工具
 * 用于缓存已加载的数据，避免重复请求
 */
interface CacheItem {
  data: any;
  timestamp: number;
}

class EditorCache {
  private cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟过期

  /**
   * 生成缓存 key
   */
  private getKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  /**
   * 获取缓存
   */
  get(type: string, id: string): any | null {
    const key = this.getKey(type, id);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存
   */
  set(type: string, id: string, data: any): void {
    const key = this.getKey(type, id);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 删除缓存
   */
  delete(type: string, id: string): void {
    const key = this.getKey(type, id);
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除指定类型的缓存
   */
  clearType(type: string): void {
    const prefix = `${type}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const editorCache = new EditorCache();
```

**Step 2: 提交**

```bash
git add client/src/utils/editorCache.ts
git commit -m "feat(utils): 创建编辑器数据缓存工具"
```

---

## Task 4: 创建编辑器路由守卫

**Files:**
- Create: `client/src/router/guards/editorGuard.ts`

**Step 1: 实现数据验证守卫**

```typescript
/**
 * 编辑器路由守卫
 * 负责验证编辑器类型和数据存在性
 */
import type { Router } from 'vue-router';
import { VALID_EDITOR_TYPES } from '../editor-routes';
import { editorCache } from '@/utils/editorCache';
import { api } from '@/api';

// 数据存在性检查 API 映射
const DATA_CHECK_APIS = {
  node: api.node.exists,
  interface: api.interface.exists,
  logic: api.logic.exists,
  icd: api.icd.exists,
  packet: api.packet.exists,
} as const;

/**
 * 验证编辑器类型是否有效
 */
function isValidEditorType(type: string): type is keyof typeof DATA_CHECK_APIS {
  return VALID_EDITOR_TYPES.includes(type as any);
}

/**
 * 检查数据是否存在
 */
async function checkDataExists(type: string, id: string): Promise<boolean> {
  try {
    // 先检查缓存
    const cached = editorCache.get(type, id);
    if (cached) {
      return true;
    }

    // 调用 API 验证
    const checkApi = DATA_CHECK_APIS[type as keyof typeof DATA_CHECK_APIS];
    if (!checkApi) {
      return false;
    }

    const result = await checkApi(id);
    return result.status === 'success';
  } catch (error) {
    console.error('数据存在性检查失败:', error);
    return false;
  }
}

/**
 * 创建编辑器路由守卫
 */
export function setupEditorGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    // 只处理编辑器路由
    if (!to.meta?.requiresData) {
      next();
      return;
    }

    const type = to.params.type as string;
    const id = to.params.id as string;

    // 验证类型
    if (!isValidEditorType(type)) {
      console.warn('无效的编辑器类型:', type);
      next('/');
      return;
    }

    // 跳过列表页的数据验证
    if (id === 'list') {
      next();
      return;
    }

    // 验证数据存在性
    const exists = await checkDataExists(type, id);
    if (!exists) {
      console.warn('数据不存在:', type, id);
      // 重定向到对应列表页
      next(`/editor/ide/${type}/list`);
      return;
    }

    next();
  });
}
```

**Step 2: 提交**

```bash
git add client/src/router/guards/editorGuard.ts
git commit -m "feat(router): 创建编辑器路由守卫"
```

---

## Task 5: 注册路由守卫

**Files:**
- Modify: `client/src/router/index.ts:180-232`

**Step 1: 导入并注册守卫**

在导入区域添加：
```typescript
import { setupEditorGuard } from './guards/editorGuard';
```

在路由创建后添加：
```typescript
// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // ... 保持原有实现
  }
});

// 设置编辑器守卫
setupEditorGuard(router);
```

**Step 2: 提交**

```bash
git add client/src/router/index.ts
git commit -m "feat(router): 注册编辑器路由守卫"
```

---

## Task 6: 重构 IDE Store

**Files:**
- Modify: `client/src/stores/ide.ts`

**Step 1: 移除 Tab 相关状态，添加 UI 状态**

```typescript
/**
 * IDE Store - 重构版
 * 只保存 UI 状态，Tab 由路由栈管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useIdeStore = defineStore('ide', () => {
  // ==================== UI 状态 ====================

  // 侧边栏状态
  const sidebarCollapsed = ref(false);

  // 主题
  const theme = ref<'light' | 'dark'>('light');

  // 当前选中的树节点 ID（用于高亮）
  const selectedTreeNodeId = ref<string | null>(null);

  // ==================== Getters ====================

  const isSidebarCollapsed = computed(() => sidebarCollapsed.value);
  const currentTheme = computed(() => theme.value);
  const currentTreeNodeId = computed(() => selectedTreeNodeId.value);

  // ==================== Actions ====================

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed;
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme;
  }

  function selectTreeNode(nodeId: string | null) {
    selectedTreeNodeId.value = nodeId;
  }

  return {
    // 状态
    sidebarCollapsed,
    theme,
    selectedTreeNodeId,

    // Getters
    isSidebarCollapsed,
    currentTheme,
    currentTreeNodeId,

    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setTheme,
    selectTreeNode,
  };
}, {
  persist: {
    key: 'ide-state',
    paths: ['sidebarCollapsed', 'theme'],
  }
});
```

**Step 2: 提交**

```bash
git add client/src/stores/ide.ts
git commit -m "refactor(store): 重构 IDE Store，移除 Tab 状态，保留 UI 状态"
```

---

## Task 7: 创建编辑器数据加载 Composable

**Files:**
- Create: `client/src/composables/useEditorData.ts`

**Step 1: 实现数据加载逻辑**

```typescript
/**
 * 编辑器数据加载 Composable
 * 提供统一的数据加载、缓存、错误处理逻辑
 */
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from '@/hooks/useMessage';
import { editorCache } from '@/utils/editorCache';

// API 映射
const DATA_APIS = {
  node: {
    getDetail: api.node.getDetail,
    getList: api.node.getList,
  },
  interface: {
    getDetail: api.interface.getDetail,
    getList: api.interface.getList,
  },
  logic: {
    getDetail: api.logic.getDetail,
    getList: api.logic.getList,
  },
  icd: {
    getDetail: api.icd.getDetail,
    getList: api.icd.getList,
  },
  packet: {
    getDetail: api.packet.getDetail,
    getList: api.packet.getList,
  },
} as const;

export function useEditorData() {
  const route = useRoute();
  const router = useRouter();
  const message = useMessage();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const data = ref<any>(null);

  // 从路由参数解析类型和 ID
  const editorType = computed(() => route.params.type as string);
  const editorId = computed(() => route.params.id as string);
  const queryParams = computed(() => route.query);

  /**
   * 加载详细数据
   */
  async function loadData() {
    const type = editorType.value;
    const id = editorId.value;

    if (!type || !id) {
      error.value = '缺少必要参数';
      return;
    }

    // 列表页特殊处理
    if (id === 'list') {
      await loadList();
      return;
    }

    // 检查缓存
    const cached = editorCache.get(type, id);
    if (cached) {
      data.value = cached;
      return;
    }

    // 从 API 加载
    loading.value = true;
    error.value = null;

    try {
      const apiMap = DATA_APIS[type as keyof typeof DATA_APIS];
      if (!apiMap) {
        throw new Error(`不支持的编辑器类型: ${type}`);
      }

      const result = await apiMap.getDetail(id);

      if (result.status === 'success') {
        data.value = result.datum;
        // 缓存数据
        editorCache.set(type, id, result.datum);
      } else {
        error.value = result.message || '加载失败';
        // 跳转到列表页
        router.push(`/editor/${type}/list`);
      }
    } catch (err: any) {
      error.value = err.message || '加载失败';
      message.error(error.value);
      router.push(`/editor/${type}/list`);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载列表数据
   */
  async function loadList() {
    const type = editorType.value;

    loading.value = true;
    error.value = null;

    try {
      const apiMap = DATA_APIS[type as keyof typeof DATA_APIS];
      if (!apiMap) {
        throw new Error(`不支持的编辑器类型: ${type}`);
      }

      const result = await apiMap.getList();

      if (result.status === 'success') {
        data.value = result.datum;
      } else {
        error.value = result.message || '加载失败';
      }
    } catch (err: any) {
      error.value = err.message || '加载失败';
      message.error(error.value);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 刷新数据（清除缓存后重新加载）
   */
  async function refresh() {
    const type = editorType.value;
    const id = editorId.value;

    if (type && id && id !== 'list') {
      editorCache.delete(type, id);
    }

    await loadData();
  }

  /**
   * 清除当前类型缓存
   */
  function clearTypeCache() {
    const type = editorType.value;
    if (type) {
      editorCache.clearType(type);
    }
  }

  return {
    loading,
    error,
    data,
    editorType,
    editorId,
    queryParams,
    loadData,
    loadList,
    refresh,
    clearTypeCache,
  };
}
```

**Step 2: 提交**

```bash
git add client/src/composables/useEditorData.ts
git commit -m "feat(composable): 创建编辑器数据加载 Composable"
```

---

## Task 8: 创建欢迎页组件

**Files:**
- Create: `client/src/views/editor/WelcomePage.vue`

**Step 1: 实现欢迎页**

```vue
<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <h1 class="welcome-title">欢迎使用灵枢 IDE</h1>
      <p class="welcome-subtitle">请从左侧选择一个功能开始</p>

      <div class="quick-actions">
        <button class="action-button" @click="goToDashboard">
          <span class="button-icon">📊</span>
          <span class="button-text">仪表板</span>
        </button>
        <button class="action-button" @click="goToNodeList">
          <span class="button-icon">🔧</span>
          <span class="button-text">节点列表</span>
        </button>
        <button class="action-button" @click="goToInterfaceList">
          <span class="button-icon">📡</span>
          <span class="button-text">接口列表</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goToDashboard() {
  router.push('/editor/ide');
}

function goToNodeList() {
  router.push('/editor/ide/node/list');
}

function goToInterfaceList() {
  router.push('/editor/ide/interface/list');
}
</script>

<style scoped>
/* 样式统一维护在 index.scss 中，这里只做基础布局 */
.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-bg-color-page);
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin-bottom: 40px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.button-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.button-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/editor/WelcomePage.vue
git commit -m "feat(editor): 创建欢迎页组件"
```

---

## Task 9: 创建编辑器布局组件

**Files:**
- Create: `client/src/views/editor/EditorLayout.vue`

**Step 1: 实现编辑器布局**

```vue
<template>
  <div class="editor-layout">
    <router-view v-slot="{ Component, route }">
      <KeepAlive :max="10" v-if="route.meta?.cache">
        <component :is="Component" :key="route.path" />
      </KeepAlive>
      <component :is="Component" :key="route.path" v-else />
    </router-view>
  </div>
</template>

<script setup lang="ts">
// 编辑器统一布局，根据路由 meta.cache 控制组件缓存
</script>

<style scoped>
.editor-layout {
  height: 100%;
  overflow: hidden;
}
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/editor/EditorLayout.vue
git commit -m "feat(editor): 创建编辑器布局组件"
```

---

## Task 10: 重构 TabWorkbench 组件

**Files:**
- Modify: `client/src/views/ide/components/TabWorkbench.vue`

**Step 1: 改造为路由栈镜像模式**

```vue
<template>
  <div class="tab-workbench">
    <!-- Tab 标签栏 -->
    <div class="tab-bar" v-if="tabList.length > 0">
      <div
        v-for="tab in tabList"
        :key="tab.path"
        class="tab-item"
        :class="{ active: tab.path === currentPath }"
        @click="handleTabClick(tab)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <button class="tab-close" @click.stop="handleCloseTab(tab)">×</button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="tab-content">
      <router-view v-slot="{ Component, route }">
        <KeepAlive :max="10" v-if="route.meta?.cache">
          <component :is="Component" :key="route.path" />
        </KeepAlive>
        <component :is="Component" :key="route.path" v-else />
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, RouteRecordNormalized } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 当前路由路径
const currentPath = computed(() => route.path);

// 维护访问过的编辑器路由列表
const visitedRoutes = ref<string[]>([]);

// Tab 列表（从路由历史生成）
const tabList = computed(() => {
  return visitedRoutes.value
    .filter(path => {
      // 只显示编辑器相关的路由
      return path.startsWith('/editor/ide/') && path !== '/editor/ide';
    })
    .map(path => {
      const matched = router.getRoutes().find(r => r.path === path);
      return {
        path,
        title: matched?.meta?.title || path,
      };
    });
});

// 监听路由变化，维护访问历史
watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/editor/ide/') && newPath !== '/editor/ide') {
      if (!visitedRoutes.value.includes(newPath)) {
        visitedRoutes.value.push(newPath);
      }
    }
  },
  { immediate: true }
);

// 点击 Tab
function handleTabClick(tab: { path: string }) {
  router.push(tab.path);
}

// 关闭 Tab
async function handleCloseTab(tab: { path: string }) {
  const index = visitedRoutes.value.indexOf(tab.path);

  // 从访问列表中移除
  visitedRoutes.value = visitedRoutes.value.filter(p => p !== tab.path);

  // 确定跳转目标
  if (tab.path === currentPath.value) {
    // 关闭的是当前 Tab，需要跳转
    const remainingTabs = visitedRoutes.value.filter(p =>
      p.startsWith('/editor/ide/') && p !== '/editor/ide'
    );

    if (remainingTabs.length > 0) {
      // 跳转到上一个 Tab
      const targetIndex = Math.min(index, remainingTabs.length - 1);
      router.push(remainingTabs[targetIndex]);
    } else {
      // 没有其他 Tab，跳转到仪表板
      router.push('/editor/ide/dashboard');
    }
  }
}
</script>

<style scoped>
.tab-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  cursor: pointer;
  user-select: none;
}

.tab-item.active {
  background: var(--el-bg-color);
  border-bottom: 2px solid var(--el-color-primary);
}

.tab-title {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.tab-close {
  margin-left: 8px;
  padding: 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: var(--el-text-color-regular);
}

.tab-close:hover {
  color: var(--el-color-danger);
}

.tab-content {
  flex: 1;
  overflow: hidden;
}
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/ide/components/TabWorkbench.vue
git commit -m "refactor(tab): 重构 TabWorkbench 为路由栈镜像模式"
```

---

## Task 11: 重构 IDE 主布局

**Files:**
- Modify: `client/src/views/ide/index.vue`

**Step 1: 更新布局结构**

```vue
<template>
  <div class="ide-container">
    <IdeHeader />

    <div class="ide-main">
      <ResourceExplorer />

      <div class="ide-workbench">
        <TabWorkbench />
      </div>
    </div>

    <IdeFooter />
  </div>
</template>

<script setup lang="ts">
import IdeHeader from './components/IdeHeader.vue';
import ResourceExplorer from './components/ResourceExplorer.vue';
import TabWorkbench from './components/TabWorkbench.vue';
import IdeFooter from './components/IdeFooter.vue';
</script>

<style scoped>
.ide-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.ide-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ide-workbench {
  flex: 1;
  overflow: hidden;
}
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/ide/index.vue
git commit -m "refactor(layout): 更新 IDE 主布局结构"
```

---

## Task 12: 重构 ResourceExplorer 导航

**Files:**
- Modify: `client/src/views/ide/components/ResourceExplorer.vue`

**Step 1: 将导航改为 router.push**

找到原有的 `openTab` 调用，替换为 `router.push`：

```typescript
import { useRouter } from 'vue-router';

const router = useRouter();

// 节点点击处理
async function handleNodeClick(node: any) {
  router.push(`/editor/ide/node/${node.id}`);
}

// 接口点击处理
async function handleInterfaceClick(iface: any) {
  router.push(`/editor/ide/interface/${iface.id}?mode=edit`);
}

// ICD 点击处理
async function handleIcdClick(icd: any) {
  router.push(`/editor/ide/icd/${icd.id}`);
}

// 打开列表
function openNodeList() {
  router.push('/editor/ide/node/list');
}

function openInterfaceList() {
  router.push('/editor/ide/interface/list');
}
```

**Step 2: 提交**

```bash
git add client/src/views/ide/components/ResourceExplorer.vue
git commit -m "refactor(explorer): 将 ResourceExplorer 导航改为 router.push"
```

---

## Task 13-19: 改造所有编辑器组件

**通用改造步骤（适用于所有编辑器组件）：**

**Files:**
- Modify: `client/src/views/editor/components/NodeEditor.vue`
- Modify: `client/src/views/editor/components/InterfaceEditor.vue`
- Modify: `client/src/views/editor/components/LogicEditor.vue`
- Modify: `client/src/views/editor/components/IcdBundleEditor.vue`
- Modify: `client/src/views/editor/components/IcdPacketList.vue`
- Modify: `client/src/views/editor/components/Dashboard.vue`
- Modify: `client/src/views/editor/components/ListPage.vue`

**每个组件的改造步骤：**

### Step 1: 移除 props 依赖

将原有的 props 定义移除，改用路由参数：

```typescript
// 移除
// const props = defineProps<{ nodeId: string; ... }>()

// 使用路由参数
import { useRoute } from 'vue-router';
const route = useRoute();
const editorId = route.params.id as string;
const mode = route.query.mode as string || 'view';
```

### Step 2: 使用 useEditorData 加载数据

```typescript
import { useEditorData } from '@/composables/useEditorData';

const { loading, error, data, loadData, refresh } = useEditorData();

onMounted(() => {
  loadData();
});
```

### Step 3: 内部导航改为 router.push

```typescript
import { useRouter } from 'vue-router';
const router = useRouter();

// 跳转到其他编辑器
function openRelatedEditor(id: string) {
  router.push(`/editor/ide/interface/${id}`);
}

// 跳转到列表
function openList() {
  router.push(`/editor/ide/${editorType.value}/list`);
}
```

### Step 4: 移除 emit 事件

将原有的 emit 事件改为直接导航：

```typescript
// 移除
// const emit = defineEmits<{ (e: 'discard-draft', id: string): void }>();
// emit('discard-draft', packetId);

// 替换为
async function handleDiscardDraft() {
  // 删除操作
  await api.deleteDraft(packetId);
  // 直接导航到列表
  router.push(`/editor/ide/packet/list`);
}
```

### 提交命令（每个组件单独提交）

```bash
# NodeEditor
git add client/src/views/editor/components/NodeEditor.vue
git commit -m "refactor(editor): 改造 NodeEditor 为路由驱动"

# InterfaceEditor
git add client/src/views/editor/components/InterfaceEditor.vue
git commit -m "refactor(editor): 改造 InterfaceEditor 为路由驱动"

# 其他组件类似...
```

---

## Task 20: 创建列表页组件

**Files:**
- Create: `client/src/views/editor/components/ListPage.vue`

**Step 1: 实现通用列表页**

```vue
<template>
  <div class="list-page">
    <div class="list-header">
      <h2>{{ pageTitle }}</h2>
      <button class="create-button" @click="handleCreate">新建</button>
    </div>

    <div class="list-content" v-loading="loading">
      <el-table :data="data?.list || []" @row-click="handleRowClick">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="名称" />
        <!-- 根据类型添加其他列 -->
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEditorData } from '@/composables/useEditorData';

const route = useRoute();
const router = useRouter();
const { loading, data, editorType, loadData } = useEditorData();

// 根据类型确定标题
const pageTitle = computed(() => {
  const typeTitles: Record<string, string> = {
    node: '节点列表',
    interface: '接口列表',
    logic: '逻辑列表',
    icd: 'ICD 列表',
    packet: '报文列表',
  };
  return typeTitles[editorType.value] || '列表';
});

// 初始化加载数据
loadData();

// 点击行跳转到详情
function handleRowClick(row: any) {
  router.push(`/editor/ide/${editorType.value}/${row.id}`);
}

// 新建
function handleCreate() {
  // 根据类型跳转到创建页面或打开创建对话框
  router.push(`/editor/ide/${editorType.value}/new`);
}
</script>

<style scoped>
.list-page {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-content {
  background: var(--el-bg-color);
  border-radius: 4px;
}
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/editor/components/ListPage.vue
git commit -m "feat(editor): 创建通用列表页组件"
```

---

## Task 21: 创建 Dashboard 组件

**Files:**
- Create: `client/src/views/editor/components/Dashboard.vue`

**Step 1: 迁移原有仪表板逻辑**

将原有的 `NodeDashboard.vue` 内容迁移过来，并改造为路由驱动：

```vue
<template>
  <div class="dashboard-page">
    <!-- 原有仪表板内容，改造导航方式 -->
    <div class="dashboard-card" @click="router.push('/editor/ide/node/list')">
      <h3>节点</h3>
      <p>{{ stats.nodeCount }} 个</p>
    </div>

    <div class="dashboard-card" @click="router.push('/editor/ide/interface/list')">
      <h3>接口</h3>
      <p>{{ stats.interfaceCount }} 个</p>
    </div>

    <!-- 更多统计卡片... -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const stats = ref({
  nodeCount: 0,
  interfaceCount: 0,
  // ...
});

onMounted(async () => {
  // 加载统计数据
  const result = await api.getDashboardStats();
  if (result.status === 'success') {
    stats.value = result.datum;
  }
});
</script>

<style scoped>
/* 迁移原有样式 */
</style>
```

**Step 2: 提交**

```bash
git add client/src/views/editor/components/Dashboard.vue
git commit -m "feat(editor): 创建 Dashboard 组件"
```

---

## Task 22: 更新样式文件

**Files:**
- Modify: `client/src/index.scss`

**Step 1: 添加编辑器相关样式**

```scss
// 编辑器布局样式
.editor-layout {
  height: 100%;
  overflow: hidden;
}

// 欢迎页样式
.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-bg-color-page);
}

.welcome-content {
  text-align: center;
}

.welcome-title {
  font-size: 32px;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.welcome-subtitle {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin-bottom: 40px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.welcome-page .action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  transition: all 0.2s;
}

.welcome-page .action-button:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.welcome-page .button-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.welcome-page .button-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

// Tab 样式
.tab-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-workbench .tab-bar {
  display: flex;
  align-items: center;
  height: 40px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
}

.tab-workbench .tab-item {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  border-right: 1px solid var(--el-border-color);
  cursor: pointer;
  user-select: none;
}

.tab-workbench .tab-item.active {
  background: var(--el-bg-color);
  border-bottom: 2px solid var(--el-color-primary);
}

.tab-workbench .tab-title {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.tab-workbench .tab-close {
  margin-left: 8px;
  padding: 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: var(--el-text-color-regular);
}

.tab-workbench .tab-close:hover {
  color: var(--el-color-danger);
}

.tab-workbench .tab-content {
  flex: 1;
  overflow: hidden;
}
```

**Step 2: 提交**

```bash
git add client/src/index.scss
git commit -m "style(editor): 添加编辑器相关样式"
```

---

## Task 23: 更新 BasicLayout 路由配置

**Files:**
- Modify: `client/src/layouts/BasicLayout.vue`

**Step 1: 更新侧边栏菜单配置**

确保侧边栏菜单项与新的路由结构匹配：

```typescript
const menuItems = [
  {
    path: '/',
    title: '首页',
    icon: 'ri-home-line',
  },
  {
    path: '/editor/ide/dashboard',
    title: '仪表板',
    icon: 'ri-dashboard-line',
  },
  // ... 其他菜单项
];
```

**Step 2: 提交**

```bash
git add client/src/layouts/BasicLayout.vue
git commit -m "refactor(layout): 更新 BasicLayout 菜单配置"
```

---

## Task 24: 清理旧文件和代码

**Files:**
- Delete: `client/src/views/ide/components/NodeDashboard.vue`（已迁移）
- Delete: `client/src/views/ide/components/NodeEditor.vue`（已迁移）
- Delete: `client/src/views/ide/components/InterfaceEditor.vue`（已迁移）
- Delete: `client/src/views/ide/components/LogicEditor.vue`（已迁移）
- Delete: `client/src/views/ide/components/IcdBundleEditor.vue`（已迁移）
- Delete: `client/src/views/ide/components/IcdPacketList.vue`（已迁移）

**Step 1: 删除旧文件**

```bash
# 删除已迁移的组件
rm client/src/views/ide/components/NodeDashboard.vue
rm client/src/views/ide/components/NodeEditor.vue
rm client/src/views/ide/components/InterfaceEditor.vue
rm client/src/views/ide/components/LogicEditor.vue
rm client/src/views/ide/components/IcdBundleEditor.vue
rm client/src/views/ide/components/IcdPacketList.vue
```

**Step 2: 提交**

```bash
git add -A
git commit -m "refactor(cleanup): 清理已迁移的旧组件文件"
```

---

## Task 25: 测试与验证

**Step 1: 运行开发服务器**

```bash
cd client
pnpm dev
```

**Step 2: 手动测试清单**

- [ ] 访问 `/#/` 显示欢迎页
- [ ] 点击欢迎页快捷入口能正确跳转
- [ ] 访问 `/#/editor/ide/dashboard` 显示仪表板
- [ ] 访问 `/#/editor/ide/node/list` 显示节点列表
- [ ] 点击列表项跳转到 `/#/editor/ide/node/:id`
- [ ] Tab 正确显示当前路由
- [ ] 点击 Tab 能切换路由
- [ ] 关闭 Tab 正确跳转
- [ ] 浏览器前进/后退按钮正常工作
- [ ] 直接访问 URL（如 `/#/editor/ide/interface/123?mode=edit`）能加载数据
- [ ] 数据不存在时重定向到列表页
- [ ] 列表页缓存生效
- [ ] 编辑页不缓存，每次重新加载

**Step 3: 修复发现的问题**

根据测试结果修复 bug，每个修复单独提交。

---

## Task 26: 更新文档

**Files:**
- Create: `docs/ARCHITECTURE.md`

**Step 1: 编写架构文档**

```markdown
# 前端架构文档

## 路由驱动架构

### 核心原则
路由是唯一真理来源，所有状态变化通过路由变化触发。

### 路由结构
\`\`\`
/#/                           欢迎页
/#/editor/ide/dashboard       仪表板
/#/editor/ide/:type/list      列表页
/#/editor/ide/:type/:id?params 编辑器
\`\`\`

### 组件导航
\`\`\`typescript
// 使用 router.push 进行导航
router.push('/editor/ide/node/123');
router.push('/editor/ide/interface/456?mode=edit');
\`\`\`

### 数据加载
\`\`\`typescript
import { useEditorData } from '@/composables/useEditorData';

const { loading, data, loadData, refresh } = useEditorData();
\`\`\`
```

**Step 2: 提交**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: 添加前端架构文档"
```

---

## 完成检查清单

- [ ] 所有任务完成
- [ ] 所有测试通过
- [ ] 无 console 错误
- [ ] 文档完整
- [ ] 代码提交规范

---

**总计任务数：26**

**预计工作量：** 全量改造，一次性完成
