/**
 * 列表拖拽排序 composable
 */
import { ref, type Ref } from 'vue';

export interface ListDragState<T> {
  draggingIndex: number | null;
  dragOverIndex: number | null;
  draggedItem: T | null;
}

/**
 * 列表拖拽排序 composable，提供完整的拖拽功能
 * @template T - 列表项类型，必须包含 id 字段
 * @param {Ref<T[]>} list - 响应式列表数据
 * @param {(fromIndex: number, toIndex: number) => void} [onReorder] - 列表重排序回调函数
 * @returns {{state: Ref<ListDragState<T>>, handleDragStart: Function, handleDragOver: Function, handleDragLeave: Function, handleDrop: Function, handleDragEnd: Function}} 拖拽状态和事件处理函数
 */
export function useListDrag<T extends { id: string | number }>(
  list: Ref<T[]>,
  onReorder?: (fromIndex: number, toIndex: number) => void
) {
  const state = ref<ListDragState<T>>({
    draggingIndex: null,
    dragOverIndex: null,
    draggedItem: null
  });

  /**
   * 处理拖拽开始事件，记录拖拽项和索引
   * @param {DragEvent} event - 拖拽事件对象
   * @param {T} item - 被拖拽的列表项
   * @param {number} index - 被拖拽项的索引
   * @returns {void}
   */
  function handleDragStart(event: DragEvent, item: T, index: number) {
    state.value.draggingIndex = index;
    state.value.draggedItem = item;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * 处理拖拽悬停事件，记录当前悬停位置
   * @param {DragEvent} event - 拖拽事件对象
   * @param {number} index - 悬停项的索引
   * @returns {void}
   */
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    state.value.dragOverIndex = index;
  }

  /**
   * 处理拖拽离开事件，清除悬停位置
   * @returns {void}
   */
  function handleDragLeave() {
    state.value.dragOverIndex = null;
  }

  /**
   * 处理放置事件，执行列表重新排序
   * @param {DragEvent} event - 拖拽事件对象
   * @param {number} toIndex - 目标位置索引
   * @returns {void}
   */
  function handleDrop(event: DragEvent, toIndex: number) {
    event.preventDefault();

    const fromIndex = state.value.draggingIndex;
    if (fromIndex === null || fromIndex === toIndex) {
      resetState();
      return;
    }

    const newList = [...list.value];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    list.value = newList;

    onReorder?.(fromIndex, toIndex);
    resetState();
  }

  /**
   * 处理拖拽结束事件，重置拖拽状态
   * @returns {void}
   */
  function handleDragEnd() {
    resetState();
  }

  /**
   * 重置拖拽状态到初始值
   * @returns {void}
   */
  function resetState() {
    state.value = {
      draggingIndex: null,
      dragOverIndex: null,
      draggedItem: null
    };
  }

  return {
    state,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };
}
