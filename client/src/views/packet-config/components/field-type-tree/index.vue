<!--
  字段结构树组件
  显示可拖拽的字段类型列表
-->
<template>
  <div class="field-type-tree">
    <VueDraggable
      :model-value="fieldTypeList"
      :group="{ name: 'fields', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneFieldType"
      class="draggable-field-tree"
      @update:model-value="() => {}"
    >
      <div
        v-for="fieldType in fieldTypeList"
        :key="fieldType.field_type || fieldType.fieldType"
        class="field-tree-item"
        draggable="true"
        @dblclick="handleAddField(fieldType)"
      >
        <div
          class="field-icon"
          :style="{ color: fieldType.icon_color || fieldType.iconColor }"
        >
          <el-icon><component :is="getFieldTypeIcon(fieldType.icon)" /></el-icon>
        </div>

        <div class="field-info">
          <span class="field-name">
            {{ fieldType.field_name || fieldType.fieldName }}
          </span>

          <span class="field-type">
            {{ fieldType.field_type || fieldType.fieldType }}
          </span>
        </div>

        <button
          class="field-add-btn"
          :title="`快速添加${fieldType.field_name || fieldType.fieldName}到末尾`"
          @click.stop="handleAddField(fieldType)"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>
    </VueDraggable>

    <div v-if="fieldTypeList.length === 0" class="field-tree-empty">
      <p>暂无字段类型</p>

      <p class="field-tree-empty-hint">
        请检查字段配置
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { Plus } from '@element-plus/icons-vue';
import { getFieldTypeIcon } from '@/utils/iconUtils';

interface FieldType {
  field_type?: string;
  fieldType?: string;
  field_name?: string;
  fieldName?: string;
  icon?: string;
  icon_color?: string;
  iconColor?: string;
}

interface Props {
  fieldTypeList: FieldType[];
}

interface Emits {
  (e: 'add-field', fieldType: FieldType): void;
  (e: 'clone', fieldType: FieldType): FieldType;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * 处理添加字段操作
 * @param {FieldType} fieldType - 字段类型对象
 * @returns {void}
 */
function handleAddField(fieldType: FieldType) {
  emit('add-field', fieldType);
}

/**
 * 克隆字段类型对象（用于拖拽）
 * @param {FieldType} fieldType - 字段类型对象
 * @returns {FieldType} 克隆后的字段类型对象
 */
function cloneFieldType(fieldType: FieldType) {
  emit('clone', fieldType);
  return { ...fieldType };
}
</script>

<style lang="scss" src="./index.scss"></style>
