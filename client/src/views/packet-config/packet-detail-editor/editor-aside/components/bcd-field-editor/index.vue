<!-- BCD码字段编辑器 (Bcd) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      BCD码属性
    </div>

    <div class="form-group">
      <label class="form-label">
        默认值
      </label>

      <input
        v-model="field.default_value"
        type="text"
        class="form-control"
        placeholder="请输入默认值(字符串)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        取值范围
      </label>

      <ValueRangeList
        :ranges="field.value_range || []"
        :default-range="{ min: '', max: '' }"
        value-type="string"
        @update="(idx, prop, val) => $emit('update', { path: `value_range.${idx}`, property: prop, value: val })"
        @remove="$emit('remove', { path: 'value_range', index: $event })"
        @add="$emit('add', { path: 'value_range', item: { min: '', max: '' } })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ValueRangeList from '../value-range-list/index.vue';

const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
  (e: 'remove', payload: { path: string; index: number }): void;
  (e: 'add', payload: { path: string; item: any }): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
