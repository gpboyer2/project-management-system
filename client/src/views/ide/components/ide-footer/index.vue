<!--
  IDE 底栏组件
  显示详细状态信息：Ready状态、Git分支、用户、保存时间、通知、编码、语言模式、系统资源
-->
<template>
  <footer class="ide-footer">
    <!-- 左侧区域 -->
    <div class="ide-footer-left">
      <!-- Ready 状态 -->
      <span class="ide-footer-item">
        <span class="ide-footer-status-dot" />

        <span>Ready</span>
      </span>

      <!-- Git 分支 -->
      <span class="ide-footer-item">
        <span>Git: {{ gitBranch }}</span>
      </span>

      <!-- 当前用户 -->
      <span class="ide-footer-item">
        <el-icon :size="10">
          <User />
        </el-icon>

        <span>{{ userName }}</span>
      </span>
    </div>

    <!-- 中间区域 -->
    <div class="ide-footer-center">
      <!-- 最后保存时间 -->
      <span class="ide-footer-item">
        <el-icon :size="10">
          <Clock />
        </el-icon>

        <span>{{ lastSaveTimeText }}</span>
      </span>

      <!-- 通知数量 -->
      <span v-if="notificationCount > 0" class="ide-footer-item">
        <el-icon :size="10">
          <Bell />
        </el-icon>

        <span>{{ notificationCount }}</span>

        <span class="ide-footer-notification-badge">
          !
        </span>
      </span>
    </div>

    <!-- 右侧区域 -->
    <div class="ide-footer-right">
      <!-- 编码格式 -->
      <span class="ide-footer-item">
        {{ encoding }}
      </span>

      <!-- 语言模式 -->
      <span class="ide-footer-item">
        {{ languageMode }}
      </span>

      <!-- 系统资源 -->
      <span class="ide-footer-item">
        <span>CPU: {{ cpuUsage }}%</span>
      </span>

      <span class="ide-footer-item">
        <span>MEM: {{ memUsage }}%</span>
      </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { User, Clock, Bell } from '@element-plus/icons-vue';
import { useUserStore, useNotificationStore, useIdeStore } from '@/stores';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const userStore = useUserStore();
const notificationStore = useNotificationStore();
const ideStore = useIdeStore();

// Git 分支
const gitBranch = ref('main');

// 用户名称
const userName = computed(() => userStore.userInfo?.username || '未登录');

// 通知数量
const notificationCount = computed(() => notificationStore.unreadCount || 0);

// 编码格式
const encoding = ref('UTF-8');

// 语言模式
const languageMode = ref('C++ Mode');

// 系统资源使用率（模拟数据）
const cpuUsage = ref(35);
const memUsage = ref(42);

// 最后保存时间文本
const lastSaveTimeText = computed(() => {
  const lastSave = ideStore.lastSaveTime;
  if (!lastSave) {
    return '未保存';
  }
  return dayjs(lastSave).fromNow();
});

// 定时器：更新相对时间和模拟系统资源
let updateTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 更新系统资源使用率（模拟数据）
 * @returns {void}
 */
function updateData() {
  // 模拟系统资源变化
  cpuUsage.value = Math.floor(Math.random() * 30) + 20;
  memUsage.value = Math.floor(Math.random() * 20) + 35;
}

onMounted(() => {
  updateTimer = setInterval(updateData, 5000);
});

onUnmounted(() => {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
});
</script>

<style lang="scss" src="./index.scss"></style>
