<!--
  层级节点接口编辑器组件 (Hierarchy Interface Editor)
  使用场景：从节点 Dashboard 的"通信接口" Tab 点击"报文"按钮进入
  路径示例：/#/editor/ide?type=logic&systemNodeId=xxx → 通信接口 → 报文按钮
  
  左侧报文列表 + 右侧内容区（顶部控制栏 + 底部内容区）
  物理分离原因：与 protocol-interface-editor 分离，便于后续独立演进
-->
<template>
  <!-- 编辑器主容器 -->
  <div
    class="ide-interface-editor"
    v-bind="$attrs"
    :data-debug-hierarchy="sourceType === 'hierarchy' ? sourceIdValue : undefined"
    :data-debug-protocol="sourceType === 'protocol' ? sourceIdValue : undefined"
  >
    <!-- 1.1 左侧报文列表 -->
    <PacketListPanel
      v-if="showPacketList"
      :readonly="true"
      @select="selectPacket"
    />

    <!-- 1.2 右侧内容区 -->
    <div v-if="activePacket" class="ide-interface-content">
      <!-- 1.2.1 顶部控制栏 -->
      <div class="ide-interface-content-toolbox">
        <div class="ide-interface-header-left">
          <div class="ide-interface-icon-wrapper">
            <div class="ide-interface-icon">
              <el-icon :size="UI_SIZE.ICON_SIZE_MEDIUM">
                <Document />
              </el-icon>
            </div>
          </div>

          <div class="ide-interface-title-section">
            <h1 class="ide-interface-title">
              {{ activePacket.name || '未命名报文' }}
            </h1>

            <p class="ide-interface-subtitle">
              版本：{{ activePacket.version || '1.0.0' }}
            </p>
          </div>
        </div>

        <!-- 操作按钮区 -->
        <div class="ide-interface-header-actions">
          <!-- 版本过期状态和操作 -->
          <template v-if="isPacketOutdatedComputed">
            <div class="toolbar-outdated-group">
              <div class="toolbar-outdated-info">
                <el-icon :size="UI_SIZE.ICON_SIZE_TINY">
                  <Warning />
                </el-icon>

                <span>
                  版本过期
                  <template v-if="latestPublishedVersionLabel">
                    （最新版本：{{ latestPublishedVersionLabel }}）
                  </template>
                </span>
              </div>

              <el-button size="small" class="toolbar-btn-upgrade" @click="handleUpgradeToLatest">
                升级到最新
              </el-button>
            </div>

            <el-button size="small" @click="handleViewVersionDiffWrapper">
              查看差异
            </el-button>
          </template>

          <!-- 编辑报文按钮：跳转到协议编辑视图 -->
          <el-button
            size="small"
            type="primary"
            @click="handleNavigateToProtocolEditor"
          >
            <el-icon :size="UI_SIZE.ICON_SIZE_SMALL">
              <Link />
            </el-icon>
            编辑报文
          </el-button>

          <!-- 编辑报文定义按钮（前端报文） -->
          <el-button
            v-if="!is_backend_message"
            size="small"
            @click="handleNavigateToDefinition"
          >
            <el-icon :size="UI_SIZE.ICON_SIZE_SMALL">
              <Link />
            </el-icon>
            编辑报文定义
          </el-button>
        </div>
      </div>

      <!-- 1.2.2 底部内容区（技术文档视图） -->
      <div class="ide-interface-content-main">
        <PacketDocumentView :packet="activePacket" />
      </div>
    </div>

    <!-- 未选择报文时的空状态 -->
    <div v-else class="ide-interface-empty">
      <el-icon :size="UI_SIZE.ICON_SIZE_LARGE" color="#cbd5e1">
        <Document />
      </el-icon>

      <p>请选择一个报文进行{{ editStatus === EDIT_STATUS.HISTORY || editStatus === EDIT_STATUS.READONLY ? '查看' : '编辑' }}</p>
    </div>
  </div>

  <!-- 弹窗组件（放在 flex 容器外面，避免影响布局） -->
  <!-- 版本差异对比弹窗 -->
  <ProtocolDiffDialog
    v-model:visible="versionDiffDialogVisible"
    :comp-options="versionDiffDialogData.meta"
    :local="versionDiffDialogData.local"
    :latest="versionDiffDialogData.latest"
    @sync="handleVersionDiffSync"
  />

  <!-- 版本历史弹窗 -->
  <VersionHistoryDialog
    v-model:visible="versionHistoryDialogVisible"
    :packet-name="activePacket?.name || ''"
    :message-id="(activePacket as any)?.message_id"
    :current-version-id="currentVersionId"
    @select="handleVersionSelect"
  />

