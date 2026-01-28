/**
 * 性能优化工具函数
 */

/**
 * 节流函数：在指定时间内只执行一次
 * @param {T} func - 要节流的函数
 * @param {number} delay - 延迟时间（毫秒），在此时间内只执行一次
 * @returns {(...args: Parameters<T>) => void} 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
      }, delay - (now - lastCall));
    }
  };
}

/**
 * 防抖函数：在指定时间内多次调用只执行最后一次
 * @param {T} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒），等待时间结束后执行最后一次调用
 * @returns {(...args: Parameters<T>) => void} 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 请求动画帧节流：使用 requestAnimationFrame 实现的节流
 * @param {T} func - 要节流的函数
 * @returns {(...args: Parameters<T>) => void} 使用 requestAnimationFrame 节流后的函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * 延迟执行函数
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>} 延迟指定时间后 resolve 的 Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批量执行多个操作，支持分组和延迟控制
 * @param {(() => T | Promise<T>)[]} operations - 要执行的操作函数数组
 * @param {number} group_size - 每组执行的操作数量，默认为 10
 * @param {number} delay - 组之间的延迟时间（毫秒），默认为 0（不延迟）
 * @returns {Promise<T[]>} 所有操作执行结果的数组
 */
export async function executeMultiple<T>(
  operations: (() => T | Promise<T>)[],
  group_size: number = 10,
  delay: number = 0
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += group_size) {
    const group = operations.slice(i, i + group_size);
    const groupResults = await Promise.all(group.map(op => op()));
    results.push(...groupResults);

    if (delay > 0 && i + group_size < operations.length) {
      await sleep(delay);
    }
  }

  return results;
}
