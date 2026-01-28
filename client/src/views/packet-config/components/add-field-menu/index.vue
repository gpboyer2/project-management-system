<!--
  添加字段菜单
  从字段类型列表中选择并添加字段
-->
<template>
  <div class="add-field-menu">
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
          :class="fieldType.icon"
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
interface FieldType {
  field_type: string;
  field_name: string;
  icon: string;
  icon_color: string;
  icon_bg_color: string;
  attr: string;
}

defineProps<{
  fieldTypeList: FieldType[];
}>();

defineEmits<{
  (e: 'select', fieldType: string): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
