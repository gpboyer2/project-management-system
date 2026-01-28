<!--
  通用VisNetwork网络拓扑图组件
  基于vis-network库，提供可复用的网络拓扑图展示功能
  支持自定义样式、交互事件、数据绑定等
-->

<template>
  <div
    class="vis-network-container"
    :class="{
      'vis-network-loading': loading,
      'vis-network-error': hasError
    }"
    :style="{
      height: height,
      width: width
    }"
  >
    <!-- 专用于 vis-network 的容器，与 Vue 覆盖层分离 -->
    <div
      ref="networkContainer"
      class="vis-network-canvas"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="vis-network-loading-overlay">
      <div class="loading-spinner" />

      <div class="loading-text">
        {{ loadingText }}
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="hasError" class="vis-network-error-overlay">
      <div class="error-icon">
        <CircleClose />
      </div>

      <div class="error-text">
        {{ errorMessage }}
      </div>

      <button
        v-if="showRetryButton"
        class="button button-primary"
        @click="handleRetry"
      >
        重试
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && !hasError && !hasData" class="vis-network-empty-overlay">
      <div class="empty-icon">
        <Box />
      </div>

      <div class="empty-text">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  computed
} from 'vue';
import { Network, type Options, type IdType } from 'vis-network/standalone';
import { DataSet as VisDataSet } from 'vis-data';
import type { TopologyNode, TopologyEdge } from '@/stores/topology';

/**
 * 组件配置接口
 * 将多个相关配置合并为一个 options 对象
 */
interface VisNetworkCompOptions {
  // 原有的 vis-network 配置
  compOptions?: Options;

  // 状态配置
  loading?: boolean;
  loadingText?: string;
  hasError?: boolean;
  errorMessage?: string;
  hasData?: boolean;
  emptyText?: string;
  showRetryButton?: boolean;

  // 功能开关配置
  enablePhysics?: boolean;
  enableNavigation?: boolean;
  enableKeyboard?: boolean;
  enableTooltip?: boolean;
  enableSelection?: boolean;

  // 样式配置
  height?: string;
  width?: string;
}

// Props 定义 - 使用 options 模式简化传参
const props = defineProps<{
  // 核心数据保持独立
  nodes: TopologyNode[];
  edges: TopologyEdge[];

  // 所有配置合并为一个 options 对象
  options?: VisNetworkCompOptions;
}>();

// 组件默认配置
const componentDefaultOptions: VisNetworkCompOptions = {
  // 状态默认值
  loading: false,
  loadingText: '正在加载网络拓扑图...',
  hasError: false,
  errorMessage: '网络拓扑图加载失败',
  hasData: true,
  emptyText: '暂无拓扑数据',
  showRetryButton: true,

  // 功能开关默认值
  enablePhysics: true,
  enableNavigation: true,
  enableKeyboard: true,
  enableTooltip: true,
  enableSelection: true,

  // 样式默认值
  height: '100%',
  width: '100%'
};

// 合并后的配置
const mergedOptions = computed(() => ({ ...componentDefaultOptions, ...props.options }));

// 兼容旧版 props 的 getter（用于模板中）
const loading = computed(() => mergedOptions.value.loading);
const loadingText = computed(() => mergedOptions.value.loadingText ?? componentDefaultOptions.loadingText);
const hasError = computed(() => mergedOptions.value.hasError);
const errorMessage = computed(() => mergedOptions.value.errorMessage ?? componentDefaultOptions.errorMessage);
const hasData = computed(() => mergedOptions.value.hasData);
const emptyText = computed(() => mergedOptions.value.emptyText ?? componentDefaultOptions.emptyText);
const showRetryButton = computed(() => mergedOptions.value.showRetryButton);
const enablePhysics = computed(() => mergedOptions.value.enablePhysics ?? componentDefaultOptions.enablePhysics);
const enableNavigation = computed(() => mergedOptions.value.enableNavigation ?? componentDefaultOptions.enableNavigation);
const enableKeyboard = computed(() => mergedOptions.value.enableKeyboard ?? componentDefaultOptions.enableKeyboard);
const enableTooltip = computed(() => mergedOptions.value.enableTooltip ?? componentDefaultOptions.enableTooltip);
const enableSelection = computed(() => mergedOptions.value.enableSelection ?? componentDefaultOptions.enableSelection);
const height = computed(() => mergedOptions.value.height ?? componentDefaultOptions.height);
const width = computed(() => mergedOptions.value.width ?? componentDefaultOptions.width);
const compOptions = computed(() => mergedOptions.value.compOptions ?? {});

