<!-- 数组类型字段编辑器 (Array) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      数组属性
    </div>

    <div class="array-length-options">
      <div class="array-length-hint">
        <el-icon><InfoFilled /></el-icon>
        以下三个属性只能选择其中之一
      </div>

      <div class="form-group">
        <label class="form-label">
          固定元素个数
        </label>

        <input
          v-model.number="field.count"
          type="number"
          :disabled="isCountDisabled"
          class="form-control"
          placeholder="请输入元素个数"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          动态关联长度
        </label>

        <el-select
          :model-value="field.count_from_field"
          placeholder="请选择引用字段名称"
          :disabled="isCountFromFieldDisabled"
          clearable
          style="width: 100%"
          @update:model-value="$emit('update', { path: '', property: 'count_from_field', value: $event || undefined })"
        >
          <el-option
            v-for="item in fieldsBeforeArray"
            :key="item.field_name"
            :label="item.display_name || item.field_name"
            :value="item.field_name"
          >
            <span :style="{ paddingLeft: (item.field_name.split('.').length - 1) * 15 + 'px' }">
              {{ item.display_name || item.field_name }}
            </span>
          </el-option>
        </el-select>
      </div>

      <div class="form-group">
        <label class="form-label">
          贪婪读取模式
        </label>

        <input
          v-model.number="field.bytes_in_trailer"
          type="number"
          class="form-control"
          :disabled="isBytesInTrailerDisabled"
          placeholder="请输入尾部保留字节数"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';

const props = defineProps<{
  field: any;
  fieldsBeforeArray: any[];
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

const isCountDisabled = computed(() => {
  return !!(props.field.value?.count_from_field || props.field.value?.bytes_in_trailer);
});

const isCountFromFieldDisabled = computed(() => {
  return !!(props.field.value?.count || props.field.value?.bytes_in_trailer);
});

const isBytesInTrailerDisabled = computed(() => {
  return !!(props.field.value?.count || props.field.value?.count_from_field);
});
</script>

<style lang="scss" src="./index.scss"></style>
