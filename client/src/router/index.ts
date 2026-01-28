/**
 * Vue Router 配置
 * 基于2025年Vue Router 4.x最佳实践
 */

import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { editorRoutes } from './editor-routes';
import { setupEditorGuard } from './guards/editorGuard';

// 路由配置
const routes: RouteRecordRaw[] = [
  // 编辑器路由系统
  ...editorRoutes,

  // 保留的独立路由
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      hidden: true,
      noAuth: true
    }
  },

  // 拓扑展示（独立视图）
  {
    path: '/topology-display',
    name: 'TopologyDisplay',
    component: () => import('@/views/topology-display/index.vue'),
    meta: {
      title: '拓扑展示',
      icon: 'Share',
      cache: true,
    }
  },
  {
    path: '/topology-display/detail',
    name: 'TopologyDetail',
    component: () => import('@/views/topology-display/detail/index.vue'),
    meta: {
      title: '节点详情',
      icon: 'Share',
      hidden: true,
      cache: false,
    }
  },

  // 流程图编辑器
  {
    path: '/flowchart',
    name: 'Flowchart',
    component: () => import('@/views/flowchart/index.vue'),
    meta: {
      title: '流程图',
      icon: 'Share',
      cache: true,
    }
  },

  // 报文配置
  {
    path: '/packet-config',
    name: 'PacketConfig',
    component: () => import('@/views/packet-config/index.vue'),
    meta: {
      title: '报文配置',
      icon: 'Document',
      cache: true,
    }
  },

  // 系统设置
  {
    path: '/settings',
    name: 'Settings',
    redirect: '/settings/basic',
    meta: {
      title: '系统设置',
      icon: 'Setting',
      hidden: true,
    },
    children: [
      {
        path: 'basic',
        name: 'SettingsBasic',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '基础设置', hidden: true }
      },
      {
        path: 'security',
        name: 'SettingsSecurity',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '安全设置', hidden: true }
      },
      {
        path: 'notification',
        name: 'SettingsNotification',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '通知设置', hidden: true }
      },
      {
        path: 'user',
        name: 'SettingsUser',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '用户管理', hidden: true }
      },
      {
        path: 'user/detail',
        name: 'UserDetail',
        component: () => import('@/views/settings/user/components/detail/index.vue'),
        meta: { title: '用户详情', hidden: true, cache: false }
      },
      {
        path: 'hierarchy',
        name: 'SettingsHierarchy',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '层级配置', hidden: true }
      },
      {
        path: 'data',
        name: 'SettingsData',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '数据管理', hidden: true }
      }
    ]
  },

  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404/index.vue'),
    meta: {
      title: '页面不存在',
      hidden: true
    }
  }
];

// 创建路由实例 - 增强错误处理
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    try {
      if (savedPosition) {
        return savedPosition;
      } else {
        return { top: 0, behavior: 'smooth' };
      }
    } catch (error) {
      console.warn('滚动行为处理失败:', error);
      return { top: 0 };
    }
  }
});

// 设置编辑器路由守卫
setupEditorGuard(router);

// 路由状态管理
// 使用 pendingRoute 跟踪正在进行的导航，避免简单 isNavigating 导致快速 Tab 切换被取消
let pendingRoute: string | null = null;
let navigationTimeoutId: number | null = null;
let routeIdCounter = 0;

/**
 * 安全的清理函数
 * 清理导航定时器，避免内存泄漏
 * @returns {void}
 */
function safeCleanup() {
  if (typeof window === 'undefined') return;

  try {
    // 清理导航定时器
    if (navigationTimeoutId !== null) {
      clearTimeout(navigationTimeoutId);
      navigationTimeoutId = null;
    }
  } catch (error) {
    console.warn('清理过程中出现非关键错误:', error);
  }
}

/**
 * 重置导航状态
 * 清除待处理路由和导航定时器
 * @returns {void}
 */
function resetNavigationState() {
  pendingRoute = null;
  if (navigationTimeoutId !== null) {
    clearTimeout(navigationTimeoutId);
    navigationTimeoutId = null;
  }
}

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  try {
    ++routeIdCounter;

    // 验证路由有效性
    if (!to || !to.path) {
      console.error('无效的路由对象:', to);
      next('/');
      return;
    }

    // 优化防重复导航逻辑：
    // 1. 允许相同路径的导航（用户可能重复点击同一 Tab）
    // 2. 只有当正在导航的目标与当前目标不同时，才允许新导航
    // 3. 这样可以快速切换 Tab，同时防止真正的重复导航
    if (pendingRoute && pendingRoute !== to.path && to.path !== from.path) {
      // 有正在进行的导航，且目标不同，允许新导航取消旧的
      console.log(`[路由] 取消旧导航 ${pendingRoute}，执行新导航 ${to.path}`);
    }

    // 设置页面标题
    if (to.meta?.title && typeof to.meta.title === 'string') {
      document.title = `${to.meta.title} - 灵枢 IDE`;
    }

    // 安全清理
    safeCleanup();

    // 检查路由匹配
    if (to.matched.length === 0 && to.path !== '/404') {
      console.warn('路由匹配失败，重定向到404:', to.path);
      next('/404');
      return;
    }

    // 标记正在导航的目标路由
    pendingRoute = to.path;
    next();

  } catch (error) {
    console.error('路由切换前置守卫错误:', error);
    resetNavigationState();
    // 出错时安全跳转到首页
    next('/');
  }
});

// 全局后置钩子
router.afterEach((_to, _from) => {
  try {

    // 延迟重置导航状态，确保过渡完成
    navigationTimeoutId = window.setTimeout(() => {
      pendingRoute = null;
      navigationTimeoutId = null;
    }, 100);

  } catch (error) {
    console.error('路由后置钩子错误:', error);
    resetNavigationState();
  }
});

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error);

  // 重置导航状态
  resetNavigationState();

  // 根据错误类型采取不同的恢复策略
  const errorMessage = error.message || '';

  if (errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('Loading chunk')) {
    // 模块加载失败 - 可能是网络问题，需要重新加载
    console.warn('模块加载失败，将在3秒后重新加载页面...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  } else if (errorMessage.includes('DOMException') ||
      errorMessage.includes('Cannot read properties of null') ||
      errorMessage.includes('insertBefore') ||
      errorMessage.includes('style')) {
    // DOM相关错误（通常是组件销毁时的异步回调导致）
    // 这类错误不应该干预路由，让路由自然完成即可
    console.warn('检测到DOM错误（组件销毁相关），忽略此错误');
  } else {
    // 其他错误 - 记录日志
    console.error('未分类的路由错误:', error);
  }
});

export default router;

// 导出路由配置，供其他模块使用
export { routes };