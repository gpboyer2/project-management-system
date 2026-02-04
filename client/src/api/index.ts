/**
 * API层统一入口
 * 基于2025年现代前端架构最佳实践
 * 采用Axios拦截器、请求缓存、错误重试等机制
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ElMessageBox } from 'element-plus';
import { useUserStore, setBypassAuthMode } from '@/stores';
import { showLoading, hideLoading, envUtils } from '@/utils';
import router from '@/router';
import RequestLogger from '@/utils/request-logger';
import dayjs from 'dayjs';

/**
 * 获取 API 基础地址
 * @returns {string} API 基础地址
 */
const getApiBaseUrl = (): string => {
  return envUtils.getRuntimeEnv('VITE_API_BASE_URL');
};

// API响应类型定义
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error' | 'canceled'
  datum: T
  message: string
}

// 扩展 Axios 请求配置，添加追踪字段
interface TrackedAxiosRequestConfig extends InternalAxiosRequestConfig {
  requestId?: number;
  startTime?: number;
}

// 请求配置类型
export interface RequestConfig extends AxiosRequestConfig {
  loading?: boolean
  cache?: boolean
  retry?: number
  retryDelay?: number
}

// API错误类
export class ApiError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

// 令牌刷新订阅者类型（支持成功和失败）
type TokenRefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};

/**
 * API客户端类
 * 封装统一的请求处理、错误处理、缓存机制
 */
class ApiClient {
  private instance: AxiosInstance;
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private isRefreshing = false;
  private refreshSubscribers: TokenRefreshSubscriber[] = [];
  // 防止多个接口同时报错时重复弹出登录提示
  private static isShowingLoginAlert = false;
  // 认证绕过模式标志（由后端 BYPASS_AUTH 控制）
  private static bypassAuthMode = false;
  // 页面可见性变化时重置弹窗标志
  private static handleVisibilityChange = () => {
    if (document.hidden && ApiClient.isShowingLoginAlert) {
      console.log('[API] 页面隐藏，重置登录弹窗标志');
      ApiClient.isShowingLoginAlert = false;
    }
  };
  // 最大并发重试数，防止重试风暴
  private static activeRetryCount = 0;
  private static readonly MAX_CONCURRENT_RETRIES = 3;

  constructor() {
    this.instance = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupGlobalEventListeners();
  }

