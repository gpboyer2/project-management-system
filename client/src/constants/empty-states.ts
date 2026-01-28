/**
 * 全局空状态常量
 * 提供各模块通用的空状态提示文案
 */
export const EMPTY_STATE = {
  // ========== 通用空状态 ==========
  NO_DATA: '暂无数据',
  NO_RESULT: '暂无结果',
  NO_ITEMS: '暂无项',
  NO_CONTENT: '暂无内容',
  NO_RECORDS: '暂无记录',

  // ========== IDE 相关空状态 ==========
  NO_INTERFACES: '暂无接口配置',
  NO_PACKETS: '暂无报文配置',
  NO_PROPERTIES: '选择一个字段查看属性',
  NO_PACKET_SELECTED: '请选择一个报文进行查看',
  NO_PACKET_TO_EDIT: '请选择一个报文进行编辑',
  NO_LOGIC_NODES: '暂无逻辑节点',
  NO_CONFIG: '暂无配置',
  NO_NODES: '暂无节点',
  NO_CONNECTIONS: '暂无连接',
  NO_FIELDS: '暂无字段',
  NO_HIERARCHY_NODES: '暂无层级节点',
  NO_PACKET_CATEGORIES: '暂无报文分类',
  NO_PACKET_MESSAGES: '暂无报文',

  // ========== 选择提示 ==========
  PLEASE_SELECT: '请选择',
  PLEASE_INPUT: '请输入',
  PLEASE_CHOOSE: '请选择',
  SELECT_TO_VIEW: '选择一个以查看',
  SELECT_TO_EDIT: '选择一个以编辑',
  SELECT_FIELD: '选择一个字段',

  // ========== 操作引导 ==========
  CLICK_TO_ADD: '点击添加',
  DRAG_TO_REORDER: '拖拽排序',
  CLICK_NODE_TO_START: '请点击左侧节点开始',
  NO_RECENT_ITEMS: '暂无最近使用',

  // ========== 树相关空状态 ==========
  TREE_EMPTY: '树为空',
  CHILDREN_EMPTY: '无子节点',
  LEAF_NODE: '叶子节点',

  // ========== 搜索相关空状态 ==========
  SEARCH_NO_RESULT: '未找到相关结果',
  SEARCH_EMPTY: '搜索内容不能为空',
  FILTER_NO_RESULT: '筛选后无结果',

  // ========== 文件相关空状态 ==========
  NO_FILES: '暂无文件',
  NO_ATTACHMENTS: '暂无附件',
  NO_IMAGES: '暂无图片',

  // ========== 表单相关空状态 ==========
  FORM_EMPTY: '表单为空',
  NO_CHANGES: '暂无更改',

  // ========== 错误状态 ==========
  LOAD_FAILED: '加载失败',
  NOT_FOUND: '未找到',
  ACCESS_DENIED: '无访问权限',
  DATA_ERROR: '数据异常',

  // ========== 历史版本空状态 ==========
  NO_HISTORY: '暂无历史记录',
  NO_VERSIONS: '暂无版本',

  // ========== 导入导出空状态 ==========
  NO_EXPORT_DATA: '无导出数据',
  NO_IMPORT_FILE: '未选择导入文件',
} as const;
