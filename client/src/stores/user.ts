// @ts-nocheck
import { defineStore } from 'pinia';
import type { User } from '@/types';
import { ElMessage } from 'element-plus';
import { authApi } from '@/api';

// 认证绕过模式标志（从后端响应头同步）
let bypassAuthMode = false;

/**
 * 设置认证绕过模式
 * @param {boolean} enabled - 是否启用认证绕过
 * @returns {void}
 */
export function setBypassAuthMode(enabled: boolean) {
  bypassAuthMode = enabled;
}

/**
 * 用户状态管理
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null as User | null,
    token: '' as string,
    refreshToken: '' as string,
    permissions: [] as string[],
    roles: [] as string[],
    loginLoading: false
  }),

  getters: {
    // 统一认证判断：后端 BYPASS_AUTH 或本地有 token
    isLoggedIn: (state) => {
      // 优先检查后端认证绕过模式
      if (bypassAuthMode) {
        return true;
      }
      // 兼容前端的 VITE_SKIP_AUTH 环境变量
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
      if (skipAuth) {
        return true;
      }
      return !!state.token && !!state.userInfo;
    },
    hasPermission: (state) => (permission: string) =>
      state.permissions.includes(permission) || state.permissions.includes('*'),
    hasRole: (state) => (role: string) => state.roles.includes(role),
    displayName: (state) =>
      state.userInfo?.nickname || state.userInfo?.username || '未知用户'
  },

  actions: {
    /**
     * 设置模拟用户（认证绕过模式下使用）
     * @returns {void}
     */
    setMockUser() {
      const mockUser: User = {
        id: '1',
        username: 'test_admin',
        nickname: '测试超级管理员',
        email: 'test@admin.com',
        avatar: '',
        permissions: ['*'],
        roles: ['超级管理员'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.userInfo = mockUser;
      this.token = 'bypass_token';
      this.permissions = ['*'];
      this.roles = ['超级管理员'];
      console.log('[用户Store] 已设置模拟用户（认证绕过模式）');
    },

    /**
     * 用户登录
     * @param {{ username: string; password: string }} credentials - 登录凭证，包含用户名和密码
     * @returns {Promise<void>}
     * @throws {Error} 登录失败时抛出错误
     */
    async login(credentials: { username: string; password: string }) {
      this.loginLoading = true;

      try {
        // 调用登录接口
        const response = await authApi.login(credentials);

        if (response.status === 'success') {
          // 保存登录状态
          this.token = response.datum.accessToken;
          this.refreshToken = response.datum.refreshToken || '';
          this.userInfo = {
            id: String(response.datum.user.id),
            username: response.datum.user.username,
            nickname: response.datum.user.realName || response.datum.user.username,
            email: response.datum.user.email || '',
            avatar: '',
            permissions: response.datum.user.permissions || [],
            roles: [response.datum.user.roleName || 'user'],
            status: response.datum.user.status === 1 ? 'active' : 'inactive',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.permissions = response.datum.user.permissions || [];
          this.roles = [response.datum.user.roleName || 'user'];

          ElMessage.success('登录成功');
        } else {
          console.error('[状态管理] 登录失败:', response.message);
          throw new Error(response.message || '登录失败');
        }
      } finally {
        this.loginLoading = false;
      }
    },

    /**
     * 用户登出
     * @returns {Promise<void>}
     */
    async logout() {
      console.log('[用户Store] 开始登出流程:', {
        isLoggedIn: this.isLoggedIn,
        hasToken: !!this.token,
        hasUserInfo: !!this.userInfo,
        time: new Date().toLocaleTimeString()
      });

      try {
        console.log('[用户Store] 调用登出接口...');
        await authApi.logout();
        console.log('[用户Store] 登出接口调用成功');
      } catch (error) {
        console.warn('[用户Store] 登出接口调用失败:', error);
      }

      console.log('[用户Store] 清除本地状态...');
      this.token = '';
      this.refreshToken = '';
      this.userInfo = null;
      this.permissions = [];
      this.roles = [];

      console.log('[用户Store] 状态清除完成:', {
        isLoggedIn: this.isLoggedIn,
        hasToken: !!this.token,
        hasUserInfo: !!this.userInfo
      });

      ElMessage.info('已登出');
      console.log('[用户Store] 登出流程完成');
    },

    /**
     * 刷新访问令牌
     * @returns {Promise<string>} 新的访问令牌
     * @throws {Error} 无刷新令牌或刷新失败时抛出错误
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('无刷新令牌');
      }

      const response = await authApi.refresh({ refreshToken: this.refreshToken });
      if (response.status === 'success') {
        this.token = response.datum.accessToken;
        return response.datum.accessToken;
      } else {
        console.error('[状态管理] 刷新令牌失败:', response.message);
        this.logout();
        throw new Error(response.message || '刷新令牌失败');
      }
    },

    /**
     * 获取用户信息
     * @returns {Promise<void>}
     * @throws {Error} 获取用户信息失败时抛出错误
     */
    async fetchUserInfo() {
      const response = await authApi.me();
      if (response.status === 'success') {
        this.userInfo = {
          id: String(response.datum.id),
          username: response.datum.username,
          nickname: response.datum.realName || response.datum.username,
          email: response.datum.email || '',
          avatar: '',
          permissions: response.datum.permissions || [],
          roles: [response.datum.roleName || 'user'],
          status: response.datum.status === 1 ? 'active' : 'inactive',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.permissions = response.datum.permissions || [];
        this.roles = [response.datum.roleName || 'user'];
      } else {
        console.error('[状态管理] 获取用户信息失败:', response.message);
        throw new Error(response.message || '获取用户信息失败');
      }
    },

    /**
     * 更新用户信息
     * @param {Partial<User>} newUserInfo - 新的用户信息对象
     * @returns {void}
     */
    updateUserInfo(newUserInfo: Partial<User>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...newUserInfo };
      }
    },

    /**
     * 更新用户权限列表
     * @param {string[]} newPermissions - 新的权限列表
     * @returns {void}
     */
    updatePermissions(newPermissions: string[]) {
      this.permissions = newPermissions;
    }
  },

  persist: {
    key: 'user-store',
    pick: ['token', 'refreshToken', 'userInfo', 'permissions', 'roles']
  }
});
