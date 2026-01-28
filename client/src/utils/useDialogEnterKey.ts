/**
 * 弹窗回车确认功能 composable
 * 用于弹窗中有确定按钮时，按回车键触发确认
 *
 * 注意：推荐在输入框上直接使用 @keyup.enter，而不是全局监听
 * 这个函数主要用于无法访问输入框组件的场景
 */
import { onUnmounted, type Ref, nextTick } from 'vue';

/**
 * 弹窗回车确认功能
 * @param visibleRef - 弹窗可见状态的响应式引用
 * @param confirmCallback - 确认回调函数
 */
export function useDialogEnterKey(visibleRef: Ref<boolean>, confirmCallback: () => void) {
  /**
   * 处理键盘按下事件
   * @param event - 键盘事件对象
   */
  function handleKeyDown(event: KeyboardEvent) {
    // 只在弹窗可见时响应
    if (!visibleRef.value) return;

    // 回车键触发确认（使用冒泡阶段，让组件内部事件优先处理）
    if (event.key === 'Enter') {
      event.preventDefault();

      // 等待 Vue 的响应式系统更新完成
      // 这样可以确保输入框的值已经同步到响应式变量中
      nextTick(() => {
        confirmCallback();
      });
    }
  }

  document.addEventListener('keydown', handleKeyDown, false);

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, false);
  });
}
