/**
 * 需求类型管理 API
 */
import { apiClient } from './index';

export const requirementTypeApi = {
  /**
   * 获取需求类型列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {string} [params.name] - 需求类型名称（模糊搜索）
   * @param {number} [params.type] - 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
   * @returns {Promise} API 响应
   */
  getRequirementTypeList: (params: {
    page?: number;
    pageSize?: number;
    name?: string;
    type?: number;
  }) => apiClient.get('/requirement-types/query', params),

  /**
   * 创建需求类型
   * @param {Object} data - 需求类型数据
   * @param {string} data.name - 需求类型名称
   * @param {number} data.type - 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
   * @param {string} [data.description] - 需求类型描述
   * @param {number} [data.sort_order] - 排序号（越小越靠前）
   * @param {Object} [data.config] - 配置信息（JSON格式）
   * @returns {Promise} API 响应
   */
  createRequirementType: (data: {
    name: string;
    type: number;
    description?: string;
    sort_order?: number;
    config?: object;
  }) => apiClient.post('/requirement-types/create', data),

  /**
   * 更新需求类型
   * @param {Object} data - 需求类型数据
   * @param {number} data.id - 需求类型ID
   * @param {string} [data.name] - 需求类型名称
   * @param {number} [data.type] - 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
   * @param {string} [data.description] - 需求类型描述
   * @param {number} [data.sort_order] - 排序号（越小越靠前）
   * @param {Object} [data.config] - 配置信息（JSON格式）
   * @returns {Promise} API 响应
   */
  updateRequirementType: (data: {
    id: number;
    name?: string;
    type?: number;
    description?: string;
    sort_order?: number;
    config?: object;
  }) => apiClient.post('/requirement-types/update', data),

  /**
   * 删除需求类型
   * @param {Array<number>} data - 需求类型ID列表
   * @returns {Promise} API 响应
   */
  deleteRequirementTypes: (data: number[]) => apiClient.post('/requirement-types/delete', { data }),

  /**
   * 获取需求类型详情
   * @param {number} id - 需求类型ID
   * @returns {Promise} API 响应
   */
  getRequirementTypeDetail: (id: number) => apiClient.get('/requirement-types/detail', { id }),
};
