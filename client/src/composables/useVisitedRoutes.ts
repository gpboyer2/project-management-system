/**
 * 访问路由管理 Composable
 * 管理 Tab 工作台的访问路由列表，支持 sessionStorage 持久化
 */
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import { ElMessage } from 'element-plus';
import { buildEditorTabKey } from '@/utils/routeParamHelper';

// sessionStorage key
const STORAGE_KEY = 'ide-tabs-visited-routes';

// Tab 最大缓存时间（1 小时）
const TAB_MAX_AGE = 60 * 60 * 1000;

// 访问路由的简化类型（只保存必要信息）
export interface VisitedRoute {
  path: string;
  query: Record<string, any>;  // 添加 query 参数支持
  name: string;
  meta: Record<string, any>;
  timestamp?: number;  // 添加时间戳，用于过期清理
}

/**
 *
 * 访问路由管理 Hook
 *
 */
export function useVisitedRoutes() {
  // 访问过的路由列表
  const visitedRoutes = ref<VisitedRoute[]>([]);

  /**
   * 从 sessionStorage 恢复访问路由列表
   */
  function restore(): void {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        visitedRoutes.value = [];
        return;
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        visitedRoutes.value = [];
        return;
      }

      // 清理无效数据和重复项
      const validRoutes: VisitedRoute[] = [];
      const seenPaths = new Set<string>();
      const now = Date.now();

      for (const item of parsed) {
        if (!item || typeof item !== 'object' || !item.path) {
          continue;
        }

        // 生成唯一标识（使用统一的工具函数）
        const uniqueKey = buildEditorTabKey(item.path, item.query || {});

        if (seenPaths.has(uniqueKey)) {
          continue;
        }

        // 检查是否过期
        if (item.timestamp && (now - item.timestamp > TAB_MAX_AGE)) {
          continue;
        }

        // 兼容旧格式（子路径）和新格式（query 参数）
        if (typeof item.path === 'string' && item.path.startsWith('/editor/')) {
          seenPaths.add(uniqueKey);
          validRoutes.push({
            path: item.path,
            query: item.query || {},
            name: item.name || '',
            meta: item.meta || {},
            timestamp: item.timestamp || now
          });
        }
      }

      visitedRoutes.value = validRoutes;

      // 如果清理后有变化，保存清理后的数据
      if (validRoutes.length !== parsed.length) {
        save();
      }
    } catch (e) {
      console.warn('[useVisitedRoutes] 恢复失败', e);
      ElMessage.warning('访问路由数据已损坏，已重置');
      sessionStorage.removeItem(STORAGE_KEY);
      visitedRoutes.value = [];
    }
  }

  /**
   * 保存访问路由列表到 sessionStorage
   */
  function save(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(visitedRoutes.value));
    } catch (e) {
      console.warn('[useVisitedRoutes] 保存失败', e);
    }
  }

  /**
   * 从当前路由创建简化对象
   * @param {RouteLocationNormalized} route - 路由对象
   * @returns {VisitedRoute} 简化的路由对象
   */
  function createVisitedRoute(route: RouteLocationNormalized): VisitedRoute {
    return {
      path: route.path,
      query: route.query || {},
      name: route.name as string,
      meta: route.meta || {},
      timestamp: Date.now()  // 添加时间戳
    };
  }

  /**
   * 生成路由的唯一标识（使用统一的工具函数）
   * @param {VisitedRoute | RouteLocationNormalized} route - 路由对象
   * @returns {string} 唯一标识
   */
  function getRouteKey(route: VisitedRoute | RouteLocationNormalized): string {
    const query = 'query' in route ? route.query : (route as RouteLocationNormalized).query;
    return buildEditorTabKey(route.path, query || {});
  }

  /**
   * 添加或更新访问路由
   * @param {RouteLocationNormalized} route - 路由对象
   * @returns {boolean} 是否是新添加的路由
   */
  function addOrUpdate(route: RouteLocationNormalized): boolean {
    const routeKey = getRouteKey(route);
    const existingIndex = visitedRoutes.value.findIndex(r => getRouteKey(r) === routeKey);

    if (existingIndex === -1) {
      visitedRoutes.value.push(createVisitedRoute(route));
      save();
      return true;
    } else {
      // 更新时也更新时间戳
      visitedRoutes.value[existingIndex] = createVisitedRoute(route);
      save();
      return false;
    }
  }

  /**
   * 移除指定路由的访问记录
   * @param {RouteLocationNormalized} route - 要移除的路由
   * @returns {boolean} 是否成功移除
   */
  function remove(route: RouteLocationNormalized): boolean {
    const routeKey = getRouteKey(route);
    const index = visitedRoutes.value.findIndex(r => getRouteKey(r) === routeKey);
    if (index >= 0) {
      visitedRoutes.value.splice(index, 1);
      save();
      return true;
    }
    return false;
  }

  /**
   * 移除指定索引的访问路由
   * @param {number} index - 索引
   * @returns {boolean} 是否成功移除
   */
  function removeAt(index: number): boolean {
    if (index >= 0 && index < visitedRoutes.value.length) {
      visitedRoutes.value.splice(index, 1);
      save();
      return true;
    }
    return false;
  }

  /**
   * 清空所有访问路由
   */
  function clear(): void {
    visitedRoutes.value = [];
    save();
  }

  /**
   * 重新排序访问路由（用于拖拽排序）
   * @param {number} fromIndex - 源索引
   * @param {number} toIndex - 目标索引
   */
  function reorder(fromIndex: number, toIndex: number): void {
    if (fromIndex >= 0 && fromIndex < visitedRoutes.value.length &&
        toIndex >= 0 && toIndex < visitedRoutes.value.length &&
        fromIndex !== toIndex) {
      const [removed] = visitedRoutes.value.splice(fromIndex, 1);
      visitedRoutes.value.splice(toIndex, 0, removed);
      save();
    }
  }

  /**
   * 只保留指定的路由（用于"关闭其他"操作）
   * @param {RouteLocationNormalized | VisitedRoute} routeToKeep - 要保留的路由
   */
  function keepOnly(routeToKeep: RouteLocationNormalized | VisitedRoute): void {
    const routeKey = getRouteKey(routeToKeep as any);
    const target = visitedRoutes.value.find(r => getRouteKey(r) === routeKey);
    if (target) {
      visitedRoutes.value = [target];
      save();
    }
  }

  /**
   * 截断指定索引之后的所有路由（用于"关闭右侧"操作）
   * @param {number} index - 截断位置
   */
  function truncateAfter(index: number): void {
    if (index >= 0 && index < visitedRoutes.value.length - 1) {
      visitedRoutes.value.splice(index + 1);
      save();
    }
  }

  /**
   * 检查路由是否应该被记录为 Tab
   * @param {string} path - 路由路径
   * @param {Record<string, any>} query - 路由 query 参数
   * @param {boolean} hasTitle - 是否有标题
   * @returns {boolean} 是否应该记录
   */
  function shouldRecord(path: string, _query: Record<string, any>, hasTitle: boolean): boolean {
    // 记录所有编辑器路由（排除 dashboard）
    if (path.startsWith('/editor/ide/') && path !== '/editor/ide/dashboard') {
      return hasTitle;
    }
    return false;
  }

  return {
    visitedRoutes,
    restore,
    save,
    createVisitedRoute,
    addOrUpdate,
    remove,
    removeAt,
    clear,
    reorder,
    keepOnly,
    truncateAfter,
    shouldRecord,
  };
}
