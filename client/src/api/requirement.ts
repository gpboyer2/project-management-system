/**
 * 需求管理 API
 */
import { apiClient } from './index';

export const requirementApi = {
  /**
   * 获取需求列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {number} [params.projectId] - 项目ID
   * @param {number} [params.status] - 需求状态
   * @returns {Promise} API 响应
   */
  getRequirementList: (params: {
    page?: number;
    pageSize?: number;
    projectId?: number;
    status?: number;
  }) => apiClient.get('/requirements/query', params),

  /**
   * 创建需求
   * @param {Object} data - 需求数据
   * @param {string} data.name - 需求名称
   * @param {string} [data.description] - 需求描述
   * @param {number} data.type_id - 需求类型ID
   * @param {number} data.priority - 优先级（1-P0 2-P1 3-P2 4-P3）
   * @param {number} data.status_id - 需求状态ID
   * @param {number} [data.current_assignee_id] - 当前负责人用户ID
   * @param {number} data.reporter_id - 提出人用户ID
   * @param {number} [data.project_id] - 所属项目ID
   * @param {string} [data.planned_version] - 规划版本
   * @param {string} [data.actual_version] - 实际上线版本
   * @returns {Promise} API 响应
   */
  createRequirement: (data: {
    name: string;
    description?: string;
    type_id: number;
    priority: number;
    status_id: number;
    current_assignee_id?: number;
    reporter_id: number;
    project_id?: number;
    planned_version?: string;
    actual_version?: string;
  }) => apiClient.post('/requirements/create', data),

  /**
   * 更新需求
   * @param {Object} data - 需求数据
   * @param {number} data.id - 需求ID
   * @param {string} [data.name] - 需求名称
   * @param {string} [data.description] - 需求描述
   * @param {number} [data.type_id] - 需求类型ID
   * @param {number} [data.priority] - 优先级（1-P0 2-P1 3-P2 4-P3）
   * @param {number} [data.status_id] - 需求状态ID
   * @param {number} [data.current_assignee_id] - 当前负责人用户ID
   * @param {number} [data.reporter_id] - 提出人用户ID
   * @param {number} [data.project_id] - 所属项目ID
   * @param {string} [data.planned_version] - 规划版本
   * @param {string} [data.actual_version] - 实际上线版本
   * @returns {Promise} API 响应
   */
  updateRequirement: (data: {
    id: number;
    name?: string;
    description?: string;
    type_id?: number;
    priority?: number;
    status_id?: number;
    current_assignee_id?: number;
    reporter_id?: number;
    project_id?: number;
    planned_version?: string;
    actual_version?: string;
  }) => apiClient.post('/requirements/update', data),

  /**
   * 删除需求
   * @param {Array<number>} data - 需求ID列表
   * @returns {Promise} API 响应
   */
  deleteRequirements: (data: number[]) => apiClient.post('/requirements/delete', { data }),

  /**
   * 获取需求详情
   * @param {number} id - 需求ID
   * @returns {Promise} API 响应
   */
  getRequirementDetail: (id: number) => apiClient.get('/requirements/detail', { id }),

  /**
   * 获取需求流程节点列表
   * @param {number} requirementId - 需求ID
   * @returns {Promise} API 响应
   */
  getRequirementProcessNodes: (requirementId: number) => apiClient.get('/requirements/process-nodes/query', { requirementId }),

  /**
   * 创建需求流程节点
   * @param {Object} data - 流程节点数据
   * @param {number} data.requirement_id - 关联需求ID
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
  createRequirementProcessNode: (data: {
    requirement_id: number;
    name: string;
    node_type_id: number;
    parent_node_id?: number;
    node_order: number;
    assignee_type?: number;
    assignee_id?: number;
    duration_limit?: number;
    status?: number;
  }) => apiClient.post('/requirements/process-nodes/create', data),

  /**
   * 更新需求流程节点
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
  updateRequirementProcessNode: (data: {
    id: number;
    name?: string;
    node_type_id?: number;
    parent_node_id?: number;
    node_order?: number;
    assignee_type?: number;
    assignee_id?: number;
    duration_limit?: number;
    status?: number;
  }) => apiClient.post('/requirements/process-nodes/update', data),

  /**
   * 删除需求流程节点
   * @param {Array<number>} data - 节点ID列表
   * @returns {Promise} API 响应
   */
  deleteRequirementProcessNodes: (data: number[]) => apiClient.post('/requirements/process-nodes/delete', { data }),

  /**
   * 获取需求流程节点详情
   * @param {number} id - 节点ID
   * @returns {Promise} API 响应
   */
  getRequirementProcessNodeDetail: (id: number) => apiClient.get('/requirements/process-nodes/detail', { id }),

  /**
   * 获取需求流程节点用户列表
   * @param {number} nodeId - 节点ID
   * @returns {Promise} API 响应
   */
  getRequirementProcessNodeUsers: (nodeId: number) => apiClient.get('/requirements/process-nodes/users/query', { nodeId }),

  /**
   * 创建需求流程节点用户关联
   * @param {Object} data - 节点用户关联数据
   * @param {number} data.node_id - 节点ID
   * @param {number} data.user_id - 用户ID
   * @param {number} data.role_type - 角色类型（1-负责人 2-参与者 3-观察者）
   * @returns {Promise} API 响应
   */
  createRequirementProcessNodeUser: (data: {
    node_id: number;
    user_id: number;
    role_type: number;
  }) => apiClient.post('/requirements/process-nodes/users/create', data),

  /**
   * 删除需求流程节点用户关联
   * @param {Array<number>} data - 节点用户关联ID列表
   * @returns {Promise} API 响应
   */
  deleteRequirementProcessNodeUsers: (data: number[]) => apiClient.post('/requirements/process-nodes/users/delete', { data }),

  /**
   * 获取需求流程节点关系列表
   * @param {number} requirementId - 需求ID
   * @returns {Promise} API 响应
   */
  getRequirementProcessNodeRelations: (requirementId: number) => apiClient.get('/requirements/process-nodes/relations/query', { requirementId }),

  /**
   * 创建需求流程节点关系
   * @param {Object} data - 节点关系数据
   * @param {number} data.requirement_id - 需求ID
   * @param {number} data.source_node_id - 源节点ID
   * @param {number} data.target_node_id - 目标节点ID
   * @param {number} data.relation_type - 关系类型（1-顺序 2-并行 3-条件）
   * @param {string} [data.condition] - 条件表达式
   * @returns {Promise} API 响应
   */
  createRequirementProcessNodeRelation: (data: {
    requirement_id: number;
    source_node_id: number;
    target_node_id: number;
    relation_type: number;
    condition?: string;
  }) => apiClient.post('/requirements/process-nodes/relations/create', data),

  /**
   * 更新需求流程节点关系
   * @param {Object} data - 节点关系数据
   * @param {number} data.id - 关系ID
   * @param {number} [data.relation_type] - 关系类型（1-顺序 2-并行 3-条件）
   * @param {string} [data.condition] - 条件表达式
   * @returns {Promise} API 响应
   */
  updateRequirementProcessNodeRelation: (data: {
    id: number;
    relation_type?: number;
    condition?: string;
  }) => apiClient.post('/requirements/process-nodes/relations/update', data),

  /**
   * 删除需求流程节点关系
   * @param {Array<number>} data - 节点关系ID列表
   * @returns {Promise} API 响应
   */
  deleteRequirementProcessNodeRelations: (data: number[]) => apiClient.post('/requirements/process-nodes/relations/delete', { data }),

  /**
   * 保存需求流程（批量保存节点和关系）
   * @param {Object} data - 流程数据
   * @param {Array} data.nodes - 节点列表
   * @param {Array} data.relations - 关系列表
   * @returns {Promise} API 响应
   */
  saveRequirementProcess: (data: {
    nodes: Array<any>;
    relations: Array<any>;
  }) => apiClient.post('/requirements/process/save', data),
};
