<template>
  <div class="cssc-basic-layout">
    <!-- 顶栏 -->
    <AppHeader @open-build="handleOpenBuild" />

    <!-- 主要内容区域 -->
    <main class="cssc-layout-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </main>

    <!-- 底栏 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import AppHeader from '@/components/app-header/index.vue';
import AppFooter from '@/components/app-footer/index.vue';

// 路由和状态
const route = useRoute();
const userStore = useUserStore();

/**
 * 打开构建弹窗
 * @description 处理构建弹窗的打开事件
 * @returns {void}
 */
function handleOpenBuild() {
  // TODO: 实现构建弹窗功能
  console.log('打开构建弹窗');
}

/**
 * 组件挂载完成后的生命周期钩子
 * @description 输出布局组件和用户状态相关的调试信息
 * @returns {void}
 */
onMounted(() => {
  console.log('[布局] BasicLayout 挂载完成:', {
    // @ts-expect-error Pinia options store 类型推导限制
    isLoggedIn: userStore.isLoggedIn,
    hasToken: !!userStore.token,
    hasUserInfo: !!userStore.userInfo,
    currentRoute: route.path,
    time: new Date().toLocaleTimeString()
  });
});
</script>

<style lang="scss" src="./index.scss"></style>
