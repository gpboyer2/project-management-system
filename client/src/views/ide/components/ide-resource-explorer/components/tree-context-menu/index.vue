<!--
  树形右键菜单组件
  根据节点类型显示不同的操作选项
-->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="tree-context-menu-overlay"
      @click="handleClose"
      @mousedown="handleClose"
    >
      <div
        class="tree-context-menu"
        :style="{ top: compOptions.y + 'px', left: compOptions.x + 'px' }"
        @click.stop
        @mousedown.stop
      >
        <!-- 体系层级 -->
        <template v-if="isHierarchyNode">
          <div class="tree-context-menu-item" @click="handleAddChildNode">
            <el-icon><Plus /></el-icon>

            <span>新增子节点</span>
          </div>

          <template v-if="!isSystemHierarchyRoot">
            <div class="tree-context-menu-item" @click="handleEditNode">
              <el-icon><Edit /></el-icon>

              <span>编辑</span>
            </div>

            <div class="tree-context-menu-item" @click="handleExportHierarchyNode">
              <el-icon><Download /></el-icon>

              <span>导出</span>
            </div>

            <div class="tree-context-menu-item tree-context-menu-item--danger" @click="handleDeleteNode">
              <el-icon><DeleteFilled /></el-icon>

              <span>删除</span>
            </div>
          </template>
        </template>

        <!-- 协议集根：icd-bundles -->
        <template v-else-if="isIcdBundlesRoot">
          <div class="tree-context-menu-item" @click="handleAddPacketCategory">
            <el-icon><Plus /></el-icon>

            <span>新增分类</span>
          </div>

          <div class="tree-context-menu-item" @click="handleAddPacketMessage">
            <el-icon><Plus /></el-icon>

            <span>新增报文</span>
          </div>
        </template>

        <!-- 协议分类：packet_category -->
        <template v-else-if="isPacketCategoryNode">
          <div class="tree-context-menu-item" @click="handleAddPacketCategory">
            <el-icon><Plus /></el-icon>

            <span>新增分类</span>
          </div>

          <div class="tree-context-menu-item" @click="handleAddPacketMessage">
            <el-icon><Plus /></el-icon>

            <span>新增报文</span>
          </div>

          <div class="tree-context-menu-item" @click="handleEditPacketCategory">
            <el-icon><Edit /></el-icon>

            <span>编辑</span>
          </div>

          <div class="tree-context-menu-item" @click="handleExportProtocolCategory">
            <el-icon><Download /></el-icon>

            <span>导出</span>
          </div>

          <div class="tree-context-menu-item tree-context-menu-item--danger" @click="handleDeletePacketCategory">
            <el-icon><DeleteFilled /></el-icon>

            <span>删除</span>
          </div>
        </template>

        <!-- 报文：icd_message -->
        <template v-else-if="isIcdMessageNode">
          <div class="tree-context-menu-item" @click="handleOpenPacketMessage">
            <el-icon><Edit /></el-icon>

            <span>编辑</span>
          </div>

          <div class="tree-context-menu-item" @click="handleExportPacketMessage">
            <el-icon><Download /></el-icon>

            <span>导出</span>
          </div>

          <div class="tree-context-menu-item tree-context-menu-item--danger" @click="handleDeletePacketMessage">
            <el-icon><DeleteFilled /></el-icon>

            <span>删除</span>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Plus, Edit, Download, DeleteFilled } from '@element-plus/icons-vue';
import type { TreeNodeData } from '@/types';
import {
  isIcdBundlesRoot as checkIcdBundlesRoot,
  isPacketCategoryNode as checkPacketCategoryNode,
  isIcdMessageNode as checkIcdMessageNode,
  isHierarchyNode as checkHierarchyNode,
  isSystemHierarchyRoot as checkSystemHierarchyRoot
} from '@/utils/treeNodeUtils';

/** 树形右键菜单配置选项 */
interface TreeContextMenuOptions {
  x: number
  y: number
  targetNode: TreeNodeData | null
}

