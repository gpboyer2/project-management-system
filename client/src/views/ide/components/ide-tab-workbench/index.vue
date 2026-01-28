<!--
  IDE 多标签工作台组件
  基于路由栈的镜像模式：Tab 列表是访问过的路由的镜像
  点击 Tab 跳转路由，关闭 Tab 跳转并删除记录
-->
<template>
  <div class="ide-tabs">
    <!-- Tab 标签栏 -->
    <div v-if="visitedRoutes.length > 0" class="ide-tabs-bar">
      <div
        v-for="(tabRoute, index) in visitedRoutes"
        :key="getTabKey(tabRoute)"
        class="ide-tab"
        :class="{
          'ide-tab--active': isRouteActive(tabRoute),
          'ide-tab--dragging': draggingTabPath === tabRoute.path,
          'ide-tab--drag-over': dragOverTabPath === tabRoute.path && draggingTabPath !== tabRoute.path
        }"
        :draggable="true"
        @click="handleTabClick(tabRoute)"
        @contextmenu.prevent="handleContextMenu($event, tabRoute, index)"
        @dragstart="handleDragStart($event, tabRoute, index)"
        @dragend="handleDragEnd"
        @dragover.prevent="handleDragOver($event, tabRoute)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, index)"
      >
        <span class="ide-tab-label">
          {{ getTabTitle(tabRoute) }}
        </span>

        <el-icon class="ide-tab-close" @click.stop="handleTabClose(tabRoute, index)"><Close /></el-icon>
      </div>
    </div>

    <!-- Tab 右键菜单 - VSCode 风格 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="tab-context-menu-overlay"
        @click="closeContextMenu"
      >
        <div
          class="tab-context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          @click.stop
        >
          <div class="tab-context-menu-item" @click="handleCloseTab">
            关闭
          </div>

          <div v-if="canCloseOthers" class="tab-context-menu-item" @click="handleCloseOthers">
            关闭其他
          </div>

          <div v-if="canCloseRight" class="tab-context-menu-item" @click="handleCloseRight">
            关闭右侧
          </div>

          <div class="tab-context-menu-divider" />

          <div class="tab-context-menu-item" @click="handleCloseAll">
            关闭所有
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 内容区域 - 通过 router-view 渲染 -->
    <div class="ide-tabs-content">
      <!-- 空状态：无 Tab 时显示欢迎页 -->
      <template v-if="visitedRoutes.length === 0">
        <div class="ide-tabs-empty">
          <el-icon class="ide-tabs-empty-icon"><Document /></el-icon>

          <p class="ide-tabs-empty-text">
            请点击左侧节点开始
          </p>
        </div>
      </template>

      <!-- 有 Tab 时渲染路由内容 -->
      <template v-else>
        <div class="ide-tab-content">
          <router-view v-slot="{ Component, route }">
            <KeepAlive v-if="route.meta?.cache" :max="10">
              <component :is="Component" :key="route.path" />
            </KeepAlive>

            <component :is="Component" v-else :key="route.path" />
          </router-view>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Close, Document } from '@element-plus/icons-vue';
import { useIdeStore } from '@/stores';
import { useVisitedRoutes, type VisitedRoute } from '@/composables/useVisitedRoutes';
import { useContextMenu } from '@/composables/useContextMenu';
import { useTabOperation } from '@/composables/useTabOperation';
import { useTabDrag } from '@/composables/useTabDrag';
import { buildEditorTabKey } from '@/utils/routeParamHelper';

const router = useRouter();
const route = useRoute();
const ideStore = useIdeStore();

// 使用访问路由管理 composable
const {
  visitedRoutes,
  addOrUpdate,
  removeAt,
  clear,
  keepOnly,
  truncateAfter,
  shouldRecord,
} = useVisitedRoutes();

// 使用右键菜单 composable
const { contextMenu } = useContextMenu();

// 使用标签页操作 composable
const { canCloseOthers, canCloseRight } = useTabOperation(visitedRoutes, contextMenu);

// 使用标签页拖拽 composable
const { draggingTabPath, dragOverTabPath, handleDragStart: dragHandleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } = useTabDrag();

// 拖拽处理包装
/**
 * 处理 Tab 拖拽开始事件
 * @param {DragEvent} event - 拖拽事件对象
 * @param {VisitedRoute} targetRoute - 目标路由对象
 * @param {number} index - Tab 索引
 * @returns {void}
 */
