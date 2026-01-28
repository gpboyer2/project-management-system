/**
 * @file       useTreeNodeIcon.ts
 * @brief      树节点图标和显示名称的工具函数（供 TreeNode 和 ExportDialog 共用）
 * @date       2025-01-06
 */

import {
  Folder,
  Box,
  FolderOpened,
  Document,
  DataLine,
  Link,
  Monitor,
  Files,
  Setting,
  Connection,
  Platform,
  Cpu,
  Histogram,
  TrendCharts,
  Grid,
  Menu,
  Operation,
  Tools,
  Share,
  MessageBox,
  ChatDotRound,
  Bell,
  Warning,
  CircleCheck,
  Star,
  Flag
} from '@element-plus/icons-vue';
import type { TreeNodeData, HierarchyTreeNodeData } from '@/types';
import { NodeType } from '@/types';

// Component type definition
type Component = any;

const iconComponentMap: Record<string, Component> = {
  Folder,
  Box,
  FolderOpened,
  Document,
  DataLine,
  Link,
  Monitor,
  Files,
  Setting,
  Connection,
  Platform,
  Cpu,
  Histogram,
  TrendCharts,
  Grid,
  Menu,
  Operation,
  Tools,
  Share,
  MessageBox,
  ChatDotRound,
  Bell,
  Warning,
  CircleCheck,
  Star,
  Flag
};

export interface TreeNodeIconInfo {
  iconComponent: Component;
  iconClass: string;
  displayName: string;
}

/**
 * 获取层级配置的显示字段名
 * @param {string} nodeTypeId - 节点类型ID
 * @param {Record<string, any>} hierarchyLevelMap - 层级配置映射
 * @returns {string} 显示字段名，默认为 'id'
 */
function getDisplayFieldName(nodeTypeId: string, hierarchyLevelMap: Record<string, any>): string {
  const level = hierarchyLevelMap[nodeTypeId];
  if (level?.fields && level.fields.length > 0) {
    const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedFields[0].name;
  }
  return 'id';
}

/**
 * 获取节点的显示值
 * @param {TreeNodeData} node - 树节点数据
 * @param {string} nodeTypeId - 节点类型ID
 * @param {Record<string, any>} hierarchyLevelMap - 层级配置映射
 * @returns {string} 节点的显示值
 */
function getNodeDisplayValue(node: TreeNodeData, nodeTypeId: string, hierarchyLevelMap: Record<string, any>): string {
  const displayField = getDisplayFieldName(nodeTypeId, hierarchyLevelMap);
  if (node[displayField]) {
    return String(node[displayField]);
  }
  const hierarchyNode = node as HierarchyTreeNodeData;
  if (hierarchyNode.properties && hierarchyNode.properties[displayField]) {
    return String(hierarchyNode.properties[displayField]);
  }
  return node.id;
}

/**
 * 获取显示名称（去除括号内容）
 * @param {unknown} name - 原始名称
 * @returns {string} 去除括号内容后的显示名称，非字符串类型返回空字符串
 */
function getDisplayNodeName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name
    .replace(/\s*（[^）]*）/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

/**
 * 获取树节点的图标信息（同步函数，无响应式）
 * @param {TreeNodeData} node - 节点数据
 * @param {Record<string, any>} hierarchyLevelMap - 层级配置映射
 * @param {boolean} isExpanded - 是否展开
 * @returns {TreeNodeIconInfo} 图标组件、图标类名和显示名称
 */
export function getTreeNodeIcon(
  node: TreeNodeData,
  hierarchyLevelMap: Record<string, any>,
  isExpanded = false
): TreeNodeIconInfo {
  // 判断是否为体系层级节点，获取层级配置
  const node_type_id = (node as HierarchyTreeNodeData).node_type_id;
  const levelConfig = node_type_id ? hierarchyLevelMap[node_type_id] : null;

  function getIcon(): Component {
    // 特殊节点类型优先
    if (node.type === NodeType.FOLDER) {
      return isExpanded ? FolderOpened : Folder;
    }
    if (node.type === NodeType.DICTIONARY) {
      return Document;
    }
    if (node.type === NodeType.ICD_BUNDLE) {
      return Link;
    }
    if (node.type === NodeType.PACKET_CATEGORY) {
      return isExpanded ? FolderOpened : Folder;
    }
    if (node.type === NodeType.ICD_MESSAGE) {
      return DataLine;
    }

    // 层级配置的图标
    if (levelConfig?.icon_class) {
      const iconName = levelConfig.icon_class;
      const iconComponent = iconComponentMap[iconName];
      return iconComponent || Box;
    }

    return Box;
  }

  function getIconClass(): string {
    // 层级节点（包括层级父节点的子节点）优先使用灰色
    if (levelConfig) {
      return 'ide-tree-node-icon--hierarchy';
    }
    if (node.type === NodeType.FOLDER) return 'ide-tree-node-icon--folder';
    if (node.type === NodeType.DICTIONARY) return 'ide-tree-node-icon--dictionary';
    if (node.type === NodeType.ICD_BUNDLE) return 'ide-tree-node-icon--icd';
    if (node.type === NodeType.PACKET_CATEGORY) return 'ide-tree-node-icon--packet-category';
    if (node.type === NodeType.ICD_MESSAGE) return 'ide-tree-node-icon--icd-msg';
    return 'ide-tree-node-icon--color-0';
  }

  const rawName = node.name || getNodeDisplayValue(node, node_type_id || '', hierarchyLevelMap);

  return {
    iconComponent: getIcon(),
    iconClass: getIconClass(),
    displayName: getDisplayNodeName(rawName)
  };
}

/**
 * 导出图标组件映射，供外部使用
 */
export { iconComponentMap };
