<!--
  报文编辑器工具栏组件
  负责报文编辑页面的工具栏操作
-->
<template>
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <span class="editor-mode-label" />
    </div>

    <div class="toolbar-right">
      <button
        class="toolbar-btn"
        title="保存"
        :disabled="isViewMode"
        @click="handleSave"
      >
        <span class="btn-icon">
          <el-icon><Select /></el-icon>
        </span>

        <span class="btn-text">
          保存
        </span>
      </button>

      <button class="toolbar-btn" title="返回" @click="handleBack">
        <span class="btn-icon">
          <el-icon><ArrowLeft /></el-icon>
        </span>

        <span class="btn-text">
          返回
        </span>
      </button>

      <button
        class="toolbar-btn"
        title="代码"
        @click="handleGenerateCode"
      >
        <span class="btn-icon">
          <el-icon><Document /></el-icon>
        </span>

        <span class="btn-text">
          代码
        </span>
      </button>

      <button
        class="toolbar-btn"
        title="仿真"
        @click="handleSimulate"
      >
        <span class="btn-icon">
          <el-icon><VideoPlay /></el-icon>
        </span>

        <span class="btn-text">
          仿真
        </span>
      </button>

      <button
        class="toolbar-btn toolbar-btn-primary"
        title="发布"
        :disabled="isViewMode"
        @click="handlePublish"
      >
        <span class="btn-icon">
          <el-icon><Promotion /></el-icon>
        </span>

        <span class="btn-text">
          发布
        </span>
      </button>

      <button
        v-if="showDiscardDraft"
        class="toolbar-btn toolbar-btn-danger"
        title="放弃草稿"
        @click="handleDiscardDraft"
      >
        <span class="btn-icon">
          <el-icon><CircleCloseFilled /></el-icon>
        </span>

        <span class="btn-text">
          放弃草稿
        </span>
      </button>

      <button
        v-if="isViewMode"
        class="toolbar-btn toolbar-btn-primary"
        title="创建修订草稿"
        @click="handleCreateRevision"
      >
        <span class="btn-icon">
          <el-icon><Edit /></el-icon>
        </span>

        <span class="btn-text">
          创建修订草稿
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Select, ArrowLeft, Document, VideoPlay, Promotion, CircleCloseFilled, Edit } from '@element-plus/icons-vue';

interface Props {
  isViewMode: boolean;
  showDiscardDraft: boolean;
}

interface Emits {
  (e: 'save'): void;
  (e: 'back'): void;
  (e: 'generate-code'): void;
  (e: 'simulate'): void;
  (e: 'publish'): void;
  (e: 'discard-draft'): void;
  (e: 'create-revision'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * 处理保存操作
 * @returns {void}
 */
function handleSave() {
  emit('save');
}

/**
 * 处理返回操作
 * @returns {void}
 */
function handleBack() {
  emit('back');
}

/**
 * 处理代码生成操作
 * @returns {void}
 */
function handleGenerateCode() {
  emit('generate-code');
}

/**
 * 处理仿真操作
 * @returns {void}
 */
function handleSimulate() {
  emit('simulate');
}

/**
 * 处理发布操作
 * @returns {void}
 */
function handlePublish() {
  emit('publish');
}

/**
 * 处理放弃草稿操作
 * @returns {void}
 */
function handleDiscardDraft() {
  emit('discard-draft');
}

/**
 * 处理创建修订草稿操作
 * @returns {void}
 */
function handleCreateRevision() {
  emit('create-revision');
}
</script>

<style lang="scss" src="./index.scss"></style>
