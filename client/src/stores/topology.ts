/**
 *
 * 拓扑图状态管理
 * 基于vis-network的网络拓扑图数据管理和交互控制
 * 数据来源：后端 API 根据体系配置和通信节点的 TCP IN/OUT 动态生成
 *
 */

import { defineStore } from 'pinia';
import type { DefineStoreOptions } from 'pinia';
import type { Node, Edge, IdType } from 'vis-network';
// @ts-ignore - 路径别名在项目构建时正确解析
import { topologyApi } from '@/api';
import { useHierarchyConfigStore } from './hierarchy-config';

// 扩展 DefineStoreOptions 以支持 persist 选项
declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: {
      key: string
      paths?: string[]
    }
  }
}

// 节点样式配置接口
interface NodeStyle {
  fill: string
  size: number
  stroke: string
  textColor: string
  shape: string
}

// 拓扑节点接口定义
export interface TopologyNode extends Node {
  id: string | number
  name: string
  type: string  // 动态类型，由 node_type_id 决定具体类型
  node_type_id?: string  // 层级配置中的节点类型ID
  description?: string
  hierarchyId?: string
  model?: string
  version?: string
  status?: 'online' | 'offline' | 'unknown'
  ip?: string
  connections?: string[]
  hasCommNode?: boolean
  commNodeCount?: number
  // 扩展属性
  category?: string
  metadata?: Record<string, any>
  // 原始数据（用于保存完整的节点信息）
  data?: Record<string, any>
}

// 边的平滑配置接口
interface SmoothConfig {
  enabled: boolean
  type: string
  roundness: number
}

// 拓扑边接口定义
export interface TopologyEdge extends Edge {
  id?: string
  from: string | number
  to: string | number
  label?: string
  bandwidth?: number
  connectionType?: 'physical' | 'logical' | 'data'
  status?: 'active' | 'inactive' | 'error'
  smooth?: boolean | SmoothConfig
}

// 拓扑根节点接口
export interface TopologyRootNode {
  id: string
  type: string
  name: string
  description?: string
  children: TopologyNode[]
}

// 系统配置数据接口
export interface SystemConfigData {
  rootNodes: TopologyRootNode[]
}

// 网络统计信息接口（动态层级统计）
export interface NetworkStatistics {
  levelCounts: Record<string, number>  // key 为 node_type_id，value 为计数
  connectionCount: number
  onlineCount: number
  offlineCount: number
  unknownCount: number
}

// API 响应中的节点数据接口
interface ApiNodeData {
  id: string | number
  name: string
  node_type_id?: string
  description?: string
  status?: 'online' | 'offline' | 'unknown'
  hasCommNode?: boolean
  commNodeCount?: number
}

// API 响应中的边数据接口
interface ApiEdgeData {
  id: string
  from: string | number
  to: string | number
  label?: string
  connectionType?: string
  fromCommNode?: string
  toCommNode?: string
  port?: number
  fromHost?: string
}

// API 响应数据接口
interface TopologyApiDatum {
  nodes?: ApiNodeData[]
  edges?: ApiEdgeData[]
  tcpInEndpointList?: unknown[]
  tcpOutEndpointList?: unknown[]
}

// 视图状态接口
export interface ViewState {
  selectedNodeId: IdType | null
  selectedEdgeId: IdType | null
  hoveredNodeId: IdType | null
  zoomLevel: number
  networkCenter: { x: number; y: number }
}

// Store State 接口
interface TopologyState {
  rawSystemData: SystemConfigData | null
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  viewState: ViewState
  statistics: NetworkStatistics
  loading: boolean
  hasData: boolean
  hasError: boolean
  errorMessage: string
  searchKeyword: string
  filterType: string
  filterStatus: string
  showAdvancedFilter: boolean
}

// Store Getters 接口
type TopologyGetters = {
  nodeCount(state: TopologyState): number
  edgeCount(state: TopologyState): number
  hasSelection(state: TopologyState): boolean
  selectedNode(state: TopologyState): TopologyNode | null
  selectedEdge(state: TopologyState): TopologyEdge | null
  applyFilters(state: TopologyState): (nodes: TopologyNode[]) => TopologyNode[]
  filteredNodes(state: TopologyState): TopologyNode[]
  filteredEdges(state: TopologyState): TopologyEdge[]
}

