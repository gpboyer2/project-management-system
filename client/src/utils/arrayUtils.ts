/**
 * 数组工具函数
 */

/**
 * 规范化包含 ID 字段的列表
 *
 * 功能：
 * - 确保 ID 是有效的正数
 * - 去重（使用 Set）
 * - 支持自定义 ID 字段名
 * - 支持自定义默认值（如方向）
 *
 * @param list - 原始列表（可能是非数组）
 * @param id_key - ID 字段名（如 'packet_id'）
 * @param default_direction - 默认方向值（可选）
 * @returns 规范化后的数组
 */
export function normalizeNumberedList<T extends { packet_id: number; direction?: string }>(
  list: any,
  id_key: string = 'packet_id',
  default_direction?: string
): Array<T> {
  const source_list = Array.isArray(list) ? list : [];
  const result: Array<T> = [];
  const seen = new Set<number>();

  for (const item of source_list) {
    // 提取并验证 ID
    const id_number = typeof item?.[id_key] === 'number' ? item[id_key] : Number(item?.[id_key]);

    // 跳过无效 ID
    if (!Number.isFinite(id_number) || id_number <= 0) {
      continue;
    }

    // 跳过重复 ID
    if (seen.has(id_number)) {
      continue;
    }

    // 构建结果项
    const normalized_item: any = {
      ...item,
      [id_key]: id_number,
    };

    // 如果提供了默认方向且方向字段存在，则设置默认值
    if (default_direction !== undefined && 'direction' in (normalized_item || {})) {
      normalized_item.direction = item?.direction === 'output' ? 'output' : default_direction;
    }

    seen.add(id_number);
    result.push(normalized_item);
  }

  return result;
}