</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Document, Link, Warning } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useIcdStore, useIdeStore } from '@/stores';
import { convert_loaded_data_to_ui_format } from '@/utils';
import { resolve_numeric_id } from '@/utils/validationUtils';
import { validateId } from '@/utils/idUtils';
import { buildEditorPath, buildEditorTabKey } from '@/utils/routeParamHelper';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';
import { communicationNodeApi } from '@/api/communicationNode';
import ProtocolDiffDialog from '../protocol-diff-dialog/index.vue';
import VersionHistoryDialog from '../shared-version-dialog/index.vue';
import {
  PacketListPanel,
  PacketDocumentView
} from './components';
import {
  useInterfacePacketRefs,
  useInterfaceVersionControl,
  useInterfaceDraft
} from './composables';
import type { PacketData, EditStatus } from './types';
import { UI_SIZE } from '@/constants';
import { EDIT_STATUS } from '@/views/ide/constants';

// Hierarchy Interface Editor - 层级节点接口编辑器
// 使用场景：从 node-dashboard 点击报文按钮进入

// 禁用自动属性继承，手动绑定到根元素（因为组件有多个根节点）
defineOptions({
  inheritAttrs: false
});

// Emits
const emit = defineEmits<{
  (e: 'error', error: any): void;
  (e: 'navigate-to-definition', protocolId: string, packetId: string, packetName?: string, packetVersion?: string): void;
  (e: 'save', packetList: PacketData[]): void;
  (e: 'discard-draft', packetId: string): void;
}>();

// Store
const icdStore = useIcdStore();
const ideStore = useIdeStore();

// Router
const route = useRoute();
const router = useRouter();

// 从 URL 获取参数
const interfaceId = computed(() => route.query.interfaceId as string | undefined);
const systemNodeId = computed(() => route.query.systemNodeId as string | undefined);

// 使用 composables
const {
  packetRefListLocal,
  packetList,
  savePacketRefListToBackend,
  loadInterfacePacketRefs,
} = useInterfacePacketRefs({
  showPacketList: true,
  readonly: false,
  interfaceId: interfaceId.value,
  nodeId: systemNodeId.value,
});

const {
  latestPublishedInfo,
  loadLatestPublishedInfo,
  versionDiffDialogVisible,
  versionDiffDialogData,
  versionHistoryDialogVisible,
  handleViewVersionDiff,
} = useInterfaceVersionControl();

// 是否正在查看历史版本（本视图仅做本地状态，不参与协议编辑器 URL 状态机）
const isViewingHistoryVersion = ref(false);

const {
  hasUnsavedChanges,
  updateSnapshot,
  checkDraft,
} = useInterfaceDraft();


// 模板中使用的来源类型和来源 ID（从 URL 获取）
const sourceType = computed(() => route.query.sourceType as string | undefined);
const sourceIdValue = computed(() => route.query.sourceId as string | undefined);
// 模板中使用的 showPacketList：层级节点接口视图显示报文列表
const showPacketList = computed(() => true);

// 当前激活的报文 ID
const activePacketId = ref<number | string>('');

// 当前激活的报文
const activePacket = computed(() => {
  // 仅支持场景一：从接口的 packetList 中按 activePacketId 查找
  return packetList.value.find(p => String(p.id) === String(activePacketId.value)) || null;
});


// 当前报文引用
const currentPacketRef = computed(() => {
  if (!activePacket.value) return null;
  const resolved_id = resolve_numeric_id(activePacket.value.id);
  if (!resolved_id) return null;
  return packetRefListLocal.value.find((r) => r.packet_id === Number(resolved_id)) || null;
});

// 当前报文版本 ID（用于版本历史弹窗）
const currentVersionId = computed(() => {
  return validateId(activePacket.value?.id) || 0;
});