function handleDragStart(event: DragEvent, targetRoute: VisitedRoute, index: number) {
  dragHandleDragStart(event, targetRoute, index);
  draggingTabPath.value = targetRoute.path;
  dragFromIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      (event.target as HTMLElement)?.classList.add('ide-tab--dragging');
    }, 0);
  }
}

// 当前路由
const currentRoute = computed(() => route);

// 导航状态（防止重复导航）
let navigatingToPath: string | null = null;

/**
 * 判断 Tab 是否是当前激活的
 * @param {VisitedRoute} tabRoute - 待判断的路由对象
 * @returns {boolean} 是否为当前激活的 Tab
 */
function isRouteActive(tabRoute: VisitedRoute): boolean {
  // 使用统一的工具函数生成键值进行比较
  const currentKey = buildEditorTabKey(currentRoute.value.path, currentRoute.value.query);
  const tabKey = getTabKey(tabRoute);
  return currentKey === tabKey;
}

/**
 * 生成 Tab 的唯一键（使用统一的工具函数）
 * @param {VisitedRoute} tabRoute - 路由对象
 * @returns {string} Tab 的唯一键
 */
function getTabKey(tabRoute: VisitedRoute): string {
  return buildEditorTabKey(tabRoute.path, tabRoute.query || {});
}

/**
 * 获取 Tab 的显示标题（优先使用自定义标题）
 * @param {VisitedRoute} tabRoute - 路由对象
 * @returns {string} Tab 显示标题
 */
function getTabTitle(tabRoute: VisitedRoute): string {
  const key = getTabKey(tabRoute);
  const customTitle = ideStore.getTabTitle(key);
  if (customTitle) {
    return customTitle;
  }
  const fallbackTitle = tabRoute.meta?.title || tabRoute.name || '';
  return fallbackTitle;
}

// 监听路由变化，自动添加到访问列表
nextTick(() => {
  // 初始化完成后，手动检查当前路由（处理直接访问 URL 的情况）
  const currentPath = route.path;
  if (shouldRecord(currentPath, route.query, !!route.meta?.title)) {
    addOrUpdate(route);
  }
});

watch(
  () => route,
  (newRoute) => {
    const path = newRoute.path;
    const query = newRoute.query;
    const hasTitle = !!newRoute.meta?.title;
    const should = shouldRecord(path, query, hasTitle);
    if (should) {
      addOrUpdate(newRoute);
    }
  },
  { immediate: true, deep: true }
);

// 监听 Tab 数量，为空时自动跳转到仪表盘
watch(
  () => visitedRoutes.value.length,
  (length) => {
    if (length === 0) {
      const dashboardPath = '/editor/ide/dashboard';
      if (currentRoute.value.path !== dashboardPath && navigatingToPath !== dashboardPath) {
        navigatingToPath = dashboardPath;
        router.push(dashboardPath).finally(() => {
          navigatingToPath = null;
        });
      }
    }
  }
);

/**
 * 点击 Tab：跳转到对应路由
 * @param {VisitedRoute} targetRoute - 目标路由对象
 * @returns {Promise<void>}
 */
function handleTabClick(targetRoute: VisitedRoute) {
  const currentKey = buildEditorTabKey(currentRoute.value.path, currentRoute.value.query);
  const targetKey = getTabKey(targetRoute);

  console.log('[Tab Workbench] 点击 Tab:', {
    current: currentKey,
    target: targetKey,
    isSame: currentKey === targetKey
  });

  // 如果点击的是当前路由（比较完整的键值，包括 query），不执行导航
  if (currentKey === targetKey) {
    console.log('[Tab Workbench] 已经是当前 Tab，跳过导航');
    return;
  }

  // 如果正在导航到同一个目标，不重复执行
  if (navigatingToPath === targetKey) {
    console.log('[Tab Workbench] 正在导航中，跳过重复导航');
    return;
  }

  // 设置导航目标并执行导航（必须传递完整的 path 和 query）
  navigatingToPath = targetKey;
  console.log('[Tab Workbench] 开始导航:', { path: targetRoute.path, query: targetRoute.query });
  router.push({ path: targetRoute.path, query: targetRoute.query }).finally(() => {
    navigatingToPath = null;
  });
}

/**
 * 关闭 Tab：删除记录
 * @param {VisitedRoute} targetRoute - 目标路由对象
 * @param {number} index - Tab 索引
 * @returns {Promise<void>}
 */
