<!--
  IDE 左侧资源管理器组件
  展示动态配置的层级树结构
  拆分后主组件仅负责数据管理和协调
-->
<template>
  <aside class="ide-explorer">
    <!-- 标题栏 -->
    <div class="ide-explorer-header">
      <span>资源管理器</span>

      <div class="ide-explorer-actions">
        <button
          class="ide-explorer-action-btn"
          :class="{ 'ide-explorer-action-btn--disabled': treeData.length === 0 }"
          title="导出"
          :disabled="treeData.length === 0"
          @click="treeData.length > 0 && (exportDialogVisible = true)"
        >
          <span>导出</span>

          <el-icon><Download /></el-icon>
        </button>

        <button
          class="ide-explorer-action-btn"
          :class="{ 'ide-explorer-action-btn--disabled': treeData.length === 0 }"
          title="导入"
          :disabled="treeData.length === 0"
          @click="treeData.length > 0 && (importDialogVisible = true)"
        >
          <span>导入</span>

          <el-icon><Upload /></el-icon>
        </button>
      </div>
    </div>

    <!-- 树形内容 -->
    <div class="ide-explorer-content">
      <!-- 系统层级树 -->
      <TreeNode
        v-for="node in treeData"
        :key="node.id"
        :node="node"
        :level="0"
        :selected-id="selectedIds"
        :hierarchy-level-map="hierarchyLevelMap"
        :context-menu-node-id="contextMenuNodeId"
        @node-click="handleNodeClick"
        @toggle="handleToggle"
        @contextmenu="handleContextMenu"
      />
    </div>

    <!-- 右键菜单 -->
    <TreeContextMenu
      :visible="contextMenu.visible"
      :comp-options="{
        x: contextMenu.x,
        y: contextMenu.y,
        targetNode: contextMenu.targetNode
      }"
      @close="closeContextMenu"
      @add-child-node="handleAddChildNode"
      @edit-node="handleEditNode"
      @delete-node="handleDeleteNode"
      @export-hierarchy-node="handleExportHierarchyNode"
      @add-packet-category="handleAddPacketCategory"
      @add-packet-message="handleAddPacketMessage"
      @edit-packet-category="handleEditPacketCategory"
      @delete-packet-category="handleDeletePacketCategory"
      @export-protocol-category="handleExportProtocolCategory"
      @open-packet-message="handleOpenPacketMessage"
      @delete-packet-message="handleDeletePacketMessage"
      @export-packet-message="handleExportPacketMessage"
    />

    <!-- 编辑对话框 -->
    <TreeNodeEditDialog
      v-model:visible="editDialog.visible"
      :comp-options="{
        mode: editDialog.mode,
        scope: editDialog.scope,
        nodeName: editDialog.nodeName
      }"
      @confirm="handleDialogConfirm"
    />

    <!-- 导出弹窗 -->
    <ExportDialog
      v-model:visible="exportDialogVisible"
      :preview-data="exportPreviewData"
      @export="handleExportData"
    />

    <!-- 导入弹窗 -->
    <ImportDialog
      v-model:visible="importDialogVisible"
      @import="handleImportData"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Upload } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';
import { useSystemLevelDesignStore, useUserStore } from '@/stores';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { getCategoryTree, createCategory, updateCategory, deleteCategory } from '@/api/packetMessageCategory';
import { postMessageDraftCreate, deleteMessage } from '@/api/messageManagement';
import { getExportPreview, exportData, importData as importDataApi } from '@/api/dataImportExport';
import TreeNode from '../ide-tree-node/index.vue';
import ExportDialog from '../shared-export-dialog/index.vue';
import ImportDialog from '../shared-import-dialog/index.vue';
import TreeContextMenu from './components/tree-context-menu/index.vue';
import TreeNodeEditDialog from './components/tree-node-edit-dialog/index.vue';
import type { TreeNodeData, HierarchyTreeNodeData } from '@/types';
import { NodeType } from '@/types';
import { parseEditorParams, buildEditorQuery } from '@/utils/routeParamHelper';
import { findTreeNodeById, fileUtils } from '@/utils';
import {
  isIcdBundlesRoot,
  isPacketCategoryNode,
  isIcdMessageNode,
  isSystemHierarchyRoot,
  getNodeType,
  isHierarchyTreeNode
} from '@/utils/treeNodeUtils';
import { resolvePacketId, generateCategoryId } from '@/utils/idUtils';
import { useConfirmDialog } from '@/composables/useConfirmDialog';