// 判断当前报文是否过期
const isPacketOutdatedComputed = computed(() => {
  if (!activePacket.value) return false;
  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  if (!message_id) return false;
  const latest = latestPublishedInfo.value && latestPublishedInfo.value.message_id === message_id ? latestPublishedInfo.value : null;
  if (!latest || !latest.id) return false;
  const current_id = validateId(activePacket.value.id);
  return current_id !== undefined ? latest.id !== current_id : false;
});

const latestPublishedVersionLabel = computed(() => {
  if (!activePacket.value) return '';
  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  if (!message_id) return '';
  const latest = latestPublishedInfo.value && latestPublishedInfo.value.message_id === message_id ? latestPublishedInfo.value : null;
  return latest?.version || '';
});

// 是否是后端报文
const is_backend_message = computed(() => {
  const id = activePacket.value?.id;
  if (id === undefined || id === null) return false;
  return resolve_numeric_id(id) !== undefined;
});

// 后端报文已发布状态
const is_published_backend_packet = computed(() => {
  if (!is_backend_message.value) return false;
  const status = (activePacket.value as any)?.publish_status;
  return status === 1;
});

// 后端报文草稿状态
const is_draft_backend_packet = computed(() => {
  if (!is_backend_message.value) return false;
  const status = (activePacket.value as any)?.publish_status;
  return status === 0;
});

// 编辑状态
const editStatus = computed<EditStatus>(() => {
  if (isViewingHistoryVersion.value) return EDIT_STATUS.HISTORY;
  if (is_backend_message.value && is_published_backend_packet.value) return EDIT_STATUS.READONLY;
  if (is_backend_message.value && is_draft_backend_packet.value) return EDIT_STATUS.DRAFT;
  return 'editable';
});



// 监听 activePacket 变化，更新快照
watch(() => activePacket.value, (new_packet) => {
  updateSnapshot(new_packet);
}, { immediate: true });

// 监听报文变化，获取最新版本信息（不使用缓存）
watch(() => activePacket.value, async (p) => {
  const message_id = String((p as any)?.message_id || '').trim();
  if (!message_id) return;
  await loadLatestPublishedInfo(message_id);
}, { immediate: true });

// 检查草稿
watch(() => (activePacket.value as any)?.message_id, async (new_message_id) => {
  await checkDraft(String(new_message_id || ''), is_published_backend_packet.value);
}, { immediate: true });

// 选中态同步序号：用于避免快速切换时的异步竞态
const selectionSyncSeq = ref(0);

/**
 * 检查报文是否在右侧列表中
 * @param {string | number} packetId - 报文ID
 * @returns {boolean} 是否在列表中
 */
function hasPacketInRightList(packetId: string | number): boolean {
  const pid = String(packetId ?? '').trim();
  if (!pid) return false;
  return (packetList.value || []).some((p) => String((p as any)?.id ?? '').trim() === pid);
}

/**
 * 确保报文已加载到右侧列表（如未加载则重新加载）
 * @param {string} packetId - 报文ID
 * @returns {Promise<void>}
 */
async function ensurePacketLoadedForSelection(packetId: string): Promise<void> {
  if (!packetId) return;
  if (hasPacketInRightList(packetId)) return;
  if (!interfaceId.value || !systemNodeId.value) return;
  await loadInterfacePacketRefs(interfaceId.value, systemNodeId.value);
}

// 监听 URL 参数中的 protocolAlgorithmId：作为“当前选中报文”的 URL 状态
// 关键：当选中的报文不在右侧 packetList（useInterfacePacketRefs 的数据源）中时，需补拉一次引用列表以同步详情
watch(
  () => route.query.protocolAlgorithmId as string | undefined,
  async (newId) => {
    const pid = String(newId ?? '').trim();
    if (!pid) return;

    const currentSeq = ++selectionSyncSeq.value;
    activePacketId.value = pid;
    isViewingHistoryVersion.value = false;

    // 若右侧数据源尚未包含该报文（常见于“新增报文后仅左侧列表刷新”的场景），补拉一次
    if (!hasPacketInRightList(pid)) {
      try {
        await ensurePacketLoadedForSelection(pid);
      } catch (e: any) {
        console.error('[Logic Node Interface] 选中报文详情加载失败:', e);
        ElMessage.error({ message: e?.message || '报文详情加载失败，请重试', plain: true });
        return;
      }

      // 若在等待期间用户又切换了选中项，则丢弃本次结果
      if (currentSeq !== selectionSyncSeq.value) return;

      // 兜底：补拉后仍找不到时给出提示，避免“空白无反馈”
      if (!hasPacketInRightList(pid)) {
        console.warn('[Logic Node Interface] 选中报文不在右侧列表中（补拉后仍缺失）', {
          packetId: pid,
          interfaceId: interfaceId.value,
          systemNodeId: systemNodeId.value,
        });
        ElMessage.warning({ message: '报文详情未加载到本地列表，请稍后重试', plain: true });
      }
    }
  },
  { immediate: true }
);