function handleTabClose(targetRoute: VisitedRoute, index: number) {
  const currentKey = buildEditorTabKey(currentRoute.value.path, currentRoute.value.query);
  const closingKey = getTabKey(targetRoute);
  const isCurrentTab = currentKey === closingKey;

  console.log('[Tab Workbench] 关闭 Tab:', {
    closing: closingKey,
    isCurrentTab
  });

  // 从访问列表中移除
  removeAt(index);

  // 如果关闭的是当前 Tab 且还有其他 Tab，跳转到相邻的 Tab
  if (isCurrentTab && visitedRoutes.value.length > 0) {
    const targetIndex = Math.min(index, visitedRoutes.value.length - 1);
    const nextRoute = visitedRoutes.value[targetIndex];
    const nextKey = getTabKey(nextRoute);

    if (currentKey !== nextKey && navigatingToPath !== nextKey) {
      navigatingToPath = nextKey;
      console.log('[Tab Workbench] 跳转到相邻 Tab:', { path: nextRoute.path, query: nextRoute.query });
      router.push({ path: nextRoute.path, query: nextRoute.query }).finally(() => {
        navigatingToPath = null;
      });
    }
  }
  // 当没有 Tab 时，watch 会自动跳转到仪表盘
}

/**
 * 右键菜单相关方法（复用 useContextMenu）
 */

/**
 * 处理右键菜单事件
 * @param {MouseEvent} event - 鼠标事件对象
 * @param {VisitedRoute} targetRoute - 目标路由对象
 * @param {number} index - Tab 索引
 * @returns {void}
 */
function handleContextMenu(event: MouseEvent, targetRoute: VisitedRoute, index: number) {
  const menuWidth = 140;
  const menuHeight = 130;
  const offset = 4;
  let x = event.clientX + offset;
  let y = event.clientY + offset;

  if (x + menuWidth > window.innerWidth) {
    x = event.clientX - menuWidth - offset;
  }
  if (y + menuHeight > window.innerHeight) {
    y = event.clientY - menuHeight - offset;
  }

  contextMenu.value = { visible: true, x, y, targetIndex: index };
}

/**
 * 关闭右键菜单
 * @returns {void}
 */
function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenu.value.targetIndex = -1;
}

/**
 * 处理右键菜单"关闭"操作
 * @returns {void}
 */
function handleCloseTab() {
  if (contextMenu.value.targetIndex >= 0) {
    handleTabClose(visitedRoutes.value[contextMenu.value.targetIndex], contextMenu.value.targetIndex);
  }
  closeContextMenu();
}

/**
 * 处理右键菜单"关闭其他"操作
 * @returns {Promise<void>}
 */
function handleCloseOthers() {
  if (contextMenu.value.targetIndex >= 0) {
    const targetRoute = visitedRoutes.value[contextMenu.value.targetIndex];
    const currentKey = buildEditorTabKey(currentRoute.value.path, currentRoute.value.query);
    const targetKey = getTabKey(targetRoute);

    keepOnly(targetRoute);

    if (currentKey !== targetKey) {
      console.log('[Tab Workbench] 关闭其他后跳转:', { path: targetRoute.path, query: targetRoute.query });
      router.push({ path: targetRoute.path, query: targetRoute.query });
    }
  }
  closeContextMenu();
}

/**
 * 处理右键菜单"关闭右侧"操作
 * @returns {Promise<void>}
 */
function handleCloseRight() {
  if (contextMenu.value.targetIndex >= 0) {
    const targetRoute = visitedRoutes.value[contextMenu.value.targetIndex];
    truncateAfter(contextMenu.value.targetIndex);

    // 如果当前路由在被删除的范围内，跳转到目标 Tab
    const currentKey = buildEditorTabKey(currentRoute.value.path, currentRoute.value.query);
    const currentIndex = visitedRoutes.value.findIndex(r => getTabKey(r) === currentKey);
    if (currentIndex < 0 || currentIndex > contextMenu.value.targetIndex) {
      console.log('[Tab Workbench] 关闭右侧后跳转:', { path: targetRoute.path, query: targetRoute.query });
      router.push({ path: targetRoute.path, query: targetRoute.query });
    }
  }
  closeContextMenu();
}

/**
 * 处理右键菜单"关闭所有"操作
 * @returns {void}
 */
function handleCloseAll() {
  clear();
  closeContextMenu();
  // watch 会自动跳转到仪表盘
}
</script>

<style lang="scss" src="./index.scss"></style>
