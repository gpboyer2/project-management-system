<!--
  层级节点概览页组件 (Hierarchy Node Dashboard)
  用于未启用通信节点列表的层级节点
  展示节点基本信息（概览）和局部拓扑
-->
<template>
  <div class="ide-dashboard" v-bind="$attrs">
    <div class="ide-dashboard-header">
      <div class="ide-dashboard-title-row">
        <el-icon class="ide-dashboard-icon"><Folder /></el-icon>

        <h1 class="ide-dashboard-title">
          {{ displayName }}
        </h1>
      </div>

      <p class="ide-dashboard-subtitle">
        {{ displayDescription }}
      </p>

      <div class="ide-dashboard-tabs">
        <div
          v-for="tab in headerTabs"
          :key="tab.key"
          :class="['ide-dashboard-tab', { 'ide-dashboard-tab--active': activeSubTab === tab.key }]"
          @click="handleTabChange(tab.key)"
        >
          <span class="ide-dashboard-tab-label">
            {{ tab.label }}
          </span>
        </div>
      </div>
    </div>

    <div class="ide-dashboard-content">
      <OverviewTab
        v-if="activeSubTab === 'overview'"
        :node-id="nodeId"
        :node-data="nodeData"
      />

      <TopologyTab
        v-else-if="activeSubTab === 'topology'"
        :node-id="nodeId"
        :display-name="displayName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Folder } from '@element-plus/icons-vue';

defineOptions({
  inheritAttrs: false
});

import { useIdeStore } from '@/stores';
import { useTabSwitch, type TabItem } from '@/composables/useTabSwitch';
import { useRoute } from 'vue-router';
import { buildEditorTabKey } from '@/utils/routeParamHelper';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';

// 复用 logic-node-dashboard 的子组件
import OverviewTab from '../logic-node-dashboard/components/overview-tab/index.vue';
import TopologyTab from '../logic-node-dashboard/components/topology-tab/index.vue';

// props 保留以与其他 dashboard 组件接口一致，实际数据从 URL 获取
defineProps<{
  compOptions?: {
    nodeId?: string;
    nodeName?: string;
    nodeData?: any;
  }
}>();

const route = useRoute();
const ideStore = useIdeStore();

const nodeId = computed(() => {
  return route.query.systemNodeId as string || '';
});

const nodeData = ref<any>(null);
const loadingNodeData = ref(false);

/**
 * 获取节点基本信息（名称、描述）
 * @returns {Promise<void>} 异步无返回值
 */
async function loadNodeBasicInfo(): Promise<void> {
  const id = nodeId.value;
  if (!id) return;

  const result = await systemLevelDesignTreeApi.getNodeById(id);
  if (result.status === 'success') {
    nodeData.value = result.datum;
    const nodeName = result.datum?.properties?.['名称'] || result.datum?.name || '未命名节点';
    const tabKey = buildEditorTabKey(route.path, route.query);
    ideStore.setTabTitle(tabKey, nodeName);
  }
}

/**
 * 加载节点数据
 * @returns {Promise<void>} 异步无返回值
 */
async function loadNodeData(): Promise<void> {
  const id = nodeId.value;
  if (!id) return;

  loadingNodeData.value = true;
  try {
    await loadNodeBasicInfo();
  } finally {
    loadingNodeData.value = false;
  }
}

const displayName = computed(() => {
  return nodeData.value?.properties?.['名称'] || nodeData.value?.name || '';
});

const displayDescription = computed(() => {
  return nodeData.value?.properties?.['描述'] || nodeData.value?.description || '';
});

// 只有概览和局部拓扑两个 tab
const baseTabs: TabItem[] = [
  { key: 'overview', label: '概览' },
  { key: 'topology', label: '局部拓扑' }
];

const headerTabs = computed<TabItem[]>(() => {
  return baseTabs;
});

const { active_key: activeSubTab, switchTab: handleTabChange } = useTabSwitch({
  tabs: headerTabs,
  queryParam: 'tab',
  defaultActive: 'overview'
});

watch(() => nodeId.value, () => {
  loadNodeData();
}, { immediate: true });
</script>

<style lang="scss" src="./index.scss"></style>