/**
 * 获取节点名称
 */
async function loadNodeName(): Promise<string> {
  if (!systemNodeId.value) return '未命名节点';
  try {
    const res = await systemLevelDesignTreeApi.getNodeById(systemNodeId.value);
    if (res.status === 'success' && res.datum) {
      const datum = res.datum as any;
      return datum?.properties?.['名称'] || datum?.name || '未命名节点';
    }
  } catch (error) {
    console.error('[Logic Node Interface] 获取节点名称失败:', error);
  }
  return '未命名节点';
}

/**
 * 获取接口类型
 */
async function loadInterfaceType(): Promise<string> {
  if (!systemNodeId.value || !interfaceId.value) return '接口';
  try {
    const res = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
    if (res.status === 'success' && res.datum) {
      const endpointList = Array.isArray((res.datum as any).endpoint_description)
        ? (res.datum as any).endpoint_description
        : [];
      const endpoint = endpointList.find((e: any) =>
        String(e?.interface_id || '').trim() === String(interfaceId.value)
      );
      if (endpoint?.type) return endpoint.type;
    }
  } catch (error) {
    console.error('[Logic Node Interface] 获取接口类型失败:', error);
  }
  return '接口';
}

/**
 * 设置标签页标题
 * 格式：{节点名}/{接口类型}
 */
async function updateTabTitle() {
  const [nodeName, interfaceType] = await Promise.all([
    loadNodeName(),
    loadInterfaceType()
  ]);
  const tabKey = buildEditorTabKey(route.path, route.query);
  ideStore.setTabTitle(tabKey, `${nodeName}/${interfaceType}`);
}

// 初始化
onMounted(async () => {
  if (icdStore.bundleList.length === 0) {
    icdStore.initSampleData();
  }
  if (interfaceId.value) {
    icdStore.setActiveBundle(interfaceId.value);
  }
  // 加载接口报文引用列表，确保 packetRefListLocal 有数据
  if (interfaceId.value && systemNodeId.value) {
    await loadInterfacePacketRefs(interfaceId.value, systemNodeId.value);
  }
  // 设置标签页标题
  await updateTabTitle();
});

/**
 * 选择报文（packet-list-panel 已更新 URL，这里只需要同步 activePacketId）
 */
function selectPacket(packet: PacketData) {
  activePacketId.value = packet.id;
  isViewingHistoryVersion.value = false;
}

/**
 * 升级到最新版本
 */
async function handleUpgradeToLatest() {
  if (!activePacket.value || !currentPacketRef.value) return;

  // 重新加载引用列表，确保使用最新数据
  await loadInterfacePacketRefs(interfaceId.value, systemNodeId.value);

  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  if (!message_id) {
    ElMessage.warning('缺少 message_id，无法判断最新版本');
    return;
  }

  const latest = await loadLatestPublishedInfo(message_id);
  if (!latest || !latest.id) {
    ElMessage.warning('未获取到最新已发布版本');
    return;
  }

  const current_id = typeof activePacket.value.id === 'number' ? activePacket.value.id : Number(activePacket.value.id);
  if (!Number.isFinite(current_id) || current_id <= 0) return;
  if (latest.id === current_id) {
    ElMessage.success('当前已是最新版本');
    return;
  }

  const direction = currentPacketRef.value.direction;
  const existed = packetRefListLocal.value.some((r) => r.packet_id === latest.id);
  packetRefListLocal.value = packetRefListLocal.value.filter((r) => r.packet_id !== current_id);
  if (!existed) {
    packetRefListLocal.value.push({ packet_id: latest.id, direction });
  }

  await savePacketRefListToBackend(interfaceId.value, systemNodeId.value);
  activePacketId.value = latest.id;
  isViewingHistoryVersion.value = false;
  ElMessage.success('已升级到最新版本');
}

