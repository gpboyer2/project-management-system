<!--
  字段类型工具箱
  显示可拖拽的字段类型卡片
-->
<template>
  <div class="field-type-grid">
    <VueDraggable
      :model-value="fieldTypeList"
      :group="{ name: 'fields', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneFieldType"
      class="field-type-grid-inner"
      @update:model-value="() => {}"
    >
      <div
        v-for="fieldType in fieldTypeList"
        :key="fieldType.field_type"
        class="field-type-card"
        :data-field-type="fieldType.field_type"
        draggable="true"
        @dblclick="$emit('dblclick', fieldType)"
      >
        <i
          :class="fieldType.icon"
          class="field-type-icon"
          :style="{ color: fieldType.icon_color }"
        />

        <span class="field-type-name">
          {{ fieldType.field_name }}
        </span>

        <span class="field-type">
          {{ fieldType.field_type }}
        </span>
      </div>
    </VueDraggable>

    <div v-if="fieldTypeList.length === 0" class="field-type-empty">
      <p>暂无字段类型</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { fieldOptions } from '@/stores/packet-field-options';
import { FIELD_TYPE_ORDER, FIELD_TYPE_TO_ENGLISH } from '@/constants/field-types';
import { collect_all_field_names } from '@/utils';

const props = defineProps<{
  packetData?: any;
}>();

defineEmits<{
  (e: 'dblclick', fieldType: any): void;
}>();

// 字段类型列表
const fieldTypeList = computed(() => {
  const options = Object.values(fieldOptions) as any[];
  return options.sort((a, b) => {
    const type_a = a.fieldType || a.field_type || '';
    const type_b = b.fieldType || b.field_type || '';
    const indexA = FIELD_TYPE_ORDER.indexOf(type_a);
    const indexB = FIELD_TYPE_ORDER.indexOf(type_b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    const name_a = a.field_name || '';
    const name_b = b.field_name || '';
    return name_a.localeCompare(name_b);
  });
});

// 克隆字段类型（用于拖拽）
// 使用常量和工具函数优化
function cloneFieldType(fieldType: any) {
  const field_type = fieldType?.fieldType || fieldType?.field_type || '';

  // 生成唯一字段名：同类型基名按“最大序号 + 1”递增（全局唯一，包含 struct 子字段）
  const base_name = (FIELD_TYPE_TO_ENGLISH as any)[field_type] || 'field';
  const existing_names = props.packetData?.fields
    ? collect_all_field_names(props.packetData.fields)
    : new Set<string>();

  const escape_regexp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escape_regexp(base_name)}(\\d+)$`);
  let max_index = 0;
  for (const name of existing_names) {
    const match = pattern.exec(name);
    if (!match) continue;
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > max_index) max_index = n;
  }
  const field_name = `${base_name}${max_index + 1}`;

  const is_container = field_type === 'Struct' || field_type === 'Array' || field_type === 'Command';

  return {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    field_name: field_name,
    type: field_type,
    description: '',
    byte_length: 1,
    default_value: 0,
    display_format: 'decimal',
    is_required: true,
    valid_when: { field: '', value: null },
    message_id_value: null,
    value_type: '',
    precision: null,
    unit: '',
    value_range: [],
    length: null,
    sub_fields: [],
    base_type: '',
    maps: [],
    count: null,
    count_from_field: '',
    bytes_in_trailer: null,
    algorithm: '',
    parameters: {},
    expanded: is_container,
  } as any;
}
</script>

<style lang="scss" src="./index.scss"></style>
