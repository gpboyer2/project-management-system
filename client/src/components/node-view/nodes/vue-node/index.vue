<template>
  <div
    v-show="false"
    class="vue-node-container"
    data-desc="这个组件是一个 LogicFlow 技术演示组件，用于展示如何在 LogicFlow 画布中嵌入 Vue 组件"
    :style="properties.style"
    data-key="client/src/components/node-view/nodes/vue-node/index.vue"
  >
    <div>当前值：{{ text }}</div>

    <div class="vue-node-operator">
      <el-input v-model="increaseFactor" type="text" @keydown.stop />

      <el-button @mousedown.stop @click="$emit('btnClick', increaseFactor)">
        增加
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue 节点组件 - LogicFlow 内嵌 Vue 组件演示
// 此组件使用 Options API 实现，保留原有逻辑
</script>

<style lang="scss" src="./index.scss"></style>