const emit = defineEmits<{
  (e: 'node-click', node: TreeNodeData): void
}>();

const router = useRouter();
const route = useRoute();
const systemDesignStore = useSystemLevelDesignStore();
const hierarchyConfigStore = useHierarchyConfigStore();
const userStore = useUserStore();
const { confirmDelete } = useConfirmDialog();

// 导航锁：防止快速点击导致路由竞态
let isNavigating = false;

// 层级配置映射表
const hierarchyLevelMap = computed(() => {
  const map: Record<string, any> = {};
  hierarchyConfigStore.hierarchyLevels.forEach(level => {
    map[level.id] = level;
    map[level.type_name] = level;
  });
  return map;
});

/**
 * 获取节点的显示字段名
 * @param {string} nodeTypeId - 节点类型ID
 * @returns {string} 显示字段名
 */
function getDisplayFieldName(nodeTypeId: string): string {
  const level = hierarchyLevelMap.value[nodeTypeId];
  if (level?.fields && level.fields.length > 0) {
    const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedFields[0].name;
  }
  return 'id';
}

/**
 * 获取节点的显示值
 * @param {any} node - 节点数据
 * @param {string} nodeTypeId - 节点类型ID
 * @returns {string} 节点显示值
 */
function getNodeDisplayValue(node: any, nodeTypeId: string): string {
  if (node.properties && node.properties['名称']) {
    return node.properties['名称'];
  }
  const displayField = getDisplayFieldName(nodeTypeId);
  if (displayField !== 'id' && node[displayField]) {
    return node[displayField];
  }
  return node.id;
}

// 树数据
const treeData = ref<TreeNodeData[]>([]);

// 从路由获取类型和 ID
const routeParams = computed(() => parseEditorParams(route.query, route.path));

/**
 * 在树中递归查找匹配的报文节点（通过 packet_id）
 * @param {TreeNodeData[]} node_list - 节点列表
 * @param {string} packetId - 报文ID
 * @returns {TreeNodeData | null} 找到的节点或null
 */
function findNodeByPacketId(node_list: TreeNodeData[], packetId: string): TreeNodeData | null {
  for (const node of node_list) {
    if (node.type === NodeType.ICD_MESSAGE) {
      const nodePacketId = resolvePacketId(node);
      if (nodePacketId === packetId) {
        return node;
      }
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeByPacketId(node.children, packetId);
      if (found) return found;
    }
  }
  return null;
}

// 当前选中的节点 ID 集合（根据路由计算，支持多选）
const selectedIds = computed<Set<string>>(() => {
  const ids = new Set<string>();
  const params = routeParams.value;
  if (!params) return ids;

  const { type, id } = params;

  // protocol 类型：只高亮报文节点
  if (type === 'protocol') {
    const packetId = route.query.packetId as string || id;
    const packetNode = findNodeByPacketId(treeData.value, packetId);
    if (packetNode?.id) {
      ids.add(packetNode.id);
    }
    return ids;
  }

  // logic 类型：高亮体系层级节点
  if (type === 'logic') {
    ids.add(id);
    return ids;
  }

  // hierarchy 类型：高亮体系层级节点
  if (type === 'hierarchy') {
    ids.add(id);
    return ids;
  }

  // icd 类型：高亮报文分类节点
  if (type === 'icd') {
    ids.add(id);
    return ids;
  }

  return ids;
});

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetNode: null as TreeNodeData | null
});

