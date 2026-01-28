import { ref } from 'vue';

interface UseSidebarResizeOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidthPercent?: number;
}

/**
 * 侧边栏大小调整组合函数
 * 提供侧边栏的显示/隐藏和宽度调整功能
 * @param {UseSidebarResizeOptions} options - 配置选项
 * @param {number} options.defaultWidth - 默认宽度
 * @param {number} options.minWidth - 最小宽度
 * @param {number} options.maxWidthPercent - 最大宽度百分比（0-1）
 * @returns {Object} 包含侧边栏状态和操作方法的对象
 */
export function useSidebarResize(options: UseSidebarResizeOptions = {}) {
  const {
    defaultWidth = 420,
    minWidth = 320,
    maxWidthPercent = 0.6,
  } = options;

  const asideVisible = ref(true);
  const asideWidth = ref(defaultWidth);
  const isResizing = ref(false);

  /**
   * 开始调整侧边栏宽度
   * @param {MouseEvent} e - 鼠标事件对象
   */
  function startResize(e: MouseEvent) {
    isResizing.value = true;
    const startX = e.clientX;
    const startWidth = asideWidth.value;

    function onMouseMove(moveEvent: MouseEvent) {
      if (!isResizing.value) return;

      const deltaX = startX - moveEvent.clientX;
      const newWidth = startWidth + deltaX;

      const maxWidth = window.innerWidth * maxWidthPercent;
      asideWidth.value = Math.min(Math.max(newWidth, minWidth), maxWidth);
    }

    function onMouseUp() {
      isResizing.value = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * 打开侧边栏
   */
  function openAside() {
    asideVisible.value = true;
  }

  /**
   * 关闭侧边栏
   */
  function closeAside() {
    asideVisible.value = false;
  }

  /**
   * 切换侧边栏显示状态
   */
  function toggleAside() {
    asideVisible.value = !asideVisible.value;
  }

  return {
    asideVisible,
    asideWidth,
    isResizing,
    startResize,
    openAside,
    closeAside,
    toggleAside,
  };
}

export type SidebarResizeReturn = ReturnType<typeof useSidebarResize>;
