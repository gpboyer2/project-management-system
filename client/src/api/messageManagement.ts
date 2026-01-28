
import { apiClient } from './index';

/**
 * 获取报文列表
 * @param {Object} params - 查询参数
 * @param {number} params.current_page - 当前页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.keyword - 关键字搜索
 * @param {string} params.hierarchy_node_id - 层级节点ID
 * @param {string} params.protocol - 协议类型
 * @param {string} params.status - 状态
 * @param {string} params.category_id - 分类ID
 * @returns {Promise} 返回报文列表数据
 */
export const getMessageList = (params?: {
  current_page?: number
  page_size?: number
  keyword?: string
  hierarchy_node_id?: string
  protocol?: string
  status?: string
  category_id?: string
}) =>
  apiClient.get('/packet-messages/list', params);

/**
 * 获取管理端报文列表（包含草稿 + 最新已发布）
 * @param {Object} params - 查询参数
 * @param {number} params.current_page - 当前页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.keyword - 关键字搜索
 * @param {string} params.hierarchy_node_id - 层级节点ID
 * @param {string} params.protocol - 协议类型
 * @param {string} params.status - 状态
 * @param {string} params.category_id - 分类ID
 * @returns {Promise} 返回报文管理列表数据
 */
export const getMessageManageList = (params?: {
  current_page?: number
  page_size?: number
  keyword?: string
  hierarchy_node_id?: string
  protocol?: string
  status?: string
  category_id?: string
}) =>
  apiClient.get('/packet-messages/manage/list', params);

/**
 * 获取报文详情
 * @param {number | string} id - 报文ID
 * @returns {Promise} 返回报文详情数据
 */
export const getMessageDetail = (id: number | string) => apiClient.get('/packet-messages/detail', { id });

/**
 * 获取已发布的指定版本报文详情（按 packet_messages.id）
 * @param {number | string} id - 报文ID
 * @returns {Promise} 返回已发布的报文详情数据
 */
export const getMessagePublishedDetail = (id: number | string) => apiClient.get('/packet-messages/published', { id });

// ==================== 版本系统：草稿/发布/历史 ====================

/**
 * 创建草稿（未发布修订）
 * @param {any} data - 草稿数据
 * @returns {Promise} 返回创建的草稿数据
 */
export const postMessageDraftCreate = (data: any) =>
  apiClient.post('/packet-messages/draft/create', data);

/**
 * 保存草稿（未发布修订）
 * @param {number | string} draft_id - 草稿ID
 * @param {any} data - 草稿数据
 * @returns {Promise} 返回保存的草稿数据
 */
export const putMessageDraftUpdate = (draft_id: number | string, data: any) =>
  apiClient.post('/packet-messages/draft/update', Object.assign({}, data, { draft_id }));

/**
 * 获取草稿详情（未发布修订）
 * @param {number | string} draft_id - 草稿ID
 * @returns {Promise} 返回草稿详情数据
 */
export const getMessageDraftDetail = (draft_id: number | string) =>
  apiClient.get('/packet-messages/draft/detail', { draft_id });

/**
 * 检查草稿是否存在（根据 message_id）
 * @param {string | string[]} message_id - 报文ID（单个为字符串，批量为数组）
 * @returns {Promise} 返回草稿存在性检查结果
 */
export const checkMessageDraft = (message_id: string | string[]) => {
  if (Array.isArray(message_id)) {
    return apiClient.post('/packet-messages/draft/check', { message_ids: message_id });
  }
  return apiClient.get('/packet-messages/draft/check', { message_id: message_id });
};

/**
 * 确保草稿存在（不存在则从最新已发布复制）
 * @param {Object} data - 请求参数
 * @param {string} data.message_id - 报文ID
 * @returns {Promise} 返回确保草稿存在的结果
 */
export const postMessageDraftEnsure = (data: { message_id: string }) =>
  apiClient.post('/packet-messages/draft/ensure', data);

