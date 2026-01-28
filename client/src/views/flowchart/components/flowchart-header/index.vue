<!--
  流程图顶部工具栏组件
  包含返回按钮、保存/导出/导入、画布操作、统计信息等
-->
<template>
  <div class="flowchart-header">
    <div class="header-left">
      <!-- 返回按钮 -->
      <el-button
        class="header-button back-button"
        title="返回体系配置"
        link
        @click="handleGoBack"
      >
        <el-icon><ArrowLeft /></el-icon>

        <span>返回</span>
      </el-button>

      <span class="header-title">
        通信协议流程画布
      </span>

      <!-- 通信节点名称（可编辑） -->
      <div class="comm-node-name-editor">
        <input
          :model-value="compOptions.commNodeName"
          type="text"
          class="comm-node-name-input"
          placeholder="未命名节点"
          @blur="handleUpdateName($event)"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
        />
      </div>
    </div>

    <!-- 中间操作按钮组 -->
    <div class="header-center">
      <!-- 流程操作组 -->
      <div class="button-group">
        <el-button
          class="header-button"
          title="保存流程"
          link
          @click="handleSave"
        >
          <el-icon><DocumentChecked /></el-icon>

          <span>保存</span>
        </el-button>

        <el-button
          class="header-button"
          title="导出流程"
          link
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>

          <span>导出</span>
        </el-button>

        <el-button
          class="header-button"
          title="导入流程"
          link
          @click="handleImport"
        >
          <el-icon><Upload /></el-icon>

          <span>导入</span>
        </el-button>
      </div>

      <!-- 画布操作组 -->
      <div class="button-group">
        <el-button
          class="header-button"
          title="全选"
          link
          @click="handleSelectAll"
        >
          <el-icon><Select /></el-icon>

          <span>全选</span>
        </el-button>

        <el-button
          class="header-button"
          title="自动布局"
          link
          @click="handleAutoLayout"
        >
          <el-icon><MagicStick /></el-icon>

          <span>布局</span>
        </el-button>

        <el-button
          class="header-button"
          title="清空画布"
          link
          @click="handleClear"
        >
          <el-icon><Delete /></el-icon>

          <span>清空</span>
        </el-button>
      </div>

      <!-- 视图控制组 -->
      <div class="button-group">
        <el-button
          class="header-button"
          :class="{ active: compOptions.showGrid }"
          title="显示网格"
          link
          @click="handleToggleGrid"
        >
          <el-icon><Grid /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="header-right">
      <div class="header-stats">
        <span class="stat-item">
          <el-icon><Box /></el-icon>
          节点: {{ compOptions.nodeCount }}
        </span>

        <span class="stat-item">
          <el-icon><Link /></el-icon>
          连接: {{ compOptions.edgeCount }}
        </span>
      </div>

      <!-- 属性面板按钮 -->
      <div class="header-settings">
        <el-button
          class="header-button"
          :class="{ active: compOptions.showProperties }"
          title="属性面板"
          link
          @click="handleToggleProperties"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  DocumentChecked,
  Download,
  Upload,
  Select,
  MagicStick,
  Delete,
  Link,
  Grid,
  Box,
  Setting
} from '@element-plus/icons-vue';
import { ElButton } from 'element-plus';

/**
 *
 * 流程图头部配置选项
 *
 */
interface FlowchartHeaderOptions {
  commNodeName?: string
  nodeCount: number
  edgeCount: number
  showGrid: boolean
  showProperties: boolean
}

// Props
defineProps<{
  compOptions: FlowchartHeaderOptions;
}>();

// Emits
const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'save'): void
  (e: 'export'): void
  (e: 'import'): void
  (e: 'select-all'): void
  (e: 'auto-layout'): void
  (e: 'clear'): void
  (e: 'toggle-grid'): void
  (e: 'toggle-properties'): void
  (e: 'update-name', name: string): void
}>();

/**
 * 处理返回
 */
function handleGoBack(): void {
  emit('go-back');
}

/**
 * 处理保存
 */
function handleSave(): void {
  emit('save');
}

/**
 * 处理导出
 */
function handleExport(): void {
  emit('export');
}

/**
 * 处理导入
 */
function handleImport(): void {
  emit('import');
}

/**
 * 处理全选
 */
function handleSelectAll(): void {
  emit('select-all');
}

/**
 * 处理自动布局
 */
function handleAutoLayout(): void {
  emit('auto-layout');
}

/**
 * 处理清空
 */
function handleClear(): void {
  emit('clear');
}

/**
 * 处理切换网格
 */
function handleToggleGrid(): void {
  emit('toggle-grid');
}

/**
 * 处理切换属性面板
 */
function handleToggleProperties(): void {
  emit('toggle-properties');
}

/**
 * 处理更新名称
 * @param {Event} event - 输入事件对象
 */
function handleUpdateName(event: Event): void {
  const input = event.target as HTMLInputElement;
  emit('update-name', input.value);
}
</script>

<style lang="scss" src="./index.scss"></style>
