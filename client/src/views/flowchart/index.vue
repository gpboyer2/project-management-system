<!--
  流程图编辑页面
  集成Node-RED风格的节点调色板和vis-network画布
  拆分后主组件仅负责数据协调和布局
-->

<template>
  <div class="page-flowchart" tabindex="0">
    <!-- 主要内容区域 -->
    <div class="flowchart-content">
      <!-- 左侧节点调色板 -->
      <FlowchartPalette
        :nodes-data="nodesData"
        @node-drag-start="handlePaletteNodeDragStart"
      />

      <!-- 中间画布区域 -->
      <div class="flowchart-main">
        <!-- 顶部工具栏 -->
        <FlowchartHeader
          :comp-options="{
            commNodeName,
            nodeCount,
            edgeCount,
            showGrid,
            showProperties
          }"
          @go-back="goBack"
          @save="saveFlowchart"
          @export="exportFlowchart"
          @import="showImportDialog = true"
          @select-all="selectAllNodes"
          @auto-layout="autoLayout"
          @clear="clearCanvas"
          @toggle-grid="toggleGrid"
          @toggle-properties="toggleProperties"
          @update-name="handleUpdateCommNodeName"
        />

        <!-- 画布内容区域 -->
        <div class="flowchart-content-area">
          <PrimitiveNodeView ref="flowchartCanvasRef" />

          <PrimitiveNodeEditor :flowchart-ref="flowchartCanvasRef" />
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <FlowchartProperties
        :comp-options="{
          show_panel: showProperties,
          right_panel_width: rightPanelWidth,
          packet_options: packetOptions
        }"
        :selected-node="selectedNode"
        :selected-edge="selectedEdge"
        @close="toggleProperties"
        @resize-start="startResize"
        @update-node-config="updateNodeConfig"
        @update-edge-label="updateEdgeLabel"
        @update-edge-color="updateEdgeColor"
      />
    </div>

    <!-- 导入对话框 -->
    <FlowchartImportDialog
      :visible="showImportDialog"
      @close="closeImportDialog"
      @confirm="confirmImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getMessageList } from '@/api/messageManagement';
import PrimitiveNodeView from '@/components/node-view/index.vue';
import PrimitiveNodeEditor from '@/components/node-view/editor/index.vue';
import { getNodeForm } from '@/components/node-view/forms';
import { flowchartApi } from '@/api';
import FlowchartPalette from './components/flowchart-palette/index.vue';
import FlowchartHeader from './components/flowchart-header/index.vue';
import FlowchartProperties from './components/flowchart-properties/index.vue';
import FlowchartImportDialog from './components/flowchart-import-dialog/index.vue';

// 类型定义
interface FlowchartNode {
  id: string
  label: string
  type: string
  color: string
  icon: string
  description: string
  x?: number
  y?: number
  properties: Record<string, any>
}

interface FlowchartEdge {
  id: string
  from: string
  to: string
  label?: string
  color?: string
  dash?: boolean
  arrows?: string
}

interface PaletteNode {
  type: string
  label: string
  color: string
  height: number
  icon: string
  outputPort: number | null
  inputPort: number | null
}

const router = useRouter();
const route = useRoute();

// 报文配置选项列表
const packetOptions = ref<Array<{ value: string | number; label: string }>>([]);

// 画布引用
const flowchartCanvasRef = ref();

// 状态管理
const showProperties = ref(true);
const showImportDialog = ref(false);
const rightPanelWidth = ref(320);
const isResizing = ref(false);
const selectedNode = ref<FlowchartNode | null>(null);
const selectedEdge = ref<FlowchartEdge | null>(null);

// 统计数据
const nodeCount = ref(0);
const edgeCount = ref(0);

// Header 工具栏状态
const showGrid = ref(true);
const commNodeName = ref('');

