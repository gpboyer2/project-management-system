/**
 * 拓扑图类型定义
 */

/**
 * 报文信息接口
 * 定义拓扑图中报文的基本信息
 */
export interface MessageInfo {
  id: string | number;
  name: string;
  message_id: string;
  version: string;
  direction: 'input' | 'output';
  fields: any[];
}

/**
 * 边信息接口
 * 定义拓扑图中节点之间的连接边
 */
export interface EdgeInfo {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * 锚点信息接口
 * 定义节点连接锚点的位置和方向
 */
export interface AnchorInfo {
  x: number;
  y: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 拓扑节点接口
 * 定义拓扑图中的节点结构
 */
export interface TopologyNode {
  id: string;
  name: string;
  type: string;
  level: number;
  parentId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: Record<string, any>;
  children?: TopologyNode[];
}

/**
 * 拓扑层级接口
 * 定义拓扑图的层级结构
 */
export interface TopologyLevel {
  id: string;
  name: string;
  nodeTypeId?: string;
  color?: string;
}
