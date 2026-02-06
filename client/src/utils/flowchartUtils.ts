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

  try {
    // 检查是否有节点
    const graphData = getGraphData(lf);
    if (!graphData.nodes || graphData.nodes.length === 0) {
      console.warn('画布上没有节点，无法适配视图');
      // 重置到默认状态
      lf.resetZoom();
      lf.resetTranslate();
      return;
    }

    // 检查节点位置是否有效
    const validNodes = graphData.nodes.filter(node =>
      typeof node.x === 'number' && !isNaN(node.x) &&
      typeof node.y === 'number' && !isNaN(node.y) &&
      typeof node.width === 'number' && !isNaN(node.width) &&
      typeof node.height === 'number' && !isNaN(node.height)
    );

    if (validNodes.length !== graphData.nodes.length) {
      console.warn('部分节点位置数据无效');
    }

    // 如果没有有效节点，重置到默认状态
    if (validNodes.length === 0) {
      lf.resetZoom();
      lf.resetTranslate();
      return;
    }

    // 计算节点边界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    validNodes.forEach(node => {
      // 计算节点的边界（考虑节点的宽高）
      const nodeMinX = node.x - node.width / 2;
      const nodeMinY = node.y - node.height / 2;
      const nodeMaxX = node.x + node.width / 2;
      const nodeMaxY = node.y + node.height / 2;

      minX = Math.min(minX, nodeMinX);
      minY = Math.min(minY, nodeMinY);
      maxX = Math.max(maxX, nodeMaxX);
      maxY = Math.max(maxY, nodeMaxY);
    });

    // 检查边界是否有效
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      console.warn('节点边界计算无效');
      lf.zoomTo(1);
      lf.translate(0, 0);
      return;
    }

    // 计算节点总宽高
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    if (totalWidth <= 0 || totalHeight <= 0) {
      console.warn('节点边界尺寸无效');
      lf.zoomTo(1);
      lf.translate(0, 0);
      return;
    }

    // 获取容器尺寸
    const container = lf.container as HTMLElement;
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;

    // 计算缩放比例（考虑边距）
    const padding = 20;
    const availableWidth = containerWidth - 2 * padding;
    const availableHeight = containerHeight - 2 * padding;

    const scaleX = availableWidth / totalWidth;
    const scaleY = availableHeight / totalHeight;

    let scale = Math.min(scaleX, scaleY);
    // 限制最小和最大缩放比例
    scale = Math.max(0.1, Math.min(scale, 5));

    // 计算中心位置
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // 计算平移距离
    const translateX = containerWidth / 2 - centerX * scale;
    const translateY = containerHeight / 2 - centerY * scale;

    // 确保缩放比例和坐标都是有效的
    if (isNaN(scale) || isNaN(translateX) || isNaN(translateY)) {
      console.warn('计算的缩放比例或坐标无效');
      lf.resetZoom();
      lf.resetTranslate();
      return;
    }

    // 执行缩放和平移
    // LogicFlow 1.x 没有 zoomTo 方法，使用 zoom 方法代替
    // 首先重置到默认缩放，然后根据需要缩放
    lf.resetZoom();
    const currentTransform = lf.getTransform();
    const currentScale = currentTransform.SCALE_X;
    const scaleFactor = scale / currentScale;
    lf.zoom(scaleFactor);

    lf.translate(translateX, translateY);
  } catch (error) {
    console.error('适配视图失败:', error);

    // 尝试重置缩放
    try {
      lf.resetZoom();
      lf.resetTranslate();
    } catch (resetError) {
      console.error('重置缩放失败:', resetError);
    }
  }
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
