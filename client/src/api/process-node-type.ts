/**
 * 流程节点类型管理 API
 */
import { apiClient } from './index';

export const processNodeTypeApi = {
  /**
   * 获取流程节点类型列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {string} [params.name] - 节点类型名称（模糊搜索）
   * @param {number} [params.type] - 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
   * @returns {Promise} API 响应
   */
  getProcessNodeTypeList: (params: {
    page?: number;
    pageSize?: number;
    name?: string;
    type?: number;
  }) => apiClient.get('/process-node-types/query', params),

  /**
   * 创建流程节点类型
   * @param {Object} data - 节点类型数据
   * @param {string} data.name - 节点类型名称
   * @param {number} data.type - 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
   * @param {string} [data.description] - 节点类型描述
   * @param {number} [data.sort_order] - 排序号（越小越靠前）
   * @param {Object} [data.config] - 配置信息（JSON格式）
   * @returns {Promise} API 响应
   */
  createProcessNodeType: (data: {
    name: string;
    type: number;
    description?: string;
    sort_order?: number;
    config?: object;
  }) => apiClient.post('/process-node-types/create', data),

  /**
   * 更新流程节点类型
   * @param {Object} data - 节点类型数据
   * @param {number} data.id - 节点类型ID
   * @param {string} [data.name] - 节点类型名称
   * @param {number} [data.type] - 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
   * @param {string} [data.description] - 节点类型描述
   * @param {number} [data.sort_order] - 排序号（越小越靠前）
   * @param {Object} [data.config] - 配置信息（JSON格式）
   * @returns {Promise} API 响应
   */
  updateProcessNodeType: (data: {
    id: number;
    name?: string;
    type?: number;
    description?: string;
    sort_order?: number;
    config?: object;
  }) => apiClient.post('/process-node-types/update', data),

  /**
   * 删除流程节点类型
   * @param {Array<number>} data - 节点类型ID列表
   * @returns {Promise} API 响应
   */
  deleteProcessNodeTypes: (data: number[]) => apiClient.post('/process-node-types/delete', { data }),

  /**
   * 获取流程节点类型详情
   * @param {number} id - 节点类型ID
   * @returns {Promise} API 响应
   */
  getProcessNodeTypeDetail: (id: number) => apiClient.get('/process-node-types/detail', { id }),
};
