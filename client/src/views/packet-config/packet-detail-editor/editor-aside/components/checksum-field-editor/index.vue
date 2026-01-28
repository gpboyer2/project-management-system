<!-- 校验位字段编辑器 (Checksum) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      校验位属性
    </div>

    <div class="form-group">
      <label class="form-label">
        校验算法
      </label>

      <el-select
        :model-value="compOptions.field.algorithm"
        placeholder="请选择校验算法"
        style="width: 100%"
        @update:model-value="$emit('update', { path: '', property: 'algorithm', value: $event })"
      >
        <el-option
          v-for="item in checksumAlgorithmOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        校验范围起始引用
      </label>

      <el-select
        :model-value="compOptions.field.range_start_ref"
        placeholder="请选择起始字段（留空表示起始位置）"
        clearable
        style="width: 100%"
        @update:model-value="$emit('update', { path: '', property: 'range_start_ref', value: $event })"
      >
        <el-option
          v-for="item in compOptions.fieldsBeforeChecksum"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        校验范围结束引用
      </label>

      <el-select
        :model-value="compOptions.field.range_end_ref"
        placeholder="请选择结束字段（留空表示本字段之前）"
        clearable
        style="width: 100%"
        @update:model-value="$emit('update', { path: '', property: 'range_end_ref', value: $event })"
      >
        <el-option
          v-for="item in compOptions.fieldsBeforeChecksum"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <!-- 算法参数配置 -->
    <div v-if="currentAlgorithmParams.length > 0" class="form-group">
      <label class="form-label">
        算法参数
        <span class="form-label-tip">
          （双击参数值进行修改）
        </span>
      </label>

      <div class="algorithm-params-table">
        <div class="algorithm-params-header">
          <span class="params-col-name">
            参数名称
          </span>

          <span class="params-col-value">
            参数值
          </span>
        </div>

        <div
          v-for="param in currentAlgorithmParams"
          :key="param.name"
          class="algorithm-params-row"
        >
          <span class="params-col-name" :title="param.description">
            {{ param.label }}
          </span>

          <span
            class="params-col-value"
            :class="{ 'is-editing': editingParamName === param.name }"
            @dblclick="startEditing(param.name)"
          >
            <template v-if="editingParamName === param.name">
              <!-- 布尔类型：开关 -->
              <template v-if="param.type === 'boolean'">
                <el-select
                  :ref="(el) => setParamInputRef(el, param.name)"
                  :model-value="getParamValue(param.name, param.defaultValue)"
                  size="small"
                  style="width: 100%"
                  @update:model-value="(val) => { setParamValue(param.name, val); stopEditing(); }"
                  @blur="stopEditing"
                >
                  <el-option :value="true" label="是" />

                  <el-option :value="false" label="否" />
                </el-select>
              </template>
              <!-- 选择类型：下拉框 -->
              <template v-else-if="param.type === 'select'">
                <el-select
                  :ref="(el) => setParamInputRef(el, param.name)"
                  :model-value="getParamValue(param.name, param.defaultValue)"
                  placeholder="请选择"
                  size="small"
                  style="width: 100%"
                  @update:model-value="(val) => { setParamValue(param.name, val); stopEditing(); }"
                  @blur="stopEditing"
                >
                  <el-option
                    v-for="opt in param.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
              <!-- 数字类型：数字输入框 -->
              <template v-else-if="param.type === 'number'">
                <input
                  :ref="(el) => setParamInputRef(el, param.name)"
                  type="number"
                  class="form-control form-control-small"
                  :value="getParamValue(param.name, param.defaultValue)"
                  :placeholder="param.placeholder || ''"
                  @blur="stopEditing"
                  @keyup.enter="stopEditing"
                  @input="setParamValue(param.name, parseFloat(($event.target as HTMLInputElement).value) || 0)"
                />
              </template>
              <!-- 字符串类型：文本输入框 -->
              <template v-else>
                <input
                  :ref="(el) => setParamInputRef(el, param.name)"
                  type="text"
                  class="form-control form-control-small"
                  :value="getParamValue(param.name, param.defaultValue)"
                  :placeholder="param.placeholder || ''"
                  @blur="stopEditing"
                  @keyup.enter="stopEditing"
                  @input="setParamValue(param.name, ($event.target as HTMLInputElement).value)"
                />
              </template>
            </template>

            <template v-else>
              <span class="param-value-text" title="双击可编辑">
                {{ getParamDisplayValue(param) }}
              </span>
            </template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { getAlgorithmParams, type AlgorithmParamDef } from "@/config/checksum-algorithm-params";