  /**
   * 设置全局事件监听器
   * @returns {void}
   */
  private setupGlobalEventListeners(): void {
    // 监听页面可见性变化，重置弹窗标志
    document.addEventListener('visibilitychange', ApiClient.handleVisibilityChange);

    // 监听页面卸载，清理资源
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * 清理资源
   * @returns {void}
   */
  private cleanup(): void {
    // 清理缓存
    this.cache.clear();
  }

  /**
   * 设置请求和响应拦截器
   * @returns {void}
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: TrackedAxiosRequestConfig) => {
        // 确保 POST/PUT 请求的数组/对象 data 使用 application/json（FormData 除外）
        if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '') &&
            (Array.isArray(config.data) || (typeof config.data === 'object' && config.data !== null && !(config.data instanceof FormData)))) {
          config.headers['Content-Type'] = 'application/json';
        }

        // 添加认证token - 优先从 userStore 获取，如果为空则尝试直接从 localStorage 读取
        const userStore = useUserStore();
        let token = userStore.token;

        // 页面刷新时，Pinia store 可能还未从 localStorage 恢复，直接读取
        if (!token) {
          const persistedData = localStorage.getItem('user-store');
          if (persistedData) {
            try {
              const parsed = JSON.parse(persistedData);
              token = parsed.token || '';
              // 从 localStorage 读取到 token 后，同步到 userStore
              if (token) {
                userStore.token = token;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId();

        // 添加时间戳防止缓存（仅在非缓存模式下）
        if (config.method?.toLowerCase() === 'get' && !(config as any).cache !== true) {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        // 记录请求开始日志
        const requestId = RequestLogger.logStart(
          config.method?.toUpperCase() || 'UNKNOWN',
          config.url || '',
          config.params,
          config.data
        );

        // 存储请求ID和开始时间到config中，供响应拦截器使用
        config.requestId = requestId;
        config.startTime = Date.now();

        return config;
      },
      (error) => {
        console.error('[API] 请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 直接返回 data，由调用方通过 status 判断成功/失败
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const config = response.config as TrackedAxiosRequestConfig;
        const { data, headers } = response;

        // 检测后端认证绕过模式（统一配置入口）
        // 当后端 BYPASS_AUTH=true 时，所有响应都会携带 X-Bypass-Auth: true
        const bypassAuth = headers['x-bypass-auth'] === 'true';
        if (bypassAuth && !ApiClient.bypassAuthMode) {
          console.log('[API] 检测到后端认证绕过模式，自动启用前端免登录');
          ApiClient.bypassAuthMode = true;
          // 同步 user store 的 bypassAuthMode 状态
          setBypassAuthMode(true);
          // 自动设置模拟用户状态
          const userStore = useUserStore();
          if (!userStore.token) {
            userStore.setMockUser();
          }
        }

        // 记录日志
        if (config.requestId && config.startTime) {
          if (data.status === 'success') {
            RequestLogger.logSuccess(config.requestId, data, config.startTime);
          } else {
            RequestLogger.logError(config.requestId, new ApiError(data.message || '请求失败', 0, data.datum), config.startTime);
          }
        }

        // 认证绕过模式下，忽略无效令牌错误
        if (ApiClient.bypassAuthMode && data.status === 'error' && data.message?.includes('无效的访问令牌')) {
          return data as any;
        }

        // 检查后端返回的业务错误状态 - 处理无效令牌
        if (data.status === 'error' && data.message?.includes('无效的访问令牌')) {
          return this.handle401Error(new ApiError(data.message, 401), config);
        }

        // 返回 ApiResponse 对象供调用方使用
        return data as any;
      },
      async (error) => {
        const config = error.config as TrackedAxiosRequestConfig;

        // 记录错误日志
        if (config?.requestId && config?.startTime) {
          RequestLogger.logError(config.requestId, error, config.startTime);
        }

        // 处理网络错误
        if (!error.response) {
          throw new ApiError('网络连接失败，请检查网络设置', -1);
        }

        const { status, data } = error.response;

        // 处理认证失败 - 尝试刷新令牌
        if (status === 401 || (data?.message?.includes('无效的访问令牌'))) {
          return this.handle401Error(error, config);
        }

        // 处理服务端错误（兼容 message 和 error 两种格式）
        const message = data?.message || data?.error || this.getErrorMessage(status);
        throw new ApiError(message, status, data?.data);
      }
    );
  }

  /**
   * 生成请求唯一标识
   * @returns {string} 请求唯一标识
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成请求键用于缓存和去重
   * 排除时间戳参数，确保相同请求的 key 一致
   * @param {AxiosRequestConfig} config - Axios 请求配置
   * @returns {string} 请求键
   */
  private getRequestKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;

    // 排除 _t 参数用于缓存 key 计算
    const paramsForKey = params ? { ...params } : params;
    if (paramsForKey && '_t' in paramsForKey) {
      delete paramsForKey._t;
    }

    return `${method}-${url}-${JSON.stringify(paramsForKey)}-${JSON.stringify(data)}`;
  }

  /**
   * 获取状态码对应的错误信息
   * @param {number} status - HTTP 状态码
   * @returns {string} 错误信息
   */
  private getErrorMessage(status: number): string {
    const statusMessages: Record<number, string> = {
      400: '请求参数错误',
      403: '访问被拒绝',
      404: '请求的资源不存在',
      405: '请求方法不被允许',
      408: '请求超时',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
      504: '网关超时',
    };
    return statusMessages[status] || `请求失败 (${status})`;
  }

