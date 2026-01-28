/**
 * 编辑器数据加载 Composable
 * 提供统一的数据加载、错误处理逻辑（不再使用缓存）
 *
 * @description
 * 该 Composable 支持两种编辑器类型：
 * - protocol（协议算法报文编辑器）：支持草稿模式和已发布版本模式
 * - logic（逻辑节点编辑器）：使用体系层级树 API
 *
 * 主要功能：
 * - 从 URL 参数自动推断编辑器类型和 ID
 * - 支持单个资源详情加载和列表加载
 * - 自动取消重复请求，防止竞态条件
 * - 组件卸载时自动清理请求
 */
import { ref, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { inferEditorTypeFromPath } from '@/utils/routeParamHelper';
import {
  getMessageDetail,
  getMessageManageList,
  getMessageDraftDetail
} from '@/api/messageManagement';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';

/** 请求取消控制器 */
let currentController: AbortController | null = null;

/** API 映射配置 */
const DATA_APIS = {
  /** 协议算法报文编辑器 */
  protocol: {
    /**
     * 获取草稿详情
     * @param {string} id - 草稿 ID
     * @returns {Promise<any>} 草稿详情数据
     * @throws {Error} 草稿不存在时抛出错误
     */
    getDraftDetail: async (id: string) => {
      const draft_result = await getMessageDraftDetail(id);
      if (draft_result.status === 'success' && draft_result.datum) {
        return draft_result;
      }
      throw new Error(draft_result.message || '草稿不存在');
    },

    /**
     * 获取已发布版本详情
     * @param {string} id - 报文 ID
     * @returns {Promise<any>} 报文详情数据
     */
    getPublishedDetail: async (id: string) => {
      return await getMessageDetail(id);
    },

    /**
     * 根据模式获取详情（路由入口）
     * @param {string} id - 报文 ID
     * @param {Record<string, any>} queryParams - URL 查询参数
     * @returns {Promise<any>} 报文详情数据
     */
    getDetail: async (id: string, queryParams?: Record<string, any>) => {
      const isDraftMode = queryParams?.mode === 'draft';
      if (isDraftMode) {
        return await DATA_APIS.protocol.getDraftDetail(id);
      }
      return await DATA_APIS.protocol.getPublishedDetail(id);
    },

    /**
     * 获取报文列表
     * @returns {Promise<any>} 报文列表数据
     */
    getList: async () => {
      const result = await getMessageManageList({ current_page: 1, page_size: 1000 });
      if (result.status === 'success') {
        return result;
      }
      return { status: 'success', datum: { list: [], pagination: { current_page: 1, page_size: 20, total: 0 } }, message: '操作成功' };
    },
  },

  /** 逻辑节点（使用体系层级树 API） */
  logic: {
    /**
     * 获取逻辑节点详情
     * @param {string} id - 节点 ID
     * @returns {Promise<any>} 节点详情数据
     */
    getDetail: async (id: string) => {
      return await systemLevelDesignTreeApi.getNodeById(id);
    },

    /**
     * 获取所有逻辑节点列表
     * @returns {Promise<any>} 节点列表数据
     */
    getList: async () => {
      const result = await systemLevelDesignTreeApi.getAllNodes();
      if (result.status === 'success') {
        return { status: 'success', datum: { list: result.datum || [] }, message: result.message };
      }
      return result;
    },
  },
} as const;

/**
 * 编辑器数据加载 Composable
 *
 * @description
 * 该 Composable 提供统一的编辑器数据加载接口，支持：
 * - 自动从 URL 参数推断编辑器类型和资源 ID
 * - 单个资源详情加载和列表加载
 * - 自动取消重复请求，防止竞态条件
 * - 组件卸载时自动清理请求
 * - 统一的错误处理和用户提示
 *
 * @returns {UseEditorDataReturn} 返回响应式数据和方法
 */
export function useEditorData() {
  const route = useRoute();

  /** 加载状态 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  /** 编辑器数据 */
  const data = ref<any>(null);

  /** 从路由路径推断类型 */
  const editor_type = computed(() => {
    return inferEditorTypeFromPath(route.path) || '';
  });

  /** 根据类型从不同的 query 参数获取 ID */
  const editor_id = computed(() => {
    const param_name = editor_type.value === 'logic' ? 'systemNodeId' : 'protocolAlgorithmId';
    return route.query[param_name] as string | undefined;
  });

  /** URL 查询参数 */
  const query_params = computed(() => route.query);

  /**
   * 加载编辑器数据（详情）
   *
   * @description
   * - 如果没有 ID 参数且有类型参数，则加载列表数据
   * - 自动取消之前的请求，防止竞态条件
   * - 组件卸载时自动取消请求
   * - 统一的错误处理和用户提示
   *
   * @returns {Promise<void>}
   */
  async function loadData() {
    const type = editor_type.value;
    const id = editor_id.value;

    // 列表页：没有 id 参数，直接调用 loadList
    if (!id && type) {
      await loadList();
      return;
    }

    if (!type || !id) {
      error.value = '缺少必要参数';
      return;
    }

    // 取消之前的请求
    if (currentController) {
      currentController.abort();
    }

    currentController = new AbortController();

    // 从 API 加载
    loading.value = true;
    error.value = null;

    try {
      const api_map = DATA_APIS[type as keyof typeof DATA_APIS];
      if (!api_map) {
        throw new Error(`不支持的编辑器类型: ${type}`);
      }

      const result = await api_map.getDetail(id, query_params.value);

      // 检查组件是否已卸载
      if (currentController.signal.aborted) {
        return;
      }

      if (result.status === 'success') {
        data.value = result.datum;
      } else if (result.status === 'canceled') {
        // 请求被取消（组件卸载或重复请求），静默处理
        console.log('[useEditorData] 请求已取消，组件可能已卸载');
        return;
      } else {
        error.value = result.message || '加载失败';
        // 不再强制跳转，显示错误提示
        ElMessage.warning(result.message || '数据加载失败，请稍后重试');
      }
    } catch (err: unknown) {
      // 检查是否已取消
      if (currentController.signal.aborted) {
        return;
      }

      // 忽略取消错误
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      error.value = err instanceof Error ? err.message : '加载失败';
      ElMessage.error(err instanceof Error ? err.message : '网络错误，请检查连接后重试');
    } finally {
      if (!currentController.signal.aborted) {
        loading.value = false;
      }
    }
  }

  /**
   * 加载编辑器数据（列表）
   *
   * @description
   * - 自动取消之前的请求，防止竞态条件
   * - 组件卸载时自动取消请求
   * - 统一的错误处理和用户提示
   *
   * @returns {Promise<void>}
   */
  async function loadList() {
    const type = editor_type.value;

    // 取消之前的请求
    if (currentController) {
      currentController.abort();
    }

    currentController = new AbortController();

    loading.value = true;
    error.value = null;

    try {
      const api_map = DATA_APIS[type as keyof typeof DATA_APIS];
      if (!api_map) {
        throw new Error(`不支持的编辑器类型: ${type}`);
      }

      const result = await api_map.getList();

      // 检查组件是否已卸载
      if (currentController.signal.aborted) {
        return;
      }

      if (result.status === 'success') {
        data.value = result.datum;
      } else {
        error.value = result.message || '加载失败';
      }
    } catch (err: unknown) {
      // 检查是否已取消
      if (currentController.signal.aborted) {
        return;
      }

      // 忽略取消错误
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      error.value = err instanceof Error ? err.message : '加载失败';
      ElMessage.error(error.value);
    } finally {
      if (!currentController.signal.aborted) {
        loading.value = false;
      }
    }
  }

  /**
   * 刷新数据
   *
   * @description 重新加载当前数据
   * @returns {Promise<void>}
   */
  async function refresh() {
    await loadData();
  }

  // 组件卸载时清理请求
  onUnmounted(() => {
    if (currentController) {
      currentController.abort();
    }
  });

  return {
    loading,
    error,
    data,
    editorType: editor_type,
    editorId: editor_id,
    queryParams: query_params,
    loadData,
    loadList,
    refresh,
  };
}

/**
 * useEditorData 返回值类型
 */
interface UseEditorDataReturn {
  /** 加载状态 */
  loading: ReturnType<typeof ref<boolean>>;
  /** 错误信息 */
  error: ReturnType<typeof ref<string | null>>;
  /** 编辑器数据 */
  data: ReturnType<typeof ref<any>>;
  /** 编辑器类型（protocol 或 logic） */
  editorType: ReturnType<typeof computed<string>>;
  /** 编辑器资源 ID */
  editorId: ReturnType<typeof computed<string | undefined>>;
  /** URL 查询参数 */
  queryParams: ReturnType<typeof computed<Record<string, any>>>;
  /** 加载详情数据 */
  loadData: () => Promise<void>;
  /** 加载列表数据 */
  loadList: () => Promise<void>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
}
