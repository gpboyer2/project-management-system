// 草稿管理工具函数

import { MessageService } from '@/services';

/**
 * 批量检查草稿状态
 * @param item_list - 需要检查的项目列表
 * @param message_extractor - 从项目中提取 message_id 的函数
 * @param draft_checker - 检查草稿状态的函数（默认使用 MessageService.checkDrafts）
 * @returns Promise<Record<string, boolean>> - 返回每个 message_id 对应的草稿状态
 */
export async function check_drafts_for_items(
  item_list: any[],
  message_extractor: (item: any) => string,
  draft_checker?: (message_id_list: string[]) => Promise<any>
): Promise<Record<string, boolean>> {
  if (!item_list || item_list.length === 0) {
    return {};
  }

  // 提取所有 message_id
  const message_id_list = item_list.map(message_extractor).filter(Boolean);

  if (message_id_list.length === 0) {
    return {};
  }

  try {
    // 使用提供的检查函数或默认的 MessageService
    const checker = draft_checker || MessageService.checkDrafts;
    const response = await checker(message_id_list);

    if (response.status === 'success' && response.datum) {
      return response.datum;
    }

    return {};
  } catch (error) {
    console.error('检查草稿状态失败:', error);
    return {};
  }
}

/**
 * 构建草稿保存数据
 * 只保留发生变化的字段，避免提交不必要的数据
 * @param original_data - 原始数据
 * @param modified_data - 修改后的数据
 * @returns any - 返回只包含变化字段的草稿数据
 */
export function build_draft_save_data(original_data: any, modified_data: any): any {
  if (!original_data || !modified_data) {
    return modified_data;
  }

  const draft_data: any = {};

  // 遍历修改后的数据，找出发生变化的字段
  for (const key in modified_data) {
    if (modified_data.hasOwnProperty(key)) {
      const original_value = original_data[key];
      const modified_value = modified_data[key];

      // 值发生变化，加入到草稿数据中
      if (JSON.stringify(original_value) !== JSON.stringify(modified_value)) {
        draft_data[key] = modified_value;
      }
    }
  }

  return draft_data;
}

/**
 * 检查是否有草稿变更
 * @param original - 原始数据
 * @param current - 当前数据
 * @returns boolean - 如果有变化返回 true，否则返回 false
 */
export function has_draft_changes(original: any, current: any): boolean {
  if (!original && !current) {
    return false;
  }

  if (!original || !current) {
    return true;
  }

  // 比较两个对象的 JSON 字符串
  return JSON.stringify(original) !== JSON.stringify(current);
}
