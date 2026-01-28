/**
 * 数据变更检测工具函数
 */

/**
 * 判断数据是否发生变化
 * 通过将当前数据序列化为字符串与快照字符串比较
 *
 * @param current - 当前数据，任意类型
 * @param snapshot - 数据快照（JSON 字符串）
 * @returns true 表示数据有变化，false 表示无变化
 *
 * @example
 * ```typescript
 * const snapshot = JSON.stringify({ id: 1, name: 'test' });
 * const current = { id: 1, name: 'test2' };
 * hasDataChanged(current, snapshot); // true
 * ```
 */
export function hasDataChanged<T>(current: T | null, snapshot: string | null): boolean {
  // 当前数据为空，认为无变化
  if (!current) return false;
  // 没有快照记录，认为有变化
  if (!snapshot) return true;
  try {
    // 字符串比较判断是否变化
    return JSON.stringify(current) !== snapshot;
  } catch {
    // 序列化失败时认为有变化
    return true;
  }
}

/**
 * 创建数据快照
 * 将数据序列化为 JSON 字符串
 *
 * @param data - 要创建快照的数据
 * @returns JSON 字符串快照，数据为空时返回空字符串
 *
 * @example
 * ```typescript
 * const data = { id: 1, name: 'test' };
 * const snapshot = createDataSnapshot(data); // '{"id":1,"name":"test"}'
 * ```
 */
export function createDataSnapshot<T>(data: T | null): string {
  if (!data) return '';
  return JSON.stringify(data);
}
