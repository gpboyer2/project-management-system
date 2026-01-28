/**
 * 删除确认对话框 composable
 * 统一 ElMessageBox.confirm 调用模式
 */
import { ElMessageBox, ElMessage } from 'element-plus';
import type { MessageBoxData } from 'element-plus';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: 'warning' | 'info' | 'success' | 'error';
  dangerouslyUseHTMLString?: boolean;
}

export interface ConfirmActionOptions<T = any> extends ConfirmOptions {
  // 确认后执行的操作
  onConfirm: () => T | Promise<T>;
  // 成功提示
  successMessage?: string;
  // 错误提示（函数接收错误对象）
  errorMessage?: string | ((error: any) => string);
  // 成功后的回调
  onSuccess?: (result: T) => void | Promise<void>;
  // 错误后的回调
  onError?: (error: any) => void;
  // 取消后的回调
  onCancel?: () => void;
}

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: '确认操作',
  message: '此操作将删除数据，是否继续？',
  confirmButtonText: '确定',
  cancelButtonText: '取消',
  type: 'warning'
};

/**
 * 显示确认对话框
 * @param {ConfirmOptions} options - 对话框配置选项
 * @returns {Promise<MessageBoxData>} 用户操作结果
 */
export function showConfirm(options: ConfirmOptions = {}): Promise<MessageBoxData> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return ElMessageBox.confirm(
    opts.message!,
    opts.title,
    {
      confirmButtonText: opts.confirmButtonText,
      cancelButtonText: opts.cancelButtonText,
      type: opts.type,
      dangerouslyUseHTMLString: opts.dangerouslyUseHTMLString
    }
  );
}

/**
 * 确认后执行操作，统一处理：确认提示 → 执行操作 → 成功/错误提示
 * @param {ConfirmActionOptions<T>} options - 操作配置选项
 * @returns {Promise<T | null>} 操作结果，取消时返回 null
 */
export async function confirmAction<T>(options: ConfirmActionOptions<T>): Promise<T | null> {
  const {
    onConfirm,
    successMessage = '操作成功',
    errorMessage,
    onSuccess,
    onError,
    onCancel,
    ...confirmOpts
  } = options;

  try {
    await showConfirm(confirmOpts);
  } catch (cancel_error) {
    // 用户取消
    if (onCancel) {
      onCancel();
    }
    return null;
  }

  try {
    const result = await onConfirm();

    // 显示成功提示
    if (successMessage) {
      ElMessage.success(successMessage);
    }

    // 执行成功回调
    if (onSuccess) {
      await onSuccess(result);
    }

    return result;
  } catch (error) {
    // 处理错误提示
    const msg = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage;
    if (msg) {
      ElMessage.error(msg);
    }

    // 执行错误回调
    if (onError) {
      onError(error);
    }

    throw error;
  }
}

/**
 * 删除确认快捷方法
 * @param {Omit<ConfirmActionOptions<T>, 'message' | 'type'>} options - 操作配置选项（排除 message 和 type）
 * @returns {Promise<T | null>} 操作结果，取消时返回 null
 */
export async function confirmDelete<T>(options: Omit<ConfirmActionOptions<T>, 'message' | 'type'>): Promise<T | null> {
  return confirmAction({
    ...options,
    message: options.message || '此操作将删除数据，是否继续？',
    type: 'warning'
  });
}

export function useConfirmDialog() {
  return {
    showConfirm,
    confirmAction,
    confirmDelete
  };
}
