/**
 * 评审管理 API
 */
import { apiClient } from './index';

export const reviewApi = {
  /**
   * 获取评审列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {number} [params.projectId] - 项目ID
   * @param {number} [params.status] - 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
   * @returns {Promise} API 响应
   */
  getReviewList: (params: {
    page?: number;
    pageSize?: number;
    projectId?: number;
    status?: number;
  }) => apiClient.get('/reviews/query', params),

  /**
   * 创建评审
   * @param {Object} data - 评审数据
   * @param {string} data.name - 评审名称
   * @param {string} [data.description] - 评审描述
   * @param {number} [data.review_type] - 评审类型（1-技术评审 2-业务评审 3-产品评审）
   * @param {number} [data.status] - 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
   * @param {number} data.reporter_id - 评审发起人用户ID
   * @param {number} [data.reviewer_id] - 评审负责人用户ID
   * @param {number} data.project_id - 所属项目ID
   * @param {number} [data.start_time] - 开始时间（Unix时间戳）
   * @param {number} [data.end_time] - 结束时间（Unix时间戳）
   * @returns {Promise} API 响应
   */
  createReview: (data: {
    name: string;
    description?: string;
    review_type?: number;
    status?: number;
    reporter_id: number;
    reviewer_id?: number;
    project_id: number;
    start_time?: number;
    end_time?: number;
  }) => apiClient.post('/reviews/create', data),

  /**
   * 更新评审
   * @param {Object} data - 评审数据
   * @param {number} data.id - 评审ID
   * @param {string} [data.name] - 评审名称
   * @param {string} [data.description] - 评审描述
   * @param {number} [data.review_type] - 评审类型（1-技术评审 2-业务评审 3-产品评审）
   * @param {number} [data.status] - 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
   * @param {number} [data.reporter_id] - 评审发起人用户ID
   * @param {number} [data.reviewer_id] - 评审负责人用户ID
   * @param {number} [data.project_id] - 所属项目ID
   * @param {number} [data.start_time] - 开始时间（Unix时间戳）
   * @param {number} [data.end_time] - 结束时间（Unix时间戳）
   * @returns {Promise} API 响应
   */
  updateReview: (data: {
    id: number;
    name?: string;
    description?: string;
    review_type?: number;
    status?: number;
    reporter_id?: number;
    reviewer_id?: number;
    project_id?: number;
    start_time?: number;
    end_time?: number;
  }) => apiClient.post('/reviews/update', data),

  /**
   * 删除评审
   * @param {Array<number>} data - 评审ID列表
   * @returns {Promise} API 响应
   */
  deleteReviews: (data: number[]) => apiClient.post('/reviews/delete', { data }),

  /**
   * 获取评审详情
   * @param {number} id - 评审ID
   * @returns {Promise} API 响应
   */
  getReviewDetail: (id: number) => apiClient.get('/reviews/detail', { id }),

  /**
   * 获取评审流程节点列表
   * @param {number} reviewId - 评审ID
   * @returns {Promise} API 响应
   */
  getReviewProcessNodes: (reviewId: number) => apiClient.get('/reviews/process-nodes/query', { reviewId }),

  /**
   * 创建评审流程节点
   * @param {Object} data - 流程节点数据
   * @param {number} data.review_id - 关联评审ID
   * @param {string} data.name - 节点名称
   * @param {number} data.node_type_id - 流程节点类型ID
   * @param {number} [data.parent_node_id] - 父节点ID
   * @param {number} data.node_order - 节点顺序
   * @param {number} [data.assignee_type] - 负责人类型（1-固定用户 2-角色 3-部门）
   * @param {number} [data.assignee_id] - 负责人ID
   * @param {number} [data.duration_limit] - 处理时限(小时)
   * @param {number} [data.status] - 状态（1-启用 0-禁用）
   * @returns {Promise} API 响应
   */
  createReviewProcessNode: (data: {
    review_id: number;
    name: string;
    node_type_id: number;
    parent_node_id?: number;
    node_order: number;
    assignee_type?: number;
    assignee_id?: number;
    duration_limit?: number;
    status?: number;
  }) => apiClient.post('/reviews/process-nodes/create', data),

  /**
   * 更新评审流程节点
   * @param {Object} data - 流程节点数据
   * @param {number} data.id - 节点ID
   * @param {string} [data.name] - 节点名称
   * @param {number} [data.node_type_id] - 流程节点类型ID
   * @param {number} [data.parent_node_id] - 父节点ID
   * @param {number} [data.node_order] - 节点顺序
   * @param {number} [data.assignee_type] - 负责人类型（1-固定用户 2-角色 3-部门）
   * @param {number} [data.assignee_id] - 负责人ID
   * @param {number} [data.duration_limit] - 处理时限(小时)
   * @param {number} [data.status] - 状态（1-启用 0-禁用）
   * @returns {Promise} API 响应
   */
  updateReviewProcessNode: (data: {
    id: number;
    name?: string;
    node_type_id?: number;
    parent_node_id?: number;
    node_order?: number;
    assignee_type?: number;
    assignee_id?: number;
    duration_limit?: number;
    status?: number;
  }) => apiClient.post('/reviews/process-nodes/update', data),

  /**
   * 删除评审流程节点
   * @param {Array<number>} data - 节点ID列表
   * @returns {Promise} API 响应
   */
  /**
   * 获取评审流程节点关系列表
   * @param {number} reviewId - 评审ID
   * @returns {Promise} API 响应
   */
  getReviewProcessNodeRelations: (reviewId: number) => apiClient.get('/reviews/process-nodes/relations/query', { reviewId }),

  deleteReviewProcessNodes: (data: number[]) => apiClient.post('/reviews/process-nodes/delete', { data }),

  /**
   * 获取评审流程节点详情
   * @param {number} id - 节点ID
   * @returns {Promise} API 响应
   */
  getReviewProcessNodeDetail: (id: number) => apiClient.get('/reviews/process-nodes/detail', { id }),

  /**
   * 获取评审流程节点用户列表
   * @param {number} nodeId - 节点ID
   * @returns {Promise} API 响应
   */
  getReviewProcessNodeUsers: (nodeId: number) => apiClient.get('/reviews/process-nodes/users/query', { nodeId }),

  /**
   * 创建评审流程节点用户
   * @param {Object} data - 节点用户数据
   * @param {number} data.node_id - 节点ID
   * @param {number} data.user_id - 用户ID
   * @param {number} data.role_type - 角色类型（1-负责人 2-参与者 3-观察者）
   * @returns {Promise} API 响应
   */
  createReviewProcessNodeUser: (data: {
    node_id: number;
    user_id: number;
    role_type: number;
  }) => apiClient.post('/reviews/process-nodes/users/create', data),

  /**
   * 删除评审流程节点用户
   * @param {Array<number>} data - 用户ID列表
   * @returns {Promise} API 响应
   */
  deleteReviewProcessNodeUsers: (data: number[]) => apiClient.post('/reviews/process-nodes/users/delete', { data }),

  /**
   * 删除评审流程节点关系
   * @param {Array<number>} data - 关系ID列表
   * @returns {Promise} API 响应
   */
  deleteReviewProcessNodeRelations: (data: number[]) => apiClient.post('/reviews/process-nodes/relations/delete', { data }),

  /**
   * 保存评审流程（批量保存节点和关系）
   * @param {Object} data - 流程数据
   * @param {Array} data.nodes - 节点列表
   * @param {Array} data.relations - 关系列表
   * @returns {Promise} API 响应
   */
  saveReviewProcess: (data: {
    nodes: any[];
    relations: any[];
  }) => apiClient.post('/reviews/process/save', data),
};
