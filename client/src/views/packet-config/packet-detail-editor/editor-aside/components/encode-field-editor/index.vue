<!-- 编码字段编辑器 (Encode) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      编码属性
    </div>

    <div class="form-group">
      <label class="form-label">
        类型
      </label>

      <el-select
        v-model="field.base_type"
        placeholder="请选择类型"
        style="width: 100%"
        @change="$emit('update', { path: '', property: 'base_type', value: $event })"
      >
        <el-option
          v-for="item in valueTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        取值及含义
      </label>

      <div class="value-mapping-list">
        <div
          v-for="(mapping, idx) in field.maps || []"
          :key="idx"
          class="value-mapping-item"
        >
          <input
            v-model.number="mapping.value"
            type="number"
            class="form-control form-control-inline"
            placeholder="取值"
          />

          <input
            v-model="mapping.meaning"
            type="text"
            class="form-control form-control-inline"
            placeholder="含义"
          />

          <button
            class="btn-remove"
            type="button"
            @click="$emit('remove', { path: 'maps', index: idx })"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <button
          class="btn-add"
          type="button"
          @click="$emit('add', { path: 'maps', item: { value: 0, meaning: '' } })"
        >
          + 添加取值
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';

const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
  (e: 'remove', payload: { path: string; index: number }): void;
  (e: 'add', payload: { path: string; item: any }): void;
}>();

const valueTypeOptions = [
  { label: "无符号整数", value: "UnsignedInt" },
  { label: "有符号整数", value: "SignedInt" },
];
</script>

<style lang="scss" src="./index.scss"></style>
