import { createApp } from 'vue';
import App from './app/index.vue';
import router from './router';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import FrontendLogger from '@/utils/frontend-logger';

// 初始化前端日志拦截（必须在最前面）
FrontendLogger.init();

// Element Plus 导入
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 样式导入
import './styles/index.scss';
import './styles/dialog-global/index.scss';

/**
 * 创建并初始化 Vue 应用实例
 * @description 配置路由、状态管理、UI 组件库和主题系统
 */
// 创建应用实例
const app = createApp(App);

// 创建Pinia实例
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 注册路由
app.use(router);

// 注册 Element Plus
app.use(ElementPlus);

// 注册所有 Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册状态管理
app.use(pinia);

// ==================== 主题初始化（必须在 app mount 之前）====================
// 始终默认使用 light 主题，不跟随系统，不自动恢复之前保存的主题
// 用户必须主动切换才会改变主题
import { useAppStore } from '@/stores';

// 强制使用 light 主题作为默认值
const DEFAULT_THEME = 'light';

// 立即应用到 DOM，避免页面闪烁
document.documentElement.setAttribute('data-theme', DEFAULT_THEME);

// 初始化 store
const appStore = useAppStore();

// 强制覆盖为 light 主题（清除之前可能保存的 dark 主题）
appStore.theme = DEFAULT_THEME;
// ==================== 主题初始化结束 ====================

// 先挂载应用
app.mount('#app');