// 当前右键菜单的目标节点 ID（用于轮廓显示）
const contextMenuNodeId = computed(() => {
  return contextMenu.value.targetNode?.id || null;
});

// 编辑对话框状态
const editDialog = ref({
  visible: false,
  mode: 'add' as 'add' | 'edit',
  nodeName: '',
  targetNode: null as TreeNodeData | null,
  nextLevelId: '',
  displayField: '',
  scope: 'hierarchy' as 'hierarchy' | 'packet-category' | 'packet-message',
  parentCategoryId: null as string | null,
  targetCategoryId: null as string | null,
  packetCategoryId: null as string | null
});

// 导入导出弹窗状态
const exportDialogVisible = ref(false);
const importDialogVisible = ref(false);
const exportPreviewData = ref<{
  hierarchy?: { count: number; tree: TreeNodeData[] };
  protocols?: { count: number; tree: TreeNodeData[] };
}>({});

/** 加载树数据 */
async function loadTreeData() {
  try {
    await hierarchyConfigStore.loadLevels();
    await systemDesignStore.loadHierarchyNodes();

    const nodes = systemDesignStore.hierarchyNodes || [];
    const hierarchyNodes = transformNodes(nodes);

    let packet_node_list: TreeNodeData[] = [];
    try {
      packet_node_list = await loadPacketList();
    } catch (e) {
      console.warn('Failed to load packets for tree:', e);
    }

    if (packet_node_list.length === 0) {
      packet_node_list.push({
        id: 'no-packets-tip',
        name: '暂无报文数据',
        type: NodeType.FILE,
        selectable: false,
        children: []
      });
    }

    treeData.value = [
      {
        id: 'system-hierarchy',
        name: '体系层级',
        type: NodeType.FOLDER,
        expanded: true,
        children: hierarchyNodes
      },
      {
        id: 'protocols-data',
        name: '协议与算法',
        type: NodeType.FOLDER,
        expanded: true,
        children: [
          {
            id: 'dict-structs',
            name: '公共数据字典',
            type: NodeType.DICTIONARY,
            children: []
          },
          {
            id: 'icd-bundles',
            name: '协议集',
            type: NodeType.FOLDER,
            expanded: true,
            children: packet_node_list
          }
        ]
      }
    ];
  } catch (error) {
    console.error('加载树数据失败:', error);
    treeData.value = [];
  }
}

/**
 * 从 API 加载报文分类树
 * @returns {Promise<TreeNodeData[]>} 报文分类树节点列表
 */
async function loadPacketList(): Promise<TreeNodeData[]> {
  try {
    const response = await getCategoryTree();
    if (response?.status !== 'success') {
      return [];
    }
    const tree_list = Array.isArray(response.datum) ? response.datum : [];
    return transformCategoryTree(tree_list);
  } catch (error) {
    console.error('加载报文分类树失败:', error);
    return [];
  }
}

/**
 * 转换报文分类树为前端树节点格式
 * @param {any[]} node_list - 后端返回的分类树节点列表
 * @returns {TreeNodeData[]} 前端树节点列表
 */
function transformCategoryTree(node_list: any[]): TreeNodeData[] {
  return node_list.map((node: any) => {
    if (node.type === 'packet') {
      return {
        id: node.id,
        name: node.name,
        type: NodeType.ICD_MESSAGE,
        packet_id: node.packet_id,
        description: node.description,
        version: node.version || '1.0',
        field_count: node.field_count || 0,
        is_draft: node.is_draft === true,
        children: []
      };
    }
    return {
      id: node.id,
      name: node.name,
      type: NodeType.PACKET_CATEGORY,
      description: node.description,
      expanded: true,
      children: node.children ? transformCategoryTree(node.children) : []
    };
  });
}