/**
 * 发布草稿（自动版本号 +1.0）
 * @param {number | string} draft_id - 草稿ID
 * @returns {Promise} 返回发布结果
 */
export const postMessageDraftPublish = (draft_id: number | string) =>
  apiClient.post('/packet-messages/draft/publish', { draft_id });

/**
 * 删除草稿（放弃草稿）
 * @param {number | string} draft_id - 草稿ID
 * @returns {Promise} 返回删除结果
 */
export const deleteMessageDraft = (draft_id: number | string) =>
  apiClient.post('/packet-messages/delete', { ids: [draft_id] });

/**
 * 获取版本列表（仅已发布版本）
 * @param {string} message_id - 报文ID
 * @returns {Promise} 返回版本列表数据
 */
export const getMessageVersionList = (message_id: string) =>
  apiClient.get('/packet-messages/versions', { message_id });

/**
 * 创建报文
 * @param {any} data - 报文数据
 * @returns {Promise} 返回创建的报文数据
 */
export const postMessageCreate = (data) => apiClient.post('/packet-messages/create', data);

/**
 * 更新报文
 * @param {number | string} id - 报文ID
 * @param {any} data - 报文数据
 * @returns {Promise} 返回更新的报文数据
 */
export const putMessageUpdate = (id: number | string, data) => apiClient.post('/packet-messages/update', Object.assign({ id }, data));

/**
 * 删除报文（单个/批量）
 * @param {number} id - 报文ID
 * @returns {Promise} 返回删除结果
 */
export const deleteMessage = (id: number) => apiClient.post('/packet-messages/delete', { ids: [id] });

/**
 * 复制报文
 * @param {number} id - 报文ID
 * @param {Object} data - 复制参数
 * @param {string} data.name - 新报文名称
 * @returns {Promise} 返回复制的报文数据
 */
export const postMessageDuplicate = (id: number, data: { name: string }) =>
  apiClient.post('/packet-messages/duplicate', { id, name: data.name });

/**
 * 导出单个报文
 * @param {number} id - 报文ID
 * @returns {Promise} 返回导出结果
 */
export const getMessageExport = (id: number) => apiClient.post('/packet-messages/export-single', { id });

/**
 * 批量删除报文
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回批量删除结果
 */
export const postMessageBatchDelete = (data: { ids: number[] }) => apiClient.post('/packet-messages/delete', data);

/**
 * 批量启用报文
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回批量启用结果
 */
export const postMessageBatchEnable = (data: { ids: number[] }) => apiClient.post('/packet-messages/enable', data);

/**
 * 批量禁用报文
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回批量禁用结果
 */
export const postMessageBatchDisable = (data: { ids: number[] }) => apiClient.post('/packet-messages/disable', data);

/**
 * 批量导出报文
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回批量导出结果
 */
export const postMessageBatchExport = (data: { ids: number[] }) => apiClient.post('/packet-messages/export', data);

/**
 * 启用报文（单个/批量）
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回启用结果
 */
export const postMessageEnable = (data: { ids: number[] }) => apiClient.post('/packet-messages/enable', data);

/**
 * 禁用报文（单个/批量）
 * @param {Object} data - 请求参数
 * @param {number[]} data.ids - 报文ID数组
 * @returns {Promise} 返回禁用结果
 */
export const postMessageDisable = (data: { ids: number[] }) => apiClient.post('/packet-messages/disable', data);

/**
 * 生成代码（预览）
 * @param {number | string} id - 报文ID
 * @returns {Promise} 返回生成的代码数据
 */
export const generateMessageCode = (id: number | string) => apiClient.post('/packet-messages/generate-code', { id });

/**
 * 获取报文引用关系
 * @param {number | string} id - 报文ID
 * @returns {Promise} 返回报文引用关系数据
 */
export const getPacketReferences = (id: number | string) => apiClient.get('/packet-messages/references', { id });
