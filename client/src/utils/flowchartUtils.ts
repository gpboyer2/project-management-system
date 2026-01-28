import type { Ref } from 'vue';
import type { LogicFlow } from '@logicflow/core';

/**
 * 流程图画布操作工具函数集
 * 提供 LogicFlow 画布的常用操作方法
 */

// ==================== 画布视图控制 ====================

/**
 * 切换网格显示
 * @param lf - LogicFlow 实例
 * @param show - 是否显示网格
 */
export function toggleGrid(lf: LogicFlow | null, show: boolean): void {
  if (!lf) return;

  const container = lf.container;
  if (!container) return;

  const graph_layer = container.querySelector('.lf-graph') as HTMLElement;
  if (graph_layer) {
    graph_layer.style.backgroundImage = show
      ? 'linear-gradient(#e8e8e8 1px, transparent 1px), linear-gradient(90deg, #e8e8e8 1px, transparent 1px)'
      : 'none';
    graph_layer.style.backgroundSize = '20px 20px';
  }
}

/**
 * 放大画布
 * @param lf - LogicFlow 实例
 */
export function handleZoomIn(lf: LogicFlow | null): void {
  if (!lf) return;
  lf.zoom(true);
}

/**
 * 缩小画布
 * @param lf - LogicFlow 实例
 */
export function handleZoomOut(lf: LogicFlow | null): void {
  if (!lf) return;
  lf.zoom(false);
}

/**
 * 适应画布视图
 * @param lf - LogicFlow 实例
 */
export function handleFitView(lf: LogicFlow | null): void {
  if (!lf) return;
  lf.fitView();
}

// ==================== 节点操作 ====================

/**
 * 更新节点配置
 * @param lf - LogicFlow 实例
 * @param node_id - 节点ID
 * @param config - 节点配置对象
 */
export function updateNodeConfig(
  lf: LogicFlow | null,
  node_id: string,
  config: Record<string, any>
): void {
  if (!lf || !node_id) return;

  const node_model = lf.getNodeModelById(node_id);
  if (node_model) {
    const current_properties = node_model.getProperties() || {};
    const merged_properties = { ...current_properties, ...config };
    lf.setProperties(node_id, merged_properties);
  }
}

// ==================== 边操作 ====================

/**
 * 更新边标签文本
 * @param lf - LogicFlow 实例
 * @param edge_id - 边ID
 * @param label - 标签文本
 */
export function updateEdgeLabel(
  lf: LogicFlow | null,
  edge_id: string,
  label: string
): void {
  if (!lf || !edge_id) return;
  lf.updateText(edge_id, label);
}

/**
 * 更新边颜色
 * @param lf - LogicFlow 实例
 * @param edge_id - 边ID
 * @param color - 颜色值
 */
export function updateEdgeColor(
  lf: LogicFlow | null,
  edge_id: string,
  color: string
): void {
  if (!lf || !edge_id) return;
  lf.setProperties(edge_id, { color });
}

// ==================== 工具函数 ====================

/**
 * 获取 LogicFlow 实例
 * @param container_ref - 画布容器引用
 * @returns LogicFlow 实例或 null
 */
export function getLfInstance(container_ref: Ref<any>): LogicFlow | null {
  if (!container_ref.value) return null;
  return container_ref.value.getLf?.() || null;
}

/**
 * 更新流程图统计信息
 * @param data - 流程图数据
 * @returns 包含节点数量和边数量的对象
 */
export function updateFlowStats(data: {
  nodes?: Array<any>;
  edges?: Array<any>;
}): {
  node_count: number;
  edge_count: number;
} {
  const node_count = data.nodes?.length || 0;
  const edge_count = data.edges?.length || 0;
  return { node_count, edge_count };
}

// ==================== 画布数据操作 ====================

/**
 * 获取画布原始数据
 * @param lf - LogicFlow 实例
 * @returns 流程图数据对象
 */
export function getGraphData(lf: LogicFlow | null): {
  nodes: Array<any>;
  edges: Array<any>;
} {
  if (!lf) return { nodes: [], edges: [] };

  const graph_data = (lf.getGraphRawData || lf.getGraphData)?.() || {};
  return {
    nodes: graph_data.nodes || [],
    edges: graph_data.edges || []
  };
}

/**
 * 清空画布
 * @param lf - LogicFlow 实例
 */
export function clearCanvas(lf: LogicFlow | null): void {
  if (!lf) return;
  lf.render({ nodes: [], edges: [] });
}

/**
 * 渲染流程图数据
 * @param lf - LogicFlow 实例
 * @param data - 流程图数据
 */
export function renderGraphData(
  lf: LogicFlow | null,
  data: {
    nodes?: Array<any>;
    edges?: Array<any>;
  }
): void {
  if (!lf) return;
  lf.render({
    nodes: data.nodes || [],
    edges: data.edges || []
  });
}