/** 转换节点数据格式 */
function transformNodes(nodes: any[]): TreeNodeData[] {
  return nodes.map(node => {
    const displayValue = getNodeDisplayValue(node, node.node_type_id);
    const result: HierarchyTreeNodeData = {
      id: node.id,
      name: displayValue,
      type: node.node_type_id?.toLowerCase() || getNodeType(node),
      node_type_id: node.node_type_id,
      expanded: node.expanded ?? true,
      children: node.children ? transformNodes(node.children) : []
    };

    Object.keys(node).forEach(key => {
      if (key !== 'name' && key !== 'children' && !(key in result)) {
        (result as any)[key] = node[key];
      }
    });

    return result;
  });
}

/** 处理节点点击，路由跳转逻辑已移到 TreeNode 组件内部直接处理，此方法仅用于向上传递事件 */
function handleNodeClick(node: TreeNodeData) {
  emit('node-click', node);
}

/**
 * 切换节点展开/折叠状态
 * @param {TreeNodeData} node - 树节点
 */
function handleToggle(node: TreeNodeData) {
  node.expanded = !node.expanded;
}

/**
 * 处理右键菜单
 * @param {MouseEvent} event - 鼠标事件
 * @param {TreeNodeData} node - 树节点
 */
function handleContextMenu(event: MouseEvent, node: TreeNodeData) {
  const disableIds = ['protocols-data', 'dict-structs', 'no-packets-tip'];
  if (disableIds.includes(node.id)) return;

  const nodeType = (node as any)?.type;
  if (nodeType === NodeType.DICTIONARY) return;

  event.stopPropagation();
  event.preventDefault();

  const is_hierarchy_root = isSystemHierarchyRoot(node);
  const is_icd_root = isIcdBundlesRoot(node);
  const is_packet_category = isPacketCategoryNode(node);
  const is_icd_message = isIcdMessageNode(node);
  const menuWidth = 140;
  const menuHeight = is_hierarchy_root
    ? 40
    : (is_icd_root ? 80 : (is_packet_category ? 160 : (is_icd_message ? 80 : 120)));
  let x = event.clientX;
  let y = event.clientY;

  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 8;
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 8;
  }

  contextMenu.value = {
    visible: true,
    x,
    y,
    targetNode: node
  };
}

/**
 * 关闭右键菜单
 */
function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenu.value.targetNode = null;
}

/** 协议集：新增分类 */
async function handleAddPacketCategory(parentNode: TreeNodeData) {
  const parentCategoryId = isIcdBundlesRoot(parentNode) ? null : String(parentNode.id || '').trim() || null;
  editDialog.value = {
    visible: true,
    mode: 'add',
    nodeName: '',
    targetNode: parentNode,
    nextLevelId: '',
    displayField: '',
    scope: 'packet-category',
    parentCategoryId,
    targetCategoryId: null,
    packetCategoryId: null
  };
  closeContextMenu();
}

/** 协议集：新增报文 */
async function handleAddPacketMessage(parentNode: TreeNodeData) {
  const categoryId = isPacketCategoryNode(parentNode) ? String(parentNode.id || '').trim() || null : null;
  editDialog.value = {
    visible: true,
    mode: 'add',
    nodeName: '',
    targetNode: parentNode,
    nextLevelId: '',
    displayField: '',
    scope: 'packet-message',
    parentCategoryId: null,
    targetCategoryId: null,
    packetCategoryId: categoryId
  };
  closeContextMenu();
}

/** 协议集：编辑分类 */
async function handleEditPacketCategory(node: TreeNodeData) {
  editDialog.value = {
    visible: true,
    mode: 'edit',
    nodeName: String(node.name || '').trim(),
    targetNode: node,
    nextLevelId: '',
    displayField: '',
    scope: 'packet-category',
    parentCategoryId: null,
    targetCategoryId: String(node.id || '').trim() || null,
    packetCategoryId: null
  };
  closeContextMenu();
}

