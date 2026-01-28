/**
 * Tab 切换处理 composable
 * 统一处理 Tab 激活、切换、路由同步逻辑
 */
import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabSwitchOptions {
  tabs: TabItem[] | Ref<TabItem[]> | ComputedRef<TabItem[]>;
  queryParam?: string;
  defaultActive?: string;
  onTabChange?: (key: string) => void | Promise<void>;
}

/**
 * Tab 切换处理 composable
 * 统一处理 Tab 激活、切换、路由同步逻辑
 * @param {TabSwitchOptions} options - 配置选项
 * @returns {{ active_key: Ref<string>, tab_list: ComputedRef<TabItem[]>, current_tab: ComputedRef<TabItem | undefined>, switchTab: (key: string) => Promise<void> }} 返回响应式状态和方法
 * @returns {Ref<string>} active_key - 当前激活的 Tab 键值
 * @returns {ComputedRef<TabItem[]>} tab_list - Tab 列表
 * @returns {ComputedRef<TabItem | undefined>} current_tab - 当前激活的 Tab 对象
 * @returns {Function} switchTab - 切换 Tab 的方法
 */
export function useTabSwitch(options: TabSwitchOptions) {
  const route = useRoute();
  const router = useRouter();

  const { tabs, queryParam = 'tab', defaultActive, onTabChange } = options;

  // 当前激活的 Tab
  const active_key = ref<string>(
    (route.query[queryParam] as string) || defaultActive || (Array.isArray(tabs) ? tabs[0]?.key : tabs.value?.[0]?.key) || ''
  );

  // 计算属性：Tab 列表（支持动态计数）
  const tab_list = computed<TabItem[]>(() => {
    return Array.isArray(tabs) ? tabs : tabs.value;
  });

  // 计算属性：当前 Tab
  const current_tab = computed<TabItem | undefined>(() =>
    tab_list.value.find(tab => tab.key === active_key.value)
  );

  /**
   * 切换 Tab
   * @param {string} key - 目标 Tab 的键值
   * @returns {Promise<void>} 无返回值
   */
  async function switchTab(key: string) {
    if (key === active_key.value) return;

    const target_tab = tab_list.value.find(tab => tab.key === key);
    if (target_tab?.disabled) return;

    active_key.value = key;

    // 更新路由参数
    await router.replace({
      query: { ...route.query, [queryParam]: key }
    });

    // 执行回调
    if (onTabChange) {
      await onTabChange(key);
    }
  }

  // 监听路由参数变化
  watch(
    () => route.query[queryParam] as string,
    new_key => {
      if (new_key && new_key !== active_key.value) {
        active_key.value = new_key;
      }
    }
  );

  return {
    active_key,
    tab_list,
    current_tab,
    switchTab
  };
}