// Emits定义
const emit = defineEmits<{
  // 选择事件
  selectNode: [nodeId: IdType | null, node?: TopologyNode]
  selectEdge: [edgeId: IdType | null, edge?: TopologyEdge]
  deselect: []

  // 悬停事件
  hoverNode: [nodeId: IdType, node?: TopologyNode]
  blurNode: [nodeId: IdType]

  // 点击事件
  click: [params: any]
  doubleClick: [params: any]

  // 拖拽事件
  dragStart: [params: any]
  dragEnd: [params: any]

  // 缩放和平移事件
  zoom: [scale: number]
  pan: [position: { x: number, y: number }]

  // 完成事件
  stabilized: [iterations: number]
  ready: []

  // 错误事件
  error: [error: Error]

  // 重试事件
  retry: []
}>();

// 响应式引用
const networkContainer = ref<HTMLElement>();
let network: Network | null = null;
let nodesDataSet: VisDataSet<TopologyNode>;
let edgesDataSet: VisDataSet<TopologyEdge>;
let isInitialized = ref(false);

// 计算属性
const networkOptions = computed(() => {
  const defaultOptions: Options = {
    // 配置管理器设置
    configure: {
      enabled: false,
      filter: false,
      showButton: false
    },

    // 节点配置
    nodes: {
      shape: 'circle',
      size: 25,
      font: {
        size: 14,
        color: '#ffffff',
        face: 'arial',
        strokeWidth: 0,
        strokeColor: 'transparent'
      },
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.2)',
        size: 5,
        x: 2,
        y: 2
      }
    },

    // 边配置
    edges: {
      width: 2,
      color: {
        color: '#868e96',
        highlight: '#495057',
        hover: '#6c757d'
      },
      smooth: {
        enabled: true,
        type: 'continuous',
        roundness: 0.5
      },
      font: {
        size: 12,
        align: 'middle',
        background: 'rgba(255, 255, 255, 0.9)',
        strokeWidth: 1,
        strokeColor: '#ffffff',
        color: '#333333'
      },
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.1)',
        size: 3,
        x: 1,
        y: 1
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.8,
          type: 'arrow'
        }
      }
    },

    // 物理引擎配置
    physics: {
      enabled: enablePhysics.value,
      barnesHut: {
        gravitationalConstant: -20000,
        centralGravity: 0.3,
        springLength: 120,
        springConstant: 0.04,
        damping: 0.09,
        avoidOverlap: 0.5
      },
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08,
        damping: 0.4
      },
      solver: 'forceAtlas2Based',
      stabilization: {
        enabled: true,
        iterations: 100,
        updateInterval: 25,
        onlyDynamicEdges: false,
        fit: true
      }
    },

    // 交互配置
    interaction: {
      hover: enableTooltip.value,
      tooltipDelay: 200,
      hideEdgesOnDrag: false,
      hideNodesOnDrag: false,
      dragNodes: true,
      dragView: true,
      zoomView: true,
      navigationButtons: enableNavigation.value,
      keyboard: enableKeyboard.value,
      multiselect: false,
      selectable: enableSelection.value,
      selectConnectedEdges: true
    },

    // 布局配置
    layout: {
      randomSeed: 2,
      improvedLayout: true,
      clusterThreshold: 150,
      hierarchical: {
        enabled: false,
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'UD',
        sortMethod: 'directed'
      }
    },

    // 操作配置
    manipulation: {
      enabled: false,
      initiallyActive: false,
      addNode: true,
      addEdge: true,
      deleteNode: true,
      deleteEdge: true
    }
  };

  return { ...defaultOptions, ...compOptions.value };
});

/**
 * 初始化网络图
 * 创建 vis-network 实例并绑定事件监听器
 * @returns {Promise<void>} 异步初始化完成的 Promise
 */
async function initializeNetwork() {
  if (!networkContainer.value || isInitialized.value) return;

  try {
    await nextTick();

    // 初始化数据集
    nodesDataSet = new VisDataSet(props.nodes);
    edgesDataSet = new VisDataSet(props.edges);

    // 创建网络实例
    network = new Network(
      networkContainer.value,
      { nodes: nodesDataSet, edges: edgesDataSet },
      networkOptions.value
    );

    // 绑定事件监听器
    bindEventListeners();

    isInitialized.value = true;

    // 适应视图
    if (props.nodes.length > 0) {
      network.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeInOutQuad'
        }
      });
    }

    emit('ready');
    console.log('VisNetwork 初始化完成');

  } catch (error) {
    console.error('VisNetwork 初始化失败:', error);
    emit('error', error instanceof Error ? error : new Error('Unknown error'));
  }
}

/**
 * 绑定事件监听器
 * 为网络图实例绑定各种交互事件
 * @returns {void}
 */
