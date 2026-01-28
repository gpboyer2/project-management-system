import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';

/**
 * 应用全局状态管理
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    theme: 'light' as 'light' | 'dark',
    language: 'zh-CN' as string,
    sidebarCollapsed: false as boolean,
    loading: false as boolean,
    breadcrumbs: [] as Array<{ name: string; path?: string }>,
  }),

  getters: {
    isDarkMode: (state) => state.theme === 'dark',
  },

  actions: {
    /**
     * 切换主题模式
     */
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.theme);
      ElMessage.info(`主题切换为: ${this.theme}`);
    },

    /**
     * 设置主题
     * @param {'light' | 'dark'} newTheme - 新主题
     */
    setTheme(newTheme: 'light' | 'dark') {
      this.theme = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
    },

    /**
     * 设置语言
     * @param {string} lang - 语言代码
     */
    setLanguage(lang: string) {
      this.language = lang;
      ElMessage.info(`语言切换为: ${lang}`);
    },

    /**
     * 切换侧边栏折叠状态
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    /**
     * 设置侧边栏折叠状态
     * @param {boolean} collapsed - 是否折叠
     */
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
    },

    /**
     * 设置加载状态
     * @param {boolean} isLoading - 是否加载中
     */
    setLoading(isLoading: boolean) {
      this.loading = isLoading;
    },

    /**
     * 设置面包屑导航
     * @param {Array<{ name: string; path?: string }>} items - 面包屑项列表
     */
    setBreadcrumbs(items: Array<{ name: string; path?: string }>) {
      this.breadcrumbs = items;
    },
  },

  persist: {
    key: 'app-store',
    paths: ['language', 'sidebarCollapsed'],
  }
});
