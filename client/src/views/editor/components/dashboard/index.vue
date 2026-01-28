<!--
  仪表板组件
  显示各类资源的统计和快速导航入口
  路由：/editor/ide/dashboard
-->
<template>
  <div class="editor-dashboard">
    <div class="editor-dashboard-content">
      <div class="editor-dashboard-grid">
        <div
          v-for="item in dashboardItems"
          :key="item.key"
          class="editor-dashboard-card"
          @click="router.push({ path: item.path, query: item.query })"
        >
          <div class="editor-dashboard-card-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>

          <div class="editor-dashboard-card-info">
            <div class="editor-dashboard-card-label">
              {{ item.label }}
            </div>

            <div class="editor-dashboard-card-value">
              {{ item.value }}
            </div>
          </div>

          <div class="editor-dashboard-card-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMessageManageList } from '@/api/messageManagement';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';
import { ArrowRight, Connection, Share } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

// 统计数据
const stats = ref({
  interfaceCount: 0,
  logicCount: 0,
});

// 仪表板卡片配置
const dashboardItems = computed(() => [
  {
    key: 'interface',
    label: '接口报文',
    icon: Connection,
    value: stats.value.interfaceCount,
    path: '/editor/ide/protocol',
    query: { view: 'list' },
  },
  {
    key: 'logic',
    label: '逻辑节点',
    icon: Share,
    value: stats.value.logicCount,
    path: '/editor/ide/logic',
    query: { view: 'list' },
  },
]);

/**
 * 加载统计数据
 * @description 并行加载接口报文和逻辑节点的统计数据
 * @returns {Promise<void>} 无返回值
 */
async function loadStats() {
  loading.value = true;
  try {
    // 并行加载各类数据统计
    const [interfaceResult, logicResult] = await Promise.allSettled([
      getMessageManageList({ current_page: 1, page_size: 1 }),
      systemLevelDesignTreeApi.getAllNodes(),
    ]);

    // 处理接口统计
    if (interfaceResult.status === 'fulfilled' && interfaceResult.value.status === 'success') {
      stats.value.interfaceCount = interfaceResult.value.datum?.pagination?.total || 0;
    }

    // 处理逻辑节点统计
    if (logicResult.status === 'fulfilled' && logicResult.value.status === 'success') {
      stats.value.logicCount = (logicResult.value.datum || []).length;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStats();
});
</script>

<style lang="scss" src="./index.scss"></style>
