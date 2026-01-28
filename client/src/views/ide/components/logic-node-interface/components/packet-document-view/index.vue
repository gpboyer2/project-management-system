<!--
  报文文档视图组件 (Packet Document View)
  用途：以技术文档风格展示报文结构，只读模式
  特点：高信息密度、树形嵌套展示、点击高亮、可折叠
-->
<template>
  <div class="packet-document-view">
    <!-- 报文头部（固定） -->
    <div class="packet-document-header">
      <div class="packet-document-title-row">
        <h2 class="packet-document-title">{{ packet?.name || '未命名报文' }}</h2>
        <span class="packet-document-version">v{{ packet?.version || '1.0' }}</span>
      </div>

      <div class="packet-document-divider" />

      <div class="packet-document-meta">
        <div class="packet-document-meta-item">
          <span class="meta-label">字节序</span>
          <span class="meta-value">{{ byteOrderLabel }}</span>
        </div>
        <div class="packet-document-meta-item">
          <span class="meta-label">结构对齐</span>
          <span class="meta-value">{{ alignmentLabel }}</span>
        </div>
        <div class="packet-document-meta-item">
          <span class="meta-label">字段数量</span>
          <span class="meta-value">{{ fieldCount }}</span>
        </div>
      </div>

      <div v-if="packet?.description" class="packet-document-description">
        <span class="meta-label">描述</span>
        <p class="description-text">{{ packet.description }}</p>
      </div>
    </div>

    <!-- 字段列表（可滚动） -->
    <div class="packet-document-fields">
      <div class="packet-document-fields-header">
        <span class="fields-title">字段定义</span>
      </div>

      <div class="packet-document-fields-divider" />

      <!-- 表头 -->
      <div class="packet-document-table-header">
        <span class="col-name">名称</span>
        <span class="col-type">类型</span>
        <span class="col-length">长度</span>
        <span class="col-attrs">属性</span>
      </div>

      <!-- 字段列表 -->
      <div class="packet-document-fields-list">
        <template v-if="visibleFields.length > 0">
          <div
            v-for="field in visibleFields"
            :key="field.id"
            class="packet-document-field-row"
            :class="{
              'packet-document-field-row--selected': selectedFieldId === field.id,
              'packet-document-field-row--nested': field.level > 0
            }"
            @click="selectField(field.id)"
          >
            <!-- 名称列：展开按钮 + 树形连接线 + 字段名 -->
            <div class="col-name" :style="{ paddingLeft: `${field.level * 20}px` }">
              <!-- 展开/收起按钮 -->
              <span
                v-if="canHaveChildren(field.type)"
                class="field-expand-btn"
                @click.stop="toggleExpand(field.id)"
              >
                <el-icon><component :is="isExpanded(field.id) ? ArrowDown : ArrowRight" /></el-icon>
              </span>
              <span v-else class="field-expand-placeholder" />

              <!-- 树形连接线 -->
              <span v-if="field.level > 0" class="field-tree-line">
                <template v-if="field.isLast">└─</template>
                <template v-else>├─</template>
              </span>

              <!-- 字段名 -->
              <span class="field-name">{{ field.field_name || '未命名' }}</span>

              <!-- 子字段数量提示 -->
              <span v-if="getChildCount(field) > 0" class="field-child-count">
                含{{ getChildCount(field) }}个字段
              </span>
            </div>

            <!-- 类型列 -->
            <div class="col-type">
              <span
                class="field-type-tag"
                :style="{
                  backgroundColor: getFieldTypeColor(field.type).bg,
                  color: getFieldTypeColor(field.type).text
                }"
              >
                <el-icon :size="14">
                  <component :is="getFieldTypeIcon(fieldOptions[field.type]?.icon)" />
                </el-icon>
                {{ getFieldTypeName(field.type) }}
              </span>
            </div>

            <!-- 长度列 -->
            <div class="col-length">
              <span class="field-length">{{ formatLength(field) }}</span>
            </div>

            <!-- 属性列 -->
            <div class="col-attrs">
              <span class="field-attrs">{{ formatAttrs(field) }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="packet-document-empty">
            <el-icon><Files /></el-icon>
            <span>暂无字段定义</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ArrowDown, ArrowRight, Files } from '@element-plus/icons-vue';
import { fieldOptions } from '@/stores/packet-field-options';
import { getFieldTypeIcon } from '@/utils/iconUtils';

interface PacketField {
  id?: string;
  field_name?: string;
  type?: string;
  byte_length?: number;
  length?: number;
  default_value?: any;
  precision?: string;
  description?: string;
  fields?: PacketField[];
  element?: PacketField;
  count?: number;
  count_from_field?: string;
  expanded?: boolean;
}

interface FlattenedField extends PacketField {
  level: number;
  isLast: boolean;
  parentId?: string;
}

interface Props {
  packet: {
    name?: string;
    version?: string;
    default_byte_order?: string;
    struct_alignment?: number;
    description?: string;
    fields?: PacketField[];
  } | null;
}

const props = defineProps<Props>();

// 选中的字段 ID
const selectedFieldId = ref<string | null>(null);

// 展开状态 Map
const expandedMap = ref<Map<string, boolean>>(new Map());

// 字节序标签
const byteOrderLabel = computed(() => {
  const order = props.packet?.default_byte_order;
  if (order === 'big') return '大端 (Big)';
  if (order === 'little') return '小端 (Little)';
  return '-';
});

// 对齐标签
const alignmentLabel = computed(() => {
  const alignment = props.packet?.struct_alignment;
  if (alignment === 1) return '1字节';
  if (alignment === 2) return '2字节';
  if (alignment === 4) return '4字节';
  if (alignment === 8) return '8字节';
  return '-';
});

