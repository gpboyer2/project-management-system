import type { Ref } from 'vue';

// 判断值是否为空
function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * 格式化空值显示
 */
export function formatValue(val: any): string {
  return isEmpty(val) ? '-' : String(val);
}

/**
 * 必填字段验证 - 返回第一个空字段的名称
 */
export function validateRequiredFields(
  fields: Record<string, any>,
  fieldNames: string[]
): string | undefined {
  return fieldNames.find(name => isEmpty(fields[name]));
}

/**
 * 统一的文件移除处理
 */
export function handleFileRemove(
  file: Ref<File | null>,
  file_list: Ref<any[]>,
  preview_data: Ref<any>
): void {
  file.value = null;
  file_list.value = [];
  preview_data.value = null;
}

/**
 * 树勾选数量统计
 */
export function updateTreeCheckedCount(
  tree_refs: Array<any>,
  counters: Array<Ref<number>>
): void {
  tree_refs.forEach((tree_ref, index) => {
    if (tree_ref && counters[index]) {
      counters[index].value = tree_ref.getCheckedNodes().length;
    }
  });
}
