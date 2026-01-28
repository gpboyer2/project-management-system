/**
 * 全局工具提示常量
 * 提供各模块通用的工具提示文案
 */
export const TOOLTIP = {
  // ========== 通用工具提示 ==========
  SAVE: '保存 (Ctrl+S)',
  REFRESH: '刷新',
  SETTINGS: '设置',
  HELP: '帮助',
  FULLSCREEN: '全屏',
  EXIT_FULLSCREEN: '退出全屏',

  // ========== IDE 工具栏提示 ==========
  AUTO_LAYOUT: '自动布局',
  SHOW_GRID: '显示网格',
  HIDE_GRID: '隐藏网格',
  ZOOM_IN: '放大',
  ZOOM_OUT: '缩小',
  FIT_CANVAS: '适应画布',
  SIMULATE: '仿真运行',
  DEBUG: '调试',
  RUN: '运行',
  STEP_INTO: '单步进入',
  STEP_OVER: '单步跳过',
  STEP_OUT: '单步跳出',

  // ========== 缩放提示 ==========
  ZOOM_RESET: '重置缩放',
  ZOOM_PERCENT: '缩放比例',

  // ========== 节点操作提示 ==========
  ADD_NODE: '添加节点',
  DELETE_NODE: '删除节点',
  EDIT_NODE: '编辑节点',
  COPY_NODE: '复制节点',
  CUT_NODE: '剪切节点',
  PASTE_NODE: '粘贴节点',
  DUPLICATE_NODE: '复制节点',

  // ========== 连接操作提示 ==========
  ADD_CONNECTION: '添加连接',
  DELETE_CONNECTION: '删除连接',
  EDIT_CONNECTION: '编辑连接',
  DISCONNECT: '断开连接',

  // ========== Tab 操作提示 ==========
  CLOSE_TAB: '关闭标签页',
  CLOSE_OTHER_TABS: '关闭其他标签页',
  CLOSE_RIGHT_TABS: '关闭右侧标签页',
  CLOSE_ALL_TABS: '关闭所有标签页',
  REOPEN_CLOSED_TAB: '重新打开关闭的标签页',

  // ========== 树操作提示 ==========
  EXPAND_NODE: '展开节点',
  COLLAPSE_NODE: '折叠节点',
  EXPAND_ALL: '展开全部',
  COLLAPSE_ALL: '折叠全部',

  // ========== 编辑操作提示 ==========
  UNDO: '撤销 (Ctrl+Z)',
  REDO: '重做 (Ctrl+Y)',
  CUT: '剪切 (Ctrl+X)',
  COPY: '复制 (Ctrl+C)',
  PASTE: '粘贴 (Ctrl+V)',
  SELECT_ALL: '全选 (Ctrl+A)',
  DELETE: '删除 (Delete)',

  // ========== 搜索提示 ==========
  SEARCH: '搜索',
  CLEAR_SEARCH: '清除搜索',
  ADVANCED_SEARCH: '高级搜索',

  // ========== 文件操作提示 ==========
  UPLOAD_FILE: '上传文件',
  DOWNLOAD_FILE: '下载文件',
  DELETE_FILE: '删除文件',
  RENAME_FILE: '重命名文件',

  // ========== 字段操作提示 ==========
  ADD_FIELD: '添加字段',
  DELETE_FIELD: '删除字段',
  MOVE_FIELD_UP: '上移字段',
  MOVE_FIELD_DOWN: '下移字段',
  DUPLICATE_FIELD: '复制字段',

  // ========== 版本控制提示 ==========
  VIEW_HISTORY: '查看历史',
  COMPARE_VERSIONS: '比较版本',
  RESTORE_VERSION: '恢复版本',
  CREATE_BRANCH: '创建分支',
  MERGE_BRANCH: '合并分支',

  // ========== 导入导出提示 ==========
  IMPORT_DATA: '导入数据',
  EXPORT_DATA: '导出数据',
  EXPORT_SELECTED: '导出选中项',
  IMPORT_FROM_FILE: '从文件导入',

  // ========== 状态提示 ==========
  ONLINE_STATUS: '在线',
  OFFLINE_STATUS: '离线',
  SYNC_STATUS: '同步中',
  DRAFT_STATUS: '草稿',

  // ========== 快捷键提示 ==========
  SHORTCUT: '快捷键',
  KEYBOARD_SHORTCUTS: '键盘快捷键',
  TOGGLE_PANELS: '切换面板',
  TOGGLE_SIDEBAR: '切换侧边栏',
  TOGGLE_TERMINAL: '切换终端',

  // ========== 提示性文案 ==========
  DRAG_TO_REORDER: '拖拽排序',
  CLICK_TO_EDIT: '点击编辑',
  DOUBLE_CLICK_TO_EDIT: '双击编辑',
  RIGHT_CLICK_MENU: '右键菜单',
  DRAG_TO_MOVE: '拖拽移动',
  SCROLL_TO_ZOOM: '滚轮缩放',
} as const;
