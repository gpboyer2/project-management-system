<!--
  逻辑编辑器组件 (Logic Editor)
  复用 flowchart 的 LogicFlow 画布
  布局：画布区域 + 右侧工具箱/属性面板
  拆分后主组件仅负责数据协调和布局
-->
<template>
  <div class="ide-logic-editor">
    <!-- 左侧：画布区域 -->
    <div class="ide-logic-main">
      <div class="ide-logic-canvas">
        <PrimitiveNodeView ref="canvasRef" />

        <PrimitiveNodeEditor :flowchart-ref="canvasRef" />
      </div>

      <!-- 悬浮工具栏 -->
      <LogicToolbar
        :show-grid="showGrid"
        @save="handleSave"
        @auto-layout="handleAutoLayout"
        @toggle-grid="toggleGrid"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @fit-view="handleFitView"
        @simulate="handleSimulate"
      />

      <!-- 统计信息 -->
      <LogicStats
        :node-count="nodeCount"
        :edge-count="edgeCount"
      />
    </div>

    <!-- 右侧：工具箱与属性面板 -->
    <aside class="ide-logic-sidebar ide-layout-sidebar-right ide-toolbox">
      <!-- 顶部 Tab 切换 -->
      <div class="ide-toolbox-tabs">
        <button
          class="ide-toolbox-tab"
          :class="{ 'ide-toolbox-tab--active': activeRightTab === 'toolbox' }"
          @click="activeRightTab = 'toolbox'"
        >
          工具箱
        </button>

        <button
          class="ide-toolbox-tab"
          :class="{ 'ide-toolbox-tab--active': activeRightTab === 'properties' }"
          @click="activeRightTab = 'properties'"
        >
          属性
        </button>
      </div>

      <!-- 工具箱内容 -->
      <LogicToolbox
        :active-tab="activeRightTab"
        :comp-options="toolboxOptions"
        @interface-drag-start="handleContextInputDragStart"
        @node-drag-start="handlePaletteNodeDragStart"
      />

      <!-- 属性面板内容 -->
      <LogicProperties
        :active-tab="activeRightTab"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        :comp-options="propertiesOptions"
        @update-node-config="updateNodeConfig"
        @update-edge-label="updateEdgeLabel"
        @update-edge-color="updateEdgeColor"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useIdeStore } from '@/stores';
import PrimitiveNodeView from '@/components/node-view/index.vue';
import PrimitiveNodeEditor from '@/components/node-view/editor/index.vue';
import { getNodeForm } from '@/components/node-view/forms';
import { flowchartApi } from '@/api';
import { getMessageList } from '@/api/messageManagement';
import { communicationNodeApi } from '@/api/communicationNode';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';
import { convertNodeToInterfaceItem, type InterfaceItem } from '@/utils/dataAdapter';
import { buildEditorTabKey } from '@/utils/routeParamHelper';
import {
  getLfInstance,
  updateFlowStats,
  handleZoomIn as lfZoomIn,
  handleZoomOut as lfZoomOut,
  handleFitView as lfFitView,
  toggleGrid as lfToggleGrid,
  updateNodeConfig as lfUpdateNodeConfig,
  updateEdgeLabel as lfUpdateEdgeLabel,
  updateEdgeColor as lfUpdateEdgeColor,
  getGraphData
} from '@/utils/flowchartUtils';
import LogicToolbar from './components/logic-toolbar/index.vue';
import LogicToolbox from './components/logic-toolbox/index.vue';
import LogicProperties from './components/logic-properties/index.vue';
import LogicStats from './components/logic-stats/index.vue';
import { MESSAGE } from '@/constants';
import { NODE_TYPE } from '@/views/ide/constants';

const route = useRoute();
const ideStore = useIdeStore();

// 从 URL query 获取上下文（禁止使用 route.params）
const nodeId = computed(() => String(route.query.systemNodeId || '').trim());
const logicId = computed(() => String(route.query.logicId || '').trim());
const logicName = computed(() => String(route.query.logicName || '').trim());

