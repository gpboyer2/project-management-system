/**
 * 编辑器路由配置
 * 路由结构：
 *   /#/editor/ide/logic?interfaceId=xxx&systemNodeId=xxx
 *     - logic: 层级节点编辑器，带 interfaceId 时表示节点接口编辑
 *   /#/editor/ide/protocol?protocolAlgorithmId=xxx
 *     - protocol: 协议算法报文编辑器
 */
import type { RouteRecordRaw } from 'vue-router';

/**
 * 编辑器路由配置表
 * 包含欢迎页、IDE 编辑器主路由及其子路由
 */
export const editorRoutes: RouteRecordRaw[] = [
  // 欢迎页/空状态（不使用 IdeLayout）
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/views/editor/welcome-page/index.vue'),
    meta: {
      title: '灵枢 IDE',
      cache: false,
    }
  },

  // 编辑器主路由（使用 IdeLayout 作为父布局）
  // 路由格式：/#/editor/ide/*
  {
    path: '/editor/ide',
    component: () => import('@/views/ide/index.vue'),
    meta: {
      title: 'IDE 编辑器',
    },
    children: [

      // 仪表板
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/editor/components/dashboard/index.vue'),
        meta: {
          title: '仪表板',
          icon: 'Monitor',
          order: 1,
          cache: true,
        }
      },
      // logic: 层级节点编辑器（带 interfaceId 时为节点接口编辑）
      // http://localhost:9300/#/editor/ide/logic
      {
        path: 'logic',
        name: 'LogicEditor',
        component: () => import('@/views/editor/editor-layout/index.vue'),
        meta: {
          title: '逻辑节点编辑器',
          hidden: true,
          requiresData: true,
          cache: false,
        },
      },
      // flow: 逻辑流编排编辑器
      // http://localhost:9300/#/editor/ide/flow?systemNodeId=xxx&logicId=yyy
      {
        path: 'flow',
        name: 'LogicFlowEditor',
        component: () => import('@/views/editor/editor-layout/index.vue'),
        meta: {
          title: '逻辑流编排',
          hidden: true,
          requiresData: true,
          cache: false,
        },
      },
      // protocol: 协议算法报文编辑器
      // http://localhost:9300/#/editor/ide/protocol
      {
        path: 'protocol',
        name: 'ProtocolEditor',
        component: () => import('@/views/editor/editor-layout/index.vue'),
        meta: {
          title: '协议编辑器',
          hidden: true,
          requiresData: true,
          cache: false,
        },
      },
      // hierarchy: 层级节点概览（未启用通信节点列表的层级）
      // http://localhost:9300/#/editor/ide/hierarchy?systemNodeId=xxx
      {
        path: 'hierarchy',
        name: 'HierarchyEditor',
        component: () => import('@/views/editor/editor-layout/index.vue'),
        meta: {
          title: '层级节点概览',
          hidden: true,
          requiresData: true,
          cache: false,
        },
      },
    ],
  },

  // 编辑器根路径重定向到仪表板
  {
    path: '/editor',
    redirect: '/editor/ide/dashboard',
  },
];
