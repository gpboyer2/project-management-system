<template>
  <div class="welcome-page">
    <div class="welcome-content">
      <h1 class="welcome-title">
        欢迎使用灵枢 IDE
      </h1>

      <p class="welcome-subtitle">
        请从左侧选择一个功能开始
      </p>

      <div class="quick-actions">
        <button class="action-button" @click="goToIde">
          <span class="button-icon">
            进入 IDE
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * 跳转到IDE仪表板页面
 * @returns {void} 无返回值
 */
function goToIde() {
  router.push('/editor/ide/dashboard');
}
</script>

<style lang="scss" src="./index.scss"></style>
