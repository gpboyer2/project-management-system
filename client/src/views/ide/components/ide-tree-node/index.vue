<!--
  树节点组件
  用于资源管理器的层级树展示
-->
<template>
  <div class="ide-tree-node">
    <!-- 节点内容行 -->
    <div
      class="ide-tree-node-content"
      :class="{
        'ide-tree-node-content--selected': isSelected,
        'ide-tree-node-content--context-menu': hasContextMenu
      }"
      :style="{ paddingLeft: paddingStyle }"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- 展开/折叠按钮 -->
      <span class="ide-tree-node-toggle" @click="handleToggle">
        <svg
          v-if="hasChildren"
          class="ide-tree-node-toggle-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline :points="isExpanded ? '6 9 12 15 18 9' : '9 6 15 12 9 18'" />
        </svg>

        <span v-else class="ide-tree-node-spacer" />
      </span>

      <!-- 图标 -->
      <component :is="iconResult.iconComponent" class="ide-tree-node-icon" :class="iconResult.iconClass" />

      <!-- 标签 -->
      <span class="ide-tree-node-label">
        {{ iconResult.displayName }}

        <!-- 草稿标记 -->
        <span v-if="isDraftNode" class="ide-tree-node-draft-tag">草稿</span>
      </span>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="ide-tree-node-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-id="selectedId"
        :hierarchy-level-map="hierarchyLevelMap"
        :context-menu-node-id="contextMenuNodeId"
        @toggle="$emit('toggle', $event)"
        @contextmenu="(event, node) => $emit('contextmenu', event, node)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';
import { useRouter } from 'vue-router';
import type { TreeNodeData, HierarchyTreeNodeData } from '@/types';
import { NodeType } from '@/types';
import { getTreeNodeIcon } from '@/utils/useTreeNodeIcon';
import { buildEditorQuery } from '@/utils/routeParamHelper';
import { resolvePacketId } from '@/utils/idUtils';
import { isHierarchyTreeNode, isProtocolTreeNode } from '@/utils/treeNodeUtils';

// 设置组件名称，用于递归渲染
defineOptions({
  name: 'TreeNode'
});

const props = defineProps({
  node: {
    type: Object as PropType<TreeNodeData>,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  selectedId: {
    type: [String, Object] as PropType<string | Set<string> | null>,
    default: null
  },
  hierarchyLevelMap: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  contextMenuNodeId: {
    type: String as PropType<string | null>,
    default: null
  }
});

const emit = defineEmits<{
  (e: 'toggle', node: TreeNodeData): void
  (e: 'contextmenu', event: MouseEvent, node: TreeNodeData): void
}>();

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isExpanded = computed(() => props.node.expanded);

// 支持单选和多选
const isSelected = computed(() => {
  if (!props.selectedId) return false;

  // 如果是 Set 类型，检查是否在集合中
  if (props.selectedId instanceof Set) {
    return props.selectedId.has(props.node.id);
  }

  // 否则使用直接比较
  return props.selectedId === props.node.id;
});

// 右键轮廓状态
const hasContextMenu = computed(() => {
  return props.contextMenuNodeId === props.node.id;
});

const paddingStyle = computed(() => `${props.level * 16 + 8}px`);

const levelConfig = computed(() => {
  const hierarchyNode = props.node as HierarchyTreeNodeData;
  if (hierarchyNode.node_type_id && props.hierarchyLevelMap) {
    return props.hierarchyLevelMap[hierarchyNode.node_type_id];
  }
  return null;
});

// 获取节点图标信息
const iconResult = computed(() =>
  getTreeNodeIcon(props.node, props.hierarchyLevelMap, isExpanded.value)
);

// 判断是否为草稿节点
const isDraftNode = computed(() => {
  return isProtocolTreeNode(props.node) && props.node.is_draft === true;
});

// 路由实例
const router = useRouter();

// 导航锁：防止快速点击导致路由竞态
let isNavigating = false;

/**
 * 检查是否启用通信节点列表
 * @returns {boolean} 是否启用通信节点列表
 */
function hasCommNodeList() {
  if (levelConfig.value) {
    return !!levelConfig.value.enable_comm_node_list;
  }
  return false;
}

/**
 * 处理节点点击事件，根据节点类型跳转到对应页面
 * @returns {Promise<void>}
 */
function handleClick() {
  // 导航锁：防止快速点击导致组件加载竞态
  if (isNavigating) {
    return;
  }

  // 构建目标路由：path + query
  let targetPath: string | null = null;
  let targetQuery: Record<string, string> = {};

  // 协议算法节点：跳转到协议编辑器
  if (isProtocolTreeNode(props.node)) {
    const packetId = resolvePacketId(props.node);
    if (packetId) {
      targetPath = '/editor/ide/protocol';
      // 如果是草稿节点，自动添加 mode=draft 参数
      const extraParams = props.node.is_draft ? { mode: 'draft' } : {};
      targetQuery = buildEditorQuery('protocol', packetId, extraParams);
    }
  }
  // 体系层级节点：根据层级配置判断跳转到哪个页面
  else if (isHierarchyTreeNode(props.node)) {
    // 启用通信节点列表的层级（如"软件"）：跳转到完整的节点编辑器
    // 未启用的层级：跳转到简化的层级概览页面
    if (hasCommNodeList()) {
      targetPath = '/editor/ide/logic';
      targetQuery = buildEditorQuery('logic', props.node.id);
    } else {
      targetPath = '/editor/ide/hierarchy';
      targetQuery = buildEditorQuery('hierarchy', props.node.id);
    }
  }

  if (targetPath) {
    isNavigating = true;
    router.push({
      path: targetPath,
      query: targetQuery
    }).finally(() => {
      isNavigating = false;
    });
  }
}

/**
 * 处理节点展开/折叠事件
 * @param {Event} e - 事件对象
 * @returns {void}
 */
function handleToggle(e: Event) {
  e.stopPropagation();
  emit('toggle', props.node);
}

/**
 * 处理右键菜单事件
 * @param {MouseEvent} event - 鼠标事件对象
 * @returns {void}
 */
function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.node);
}
</script>

<style lang="scss" src="./index.scss"></style>
