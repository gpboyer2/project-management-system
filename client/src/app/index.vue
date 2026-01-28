<template>
  <BasicLayout v-if="useBasicLayout" />

  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BasicLayout from '@/layouts/basic-layout/index.vue';

const route = useRoute();

// 不需要 BasicLayout 的路由（IDE 页面有自己的完整布局）
const noLayoutRouteList = ['/login', '/', '/editor'];

/**
 * 判断当前路由是否需要使用 BasicLayout
 * @description 根据路由路径判断是否使用基础布局，IDE页面有自己的完整布局不需要BasicLayout
 * @returns {boolean} 是否使用 BasicLayout
 */
const useBasicLayout = computed(() => {
  // 规范化路径：空字符串视为根路径
  const normalizedPath = route.path || '/';
  // 检查路由是否以 noLayoutRouteList 中的路径开头
  return !noLayoutRouteList.some(prefix => normalizedPath === prefix || normalizedPath.startsWith(prefix + '/'));
});
</script>

<style lang="scss" src="./index.scss"></style>
