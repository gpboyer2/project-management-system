/**
 * 右键菜单状态管理 composable
 * @returns {{
 *   contextMenu: import('vue').Ref<ContextMenuState>,
 *   handleContextMenu: (event: MouseEvent, _targetRoute: any, index: number, menuWidth?: number, menuHeight?: number, offset?: number) => void,
 *   closeContextMenu: () => void
 * }} 右键菜单状态和操作方法
 */
import { ref } from 'vue';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetIndex: number;
}

export function useContextMenu() {
  const contextMenu = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetIndex: -1
  });

  /**
   * 处理右键菜单事件
   * @param {MouseEvent} event - 鼠标事件对象
   * @param {any} _targetRoute - 目标路由（当前未使用）
   * @param {number} index - 目标元素的索引
   * @param {number} menuWidth - 菜单宽度，默认 140
   * @param {number} menuHeight - 菜单高度，默认 130
   * @param {number} offset - 菜单位移偏移量，默认 4
   * @returns {void}
   */
  function handleContextMenu(
    event: MouseEvent,
    _targetRoute: any,
    index: number,
    menuWidth = 140,
    menuHeight = 130,
    offset = 4
  ) {
    event.preventDefault();
    event.stopPropagation();

    // 考虑页面滚动偏移
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    let x = event.clientX + scrollX + offset;
    let y = event.clientY + scrollY + offset;

    if (x + menuWidth > window.innerWidth + scrollX) {
      x = event.clientX + scrollX - menuWidth - offset;
    }
    if (y + menuHeight > window.innerHeight + scrollY) {
      y = event.clientY + scrollY - menuHeight - offset;
    }

    contextMenu.value = { visible: true, x, y, targetIndex: index };
  }

  /**
   * 关闭右键菜单
   * @returns {void}
   */
  function closeContextMenu() {
    contextMenu.value.visible = false;
    contextMenu.value.targetIndex = -1;
  }

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu
  };
}
