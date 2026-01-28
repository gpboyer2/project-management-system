<!--
  逻辑编辑器统计信息组件
  显示节点数量和连接数量
-->
<template>
  <div class="ide-logic-stats">
    <span class="ide-logic-stat-item">
      <svg
        class="ide-logic-stat-icon"
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
          rx="2"
          ry="2"
        />
      </svg>
      {{ nodeCount }} 节点
    </span>

    <span class="ide-logic-stat-item">
      <svg
        class="ide-logic-stat-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />

        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      {{ edgeCount }} 连接
    </span>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  nodeCount: number
  edgeCount: number
}>();
</script>

<style lang="scss" src="./index.scss"></style>
