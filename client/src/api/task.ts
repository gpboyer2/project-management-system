/**
 * 任务管理 API
 */
import { apiClient } from './index';

export const taskApi = {
  /**
   * 获取任务列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {number} [params.requirementId] - 需求ID
   * @param {number} [params.reviewId] - 评审ID
   * @param {number} [params.status] - 任务状态
   * @returns {Promise} API 响应
   */
  getTaskList: (params: {
    page?: number;
    pageSize?: number;
    requirementId?: number;
    reviewId?: number;
    status?: number;
  }) => apiClient.get('/tasks/query', params),

  /**
   * 创建任务
   * @param {Object} data - 任务数据
   * @param {string} data.name - 任务名称
   * @param {string} [data.description] - 任务描述
   * @param {number} data.priority - 优先级（1-P0 2-P1 3-P2 4-P3）
   * @param {number} data.status_id - 任务状态ID
   * @param {number} [data.assignee_id] - 负责人用户ID
   * @param {number} data.reporter_id - 创建人用户ID
   * @param {number} [data.requirement_id] - 关联需求ID
   * @param {number} [data.review_id] - 关联评审ID
   * @param {number} [data.requirement_node_id] - 需求管理流程节点ID
   * @param {number} [data.review_node_id] - 评审管理流程节点ID
   * @param {number} [data.estimated_hours] - 预估工时(小时)
   * @param {number} [data.actual_hours] - 实际工时(小时)
   * @param {number} [data.start_time] - 开始时间（Unix时间戳）
   * @param {number} [data.end_time] - 结束时间（Unix时间戳）
   * @returns {Promise} API 响应
   */
  createTask: (data: {
    name: string;
    description?: string;
    priority: number;
    status_id: number;
    assignee_id?: number;
    reporter_id: number;
    requirement_id?: number;
    review_id?: number;
    requirement_node_id?: number;
    review_node_id?: number;
    estimated_hours?: number;
    actual_hours?: number;
    start_time?: number;
    end_time?: number;
  }) => apiClient.post('/tasks/create', data),

  /**
   * 更新任务
   * @param {Object} data - 任务数据
   * @param {number} data.id - 任务ID
   * @param {string} [data.name] - 任务名称
   * @param {string} [data.description] - 任务描述
   * @param {number} [data.priority] - 优先级（1-P0 2-P1 3-P2 4-P3）
   * @param {number} [data.status_id] - 任务状态ID
   * @param {number} [data.assignee_id] - 负责人用户ID
   * @param {number} [data.reporter_id] - 创建人用户ID
   * @param {number} [data.requirement_id] - 关联需求ID
   * @param {number} [data.review_id] - 关联评审ID
   * @param {number} [data.requirement_node_id] - 需求管理流程节点ID
   * @param {number} [data.review_node_id] - 评审管理流程节点ID
   * @param {number} [data.estimated_hours] - 预估工时(小时)
   * @param {number} [data.actual_hours] - 实际工时(小时)
   * @param {number} [data.start_time] - 开始时间（Unix时间戳）
   * @param {number} [data.end_time] - 结束时间（Unix时间戳）
   * @returns {Promise} API 响应
   */
  updateTask: (data: {
    id: number;
    name?: string;
    description?: string;
    priority?: number;
    status_id?: number;
    assignee_id?: number;
    reporter_id?: number;
    requirement_id?: number;
    review_id?: number;
    requirement_node_id?: number;
    review_node_id?: number;
    estimated_hours?: number;
    actual_hours?: number;
    start_time?: number;
    end_time?: number;
  }) => apiClient.post('/tasks/update', data),

  /**
   * 删除任务
   * @param {Array<number>} data - 任务ID列表
   * @returns {Promise} API 响应
   */
  deleteTasks: (data: number[]) => apiClient.post('/tasks/delete', { data }),

  /**
   * 获取任务详情
   * @param {number} id - 任务ID
   * @returns {Promise} API 响应
   */
  getTaskDetail: (id: number) => apiClient.get('/tasks/detail', { id }),
};
