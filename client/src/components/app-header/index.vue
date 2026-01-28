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
        <!-- 操作菜单 -->
        <el-dropdown trigger="hover" @command="handleActionMenuCommand">
          <button class="ide-header-menu-item">
            操作
          </button>

          <template #dropdown>
            <el-dropdown-menu class="ide-header-dropdown">
              <el-dropdown-item command="save">
                <el-icon class="ide-header-dropdown-icon"><ArrowRight /></el-icon>
                保存
              </el-dropdown-item>

              <el-dropdown-item command="publish">
                <el-icon class="ide-header-dropdown-icon"><Upload /></el-icon>
                发布
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 视图菜单 -->
        <el-dropdown trigger="hover" @command="handleViewMenuCommand">
          <button class="ide-header-menu-item">
            视图
          </button>

          <template #dropdown>
            <el-dropdown-menu class="ide-header-dropdown">
              <el-dropdown-item command="topology">
                <el-icon class="ide-header-dropdown-icon"><Share /></el-icon>
                拓扑展示
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 体系层级与协议管理 -->
        <router-link 
          to="/editor/ide/dashboard" 
          class="ide-header-menu-item"
          :class="{ 'is-active': isDashboardActive }"
        >
          体系层级与协议管理
        </router-link>
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
  ArrowRight,
  Upload,
  Share
} from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const emit = defineEmits<{
  (e: 'open-build'): void
  (e: 'action-save'): void
  (e: 'action-publish'): void
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

// 判断是否在 dashboard 或 editor/ide 相关页面
const isDashboardActive = computed(() => {
  return route.path === '/editor/ide/dashboard' || route.path === '/editor/ide';
});

// 仅在 IDE 路由下显示构建入口
const showBuild = computed(() => {
  return route.path.startsWith('/editor/ide');
});

/**
 * 处理操作菜单命令
 * @param {string} command - 菜单命令
 */
function handleActionMenuCommand(command: string) {
  switch (command) {
    case 'save':
      emit('action-save');
      break;
    case 'publish':
      emit('action-publish');
      break;
  }
}

/**
 * 处理视图菜单命令
 * @param {string} command - 菜单命令
 */
function handleViewMenuCommand(command: string) {
  switch (command) {
    case 'topology':
      router.push('/topology-display');
      break;
  }
}

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
