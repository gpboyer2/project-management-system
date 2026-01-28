import { apiClient } from './index';

/**
 * 获取报文分类列表（平铺结构）
 * @returns {Promise<any>} 返回报文分类列表数据
 */
export const getCategoryList = () =>
  apiClient.get('/packet-message-categories/list');

/**
 * 获取报文分类树（包含报文，用于资源管理器展示）
 * @returns {Promise<any>} 返回报文分类树数据
 */
export const getCategoryTree = () =>
  apiClient.get('/packet-message-categories/tree');

/**
 * 获取分类详情
 * @param {string} id - 分类ID
 * @returns {Promise<any>} 返回分类详情数据
 */
export const getCategoryDetail = (id: string) =>
  apiClient.get('/packet-message-categories/detail', { id });

/**
 * 创建分类（支持批量）
 * @param {any} data - 分类数据
 * @returns {Promise<any>} 返回创建结果
 */
export const createCategory = (data: any) =>
  apiClient.post('/packet-message-categories/create', data);

/**
 * 更新分类（支持批量）
 * @param {any} data - 分类数据
 * @returns {Promise<any>} 返回更新结果
 */
export const updateCategory = (data: any) =>
  apiClient.put('/packet-message-categories/update', data);

/**
 * 删除分类（支持批量）
 * @param {string[]} id_list - 分类ID列表
 * @returns {Promise<any>} 返回删除结果
 */
export const deleteCategory = (id_list: string[]) =>
  apiClient.post('/packet-message-categories/delete', { ids: id_list });