const props = defineProps<{
  compOptions: {
    field: any;
    fieldsBeforeChecksum: { label: string; value: string }[];
  };
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

const checksumAlgorithmOptions = [
  { label: "CRC16-MODBUS", value: "crc16-modbus" },
  { label: "CRC32", value: "crc32" },
  { label: "CRC16-CCITT", value: "crc16-ccitt" },
  { label: "CRC16-XMODEM", value: "crc16-xmodem" },
  { label: "SUM8 (8位累加和)", value: "sum8" },
  { label: "SUM16 (16位累加和)", value: "sum16" },
  { label: "XOR (异或校验)", value: "xor" },
  { label: "自定义", value: "custom" },
];

// 获取当前选中算法的参数配置
const currentAlgorithmParams = computed<AlgorithmParamDef[]>(() => {
  const field = props.compOptions.field;
  if (!field || field.type !== 'Checksum' || !field.algorithm) {
    return [];
  }
  return getAlgorithmParams(field.algorithm);
});

/**
 * 获取算法参数值
 * @param {string} paramName - 参数名称
 * @param {string | number | boolean} defaultValue - 默认值
 * @returns {string | number | boolean} 参数值
 */
function getParamValue(paramName: string, defaultValue: string | number | boolean): string | number | boolean {
  const field = props.compOptions.field;
  if (!field || !field.parameters) {
    return defaultValue;
  }
  const value = field.parameters[paramName];
  return value !== undefined ? value : defaultValue;
}

/**
 * 设置算法参数值
 * @param {string} paramName - 参数名称
 * @param {string | number | boolean} value - 参数值
 */
function setParamValue(paramName: string, value: string | number | boolean) {
  const field = props.compOptions.field;
  if (!field) return;

  // 初始化 parameters 对象
  if (!field.parameters || typeof field.parameters !== 'object') {
    field.parameters = {};
  }

  // 设置参数值
  field.parameters[paramName] = value;
}

/**
 * 设置参数输入框引用
 * @param {any} el - DOM元素引用
 * @param {string} name - 参数名称
 */
const setParamInputRef = (el: any, name: string) => {
  if (el) {
    paramInputRefs.value[name] = el;
  }
};

/**
 * 开始编辑参数
 * @param {string} paramName - 参数名称
 */
const startEditing = (paramName: string) => {
  editingParamName.value = paramName;
  nextTick(() => {
    const el = paramInputRefs.value[paramName];
    if (el) {
      if (typeof el.focus === 'function') {
        el.focus();
      }
    }
  });
};

/**
 * 停止编辑参数
 */
const stopEditing = () => {
  editingParamName.value = null;
};

/**
 * 获取参数显示值
 * @param {AlgorithmParamDef} param - 算法参数定义
 * @returns {string | number | boolean} 格式化后的显示值
 */
const getParamDisplayValue = (param: AlgorithmParamDef) => {
  const val = getParamValue(param.name, param.defaultValue);
  if (param.type === 'boolean') {
    return val ? '是' : '否';
  }
  if (param.type === 'select') {
    const option = param.options?.find((opt) => opt.value === val);
    return option ? option.label : val;
  }
  return val;
};
</script>

<style lang="scss" src="./index.scss"></style>