// 字段数量
const fieldCount = computed(() => {
  return props.packet?.fields?.length || 0;
});

// 扁平化字段列表
const flattenedFields = computed<FlattenedField[]>(() => {
  if (!props.packet?.fields) return [];
  
  const result: FlattenedField[] = [];
  
  function flatten(fields: PacketField[], level: number, parentId?: string) {
    fields.forEach((field, index) => {
      const isLast = index === fields.length - 1;
      const fieldId = field.id || `field_${level}_${index}`;
      
      result.push({
        ...field,
        id: fieldId,
        level,
        isLast,
        parentId
      });
      
      // 如果字段已展开且有子字段
      if (isExpanded(fieldId)) {
        // Struct 类型的子字段
        if (field.type === 'Struct' && Array.isArray(field.fields) && field.fields.length > 0) {
          flatten(field.fields, level + 1, fieldId);
        }
        // Array 类型的元素
        if (field.type === 'Array' && field.element) {
          result.push({
            ...field.element,
            id: `${fieldId}_element`,
            field_name: '(元素)',
            level: level + 1,
            isLast: true,
            parentId: fieldId
          });
        }
        // Command 类型的分支
        if (field.type === 'Command' && Array.isArray(field.fields) && field.fields.length > 0) {
          flatten(field.fields, level + 1, fieldId);
        }
      }
    });
  }
  
  flatten(props.packet.fields, 0);
  return result;
});

// 可见字段列表（考虑折叠状态）
const visibleFields = computed(() => {
  return flattenedFields.value;
});

/**
 * 判断字段类型是否可以有子字段
 * @param {string} type - 字段类型
 * @returns {boolean} 是否可以有子字段
 */
function canHaveChildren(type?: string): boolean {
  return type === 'Struct' || type === 'Array' || type === 'Command';
}

/**
 * 获取子字段数量
 * @param {FlattenedField} field - 字段对象
 * @returns {number} 子字段数量
 */
function getChildCount(field: FlattenedField): number {
  if (field.type === 'Struct' && Array.isArray(field.fields)) {
    return field.fields.length;
  }
  if (field.type === 'Array' && field.element) {
    return 1;
  }
  if (field.type === 'Command' && Array.isArray(field.fields)) {
    return field.fields.length;
  }
  return 0;
}

/**
 * 判断字段是否展开
 * @param {string} fieldId - 字段 ID
 * @returns {boolean} 是否展开
 */
function isExpanded(fieldId: string): boolean {
  // 默认展开
  if (!expandedMap.value.has(fieldId)) {
    return true;
  }
  return expandedMap.value.get(fieldId) || false;
}

/**
 * 切换展开状态
 * @param {string} fieldId - 字段 ID
 * @returns {void} 无返回值
 */
function toggleExpand(fieldId: string) {
  const current = isExpanded(fieldId);
  expandedMap.value.set(fieldId, !current);
}

/**
 * 选择字段
 * @param {string} fieldId - 字段 ID
 * @returns {void} 无返回值
 */
function selectField(fieldId: string) {
  selectedFieldId.value = fieldId;
}

/**
 * 获取字段类型颜色
 * @param {string} type - 字段类型
 * @returns {{ bg: string; text: string }} 背景色和文字色
 */
function getFieldTypeColor(type?: string): { bg: string; text: string } {
  const option = fieldOptions[type || ''];
  if (option) {
    return {
      bg: option.icon_bg_color || 'var(--color-bg-secondary)',
      text: option.icon_color || 'var(--color-text-secondary)'
    };
  }
  return {
    bg: 'var(--color-bg-secondary)',
    text: 'var(--color-text-secondary)'
  };
}

/**
 * 获取字段类型名称
 * @param {string} type - 字段类型
 * @returns {string} 字段类型名称
 */
function getFieldTypeName(type?: string): string {
  const option = fieldOptions[type || ''];
  return option?.field_name || type || '-';
}

/**
 * 格式化长度
 * 根据字段类型返回相应的长度表示
 * @param {FlattenedField} field - 字段对象
 * @returns {string} 格式化后的长度字符串
 */
function formatLength(field: FlattenedField): string {
  // 容器类型不显示长度
  if (field.type === 'Struct' || field.type === 'Command') {
    return '-';
  }

  // 数组显示元素数量
  if (field.type === 'Array') {
    if (field.count_from_field) {
      return `变长`;
    }
    if (field.count) {
      return `[${field.count}]`;
    }
    return '-';
  }

  // 字符串显示长度
  if (field.type === 'String' || field.type === 'Bcd') {
    if (field.length === 0) return '变长';
    if (field.length) return `${field.length}B`;
    return '-';
  }

  // 其他类型显示字节长度
  if (field.byte_length) {
    return `${field.byte_length}B`;
  }

  return '-';
}

/**
 * 格式化属性
 * 提取字段的默认值、精度、数组长度来源等属性
 * @param {FlattenedField} field - 字段对象
 * @returns {string} 格式化后的属性字符串
 */
function formatAttrs(field: FlattenedField): string {
  const attrs: string[] = [];

  // 默认值
  if (field.default_value !== undefined && field.default_value !== null && field.default_value !== '') {
    attrs.push(`默认:${field.default_value}`);
  }

  // 精度（浮点数）
  if (field.precision) {
    attrs.push(`精度:${field.precision}`);
  }

  // 数组长度来源
  if (field.type === 'Array' && field.count_from_field) {
    attrs.push(`长度字段:${field.count_from_field}`);
  }

  return attrs.join('  ') || '-';
}

// 监听 packet 变化，重置展开状态
watch(() => props.packet, () => {
  expandedMap.value.clear();
  selectedFieldId.value = null;
}, { deep: false });
</script>

<style lang="scss" src="./index.scss"></style>
