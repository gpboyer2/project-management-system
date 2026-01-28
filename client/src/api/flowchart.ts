import { apiClient } from './index';

/**
 * 流程图 API
 */
export const flowchartApi = {
  /**
   * 保存流程图（根据体系节点ID，自动创建或更新）
   * @param {Object} data - 流程图数据
   * @param {string} data.arch_node_id - 体系节点ID
   * @param {string} [data.comm_node_id] - 通信节点ID（可选）
   * @param {string} [data.name] - 流程图名称（可选）
   * @param {any[]} data.nodes - 节点列表
   * @param {any[]} data.edges - 边列表
   * @returns {Promise} API响应结果
   */
  save: (data: {
    arch_node_id: string
    comm_node_id?: string
    name?: string
    nodes: any[]
    edges: any[]
  }) => apiClient.post('/flowcharts/save', data),

  /**
   * 根据体系节点ID加载流程图
   * @param {string} archNodeId - 体系节点ID
   * @returns {Promise} API响应结果，包含流程图数据
   */
  loadByArchNodeId: (archNodeId: string) =>
    apiClient.get('/flowcharts/by-arch-node', { arch_node_id: archNodeId }),

  /**
   * 根据通信节点ID加载流程图
   * @param {string} commNodeId - 通信节点ID
   * @returns {Promise} API响应结果，包含流程图数据
   */
  loadByCommNodeId: (commNodeId: string) =>
    apiClient.get('/flowcharts/by-comm-node', { comm_node_id: commNodeId }),

  /**
   * 根据体系节点ID获取通信节点列表
   * @param {string} archNodeId - 体系节点ID
   * @returns {Promise} API响应结果，包含通信节点列表
   */
  getCommNodeList: (archNodeId: string) =>
    apiClient.get('/flowcharts/comm-nodes', { arch_node_id: archNodeId }),

  /**
   * 删除通信节点（同时删除关联的流程图）
   * @param {string} commNodeId - 通信节点ID
   * @returns {Promise} API响应结果
   */
  deleteCommNode: (commNodeId: string) =>
    apiClient.post('/flowcharts/delete-comm-node', { comm_node_id: commNodeId })
};