// Props
const props = defineProps<{
  visible: boolean
  compOptions: TreeContextMenuOptions;
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add-child-node', node: TreeNodeData): void
  (e: 'edit-node', node: TreeNodeData): void
  (e: 'delete-node', node: TreeNodeData): void
  (e: 'export-hierarchy-node', node: TreeNodeData): void
  (e: 'add-packet-category', node: TreeNodeData): void
  (e: 'add-packet-message', node: TreeNodeData): void
  (e: 'edit-packet-category', node: TreeNodeData): void
  (e: 'delete-packet-category', node: TreeNodeData): void
  (e: 'export-protocol-category', node: TreeNodeData): void
  (e: 'open-packet-message', node: TreeNodeData): void
  (e: 'delete-packet-message', node: TreeNodeData): void
  (e: 'export-packet-message', node: TreeNodeData): void
}>();

// 节点类型判断（复用 utils）
const isIcdBundlesRoot = computed(() => checkIcdBundlesRoot(props.compOptions.targetNode));
const isPacketCategoryNode = computed(() => checkPacketCategoryNode(props.compOptions.targetNode));
const isIcdMessageNode = computed(() => checkIcdMessageNode(props.compOptions.targetNode));
const isHierarchyNode = computed(() => checkHierarchyNode(props.compOptions.targetNode));
const isSystemHierarchyRoot = computed(() => checkSystemHierarchyRoot(props.compOptions.targetNode));

/**
 * 处理关闭菜单
 * @returns {void} 无返回值
 */
function handleClose(): void {
  emit('close');
}

/**
 * 处理新增子节点
 * @returns {void} 无返回值
 */
function handleAddChildNode(): void {
  if (props.compOptions.targetNode) {
    emit('add-child-node', props.compOptions.targetNode);
  }
}

/**
 * 处理编辑节点
 * @returns {void} 无返回值
 */
function handleEditNode(): void {
  if (props.compOptions.targetNode) {
    emit('edit-node', props.compOptions.targetNode);
  }
}

/**
 * 处理删除节点
 * @returns {void} 无返回值
 */
function handleDeleteNode(): void {
  if (props.compOptions.targetNode) {
    emit('delete-node', props.compOptions.targetNode);
  }
}

/**
 * 处理导出层级节点
 * @returns {void} 无返回值
 */
function handleExportHierarchyNode(): void {
  if (props.compOptions.targetNode) {
    emit('export-hierarchy-node', props.compOptions.targetNode);
  }
}

/**
 * 处理新增报文分类
 * @returns {void} 无返回值
 */
function handleAddPacketCategory(): void {
  if (props.compOptions.targetNode) {
    emit('add-packet-category', props.compOptions.targetNode);
  }
}

/**
 * 处理新增报文
 * @returns {void} 无返回值
 */
function handleAddPacketMessage(): void {
  if (props.compOptions.targetNode) {
    emit('add-packet-message', props.compOptions.targetNode);
  }
}

/**
 * 处理编辑报文分类
 * @returns {void} 无返回值
 */
function handleEditPacketCategory(): void {
  if (props.compOptions.targetNode) {
    emit('edit-packet-category', props.compOptions.targetNode);
  }
}

/**
 * 处理删除报文分类
 * @returns {void} 无返回值
 */
function handleDeletePacketCategory(): void {
  if (props.compOptions.targetNode) {
    emit('delete-packet-category', props.compOptions.targetNode);
  }
}

/**
 * 处理导出协议分类
 * @returns {void} 无返回值
 */
function handleExportProtocolCategory(): void {
  if (props.compOptions.targetNode) {
    emit('export-protocol-category', props.compOptions.targetNode);
  }
}

/**
 * 处理打开报文
 * @returns {void} 无返回值
 */
function handleOpenPacketMessage(): void {
  if (props.compOptions.targetNode) {
    emit('open-packet-message', props.compOptions.targetNode);
  }
}

/**
 * 处理删除报文
 * @returns {void} 无返回值
 */
function handleDeletePacketMessage(): void {
  if (props.compOptions.targetNode) {
    emit('delete-packet-message', props.compOptions.targetNode);
  }
}

/**
 * 处理导出报文
 * @returns {void} 无返回值
 */
function handleExportPacketMessage(): void {
  if (props.compOptions.targetNode) {
    emit('export-packet-message', props.compOptions.targetNode);
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
