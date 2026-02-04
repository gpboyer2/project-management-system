/**
 * 需求状态管理 API
 * 提供需求状态的增删改查操作接口
 */
import { apiClient } from './index';

// 需求状态数据类型定义
export interface RequirementStatus {
  id: number;
  name: string;
  status: number;
  description: string;
  sort_order: number;
  config: any;
  created_at: number;
  updated_at: number;
}

// 查询参数类型定义
export interface RequirementStatusQueryParams {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: number;
}

// 创建需求状态请求数据类型
export interface CreateRequirementStatusRequest {
  name: string;
  status: number;
  description: string;
  sort_order?: number;
  config?: any;
}

// 更新需求状态请求数据类型
export interface UpdateRequirementStatusRequest {
  id: number;
  name?: string;
  status?: number;
  description?: string;
  sort_order?: number;
  config?: any;
}

// API接口
export const requirementStatusApi = {
  /**
   * 获取需求状态列表
   * @param params 查询参数
   * @returns 需求状态列表和分页信息
   */
  getRequirementStatusList: async (params: RequirementStatusQueryParams): Promise<{
    status: string;
    message: string;
    datum: {
      list: RequirementStatus[];
      pagination: {
        current_page: number;
        page_size: number;
        total: number;
      };
    };
  }> => {
    return apiClient.get('/requirement-statuses/query', params);
  },

  /**
   * 获取需求状态详情
   * @param id 需求状态ID
   * @returns 需求状态详情
   */
  getRequirementStatusDetail: async (id: number): Promise<{
    status: string;
    message: string;
    datum: RequirementStatus;
  }> => {
    return apiClient.get('/requirement-statuses/detail', { id });
  },

  /**
   * 创建需求状态
   * @param data 需求状态数据
   * @returns 创建后的需求状态
   */
  createRequirementStatus: async (data: CreateRequirementStatusRequest): Promise<{
    status: string;
    message: string;
    datum: RequirementStatus;
  }> => {
    return apiClient.post('/requirement-statuses/create', data);
  },

  /**
   * 更新需求状态
   * @param data 需求状态数据
   * @returns 更新后的需求状态
   */
  updateRequirementStatus: async (data: UpdateRequirementStatusRequest): Promise<{
    status: string;
    message: string;
    datum: RequirementStatus;
  }> => {
    return apiClient.post('/requirement-statuses/update', data);
  },

  /**
   * 删除需求状态
   * @param ids 需求状态ID列表
   * @returns 删除结果
   */
  deleteRequirementStatuses: async (ids: number[]): Promise<{
    status: string;
    message: string;
    datum: any;
  }> => {
    return apiClient.post('/requirement-statuses/delete', { data: ids });
  },
};
