<!-- 报文标识字段编辑器 (MessageId) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      报文标识属性
    </div>

    <div class="form-group">
      <label class="form-label">
        标识字段的数据类型
      </label>

      <el-select
        v-model="field.value_type"
        placeholder="请选择标识字段的数据类型"
        style="width: 150px"
        @change="$emit('update', { path: '', property: 'value_type', value: $event })"
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
        报文标识值
      </label>

      <input
        v-model.number="field.message_id_value"
        type="number"
        class="form-control"
        placeholder="请输入报文标识值"
        @change="validateMessageIdValue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";

const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

const valueTypeOptions = [
  { label: "无符号整数", value: "UnsignedInt" },
  { label: "有符号整数", value: "SignedInt" },
];

/**
 * 验证报文标识值的有效性
 * @param {any} e - 事件对象
 */
function validateMessageIdValue(e: any) {
  const val = e.target.value;
  const valueType = props.field?.value_type || "";

  const rules: Record<string, { reg: RegExp; msg: string }> = {
    UnsignedInt: {
      reg: /^[1-9]\d*$/,
      msg: "请输入正整数",
    },
    SignedInt: {
      reg: /^-\d+$/,
      msg: "请输入负整数",
    },
  };

  const rule = rules[valueType];
  if (rule && !rule.reg.test(val)) {
    ElMessage({
      type: "error",
      message: rule.msg,
    });
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