// 画布引用
const canvasRef = ref<InstanceType<typeof PrimitiveNodeView> | null>(null);

// 右侧栏 Tab
const activeRightTab = ref<'toolbox' | 'properties'>('toolbox');

// 网格显示状态
const showGrid = ref(true);

// NOTE: 拖拽行为对齐 views/flowchart（该版本验证为正确）：只调用 lf.dnd.startDrag，
// 不在此组件内做 stopDrag / 全局兜底监听，避免残留 fakerNode 跟随的问题。
//
// 但线上仍复现“放下后继续跟随鼠标”，根因来自 LogicFlow DnD 内部实现：
// - overlay 的 onMouseUp 才会执行 onDrop() 来 removeFakerNode()
// - document mouseup 触发 stopDrag() 只会清 nodeConfig，不会清 fakerNode
// 当 mouseup 没到达 overlay（被 stopPropagation 拦截）时，就会遗留 fakerNode 持续跟随。
// 因此这里加一个“延迟兜底清理”：全局 capture 收到 pointerup/mouseup 后 setTimeout(0)，
// 若 dnd.fakerNode 仍存在，则清理 fakerNode（不影响正常 drop，因为 drop 会先把 fakerNode 清掉）。
const dndSessionActive = ref(false);
let cleanupDndListeners: null | (() => void) = null;
let dndCleanupScheduled = false;

// 统计数据
const nodeCount = ref(0);
const edgeCount = ref(0);

interface LogicNodeData {
  id: string
  type: string
  properties?: Record<string, any>
}

interface LogicEdgeData {
  id: string
  label?: string
  color?: string
}

// 选中的节点/边
const selectedNode = ref<LogicNodeData | null>(null);
const selectedEdge = ref<LogicEdgeData | null>(null);

// 节点配置（用于属性面板绑定）
const nodeConfig = ref<Record<string, any>>({});

// 报文配置选项
const packetOptions = ref<Array<{ value: string | number; label: string }>>([]);

// 节点分类数据
const processingNodes = ref([
  { type: NODE_TYPE.PARSE, label: '协议解析' },
  { type: NODE_TYPE.SERIALIZE, label: '协议打包' }
]);

const communicationNodes = ref([
  { type: NODE_TYPE.TCP_IN, label: 'TCP 输入' },
  { type: NODE_TYPE.TCP_OUT, label: 'TCP 输出' },
  { type: 'udp-in-node', label: 'UDP 输入' },
  { type: 'udp-out-node', label: 'UDP 输出' }
]);

// 当前节点接口
const contextInputList = computed<any[]>(() => {
  const list = ideStore.currentNodeInterfaceList || [];
  return Array.isArray(list) ? list : [];
});

/**
 * 加载当前节点的接口列表
 * @returns {Promise<void>} 异步加载节点接口并更新到 store
 */
async function loadContextInterfaces() {
  const id = nodeId.value;
  if (!id) {
    ideStore.setCurrentNodeInterfaceList([]);
    return;
  }

  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(id);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '确保节点接口容器失败');
    }

    const response = await communicationNodeApi.getListByNodeId(id);
    if (response.status !== 'success') {
      throw new Error(response.message || '加载节点接口容器失败');
    }

    const container: any =
      Array.isArray((response as any).datum) && (response as any).datum.length > 0
        ? (response as any).datum[0]
        : ensureRes.datum;

    const endpointList = Array.isArray(container?.endpoint_description) ? container.endpoint_description : [];
    const newInterfaceList: InterfaceItem[] = [];

    for (const endpointRaw of endpointList) {
      const interface_id = String(endpointRaw?.interface_id || '').trim();
      if (!interface_id) continue;

      // 兼容 convertNodeToInterfaceItem：保证 endpoint.type 为 string，避免 includes 报错
      const endpoint = { ...(endpointRaw || {}), type: String(endpointRaw?.type || '') };
      const fake_comm_node: any = {
        id: interface_id,
        name: String(endpoint?.name || '').trim() || interface_id,
        endpoint_description: [endpoint]
      };

      const item = convertNodeToInterfaceItem(fake_comm_node);
      item.raw = endpointRaw;
      newInterfaceList.push(item);
    }

    ideStore.setCurrentNodeInterfaceList(newInterfaceList);
  } catch (error) {
    console.error('加载当前节点接口列表失败:', error);
    ideStore.setCurrentNodeInterfaceList([]);
  }
}