/** 协议集：打开报文编辑器 */
function handleOpenPacketMessage(node: TreeNodeData) {
  if (isNavigating) {
    closeContextMenu();
    return;
  }

  const packet_id = resolvePacketId(node);
  if (!packet_id) {
    ElMessage.warning('报文ID不合法，无法打开编辑器');
    closeContextMenu();
    return;
  }
  isNavigating = true;
  router.push({
    path: '/editor/ide/protocol',
    query: buildEditorQuery('protocol', packet_id)
  }).finally(() => {
    isNavigating = false;
  });
  closeContextMenu();
}

/** 协议集：删除报文 */
async function handleDeletePacketMessage(node: TreeNodeData) {
  const packet_id = resolvePacketId(node);
  if (!packet_id) {
    ElMessage.warning('报文ID不合法，无法删除');
    closeContextMenu();
    return;
  }

  await confirmDelete({
    title: '确认删除',
    message: '确定删除该报文吗？',
    onConfirm: async () => {
      const res = await deleteMessage(packet_id);
      if (res?.status !== 'success') {
        throw new Error(res?.message || '删除失败');
      }
      await loadTreeData();
    },
    successMessage: '删除成功'
  });

  closeContextMenu();
}

/** 协议集：删除分类 */
async function handleDeletePacketCategory(node: TreeNodeData) {
  await confirmDelete({
    title: '确认删除',
    message: '确定删除该分类吗？（不会级联删除子分类，分类下报文将自动变为未分类）',
    onConfirm: async () => {
      const res = await deleteCategory([String(node.id)]);
      if (res?.status !== 'success') {
        throw new Error(res?.message || '删除失败');
      }
      await loadTreeData();
    },
    successMessage: '删除成功'
  });

  closeContextMenu();
}

/** 导出体系层级节点 */
async function handleExportHierarchyNode(node: TreeNodeData) {
  closeContextMenu();
  try {
    const res = await exportData({ hierarchy: [node.id] });
    if (res?.status === 'success' && res.datum?.download_url) {
      downloadFile(res.datum.download_url, res.datum.file_name || 'hierarchy-export.zip');
      ElMessage.success('导出成功');
    } else {
      throw new Error(res?.message || '导出失败');
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  }
}

/** 导出协议分类 */
async function handleExportProtocolCategory(node: TreeNodeData) {
  closeContextMenu();
  try {
    const res = await exportData({ protocols: [node.id] });
    if (res?.status === 'success' && res.datum?.download_url) {
      downloadFile(res.datum.download_url, res.datum.file_name || 'protocol-export.zip');
      ElMessage.success('导出成功');
    } else {
      throw new Error(res?.message || '导出失败');
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  }
}

/** 导出报文 */
async function handleExportPacketMessage(node: TreeNodeData) {
  closeContextMenu();
  try {
    const res = await exportData({ protocols: [node.id] });
    if (res?.status === 'success' && res.datum?.download_url) {
      downloadFile(res.datum.download_url, res.datum.file_name || 'packet-export.zip');
      ElMessage.success('导出成功');
    } else {
      throw new Error(res?.message || '导出失败');
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  }
}

/**
 * 下载文件辅助函数
 * @param {string} url - 文件下载URL
 * @param {string} fileName - 文件名
 */
async function downloadFile(url: string, fileName: string) {
  const response = await fetch(url, {
    headers: userStore.token ? { 'Authorization': `Bearer ${userStore.token}` } : {}
  });

  if (!response.ok) {
    throw new Error('下载失败');
  }

  const blob = await response.blob();
  fileUtils.downloadBlob(blob, fileName);
}

/** 新增子节点 */
async function handleAddChildNode(parentNode: TreeNodeData) {
  const isRoot = isSystemHierarchyRoot(parentNode);
  let nextLevelId;
  let displayField;

  if (isRoot) {
    nextLevelId = getFirstLevelTypeId();
    const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nextLevelId);
    displayField = levelConfig?.fields?.[0]?.name || '名称';
  } else {
    nextLevelId = getNextLevelTypeId(parentNode);
    const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nextLevelId);
    displayField = levelConfig?.fields?.[0]?.name || '名称';
  }

  parentNode.expanded = true;

  editDialog.value = {
    visible: true,
    mode: 'add',
    scope: 'hierarchy',
    nodeName: '',
    targetNode: { ...parentNode },
    nextLevelId,
    displayField
  };

  closeContextMenu();
}

/** 编辑节点 */
async function handleEditNode(node: TreeNodeData) {
  const hierarchyNode = node as HierarchyTreeNodeData;
  const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === hierarchyNode.node_type_id);
  const displayField = levelConfig?.fields?.[0]?.name || '名称';
  editDialog.value = {
    visible: true,
    mode: 'edit',
    scope: 'hierarchy',
    nodeName: node[displayField] || node.name || '',
    targetNode: node,
    nextLevelId: '',
    displayField
  };
  closeContextMenu();
}

