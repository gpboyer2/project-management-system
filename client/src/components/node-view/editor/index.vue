<template>
  <!-- vis-network风格的控制器（已隐藏） -->
  <div v-show="false" class="vis-navigation">
    <!-- 方向控制 -->
    <div class="vis-navigation-left">
      <div
        class="vis-button vis-up"
        title="向上"
        @click="moveUp"
      />

      <div
        class="vis-button vis-down"
        title="向下"
        @click="moveDown"
      />

      <div
        class="vis-button vis-left"
        title="向左"
        @click="moveLeft"
      />

      <div
        class="vis-button vis-right"
        title="向右"
        @click="moveRight"
      />
    </div>
    <!-- 缩放控制 -->
    <div class="vis-navigation-right">
      <div
        class="vis-button vis-zoomIn"
        title="放大"
        @click="zoomIn"
      />

      <div
        class="vis-button vis-zoomOut"
        title="缩小"
        @click="zoomOut"
      />

      <div
        class="vis-button vis-zoomExtends"
        title="适应屏幕"
        @click="fitToScreen"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 控制器组件 - 使用 Options API 保持原有逻辑
// 此组件为 LogicFlow 编辑器提供缩放和移动控制
</script>

<style lang="scss" src="./index.scss"></style>