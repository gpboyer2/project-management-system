<!--
  节点概览页组件 (Node Dashboard)
  展示节点基本信息、资源预估、通信接口列表、逻辑流列表、局部拓扑
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

          <span v-if="tab.count !== undefined" class="ide-dashboard-tab-count">
            {{ tab.count }}
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

      <InterfacesTab
        v-else-if="activeSubTab === 'interfaces'"
        :node-id="nodeId"
      />

      <LogicTab
        v-else-if="activeSubTab === 'logic'"
        :node-id="nodeId"
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
import { communicationNodeApi } from '@/api/communicationNode';

import OverviewTab from './components/overview-tab/index.vue';
import InterfacesTab from './components/interfaces-tab/index.vue';
import LogicTab from './components/logic-tab/index.vue';
import TopologyTab from './components/topology-tab/index.vue';

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

/** 获取节点基本信息（名称、描述） */
async function loadNodeBasicInfo() {
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
 * 获取接口数量，用于 tab 标签上显示
 * 注意：这里调用接口是为了在用户点击 tab 之前就能看到数量（更好的用户体验）
 * 子组件 InterfacesTab 也会调用同样的接口来获取完整数据并渲染列表
 * 两次调用各有目的，不能删除
 */
async function loadInterfaceCount() {
  const id = nodeId.value;
  if (!id) return;

  try {
    const result = await communicationNodeApi.getListByNodeId(id);
    if (result.status === 'success' && result.datum) {
      const container = Array.isArray(result.datum) && result.datum.length > 0 ? result.datum[0] : result.datum;
      const endpointList = Array.isArray((container as any)?.endpoint_description) ? (container as any).endpoint_description : [];
      interfaceCount.value = endpointList.length;
    } else {
      interfaceCount.value = 0;
    }
  } catch (e) {
    console.error('获取接口数量失败:', e);
    interfaceCount.value = 0;
  }
}

/**
 * 获取逻辑流数量
 * TODO: 等后端接口完成后，从 API 获取真实数量
 */
async function loadLogicFlowCount() {
  // 暂时硬编码（与子组件 logic-tab 的 mock 数据一致）
  logicCount.value = 2;
}

/**
 * 加载节点数据（基本信息、接口数量、逻辑流数量）
 */
async function loadNodeData() {
  const id = nodeId.value;
  if (!id) return;

  loadingNodeData.value = true;
  try {
    await loadNodeBasicInfo();
    await loadInterfaceCount();
    await loadLogicFlowCount();
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

const interfaceCount = ref(0);
const logicCount = ref(0);

const baseTabs: TabItem[] = [
  { key: 'overview', label: '概览' },
  { key: 'interfaces', label: '通信接口' },
  { key: 'logic', label: '逻辑流' },
  { key: 'topology', label: '局部拓扑' }
];

const headerTabs = computed<TabItem[]>(() => {
  return baseTabs.map(tab => {
    if (tab.key === 'interfaces') {
      return { ...tab, count: interfaceCount.value };
    }
    if (tab.key === 'logic') {
      return { ...tab, count: logicCount.value };
    }
    return tab;
  });
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
