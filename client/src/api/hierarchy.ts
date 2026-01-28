import { apiClient } from './index';

/**
 * 层级配置 API
 */
export const hierarchyApi = {
  /**
   * 获取所有层级节点类型
   * @returns {Promise<any>} 返回所有层级节点类型列表
   */
  getAllNodeTypes: () => apiClient.get('/hierarchy/hierarchy-levels/list'),

  /**
   * 根据 ID 获取层级节点类型详情
   * @param {string} id - 层级节点类型 ID
   * @returns {Promise<any>} 返回层级节点类型详情
   */
  getNodeTypeById: (id: string) => apiClient.get('/hierarchy/hierarchy-levels/detail', { id }),

  /**
   * 创建层级节点类型
   * @param {any} data - 层级节点类型数据
   * @returns {Promise<any>} 返回创建结果
   */
  createNodeType: (data: any) => apiClient.post('/hierarchy/hierarchy-levels/create', data),

  /**
   * 更新层级节点类型
   * @param {string} id - 层级节点类型 ID
   * @param {any} data - 更新的层级节点类型数据
   * @returns {Promise<any>} 返回更新结果
   */
  updateNodeType: (id: string, data: any) => apiClient.post('/hierarchy/hierarchy-levels/update', Object.assign({ id }, data)),

  /**
   * 删除层级节点类型
   * @param {string} id - 层级节点类型 ID
   * @returns {Promise<any>} 返回删除结果
   */
  deleteNodeType: (id: string) => apiClient.post('/hierarchy/hierarchy-levels/delete', { id }),

  /**
   * 为层级节点类型添加字段
   * @param {string} nodeTypeId - 层级节点类型 ID
   * @param {any} data - 字段数据
   * @returns {Promise<any>} 返回添加字段结果
   */
  createNodeTypeField: (nodeTypeId: string, data: any) => apiClient.post('/hierarchy/hierarchy-levels/add-field', Object.assign({ id: nodeTypeId }, data)),

  /**
   * 更新层级节点类型的字段
   * @param {string} nodeTypeId - 层级节点类型 ID
   * @param {string} fieldId - 字段 ID
   * @param {any} data - 更新的字段数据
   * @returns {Promise<any>} 返回更新字段结果
   */
  updateNodeTypeField: (nodeTypeId: string, fieldId: string, data: any) => apiClient.post('/hierarchy/hierarchy-levels/update-field', Object.assign({ id: nodeTypeId, field_id: fieldId }, data)),

  /**
   * 删除层级节点类型的字段
   * @param {string} nodeTypeId - 层级节点类型 ID
   * @param {string} fieldId - 字段 ID
   * @returns {Promise<any>} 返回删除字段结果
   */
  deleteNodeTypeField: (nodeTypeId: string, fieldId: string) => apiClient.post('/hierarchy/hierarchy-levels/delete-field', { id: nodeTypeId, field_id: fieldId })
};