  /**
   * 检查缓存
   * @param {string} key - 缓存键
   * @param {number} [ttl] - 缓存过期时间（毫秒）
   * @returns {unknown | null} 缓存数据，如果过期或不存在则返回 null
   */
  private checkCache(key: string, ttl?: number): unknown | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < (cached.ttl || ttl || 300000)) {
      return cached.data;
    }
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {unknown} data - 要缓存的数据
   * @param {number} [ttl=300000] - 缓存过期时间（毫秒），默认 5 分钟
   * @returns {void}
   */
  private setCache(key: string, data: unknown, ttl = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 刷新访问令牌
   * @returns {Promise<string>} 新的访问令牌
   * @throws {Error} 当刷新令牌不存在或刷新失败时抛出错误
   */
  private async refreshAccessToken(): Promise<string> {
    const userStore = useUserStore();

    if (!userStore.refreshToken) {
      throw new Error('无刷新令牌');
    }

    // 使用 axios 直接请求，绕过响应拦截器避免死循环
    const response = await axios.post<ApiResponse>(
      getApiBaseUrl() + '/auth/refresh',
      { refreshToken: userStore.refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response.data;
    if (data.status === 'success' && data.datum?.accessToken) {
      const newToken = data.datum.accessToken;
      userStore.token = newToken;
      return newToken;
    }

    throw new Error('令牌刷新失败');
  }

  /**
   * 订阅令牌刷新完成事件
   * 返回 Promise，支持成功和失败
   * @returns {Promise<string>} 返回新令牌的 Promise
   */
  private subscribeTokenRefresh(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.refreshSubscribers.push({ resolve, reject });
    });
  }

  /**
   * 通知所有订阅者令牌已刷新成功
   * @param {string} token - 新的访问令牌
   * @returns {void}
   */
  private onTokenRefreshed(token: string): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.resolve(token));
    this.refreshSubscribers = [];
  }

  /**
   * 通知所有订阅者令牌刷新失败
   * @param {any} error - 刷新失败的错误信息
   * @returns {void}
   */
  private onTokenRefreshFailed(error: any): void {
    this.refreshSubscribers.forEach(subscriber => subscriber.reject(error));
    this.refreshSubscribers = [];
  }

  /**
   * 处理401认证失败
   * @param {any} _error - 错误对象
   * @param {TrackedAxiosRequestConfig} config - 原始请求配置
   * @returns {Promise<any>} 重新请求的结果
   */
  private async handle401Error(_error: any, config: TrackedAxiosRequestConfig): Promise<any> {
    const userStore = useUserStore();

    // 如果没有刷新令牌，直接跳转登录
    if (!userStore.refreshToken) {
      this.clearAuthAndRedirect();
      throw new ApiError('认证失败', 401);
    }

    // 如果正在刷新令牌，等待刷新完成
    if (this.isRefreshing) {
      try {
        const newToken = await this.subscribeTokenRefresh();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
        return this.instance(config);
      } catch (error) {
        // 刷新失败，拒绝当前请求
        throw new ApiError('认证失败', 401);
      }
    }

    // 开始刷新令牌
    this.isRefreshing = true;

    try {
      const newToken = await this.refreshAccessToken();
      this.isRefreshing = false;
      this.onTokenRefreshed(newToken);

      // 重试原请求
      if (config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      return this.instance(config);
    } catch (refreshError) {
      this.isRefreshing = false;
      // 修复 P0-1: 通知所有订阅者刷新失败，拒绝它们的 Promise
      this.onTokenRefreshFailed(refreshError);
      this.clearAuthAndRedirect();
      throw new ApiError('认证失败', 401);
    }
  }

  /**
   * 清除认证状态并跳转登录
   * 修复 P0-2: 添加多种方式重置弹窗标志
   * @returns {void}
   */
  private clearAuthAndRedirect(): void {
    // 防止多个接口同时报错时重复弹出登录提示
    if (ApiClient.isShowingLoginAlert) {
      return;
    }
    ApiClient.isShowingLoginAlert = true;

    const userStore = useUserStore();
    userStore.token = '';
    userStore.refreshToken = '';
    userStore.userInfo = null;
    userStore.permissions = [];
    userStore.roles = [];

    // 使用 alert 而不是 MessageBox，确保用户能看到
    const alertMessage = '登录已过期，请重新登录';

    // 使用 MessageBox 但添加超时自动重置
    let messageBoxClosed = false;

    const resetFlag = () => {
      if (!messageBoxClosed) {
        messageBoxClosed = true;
        ApiClient.isShowingLoginAlert = false;
      }
    };

    // 5 秒后自动重置标志（防止用户不操作）
    setTimeout(resetFlag, 5000);

    ElMessageBox.alert(alertMessage, '提示', {
      confirmButtonText: '确定',
      showClose: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      callback: () => {
        resetFlag();
        router.push('/login');
      }
    }).catch(() => {
      // 用户点击关闭按钮或 ESC
      resetFlag();
    });
  }

  /**
   * 通用请求方法
   * 调用方通过 response.status 判断成功/失败，通过 response.datum 获取业务数据
   * @template T - 响应数据类型
   * @param {RequestConfig} config - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { loading = true, cache = false, retry = 0, retryDelay = 1000, ...axiosConfig } = config;

    // 检查缓存
    if (cache && axiosConfig.method?.toLowerCase() === 'get') {
      const cacheKey = this.getRequestKey(axiosConfig);
      const cachedData = this.checkCache(cacheKey);
      if (cachedData) {
        const timestamp = dayjs().format('HH:mm:ss.SSS');
        console.log(
          `%c[${timestamp}] %c[缓存命中]`,
          'color: #999',
          'color: #ff9900; font-weight: bold',
          axiosConfig.url
        );
        // 缓存返回成功的响应
        return { status: 'success', message: '操作成功', datum: cachedData as T };
      }
    }

    // 显示加载状态
    let loadingId: string | undefined;
    if (loading) {
      loadingId = showLoading('请求中...');
    }

    try {
      // 响应拦截器已将 AxiosResponse 转换为 ApiResponse
      const response = await this.instance.request<ApiResponse<T>>(axiosConfig) as unknown as ApiResponse<T>;

      // 设置缓存（缓存 datum 部分，排除 _t 参数的 key）
      if (cache && axiosConfig.method?.toLowerCase() === 'get' && response.status === 'success') {
        const cacheKey = this.getRequestKey(axiosConfig);
        this.setCache(cacheKey, response.datum);
      }

      // 返回完整的 ApiResponse 对象，让调用方通过 status 判断成功/失败
      return response;
    } catch (error) {
      // 错误重试机制（修复 P2-8: 添加并发限制防止重试风暴）
      if (retry > 0 && this.shouldRetry(error) && ApiClient.activeRetryCount < ApiClient.MAX_CONCURRENT_RETRIES) {
        ApiClient.activeRetryCount++;
        const timestamp = dayjs().format('HH:mm:ss.SSS');
        console.log(
          `%c[${timestamp}] %c[重试]`,
          'color: #999',
          'color: #ff6600; font-weight: bold',
          `${retryDelay}ms后重试，剩余重试次数: ${retry}，当前并发重试: ${ApiClient.activeRetryCount}`
        );
        try {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          const result = await this.request({ ...config, retry: retry - 1, retryDelay: retryDelay * 2 });
          return result;
        } finally {
          ApiClient.activeRetryCount--;
        }
      }

      throw error;
    } finally {
      if (loadingId) {
        hideLoading(loadingId);
      }
    }
  }

  /**
   * 判断是否应该重试
   * @param {unknown} error - 错误对象
   * @returns {boolean} 是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof ApiError) {
      // 网络错误或5xx服务器错误才重试
      return error.code === -1 || (error.code >= 500 && error.code < 600);
    }
    return false;
  }

  /**
   * GET请求
   * @template T - 响应数据类型
   * @param {string} url - 请求地址
   * @param {Record<string, unknown>} [params] - 查询参数
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  get<T = unknown>(url: string, params?: Record<string, unknown>, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url, params });
  }

  /**
   * POST请求
   * 注意：data 参数会直接作为请求体发送，确保使用 application/json
   * @template T - 响应数据类型
   * @param {string} url - 请求地址
   * @param {unknown} [data] - 请求体数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  post<T = unknown>(url: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT请求
   * @template T - 响应数据类型
   * @param {string} url - 请求地址
   * @param {unknown} [data] - 请求体数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  put<T = unknown>(url: string, data?: unknown, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE请求
   * @template T - 响应数据类型
   * @param {string} url - 请求地址
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  delete<T = unknown>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * 文件上传
   * @template T - 响应数据类型
   * @param {string} url - 请求地址
   * @param {FormData} formData - 表单数据
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<ApiResponse<T>>} API 响应
   */
  upload<T = unknown>(url: string, formData: FormData, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 上传超时时间更长
    });
  }

  /**
   * 文件下载
   * @param {string} url - 请求地址
   * @param {string} [filename] - 下载文件名
   * @param {RequestConfig} [config={}] - 请求配置
   * @returns {Promise<void>}
   */
  async download(url: string, filename?: string, config: RequestConfig = {}): Promise<void> {
    const response = await this.instance.request({
      ...config,
      method: 'GET',
      url,
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 清除缓存
   * @returns {void}
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    const timestamp = dayjs().format('HH:mm:ss.SSS');
    console.log(
      `%c[${timestamp}] %c[缓存清除]`,
      'color: #999',
      'color: #ff9900; font-weight: bold',
      `已清除 ${size} 条缓存`
    );
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient();

// 导出常用方法
export const { get, post, put, delete: del, upload, download } = apiClient;

// 导出类型
export type { AxiosRequestConfig, AxiosResponse };

// ==================== 业务 API ====================

/**
 * 报文配置 API（保留在 index.ts）
 */
export const packetApi = {
  /**
   * 获取报文列表
   * @param {Object} params - 查询参数
   * @param {number} [params.current_page] - 当前页码
   * @param {number} [params.page_size] - 每页数量
   * @param {string} [params.keyword] - 搜索关键字
   * @param {string} [params.hierarchy_node_id] - 层级节点 ID
   * @param {string} [params.protocol] - 协议类型
   * @param {number} [params.status] - 状态
   * @returns {Promise<ApiResponse>} API 响应
   */
  getPackets: (params: {
    current_page?: number;
    page_size?: number;
    keyword?: string;
    hierarchy_node_id?: string;
    protocol?: string;
    status?: number;
  }) => apiClient.get('/packet-messages/list', params),

  /**
   * 获取报文详情
   * @param {number | string} id - 报文 ID
   * @returns {Promise<ApiResponse>} API 响应
   */
  getPacketById: (id: number | string) => apiClient.get(`/packet-messages/${id}`),

  /**
   * 创建报文
   * @param {Object} data - 报文数据
   * @param {string} data.name - 报文名称
   * @param {string} [data.description] - 报文描述
   * @param {string} [data.hierarchy_node_id] - 层级节点 ID
   * @param {string} [data.protocol] - 协议类型
   * @param {number} [data.status] - 状态
   * @returns {Promise<ApiResponse>} API 响应
   */
  createPacket: (data: {
    name: string;
    description?: string;
    hierarchy_node_id?: string;
    protocol?: string;
    status?: number;
  }) => apiClient.post('/packet-messages/create', data),

  /**
   * 更新报文
   * @param {number | string} id - 报文 ID
   * @param {Object} data - 更新数据
   * @param {string} [data.name] - 报文名称
   * @param {string} [data.description] - 报文描述
   * @param {string} [data.hierarchy_node_id] - 层级节点 ID
   * @param {string} [data.protocol] - 协议类型
   * @param {number} [data.status] - 状态
   * @returns {Promise<ApiResponse>} API 响应
   */
  updatePacket: (id: number | string, data: {
    name?: string;
    description?: string;
    hierarchy_node_id?: string;
    protocol?: string;
    status?: number;
  }) => apiClient.post('/packet-messages/update', Object.assign({ id }, data)),

  /**
   * 删除报文
   * @param {number | string} id - 报文 ID
   * @returns {Promise<ApiResponse>} API 响应
   */
  deletePacket: (id: number | string) => apiClient.post('/packet-messages/delete', { ids: [id] }),

  /**
   * 复制报文
   * @param {number | string} id - 报文 ID
   * @param {Object} data - 复制数据
   * @param {string} data.name - 新报文名称
   * @returns {Promise<ApiResponse>} API 响应
   */
  duplicatePacket: (id: number | string, data: { name: string }) => apiClient.post(`/packet-messages/${id}/duplicate`, data)
};

// 业务 API 重新导出
export { authApi } from './auth';
export { flowchartApi } from './flowchart';
export { hierarchyApi } from './hierarchy';
export { systemLevelDesignTreeApi } from './system-level-design-tree';
export { topologyApi } from './topology';
export { userApi } from './user';
export { databaseApi } from './database';
export { buildApi } from './build';
export { projectApi } from './project';
export { requirementApi } from './requirement';
export { taskApi } from './task';
export { reviewApi } from './review';
export { processNodeTypeApi } from './process-node-type';
export { requirementTypeApi } from './requirement-type';
export { requirementStatusApi } from './requirement-status';
