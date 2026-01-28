<!--
  逻辑编辑器工具栏组件
  包含保存、布局、网格、缩放、仿真等操作按钮
-->
<template>
  <div class="ide-logic-toolbar">
    <div class="ide-logic-toolbar-group">
      <button
        class="ide-logic-toolbar-btn"
        title="保存 (Ctrl+S)"
        @click="handleSave"
      >
        <el-icon class="ide-logic-toolbar-icon"><Select /></el-icon>

        <span>保存</span>
      </button>

      <button
        class="ide-logic-toolbar-btn"
        title="自动布局"
        @click="handleAutoLayout"
      >
        <svg
          class="ide-logic-toolbar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
          />

          <rect
            x="14"
            y="3"
            width="7"
            height="7"
          />

          <rect
            x="14"
            y="14"
            width="7"
            height="7"
          />

          <rect
            x="3"
            y="14"
            width="7"
            height="7"
          />
        </svg>

        <span>布局</span>
      </button>
    </div>

    <div class="ide-logic-toolbar-divider" />

    <div class="ide-logic-toolbar-group">
      <button
        class="ide-logic-toolbar-btn"
        :class="{ 'ide-logic-toolbar-btn-active': showGrid }"
        title="显示网格"
        @click="handleToggleGrid"
      >
        <svg
          class="ide-logic-toolbar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
          />

          <line
            x1="3"
            y1="9"
            x2="21"
            y2="9"
          />

          <line
            x1="3"
            y1="15"
            x2="21"
            y2="15"
          />

          <line
            x1="9"
            y1="3"
            x2="9"
            y2="21"
          />

          <line
            x1="15"
            y1="3"
            x2="15"
            y2="21"
          />
        </svg>
      </button>

      <button
        class="ide-logic-toolbar-btn"
        title="放大"
        @click="handleZoomIn"
      >
        <el-icon class="ide-logic-toolbar-icon"><ZoomIn /></el-icon>
      </button>

      <button
        class="ide-logic-toolbar-btn"
        title="缩小"
        @click="handleZoomOut"
      >
        <el-icon class="ide-logic-toolbar-icon"><ZoomOut /></el-icon>
      </button>

      <button
        class="ide-logic-toolbar-btn"
        title="适应画布"
        @click="handleFitView"
      >
        <el-icon class="ide-logic-toolbar-icon"><FullScreen /></el-icon>
      </button>
    </div>

    <div class="ide-logic-toolbar-divider" />

    <div class="ide-logic-toolbar-group">
      <button
        class="ide-logic-toolbar-btn ide-logic-toolbar-btn-primary"
        title="仿真运行"
        @click="handleSimulate"
      >
        <el-icon class="ide-logic-toolbar-icon"><VideoPlay /></el-icon>

        <span>仿真</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Select, ZoomIn, ZoomOut, FullScreen, VideoPlay } from '@element-plus/icons-vue';

// Props
defineProps<{
  showGrid: boolean
}>();

// Emits
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'auto-layout'): void
  (e: 'toggle-grid'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'fit-view'): void
  (e: 'simulate'): void
}>();

// 保存
/**
 * 处理保存操作
 * @returns {void}
 */
function handleSave() {
  emit('save');
}

// 自动布局
/**
 * 处理自动布局操作
 * @returns {void}
 */
function handleAutoLayout() {
  emit('auto-layout');
}

// 切换网格
/**
 * 处理切换网格显示操作
 * @returns {void}
 */
function handleToggleGrid() {
  emit('toggle-grid');
}

// 放大
/**
 * 处理放大操作
 * @returns {void}
 */
function handleZoomIn() {
  emit('zoom-in');
}

// 缩小
/**
 * 处理缩小操作
 * @returns {void}
 */
function handleZoomOut() {
  emit('zoom-out');
}

// 适应画布
/**
 * 处理适应画布操作
 * @returns {void}
 */
function handleFitView() {
  emit('fit-view');
}

// 仿真运行
/**
 * 处理仿真运行操作
 * @returns {void}
 */
function handleSimulate() {
  emit('simulate');
}
</script>

<style lang="scss" src="./index.scss"></style>
