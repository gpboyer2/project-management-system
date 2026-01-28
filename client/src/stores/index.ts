/**
 * 状态管理层统一入口
 * 基于2025年Pinia最新架构设计
 * 支持模块化、持久化、开发工具、状态快照等
 */

import { createPinia } from 'pinia';
import persist from 'pinia-plugin-persistedstate';

// 创建Pinia实例
export const pinia = createPinia();

// 注册持久化插件
pinia.use(persist);

// 导出各个模块的 stores
export { useUserStore, setBypassAuthMode } from './user';
export { useAppStore } from './app';
export { useFlowStore } from './flow';
export { useNotificationStore } from './notification';
export { useSystemLevelDesignStore } from './system-level-design';
export { useTopologyStore } from './topology';
export { usePacketConfigStore } from './packet-config';
export { useHierarchyConfigStore } from './hierarchy-config';
export { useIdeStore } from './ide';
export { useIcdStore } from './icd';

// Vue插件安装器
export const installStores = {
  install(app: any) {
    app.use(pinia);
  }
};

export default installStores;
