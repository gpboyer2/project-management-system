<!--
  构建交付弹窗组件 (Build Modal)
  右侧滑出面板，用于配置和启动构建任务
  紧凑卡片式布局
-->
<template>
  <Teleport to="body">
    <Transition name="ide-build-modal">
      <div v-if="visible" class="ide-build-modal-overlay" @click.self="handleClose">
        <div class="ide-build-modal">
          <!-- 头部 -->
          <div class="ide-build-modal-header">
            <div class="ide-build-modal-title">
              <svg
                class="ide-build-modal-title-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>

              <span class="ide-build-modal-title-text">构建交付</span>
            </div>

            <button class="ide-build-modal-close" @click="handleClose">
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="ide-build-modal-content">
            <!-- 构建配置 -->
            <div class="ide-build-modal-section">
              <h3 class="ide-build-modal-section-title">构建配置</h3>

              <!-- C++ SDK Toggle -->
              <div
                class="ide-build-toggle-row"
                :class="{ 'ide-build-toggle-row--active': cppSdkEnabled }"
                @click="handleCppSdkClick"
              >
                <div class="ide-build-toggle-info">
                  <svg class="ide-build-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <span class="ide-build-toggle-label">C++ SDK</span>
                </div>
                <div
                  class="ide-build-toggle-switch"
                  :class="{ 'ide-build-toggle-switch--on': cppSdkEnabled }"
                />
              </div>

              <!-- C++ SDK 子选项 - 水平布局 -->
              <div v-if="cppSdkEnabled" class="ide-build-inline-options">
                <div class="ide-build-inline-select">
                  <select v-model="cppLanguage" class="ide-build-inline-select-input">
                    <option v-for="lang in languageOptionList" :key="lang.value" :value="lang.value">
                      {{ lang.label }}
                    </option>
                  </select>
                </div>
                <div class="ide-build-inline-select">
                  <select v-model="cppPlatform" class="ide-build-inline-select-input">
                    <option v-for="platform in platformOptionList" :key="platform.value" :value="platform.value">
                      {{ platform.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- ICD 文档 Toggle -->
              <div
                class="ide-build-toggle-row"
                :class="{ 'ide-build-toggle-row--active': icdDocEnabled }"
                @click="handleIcdDocClick"
              >
                <div class="ide-build-toggle-info">
                  <svg class="ide-build-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span class="ide-build-toggle-label">ICD 文档 (Word)</span>
                </div>
                <div
                  class="ide-build-toggle-switch"
                  :class="{ 'ide-build-toggle-switch--on': icdDocEnabled }"
                />
              </div>
            </div>

            <!-- 开始构建按钮 -->
            <button
              class="ide-build-start-btn"
              :disabled="isBuilding"
              @click="handleStartBuild"
            >
              <i v-if="!isBuilding" class="ide-build-start-btn-icon">
                <el-icon><VideoPlay /></el-icon>
              </i>
              <span>{{ isBuilding ? '构建中...' : '开始构建' }}</span>
            </button>

            <!-- 历史记录 -->
            <div class="ide-build-modal-section ide-build-history-section">
              <h3 class="ide-build-modal-section-title">历史记录</h3>

              <div v-if="buildHistoryList.length > 0" class="ide-build-history-table">
                <!-- 表头 -->
                <div class="ide-build-history-header">
                  <span class="ide-build-history-col ide-build-history-col--version">版本</span>
                  <span class="ide-build-history-col ide-build-history-col--time">时间</span>
                  <span class="ide-build-history-col ide-build-history-col--status">状态</span>
                  <span class="ide-build-history-col ide-build-history-col--action" />
                </div>

                <!-- 表格行 -->
                <div
                  v-for="item in buildHistoryList"
                  :key="item.taskId"
                  class="ide-build-history-row"
                >
                  <span class="ide-build-history-col ide-build-history-col--version">
                    {{ item.version }}
                  </span>
                  <span class="ide-build-history-col ide-build-history-col--time">
                    {{ item.time }}
                  </span>
                  <span class="ide-build-history-col ide-build-history-col--status">
                    <span
                      class="ide-build-history-status"
                      :class="getStatusClass(item.status)"
                    >
                      {{ item.statusLabel }}
                    </span>
                  </span>
                  <span class="ide-build-history-col ide-build-history-col--action">
                    <button
                      class="ide-build-history-download"
                      :disabled="!item.downloadable"
                      @click="handleDownload(item)"
                    >
                      ZIP
                    </button>
                  </span>
                </div>
              </div>

              <div v-else class="ide-build-history-empty">
                暂无构建记录
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Close, VideoPlay } from '@element-plus/icons-vue';
import { useIdeStore } from '@/stores';
import { buildApi } from '@/api/build';
import { dateUtils, statusUtils } from '@/utils';
import { usePolling } from '@/composables/usePolling';

type BuildContext = {
  contextType: 'hierarchy_node' | 'packet_message' | 'packet_category';
  contextId: string;
  contextName?: string;
  options: Record<string, any>;
};

export default defineComponent({
  name: 'SharedBuildModal',
  setup() {
    const route = useRoute();
    const ideStore = useIdeStore();

    // 从 store 获取 visible 状态
    const visible = computed(() => ideStore.buildModalVisible);

    // 构建中状态 & 当前任务
    const isBuilding = ref(false);
    const currentTaskId = ref<string | null>(null);

    // 构建配置选中状态（可同时选中多个）
    const cppSdkEnabled = ref(true);
    const icdDocEnabled = ref(false);

    // C++ 语言选项
    const cppLanguage = ref('cpp11');
    const languageOptionList = [
      { value: 'cpp11', label: 'C++ 11 (Standard)' },
      { value: 'cpp14', label: 'C++ 14' },
      { value: 'cpp17', label: 'C++ 17' },
      { value: 'cpp20', label: 'C++ 20' }
    ];

    // 平台选项
    const cppPlatform = ref('linux-x86_64');
    const platformOptionList = [
      { value: 'linux-x86_64', label: 'Linux (x86_64)' },
      { value: 'linux-arm64', label: 'Linux (ARM64)' },
      { value: 'windows-x64', label: 'Windows (x64)' },
      { value: 'qnx', label: 'QNX' },
      { value: 'vxworks', label: 'VxWorks' }
    ];

    // 构建历史列表
    const buildHistoryList = ref<any[]>([]);

    // 使用轮询 composable
    const { start: startPolling, stop: stopPolling } = usePolling<any>();

    const systemNodeId = computed(() => String(route.query.systemNodeId || '').trim());
    const systemNodeName = computed(() => String(route.query.systemNodeName || '').trim());
    const protocolAlgorithmId = computed(() => String(route.query.protocolAlgorithmId || '').trim());
    const isProtocolRoute = computed(() => route.path.startsWith('/editor/ide/protocol'));
    const isHierarchyRoute = computed(() => {
      return route.path.startsWith('/editor/ide/logic')
        || route.path.startsWith('/editor/ide/flow')
        || route.path.startsWith('/editor/ide/hierarchy');
    });

    const buildContext = computed<BuildContext | null>(() => {
      // protocol 编辑器：以 URL 的 protocolAlgorithmId 作为 packet_message 上下文
      if (isProtocolRoute.value) {
        if (!protocolAlgorithmId.value) return null;
        return {
          contextType: 'packet_message',
          contextId: protocolAlgorithmId.value,
          contextName: protocolAlgorithmId.value,
          options: {}
        };
      }

      // logic/flow/hierarchy：以 systemNodeId 作为 hierarchy_node 上下文
      if (isHierarchyRoute.value) {
        if (!systemNodeId.value) return null;
        return {
          contextType: 'hierarchy_node',
          contextId: systemNodeId.value,
          contextName: systemNodeName.value || systemNodeId.value,
          options: {}
        };
      }

      return null;
    });

    /**
     * 获取状态对应的样式类
     * @param {string} status - 构建状态
     * @returns {string} CSS 类名
     */
    function getStatusClass(status: string) {
      const classMap: Record<string, string> = {
        completed: 'ide-build-history-status--completed',
        partial_completed: 'ide-build-history-status--completed',
        failed: 'ide-build-history-status--failed',
        cancelled: 'ide-build-history-status--failed',
        running: 'ide-build-history-status--running',
        queued: 'ide-build-history-status--queued'
      };
      return classMap[status] || '';
    }

    /**
     * 切换 C++ SDK 选项
     * @returns {void}
     */
    function handleCppSdkClick() {
      cppSdkEnabled.value = !cppSdkEnabled.value;
    }

    /**
     * 切换 ICD 文档选项
     * @returns {void}
     */
    function handleIcdDocClick() {
      icdDocEnabled.value = !icdDocEnabled.value;
    }

    /**
     * 生成 ICD 文档（预留函数）
     * @returns {Promise<void>}
     */
    async function handleGenerateIcdDoc() {
      ElMessage.warning('ICD 文档生成功能待完成');
    }

    /**
     * 关闭弹窗
     * @returns {void}
     */
    function handleClose() {
      ideStore.closeBuildModal();
    }

    /**
     * 开始构建（入口函数）
     * @returns {Promise<void>}
     */
    async function handleStartBuild() {
      // 检查是否有选中的构建选项
      if (!cppSdkEnabled.value && !icdDocEnabled.value) {
        ElMessage.warning('请至少选择一个构建选项');
        return;
      }

      // 根据选择执行对应的构建任务
      if (cppSdkEnabled.value) {
        await handleBuildCode();
      }

      if (icdDocEnabled.value) {
        await handleGenerateIcdDoc();
      }
    }

    /**
     * 构建代码
     * @returns {Promise<void>}
     */
    async function handleBuildCode() {
      isBuilding.value = true;
      let startedPolling = false;

      try {
        const ctx = buildContext.value;
        if (!ctx) {
          throw new Error('当前 Tab 不支持构建，请先打开"体系节点"或"协议/分类"相关页面');
        }

        // 组装构建参数
        const options: Record<string, any> = {};
        options.cppSdk = true;
        options.language = cppLanguage.value;
        options.platform = cppPlatform.value;

        stopPolling();

        const startRes: any = await buildApi.start({
          contextType: ctx.contextType,
          contextId: ctx.contextId,
          contextName: ctx.contextName,
          options
        });

        if (!startRes || startRes.status !== 'success' || !startRes.datum?.taskId) {
          throw new Error(startRes?.message || '创建构建任务失败');
        }

        const task = startRes.datum;
        currentTaskId.value = task.taskId;
        // 仅用于前端定位：打印任务与上下文（不展示给用户）
        if (import.meta && import.meta.env && import.meta.env.DEV) {
          console.log('[BuildModal] 构建任务已创建', {
            taskId: task.taskId,
            version: task.version,
            context: {
              contextType: ctx.contextType,
              contextId: ctx.contextId,
              contextName: ctx.contextName,
            },
            options
          });
        }
        ElMessage.success(`构建任务已创建：${task.version}`);

        await loadBuildHistory();
        // 开始轮询：由轮询逻辑在"结束态"时统一停止轮询
        startBuildPolling(task.taskId);
        startedPolling = true;
      } catch (error: any) {
        ElMessage.error('构建失败：' + (error?.message || '未知错误'));
        if (import.meta && import.meta.env && import.meta.env.DEV) {
          console.error('[BuildModal] 创建构建任务失败', error);
        }
        isBuilding.value = false;
        currentTaskId.value = null;
      } finally {
        // 仅在未进入轮询（创建任务失败/提前报错）时复位按钮状态
        if (!startedPolling) {
          isBuilding.value = false;
        }
      }
    }

    /**
     * 下载构建产物
     * @param {any} item - 构建历史记录项
     * @returns {Promise<void>}
     */
    async function handleDownload(item: any) {
      if (!item.downloadable) return;
      try {
        ElMessage.success(`开始下载 ${item.version}`);
        await buildApi.download(item.taskId);
      } catch (e: any) {
        ElMessage.error('下载失败：' + (e?.message || '未知错误'));
      }
    }

    /**
     * 加载构建历史
     * @returns {Promise<void>}
     */
    async function loadBuildHistory() {
      const ctx = buildContext.value;
      if (!ctx) {
        buildHistoryList.value = [];
        return;
      }

      const res: any = await buildApi.getHistory({
        contextType: ctx.contextType,
        contextId: ctx.contextId,
        limit: 20,
        offset: 0
      });

      if (!res || res.status !== 'success') {
        throw new Error(res?.message || '加载构建历史失败');
      }

      const list: any[] = Array.isArray(res.datum?.list) ? res.datum.list : [];
      buildHistoryList.value = list.map((t: any) => ({
        taskId: t.taskId,
        version: t.version,
        time: dateUtils.format(t.createdAt, 'MM-DD HH:mm'),
        status: t.status,
        statusLabel: statusUtils.getStatusLabel(t.status, {
          queued: '排队中',
          running: '构建中',
          completed: '已完成',
          partial_completed: '部分完成',
          failed: '失败',
          cancelled: '已取消'
        }),
        downloadable: !!t.downloadable
      }));
    }

    /**
     * 开始轮询构建任务状态
     * @param {string} taskId - 构建任务 ID
     * @returns {Promise<void>}
     */
    async function startBuildPolling(taskId: string) {
      startPolling(
        async () => {
          const res: any = await buildApi.getStatus(taskId);
          if (!res || res.status !== 'success') {
            throw new Error(res?.message || '获取构建状态失败');
          }
          return res.datum;
        },
        {
          interval: 1200,
          immediate: true,
          stopCondition: (_task) => {
            const status = _task?.status;
            return status === 'completed'
              || status === 'partial_completed'
              || status === 'failed'
              || status === 'cancelled';
          },
          onSuccess: () => {
            // 持续轮询中，暂不处理
          },
          onComplete: async (task) => {
            // 结束态：刷新历史
            await loadBuildHistory();
            isBuilding.value = false;
            if (currentTaskId.value === task?.taskId) {
              currentTaskId.value = null;
            }
            if (task.status === 'completed' || task.status === 'partial_completed') {
              ElMessage.success(`构建完成：${task.version}`);
            } else if (task.status === 'failed') {
              try {
                await handleBuildFailed(task);
              } catch (e: any) {
                // ElMessageBox 被用户关闭时可能会 reject（如 'cancel'/'close'），避免产生未处理 Promise
                const msg = typeof e === 'string' ? e : (e?.message || '');
                if (msg === 'cancel' || msg === 'close') return;
                if (import.meta?.env?.DEV) {
                  console.error('[BuildModal] handleBuildFailed 异常', e);
                }
              }
            }
          },
          onError: (e) => {
            ElMessage.error('获取构建状态失败：' + (e?.message || '未知错误'));
            if (import.meta?.env?.DEV) {
              console.error('[BuildModal] 轮询构建状态失败', { taskId }, e);
            }
          }
        }
      );
    }

    /**
     * 处理构建失败
     * @param {any} task - 构建任务对象
     * @returns {Promise<void>}
     */
    async function handleBuildFailed(task: any) {
      const detailList = Array.isArray(task.errorDetailList) ? task.errorDetailList : [];
      if (import.meta?.env?.DEV) {
        console.error('[BuildModal] 构建失败（详细信息）', {
          taskId: task.taskId,
          version: task.version,
          status: task.status,
          progress: task.progress,
          contextType: task.contextType,
          contextId: task.contextId,
          contextName: task.contextName,
          options: task.options,
          errorMessage: task.errorMessage,
          errorDetailList: detailList
        });
      }
      if (detailList.length > 0) {
        const first = detailList[0] || {};
        const validationErrorList = Array.isArray(first.validationErrorList) ? first.validationErrorList : [];
        const lines = [];
        if (task.errorMessage) lines.push(String(task.errorMessage));
        if (first.name) lines.push(`目标：${first.name}`);
        if (first.errorMessage) lines.push(`原因：${first.errorMessage}`);
        if (validationErrorList.length > 0) {
          lines.push('校验错误：');
          for (const v of validationErrorList.slice(0, 5)) {
            const packetName = v?.packetName ? String(v.packetName) : '';
            const fieldPath = v?.fieldPath ? String(v.fieldPath) : '';
            const msg = v?.message ? String(v.message) : '';
            const prefix = (packetName || fieldPath) ? `- ${packetName}${packetName && fieldPath ? ' / ' : ''}${fieldPath}：` : '- ';
            lines.push(`${prefix}${msg || '配置错误'}`);
          }
        }
        try {
          await ElMessageBox.alert(lines.join('\n'), '构建失败', {
            confirmButtonText: '知道了',
            showClose: false,
            closeOnClickModal: false,
            closeOnPressEscape: false,
          });
        } catch (e: any) {
          // 用户关闭/取消弹框属于正常交互，吞掉避免控制台 Uncaught (in promise)
          const msg = typeof e === 'string' ? e : (e?.message || '');
          if (msg === 'cancel' || msg === 'close') return;
          if (import.meta?.env?.DEV) {
            console.error('[BuildModal] ElMessageBox.alert 异常', e);
          }
        }
      } else {
        ElMessage.error(task.errorMessage || '构建失败');
      }
    }

    onMounted(() => {
      loadBuildHistory();
    });

    watch(visible, (v) => {
      if (v) {
        loadBuildHistory();
        return;
      }
      // 关闭弹窗时停止轮询（任务仍在后端继续执行）
      stopPolling();
    });

    watch(buildContext, () => {
      if (visible.value) {
        loadBuildHistory();
      }
    });

    onBeforeUnmount(() => {
      stopPolling();
    });

    return {
      visible,
      handleClose,
      cppSdkEnabled,
      icdDocEnabled,
      handleCppSdkClick,
      cppLanguage,
      languageOptionList,
      cppPlatform,
      platformOptionList,
      handleIcdDocClick,
      isBuilding,
      handleStartBuild,
      buildHistoryList,
      handleDownload,
      getStatusClass,
    };
  }
});
</script>

<style lang="scss" src="./index.scss"></style>
