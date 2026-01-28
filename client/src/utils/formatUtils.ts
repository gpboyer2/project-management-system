/**
 * 格式化工具函数
 * 提供各种格式转换和文本映射功能
 */

import { fieldOptions } from '@/stores/packet-field-options';

// 方向标识映射
const DIRECTION_TEXT_MAP = {
  input: '接收',
  output: '发送'
} as const;

// 编辑模式映射
const EDIT_MODE_TEXT_MAP = {
  add: '添加',
  edit: '编辑'
} as const;

/**
 * 获取报文方向中文文本
 * @param direction - 方向标识 (input/output)
 * @returns 中文文本 (接收/发送)
 */
export function getPacketDirectionText(direction: 'input' | 'output' | string): string {
  return DIRECTION_TEXT_MAP[direction as keyof typeof DIRECTION_TEXT_MAP] || direction;
}

/**
 * 获取编辑模式中文文本
 * @param mode - 编辑模式 (add/edit)
 * @returns 中文文本 (添加/编辑)
 */
export function getEditModeText(mode: 'add' | 'edit' | string): string {
  return EDIT_MODE_TEXT_MAP[mode as keyof typeof EDIT_MODE_TEXT_MAP] || mode;
}

/**
 * 获取字段类型中文文本
 * @param type - 字段类型 (如 SignedInt, UnsignedInt 等)
 * @returns 中文文本 (如有符号整数、无符号整数等)
 */
export function getFieldTypeText(type: string): string {
  const field_config = fieldOptions[type];
  return field_config?.field_name || type;
}