// ==================== 节点选择操作 ====================

/**
 * 选中所有节点
 * @param lf - LogicFlow 实例
 */
export function selectAllNodes(lf: LogicFlow | null): void {
  if (!lf) return;

  const graph_data = getGraphData(lf);
  graph_data.nodes.forEach((node: any) => {
    lf.selectNodeById(node.id, true);
  });
}

/**
 * 根据ID选中节点
 * @param lf - LogicFlow 实例
 * @param node_id - 节点ID
 * @param append - 是否追加选择
 */
export function selectNodeById(
  lf: LogicFlow | null,
  node_id: string,
  append: boolean = false
): void {
  if (!lf || !node_id) return;
  lf.selectNodeById(node_id, append);
}

// ==================== 节点拖拽操作 ====================

/**
 * 开始节点拖拽
 * @param lf - LogicFlow 实例
 * @param node_config - 节点配置
 */
export function startNodeDrag(
  lf: LogicFlow | null,
  node_config: {
    type: string;
    text?: string;
    properties?: Record<string, any>;
  }
): void {
  if (!lf || !lf.dnd) return;
  lf.dnd.startDrag(node_config);
}

// ==================== 边连接操作 ====================

/**
 * 删除边
 * @param lf - LogicFlow 实例
 * @param edge_id - 边ID
 */
export function deleteEdge(lf: LogicFlow | null, edge_id: string): void {
  if (!lf || !edge_id) return;
  lf.deleteEdge(edge_id);
}

/**
 * 删除节点
 * @param lf - LogicFlow 实例
 * @param node_id - 节点ID
 */
export function deleteNode(lf: LogicFlow | null, node_id: string): void {
  if (!lf || !node_id) return;
  lf.deleteNode(node_id);
}

// ==================== 保存/加载操作（新增） ====================

export interface FlowchartSaveData {
  id?: string | number;
  name: string;
  nodes: Array<any>;
  edges: Array<any>;
  properties?: Record<string, any>;
}

/**
 * 保存流程图
 * @param api - API对象
 * @param data - 流程图数据
 * @param existingId - 已存在的ID
 * @returns 保存后的ID
 */
export async function saveFlowchart(
  api: {
    create: (data: any) => Promise<any>;
    update: (id: string | number, data: any) => Promise<any>;
  },
  data: FlowchartSaveData,
  existingId?: string | number
): Promise<string | number> {
  if (existingId) {
    await api.update(existingId, data);
    return existingId;
  }
  const res = await api.create(data);
  return res?.datum?.id || res?.data?.id;
}

/**
 * 导出流程图为JSON文件
 * @param data - 流程图数据
 * @param filename - 文件名
 */
export function exportFlowchart(data: FlowchartSaveData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || 'flowchart.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * 加载流程图数据到画布
 * @param lf - LogicFlow 实例
 * @param data - 流程图数据
 */
export function loadFlowchartData(lf: LogicFlow | null, data: FlowchartSaveData): void {
  if (!lf) return;
  lf.render({
    nodes: data.nodes || [],
    edges: data.edges || []
  });
}

/**
 * 保存流程图状态到本地存储
 * @param key - 存储键名
 * @param data - 流程图数据
 */
export function saveFlowchartState(
  key: string,
  data: { nodes: Array<any>; edges: Array<any> }
): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save flowchart state:', e);
  }
}

/**
 * 从本地存储加载流程图状态
 * @param key - 存储键名
 * @returns 流程图数据或null
 */
export function loadFlowchartState(key: string): { nodes: Array<any>; edges: Array<any> } | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Failed to load flowchart state:', e);
    return null;
  }
}

export interface FlowchartNodeType {
  type: string;
  label: string;
  category: string;
  icon?: string;
  properties?: Record<string, any>;
}

export interface FlowchartNodeCategory {
  name: string;
  nodes: FlowchartNodeType[];
}

/**
 * 获取默认节点数据
 * @returns 默认节点分类数据
 */
export function getDefaultNodesData(): FlowchartNodeCategory[] {
  return [
    {
      name: '逻辑与编解码',
      nodes: [
        { type: 'parse-node', label: '解析', category: 'processing' },
        { type: 'serialize-node', label: '序列化', category: 'processing' },
        { type: 'function-node', label: '功能', category: 'processing' }
      ]
    },
    {
      name: '数据传输',
      nodes: [
        { type: 'tcp-in-node', label: 'TCP 输入', category: 'communication' },
        { type: 'tcp-out-node', label: 'TCP 输出', category: 'communication' },
        { type: 'udp-in-node', label: 'UDP 输入', category: 'communication' },
        { type: 'udp-out-node', label: 'UDP 输出', category: 'communication' },
        { type: 'serial-node', label: '串口', category: 'communication' },
        { type: 'can-node', label: 'CAN', category: 'communication' }
      ]
    }
  ];
}