// 节点数据 - 使用 Ant Design Pro 配色方案
const nodesData = ref<Record<string, PaletteNode[]>>({
  communication: [
    { type: 'tcp-in-node', label: 'TCP in', color: '#1890ff', height: 32, icon: '/images/tcp.svg', outputPort: 11, inputPort: null },
    { type: 'tcp-out-node', label: 'TCP out', color: '#1890ff', height: 32, icon: '/images/tcp.svg', outputPort: null, inputPort: 11 },
    { type: 'udp-in-node', label: 'UDP in', color: '#13c2c2', height: 32, icon: '/images/udp.svg', outputPort: 11, inputPort: null },
    { type: 'udp-out-node', label: 'UDP out', color: '#13c2c2', height: 32, icon: '/images/udp.svg', outputPort: null, inputPort: 11 }
  ],
  processing: [
    { type: 'parse-node', label: '协议解析', color: '#52c41a', height: 32, icon: '/images/parse.svg', outputPort: 11, inputPort: 11 },
    { type: 'serialize-node', label: '协议序列化', color: '#faad14', height: 32, icon: '/images/serialize.svg', outputPort: 11, inputPort: 11 }
  ],
  common: [
    { type: 'start-node', label: 'start', color: '#b7eb8f', height: 32, icon: '/images/start.svg', outputPort: 11, inputPort: 11 },
    { type: 'fetch-node', label: 'fetch', color: '#ff9c6e', height: 32, icon: '/images/fetch.svg', outputPort: 11, inputPort: 11 },
    { type: 'function-node', label: 'function', color: '#ffa940', height: 32, icon: '/images/function.svg', outputPort: 11, inputPort: 11 },
    { type: 'switch-node', label: 'switch', color: '#fff566', height: 32, icon: '/images/switch.svg', outputPort: 11, inputPort: 11 },
    { type: 'delay-node', label: 'delay', color: '#b37feb', height: 32, icon: '/images/delay.svg', outputPort: 11, inputPort: 11 },
    { type: 'swap-node', label: 'swap', color: '#85a5ff', height: 32, icon: '/images/swap.svg', outputPort: 11, inputPort: 11 }
  ],
  network: [
    { type: 'mqtt in', label: 'mqtt in', color: '#ff85c0', height: 28, icon: '/images/connection.svg', outputPort: 9, inputPort: null },
    { type: 'mqtt out', label: 'mqtt out', color: '#ff85c0', height: 28, icon: '/images/connection.svg', outputPort: null, inputPort: 9 },
    { type: 'http in', label: 'http in', color: '#ffe58f', height: 28, icon: '/images/monitor.svg', outputPort: 9, inputPort: null },
    { type: 'http response', label: 'http response', color: '#ffe58f', height: 28, icon: '/images/monitor.svg', outputPort: null, inputPort: 9 },
    { type: 'http request', label: 'http request', color: '#ffe58f', height: 28, icon: '/images/monitor.svg', outputPort: 9, inputPort: 9 },
    { type: 'websocket in', label: 'websocket in', color: '#d3adf7', height: 28, icon: '/images/link.svg', outputPort: 9, inputPort: null },
    { type: 'websocket out', label: 'websocket out', color: '#d3adf7', height: 48, icon: '/images/link.svg', outputPort: null, inputPort: 19 }
  ],
  storage: [
    { type: 'file', label: '写入文件', color: '#ffd591', height: 28, icon: '/images/document.svg', outputPort: 9, inputPort: 9 },
    { type: 'file in', label: '读取文件', color: '#ffd591', height: 28, icon: '/images/folder.svg', outputPort: 9, inputPort: 9 },
    { type: 'watch', label: 'watch', color: '#87e8de', height: 28, icon: '/images/view.svg', outputPort: 9, inputPort: null }
  ]
});

/**
 * 加载报文配置列表
 * @description 从后端获取报文配置列表并转换为选项格式
 * @returns {Promise<void>} 无返回值
 */
async function loadPacketOptions() {
  const res = await getMessageList();
  if (res.status === 'success') {
    const list = res.datum?.list || [];
    packetOptions.value = list.map((p: any) => ({
      value: p.id,
      label: p.name
    }));
  } else {
    ElMessage.error(res.message || '加载报文配置列表失败');
  }
}

/**
 * 调色板节点拖拽开始处理
 * @param {PaletteNode} node - 被拖拽的节点对象
 * @param {MouseEvent} event - 鼠标事件对象
 * @returns {void} 无返回值
 */
function handlePaletteNodeDragStart(node: PaletteNode, event: MouseEvent) {
  event.preventDefault();
  if (flowchartCanvasRef.value) {
    const lf = flowchartCanvasRef.value.getLf();
    if (lf && lf.dnd) {
      const nodeForm = getNodeForm(node.type);
      const defaultProperties: Record<string, any> = {
        icon: node.icon,
        ui: 'node-red'
      };

      if (nodeForm && nodeForm.defaults) {
        for (const [key, config] of Object.entries(nodeForm.defaults)) {
          if ((config as any).value !== undefined) {
            defaultProperties[key] = (config as any).value;
          }
        }
      }

      lf.dnd.startDrag({
        type: node.type,
        text: node.label,
        properties: defaultProperties
      });
    }
  }
}

