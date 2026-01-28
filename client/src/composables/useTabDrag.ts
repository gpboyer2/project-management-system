/**
 * 标签页拖拽操作 composable
 */
import { ref } from 'vue';
import type { VisitedRoute } from './useVisitedRoutes';

/**
 * 标签页拖拽操作 composable
 * @returns {Object} 返回拖拽相关的状态和方法
 * @returns {Ref<string | null>} return.draggingTabPath - 当前正在拖拽的标签页路径
 * @returns {Ref<string | null>} return.dragOverTabPath - 拖拽悬停的目标标签页路径
 * @returns {Ref<number>} return.dragFromIndex - 拖拽起始位置的索引
 * @returns {Function} return.clearDragState - 清除拖拽状态
 * @returns {Function} return.handleDragStart - 处理拖拽开始事件
 * @returns {Function} return.handleDragEnd - 处理拖拽结束事件
 * @returns {Function} return.handleDragOver - 处理拖拽悬停事件
 * @returns {Function} return.handleDragLeave - 处理拖拽离开事件
 * @returns {Function} return.handleDrop - 处理放置事件
 */
export function useTabDrag() {
  const draggingTabPath = ref<string | null>(null);
  const dragOverTabPath = ref<string | null>(null);
  const dragFromIndex = ref<number>(-1);

  /**
   * 清除拖拽状态
   * @returns {void}
   */
  function clearDragState() {
    draggingTabPath.value = null;
    dragOverTabPath.value = null;
    dragFromIndex.value = -1;
  }

  /**
   * 处理拖拽开始事件
   * @param {DragEvent} event - 拖拽事件对象
   * @param {VisitedRoute} targetRoute - 目标路由对象
   * @param {number} index - 标签页索引
   * @returns {void}
   */
  function handleDragStart(event: DragEvent, targetRoute: VisitedRoute, index: number) {
    draggingTabPath.value = targetRoute.path;
    dragFromIndex.value = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
        (event.target as HTMLElement)?.classList.add('ide-tab--dragging');
      }, 0);
    }
  }

  /**
   * 处理拖拽结束事件
   * @returns {void}
   */
  function handleDragEnd() {
    clearDragState();
  }

  /**
   * 处理拖拽悬停事件
   * @param {DragEvent} event - 拖拽事件对象
   * @param {VisitedRoute} targetRoute - 目标路由对象
   * @returns {void}
   */
  function handleDragOver(event: DragEvent, targetRoute: VisitedRoute) {
    if (draggingTabPath.value && draggingTabPath.value !== targetRoute.path) {
      dragOverTabPath.value = targetRoute.path;
    }
  }

  /**
   * 处理拖拽离开事件
   * @param {DragEvent} _event - 拖拽事件对象
   * @returns {void}
   */
  function handleDragLeave(_event: DragEvent) {
  }

  /**
   * 处理放置事件
   * @param {DragEvent} event - 拖拽事件对象
   * @param {number} toIndex - 目标位置索引
   * @param {(from: number, to: number) => void} reorder - 重新排序的回调函数
   * @returns {void}
   */
  function handleDrop(event: DragEvent, toIndex: number, reorder: (from: number, to: number) => void) {
    event.preventDefault();
    reorder(dragFromIndex.value, toIndex);
    clearDragState();
  }

  return {
    draggingTabPath,
    dragOverTabPath,
    dragFromIndex,
    clearDragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