/**
 * 加载节点名称（用于设置标签页标题）
 */
async function loadNodeName(): Promise<string> {
  const id = nodeId.value;
  if (!id) return '未命名节点';

  try {
    const result = await systemLevelDesignTreeApi.getNodeById(id);
    if (result.status === 'success' && result.datum) {
      const datum = result.datum as any;
      return datum?.properties?.['名称'] || datum?.name || '未命名节点';
    }
  } catch (error) {
    console.error('[Logic Flow Editor] 获取节点名称失败:', error);
  }
  return '未命名节点';
}

/**
 * 设置标签页标题
 * 格式：{节点名}/{逻辑流名称} 或 {节点名}/编排
 * 超过6字符时截断并添加省略号
 */
async function updateTabTitle() {
  let nodeName = await loadNodeName();
  let flowName = logicName.value || '编排';

  // 截断节点名（超过6字符）
  if (nodeName.length > 6) {
    nodeName = nodeName.slice(0, 6) + '...';
  }
  // 截断逻辑流名称（超过6字符）
  if (flowName.length > 6) {
    flowName = flowName.slice(0, 6) + '...';
  }

  const tabKey = buildEditorTabKey(route.path, route.query);
  ideStore.setTabTitle(tabKey, `${nodeName}/${flowName}`);
}

// 工具箱选项
const toolboxOptions = computed(() => ({
  contextInputList: contextInputList.value,
  processingNodes: processingNodes.value,
  communicationNodes: communicationNodes.value
}));

// 属性面板选项
const propertiesOptions = computed(() => ({
  packetOptions: packetOptions.value
}));

// 监听选中节点变化，自动切换到属性 Tab，并初始化 nodeConfig
watch(selectedNode, (newNode) => {
  if (newNode) {
    activeRightTab.value = 'properties';

    const nodeForm: any = getNodeForm(newNode.type) as any;
    const existingProps = newNode.properties || {};
    const mergedConfig: Record<string, any> = { ...existingProps };
    if (nodeForm && (nodeForm as any).defaults) {
      for (const [key, config] of Object.entries((nodeForm as any).defaults)) {
        if (mergedConfig[key] === undefined && (config as any).value !== undefined) {
          mergedConfig[key] = (config as any).value;
        }
      }
    }
    nodeConfig.value = mergedConfig;
  }
});

/**
 * 获取 LogicFlow 实例
 * @returns {any} LogicFlow 实例对象
 */
function getLf() {
  return getLfInstance(canvasRef);
}

/**
 * 更新统计数据
 * @returns {void}
 */
function updateStats() {
  const lf = getLf();
  if (!lf) return;

  const graphData = getGraphData(lf);
  const stats = updateFlowStats(graphData);
  nodeCount.value = stats.node_count;
  edgeCount.value = stats.edge_count;
}

/**
 * 保存流程图
 * @returns {Promise<void>} 异步保存流程图数据
 */
