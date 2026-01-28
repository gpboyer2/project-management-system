<!--
  统一筛选栏组件
  一行展示所有筛选选项，无收起/高级按钮

  Props:
  - searchPlaceholder: 搜索框占位符
  - searchModel: 搜索框 v-model 绑定值
  - filters: 筛选下拉框配置

  Filter 配置:
  - key: 筛选字段唯一标识
  - label: 筛选字段显示名称
  - placeholder: 下拉框占位符
  - compOptions: 选项列表（可动态加载）
  - modelValue: 当前选中值

  Events:
  - update:searchModel: 搜索框输入事件
  - filter-change: 筛选条件变化事件 (key, value)
-->
<template>
  <div class="filter-bar">
    <!-- 搜索框 -->
    <el-input
      v-if="searchConfig !== false"
      v-model="internalSearchValue"
      class="filter-bar-search"
      :placeholder="searchPlaceholder || '搜索...'"
      clearable
      @input="handleSearchInput"
      @clear="handleSearchClear"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <!-- 筛选下拉框 -->
    <template v-for="filter in filterList" :key="filter.key">
      <el-select
        v-model="filterValues[filter.key]"
        class="filter-bar-select"
        :placeholder="filter.placeholder || `选择${filter.label}`"
        clearable
        @change="handleFilterChange(filter.key, $event)"
      >
        <el-option
          v-for="option in filter.compOptions"
          :key="getOptionValue(option)"
          :label="getOptionLabel(option)"
          :value="getOptionValue(option)"
        />
      </el-select>
    </template>

    <!-- 插槽：支持自定义筛选项 -->
    <slot name="custom" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Search } from '@element-plus/icons-vue';

// 筛选选项配置
export interface FilterOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// 单个筛选器配置
export interface FilterConfig {
  key: string;
  label: string;
  placeholder?: string;
  compOptions: FilterOption[];
  modelValue?: string | number;
}

// Props
interface FilterBarProps {
  searchPlaceholder?: string;
  searchModel?: string | number;
  searchConfig?: boolean | { placeholder?: string };
  filters?: FilterConfig[];
}

const props = withDefaults(defineProps<FilterBarProps>(), {
  searchConfig: true,
  filters: () => []
});

// Emits
interface FilterBarEmits {
  (e: 'update:searchModel', value: string): void;
  (e: 'search', value: string): void;
  (e: 'filter-change', key: string, value: any): void;
}

const emit = defineEmits<FilterBarEmits>();

// 搜索值
const internalSearchValue = ref(props.searchModel || '');

// 筛选值
const filterValues = ref<Record<string, any>>({});

// 初始化筛选值
watch(() => props.filters, (newFilters) => {
  newFilters.forEach(filter => {
    if (filter.modelValue !== undefined && filterValues.value[filter.key] === undefined) {
      filterValues.value[filter.key] = filter.modelValue;
    }
  });
}, { immediate: true });

// 监听 searchModel 变化
watch(() => props.searchModel, (newValue) => {
  internalSearchValue.value = newValue || '';
});

// 筛选列表（计算属性）
const filterList = computed(() => props.filters);

/**
 * 获取选项的值
 * 从筛选选项对象中提取值字段
 * @param {FilterOption} option - 筛选选项对象
 * @returns {string | number} 选项的值
 */
function getOptionValue(option: FilterOption): string | number {
  return option.value;
}

/**
 * 获取选项的显示标签
 * 从筛选选项对象中提取标签字段
 * @param {FilterOption} option - 筛选选项对象
 * @returns {string} 选项的显示标签
 */
function getOptionLabel(option: FilterOption): string {
  return option.label;
}

/**
 * 处理搜索输入事件
 * 触发搜索值更新和搜索事件
 * @param {string} value - 搜索框输入的值
 * @returns {void}
 */
function handleSearchInput(value: string) {
  emit('update:searchModel', value);
  emit('search', value);
}

/**
 * 处理搜索清空事件
 * 清空搜索框并触发搜索事件
 * @returns {void}
 */
function handleSearchClear() {
  emit('update:searchModel', '');
  emit('search', '');
}

/**
 * 处理筛选条件变化事件
 * 当某个筛选项的值发生变化时触发
 * @param {string} key - 筛选字段的键名
 * @param {any} value - 筛选字段的新值
 * @returns {void}
 */
function handleFilterChange(key: string, value: any) {
  emit('filter-change', key, value);
}
</script>

<style lang="scss" src="./index.scss"></style>
