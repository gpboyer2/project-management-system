/**
 * 树节点类型判断工具函数
 */

import type { TreeNodeData, HierarchyTreeNodeData, ProtocolTreeNodeData } from '@/types';
import { NodeType } from '@/types';

/**
 * 判断是否为体系层级节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {node is HierarchyTreeNodeData} 是否为体系层级节点
 */
export function isHierarchyTreeNode(node: TreeNodeData | null): node is HierarchyTreeNodeData {
  if (!node) return false;
  return 'node_type_id' in node && !!node.node_type_id;
}

/**
 * 判断是否为协议算法节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {node is ProtocolTreeNodeData} 是否为协议算法节点
 */
export function isProtocolTreeNode(node: TreeNodeData | null): node is ProtocolTreeNodeData {
  if (!node) return false;
  return node.type === NodeType.ICD_MESSAGE;
}

/**
 * 判断是否为 ICD bundles 根节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {boolean} 是否为 ICD bundles 根节点
 */
export function isIcdBundlesRoot(node: TreeNodeData | null): boolean {
  return !!node && node.id === 'icd-bundles';
}

/**
 * 判断是否为报文分类节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {boolean} 是否为报文分类节点
 */
export function isPacketCategoryNode(node: TreeNodeData | null): boolean {
  return !!node && node.type === NodeType.PACKET_CATEGORY;
}

/**
 * 判断是否为 ICD 报文节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {boolean} 是否为 ICD 报文节点
 */
export function isIcdMessageNode(node: TreeNodeData | null): boolean {
  return isProtocolTreeNode(node);
}

/**
 * 判断是否为系统层级根节点
 * @param {TreeNodeData | null} node - 树节点
 * @returns {boolean} 是否为系统层级根节点
 */
export function isSystemHierarchyRoot(node: TreeNodeData | null): boolean {
  return !!node && node.id === 'system-hierarchy';
}

/**
 * 判断是否为层级节点（包含根节点和体系层级节点）
 * @param {TreeNodeData | null} node - 树节点
 * @returns {boolean} 是否为层级节点
 */
export function isHierarchyNode(node: TreeNodeData | null): boolean {
  if (!node) return false;
  if (isSystemHierarchyRoot(node)) return true;
  return isHierarchyTreeNode(node);
}

/**
 * 获取节点类型
 * @param {any} node - 树节点
 * @returns {string} 节点类型字符串
 */
export function getNodeType(node: any): string {
  if (node.type) return node.type;
  return 'node';
}
