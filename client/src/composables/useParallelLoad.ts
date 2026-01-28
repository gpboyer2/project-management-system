/**
 * 并行加载 composable
 * 封装 Promise.all 并行加载模式
 */
import { ElMessage } from 'element-plus';

export interface ParallelLoadOptions<T> {
  // 加载函数列表
  loaders: Array<() => Promise<T>>;
  // 是否在部分失败时继续
  continueOnError?: boolean;
  // 全部成功后的提示
  successMessage?: string;
  // 全部失败后的提示
  errorMessage?: string;
  // 部分失败后的提示
  partialErrorMessage?: string;
  // 加载开始前的回调
  onStart?: () => void;
  // 全部完成后的回调
  onComplete?: (results: T[]) => void;
  // 失败时的回调
  onError?: (errors: any[]) => void;
}

export interface ParallelLoadResult<T> {
  success: boolean;
  data: T[];
  errors: any[];
  success_count: number;
  fail_count: number;
}

/**
 * 并行加载多个资源
 * @param {ParallelLoadOptions<T>} options - 加载选项
 * @returns {Promise<ParallelLoadResult<T>>} 加载结果
 */
export async function parallelLoad<T>(
  options: ParallelLoadOptions<T>
): Promise<ParallelLoadResult<T>> {
  const {
    loaders,
    continueOnError = false,
    successMessage,
    errorMessage = '加载失败',
    partialErrorMessage,
    onStart,
    onComplete,
    onError
  } = options;

  // 开始回调
  if (onStart) {
    onStart();
  }

  const results: T[] = [];
  const errors: any[] = [];

  try {
    if (continueOnError) {
      // 部分失败时继续：逐个执行并捕获错误
      for (const loader of loaders) {
        try {
          const data = await loader();
          results.push(data);
        } catch (error) {
          errors.push(error);
        }
      }
    } else {
      // 任何失败都停止：使用 Promise.all
      const data = await Promise.all(loaders.map(loader => loader()));
      results.push(...data);
    }

    const success_count = results.length;
    const fail_count = errors.length;
    const total_count = loaders.length;

    // 全部成功
    if (fail_count === 0 && success_count === total_count) {
      if (successMessage) {
        ElMessage.success(successMessage);
      }
      if (onComplete) {
        onComplete(results);
      }
      return {
        success: true,
        data: results,
        errors: [],
        success_count,
        fail_count
      };
    }

    // 全部失败
    if (success_count === 0) {
      if (errorMessage) {
        ElMessage.error(errorMessage);
      }
      if (onError) {
        onError(errors);
      }
      return {
        success: false,
        data: [],
        errors,
        success_count,
        fail_count
      };
    }

    // 部分成功
    if (partialErrorMessage) {
      ElMessage.warning(`${partialErrorMessage}：${success_count}/${total_count} 成功`);
    }
    if (onComplete) {
      onComplete(results);
    }
    return {
      success: false,
      data: results,
      errors,
      success_count,
      fail_count
    };

  } catch (error) {
    // Promise.all 失败（continueOnError = false 时）
    if (errorMessage) {
      ElMessage.error(errorMessage);
    }
    if (onError) {
      onError([error]);
    }
    return {
      success: false,
      data: results,
      errors: [error],
      success_count: 0,
      fail_count: 1
    };
  }
}

/**
 * 并行加载并返回 Map 结构（按索引映射）
 * @param {Array<() => Promise<T>>} loaders - 加载函数列表
 * @param {{ continueOnError?: boolean }} options - 可选配置
 * @returns {Promise<Map<number, T>>} 按索引映射的结果
 */
export async function parallelLoadMap<T>(
  loaders: Array<() => Promise<T>>,
  options?: { continueOnError?: boolean }
): Promise<Map<number, T>> {
  const result = new Map<number, T>();

  if (options?.continueOnError) {
    // 逐个执行
    for (let i = 0; i < loaders.length; i++) {
      try {
        const data = await loaders[i]();
        result.set(i, data);
      } catch {
        // 忽略错误
      }
    }
  } else {
    // 使用 Promise.all
    const data = await Promise.all(loaders.map(loader => loader()));
    data.forEach((item, index) => {
      result.set(index, item);
    });
  }

  return result;
}

/**
 * 带重试的并行加载
 * @param {Array<() => Promise<T>>} loaders - 加载函数列表
 * @param {{ maxRetries?: number; retryDelay?: number; continueOnError?: boolean }} options - 可选配置
 * @returns {Promise<ParallelLoadResult<T>>} 加载结果
 */
export async function parallelLoadWithRetry<T>(
  loaders: Array<() => Promise<T>>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    continueOnError?: boolean;
  }
): Promise<ParallelLoadResult<T>> {
  const { maxRetries = 3, retryDelay = 1000, continueOnError = false } = options || {};

  const wrapLoader = (loader: () => Promise<T>) => {
    return async (): Promise<T> => {
      let last_error: any;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await loader();
        } catch (error) {
          last_error = error;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }
      throw last_error;
    };
  };

  return parallelLoad({
    loaders: loaders.map(wrapLoader),
    continueOnError
  });
}

export function useParallelLoad() {
  return {
    parallelLoad,
    parallelLoadMap,
    parallelLoadWithRetry
  };
}
