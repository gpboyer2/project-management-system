<!-- 描述编辑器（通用） -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      描述
    </div>

    <div class="form-group">
      <textarea
        class="form-control form-control-textarea"
        rows="2"
        :value="field.description"
        placeholder="请输入字段描述"
        @input="$emit('update', { path: '', property: 'description', value: $event.target.value })"
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
