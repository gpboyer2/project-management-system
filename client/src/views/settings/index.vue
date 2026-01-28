<template>
  <div class="settings-page">
    <!-- 左侧导航 -->
    <div class="settings-sidebar">
      <div class="settings-sidebar-header">
        <el-icon class="settings-sidebar-icon"><Setting /></el-icon>

        <span class="settings-sidebar-title">
          系统设置
        </span>
      </div>

      <div class="settings-nav">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="settings-nav-item"
          :class="{ 'settings-nav-item--active': activeSection === item.key }"
          @click="handleNavClick(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>

          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="settings-main">
      <!-- 基础设置 -->
      <div v-show="activeSection === 'basic'" class="settings-section">
        <BasicSettings ref="basicSettingsRef" />
      </div>

      <!-- 安全设置 -->
      <div v-show="activeSection === 'security'" class="settings-section">
        <SecuritySettings ref="securitySettingsRef" />
      </div>

      <!-- 通知设置 -->
      <div v-show="activeSection === 'notification'" class="settings-section">
        <NotificationSettings ref="notificationSettingsRef" />
      </div>

      <!-- 用户管理 -->
      <div v-show="activeSection === 'user'" class="settings-section settings-section--full">
        <UserManagement />
      </div>

      <!-- 层级配置 -->
      <div v-show="activeSection === 'hierarchy'" class="settings-section settings-section--full">
        <HierarchySettings />
      </div>

      <!-- 数据管理 -->
      <div v-show="activeSection === 'data'" class="settings-section settings-section--full">
        <DatabaseManager />
      </div>

      <!-- 底部操作栏（仅基础设置、安全设置、通知设置显示） -->
      <div v-show="['basic', 'security', 'notification'].includes(activeSection)" class="settings-footer">
        <el-button @click="resetSettings">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>

        <el-button type="primary" @click="saveSettings">
          <el-icon><ArrowRight /></el-icon>
          保存设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElButton, ElMessage } from 'element-plus';
import { Setting, Refresh, ArrowRight, Position, Lock, Bell, User, Share, Coin } from '@element-plus/icons-vue';
import BasicSettings from './basic/index.vue';
import SecuritySettings from './security/index.vue';
import NotificationSettings from './notification/index.vue';
import UserManagement from '@/views/settings/user/index.vue';
import HierarchySettings from '@/views/hierarchy-settings/index.vue';
import DatabaseManager from '@/views/database-manager/index.vue';

interface NavItem {
  key: string;
  label: string;
  icon: any;
}

const router = useRouter();
const route = useRoute();

const navItems: NavItem[] = [
  { key: 'basic', label: '基础设置', icon: Position },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'notification', label: '通知设置', icon: Bell },
  { key: 'user', label: '用户管理', icon: User },
  { key: 'hierarchy', label: '层级配置', icon: Share },
  { key: 'data', label: '数据管理', icon: Coin }
];

const activeSection = ref('basic');

const basicSettingsRef = ref<InstanceType<typeof BasicSettings>>();
const securitySettingsRef = ref<InstanceType<typeof SecuritySettings>>();
const notificationSettingsRef = ref<InstanceType<typeof NotificationSettings>>();

/**
 * 从路由路径获取当前的 section 标识
 * @param {string} path - 路由路径
 * @returns {string} section 标识，默认返回 'basic'
 */
function getSectionFromPath(path: string): string {
  const match = path.match(/\/settings\/(\w+)/);
  return match ? match[1] : 'basic';
}

// 监听路由变化更新 activeSection
watch(() => route.path, (newPath) => {
  activeSection.value = getSectionFromPath(newPath);
}, { immediate: true });

/**
 * 处理导航项点击事件
 * @param {string} key - 导航项的键值
 * @returns {void}
 */
function handleNavClick(key: string) {
  router.push(`/settings/${key}`);
}

/**
 * 保存设置项
 * @returns {void}
 */
function saveSettings() {
  ElMessage.success('设置已保存');
}

/**
 * 重置所有设置项为默认值
 * @returns {void}
 */
function resetSettings() {
  basicSettingsRef.value?.reset();
  securitySettingsRef.value?.reset();
  notificationSettingsRef.value?.reset();
  ElMessage.info('设置已重置');
}
</script>

<style lang="scss" src="./index.scss"></style>