// Store Actions 接口
interface TopologyActions {
  getNodeStyleByOrder(order: number): NodeStyle
  getNodeStyle(_type: string): NodeStyle
  loadSystemData(): SystemConfigData | null
  getMockData(): SystemConfigData
  transformToVisNetworkData(systemConfigData: SystemConfigData): { nodes: TopologyNode[]; edges: TopologyEdge[] }
  initializeTopology(): Promise<void>
  refreshTopology(): Promise<void>
  addNode(node: TopologyNode): boolean
  addEdge(edge: TopologyEdge): boolean
  updateNode(nodeId: IdType, newProps: Partial<TopologyNode>): boolean
  updateEdge(edgeId: IdType, newProps: Partial<TopologyEdge>): boolean
  removeNode(nodeId: IdType): boolean
  removeEdge(edgeId: IdType): boolean
  selectNode(nodeId: IdType | null): void
  selectEdge(edgeId: IdType | null): void
  clearSelection(): void
  setHoveredNode(nodeId: IdType | null): void
  updateViewState(newState: Partial<ViewState>): void
  handleSearch(keyword: string): void
  handleFilter(type: string, status: string): void
  toggleAdvancedFilter(): void
  clearFilters(): void
  resetTopology(): void
}

export const useTopologyStore = defineStore<'topology', TopologyState, TopologyGetters, TopologyActions>('topology', {
  // ========== 状态定义 ==========
  state: () => ({
    // 原始数据
    rawSystemData: null as SystemConfigData | null,

    // vis-network 格式数据
    nodes: [] as TopologyNode[],
    edges: [] as TopologyEdge[],

    // 视图状态
    viewState: {
      selectedNodeId: null as IdType | null,
      selectedEdgeId: null as IdType | null,
      hoveredNodeId: null as IdType | null,
      zoomLevel: 1,
      networkCenter: { x: 0, y: 0 }
    } as ViewState,

    // 网络统计（动态层级统计）
    statistics: {
      levelCounts: {},
      connectionCount: 0,
      onlineCount: 0,
      offlineCount: 0,
      unknownCount: 0
    } as NetworkStatistics,

    // 加载状态
    loading: false,
    hasData: false,
    hasError: false,
    errorMessage: '',

    // 搜索和筛选
    searchKeyword: '',
    filterType: '',
    filterStatus: '',
    showAdvancedFilter: false
  }),

  // ========== 计算属性 ==========
  getters: {
    // 节点总数
    nodeCount: (state): number => state.nodes.length,

    // 边总数
    edgeCount: (state): number => state.edges.length,

    // 是否有选中内容
    hasSelection: (state): boolean =>
      state.viewState.selectedNodeId !== null || state.viewState.selectedEdgeId !== null,

    // 获取选中的节点
    selectedNode: (state): TopologyNode | null => {
      if (!state.viewState.selectedNodeId) return null;
      return state.nodes.find(node => node.id === state.viewState.selectedNodeId) || null;
    },

    // 获取选中的边
    selectedEdge: (state): TopologyEdge | null => {
      if (!state.viewState.selectedEdgeId) return null;
      return state.edges.find(edge => edge.id === state.viewState.selectedEdgeId) || null;
    },

    // 应用筛选条件到节点列表
    applyFilters(): (nodes: TopologyNode[]) => TopologyNode[] {
      return (nodes: TopologyNode[]): TopologyNode[] => {
        let result = nodes;

        // 关键词搜索
        if (this.searchKeyword.trim()) {
          const keyword = this.searchKeyword.toLowerCase().trim();
          result = result.filter(node =>
            node.label?.toLowerCase().includes(keyword) ||
            node.name?.toLowerCase().includes(keyword) ||
            node.description?.toLowerCase().includes(keyword)
          );
        }

        // 类型筛选
        if (this.filterType) {
          result = result.filter(node => node.type === this.filterType);
        }

        // 状态筛选
        if (this.filterStatus) {
          result = result.filter(node => node.status === this.filterStatus);
        }

        return result;
      };
    },

    // 过滤后的节点
    filteredNodes(): TopologyNode[] {
      return this.applyFilters(this.nodes);
    },

    // 过滤后的边（只显示两端都在过滤后节点中的边）
    filteredEdges(): TopologyEdge[] {
      const filteredNodes = this.applyFilters(this.nodes);
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      return this.edges.filter(edge =>
        nodeIds.has(edge.from) && nodeIds.has(edge.to)
      );
    }
  },

  // ========== 主要业务方法 ==========
  actions: {
    /**
     * 根据层级顺序获取节点样式配置（动态颜色分配）
     * @param order - 层级顺序（从1开始）
     */
    getNodeStyleByOrder(order: number) {
      // 预定义颜色数组，循环使用
      const colors = [
        { fill: '#e74c3c', stroke: '#c0392b' },  // 红色
        { fill: '#f39c12', stroke: '#d68910' },  // 橙色
        { fill: '#27ae60', stroke: '#229954' },  // 绿色
        { fill: '#3498db', stroke: '#2980b9' },  // 蓝色
        { fill: '#9b59b6', stroke: '#8e44ad' },  // 紫色
        { fill: '#1abc9c', stroke: '#16a085' },  // 青色
        { fill: '#e91e63', stroke: '#c2185b' },  // 粉色
        { fill: '#00bcd4', stroke: '#0097a7' },  // 青蓝
      ];

      const colorIndex = (order - 1) % colors.length;
      const color = colors[colorIndex];

      // 根据层级调整节点大小（第一级最大，后续递减）
      const size = Math.max(35, 60 - (order - 1) * 10);

      return {
        fill: color.fill,
        size: size,
        stroke: color.stroke,
        textColor: '#fff',
        shape: 'circle'
      };
    },

    /**
     * 获取节点样式配置（兼容旧代码，根据 node_type_id 查找）
     * @deprecated 建议使用 getNodeStyleByOrder 或从层级配置获取样式
     */
    getNodeStyle(_type: string) {
      // 默认样式（橙色，第二层级）
      return {
        fill: '#f39c12',
        size: 45,
        stroke: '#d68910',
        textColor: '#fff',
        shape: 'circle'
      };
    },

    /**
     * 从localStorage加载系统配置数据
     */
    loadSystemData(): SystemConfigData | null {
      try {
        const savedData = localStorage.getItem('system-level-design');
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (error) {
        console.error('加载系统配置数据失败', error);
      }
      return null;
    },

    /**
     * 获取模拟数据用于演示
     * 注意：实际数据应从后端 API 获取，此方法仅用于无数据时的占位
     */
    getMockData(): SystemConfigData {
      const hierarchyStore = useHierarchyConfigStore();
      const sortedLevels = hierarchyStore.sortedLevels;

      if (sortedLevels.length === 0) {
        return { rootNodes: [] };
      }

      // 使用动态层级配置生成示例数据
      const firstLevel = sortedLevels[0];
      const secondLevel = sortedLevels[1];
      const thirdLevel = sortedLevels[2];

      const rootNodes: TopologyRootNode[] = [
        {
          id: `mock-root-1`,
          type: firstLevel.id,
          name: '示例系统',
          description: '这是一个示例数据，请从后端 API 获取实际数据',
          children: []
        }
      ];

      // 如果有第二级层级，添加示例子节点
      if (secondLevel) {
        rootNodes[0].children.push({
          id: `mock-${secondLevel.id}-1`,
          type: secondLevel.id,
          name: `示例${secondLevel.display_name}`,
          hierarchyId: `mock-root-1`,
          model: '示例型号',
          status: 'online',
          ip: '192.168.1.10'
        });
      }

      // 如果有更多层级，添加示例
      if (thirdLevel) {
        rootNodes[0].children.push({
          id: `mock-${thirdLevel.id}-1`,
          type: thirdLevel.id,
          name: `示例${thirdLevel.display_name}`,
          hierarchyId: `mock-root-1`,
          version: 'v1.0.0',
          connections: []
        });
      }

      return { rootNodes };
    },

    /**
     * 转换系统配置数据为vis-network格式（使用动态层级配置）
     */
    transformToVisNetworkData(systemConfigData: SystemConfigData) {
      if (!systemConfigData || !systemConfigData.rootNodes) {
        console.warn('转换拓扑数据：无效的系统配置数据');
        return { nodes: [], edges: [] };
      }

      const hierarchyStore = useHierarchyConfigStore();
      const sortedLevels = hierarchyStore.sortedLevels;

      // 构建层级 ID 到 order 的映射
      const levelOrderMap: Record<string, number> = {};
      sortedLevels.forEach((level, index) => {
        levelOrderMap[level.id] = level.order || (index + 1);
      });

      const visNodes: TopologyNode[] = [];
      const visEdges: TopologyEdge[] = [];
      const nodeMap: Record<string, TopologyNode> = {};

      // 重置统计信息（动态层级统计）
      this.statistics = {
        levelCounts: {},
        connectionCount: 0,
        onlineCount: 0,
        offlineCount: 0,
        unknownCount: 0
      };

      // 处理根节点
      systemConfigData.rootNodes.forEach(rootNode => {
        if (!rootNode.id) {
          console.warn('跳过无效的根节点:', rootNode);
          return;
        }

        // 统计层级节点
        if (!this.statistics.levelCounts[rootNode.type]) {
          this.statistics.levelCounts[rootNode.type] = 0;
        }
        this.statistics.levelCounts[rootNode.type]++;

        // 从层级配置获取 order，默认为 1
        const order = levelOrderMap[rootNode.type] || 1;
        const nodeStyle = this.getNodeStyleByOrder(order);

        const rootNodeVis: TopologyNode = {
          id: rootNode.id,
          label: rootNode.name || '未命名节点',
          name: rootNode.name || '未命名节点',
          type: rootNode.type,
          node_type_id: rootNode.type,
          description: rootNode.description,
          shape: nodeStyle.shape as any,
          color: {
            background: nodeStyle.fill,
            border: nodeStyle.stroke,
            highlight: {
              background: nodeStyle.fill,
              border: nodeStyle.stroke
            }
          },
          font: {
            color: nodeStyle.textColor,
            size: 12,
            strokeWidth: 0,
            strokeColor: 'transparent'
          },
          size: nodeStyle.size,
          data: { ...rootNode, type: rootNode.type }
        };
        visNodes.push(rootNodeVis);
        nodeMap[rootNode.id] = rootNodeVis;

        // 处理子节点
        if (rootNode.children && Array.isArray(rootNode.children)) {
          rootNode.children.forEach(child => {
            if (!child.id) {
              console.warn('跳过无效的子节点:', child);
              return;
            }

            // 统计子节点类型
            if (!this.statistics.levelCounts[child.type]) {
              this.statistics.levelCounts[child.type] = 0;
            }
            this.statistics.levelCounts[child.type]++;

            // 统计状态
            if (child.status === 'online') {
              this.statistics.onlineCount++;
            } else if (child.status === 'offline') {
              this.statistics.offlineCount++;
            } else {
              this.statistics.unknownCount++;
            }

            // 从层级配置获取 order，默认为 1
            const childOrder = levelOrderMap[child.type] || 1;
            const childNodeStyle = this.getNodeStyleByOrder(childOrder);

            const childNode: TopologyNode = {
              id: child.id,
              label: child.name || '未命名节点',
              name: child.name || '未命名节点',
              type: child.type,
              node_type_id: child.type,
              description: child.description,
              hierarchyId: child.hierarchyId,
              model: child.model,
              version: child.version,
              status: child.status,
              ip: child.ip,
              connections: child.connections,
              shape: childNodeStyle.shape as any,
              color: {
                background: childNodeStyle.fill,
                border: childNodeStyle.stroke,
                highlight: {
                  background: childNodeStyle.fill,
                  border: childNodeStyle.stroke
                }
              },
              font: {
                color: childNodeStyle.textColor,
                size: 12,
                strokeWidth: 0,
                strokeColor: 'transparent'
              },
              size: childNodeStyle.size,
              data: { ...child, type: child.type }
            };
            visNodes.push(childNode);
            nodeMap[child.id] = childNode;

            // 根节点到子节点的连接 - 灰色实线
            visEdges.push({
              id: `${rootNode.id}-${child.id}`,
              from: rootNode.id,
              to: child.id,
              color: {
                color: '#999999',
                highlight: '#666666'
              },
              width: 2,
              arrows: 'to',
              smooth: {
                enabled: true,
                type: 'curvedCW',
                roundness: 0.1
              }
            });

            this.statistics.connectionCount++;
          });
        }
      });

      // 处理子节点间的连接 - 绿色虚线
      systemConfigData.rootNodes.forEach(rootNode => {
        if (rootNode.children && Array.isArray(rootNode.children)) {
          rootNode.children.forEach(child => {
            // 检查是否有 connections 配置
            if (child.connections && Array.isArray(child.connections) && child.connections.length > 0) {
              child.connections.forEach(targetId => {
                if (nodeMap[targetId] && child.id !== targetId) {
                  visEdges.push({
                    id: `${child.id}-${targetId}`,
                    from: child.id,
                    to: targetId,
                    color: {
                      color: '#27ae60',
                      highlight: '#229954'
                    },
                    width: 2,
                    dashes: [5, 5],
                    arrows: 'to',
                    smooth: {
                      enabled: true,
                      type: 'curvedCW',
                      roundness: 0.1
                    }
                  });

                  this.statistics.connectionCount++;
                }
              });
            }
          });
        }
      });

      console.log('拓扑数据转换完成，节点数:', visNodes.length, '边数:', visEdges.length);
      return { nodes: visNodes, edges: visEdges };
    },

    /**
     * 初始化拓扑数据（从后端 API 获取）
     * 后端根据体系配置和通信节点的 TCP IN/OUT 配置动态生成拓扑连线
     */
    async initializeTopology() {
      this.loading = true;
      this.hasError = false;
      this.errorMessage = '';

      // 从后端 API 获取拓扑数据
      const response = await topologyApi.getAllNodes();
      if (response.status !== 'success') {
        console.error('拓扑初始化失败:', response.message);
        this.hasError = true;
        this.errorMessage = response.message || '加载拓扑数据失败';
        this.loading = false;
        return;
      }

      // 类型断言：API 返回的数据
      const apiData = response.datum as TopologyApiDatum;

      // 重置统计信息
      this.statistics = {
        levelCounts: {},
        connectionCount: 0,
        onlineCount: 0,
        offlineCount: 0,
        unknownCount: 0
      };

      // 转换节点数据为 vis-network 格式
      const visNodeList: TopologyNode[] = (apiData.nodes || []).map((node) => {
        // 统计状态
        if (node.status === 'online') this.statistics.onlineCount++;
        else if (node.status === 'offline') this.statistics.offlineCount++;
        else this.statistics.unknownCount++;

        // 统计层级（从 node_type_id 获取）
        if (node.node_type_id) {
          this.statistics.levelCounts[node.node_type_id] = (this.statistics.levelCounts[node.node_type_id] || 0) + 1;
        }

        const nodeStyle = this.getNodeStyle('leaf');
        return {
          id: node.id,
          label: node.name || '未命名节点',
          name: node.name || '未命名节点',
          type: 'leaf',
          node_type_id: node.node_type_id,
          description: node.description,
          status: node.status,
          hasCommNode: node.hasCommNode,
          commNodeCount: node.commNodeCount,
          shape: nodeStyle.shape as any,
          color: {
            background: node.hasCommNode ? nodeStyle.fill : '#999999',
            border: node.hasCommNode ? nodeStyle.stroke : '#666666',
            highlight: {
              background: nodeStyle.fill,
              border: nodeStyle.stroke
            }
          },
          font: {
            color: nodeStyle.textColor,
            size: 12,
            strokeWidth: 0,
            strokeColor: 'transparent'
          },
          size: nodeStyle.size
        };
      });

      // 转换连线数据为 vis-network 格式
      const visEdgeList: TopologyEdge[] = (apiData.edges || []).map((edge): TopologyEdge => {
        this.statistics.connectionCount++;
        // 构建详细的 tooltip 信息
        const tooltipLines = [
          `发送方: ${edge.fromCommNode}`,
          `接收方: ${edge.toCommNode}`,
          `协议: ${edge.connectionType?.toUpperCase() || 'TCP'}`,
          `端口: ${edge.port}`
        ];
        if (edge.fromHost) {
          tooltipLines.push(`目标地址: ${edge.fromHost}:${edge.port}`);
        }
        return {
          id: edge.id,
          from: edge.from,
          to: edge.to,
          label: edge.label,
          connectionType: edge.connectionType as 'physical' | 'logical' | 'data',
          color: {
            color: '#27ae60',
            highlight: '#229954'
          },
          width: 2,
          arrows: 'to',
          smooth: {
            enabled: true,
            type: 'curvedCW',
            roundness: 0.1
          },
          title: tooltipLines.join('\n')
        };
      });

      this.nodes = visNodeList;
      this.edges = visEdgeList;
      this.hasData = this.nodes.length > 0;

      console.log('拓扑初始化完成，节点数:', this.nodes.length, '边数:', this.edges.length);
      console.log('TCP端点信息:', {
        tcpIn: apiData.tcpInEndpointList?.length || 0,
        tcpOut: apiData.tcpOutEndpointList?.length || 0
      });

      this.loading = false;
    },

    /**
     * 刷新拓扑数据
     */
    async refreshTopology() {
      await this.initializeTopology();
    },

    /**
     * 添加节点
     * @param node - 节点数据
     * @returns 是否添加成功
     */
    addNode(node: TopologyNode) {
      // 确保ID唯一
      const existingNode = this.nodes.find(n => n.id === node.id);
      if (existingNode) {
        console.warn('节点ID已存在:', node.id);
        return false;
      }

      this.nodes.push(node);

      // 更新层级统计
      const nodeType = node.type || 'unknown';
      this.statistics.levelCounts[nodeType] = (this.statistics.levelCounts[nodeType] || 0) + 1;

      console.log('添加节点成功:', node.id);
      return true;
    },

    /**
     * 添加边
     * @param edge - 边数据
     * @returns 是否添加成功
     */
    addEdge(edge: TopologyEdge) {
      // 确保ID唯一
      const edgeId = edge.id || `${edge.from}-${edge.to}`;
      const existingEdge = this.edges.find(e => e.id === edgeId);
      if (existingEdge) {
        console.warn('边ID已存在:', edgeId);
        return false;
      }

      const newEdge: TopologyEdge = {
        ...edge,
        id: edgeId
      };

      this.edges.push(newEdge);
      this.statistics.connectionCount++;

      console.log('添加边成功:', edgeId);
      return true;
    },

    /**
     * 更新节点
     * @param nodeId - 节点ID
     * @param newProps - 新的属性
     * @returns 是否更新成功
     */
    updateNode(nodeId: IdType, newProps: Partial<TopologyNode>) {
      const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        console.warn('未找到要更新的节点:', nodeId);
        return false;
      }

      this.nodes[nodeIndex] = { ...this.nodes[nodeIndex], ...newProps };
      console.log('更新节点成功:', nodeId);
      return true;
    },

    /**
     * 更新边
     * @param edgeId - 边ID
     * @param newProps - 新的属性
     * @returns 是否更新成功
     */
    updateEdge(edgeId: IdType, newProps: Partial<TopologyEdge>) {
      const edgeIndex = this.edges.findIndex(e => e.id === edgeId);
      if (edgeIndex === -1) {
        console.warn('未找到要更新的边:', edgeId);
        return false;
      }

      this.edges[edgeIndex] = { ...this.edges[edgeIndex], ...newProps };
      console.log('更新边成功:', edgeId);
      return true;
    },

    /**
     * 删除节点
     * @param nodeId - 节点ID
     * @returns 是否删除成功
     */
    removeNode(nodeId: IdType) {
      const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        console.warn('未找到要删除的节点:', nodeId);
        return false;
      }

      const node = this.nodes[nodeIndex];

      // 删除相关的边
      this.edges = this.edges.filter(edge =>
        edge.from !== nodeId && edge.to !== nodeId
      );

      // 删除节点
      this.nodes.splice(nodeIndex, 1);

      // 更新层级统计
      const nodeType = node.type || 'unknown';
      this.statistics.levelCounts[nodeType] = Math.max(0, (this.statistics.levelCounts[nodeType] || 0) - 1);

      // 清除选中状态
      if (this.viewState.selectedNodeId === nodeId) {
        this.viewState.selectedNodeId = null;
      }

      console.log('删除节点成功:', nodeId);
      return true;
    },

    /**
     * 删除边
     * @param edgeId - 边ID
     * @returns 是否删除成功
     */
    removeEdge(edgeId: IdType) {
      const edgeIndex = this.edges.findIndex(e => e.id === edgeId);
      if (edgeIndex === -1) {
        console.warn('未找到要删除的边:', edgeId);
        return false;
      }

      this.edges.splice(edgeIndex, 1);
      this.statistics.connectionCount--;

      // 清除选中状态
      if (this.viewState.selectedEdgeId === edgeId) {
        this.viewState.selectedEdgeId = null;
      }

      console.log('删除边成功:', edgeId);
      return true;
    },

    /**
     * 选择节点
     * @param nodeId - 节点ID，null表示清除选择
     */
    selectNode(nodeId: IdType | null) {
      this.viewState.selectedNodeId = nodeId;
      this.viewState.selectedEdgeId = null; // 清除边选中状态

      if (nodeId) {
        console.log('选中节点:', nodeId);
      } else {
        console.log('清除节点选择');
      }
    },

    /**
     * 选择边
     * @param edgeId - 边ID，null表示清除选择
     */
    selectEdge(edgeId: IdType | null) {
      this.viewState.selectedEdgeId = edgeId;
      this.viewState.selectedNodeId = null; // 清除节点选中状态

      if (edgeId) {
        console.log('选中边:', edgeId);
      } else {
        console.log('清除边选择');
      }
    },

    /**
     * 清除所有选择
     */
    clearSelection() {
      this.viewState.selectedNodeId = null;
      this.viewState.selectedEdgeId = null;
      this.viewState.hoveredNodeId = null;
      console.log('清除所有选择');
    },

    /**
     * 设置悬停节点
     * @param nodeId - 节点ID，null表示清除悬停
     */
    setHoveredNode(nodeId: IdType | null) {
      this.viewState.hoveredNodeId = nodeId;
    },

    /**
     * 更新视图状态
     * @param newState - 新的视图状态（部分更新）
     */
    updateViewState(newState: Partial<ViewState>) {
      this.viewState = { ...this.viewState, ...newState };
    },

    /**
     * 搜索处理
     * @param keyword - 搜索关键词
     */
    handleSearch(keyword: string) {
      this.searchKeyword = keyword;
      console.log('搜索关键词:', keyword);
    },

    /**
     * 筛选处理
     * @param type - 节点类型筛选
     * @param status - 节点状态筛选
     */
    handleFilter(type: string, status: string) {
      this.filterType = type;
      this.filterStatus = status;
      console.log('筛选条件:', { type, status });
    },

    /**
     * 切换高级筛选
     */
    toggleAdvancedFilter() {
      this.showAdvancedFilter = !this.showAdvancedFilter;
    },

    /**
     * 清除所有筛选
     */
    clearFilters() {
      this.searchKeyword = '';
      this.filterType = '';
      this.filterStatus = '';
      this.showAdvancedFilter = false;
    },

    /**
     * 重置整个拓扑状态
     */
    resetTopology() {
      this.rawSystemData = null;
      this.nodes = [];
      this.edges = [];
      this.viewState = {
        selectedNodeId: null,
        selectedEdgeId: null,
        hoveredNodeId: null,
        zoomLevel: 1,
        networkCenter: { x: 0, y: 0 }
      };
      this.statistics = {
        levelCounts: {},
        connectionCount: 0,
        onlineCount: 0,
        offlineCount: 0,
        unknownCount: 0
      };
      this.loading = false;
      this.hasData = false;
      this.hasError = false;
      this.errorMessage = '';
      this.clearFilters();

      console.log('拓扑状态已重置');
    }
  },

  // ========== 持久化配置 ==========
  persist: {
    key: 'topology-store',
  }
});