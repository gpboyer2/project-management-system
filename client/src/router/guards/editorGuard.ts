/**
 * 编辑器路由守卫
 * 负责验证编辑器类型有效性
 * 数据存在性检查由组件内部处理
 * 路由格式：/editor/ide/logic 或 /editor/ide/protocol 或 /editor/ide/:type（其他）
 */
import type { Router } from 'vue-router';
import { inferEditorTypeFromPath } from '@/utils/routeParamHelper';

/**
 * 创建编辑器路由守卫
 * @param {Router} router - Vue Router 实例
 * @returns {void} 无返回值
 */
export function setupEditorGuard(router: Router) {
  router.beforeEach((to, _from, next) => {
    // 只处理编辑器路由（标记为 requiresData 的路由）
    if (!to.meta?.requiresData) {
      next();
      return;
    }

    // 从路径推断类型
    const type = inferEditorTypeFromPath(to.path);

    // 验证类型有效性（inferEditorTypeFromPath 返回 undefined 表示无效）
    if (!type) {
      console.warn('[编辑器守卫] 无效的编辑器类型, path:', to.path);
      next('/');
      return;
    }

    // 数据存在性检查由组件内部处理
    // 如果数据不存在，组件会通过 useEditorData 跳转到列表页
    next();
  });
}
