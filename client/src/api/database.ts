/**
 * 数据库管理 API
 */
import { apiClient } from './index';

// 表结构信息
export interface TableColumn {
  name: string
  type: string
  notNull: boolean
  defaultValue: string | null
  primaryKey: boolean
}

export interface TableSchema {
  tableName: string
  columns: TableColumn[]
  rowCount: number
}

// 查询参数
export interface QueryParams {
  tableName: string
  current_page?: number
  page_size?: number
  keyword?: string
  orderBy?: string
  orderDir?: 'ASC' | 'DESC'
}

// 查询结果
export interface QueryResult {
  list: Record<string, any>[]
  columns: string[]
  pagination: {
    current_page: number
    page_size: number
    total: number
  }
}

export const databaseApi = {
  /**
   * 获取数据库表列表
   * @returns {Promise<{ list: string[], pagination: any }>} 返回表名数组和分页信息
   */
  getTableList: () => apiClient.get<{ list: string[], pagination: any }>('/database/tables'),

  /**
   * 获取指定表的结构信息
   * @param {string} tableName - 表名
   * @returns {Promise<TableSchema>} 返回表结构信息，包含字段定义和行数
   */
  getTableSchema: (tableName: string) => apiClient.get<TableSchema>('/database/schema', { tableName }),

  /**
   * 查询表数据（支持分页、关键词搜索和排序）
   * @param {QueryParams} params - 查询参数，包含表名、分页信息、关键词和排序
   * @returns {Promise<QueryResult>} 返回查询结果列表、列名和分页信息
   */
  queryData: (params: QueryParams) => apiClient.post<QueryResult>('/database/query', params),

  /**
   * 向指定表批量新增数据
   * @param {string} tableName - 表名
   * @param {Record<string, any>[]} data - 要插入的数据记录数组
   * @returns {Promise<any>} 返回操作结果
   */
  createData: (tableName: string, data: Record<string, any>[]) =>
    apiClient.post('/database/create', { tableName, data }),

  /**
   * 批量更新指定表的数据
   * @param {string} tableName - 表名
   * @param {string} primaryKey - 主键字段名
   * @param {Record<string, any>[]} data - 要更新的数据记录数组
   * @returns {Promise<any>} 返回操作结果
   */
  updateData: (tableName: string, primaryKey: string, data: Record<string, any>[]) =>
    apiClient.post('/database/update', { tableName, primaryKey, data }),

  /**
   * 批量删除指定表的数据
   * @param {string} tableName - 表名
   * @param {string} primaryKey - 主键字段名
   * @param {(string | number)[]} data - 要删除的主键值数组
   * @returns {Promise<any>} 返回操作结果
   */
  deleteData: (tableName: string, primaryKey: string, data: (string | number)[]) =>
    apiClient.post('/database/delete', { tableName, primaryKey, data }),

  /**
   * 执行自定义 SQL 查询语句
   * @param {string} sql - SQL 查询语句
   * @returns {Promise<QueryResult>} 返回查询结果列表、列名和分页信息
   */
  executeQuery: (sql: string) => apiClient.post<QueryResult>('/database/execute', { sql })
};