/** 删除节点 */
async function handleDeleteNode(node: TreeNodeData) {
  const hasChildren = node.children && node.children.length > 0;
  const message = hasChildren
    ? '该节点包含子节点，是否同时删除所有子节点？'
    : '确定删除该节点吗？';

  await confirmDelete({
    title: '确认删除',
    message,
    onConfirm: async () => {
      await systemDesignStore.deleteHierarchyNode(node.id);
      await loadTreeData();
    },
    successMessage: '删除成功'
  });

  closeContextMenu();
}

/**
 * 获取下一个层级的类型ID
 * @param {TreeNodeData} currentNode - 当前节点
 * @returns {string} 下一层级的类型ID
 */
function getNextLevelTypeId(currentNode: TreeNodeData): string {
  const hierarchyNode = currentNode as HierarchyTreeNodeData;
  const levels = hierarchyConfigStore.sortedLevels;
  const currentIndex = levels.findIndex(l => l.id === hierarchyNode.node_type_id);

  if (currentIndex < levels.length - 1) {
    return levels[currentIndex + 1].id;
  }
  return levels[currentIndex]?.id || hierarchyNode.node_type_id || '';
}

/**
 * 获取第一个层级的类型ID
 * @returns {string} 第一个层级的类型ID
 */
function getFirstLevelTypeId(): string {
  const levels = hierarchyConfigStore.sortedLevels;
  return levels[0]?.id || '';
}

/**
 * 检查节点名称是否重复
 * @param name 待检查的节点名称（已去空格）
 * @param parentId 父节点ID
 * @param displayField 显示字段名
 * @param excludeNodeId 排除的节点ID（编辑时排除自己）
 * @returns 是否重复
 */
function isNodeNameDuplicate(name: string, parentId: string | null, displayField: string, excludeNodeId?: string): boolean {
  // 从缓存中获取所有节点数据
  const allNodes = systemDesignStore.hierarchyNodes || [];

  // 找出同级节点（父节点相同的节点）
  const siblings = allNodes.filter(node => {
    if (excludeNodeId && node.id === excludeNodeId) return false; // 排除自己
    return node.parent_id === parentId;
  });

  // 检查是否有重复名称（去空格后比较）
  return siblings.some(node => {
    const nodeName = String(node[displayField] || node.name || '').trim();
    return nodeName === name;
  });
}