async function handleSave() {
  const lf = getLf();
  if (!lf) return;

  if (!nodeId.value) {
    ElMessage.warning('缺少 systemNodeId，无法保存逻辑流');
    return;
  }

  try {
    const graphData = getGraphData(lf);

    const saveData = {
      arch_node_id: nodeId.value,
      comm_node_id: undefined,
      // 逻辑流名称优先用 logicName，其次用 logicId，避免空标题
      name: (logicName.value || logicId.value || '').trim() || undefined,
      nodes: graphData.nodes || [],
      edges: graphData.edges || []
    };

    const response = await flowchartApi.save(saveData);
    if (response.status === 'success') {
      ElMessage.success(MESSAGE.SAVE_SUCCESS);
      ideStore.updateLastSaveTime();
    } else {
      ElMessage.error(response.message || MESSAGE.SAVE_FAILED);
    }
  } catch (error: any) {
    ElMessage.error(MESSAGE.SAVE_FAILED + '：' + (error.message || MESSAGE.UNKNOWN_ERROR));
  }
}

/**
 * 自动布局
 * @returns {void}
 */
function handleAutoLayout() {
  const lf = getLf();
  if (!lf) return;

  if (canvasRef.value?.autoLayout) {
    canvasRef.value.autoLayout();
  }
  ElMessage.success(MESSAGE.AUTO_LAYOUT_DONE);
}

/**
 * 切换网格显示
 * @returns {void}
 */
function toggleGrid() {
  showGrid.value = !showGrid.value;
  const lf = getLf();
  lfToggleGrid(lf, showGrid.value);
  if (lf && canvasRef.value?.setGridVisible) {
    canvasRef.value.setGridVisible(showGrid.value);
  }
}

/**
 * 放大画布
 * @returns {void}
 */
function handleZoomIn() {
  lfZoomIn(getLf());
}

/**
 * 缩小画布
 * @returns {void}
 */
function handleZoomOut() {
  lfZoomOut(getLf());
}

/**
 * 适应画布
 * @returns {void}
 */
function handleFitView() {
  lfFitView(getLf());
}

/**
 * 仿真运行
 * @returns {void}
 */
function handleSimulate() {
  const lf = getLf();
  if (!lf) return;

  // 兼容 emit 类型签名（部分版本要求 payload 参数）
  lf.emit('node-red:start', {});
  ElMessage.info(MESSAGE.SIMULATING);
}

/**
 * 处理工具箱节点拖拽开始
 * @param {any} node - 节点配置对象
 * @returns {void}
 */
function handlePaletteNodeDragStart(node: any) {
  const lf = getLf();
  if (!lf || !(lf as any).dnd) return;
  dndSessionActive.value = true;
  const nodeForm: any = getNodeForm(node.type) as any;
  const defaultProperties: Record<string, any> = {
    icon: '/images/function.svg',
    ui: 'node-red'
  };

  if (nodeForm && (nodeForm as any).defaults) {
    for (const [key, config] of Object.entries((nodeForm as any).defaults)) {
      if ((config as any).value !== undefined) {
        defaultProperties[key] = (config as any).value;
      }
    }
  }

  // 对齐 views/flowchart：直接调用 lf.dnd.startDrag
  (lf as any).dnd.startDrag({
    type: node.type,
    text: node.label,
    properties: defaultProperties
  });
}

/**
 * 处理 Context Input 拖拽开始
 * @param {any} iface - 接口配置对象
 * @returns {void}
 */
