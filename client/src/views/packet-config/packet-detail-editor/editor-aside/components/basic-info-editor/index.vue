<!--
  基本信息编辑器（通用）
  显示字段名称、字段类型、类型属性
-->
<template>
  <div class="form-section">
    <div class="form-section-title">
      基本信息
    </div>

    <div class="form-group">
      <label class="form-label">
        字段名称
      </label>

      <input
        type="text"
        class="form-control"
        :value="field.field_name || ''"
        placeholder="请输入字段名称"
        @input="$emit('update', { path: '', property: 'field_name', value: $event.target.value })"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        字段类型
      </label>

      <div class="field-type-display">
        {{ getFieldTypeLabel(field.type || "") }}
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        类型属性
      </label>

      <div class="field-type-display">
        {{ getFieldTypeAttr(field.type || "") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fieldOptions } from "@/stores/packet-field-options";

const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

function getFieldTypeLabel(type: string): string {
  return fieldOptions[type]?.field_name || type;
}

function getFieldTypeAttr(type: string): string {
  return fieldOptions[type]?.attr || "";
}
</script>

<style lang="scss" src="./index.scss"></style>
