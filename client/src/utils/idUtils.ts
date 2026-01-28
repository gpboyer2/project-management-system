/**
 * ID 解析与生成工具函数
 */

import type { TreeNodeData, ProtocolTreeNodeData } from '@/types';
import { NodeType } from '@/types';
import { isProtocolTreeNode } from '@/utils/treeNodeUtils';

/**
 * 从树节点中解析报文 ID
 * 优先使用协议算法节点的 packet_id 字段，如果不存在则使用 ICD_MESSAGE 类型节点的 id 字段
 * @param {TreeNodeData} node - 树节点数据对象
 * @returns {string | null} 报文 ID 字符串，无法解析时返回 null
 */
export function resolvePacketId(node: TreeNodeData): string | null {
  // 协议算法节点：优先使用 packet_id
  if (isProtocolTreeNode(node)) {
    const protocolNode = node as ProtocolTreeNodeData;
    if (protocolNode.packet_id) {
      return String(protocolNode.packet_id);
    }
  }
  // 兜底：type 为 ICD_MESSAGE 时使用 id
  if (node.id && node.type === NodeType.ICD_MESSAGE) {
    return String(node.id);
  }
  return null;
}

/**
 * 解析并验证数字类型的 packet_id
 * 仅接受纯数字字符串或数字，其他情况返回 undefined 表示"不可用"
 * @param {any} raw_value - 原始值（可以是字符串、数字或其他类型）
 * @returns {string | undefined} 数字类型的 packet_id 字符串，不可用时返回 undefined
 */
export function resolveNumericPacketId(raw_value: any): string | undefined {
  const text = String(raw_value ?? '').trim();
  if (!text) return undefined;
  if (!/^\d+$/.test(text)) return undefined;
  return text;
}

/**
 * 生成唯一的分类 ID
 * 优先使用浏览器原生 crypto.randomUUID() 方法，如果该方法不可用或失败，则使用时间戳加随机数的 fallback 方式
 * @returns {string} 唯一的分类 ID 字符串
 */
export function generateCategoryId(): string {
  try {
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // UUID 生成失败，使用 fallback 方式
  }
  return `category-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 验证 ID 并转换为有效的正整数
 * 接受数字或数字字符串，验证其是否为有效的正整数
 * @param {any} id - 原始 ID 值（可以是 number 或 string 类型）
 * @returns {number | undefined} 有效的数字 ID，无效时返回 undefined
 */
export function validateId(id: any): number | undefined {
  const num = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}