function handleContextInputDragStart(iface: any) {
  const lf = getLf();
  if (!lf || !(lf as any).dnd) return;
  dndSessionActive.value = true;
  const category = String(iface?.category || '').toLowerCase();
  const ifaceType = String(iface?.type || '').toLowerCase();

  let nodeType: any = NODE_TYPE.FUNCTION;
  if (category === 'tcp' || ifaceType === 'tcp') nodeType = NODE_TYPE.TCP_IN;
  else if (category === 'udp' || ifaceType === 'udp') nodeType = 'udp-in-node';
  else if (category === 'serial' || ifaceType === 'serial') nodeType = 'serial-node';

  const nodeForm: any = getNodeForm(nodeType) as any;
  const defaultProperties: Record<string, any> = {
    ui: 'node-red',
    interfaceId: iface?.id,
    interfaceName: iface?.name,
    interfaceType: iface?.type,
    category: iface?.category
  };

  if (nodeForm && (nodeForm as any).icon) {
    defaultProperties.icon = (nodeForm as any).icon;
  } else if (nodeType === NODE_TYPE.FUNCTION) {
    defaultProperties.icon = '/images/function.svg';
  }

  if (nodeForm && (nodeForm as any).defaults) {
    for (const [key, config] of Object.entries((nodeForm as any).defaults)) {
      if ((config as any).value !== undefined) {
        defaultProperties[key] = (config as any).value;
      }
    }
    if ((nodeForm as any).defaults.name) {
      defaultProperties.name = iface?.name || '';
    }
  }

  if (
    (nodeType === NODE_TYPE.TCP_IN || nodeType === NODE_TYPE.TCP_OUT || nodeType === 'udp-in-node' || nodeType === 'udp-out-node') &&
    typeof iface?.detail === 'string'
  ) {
    const m = iface.detail.trim().match(/^([^:\s]+)\s*:\s*(\d+)$/);
    if (m) {
      defaultProperties.host = m[1];
      defaultProperties.port = Number(m[2]);
    }
  }

  // 对齐 views/flowchart：直接调用 lf.dnd.startDrag
  (lf as any).dnd.startDrag({
    type: nodeType,
    text: iface?.name || '',
    properties: defaultProperties
  });
}

/**
 * 设置节点事件监听
 * @returns {void}
 */
function setupNodeEvents() {
  const lf = getLf();
  if (!lf) return;

  lf.on('node:click', ({ data }: { data: any }) => {
    selectedNode.value = data;
    selectedEdge.value = null;

    const nodeForm: any = getNodeForm(data.type) as any;
    const existingProps = data.properties || {};
    const mergedConfig: Record<string, any> = { ...existingProps };
    if (nodeForm && (nodeForm as any).defaults) {
      for (const [key, config] of Object.entries((nodeForm as any).defaults)) {
        if (mergedConfig[key] === undefined && (config as any).value !== undefined) {
          mergedConfig[key] = (config as any).value;
        }
      }
    }
    const hasNewDefaults = Object.keys(mergedConfig).some(
      key => existingProps[key] === undefined && mergedConfig[key] !== undefined
    );
    if (hasNewDefaults) {
      lf.setProperties(data.id, mergedConfig);
    }

    ideStore.selectElement(data.id, 'node', {
      ...data,
      properties: mergedConfig
    });
    updateStats();
  });

  lf.on('edge:click', ({ data }: { data: any }) => {
    selectedEdge.value = data;
    selectedNode.value = null;

    ideStore.selectElement(data.id, 'edge', data);
    updateStats();
  });

  lf.on('blank:click', () => {
    selectedNode.value = null;
    selectedEdge.value = null;
    ideStore.clearSelection();
  });

  lf.on('node:dnd-add', ({ data }: { data: any }) => {
    selectedNode.value = data;
    ideStore.selectElement(data.id, 'node', data);
    updateStats();
    // drop 成功：DnD 生命周期应结束
    dndSessionActive.value = false;
  });

  lf.on('node:delete', () => {
    updateStats();
  });

  lf.on('edge:add', () => {
    updateStats();
  });

  lf.on('edge:delete', () => {
    updateStats();
  });
}

/**
 * 加载流程图数据
 * @returns {Promise<void>} 异步加载并渲染流程图数据
 */
async function loadFlowchartData() {
  const lf = getLf();
  if (!lf) return;

  if (!nodeId.value) {
    updateStats();
    return;
  }

  try {
    // 以体系节点ID加载该节点的逻辑流画布数据
    const response = await flowchartApi.loadByArchNodeId(nodeId.value);
    if (response.status === 'success') {
      const result = response.datum as any;
      if (result && result.nodes && result.nodes.length > 0) {
        lf.render({
          nodes: result.nodes,
          edges: result.edges || []
        });
      }
    }
  } catch {
    // 未找到已保存的流程图属于正常情况
  }

  updateStats();
}

