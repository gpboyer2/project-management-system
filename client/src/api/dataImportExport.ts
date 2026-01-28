import { apiClient } from './index';

interface ExportPreviewResponse {
  status: string;
  message: string;
  datum: {
    hierarchy?: { count: number; tree: any[] };
    protocols?: { count: number; tree: any[] };
  };
}

interface ExportResponse {
  status: string;
  message: string;
  datum: {
    download_url: string;
    file_name: string;
  };
}

interface ImportResponse {
  status: string;
  message: string;
  datum: {
    hierarchy?: { created: number; updated: number };
    protocols?: { created: number; updated: number };
  };
}

// 导出数据参数
interface ExportDataParams {
  hierarchy?: string[];
  protocols?: string[];
}

/**
 * 获取导出预览数据
 * @returns {Promise<AxiosResponse<ExportPreviewResponse>>} 返回包含导出预览数据的响应
 */
export const getExportPreview = () =>
  apiClient.get<ExportPreviewResponse>('/ide/export/preview');

/**
 * 导出数据（支持精细化导出）
 * @param {ExportDataParams} params - 导出参数，包含 hierarchy 和 protocols 数组
 * @returns {Promise<AxiosResponse<ExportResponse>>} 返回包含下载链接和文件名的响应
 */
export const exportData = (params: ExportDataParams) =>
  apiClient.post<ExportResponse>('/ide/export', { module_list: params });

/**
 * 导入数据
 * @param {File} file - 要导入的文件
 * @param {string} strategy - 导入策略
 * @returns {Promise<AxiosResponse<ImportResponse>>} 返回包含导入统计数据的响应
 */
export const importData = (file: File, strategy: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('strategy', strategy);
  return apiClient.post<ImportResponse>('/ide/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
