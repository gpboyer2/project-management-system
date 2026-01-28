<!--
  有效性条件编辑器（通用）
  支持多种字段类型的有效性条件设置
-->
<template>
  <div class="form-section">
    <div class="form-section-title">
      有效性条件设置
    </div>

    <div class="form-group">
      <label class="form-label">
        启用有效性条件
      </label>

      <label class="form-checkbox-label">
        <input
          :disabled="isFirstField"
          name="isValidWhenEnabled"
          type="checkbox"
          :checked="checked"
          @change="handleChange"
        />
        是
      </label>
    </div>

    <div class="form-group">
      <label class="form-label">
        引用字段名称
      </label>

      <el-select
        :model-value="field.valid_when?.field"
        placeholder="请选择字段名称"
        :disabled="!checked"
        style="width: 100%"
        @change="handleFieldChange"
      >
        <el-option
          v-for="item in fieldOptionsData"
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
        引用字段值
      </label>

      <input
        :value="field.valid_when?.value"
        :disabled="!checked"
        type="number"
        class="form-control"
        placeholder="请输入引用字段值"
        @input="$emit('update', { path: 'valid_when', property: 'value', value: $event.target.value === '' ? null : Number($event.target.value) })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  field: any;
  fieldList?: any[];
  isFirstField?: boolean;
  fieldOptionsData: any[];
}>();

const emit = defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
  (e: 'enable-valid-when', enabled: boolean): void;
}>();

const checked = ref<boolean>(false);

// 监听字段变化，同步更新有效性条件的启用状态
watch(() => props.field, (newField: any) => {
  if (!newField) {
    checked.value = false;
    return;
  }

  // 检查字段是否配置了有效性条件
  if (newField.valid_when && newField.valid_when.field) {
    checked.value = true;
  } else {
    checked.value = false;
  }
}, { immediate: true });

/**
 * 处理有效性条件启用/禁用状态变更
 * @param {Event} event - 复选框变更事件对象
 * @returns {void}
 */
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const isChecked = target.checked;

  if (isChecked) {
    // 勾选：启用有效性条件
    checked.value = true;

    // 确保当前字段的 valid_when 对象存在
    if (props.field && !props.field.valid_when) {
      props.field.valid_when = { field: '', value: null };
    }
  } else {
    // 取消勾选：禁用有效性条件
    checked.value = false;
  }

  emit('enable-valid-when', isChecked);
}

/**
 * 处理引用字段名称变更
 * @param {string} value - 选中的字段名称
 * @returns {void}
 */
function handleFieldChange(value: string) {
  emit('update', { path: '', property: 'valid_when.field', value: value });
}
</script>

<style lang="scss" src="./index.scss"></style>
