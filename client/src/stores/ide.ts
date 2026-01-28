/**
 *
 * IDE 状态管理
 * 管理 IDE 界面的全局状态，包括：
 * - 侧边栏折叠状态
 * - 树节点选中状态
 * - Tab 标题动态管理
 * - 节点接口列表（用于右侧工具箱）
 *
 * 注意：主题统一使用 app.ts 中的 useAppStore
 *
 */

import { defineStore } from 'pinia';
import { ref, computed, triggerRef } from 'vue';

export const useIdeStore = defineStore('ide', () => {
  // ==================== 状态定义 ====================

  // 左侧树选中的节点 ID
  const selectedTreeNodeId = ref<string | null>(null);

  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false);

  // Tab 自定义标题映射 (key -> title)
  // 仅在内存中保存，每次路由变化时由组件重新调用API设置
  const tabTitles = ref<Map<string, string>>(new Map());

  // 当前节点接口列表（用于右侧工具箱的 Context Inputs）
  const currentNodeInterfaceList = ref<any[]>([]);

  // 接口导航临时数据（用于从 node-dashboard 跳转到 interface-editor 时传递预加载数据）
  const interfaceNavigationData = ref<{
    interfaceId: string;
    interfaceName: string;
    nodeId: string;
    packets?: Array<{
      id: number;
      name: string;
      message_id: string;
      version: string;
      direction: 'input' | 'output';
      fields: any[];
    }>;
  } | null>(null);

  // 构建弹窗显示状态
  const buildModalVisible = ref(false);

  // 当前激活的 Tab
  const activeTab = ref<string>('');

  // ==================== 计算属性 ====================

  // 当前选中的树节点 ID
  const currentTreeNodeId = computed(() => selectedTreeNodeId.value);

  // 侧边栏是否折叠
  const isSidebarCollapsed = computed(() => sidebarCollapsed.value);

  // ==================== 方法定义 ====================

  /**
   * 选中树节点
   * @param {string | null} nodeId - 节点 ID
   */
  function selectTreeNode(nodeId: string | null) {
    selectedTreeNodeId.value = nodeId;
  }

  /**
   * 切换侧边栏折叠状态
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  /**
   * 设置侧边栏折叠状态
   * @param {boolean} collapsed - 是否折叠
   */
  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed;
  }

  /**
   * 设置 Tab 自定义标题
   * @param {string} key - 唯一键（包含 path、type、id）
   * @param {string} title - 自定义标题
   */
  function setTabTitle(key: string, title: string) {
    tabTitles.value.set(key, title);
    // 触发响应式更新（Map 的变化需要手动触发）
    triggerRef(tabTitles);
  }

  /**
   * 获取 Tab 自定义标题
   * @param {string} key - 唯一键（包含 path、type、id）
   * @returns {string | null} 自定义标题，如果不存在则返回 null
   */
  function getTabTitle(key: string): string | null {
    return tabTitles.value.get(key) || null;
  }

  /**
   * 移除 Tab 自定义标题
   * @param {string} key - 唯一键（包含 path、type、id）
   */
  function removeTabTitle(key: string) {
    tabTitles.value.delete(key);
    triggerRef(tabTitles);
  }

  /**
   * 清空所有 Tab 自定义标题
   */
  function clearTabTitles() {
    tabTitles.value.clear();
    triggerRef(tabTitles);
  }

  /**
   * 设置当前节点接口列表
   * @param {any[]} list - 接口列表
   */
  function setCurrentNodeInterfaceList(list: any[]) {
    currentNodeInterfaceList.value = list;
  }

  /**
   * 获取当前节点接口列表
   * @returns {any[]} 接口列表
   */
  function getCurrentNodeInterfaceList() {
    return currentNodeInterfaceList.value;
  }

  /**
   * 清除选中元素
   */
  function clearSelection() {
    selectedTreeNodeId.value = null;
  }

  /**
   * 选择元素（用于流程图等组件）
   * @param {string} _id - 元素 ID
   * @param {string} _type - 元素类型
   * @param {any} _data - 元素数据
   */
  function selectElement(_id: string, _type: string, _data: any) {
    // 可以扩展为更复杂的选中状态管理
  }

  /**
   * 更新 Tab 数据
   * @param {string} _tabId - Tab ID
   * @param {any} _data - Tab 数据
   */
  function updateTabData(_tabId: string, _data: any) {
    // 可以扩展为 Tab 数据管理
  }

  /**
   * 更新最后保存时间
   */
  function updateLastSaveTime() {
    // 用于显示保存状态
  }

  /**
   * 设置接口导航数据（用于从 node-dashboard 跳转到 interface-editor 时传递预加载数据）
   * @param {object} data - 接口导航数据
   * @param {string} data.interfaceId - 接口 ID
   * @param {string} data.interfaceName - 接口名称
   * @param {string} data.nodeId - 节点 ID
   * @param {Array} [data.packets] - 报文列表
   */
  function setInterfaceNavigationData(data: {
    interfaceId: string;
    interfaceName: string;
    nodeId: string;
    packets?: Array<{
      id: number;
      name: string;
      message_id: string;
      version: string;
      direction: 'input' | 'output';
      fields: any[];
    }>;
  }) {
    interfaceNavigationData.value = data;
  }

  /**
   * 获取并清除接口导航数据（一次性使用）
   * @returns {object | null} 接口导航数据
   */
  function consumeInterfaceNavigationData() {
    const data = interfaceNavigationData.value;
    interfaceNavigationData.value = null;
    return data;
  }

  /**
   * 打开构建弹窗
   */
  function openBuildModal() {
    buildModalVisible.value = true;
  }

  /**
   * 关闭构建弹窗
   */
  function closeBuildModal() {
    buildModalVisible.value = false;
  }

  return {
    // 状态
    selectedTreeNodeId,
    sidebarCollapsed,
    tabTitles,
    currentNodeInterfaceList,
    interfaceNavigationData,
    buildModalVisible,
    activeTab,

    // 计算属性
    currentTreeNodeId,
    isSidebarCollapsed,

    // 方法
    selectTreeNode,
    toggleSidebar,
    setSidebarCollapsed,
    setTabTitle,
    getTabTitle,
    removeTabTitle,
    clearTabTitles,
    setCurrentNodeInterfaceList,
    getCurrentNodeInterfaceList,
    clearSelection,
    selectElement,
    updateTabData,
    updateLastSaveTime,
    setInterfaceNavigationData,
    consumeInterfaceNavigationData,
    openBuildModal,
    closeBuildModal,
  };
}, {
  persist: {
    key: 'ide-state',
    paths: ['sidebarCollapsed'],
  }
});
