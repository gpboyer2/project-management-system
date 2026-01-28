<!--
  编辑器统一布局组件
  根据路由路径动态渲染对应的编辑器组件
  路由格式：/editor/ide/logic 或 /editor/ide/protocol
    logic: 层级节点编辑器（带 interfaceId 时为节点接口编辑）
    protocol: 协议算法报文编辑器

  子组件直接从 URL 读取参数，不再通过 props 传递数据
-->
<template>
  <div class="editor-layout">
    <!-- 组件加载错误 -->
    <div v-if="componentError" class="editor-layout-error">
      <div class="editor-layout-error-content">
        <div class="editor-layout-error-icon">
          <WarningFilled />
        </div>

        <div class="editor-layout-error-title">
          组件加载失败
        </div>

        <div class="editor-layout-error-desc">
          {{ componentError.message }}
        </div>

        <button class="editor-layout-error-btn" @click="handleRetry">
          重试
        </button>

        <button class="editor-layout-error-btn editor-layout-error-btn--secondary" @click="router.push('/')">
          返回首页
        </button>
      </div>
    </div>

    <!-- 未知的编辑器类型 -->
    <div v-else-if="!currentComponent" class="editor-layout-error">
      <div class="editor-layout-error-content">
        <div class="editor-layout-error-icon">
          ?
        </div>

        <div class="editor-layout-error-title">
          未知的编辑器类型
        </div>

        <div class="editor-layout-error-desc">
          类型：{{ editor_type }}<br />
          请从左侧资源管理器选择有效的节点
        </div>

        <button class="editor-layout-error-btn" @click="router.push('/')">
          返回首页
        </button>
      </div>
    </div>

    <!-- 动态渲染编辑器组件 -->
    <!-- 子组件直接从 URL 读取参数，不再传递 props -->
    <component
      :is="currentComponent"
      v-else
      :key="route.path"
      class="editor-layout-content"
      @error="handleComponentError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent, onErrorCaptured, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VALID_EDITOR_TYPES, type EditorType, inferEditorTypeFromPath } from '@/utils/routeParamHelper';

const route = useRoute();
const router = useRouter();

// 从路由路径推断编辑器类型
const editor_type = computed(() => {
  return inferEditorTypeFromPath(route.path);
});

// 组件加载错误状态
const componentError = ref<{ message: string; retryPath?: string } | null>(null);

// 简单的加载组件（使用渲染函数，避免运行时编译）
const LoadingComponent = {
  render() {
    return h('div', { class: 'editor-layout-loading' }, '加载中...');
  }
};

// 错误组件（使用渲染函数，避免运行时编译）
const ErrorComponent = {
  render() {
    return h('div', { class: 'editor-layout-component-error' }, '组件加载失败');
  }
};

/**
 * 处理组件错误
 * @param {any} error - 错误对象
 */
function handleComponentError(error: any) {
  console.error('[editor-layout] 组件渲染错误:', error);
  componentError.value = {
    message: error?.message || '组件渲染过程中发生错误',
    retryPath: route.path
  };
}

/**
 * 处理异步组件加载错误
 * @param {Error} error - 错误对象
 */
function handleAsyncComponentError(error: Error) {
  console.error('[editor-layout] 异步组件加载失败:', error);
  componentError.value = {
    message: `组件加载失败: ${error.message}`,
    retryPath: route.path
  };
}

/**
 * 重试加载组件
 */
function handleRetry() {
  componentError.value = null;
  router.replace(route.path);
}

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  console.error('[editor-layout] 捕获子组件错误:', err, info);
  componentError.value = {
    message: `组件错误: ${err.message}`,
    retryPath: route.path
  };
  return false;
});

// 直接引入各个编辑器组件
const LogicNodeDashboard = defineAsyncComponent({
  loader: () => import('@/views/ide/components/logic-node-dashboard/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onError: handleAsyncComponentError,
  delay: 200
});

const LogicNodeInterface = defineAsyncComponent({
  loader: () => import('@/views/ide/components/logic-node-interface/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onError: handleAsyncComponentError,
  delay: 200
});

const ProtocolInterface = defineAsyncComponent({
  loader: () => import('@/views/ide/components/protocol-interface/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onError: handleAsyncComponentError,
  delay: 200
});

const LogicFlowEditor = defineAsyncComponent({
  loader: () => import('@/views/ide/components/logic-flow-editor/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onError: handleAsyncComponentError,
  delay: 200
});

const HierarchyNodeDashboard = defineAsyncComponent({
  loader: () => import('@/views/ide/components/hierarchy-node-dashboard/index.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  onError: handleAsyncComponentError,
  delay: 200
});

// 当前应该渲染的组件（根据路由参数动态选择）
const currentComponent = computed(() => {
  const type = editor_type.value;
  if (!type || !VALID_EDITOR_TYPES.includes(type)) {
    return null;
  }

  // flow 类型：逻辑流编排编辑器
  if (type === 'flow') {
    return LogicFlowEditor;
  }

  // logic 类型根据是否有 interfaceId 动态选择组件
  if (type === 'logic') {
    const hasInterfaceId = route.query.interfaceId && String(route.query.interfaceId).trim() !== '';
    return hasInterfaceId ? LogicNodeInterface : LogicNodeDashboard;
  }

  // protocol 类型
  if (type === 'protocol') {
    return ProtocolInterface;
  }

  // hierarchy 类型：层级节点概览（未启用通信节点列表的层级）
  if (type === 'hierarchy') {
    return HierarchyNodeDashboard;
  }

  return null;
});
</script>

<style lang="scss" src="./index.scss"></style>
