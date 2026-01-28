import { apiClient } from './index';

// 用户管理 API
export const userApi = {
  /**
   * 查询用户列表
   * @param {{ current_page?: number; page_size?: number; keyword?: string; role?: number; status?: number; user_id?: number }} params - 查询参数
   * @returns {Promise<any>} 返回用户列表数据
   */
  list: (params: { current_page?: number; page_size?: number; keyword?: string; role?: number; status?: number; user_id?: number }) =>
    apiClient.get('/user/list', params),

  /**
   * 新增用户（支持批量）
   * @param {Array<{ user_name: string; password: string; real_name?: string; email?: string; phone?: string; role_id?: number; status?: number }>} data - 用户数据数组
   * @returns {Promise<any>} 返回新增结果
   */
  create: (data: Array<{ user_name: string; password: string; real_name?: string; email?: string; phone?: string; role_id?: number; status?: number }>) =>
    apiClient.post('/user/create', { data }),

  /**
   * 更新用户（支持批量）
   * @param {Array<{ user_id: number; user_name?: string; password?: string; real_name?: string; email?: string; phone?: string; role_id?: number; status?: number }>} data - 用户数据数组
   * @returns {Promise<any>} 返回更新结果
   */
  update: (data: Array<{ user_id: number; user_name?: string; password?: string; real_name?: string; email?: string; phone?: string; role_id?: number; status?: number }>) =>
    apiClient.post('/user/update', { data }),

  /**
   * 删除用户（支持批量）
   * @param {number[]} data - 用户ID数组
   * @returns {Promise<any>} 返回删除结果
   */
  delete: (data: number[]) =>
    apiClient.post('/user/delete', { data })
};

// 角色管理 API
export const roleApi = {
  /**
   * 查询角色列表
   * @param {{ current_page?: number; page_size?: number; keyword?: string; status?: number } | undefined} params - 查询参数
   * @returns {Promise<any>} 返回角色列表数据
   */
  list: (params?: { current_page?: number; page_size?: number; keyword?: string; status?: number }) =>
    apiClient.get('/roles/list', params)
};
