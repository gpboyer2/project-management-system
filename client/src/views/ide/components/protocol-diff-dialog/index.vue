<!--
  协议版本对比弹窗 (Protocol Diff Dialog)
  用于展示节点引用的报文版本与协议集最新版本之间的差异
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1000px"
    top="5vh"
    :close-on-click-modal="false"
    class="protocol-diff-dialog"
    @closed="handleClosed"
  >
    <!-- 概览卡片 -->
    <div class="diff-overview">
      <div class="diff-overview-item">
        <div class="overview-label">
          报文名称
        </div>

        <div class="overview-value">
          {{ compOptions.packetName }}
        </div>
      </div>

      <div class="diff-overview-item">
        <div class="overview-label">
          关联节点
        </div>

        <div class="overview-value">
          {{ compOptions.appName }}
        </div>
      </div>

      <div class="diff-overview-item">
        <div class="overview-label">
          角色
        </div>

        <div class="overview-value">
          <el-tag :type="compOptions.role === 'Pub' ? '' : 'success'" size="small" effect="plain">
            {{ compOptions.role === 'Pub' ? '发送方' : '接收方' }}
          </el-tag>
        </div>
      </div>

      <div class="diff-overview-divider" />

      <div class="diff-overview-item">
        <div class="overview-label">
          本地版本
        </div>

        <div class="overview-value version-tag">
          {{ local.version }}
        </div>
      </div>

      <div class="diff-overview-arrow">
        <el-icon><Right /></el-icon>
      </div>

      <div class="diff-overview-item">
        <div class="overview-label">
          最新版本
        </div>

        <div class="overview-value version-tag version-tag--latest">
          {{ latest.version }}
        </div>
      </div>
    </div>

    <!-- 差异统计 -->
    <div class="diff-stats">
      <div class="stat-card">
        <div class="stat-value text-success">
          +{{ addedCount }}
        </div>

        <div class="stat-label">
          新增字段
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value text-danger">
          -{{ removedCount }}
        </div>

        <div class="stat-label">
          删除字段
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value text-warning">
          ~{{ modifiedCount }}
        </div>

        <div class="stat-label">
          修改字段
        </div>
      </div>
    </div>

    <!-- 差异详情 -->
    <div class="diff-content">
      <el-tabs v-model="activeTab" class="diff-tabs">
        <el-tab-pane label="变更摘要" name="summary">
          <el-table
            :data="diffDetailList"
            border
            stripe
            size="small"
            height="400"
          >
            <el-table-column label="变更类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getChangeTypeTag(row.changeType)" size="small" effect="light">
                  {{ getChangeTypeLabel(row.changeType) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="fieldName" label="字段名称" width="180" />

            <el-table-column prop="property" label="变更属性" width="120">
              <template #default="{ row }">
                {{ row.property || '整行' }}
              </template>
            </el-table-column>

            <el-table-column prop="localValue" label="本地值" min-width="150">
              <template #default="{ row }">
                <span class="diff-value diff-value--old">
                  {{ dialogFormatValue(row.localValue) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="latestValue" label="最新值" min-width="150">
              <template #default="{ row }">
                <span class="diff-value diff-value--new">
                  {{ dialogFormatValue(row.latestValue) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="完整对比" name="full">
          <div class="diff-full-compare">
            <div class="diff-panel">
              <div class="diff-panel-header">
                本地版本 ({{ local.version }})
              </div>

              <div class="diff-panel-body">
                <div 
                  v-for="(field, index) in local.fieldList" 
                  :key="'local-'+index"
                  class="diff-row"
                  :class="getFieldDiffClass(field, 'local')"
                >
                  <span class="row-index">
                    {{ index + 1 }}
                  </span>

                  <span class="row-content">
                    {{ field.field_name }} ({{ getFieldTypeLabel(field.type) }})
                  </span>
                </div>

                <div v-if="local.fieldList.length === 0" class="empty-text">
                  无数据
                </div>
              </div>
            </div>

            <div class="diff-panel">
              <div class="diff-panel-header">
                最新版本 ({{ latest.version }})
              </div>

              <div class="diff-panel-body">
                <div 
                  v-for="(field, index) in latest.fieldList" 
                  :key="'latest-'+index"
                  class="diff-row"
                  :class="getFieldDiffClass(field, 'latest')"
                >
                  <span class="row-index">
                    {{ index + 1 }}
                  </span>

                  <span class="row-content">
                    {{ field.field_name }} ({{ getFieldTypeLabel(field.type) }})
                  </span>
                </div>

                <div v-if="latest.fieldList.length === 0" class="empty-text">
                  无数据
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="diff-footer">
        <el-button @click="dialogVisible = false">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Right } from '@element-plus/icons-vue';
import { fieldOptions } from '@/stores/packet-field-options';
import { formatValue as dialogFormatValue } from '@/utils/dialogUtils';

interface DiffMeta {
  packetName: string
  appName: string
  role: 'Pub' | 'Sub'
}

interface VersionInfo {
  version: string
  fieldList: PacketField[]
}

interface PacketField {
  id?: string
  field_name?: string
  type?: string
  byte_length?: number
  length?: number
  description?: string
  [key: string]: any
}

interface DiffDetail {
  changeType: 'added' | 'removed' | 'modified'
  fieldName: string
  property?: string
  localValue?: any
  latestValue?: any
}

const props = defineProps<{
  visible: boolean
  compOptions: DiffMeta
  local: VersionInfo
  latest: VersionInfo
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>();

const activeTab = ref('summary');

// 弹窗可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 弹窗标题
const dialogTitle = computed(() => `协议版本对比 - ${props.compOptions.packetName}`);

// 计算差异
const diffResult = computed(() => {
  const localMap = new Map<string, PacketField>();
  const latestMap = new Map<string, PacketField>();
  
  props.local.fieldList.forEach(f => {
    if (f.field_name) localMap.set(f.field_name, f);
  });
  props.latest.fieldList.forEach(f => {
    if (f.field_name) latestMap.set(f.field_name, f);
  });
  
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  const detailList: DiffDetail[] = [];
  
  // 检查新增和修改
  latestMap.forEach((latestField, name) => {
    const localField = localMap.get(name);
    if (!localField) {
      added.push(name);
      detailList.push({
        changeType: 'added',
        fieldName: name,
        latestValue: getFieldTypeLabel(latestField.type)
      });
    } else {
      // 检查属性差异
      const propsToCompare = ['type', 'byte_length', 'length', 'description'];
      for (const prop of propsToCompare) {
        if (localField[prop] !== latestField[prop]) {
          if (!modified.includes(name)) {
            modified.push(name);
          }
          detailList.push({
            changeType: 'modified',
            fieldName: name,
            property: getPropertyLabel(prop),
            localValue: localField[prop],
            latestValue: latestField[prop]
          });
        }
      }
    }
  });
  
  // 检查删除
  localMap.forEach((localField, name) => {
    if (!latestMap.has(name)) {
      removed.push(name);
      detailList.push({
        changeType: 'removed',
        fieldName: name,
        localValue: getFieldTypeLabel(localField.type)
      });
    }
  });
  
  return { added, removed, modified, detailList };
});

const addedCount = computed(() => diffResult.value.added.length);
const removedCount = computed(() => diffResult.value.removed.length);
const modifiedCount = computed(() => diffResult.value.modified.length);
const diffDetailList = computed(() => diffResult.value.detailList);

/**
 * 获取字段类型的显示标签
 * @param {string} type - 字段类型代码
 * @returns {string} 字段类型显示名称
 */
function getFieldTypeLabel(type?: string): string {
  if (!type) return '-';
  return fieldOptions[type]?.field_name || type;
}

/**
 * 获取属性的显示标签
 * @param {string} prop - 属性名称
 * @returns {string} 属性显示名称
 */
function getPropertyLabel(prop: string): string {
  const labels: Record<string, string> = {
    type: '字段类型',
    byte_length: '字节长度',
    length: '长度',
    description: '描述'
  };
  return labels[prop] || prop;
}

/**
 * 获取变更类型对应的 Element Plus Tag 类型
 * @param {string} type - 变更类型
 * @returns {string} Element Plus Tag 类型
 */
function getChangeTypeTag(type: string) {
  const map: Record<string, string> = {
    added: 'success',
    removed: 'danger',
    modified: 'warning'
  };
  return map[type] || 'info';
}

/**
 * 获取变更类型的显示标签
 * @param {string} type - 变更类型
 * @returns {string} 变更类型显示名称
 */
function getChangeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    added: '新增',
    removed: '删除',
    modified: '修改'
  };
  return labels[type] || type;
}

/**
 * 获取字段差异对应的 CSS 类名
 * @param {PacketField} field - 字段对象
 * @param {'local' | 'latest'} side - 版本侧（本地或最新）
 * @returns {string} CSS 类名
 */
function getFieldDiffClass(field: PacketField, side: 'local' | 'latest'): string {
  const name = field.field_name || '';
  if (side === 'local') {
    if (diffResult.value.removed.includes(name)) return 'row--removed';
    if (diffResult.value.modified.includes(name)) return 'row--modified';
  } else {
    if (diffResult.value.added.includes(name)) return 'row--added';
    if (diffResult.value.modified.includes(name)) return 'row--modified';
  }
  return '';
}

/**
 * 处理对话框关闭事件，重置 Tab 选项
 * @returns {void}
 */
function handleClosed() {
  activeTab.value = 'summary';
}
</script>

<style lang="scss" src="./index.scss"></style>