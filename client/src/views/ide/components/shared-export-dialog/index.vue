<!--
  导出数据弹窗
  支持按模块精细化导出数据（体系层级、协议集）
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="导出数据"
    width="480px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="export-dialog-content">
      <p class="export-dialog-label">
        选择要导出的内容：
      </p>

      <!-- 体系层级 -->
      <div v-if="previewData.hierarchy" class="export-dialog-section">
        <div class="export-dialog-section-header">
          <span class="export-dialog-section-title">
            体系层级
          </span>

          <span class="export-dialog-count">
            ({{ hierarchyCheckedCount }}/{{ hierarchyCount }})
          </span>
        </div>

        <el-tree
          ref="hierarchyTreeRef"
          :data="hierarchyTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="defaultHierarchyKeys"
          @check="handleHierarchyCheck"
        >
          <template #default="{ node: _node, data }">
            <span class="export-tree-node">
              <component
                :is="getNodeIcon(data).iconComponent"
                class="export-tree-node-icon"
                :class="getNodeIcon(data).iconClass"
              />

              <span class="export-tree-node-label">
                {{ getNodeIcon(data).displayName }}
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 协议集 -->
      <div v-if="previewData.protocols" class="export-dialog-section">
        <div class="export-dialog-section-header">
          <span class="export-dialog-section-title">
            协议集
          </span>

          <span class="export-dialog-count">
            ({{ protocolCheckedCount }}/{{ protocolCount }})
          </span>
        </div>

        <el-tree
          ref="protocolTreeRef"
          :data="protocolTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="defaultProtocolKeys"
          @check="handleProtocolCheck"
        >
          <template #default="{ node: _node, data }">
            <span class="export-tree-node">
              <component
                :is="getNodeIcon(data).iconComponent"
                class="export-tree-node-icon"
                :class="getNodeIcon(data).iconClass"
              />

              <span class="export-tree-node-label">
                {{ getNodeIcon(data).displayName }}
              </span>

              <span v-if="data.field_count !== undefined" class="export-tree-node-meta">
                {{ data.field_count }} 字段
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <div class="export-dialog-tip">
        <el-icon><InfoFilled /></el-icon>

        <span>提示：选中父节点会自动包含所有子节点</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>

      <el-button
        type="primary"
        :disabled="totalCheckedCount === 0 || exporting"
        :loading="exporting"
        @click="handleExport"
      >
        导出 ({{ totalCheckedCount }} 项)
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { getTreeNodeIcon } from '@/utils/useTreeNodeIcon';
import type { TreeNodeData } from '@/types';

interface PreviewData {
  hierarchy?: { count: number; tree: TreeNodeData[] };
  protocols?: { count: number; tree: TreeNodeData[] };
}

const props = defineProps<{
  visible: boolean;
  previewData: PreviewData;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'export', data: { hierarchy?: string[]; protocols?: string[] }): void;
}>();

const hierarchyConfigStore = useHierarchyConfigStore();

const exporting = ref(false);
const hierarchyTreeRef = ref();
const protocolTreeRef = ref();

const treeProps = {
  children: 'children',
  label: 'name'
};

const hierarchyLevelMap = computed(() => {
  const map: Record<string, any> = {};
  hierarchyConfigStore.hierarchyLevels.forEach(level => {
    map[level.id] = level;
  });
  return map;
});

// 树数据
const hierarchyTree = computed<TreeNodeData[]>(() => {
  return props.previewData.hierarchy?.tree || [];
});

const protocolTree = computed<TreeNodeData[]>(() => {
  return props.previewData.protocols?.tree || [];
});

// 总数
const hierarchyCount = computed(() => props.previewData.hierarchy?.count || 0);
const protocolCount = computed(() => props.previewData.protocols?.count || 0);

// 默认不选中
const defaultHierarchyKeys = computed(() => {
  return [];
});

const defaultProtocolKeys = computed(() => {
  return [];
});

/**
 * 获取节点图标信息
 * @param {TreeNodeData} node - 树节点数据
 * @returns {object} 节点图标信息，包含图标组件和显示名称
 */
function getNodeIcon(node: TreeNodeData) {
  return getTreeNodeIcon(node, hierarchyLevelMap.value, false);
}

// 选中数量
const hierarchyCheckedCount = ref(0);
const protocolCheckedCount = ref(0);

const totalCheckedCount = computed(() => hierarchyCheckedCount.value + protocolCheckedCount.value);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick();
      updateCheckedCount();
    }
  }
);

/**
 * 体系层级树选中状态变化处理
 * @returns {void} 无返回值
 */
function handleHierarchyCheck() {
  updateCheckedCount();
}

/**
 * 协议集树选中状态变化处理
 * @returns {void} 无返回值
 */
function handleProtocolCheck() {
  updateCheckedCount();
}

/**
 * 更新选中数量统计
 * @returns {void} 无返回值
 */
function updateCheckedCount() {
  if (hierarchyTreeRef.value) {
    hierarchyCheckedCount.value = hierarchyTreeRef.value.getCheckedNodes().length;
  }
  if (protocolTreeRef.value) {
    protocolCheckedCount.value = protocolTreeRef.value.getCheckedNodes().length;
  }
}

/**
 * 执行导出操作
 * @returns {Promise<void>} 无返回值
 */
async function handleExport() {
  if (totalCheckedCount.value === 0) {
    ElMessage.warning('请至少选择一项内容');
    return;
  }

  exporting.value = true;
  try {
    const data: { hierarchy?: string[]; protocols?: string[] } = {};

    if (hierarchyTreeRef.value) {
      const checkedNodes = hierarchyTreeRef.value.getCheckedNodes();
      if (checkedNodes.length > 0) {
        data.hierarchy = checkedNodes.map((n: any) => n.id);
      }
    }

    if (protocolTreeRef.value) {
      const checkedNodes = protocolTreeRef.value.getCheckedNodes();
      if (checkedNodes.length > 0) {
        data.protocols = checkedNodes.map((n: any) => n.id);
      }
    }

    emit('export', data);
  } finally {
    exporting.value = false;
  }
}

/**
 * 对话框关闭时的处理
 * @returns {void} 无返回值
 */
function handleClosed() {
  exporting.value = false;
  hierarchyCheckedCount.value = 0;
  protocolCheckedCount.value = 0;
}
</script>

<style lang="scss" src="./index.scss"></style>
