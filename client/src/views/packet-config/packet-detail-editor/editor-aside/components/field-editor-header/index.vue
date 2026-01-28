<!--
  字段编辑器头部组件
  显示标题和关闭按钮
-->
<template>
  <div class="panel-header">
    <h3 class="panel-title">
      {{ title }}
    </h3>

    <button class="close-btn" @click="$emit('close')">
      <el-icon><Close /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';

interface Props {
  title?: string;
}

interface Emits {
  (e: 'close'): void;
}

withDefaults(defineProps<Props>(), {
  title: '字段属性'
});

defineEmits<Emits>();
</script>

<style lang="scss" src="./index.scss"></style>
