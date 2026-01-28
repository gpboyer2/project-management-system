/**
 * 标签页关闭操作 composable
 */
import { computed } from 'vue';
import type { Ref } from 'vue';

/**
 * 标签页操作逻辑 composable
 * @param {Ref<any[]>} visitedRoutes - 已访问的路由列表
 * @param {Ref<{ targetIndex: number }>} contextMenu - 右键菜单上下文，包含目标标签页索引
 * @returns {{ canCloseOthers: ComputedRef<boolean>, canCloseRight: ComputedRef<boolean> }} 返回包含操作权限的 computed 对象
 */
export function useTabOperation(visitedRoutes: Ref<any[]>, contextMenu: Ref<{ targetIndex: number }>) {
  const canCloseOthers = computed(() => visitedRoutes.value.length > 1);

  const canCloseRight = computed(() => {
    if (contextMenu.value.targetIndex < 0) return false;
    return contextMenu.value.targetIndex < visitedRoutes.value.length - 1;
  });

  return {
    canCloseOthers,
    canCloseRight
  };
}
