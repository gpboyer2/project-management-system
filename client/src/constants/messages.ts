/**
 * 全局消息文本常量
 * 提供各模块通用的操作提示、状态提示、确认消息等
 */
export const MESSAGE = {
  // ========== 操作成功消息 ==========
  SAVE_SUCCESS: '保存成功',
  PUBLISH_SUCCESS: '发布成功',
  COPY_SUCCESS: '已复制到剪贴板',
  AUTO_LAYOUT_DONE: '自动布局完成',
  CREATE_SUCCESS: '创建成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  EXPORT_SUCCESS: '导出成功',
  IMPORT_SUCCESS: '导入成功',
  SEND_SUCCESS: '发送成功',
  RECEIVE_SUCCESS: '接收成功',
  CONNECT_SUCCESS: '连接成功',
  DISCONNECT_SUCCESS: '断开成功',
  START_SUCCESS: '启动成功',
  STOP_SUCCESS: '停止成功',
  RESET_SUCCESS: '重置成功',
  RELOAD_SUCCESS: '刷新成功',
  APPLY_SUCCESS: '应用成功',
  SUBMIT_SUCCESS: '提交成功',
  CANCEL_SUCCESS: '取消成功',

  // ========== 操作失败消息 ==========
  SAVE_FAILED: '保存失败',
  PUBLISH_FAILED: '发布失败',
  COPY_FAILED: '复制失败',
  EXPORT_FAILED: '导出失败',
  IMPORT_FAILED: '导入失败',
  DELETE_FAILED: '删除失败',
  CREATE_FAILED: '创建失败',
  UPDATE_FAILED: '更新失败',
  SEND_FAILED: '发送失败',
  RECEIVE_FAILED: '接收失败',
  CONNECT_FAILED: '连接失败',
  DISCONNECT_FAILED: '断开失败',
  START_FAILED: '启动失败',
  STOP_FAILED: '停止失败',
  RESET_FAILED: '重置失败',
  RELOAD_FAILED: '刷新失败',
  APPLY_FAILED: '应用失败',
  SUBMIT_FAILED: '提交失败',
  PARSE_FAILED: '解析失败',
  VALIDATION_FAILED: '验证失败',

  // ========== 操作提示消息 ==========
  NO_CONTENT_TO_COPY: '没有可复制的内容',
  NO_DATA_AVAILABLE: '暂无数据',
  LOADING: '加载中...',
  SIMULATING: '仿真运行中...',
  PROCESSING: '处理中...',
  PENDING: '等待中...',
  RUNNING: '运行中...',
  FINISHED: '已完成',
  CANCELLED: '已取消',
  TIMEOUT: '操作超时',
  NETWORK_ERROR: '网络错误',
  SERVER_ERROR: '服务器错误',
  UNKNOWN_ERROR: '未知错误',

  // ========== 确认消息 ==========
  CONFIRM_DISCARD_DRAFT: '确定要放弃当前草稿吗？未保存的更改将丢失。',
  CONFIRM_DELETE: '确定要删除吗？',
  CONFIRM_DELETE_TITLE: '确认删除',
  CONFIRM_CANCEL: '确定要取消吗？',
  CONFIRM_EXIT: '确定要退出吗？',
  CONFIRM_RESET: '确定要重置吗？',
  CONFIRM_OVERWRITE: '确定要覆盖吗？',
  CONFIRM_DISCARD_CHANGES: '当前有未保存的更改，确定要放弃吗？',
  CONFIRM_SWITCH_VERSION: '当前有未保存的更改，切换版本将丢失这些更改，是否继续？',

  // ========== 权限提示 ==========
  PERMISSION_DENIED: '权限不足',
  NOT_LOGGED_IN: '请先登录',
  SESSION_EXPIRED: '登录已过期，请重新登录',

  // ========== 参数提示 ==========
  PARAM_REQUIRED: '参数必填',
  PARAM_INVALID: '参数无效',
  ID_INVALID: 'ID不合法',
  ID_MISSING: 'ID缺失',
  MISSING_REQUIRED_FIELD: '缺少必填字段',

  // ========== 版本相关 ==========
  ALREADY_LATEST_VERSION: '当前已是最新版本',
  VERSION_OUTDATED: '版本已过期',
  NO_HISTORY_VERSION: '该报文没有历史版本',
  GET_LATEST_FAILED: '未获取到最新已发布版本',
  LOAD_VERSION_FAILED: '加载版本详情失败',
  NO_MESSAGE_ID: '缺少 message_id',

  // ========== 报文相关 ==========
  PACKET_ASSOCIATED: '报文已关联到接口',
  PACKET_REMOVED: '已移除报文关联',
  PACKET_UPGRADED: '已升级到最新版本',
  PACKET_SAVED_LOCAL: '已保存到本地',
  NO_PACKET_SELECTED: '请选择一个报文进行操作',

  // ========== 导航相关 ==========
  NAVIGATION_LOCKED: '导航操作正在进行中，请稍后再试',
} as const;
