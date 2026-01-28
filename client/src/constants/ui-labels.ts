/**
 * 全局 UI 文本常量
 * 提供各模块通用的界面标签、按钮文本、状态文本等
 */
export const UI_LABEL = {
  // ========== 通用操作按钮 ==========
  SAVE: '保存',
  PUBLISH: '发布',
  CANCEL: '取消',
  CONFIRM: '确定',
  DELETE: '删除',
  EDIT: '编辑',
  ADD: '添加',
  REMOVE: '移除',
  CLOSE: '关闭',
  BACK: '返回',
  NEXT: '下一步',
  PREV: '上一步',
  FINISH: '完成',
  SUBMIT: '提交',
  RESET: '重置',
  REFRESH: '刷新',
  EXPORT: '导出',
  IMPORT: '导入',
  UPLOAD: '上传',
  DOWNLOAD: '下载',
  COPY: '复制',
  CUT: '剪切',
  PASTE: '粘贴',
  UNDO: '撤销',
  REDO: '重做',
  SEARCH: '搜索',
  FILTER: '筛选',
  SORT: '排序',
  SETTINGS: '设置',
  HELP: '帮助',
  ABOUT: '关于',
  LOGIN: '登录',
  LOGOUT: '退出',
  REGISTER: '注册',
  SEND: '发送',
  RECEIVE: '接收',
  CONNECT: '连接',
  DISCONNECT: '断开',
  START: '启动',
  STOP: '停止',
  PAUSE: '暂停',
  RESUME: '继续',

  // ========== IDE 工具栏 ==========
  TOOLBOX: '工具箱',
  PROPERTIES: '属性',
  STATISTICS: '统计',
  FIELD_PROPS: '字段属性',
  FIELD_LIST: '字段列表',
  TOOLBAR: '工具栏',

  // ========== 节点属性 ==========
  NODE_ID: '节点ID',
  NODE_TYPE: '节点类型',
  NODE_NAME: '节点名称',
  NODE_PROPERTIES: '节点属性',
  NODE_CONFIG: '节点配置',

  // ========== 连接属性 ==========
  CONNECTION_ID: '连接ID',
  CONNECTION_LABEL: '连接标签',
  CONNECTION_COLOR: '连接颜色',
  CONNECTION_PROPERTIES: '连接属性',

  // ========== 报文属性 ==========
  PACKET_NAME: '报文名称',
  PACKET_ID: '报文ID',
  PACKET_VERSION: '报文版本',
  PACKET_MESSAGE_ID: '消息ID',
  PACKET_DIRECTION: '报文方向',
  PACKET_FIELDS: '报文字段',
  PACKET_FIELD_COUNT: '字段数量',

  // ========== 版本控制 ==========
  VIEW_DIFF: '查看差异',
  UPGRADE_TO_LATEST: '升级到最新',
  VERSION_HISTORY: '历史版本',
  DISCARD_DRAFT: '放弃草稿',
  CREATE_REVISION_DRAFT: '创建修订草稿',
  CONTINUE_REVISION_DRAFT: '继续修订草稿',
  EDIT_PACKET_DEFINITION: '编辑报文定义',
  VERSION_OUTDATED: '版本过期',
  CURRENT_VERSION: '当前版本',
  LATEST_VERSION: '最新版本',

  // ========== 字段类型 ==========
  FIELD_TYPE: '字段类型',
  FIELD_NAME: '字段名称',
  FIELD_LENGTH: '字段长度',
  FIELD_DESCRIPTION: '字段描述',
  FIELD_DEFAULT: '默认值',
  FIELD_REQUIRED: '必填',

  // ========== 协议相关 ==========
  PROTOCOL: '协议',
  PROTOCOL_SET: '协议集',
  PROTOCOL_NAME: '协议名称',
  PROTOCOL_TYPE: '协议类型',
  PROTOCOL_CONFIG: '协议配置',

  // ========== 接口相关 ==========
  INTERFACE: '接口',
  INTERFACE_NAME: '接口名称',
  INTERFACE_TYPE: '接口类型',
  INTERFACE_CONFIG: '接口配置',

  // ========== Tab 相关 ==========
  TAB_CLOSE: '关闭',
  TAB_CLOSE_OTHERS: '关闭其他',
  TAB_CLOSE_RIGHT: '关闭右侧',
  TAB_CLOSE_ALL: '关闭所有',

  // ========== 状态标签 ==========
  STATUS_PENDING: '等待中',
  STATUS_RUNNING: '运行中',
  STATUS_SUCCESS: '成功',
  STATUS_FAILED: '失败',
  STATUS_CANCELLED: '已取消',
  STATUS_UNKNOWN: '未知',
  STATUS_ONLINE: '在线',
  STATUS_OFFLINE: '离线',
  STATUS_ACTIVE: '启用',
  STATUS_INACTIVE: '禁用',

  // ========== 编辑模式 ==========
  MODE_ADD: '添加',
  MODE_EDIT: '编辑',
  MODE_VIEW: '查看',
  MODE_COPY: '复制',
  MODE_DELETE: '删除',

  // ========== 方向标识 ==========
  DIRECTION_INPUT: '接收',
  DIRECTION_OUTPUT: '发送',
  DIRECTION_INPUT_LABEL: '输入',
  DIRECTION_OUTPUT_LABEL: '输出',

  // ========== 表单相关 ==========
  FORM_FIELD_REQUIRED: '该项为必填项',
  FORM_FIELD_INVALID: '该项输入无效',
  FORM_SUBMIT: '提交表单',
  FORM_RESET: '重置表单',

  // ========== 文件相关 ==========
  FILE_SELECT: '选择文件',
  FILE_UPLOAD: '上传文件',
  FILE_DOWNLOAD: '下载文件',
  FILE_DELETE: '删除文件',
  FILE_RENAME: '重命名文件',

  // ========== 树节点相关 ==========
  TREE_ADD_CHILD: '新增子节点',
  TREE_EDIT_NODE: '编辑节点',
  TREE_DELETE_NODE: '删除节点',
  TREE_EXPAND: '展开',
  TREE_COLLAPSE: '折叠',
} as const;
