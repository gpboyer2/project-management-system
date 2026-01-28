import { apiClient } from './index';

// 认证 API
export const authApi = {
  /**
   * 用户登录
   * @param {{ username: string; password: string }} data - 登录信息，包含用户名和密码
   * @returns {Promise<any>} 登录响应，包含访问令牌和刷新令牌
   */
  login: (data: { username: string; password: string }) =>
    apiClient.post('/auth/login', data, { loading: false }),

  /**
   * 用户登出
   * @returns {Promise<any>} 登出响应
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * 刷新Token
   * @param {{ refreshToken: string }} data - 刷新令牌信息
   * @returns {Promise<any>} 新的访问令牌响应
   */
  refresh: (data: { refreshToken: string }) =>
    apiClient.post('/auth/refresh', data, { loading: false }),

  /**
   * 获取当前用户信息
   * @returns {Promise<any>} 当前用户信息
   */
  me: () => apiClient.get('/auth/me'),

  /**
   * 修改密码
   * @param {{ oldPassword: string; newPassword: string }} data - 密码修改信息，包含旧密码和新密码
   * @returns {Promise<any>} 密码修改响应
   */
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data)
};