/**
 * 全选画布中的所有节点
 * @returns {void} 无返回值
 */
function selectAllNodes() {
  if (flowchartCanvasRef.value) {
    flowchartCanvasRef.value.selectAllNodes();
  }
}

/**
 * 自动布局画布中的节点
 * @returns {void} 无返回值
 */
function autoLayout() {
  if (flowchartCanvasRef.value) {
    flowchartCanvasRef.value.autoLayout();
  }
}

/**
 * 清空画布
 * @description 删除画布中的所有节点和边
 * @returns {void} 无返回值
 */
function clearCanvas() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  lf.render({ nodes: [], edges: [] });
  saveFlowchartState();
}

/**
 * 切换网格显示状态
 * @returns {void} 无返回值
 */
function toggleGrid() {
  showGrid.value = !showGrid.value;
  if (flowchartCanvasRef.value) {
    flowchartCanvasRef.value.setGridVisible(showGrid.value);
  }
}

/**
 * 切换属性面板显示状态
 * @returns {void} 无返回值
 */
function toggleProperties() {
  showProperties.value = !showProperties.value;
}

/**
 * 更新节点配置
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段新值
 * @returns {void} 无返回值
 */
function updateNodeConfig(fieldName: string, value: any) {
  if (!selectedNode.value || !flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (lf) {
    const newProperties = { ...selectedNode.value.properties, [fieldName]: value };
    lf.setProperties(selectedNode.value.id, newProperties);
    selectedNode.value.properties = newProperties;
    saveFlowchartState();
  }
}

/**
 * 更新边标签
 * @param {string} label - 边的标签文本
 * @returns {void} 无返回值
 */
function updateEdgeLabel(label: string) {
  if (!selectedEdge.value || !flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (lf) {
    lf.updateText(selectedEdge.value.id, label);
    selectedEdge.value.label = label;
    saveFlowchartState();
  }
}

/**
 * 更新边颜色
 * @param {string} color - 边的颜色值
 * @returns {void} 无返回值
 */
function updateEdgeColor(color: string) {
  if (!selectedEdge.value || !flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (lf) {
    lf.setProperties(selectedEdge.value.id, { color });
    selectedEdge.value.color = color;
    saveFlowchartState();
  }
}

/**
 * 开始调整面板宽度
 * @param {MouseEvent} event - 鼠标按下事件对象
 * @returns {void} 无返回值
 */
function startResize(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  isResizing.value = true;
  const startX = event.clientX;
  const startWidth = rightPanelWidth.value;

  const onMouseMove = (e: MouseEvent) => {
    if (!isResizing.value) return;
    e.preventDefault();
    const delta = startX - e.clientX;
    const newWidth = Math.max(320, Math.min(1560, startWidth + delta));
    rightPanelWidth.value = newWidth;
  };

  const onMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/**
 * 更新通信节点名称
 * @param {string} name - 新的节点名称
 * @returns {void} 无返回值
 */
function handleUpdateCommNodeName(name: string) {
  commNodeName.value = name;
}

/**
 * 返回体系配置页面
 * @returns {void} 无返回值
 */
function goBack() {
  router.push('/system-level-design');
}

/**
 * 保存流程图
 * @description 将当前流程图数据保存到后端
 * @returns {Promise<void>} 无返回值
 */
async function saveFlowchart() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  const archNodeId = route.query.archNodeId as string;
  const commNodeId = route.query.commNodeId as string;

  if (!archNodeId) {
    ElMessage.warning('缺少体系节点ID，无法保存');
    return;
  }

  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  if (nodes.length === 0) {
    ElMessage.warning('画布为空，请先添加节点');
    return;
  }

  const saveData = {
    arch_node_id: archNodeId,
    comm_node_id: commNodeId || undefined,
    name: commNodeName.value || '未命名流程图',
    nodes,
    edges
  };

  const result = await flowchartApi.save(saveData);
  if (result.status === 'success') {
    ElMessage.success('流程图保存成功');

    if (!commNodeId && result?.datum?.communication_node_id) {
      router.replace({
        path: '/flowchart',
        query: { archNodeId, commNodeId: result.datum.communication_node_id }
      });
    }

    saveFlowchartState();
  } else {
    ElMessage.error(result.message || '保存失败');
  }
}

/**
 * 导出流程图
 * @description 将当前流程图导出为JSON文件
 * @returns {void} 无返回值
 */
function exportFlowchart() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  const flowchartData = {
    nodes: graphData.nodes || [],
    edges: graphData.edges || [],
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0',
      name: '报文流程图'
    }
  };

  const dataStr = JSON.stringify(flowchartData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `flowchart-${Date.now()}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * 关闭导入对话框
 * @returns {void} 无返回值
 */
function closeImportDialog() {
  showImportDialog.value = false;
}

/**
 * 确认导入流程图数据
 * @param {string} data - JSON格式的流程图数据
 * @returns {void} 无返回值
 */
function confirmImport(data: string) {
  try {
    if (data) {
      const flowchartData = JSON.parse(data);
      loadFlowchartData(flowchartData);
      closeImportDialog();
      ElMessage.success('流程图导入成功');
    }
  } catch (error) {
    ElMessage.error('导入失败：无效的JSON格式');
  }
}

/**
 * 加载流程图数据到画布
 * @param {any} data - 流程图数据对象
 * @returns {void} 无返回值
 */
function loadFlowchartData(data: any) {
  if (!flowchartCanvasRef.value || !data) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  lf.render(data);
  saveFlowchartState();
}

/**
 * 保存流程图状态到localStorage
 * @description 将当前画布数据保存到本地存储
 * @returns {void} 无返回值
 */
function saveFlowchartState() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  const state = {
    nodes: graphData.nodes || [],
    edges: graphData.edges || []
  };
  localStorage.setItem('flowchart_state', JSON.stringify(state));
}

/**
 * 设置节点事件监听
 * @description 为画布中的节点和边绑定事件处理器
 * @returns {void} 无返回值
 */
function setupNodeEvents() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  lf.on('node:click', ({ data }) => {
    selectedNode.value = data as FlowchartNode;
    selectedEdge.value = null;

    const nodeForm = getNodeForm(data.type);
    const existingProps = data.properties || {};

    const mergedConfig: Record<string, any> = { ...existingProps };
    if (nodeForm && nodeForm.defaults) {
      for (const [key, config] of Object.entries(nodeForm.defaults)) {
        if (mergedConfig[key] === undefined && (config as any).value !== undefined) {
          mergedConfig[key] = (config as any).value;
        }
      }
    }

    const hasNewDefaults = Object.keys(mergedConfig).some(key => existingProps[key] === undefined && mergedConfig[key] !== undefined);
    if (hasNewDefaults) {
      lf.setProperties(data.id, mergedConfig);
    }

    updateStats();
  });

  lf.on('edge:click', ({ data }) => {
    selectedEdge.value = data as FlowchartEdge;
    selectedNode.value = null;
    updateStats();
  });

  lf.on('blank:click', () => {
    selectedNode.value = null;
    selectedEdge.value = null;
  });

  lf.on('node:dnd-add', () => {
    updateStats();
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
 * 更新统计数据
 * @description 更新节点和边的数量统计
 * @returns {void} 无返回值
 */
function updateStats() {
  if (!flowchartCanvasRef.value) return;

  const lf = flowchartCanvasRef.value.getLf();
  if (!lf) return;

  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  nodeCount.value = graphData.nodes?.length || 0;
  edgeCount.value = graphData.edges?.length || 0;
}

/**
 * 从服务器加载已保存的流程图
 * @description 根据URL中的commNodeId加载流程图数据
 * @returns {Promise<boolean>} 是否成功加载
 */
async function loadFlowchartFromServer() {
  const commNodeId = route.query.commNodeId as string;

  if (!commNodeId) {
    commNodeName.value = '未命名节点' + Date.now();
    return false;
  }

  const response = await flowchartApi.loadByCommNodeId(commNodeId);
  if (response.status === 'success') {
    if (response.datum) {
      if (response.datum.comm_node_name) {
        commNodeName.value = response.datum.comm_node_name;
      }

      const data = {
        nodes: response.datum.nodes || [],
        edges: response.datum.edges || []
      };
      if (data.nodes.length > 0) {
        loadFlowchartData(data);
        return true;
      }
    }
  } else {
    console.log('未找到已保存的流程图:', response.message);
  }

  return false;
}

onMounted(async () => {
  await nextTick();
  setupNodeEvents();
  loadPacketOptions();
  await loadFlowchartFromServer();
});
</script>

<style lang="scss" src="./index.scss"></style>