/**
 * 查看版本差异（包装器）
 */
async function handleViewVersionDiffWrapper() {
  await handleViewVersionDiff(
    activePacket.value,
    showPacketList.value,
    '',
    currentPacketRef.value?.direction
  );
}

/**
 * 版本差异同步
 */
function handleVersionDiffSync() {
  versionDiffDialogVisible.value = false;
  handleUpgradeToLatest();
}

/**
 * 选择历史版本
 */
async function handleVersionSelect(versionData: any) {
  if (!activePacket.value) return;

  if (hasUnsavedChanges(activePacket.value)) {
    try {
      await ElMessageBox.confirm(
        '当前有未保存的更改，切换版本将丢失这些更改，是否继续？',
        '提示',
        {
          confirmButtonText: '切换版本',
          cancelButtonText: '取消',
          type: 'warning',
        }
      );
    } catch {
      return;
    }
  }

  const packet = activePacket.value as any;
  const message_id = String(packet?.message_id || '').trim();

  if (message_id) {
    await loadLatestPublishedInfo(message_id);
  }

  const fields = versionData.fields || [];

  if (Array.isArray(fields) && fields.length > 0) {
    const _fields = convert_loaded_data_to_ui_format(fields);
    Object.assign(packet, {
      ...versionData,
      fields: _fields
    });
  } else {
    Object.assign(packet, versionData);
  }

  activePacketId.value = String(versionData.id);
  updateSnapshot(activePacket.value);

  const latest = latestPublishedInfo.value && latestPublishedInfo.value.message_id === message_id ? latestPublishedInfo.value : null;
  const selected_id = typeof versionData.id === 'number' ? versionData.id : Number(versionData.id);
  isViewingHistoryVersion.value = latest ? selected_id !== latest.id : true;
}

/**
 * 跳转到协议定义
 */
function handleNavigateToDefinition() {
  const packetId = String(activePacket.value?.id || '').trim();
  const packetName = String((activePacket.value as any)?.name || '').trim();
  const packetVersion = String((activePacket.value as any)?.version || '').trim();

  if (packetId) {
    const data = icdStore.getPacketWithBundle(packetId);
    if (data?.bundle?.id) {
      emit('navigate-to-definition', String(data.bundle.id), packetId, packetName, packetVersion);
      return;
    }
    emit('navigate-to-definition', '', packetId, packetName, packetVersion);
    return;
  }

  ElMessage.warning('无法定位该报文的协议定义位置，请确认已关联协议集/报文引用');
}

/**
 * 跳转到协议编辑视图
 * 层级节点接口视图的报文只能查看，编辑需要跳转到协议编辑视图
 */
async function handleNavigateToProtocolEditor() {
  if (!activePacket.value) {
    ElMessage.warning('请先选择一个报文');
    return;
  }

  // 用于协议编辑视图的 packet_id（与 URL 中 protocolAlgorithmId 语义一致）
  const resolved = resolve_numeric_id(activePacket.value.id);
  const packet_id = resolved ? Number(resolved) : Number(activePacket.value.id);
  if (!Number.isFinite(packet_id) || packet_id <= 0) {
    ElMessage.warning('报文 ID 无效');
    return;
  }

  // 期望行为：跳转到该报文的最新已发布版本
  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  let target_id = packet_id;
  if (message_id) {
    const latest = await loadLatestPublishedInfo(message_id);
    if (latest?.id && Number.isFinite(Number(latest.id)) && Number(latest.id) > 0) {
      target_id = Number(latest.id);
    } else {
      ElMessage.warning('未获取到最新已发布版本，将打开当前版本');
    }
  } else {
    ElMessage.warning('缺少 message_id，无法定位最新版本，将打开当前版本');
  }

  // 只传递 protocolAlgorithmId 参数，与直接访问协议报文页面保持一致
  // 不传递 mode 参数，让协议编辑页面根据报文状态自动判断编辑模式
  router.push({
    path: buildEditorPath('protocol'),
    query: {
      protocolAlgorithmId: String(target_id)
    }
  });
}

</script>

<style lang="scss" src="./index.scss"></style>
