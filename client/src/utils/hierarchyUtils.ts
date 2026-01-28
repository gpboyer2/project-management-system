/**
 * 层级配置工具函数
 */

import type { HierarchyLevelConfig } from '@/stores/hierarchy-config';

/**
 * 根据节点类型 ID 获取显示字段名
 * @param nodeTypeId - 节点类型 ID
 * @param hierarchyLevelMap - 层级配置映射
 * @returns 显示字段名
 */
export function getDisplayFieldName(
  nodeTypeId: string,
  hierarchyLevelMap: Record<string, HierarchyLevelConfig>
): string {
  const level = hierarchyLevelMap[nodeTypeId];
  if (level?.fields && level.fields.length > 0) {
    const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedFields[0].name;
  }
  return 'id';
}

/**
 * 获取节点的显示值
 * @param node - 节点对象
 * @param nodeTypeId - 节点类型 ID
 * @param hierarchyLevelMap - 层级配置映射
 * @returns 显示值
 */
export function getNodeDisplayValue(
  node: any,
  nodeTypeId: string,
  hierarchyLevelMap: Record<string, HierarchyLevelConfig>
): string {
  if (node.properties && node.properties['名称']) {
    return node.properties['名称'];
  }
  const displayField = getDisplayFieldName(nodeTypeId, hierarchyLevelMap);
  if (displayField !== 'id' && node[displayField]) {
    return node[displayField];
  }
  return node.id;
}

/**
 * 根据父节点 ID 获取子节点列表
 * @param nodeList - 节点列表
 * @param parentId - 父节点 ID
 * @returns 子节点列表
 */
export function getChildNodesByParent<T extends { parentId?: string }>(
  nodeList: T[],
  parentId: string
): T[] {
  return nodeList.filter(node => node.parentId === parentId);
}

/**
 * 根据节点 ID 获取节点名称
 * @param nodeList - 节点列表
 * @param nodeId - 节点 ID
 * @returns 节点名称
 */
export function getNodeName(
  nodeList: Array<{ id: string; name?: string }>,
  nodeId: string
): string {
  const node = nodeList.find(n => n.id === nodeId);
  return node?.name || nodeId;
}

/**
 * 判断元素是否受影响（用于影响分析）
 * @param element - 元素
 * @param affectedSet - 受影响元素 ID 集合
 * @returns 是否受影响
 */
export function isAnchorAffected(
  element: { id: string },
  affectedSet: Set<string>
): boolean {
  return affectedSet.has(element.id);
}