function bindEventListeners() {
  if (!network) return;

  // 选择事件
  network.on('selectNode', (event) => {
    if (!isInitialized.value) return;
    const nodeId = event.nodes.length > 0 ? event.nodes[0] : null;
    const node = nodeId ? nodesDataSet?.get(nodeId) : undefined;
    emit('selectNode', nodeId, node);
  });

  network.on('selectEdge', (event) => {
    if (!isInitialized.value) return;
    const edgeId = event.edges.length > 0 ? event.edges[0] : null;
    const edge = edgeId ? edgesDataSet?.get(edgeId) : undefined;
    emit('selectEdge', edgeId, edge);
  });

  network.on('deselectNode', () => {
    if (!isInitialized.value) return;
    emit('deselect');
  });

  // 悬停事件
  network.on('hoverNode', (event) => {
    if (!isInitialized.value) return; // 组件已销毁，忽略事件
    const nodeId = event.node;
    const node = nodesDataSet?.get(nodeId);
    emit('hoverNode', nodeId, node);
    if (networkContainer.value) {
      networkContainer.value.style.cursor = 'pointer';
    }
  });

  network.on('blurNode', (event) => {
    if (!isInitialized.value) return; // 组件已销毁，忽略事件
    const nodeId = event?.node;
    emit('blurNode', nodeId);
    if (networkContainer.value) {
      networkContainer.value.style.cursor = 'default';
    }
  });

  // 点击事件
  network.on('click', (event) => {
    if (!isInitialized.value) return;
    emit('click', event);
  });

  network.on('doubleClick', (event) => {
    if (!isInitialized.value) return;
    emit('doubleClick', event);
  });

  // 拖拽事件
  network.on('dragStart', (event) => {
    if (!isInitialized.value) return;
    // 拖拽开始时解除节点固定，允许拖动
    if (event.nodes && event.nodes.length > 0 && nodesDataSet) {
      const nodeId = event.nodes[0];
      nodesDataSet.update({
        id: nodeId,
        fixed: false
      });
    }
    emit('dragStart', event);
  });

  network.on('dragEnd', (event) => {
    if (!isInitialized.value) return;
    // 拖拽结束后固定节点位置，防止物理引擎将节点拉回原位
    if (event.nodes && event.nodes.length > 0 && nodesDataSet) {
      const nodeId = event.nodes[0];
      const position = network?.getPositions([nodeId])?.[nodeId];
      if (position) {
        nodesDataSet.update({
          id: nodeId,
          x: position.x,
          y: position.y,
          fixed: { x: true, y: true }
        });
      }
    }
    emit('dragEnd', event);
  });

  // 缩放事件
  network.on('zoom', (event) => {
    if (!isInitialized.value) return;
    const scale = event.scale;
    emit('zoom', scale);
  });

  // 平移事件
  network.on('pan', (event) => {
    if (!isInitialized.value) return;
    const position = { x: event.x, y: event.y };
    emit('pan', position);
  });

  // 稳定化完成事件
  network.on('stabilizationIterationsDone', (event) => {
    if (!isInitialized.value) return;
    emit('stabilized', event?.iterations ?? 0);
  });

  // 错误事件
  network.on('error', (error) => {
    if (!isInitialized.value) return;
    console.error('VisNetwork 错误:', error);
    emit('error', error);
  });
}

/**
 * 更新节点数据
 * 清空并重新添加所有节点数据
 * @param {TopologyNode[]} newNodes - 新的节点数据数组
 * @returns {void}
 */
function updateNodes(newNodes: TopologyNode[]) {
  if (!nodesDataSet) return;

  try {
    nodesDataSet.clear();
    nodesDataSet.add(newNodes);
  } catch (error) {
    console.error('更新节点数据失败:', error);
    emit('error', error instanceof Error ? error : new Error('Failed to update nodes'));
  }
}

/**
 * 更新边数据
 * 清空并重新添加所有边数据
 * @param {TopologyEdge[]} newEdges - 新的边数据数组
 * @returns {void}
 */
function updateEdges(newEdges: TopologyEdge[]) {
  if (!edgesDataSet) return;

  try {
    edgesDataSet.clear();
    edgesDataSet.add(newEdges);
  } catch (error) {
    console.error('更新边数据失败:', error);
    emit('error', error instanceof Error ? error : new Error('Failed to update edges'));
  }
}

/**
 * 适应视图
 * 调整视图以适应所有节点
 * @param {any} options - vis-network fit 方法的配置选项
 * @returns {void}
 */
function fit(options?: any) {
  if (!network) return;
  network.fit(options);
}

/**
 * 聚焦到指定节点
 * 将视图中心移动到指定节点
 * @param {IdType} nodeId - 节点 ID
 * @param {any} options - vis-network focus 方法的配置选项
 * @returns {void}
 */
