import { apiClient } from './index';

// 体系配置树 API
export const systemLevelDesignTreeApi = {
  // 查询
  /**
   * 获取所有节点
   * @returns {Promise<any>} 返回所有节点列表
   */
  getAllNodes: () => apiClient.get('/system-level-design-tree/nodes'),

  /**
   * 根据ID获取节点详情
   * @param {string} id - 节点ID
   * @returns {Promise<any>} 返回节点详情数据
   */
  getNodeById: (id: string) => apiClient.get('/system-level-design-tree/nodes/detail', { id }),

  /**
   * 获取子节点列表
   * @param {string} parentId - 父节点ID
   * @returns {Promise<any>} 返回子节点列表
   */
  getChildNodes: (parentId: string) => apiClient.get('/system-level-design-tree/nodes/children', { parentId }),

  // 增删改（入参统一为数组）
  /**
   * 批量创建节点
   * @param {any[]} dataList - 节点数据列表
   * @returns {Promise<any>} 返回创建结果
   */
  createNodeList: (dataList: any[]) => apiClient.post('/system-level-design-tree/nodes/create', dataList),

  /**
   * 批量更新节点
   * @param {any[]} dataList - 节点数据列表
   * @returns {Promise<any>} 返回更新结果
   */
  updateNodeList: (dataList: any[]) => apiClient.put('/system-level-design-tree/nodes/update', dataList),

  /**
   * 批量删除节点
   * @param {string[]} idList - 节点ID列表
   * @returns {Promise<any>} 返回删除结果
   */
  deleteNodeList: (idList: string[]) => apiClient.post('/system-level-design-tree/nodes/delete', { ids: idList }),

  // 生成代码
  /**
   * 生成代码
   * @param {string} nodeId - 节点ID
   * @returns {Promise<any>} 返回代码生成结果
   */
  generateCode: (nodeId: string) => apiClient.post('/system-level-design-tree/nodes/generate-code', { nodeId })
};
