/**
 * 图标工具函数集合
 * 提供接口类型、节点类型到 Element Plus 图标组件的映射
 */

import {
  Share,
  Connection,
  Monitor,
  Message,
  Link,
  Document,
  Coin,
  Download,
  Upload,
  ArrowDown,
  ArrowRight,
  Warning,
  Stamp,
  Plus,
  Key,
  PieChart,
  Grid,
  Clock,
  Switch,
  Tickets,
  Memo,
  Operation,
  Star,
  CircleCheck,
  QuestionFilled
} from '@element-plus/icons-vue';

// ========== 接口图标相关 ==========

/**
 * 接口类型到 CSS 类名的映射
 */
const INTERFACE_CLASS_MAP: Record<string, string> = {
  tcp: 'logic-card-icon--tcp',
  udp: 'logic-card-icon--udp',
  can: 'logic-card-icon--can',
  serial: 'logic-card-icon--serial',
  msg: 'logic-card-icon--msg'
};

/**
 * 获取接口图标 CSS 类名
 * @param category - 接口类型（tcp/udp/can/serial/msg）
 * @returns CSS 类名
 */
export function getInterfaceIconClass(category: string): string {
  return INTERFACE_CLASS_MAP[category] || 'logic-card-icon--default';
}

/**
 * 获取接口图标组件
 * @param category - 接口类型（tcp/udp/can/serial/msg）
 * @returns Element Plus 图标组件
 */
export function getInterfaceIcon(category: string): any {
  const iconMap: Record<string, any> = {
    tcp: Share,
    udp: Connection,
    can: Operation,
    serial: Monitor,
    msg: Message
  };
  return iconMap[category] || Link;
}

/**
 * 获取接口图标组件（别名函数，用于向后兼容）
 * @param category - 接口类型（tcp/udp/can/serial/msg）
 * @returns Element Plus 图标组件
 */
export function getInterfaceIconName(category: string): any {
  return getInterfaceIcon(category);
}

// ========== 逻辑节点图标相关 ==========

/**
 * 处理节点类型到 Element Plus 图标组件的映射
 */
export function getProcessingIcon(nodeType: string): any {
  const iconMap: Record<string, any> = {
    'parse-node': Document,
    'serialize-node': Coin
  };
  return iconMap[nodeType] || Coin;
}

/**
 * 通信节点类型到 Element Plus 图标组件的映射
 */
export function getCommunicationIcon(nodeType: string): any {
  const iconMap: Record<string, any> = {
    'tcp-in-node': Download,
    'tcp-out-node': Upload,
    'udp-in-node': ArrowDown,
    'udp-out-node': ArrowRight
  };
  return iconMap[nodeType] || Share;
}

// ========== 仪表板接口图标相关 ==========

/**
 * 仪表板接口类型到 CSS 类名的映射
 * 与 logic-card-icon 类名不同，用于节点仪表板视图
 */
const DASHBOARD_INTERFACE_CLASS_MAP: Record<string, string> = {
  tcp: 'ide-interface-icon--tcp',
  udp: 'ide-interface-icon--udp',
  can: 'ide-interface-icon--can',
  serial: 'ide-interface-icon--serial'
};

/**
 * 获取仪表板接口图标 CSS 类名
 * @param category - 接口类型（tcp/udp/can/serial）
 * @returns CSS 类名
 */
export function getDashboardInterfaceIconClass(category: string): string {
  return DASHBOARD_INTERFACE_CLASS_MAP[category] || 'ide-interface-icon--default';
}

// ========== 字段类型图标相关 ==========

/**
 * 字段类型到 Element Plus 图标组件的映射
 * 对应 packet-field-options.ts 中的字段类型定义
 */
const FIELD_TYPE_ICON_MAP: Record<string, any> = {
  'Stamp': Stamp,
  'Plus': Plus,
  'Key': Key,
  'PieChart': PieChart,
  'Grid': Grid,
  'Clock': Clock,
  'Document': Document,
  'Switch': Switch,
  'Coin': Coin,
  'Tickets': Tickets,
  'Memo': Memo,
  'Monitor': Monitor,
  'Operation': Operation,
  'Star': Star,
  'CircleCheck': CircleCheck
};

/**
 * 获取字段类型图标组件
 * @param iconName - 图标名称（Element Plus 组件名）
 * @returns Element Plus 图标组件
 */
export function getFieldTypeIcon(iconName?: string): any {
  if (!iconName) {
    return QuestionFilled;
  }
  return FIELD_TYPE_ICON_MAP[iconName] || QuestionFilled;
}
