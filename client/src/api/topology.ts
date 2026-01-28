import { apiClient } from './index';

/**
 * 拓扑展示 API
 *
 * 用于拓扑数据的纯展示，数据动态组装
 */
export const topologyApi = {
  /**
   * 获取所有拓扑节点数据
   *
   * 返回节点和连线信息，根据体系配置和通信节点的 TCP IN/OUT 动态生成
   *
   * @returns {Promise<any>} 返回拓扑节点数据，包含节点列表和连线信息
   */
  getAllNodes: () => apiClient.get('/topology/nodes')
};
