/**
 * 项目管理 API
 */
import { apiClient } from './index';

export const projectApi = {
  /**
   * 获取项目列表
   * @param {Object} params - 查询参数
   * @param {number} [params.page] - 页码，默认1
   * @param {number} [params.pageSize] - 每页数量，默认20
   * @param {number} [params.status] - 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
   * @returns {Promise} API 响应
   */
  getProjectList: (params: {
    page?: number;
    pageSize?: number;
    status?: number;
  }) => apiClient.get('/projects/query', params),

  /**
   * 创建项目
   * @param {Object} data - 项目数据
   * @param {string} data.name - 项目名称
   * @param {string} [data.description] - 项目描述
   * @param {number} [data.status] - 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
   * @param {number} data.manager_id - 项目经理ID
   * @param {number} [data.department_id] - 部门ID
   * @param {number} [data.start_date] - 开始时间（Unix时间戳）
   * @param {number} [data.end_date] - 结束时间（Unix时间戳）
   * @param {number} [data.budget] - 项目预算
   * @returns {Promise} API 响应
   */
  createProject: (data: {
    name: string;
    description?: string;
    status?: number;
    manager_id: number;
    department_id?: number;
    start_date?: number;
    end_date?: number;
    budget?: number;
  }) => apiClient.post('/projects/create', data),

  /**
   * 更新项目
   * @param {Object} data - 项目数据
   * @param {number} data.id - 项目ID
   * @param {string} [data.name] - 项目名称
   * @param {string} [data.description] - 项目描述
   * @param {number} [data.status] - 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
   * @param {number} [data.manager_id] - 项目经理ID
   * @param {number} [data.department_id] - 部门ID
   * @param {number} [data.start_date] - 开始时间（Unix时间戳）
   * @param {number} [data.end_date] - 结束时间（Unix时间戳）
   * @param {number} [data.budget] - 项目预算
   * @returns {Promise} API 响应
   */
  updateProject: (data: {
    id: number;
    name?: string;
    description?: string;
    status?: number;
    manager_id?: number;
    department_id?: number;
    start_date?: number;
    end_date?: number;
    budget?: number;
  }) => apiClient.post('/projects/update', data),

  /**
   * 删除项目
   * @param {Array<number>} data - 项目ID列表
   * @returns {Promise} API 响应
   */
  deleteProjects: (data: number[]) => apiClient.post('/projects/delete', { data }),

  /**
   * 获取项目团队成员列表
   * @param {number} projectId - 项目ID
   * @returns {Promise} API 响应
   */
  getProjectTeamList: (projectId: number) => apiClient.get('/projects/team/query', { projectId }),

  /**
   * 添加项目团队成员
   * @param {Object} data - 团队成员数据
   * @param {number} data.project_id - 项目ID
   * @param {number} data.user_id - 用户ID
   * @param {number} data.role_id - 角色ID
   * @returns {Promise} API 响应
   */
  addProjectTeamMember: (data: {
    project_id: number;
    user_id: number;
    role_id: number;
  }) => apiClient.post('/projects/team/create', data),

  /**
   * 更新项目团队成员
   * @param {Object} data - 团队成员数据
   * @param {number} data.id - 团队成员ID
   * @param {number} data.role_id - 角色ID
   * @returns {Promise} API 响应
   */
  updateProjectTeamMember: (data: {
    id: number;
    role_id: number;
  }) => apiClient.post('/projects/team/update', data),

  /**
   * 删除项目团队成员
   * @param {Array<number>} data - 团队成员ID列表
   * @returns {Promise} API 响应
   */
  deleteProjectTeamMembers: (data: number[]) => apiClient.post('/projects/team/delete', { data }),
};
