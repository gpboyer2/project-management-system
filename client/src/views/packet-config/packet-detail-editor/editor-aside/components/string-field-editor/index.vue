<!-- 字符串字段编辑器 (String) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      字符串属性
    </div>

    <div class="form-group">
      <label class="form-label">
        字符编码
      </label>

      <el-select
        :model-value="field.encoding"
        placeholder="请选择"
        style="width: 100%"
        @update:model-value="$emit('update', { path: '', property: 'encoding', value: $event })"
      >
        <el-option label="UTF-8(UTF-8)" value="utf8" />

        <el-option label="国标扩展(GBK)" value="gbk" />

        <el-option label="美国标准(ASCII)" value="ascii" />

        <el-option label="国标(GB2312)" value="gb2312" />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        默认值
      </label>

      <input
        type="text"
        class="form-control"
        :value="field.default_value"
        placeholder="请输入默认值"
        @input="$emit('update', { path: '', property: 'default_value', value: $event.target.value })"
      />
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
</script>

<style lang="scss" src="./index.scss"></style>
