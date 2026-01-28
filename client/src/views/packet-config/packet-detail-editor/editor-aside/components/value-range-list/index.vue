<!--
  值范围列表组件
  用于编辑数值类型的取值范围 (min ~ max)
-->
<template>
  <div class="value-range-list">
    <div
      v-for="(range, idx) in normalizedRanges"
      :key="idx"
      class="value-range-item"
    >
      <input
        :value="range.min"
        :type="inputType"
        :step="inputStep"
        class="form-control form-control-inline"
        placeholder="最小值"
        @input="handleMinChange(idx, $event)"
      />

      <span class="range-separator">
        ~
      </span>

      <input
        :value="range.max"
        :type="inputType"
        :step="inputStep"
        class="form-control form-control-inline"
        placeholder="最大值"
        @input="handleMaxChange(idx, $event)"
      />

      <button
        class="btn-remove"
        type="button"
        @click="handleRemove(idx)"
      >
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <button
      class="btn-add"
      type="button"
      @click="handleAdd"
    >
      + 添加范围
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Close } from '@element-plus/icons-vue';

interface ValueRange {
  min: any;
  max: any;
}

interface Props {
  // 优先使用 ranges；保留 range_list 作为兼容字段（避免旧调用方）
  ranges?: ValueRange[];
  range_list?: ValueRange[];
  step?: string | number;
  valueType?: 'number' | 'string';
}

interface Emits {
  (e: 'update', index: number, field: 'min' | 'max', value: number | string | null): void;
  (e: 'remove', index: number): void;
  (e: 'add'): void;
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  valueType: 'number',
  ranges: undefined,
  range_list: undefined,
});

const emit = defineEmits<Emits>();

const normalizedRanges = computed(() => {
  if (Array.isArray(props.ranges)) return props.ranges;
  if (Array.isArray(props.range_list)) return props.range_list;
  return [];
});

const inputType = computed(() => (props.valueType === 'string' ? 'text' : 'number'));
const inputStep = computed(() => (props.valueType === 'string' ? undefined : props.step));

/**
 * 解析输入值，根据值类型返回对应的数据
 * @param {string} raw - 原始输入字符串
 * @returns {number | string | null} 解析后的值，空字符串返回 null
 */
function parseInputValue(raw: string): number | string | null {
  if (raw === '') return null;
  if (props.valueType === 'string') return raw;
  return Number(raw);
}

/**
 * 处理最小值变更事件
 * @param {number} index - 范围项的索引
 * @param {Event} event - 输入框变更事件对象
 * @returns {void}
 */
function handleMinChange(index: number, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update', index, 'min', parseInputValue(value));
}

/**
 * 处理最大值变更事件
 * @param {number} index - 范围项的索引
 * @param {Event} event - 输入框变更事件对象
 * @returns {void}
 */
function handleMaxChange(index: number, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('update', index, 'max', parseInputValue(value));
}

/**
 * 处理删除范围项事件
 * @param {number} index - 要删除的范围项索引
 * @returns {void}
 */
function handleRemove(index: number) {
  emit('remove', index);
}

/**
 * 处理添加新范围项事件
 * @returns {void}
 */
function handleAdd() {
  emit('add');
}
</script>

<style lang="scss" src="./index.scss"></style>