/**
 * 加载报文选项
 * @returns {Promise<void>} 异步加载报文配置列表并更新选项
 */
async function loadPacketOptions() {
  try {
    const response = await getMessageList();
    if (response.status === 'success') {
      const list = (response as any).datum?.list || [];
      if (Array.isArray(list) && list.length > 0) {
        packetOptions.value = list.map((p: any) => ({
          value: p.id,
          label: p.name
        }));
      }
    }
  } catch (error) {
    console.error('加载报文配置列表失败:', error);
  }
}

/**
 * 更新节点配置
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段值
 * @returns {void}
 */
function updateNodeConfig(fieldName: string, value: any) {
  if (!selectedNode.value) return;
  nodeConfig.value[fieldName] = value;
  lfUpdateNodeConfig(getLf(), selectedNode.value.id, { ...nodeConfig.value });
}

/**
 * 更新边标签
 * @param {string} label - 边标签文本
 * @returns {void}
 */
function updateEdgeLabel(label: string) {
  if (!selectedEdge.value) return;
  lfUpdateEdgeLabel(getLf(), selectedEdge.value.id, label);
  selectedEdge.value.label = label;
}

/**
 * 更新边颜色
 * @param {string} color - 边颜色值
 * @returns {void}
 */
function updateEdgeColor(color: string) {
  if (!selectedEdge.value) return;
  lfUpdateEdgeColor(getLf(), selectedEdge.value.id, color);
  selectedEdge.value.color = color;
}

onMounted(async () => {
  await nextTick();
  await loadContextInterfaces();
  await updateTabTitle();
  setupNodeEvents();
  loadFlowchartData();
  loadPacketOptions();

  const scheduleCleanupAfterPointerUp = () => {
    if (!dndSessionActive.value) return;
    if (dndCleanupScheduled) return;
    dndCleanupScheduled = true;
    setTimeout(() => {
      try {
        const lf = getLf();
        const dnd: any = (lf as any)?.dnd;
        // 先让 LogicFlow 自己 stopDrag（清 nodeConfig、移除其 document mouseup 监听）
        if (dnd && typeof dnd.stopDrag === 'function') {
          try {
            dnd.stopDrag();
          } catch {
            // ignore
          }
        }

        // 关键兜底：如果 fakerNode 仍存在，说明 overlay 的 onDrop 没跑到（mouseup 被拦截）
        // 此时主动清理 fakerNode，避免“放下后仍跟随鼠标”
        if (dnd?.fakerNode) {
          try {
            // snapline / faker node 都属于内部状态，优先走公开 API
            (lf as any)?.removeNodeSnapLine?.();
            (lf as any)?.graphModel?.removeFakerNode?.();
          } catch {
            // ignore
          }
          dnd.fakerNode = null;
        }
      } finally {
        dndSessionActive.value = false;
        dndCleanupScheduled = false;
      }
    }, 0);
  };

  // 捕获阶段：避免被业务层 stopPropagation 拦截，保证能收到 pointerup/mouseup
  window.addEventListener('mouseup', scheduleCleanupAfterPointerUp, true);
  window.addEventListener('pointerup', scheduleCleanupAfterPointerUp, true);
  window.addEventListener('touchend', scheduleCleanupAfterPointerUp, true);

  cleanupDndListeners = () => {
    window.removeEventListener('mouseup', scheduleCleanupAfterPointerUp, true);
    window.removeEventListener('pointerup', scheduleCleanupAfterPointerUp, true);
    window.removeEventListener('touchend', scheduleCleanupAfterPointerUp, true);
  };
});

watch(
  () => nodeId.value,
  async (newId, oldId) => {
    if (newId === oldId) return;
    await loadContextInterfaces();
    await updateTabTitle();
  }
);

onBeforeUnmount(() => {
  if (cleanupDndListeners) cleanupDndListeners();
  cleanupDndListeners = null;
});
</script>

<style lang="scss" src="./index.scss"></style>