function focus(nodeId: IdType, options?: any) {
  if (!network) return;
  network.focus(nodeId, options);
}

/**
 * 选择节点
 * 选中指定的节点
 * @param {IdType} nodeId - 节点 ID
 * @returns {void}
 */
function selectNode(nodeId: IdType) {
  if (!network) return;
  network.selectNodes([nodeId]);
}

/**
 * 选择边
 * 选中指定的边
 * @param {IdType} edgeId - 边 ID
 * @returns {void}
 */
function selectEdge(edgeId: IdType) {
  if (!network) return;
  network.selectEdges([edgeId]);
}

/**
 * 清除选择
 * 取消所有节点和边的选中状态
 * @returns {void}
 */
function clearSelection() {
  if (!network) return;
  network.unselectAll();
}

/**
 * 获取网络状态
 * 获取当前的缩放比例、视图位置和选中状态
 * @returns {{ scale: number, position: { x: number, y: number }, selectedNodes: IdType[], selectedEdges: IdType[] } | null} 网络状态对象，未初始化时返回 null
 */
function getNetworkState() {
  if (!network) return null;
  return {
    scale: network.getScale(),
    position: network.getViewPosition(),
    selectedNodes: network.getSelectedNodes(),
    selectedEdges: network.getSelectedEdges()
  };
}

/**
 * 设置网络状态
 * 设置缩放比例和视图位置
 * @param {{ scale?: number, position?: { x: number, y: number } }} state - 要设置的状态对象
 * @returns {void}
 */
function setNetworkState(state: { scale?: number; position?: { x: number; y: number } }) {
  if (!network) return;

  if (state.scale !== undefined) {
    network.moveTo({ scale: state.scale });
  }

  if (state.position) {
    network.moveTo(state.position);
  }
}

/**
 * 销毁网络
 * 清理网络实例、事件监听器和数据集
 * @returns {void}
 */
function destroyNetwork() {
  try {
    if (network) {
      // 先移除所有事件监听器，防止销毁后回调仍然执行
      try {
        network.off('selectNode');
        network.off('selectEdge');
        network.off('deselectNode');
        network.off('hoverNode');
        network.off('blurNode');
        network.off('click');
        network.off('doubleClick');
        network.off('dragStart');
        network.off('dragEnd');
        network.off('zoom');
        network.off('pan');
        network.off('stabilizationIterationsDone');
      } catch (e) {
        // 忽略移除事件监听器时的错误
      }
      // 销毁网络实例
      try {
        network.destroy();
      } catch (e) {
        // 忽略销毁时的错误
      }
      network = null;
    }
  } catch (e) {
    // 忽略所有销毁过程中的错误
  }
  nodesDataSet = null as any;
  edgesDataSet = null as any;
  isInitialized.value = false;
}

/**
 * 重试处理
 * 触发重试事件，如果网络未初始化则重新初始化
 * @returns {void}
 */
function handleRetry() {
  emit('retry');
  if (!isInitialized.value) {
    initializeNetwork();
  }
}

// 监听数据变化
watch(
  () => props.nodes,
  (newNodes) => {
    if (isInitialized.value) {
      updateNodes(newNodes);
    }
  },
  { deep: true }
);

watch(
  () => props.edges,
  (newEdges) => {
    if (isInitialized.value) {
      updateEdges(newEdges);
    }
  },
  { deep: true }
);

// 监听选项变化
watch(
  compOptions,
  (newOptions) => {
    if (network && isInitialized.value) {
      network.setOptions({ ...networkOptions.value, ...newOptions });
    }
  },
  { deep: true }
);

// 监听主题变化
const themeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      // 主题变化时重新设置网络选项
      if (network && isInitialized.value) {
        network.setOptions(networkOptions.value);
      }
    }
  });
});

// 监听DOM属性变化（主题切换）
const setupThemeObserver = () => {
  if (typeof document !== 'undefined') {
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
};

// 生命周期钩子
onMounted(async () => {
  await initializeNetwork();
  setupThemeObserver();
});

onBeforeUnmount(() => {
  // 先标记为未初始化，阻止所有事件回调执行
  isInitialized.value = false;
  // 然后销毁网络
  destroyNetwork();
  // 断开主题观察器
  try {
    themeObserver.disconnect();
  } catch (e) {
    // 忽略错误
  }
});

// 暴露方法给父组件
defineExpose({
  // 实例
  network,

  // 数据操作
  updateNodes,
  updateEdges,

  // 视图操作
  fit,
  focus,
  selectNode,
  selectEdge,
  clearSelection,

  // 状态管理
  getNetworkState,
  setNetworkState,

  // 生命周期
  initializeNetwork,
  destroyNetwork
});
</script>

<style lang="scss" src="./index.scss"></style>