/**
 * 保存后刷新 composable
 * 封装"保存→提示→刷新"通用模式
 */
import { ElMessage } from 'element-plus';

export interface DataRefreshOptions<T> {
  // 保存操作
  saveAction: () => T | Promise<T>;
  // 刷新操作
  refreshAction: () => void | Promise<void>;
  // 成功提示
  successMessage?: string;
  // 错误提示
  errorMessage?: string | ((error: any) => string);
  // 是否显示加载中
  showLoading?: boolean;
  // 加载中提示
  loadingMessage?: string;
  // 保存前回调
  beforeSave?: () => void | Promise<void>;
  // 保存成功后回调
  afterSave?: (result: T) => void | Promise<void>;
  // 刷新完成后回调
  afterRefresh?: () => void;
  // 保存失败后回调
  onSaveError?: (error: any) => void;
}

export interface DataRefreshResult<T> {
  data: T | null;
  success: boolean;
  error: any;
}

/**
 * 执行保存后刷新操作
 * @param {DataRefreshOptions<T>} options - 配置选项
 * @returns {Promise<DataRefreshResult<T>>} 操作结果
 */
export async function saveAndRefresh<T>(options: DataRefreshOptions<T>): Promise<DataRefreshResult<T>> {
  const {
    saveAction,
    refreshAction,
    successMessage = '保存成功',
    errorMessage,
    showLoading = false,
    loadingMessage = '保存中...',
    beforeSave,
    afterSave,
    afterRefresh,
    onSaveError
  } = options;

  let loading_instance: ReturnType<typeof ElMessage> | null = null;

  try {
    // 保存前回调
    if (beforeSave) {
      await beforeSave();
    }

    // 显示加载中
    if (showLoading) {
      loading_instance = ElMessage.info({
        message: loadingMessage,
        duration: 0
      });
    }

    // 执行保存
    const result = await saveAction();

    // 关闭加载中
    if (loading_instance) {
      loading_instance.close();
    }

    // 显示成功提示
    ElMessage.success(successMessage);

    // 保存成功后回调
    if (afterSave) {
      await afterSave(result);
    }

    // 执行刷新
    await refreshAction();

    // 刷新完成后回调
    if (afterRefresh) {
      afterRefresh();
    }

    return {
      data: result,
      success: true,
      error: null
    };
  } catch (error) {
    // 关闭加载中
    if (loading_instance) {
      loading_instance.close();
    }

    // 处理错误提示
    const msg = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
    if (msg) {
      ElMessage.error(msg);
    }

    // 保存失败后回调
    if (onSaveError) {
      onSaveError(error);
    }

    return {
      data: null,
      success: false,
      error
    };
  }
}

/**
 * 批量保存后刷新操作
 * 全部成功：只显示一次"操作成功"
 * 部分成功：显示失败的那个请求的错误信息
 * 全部失败：聚合所有错误信息
 * @param {Array<{ saveAction: () => T | Promise<T> }>} items - 待保存项列表
 * @param {() => void | Promise<void>} refreshAction - 刷新操作
 * @param {Object} options - 配置选项
 * @param {string} options.successMessage - 成功提示
 * @param {string} options.aggregateErrorMessage - 聚合错误提示
 * @returns {Promise<DataRefreshResult<T[]>>} 操作结果
 */
export async function batchSaveAndRefresh<T>(
  items: Array<{ saveAction: () => T | Promise<T> }>,
  refreshAction: () => void | Promise<void>,
  options?: {
    successMessage?: string;
    aggregateErrorMessage?: string;
  }
): Promise<DataRefreshResult<T[]>> {
  const { successMessage = '操作成功', aggregateErrorMessage = '部分操作失败' } = options || {};

  const results: Array<{ success: boolean; data: T | null; error: any }> = [];
  const errors: any[] = [];

  // 依次执行保存操作
  for (const item of items) {
    try {
      const data = await item.saveAction();
      results.push({ success: true, data, error: null });
    } catch (error) {
      results.push({ success: false, data: null, error });
      errors.push(error);
    }
  }

  // 全部成功
  if (errors.length === 0) {
    ElMessage.success(successMessage);
    await refreshAction();
    return {
      data: results.map(r => r.data).filter(Boolean) as T[],
      success: true,
      error: null
    };
  }

  // 全部失败
  if (errors.length === items.length) {
    const error_msgs = errors.map(e => e?.message || '未知错误').join('；');
    ElMessage.error(`${aggregateErrorMessage}：${error_msgs}`);
    return {
      data: null,
      success: false,
      error: errors
    };
  }

  // 部分失败 - 显示第一个错误
  ElMessage.error(errors[0]?.message || '部分操作失败');
  await refreshAction();
  return {
    data: results.map(r => r.data).filter(Boolean) as T[],
    success: false,
    error: errors
  };
}

export function useDataRefresh() {
  return {
    saveAndRefresh,
    batchSaveAndRefresh
  };
}
