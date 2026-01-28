import { apiClient } from './index';

// 构建选项类型
export interface BuildOptions {
  cppSdk?: boolean
  icdDoc?: boolean
  testData?: boolean
  language?: 'cpp11' | 'cpp14' | 'cpp17' | 'cpp20' | 'python'
  // 兼容历史值：linux-x64 与 linux-x86_64 视为同一平台含义
  platform?: 'linux-x64' | 'linux-x86_64' | 'linux-arm64' | 'windows-x64' | 'qnx' | 'vxworks'
}

// 构建请求类型
export interface BuildRequest {
  contextType: 'hierarchy_node' | 'packet_message' | 'packet_category'
  contextId: string
  contextName?: string
  options?: BuildOptions
}

export interface BuildResultSummary {
  total: number
  successCount: number
  failedCount: number
}

// 构建任务 DTO（后端返回）
export interface BuildTaskDto {
  taskId: string
  version: string
  status: 'queued' | 'running' | 'completed' | 'partial_completed' | 'failed' | 'cancelled'
  progress: number
  contextType: string
  contextId: string
  contextName?: string
  options?: BuildOptions
  createdAt: number
  startedAt?: number
  finishedAt?: number
  downloadable: boolean
  downloadUrl?: string
  errorMessage?: string
  resultSummary?: BuildResultSummary
}

// 构建历史响应类型
export interface BuildHistoryResponse {
  list: BuildTaskDto[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

/**
 * 从 localStorage 获取用户 token
 * @returns {string} 返回 token 字符串，未找到或解析失败时返回空字符串
 */
function getTokenFromLocalStorage(): string {
  const persistedData = localStorage.getItem('user-store');
  if (!persistedData) return '';
  try {
    const parsed = JSON.parse(persistedData);
    return typeof parsed.token === 'string' ? parsed.token : '';
  } catch {
    return '';
  }
}

/**
 * 从 Content-Disposition 响应头中解析文件名
 * @param {string | null} contentDisposition - Content-Disposition 响应头的值
 * @returns {string | undefined} 返回解析后的文件名，解析失败时返回 undefined
 */
function parseContentDispositionFilename(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) return undefined;

  // RFC 5987: filename*=UTF-8''....
  const filenameStarMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (filenameStarMatch && filenameStarMatch[1]) {
    const raw = filenameStarMatch[1].trim().replace(/^"|"$/g, '');
    const parts = raw.split("''");
    const encoded = parts.length === 2 ? parts[1] : raw;
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }

  const filenameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (filenameMatch && filenameMatch[1]) {
    const raw = filenameMatch[1].trim().replace(/^"|"$/g, '');
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return undefined;
}

/**
 * 使用认证 token 下载文件
 * @param {string} url - 下载 URL
 * @returns {Promise<void>} 返回 Promise，下载成功后 resolve，失败时 reject
 * @throws {Error} 下载失败或 HTTP 状态码非 200 时抛出错误
 */
async function downloadWithAuth(url: string) {
  const token = getTokenFromLocalStorage();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    // 尝试解析后端 apiError 的 message
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      const msg = parsed && typeof parsed.message === 'string' ? parsed.message : text;
      throw new Error(msg || `下载失败（HTTP ${response.status}）`);
    } catch {
      throw new Error(text || `下载失败（HTTP ${response.status}）`);
    }
  }

  const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition')) || 'build_artifact.zip';
  const blob = await response.blob();

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

// 构建 API
export const buildApi = {
  /**
   * 创建构建任务
   * @param {BuildRequest} data - 构建请求数据
   * @returns {Promise} 返回创建任务后的响应
   */
  start: (data: BuildRequest) =>
    apiClient.post('/build/tasks', data),

  /**
   * 查询任务详情
   * @param {string} taskId - 任务 ID
   * @returns {Promise<BuildTaskDto>} 返回任务详情
   */
  getStatus: (taskId: string) =>
    apiClient.get(`/build/tasks/${taskId}`),

  /**
   * 获取构建历史
   * @param {{ contextType?: string; contextId?: string; limit?: number; offset?: number }} params - 查询参数
   * @returns {Promise<BuildHistoryResponse>} 返回构建历史列表和分页信息
   */
  getHistory: (params?: {
    contextType?: string
    contextId?: string
    limit?: number
    offset?: number
  }) =>
    apiClient.get('/build/tasks', { params }),

  /**
   * 下载构建产物
   * @param {string} taskId - 任务 ID
   * @returns {Promise<void>} 返回 Promise，下载成功后 resolve
   */
  download: (taskId: string): Promise<void> => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    const url = `${apiBase}/build/tasks/${taskId}/download`;
    return downloadWithAuth(url);
  },

  /**
   * 取消构建
   * @param {string} taskId - 任务 ID
   * @returns {Promise} 返回取消操作后的响应
   */
  cancel: (taskId: string) =>
    apiClient.post(`/build/tasks/${taskId}/cancel`)
};
