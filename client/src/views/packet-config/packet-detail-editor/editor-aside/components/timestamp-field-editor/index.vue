<!-- 时间戳字段编辑器 (Timestamp) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      时间戳属性
    </div>

    <div class="form-group">
      <label class="form-label">
        时间单位
      </label>

      <el-select
        v-model="field.unit"
        placeholder="请选择时间单位"
        style="width: 100%"
      >
        <el-option
          v-for="item in timeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

const timeOptions = [
  { label: "毫秒", value: "milliseconds" },
  { label: "秒", value: "seconds" },
  { label: "纳秒", value: "microseconds" },
  { label: "4字节当天毫秒数", value: "day-milliseconds" },
  { label: "微秒", value: "nanoseconds" },
  { label: "4字节当天毫秒数乘10", value: "day-0.1milliseconds" },
];
</script>

<style lang="scss" src="./index.scss"></style>
