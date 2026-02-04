<!--
  应用级顶栏组件
  迁移自 ide-header
  包含：Logo、系统名称、菜单栏、搜索框、构建按钮、通知、用户
-->
<template>
  <header class="ide-header">
    <!-- 左侧区域 -->
    <div class="ide-header-left">
      <!-- Logo -->
      <router-link to="/" class="ide-header-logo">
        <img class="ide-header-logo-img" src="/images/lingshu-logo.png" alt="Lingshu Logo" />

        <span>Lingshu</span>
      </router-link>

      <!-- 系统名称 -->
      <div class="ide-header-system">
        {{ systemName }}
      </div>

      <!-- 菜单栏 -->
      <nav class="ide-header-menu">
        <!-- 项目管理 -->
        <router-link
          to="/project-management"
          class="ide-header-menu-item"
          :class="{ 'is-active': isProjectManagementActive }"
        >
          项目管理
        </router-link>

        <!-- 需求管理 -->
        <router-link
          to="/requirement-management"
          class="ide-header-menu-item"
          :class="{ 'is-active': isRequirementManagementActive }"
        >
          需求管理
        </router-link>

        <!-- 评审管理 -->
        <router-link
          to="/review-management"
          class="ide-header-menu-item"
          :class="{ 'is-active': isReviewManagementActive }"
        >
          评审管理
        </router-link>

        <!-- 管理菜单 -->
        <el-dropdown trigger="hover" @command="handleManageMenuCommand">
          <button class="ide-header-menu-item">
            管理
          </button>
          <template #dropdown>
            <el-dropdown-menu class="ide-header-dropdown">
              <el-dropdown-item command="requirement-type">
                <el-icon class="ide-header-dropdown-icon"><Document /></el-icon>
                需求类型管理
              </el-dropdown-item>
              <el-dropdown-item command="requirement-status">
                <el-icon class="ide-header-dropdown-icon"><Check /></el-icon>
                需求状态管理
              </el-dropdown-item>
              <el-dropdown-item command="process-node-type">
                <el-icon class="ide-header-dropdown-icon"><Setting /></el-icon>
                流程节点类型管理
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>
    </div>

    <!-- 中间区域 -->
    <div class="ide-header-center">
      <!-- 搜索框 -->
      <div class="ide-header-search">
        <el-icon class="ide-header-search-icon">
          <Search />
        </el-icon>

        <input
          id="global-search-input"
          ref="searchInputRef"
          v-model="searchQuery"
          name="search"
          type="text"
          class="ide-header-search-input"
          placeholder="搜索资源 (Ctrl+P)"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="ide-header-right">
      <template v-if="showBuild">
        <!-- 构建按钮 -->
        <button class="ide-header-build-btn" @click="handleOpenBuild">
          <svg
            class="ide-header-build-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>

          <span>构建交付</span>
        </button>

        <div class="ide-header-divider" />
      </template>

      <!-- 用户按钮 -->
      <el-dropdown trigger="click" @command="handleUserCommand">
        <button class="ide-header-icon-btn">
          <el-icon class="ide-header-icon-btn-icon">
            <User />
          </el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <div class="ide-header-user-name">
              {{ userName }}
            </div>

            <el-dropdown-item divided command="settings">
              系统设置
            </el-dropdown-item>

            <el-dropdown-item command="logout">
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Search,
  User,
  Document,
  Check,
  Setting
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const emit = defineEmits<{
  (e: 'open-build'): void
}>();

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 搜索相关
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');

// 系统名称（可以从 Store 或 API 获取）
const systemName = ref('系统1_v1.0');

// 用户名称
const userName = computed(() => userStore.userInfo?.username || '未登录');

// 判断是否在项目管理页面
const isProjectManagementActive = computed(() => {
  return route.path === '/project-management';
});

// 判断是否在需求管理页面
const isRequirementManagementActive = computed(() => {
  return route.path === '/requirement-management';
});

// 判断是否在评审管理页面
const isReviewManagementActive = computed(() => {
  return route.path === '/review-management';
});

// 仅在 IDE 路由下显示构建入口
const showBuild = computed(() => {
  return route.path.startsWith('/editor/ide');
});


/**
 * 处理搜索
 */
function handleSearch() {
  if (searchQuery.value.trim()) {
    ElMessage.info(`搜索: ${searchQuery.value}`);
    // 实现搜索逻辑
  }
}

/**
 * 打开构建弹窗
 */
function handleOpenBuild() {
  emit('open-build');
}

/**
 * 处理管理菜单命令
 * @param {string} command - 菜单命令
 */
function handleManageMenuCommand(command: string) {
  switch (command) {
    case 'requirement-type':
      router.push('/requirement-type-management');
      break;
    case 'requirement-status':
      router.push('/requirement-status-management');
      break;
    case 'process-node-type':
      router.push('/process-node-type-management');
      break;
  }
}

/**
 * 处理用户菜单命令
 * @param {string} command - 菜单命令
 */
function handleUserCommand(command: string) {
  switch (command) {
    case 'settings':
      router.push('/settings');
      break;
    case 'logout':
      // 调用 logout action
      (userStore as any).logout();
      router.push('/login');
      break;
  }
}

/**
 * 全局快捷键：Ctrl+P 聚焦搜索框
 * @param {KeyboardEvent} e - 键盘事件
 */
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<style lang="scss" src="./index.scss"></style>
