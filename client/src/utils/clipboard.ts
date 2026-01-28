// 剪贴板操作工具函数

import { ElMessage } from 'element-plus';

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本内容
 * @param successMessage - 成功提示文案，默认为"已复制到剪贴板"
 * @returns Promise<boolean> - 复制是否成功
 */
export async function copyToClipboard(
  text: string,
  successMessage = '已复制到剪贴板'
): Promise<boolean> {
  if (!text) {
    ElMessage.warning('没有可复制的内容');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(successMessage);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error('复制失败');
    return false;
  }
}

/**
 * 复制 JSON 对象到剪贴板（格式化）
 * @param data - 要复制的对象
 * @param successMessage - 成功提示文案
 * @returns Promise<boolean> - 复制是否成功
 */
export async function copyJsonToClipboard(
  data: unknown,
  successMessage = '已复制到剪贴板'
): Promise<boolean> {
  const json_str = JSON.stringify(data, null, 2);
  return copyToClipboard(json_str, successMessage);
}
