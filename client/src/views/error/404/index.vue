<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-image">
        <img src="/error-404.svg" alt="404" onerror="this.style.display='none'" />

        <div class="error-number">
          404
        </div>
      </div>

      <h1>页面不存在</h1>

      <p>抱歉，您访问的页面不存在或已被移除</p>

      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          返回首页
        </el-button>

        <el-button @click="goBack">
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const router = useRouter();

/**
 * 返回首页
 */
function goHome() {
  router.push('/');
}

/**
 * 返回上一页
 */
function goBack() {
  router.back();
}
</script>

<style lang="scss" src="./index.scss"></style>