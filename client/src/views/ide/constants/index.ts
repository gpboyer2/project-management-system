// IDE 常量定义
// 复用全局常量库 (client/src/constants/)，保留 IDE 特有的常量

// 从全局常量库导入
import { MESSAGE, UI_LABEL, EMPTY_STATE, TOOLTIP } from '@/constants';

// ========== IDE 特有的常量 ==========

/**
 * UI 尺寸常量
 * 定义 IDE 中使用的各种尺寸和间距
 */
export const UI_SIZE = {
  ICON_SIZE_DEFAULT: 24,
  ICON_SIZE_SMALL: 20,
  ICON_SIZE_TINY: 14,
  ICON_SIZE_LARGE: 48,
  PADDING_BASE: 8,
  NODE_LEVEL_INDENT: 16,
  SPACING_SMALL: 4,
  SPACING_MEDIUM: 8,
  SPACING_LARGE: 16,
  KEEP_ALIVE_MAX: 10,
} as const;

/**
 * 节点类型常量
 * 定义 IDE 中支持的节点类型标识
 */
export const NODE_TYPE = {
  PARSE: 'parse-node',
  SERIALIZE: 'serialize-node',
  TCP_IN: 'tcp-in-node',
  TCP_OUT: 'tcp-out-node',
  UDP_IN: 'udp-in-node',
  UDP_OUT: 'udp-out-node',
  SERIAL: 'serial-node',
  CAN: 'can-node',
  FUNCTION: 'function-node',
} as const;

/**
 * 接口类型常量
 * 定义支持的通信接口类型
 */
export const INTERFACE_TYPE = {
  TCP: 'tcp',
  UDP: 'udp',
  SERIAL: 'serial',
  CAN: 'can',
  MSG: 'msg',
} as const;

/**
 * 数据方向常量
 * 定义报文的传输方向
 */
export const DIRECTION = {
  INPUT: 'input',
  OUTPUT: 'output',
} as const;

/**
 * 编辑状态常量
 * 定义报文的编辑状态类型
 */
export const EDIT_STATUS = {
  HISTORY: 'history',
  READONLY: 'readonly',
  DRAFT: 'draft',
  EDITABLE: 'editable',
} as const;

/**
 * 标签页类型常量
 * 定义 IDE 工具栏中的标签页类型
 */
export const TAB_TYPE = {
  TOOLBOX: 'toolbox',
  PROPERTIES: 'properties',
  FIELD_PROPS: 'field-props',
  FIELD_LIST: 'field-list',
} as const;

/**
 * API 配置常量
 * 定义 API 请求的分页、重试和超时配置
 */
export const API_CONFIG = {
  PAGINATION_SMALL: { page_size: 20, current_page: 1 },
  PAGINATION_MEDIUM: { page_size: 50, current_page: 1 },
  PAGINATION_LARGE: { page_size: 200, current_page: 1 },
  RETRY_MAX_ATTEMPTS: 2,
  RETRY_DELAY_BASE: 100,
  RETRY_DELAY_MULTIPLIER: 2,
  TIMEOUT_DEFAULT: 30000,
  TIMEOUT_LONG: 60000,
} as const;

/**
 * CSS 类名后缀常量
 * 定义用于状态和样式的 CSS 类名后缀
 */
export const CLASS_SUFFIX = {
  ACTIVE: '--active',
  DISABLED: '--disabled',
  DRAGGING: '--dragging',
  DRAG_OVER: '--drag-over',
  SELECTED: '--selected',
  EXPANDED: '--expanded',
  TCP: '--tcp',
  UDP: '--udp',
  SERIAL: '--serial',
  CAN: '--can',
} as const;

/**
 * 图标类名常量
 * 定义不同类型节点的图标 CSS 类名
 */
export const ICON_CLASS = {
  TCP: 'logic-card-icon--tcp',
  UDP: 'logic-card-icon--udp',
  SERIAL: 'logic-card-icon--serial',
  CAN: 'logic-card-icon--can',
  MSG: 'logic-card-icon--msg',
  FUNCTION: 'logic-card-icon--function',
} as const;

/**
 * 索引常量
 * 定义常用的索引值
 */
export const INDEX = {
  NOT_FOUND: -1,
  FIRST: 0,
} as const;
