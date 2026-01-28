<template>
  <span class="base-table">
    <div class="table-container">
      <table class="table" :class="{ 'table--loading': loading }">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'th--has-width': !!column.width, 'th--width': column.width ? true : undefined }"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="table-loading">
              <div class="loading-spinner" />
              加载中...
            </td>
          </tr>

          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length" class="table-empty">
              暂无数据
            </td>
          </tr>

          <tr
            v-for="(row, index) in data"
            v-else
            :key="getRowKey(row, index)"
            class="table-row"
            :class="{ 'table-row--stripe': stripe && index % 2 === 1 }"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="`table-cell--${column.key}`"
            >
              <slot :name="'cell-' + column.key" :row="row" :index="index">
                {{ getCellValue(row, column.key) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TableColumn {
  key: string
  title: string
  width?: string
  render?: (row: any, column: TableColumn, index: number) => any
}

/**
 * 表格配置选项
 * 将多个配置合并为一个 options 对象
 */
interface BaseTableOptions {
  loading?: boolean
  stripe?: boolean
  rowKey?: string | ((row: any) => string)
}

interface Props {
  columns: TableColumn[]
  data: any[]
  options?: BaseTableOptions
}

interface SlotProps {
  row: any
  index: number
}

// 默认配置
const defaultOptions: BaseTableOptions = {
  loading: false,
  stripe: true
};

const props = withDefaults(defineProps<Props>(), {
  options: () => defaultOptions
});

// 合并后的配置
const mergedOptions = computed(() => ({ ...defaultOptions, ...props.options }));

// 兼容旧版 props 的 getter（用于模板中）
const loading = computed(() => mergedOptions.value.loading ?? defaultOptions.loading);
const stripe = computed(() => mergedOptions.value.stripe ?? defaultOptions.stripe);
const rowKey = computed(() => mergedOptions.value.rowKey);

// 暴露插槽类型给父组件
defineExpose<{
  'cell-type': (props: SlotProps) => any
  'cell-status': (props: SlotProps) => any
  'cell-actions': (props: SlotProps) => any
  [key: `cell-${string}`]: (props: SlotProps) => any
}>();

/**
 * 获取行的唯一标识
 * 根据 rowKey 配置生成行的唯一键值
 * @param {any} row - 行数据对象
 * @param {number} index - 行索引
 * @returns {string} 行的唯一标识符
 */
function getRowKey(row: any, index: number): string {
  const key = rowKey.value;
  if (key) {
    return typeof key === 'function' ? key(row) : row[key];
  }
  return `row-${index}`;
}

/**
 * 获取单元格值
 * 支持通过点号分隔的路径访问嵌套属性
 * @param {any} row - 行数据对象
 * @param {string} key - 字段键名（支持嵌套路径，如 'user.name'）
 * @returns {any} 单元格的值
 */
function getCellValue(row: any, key: string): any {
  return key.split('.').reduce((obj, k) => obj?.[k], row);
}
</script>

<style lang="scss" src="./index.scss"></style>