/** 确认对话框 */
async function handleDialogConfirm(name: string) {
  // 添加空值检查，防止按回车时传递空值
  const trimmedName = String(name || '').trim();

  if (!trimmedName) {
    ElMessage.warning('请输入节点名称');
    return;
  }

  const { mode, targetNode, nextLevelId, displayField, scope, parentCategoryId, targetCategoryId, packetCategoryId } = editDialog.value;

  if (scope === 'packet-message') {
    const createdRes = await postMessageDraftCreate({
      name: trimmedName,
      category_id: packetCategoryId || null,
      description: '',
      fields: []
    });
    if (createdRes?.status !== 'success' || !createdRes.datum?.id) {
      throw new Error(createdRes?.message || '创建报文草稿失败');
    }
    const draft_id = String(createdRes.datum.id);
    ElMessage.success('新增成功');
    editDialog.value.visible = false;
    isNavigating = true;
    router.push({
      path: '/editor/ide/protocol',
      query: buildEditorQuery('protocol', draft_id, { mode: 'draft' })
    }).finally(() => {
      isNavigating = false;
    });
    await loadTreeData();
    return;
  }

  if (scope === 'packet-category') {
    if (mode === 'add') {
      const id = generateCategoryId();
      const res = await createCategory({
        id,
        parent_id: parentCategoryId,
        name: trimmedName,
        description: '',
        sort_order: 0
      });
      if (res?.status !== 'success') {
        throw new Error(res?.message || '创建分类失败');
      }
      ElMessage.success('新增成功');
    } else {
      if (!targetCategoryId) {
        ElMessage.warning('分类ID缺失，无法编辑');
        return;
      }
      const res = await updateCategory({
        id: targetCategoryId,
        name: trimmedName
      });
      if (res?.status !== 'success') {
        throw new Error(res?.message || '更新分类失败');
      }
      ElMessage.success('编辑成功');
    }
    editDialog.value.visible = false;
    await loadTreeData();
    return;
  }

  // 体系层级 - 检查节点名称重复
  if (scope === 'hierarchy') {
    // 确定父节点ID
    const parentId = mode === 'add' ? targetNode.id : targetNode.parent_id;

    // 检查重复
    const isDuplicate = isNodeNameDuplicate(trimmedName, parentId, displayField, mode === 'edit' ? targetNode.id : undefined);

    if (isDuplicate) {
      ElMessage.error(`节点名称"${trimmedName}"已存在，请使用其他名称`);
      return;
    }

    // 执行新增或编辑操作
    if (mode === 'add') {
      await systemDesignStore.addHierarchyNode(
        targetNode.id,
        nextLevelId,
        { [displayField]: trimmedName }
      );
    } else {
      const field = displayField || '名称';
      await systemDesignStore.updateHierarchyNode(
        targetNode.id,
        { [field]: trimmedName }
      );
    }

    ElMessage.success(mode === 'add' ? '新增成功' : '编辑成功');
    editDialog.value.visible = false;
    await loadTreeData();
  }
}

/** 处理导出数据 */
async function handleExportData(data: { hierarchy?: string[]; protocols?: string[] }) {
  try {
    const res = await exportData(data);
    if (res?.status === 'success' && res.datum?.download_url) {
      downloadFile(res.datum.download_url, res.datum.file_name || 'data-export.zip');
      ElMessage.success('导出成功');
      exportDialogVisible.value = false;
    } else {
      throw new Error(res?.message || '导出失败');
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  }
}

/** 处理导入数据 */
async function handleImportData(file: File, strategy: string) {
  try {
    const res = await importDataApi(file, strategy);
    if (res?.status === 'success') {
      const summary = res.datum || {};
      const parts = [];
      if (summary.hierarchy) {
        parts.push(`体系层级：新增 ${summary.hierarchy.created} 条，更新 ${summary.hierarchy.updated} 条`);
      }
      if (summary.protocols) {
        parts.push(`协议集：新增 ${summary.protocols.created} 条，更新 ${summary.protocols.updated} 条`);
      }
      ElMessage.success(`导入成功！${parts.join('；')}`);
      importDialogVisible.value = false;
      await loadTreeData();
    } else {
      throw new Error(res?.message || '导入失败');
    }
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error(error instanceof Error ? error.message : '导入失败');
  }
}

onMounted(() => {
  loadTreeData();
});

// 监听导出弹窗打开
watch(exportDialogVisible, async (visible) => {
  if (visible) {
    try {
      const res = await getExportPreview();
      if (res?.status === 'success' && res.datum) {
        exportPreviewData.value = res.datum;
      } else {
        exportPreviewData.value = {};
      }
    } catch (error) {
      console.error('获取导出预览失败:', error);
      exportPreviewData.value = {};
    }
  }
});
</script>
