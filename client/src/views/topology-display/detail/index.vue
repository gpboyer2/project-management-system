<template>
  <div class="topology-detail-page">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="breadcrumb">
          <span class="breadcrumb-item">
            拓扑展示
          </span>

          <span class="breadcrumb-separator">
            /
          </span>

          <span class="breadcrumb-current">
            {{ nodeData?.name || '节点详情' }}
          </span>
        </div>

        <span :class="['status-badge', statusClass]">
          {{ statusText }}
        </span>
      </div>

      <div class="detail-header-right">
        <el-button class="back-btn" @click="handleBack">
          <span class="back-icon">
            ←
          </span>

          <span>返回拓扑图</span>
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="detail-content">
      <!-- 节点概览卡片 -->
      <div class="overview-card">
        <div :class="['node-avatar', `avatar-color-${nodeColorIndex}`]">
          {{ nodeInitial }}
        </div>

        <div class="node-summary">
          <h1 class="node-name">
            {{ nodeData?.name || '未命名节点' }}
          </h1>

          <p class="node-type">
            {{ nodeTypeText }}
          </p>
        </div>
      </div>

      <!-- 属性信息区 -->
      <div class="properties-section">
        <h2 class="section-title">
          基本信息
        </h2>

        <div class="properties-grid">
          <div v-for="item in basicInfoList" :key="item.key" class="property-item">
            <span class="property-label">
              {{ item.label }}
            </span>

            <span class="property-value">
              {{ item.value || '-' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 连接信息区 -->
      <div v-if="connectionList.length > 0" class="connections-section">
        <h2 class="section-title">
          连接关系
        </h2>

        <div class="connection-list">
          <div v-for="(conn, index) in connectionList" :key="index" class="connection-item">
            <span class="connection-icon">
              →
            </span>

            <span class="connection-name">
              {{ conn }}
            </span>
          </div>
        </div>
      </div>

      <!-- 元数据区 -->
      <div v-if="hasMetadata" class="metadata-section">
        <h2 class="section-title">
          扩展属性
        </h2>

        <div class="metadata-grid">
          <div v-for="(value, key) in nodeData?.metadata" :key="key" class="metadata-item">
            <span class="metadata-key">
              {{ key }}
            </span>

            <span class="metadata-value">
              {{ formatMetadataValue(value) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTopologyStore } from '@/stores/topology';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { ElButton } from 'element-plus';

const router = useRouter();
const route = useRoute();
const topologyStore = useTopologyStore();
const hierarchyConfigStore = useHierarchyConfigStore();

// 当前节点数据
const nodeData = computed(() => {
  // 优先从 route query 获取节点 ID
  const nodeId = route.query.nodeId as string;
  if (nodeId) {
    return topologyStore.nodes.find(n => String(n.id) === nodeId) || null;
  }
  // 否则使用 store 中选中的节点
  return topologyStore.selectedNode || null;
});

// 节点首字母
const nodeInitial = computed(() => {
  const name = nodeData.value?.name || '';
  return name.charAt(0).toUpperCase();
});

/**
 * 根据顺序获取对应的颜色值
 * @param {number} order - 层级顺序号（从1开始）
 * @returns {string} 颜色的十六进制值
 */
const getColorByOrder = (order: number): string => {
  const colors = [
    '#e74c3c',  // 红色
    '#f39c12',  // 橙色
    '#27ae60',  // 绿色
    '#3498db',  // 蓝色
    '#9b59b6',  // 紫色
    '#1abc9c',  // 青色
    '#e91e63',  // 粉色
    '#00bcd4',  // 青蓝
  ];
  return colors[(order - 1) % colors.length];
};

// 节点颜色（根据层级配置动态获取）
const nodeColor = computed(() => {
  const nodeType = nodeData.value?.node_type_id || nodeData.value?.type;
  if (!nodeType) return '#3b82f6';

  // 从层级配置查找
  const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nodeType);
  if (levelConfig) {
    return getColorByOrder(levelConfig.order || 1);
  }

  // 默认蓝色
  return '#3b82f6';
});

// 节点颜色索引（用于CSS类名）
const nodeColorIndex = computed(() => {
  const nodeType = nodeData.value?.node_type_id || nodeData.value?.type;
  if (!nodeType) return 4;

  // 从层级配置查找
  const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nodeType);
  if (levelConfig) {
    return (levelConfig.order || 1) - 1;
  }

  // 默认蓝色索引
  return 4;
});

// 节点类型文本（根据层级配置动态获取）
const nodeTypeText = computed(() => {
  const nodeType = nodeData.value?.node_type_id || nodeData.value?.type;
  if (!nodeType) return '未知类型';

  // 从层级配置查找
  const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nodeType);
  if (levelConfig) {
    return levelConfig.display_name || levelConfig.type_name || '未知类型';
  }

  return '未知类型';
});

// 状态样式类
const statusClass = computed(() => {
  const status = nodeData.value?.status;
  return {
    'status-online': status === 'online',
    'status-offline': status === 'offline',
    'status-unknown': status === 'unknown' || !status
  };
});

// 状态文本
const statusText = computed(() => {
  const status = nodeData.value?.status;
  const statusMap: Record<string, string> = {
    'online': '在线',
    'offline': '离线',
    'unknown': '未知'
  };
  return statusMap[status || ''] || '未知';
});

// 基本信息列表
const basicInfoList = computed(() => {
  const node = nodeData.value;
  if (!node) return [];

  const list: Array<{ key: string; label: string; value: string }> = [
    { key: 'id', label: 'ID', value: String(node.id) },
    { key: 'name', label: '名称', value: node.name },
    { key: 'type', label: '类型', value: nodeTypeText.value }
  ];

  if (node.description) {
    list.push({ key: 'description', label: '描述', value: node.description });
  }
  if ((node as any).hierarchyId) {
    list.push({ key: 'hierarchyId', label: '所属层级', value: (node as any).hierarchyId });
  }
  if (node.model) {
    list.push({ key: 'model', label: '型号', value: node.model });
  }
  if (node.version) {
    list.push({ key: 'version', label: '版本', value: node.version });
  }
  if (node.ip) {
    list.push({ key: 'ip', label: 'IP地址', value: node.ip });
  }
  if (node.category) {
    list.push({ key: 'category', label: '分类', value: node.category });
  }

  return list;
});

// 连接列表
const connectionList = computed(() => {
  return nodeData.value?.connections || [];
});

// 是否有元数据
const hasMetadata = computed(() => {
  const metadata = nodeData.value?.metadata;
  return metadata && Object.keys(metadata).length > 0;
});

/**
 * 格式化元数据值为字符串
 * @param {any} value - 元数据值
 * @returns {string} 格式化后的字符串
 */
function formatMetadataValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 返回拓扑展示页面
 * @returns {void}
 */
function handleBack() {
  topologyStore.clearSelection();
  router.push('/topology-display');
}
</script>

<style lang="scss" src="./index.scss"></style>
