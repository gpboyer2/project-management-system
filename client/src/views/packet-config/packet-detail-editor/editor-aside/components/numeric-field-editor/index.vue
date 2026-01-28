<!-- 数值类型字段编辑器 (SignedInt/UnsignedInt) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      数值类型属性
    </div>

    <div class="form-group">
      <label class="form-label">
        单位
      </label>

      <input
        type="text"
        class="form-control"
        :value="field.unit"
        placeholder="例如：km、kg 等"
        @input="$emit('update', { path: '', property: 'unit', value: $event.target.value })"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        取值范围
      </label>

      <ValueRangeList
        :ranges="field.value_range || []"
        :default-range="{ min: 0, max: 0 }"
        @update="(idx, prop, val) => $emit('update', { path: `value_range.${idx}`, property: prop, value: val })"
        @remove="$emit('remove', { path: 'value_range', index: $event })"
        @add="$emit('add', { path: 'value_range', item: { min: 0, max: 0 } })"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        默认值
      </label>

      <input
        v-model.number="field.default_value"
        type="number"
        class="form-control"
        placeholder="请输入默认值"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ValueRangeList from '../value-range-list/index.vue';

defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
  (e: 'remove', payload: { path: string; index: number }): void;
  (e: 'add', payload: { path: string; item: any }): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
