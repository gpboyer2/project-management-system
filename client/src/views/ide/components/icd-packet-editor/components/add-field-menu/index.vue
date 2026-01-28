<template>
  <div class="add-field-menu" @click.stop>
    <div class="add-field-menu-header">
      选择字段类型
    </div>

    <div class="add-field-menu-list">
      <div
        v-for="fieldType in fieldTypeList"
        :key="fieldType.field_type"
        class="add-field-menu-item"
        @click="$emit('select', fieldType.field_type)"
      >
        <i
          class="add-field-menu-item-icon"
          :class="[
            fieldType.icon,
          ]"
        />

        <div class="menu-item-content">
          <span class="menu-item-title">
            {{ fieldType.field_name }}
          </span>

          <span class="menu-item-desc">
            {{ fieldType.attr.split('，')[0] }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { fieldOptions } from '@/stores/packet-field-options';
import { FIELD_TYPE_ORDER } from '@/constants/field-types';

defineEmits<{
  (e: 'select', fieldType: string): void;
}>();

// 字段类型列表
const fieldTypeList = computed(() => {
  const compOptions = Object.values(fieldOptions) as any[];
  return compOptions.sort((a, b) => {
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
</script>

<style lang="scss" src="./index.scss"></style>
