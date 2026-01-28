<!--
  报文列表面板组件
  显示和管理接口中的报文列表
  直接从 URL 读取参数，监听 URL 变化自动加载数据
  新建报文功能完全在组件内部处理，不依赖父组件
-->
<template>
  <div class="ide-interface-packets">
    <div class="ide-interface-packets-header">
      报文 (Packets)
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="ide-interface-packets-loading">
      <el-icon :size="UI_SIZE.ICON_SIZE_SMALL" class="is-loading">
        <Loading />
      </el-icon>

      <span>加载中...</span>
    </div>

    <!-- 报文列表 -->
    <div v-else class="ide-interface-packets-list">
      <div
        v-for="packet in packetList"
        :key="packet.id"
        class="ide-packet-item"
        :class="{ 'ide-packet-item--active': String(activePacketId) === String(packet.id) }"
        @click="handleSelectPacket(packet)"
        @contextmenu.prevent="showContextMenu($event, packet)"
      >
        <div class="ide-packet-item-header">
          <div class="ide-packet-item-name">
            {{ packet.name }}
          </div>

          <!-- 悬停显示的移除按钮 -->
          <el-button
            class="ide-packet-item-remove"
            text
            size="small"
            @click.stop="handleRemovePacket(packet)"
          >
            <el-icon :size="14"><Delete /></el-icon>
          </el-button>
        </div>

        <div class="ide-packet-item-meta">
          <span class="ide-packet-item-direction">
            {{ getPacketDirectionText(packet.direction) }}
          </span>
        </div>

        <!-- 通信配置信息 -->
        <div class="ide-packet-item-comm-config">
          <!-- TCP/UDP: 显示 MessageID -->
          <template v-if="interfaceConnectionType === 'TCP' || interfaceConnectionType === 'UDP'">
            <span class="ide-packet-item-config">
              <span class="config-label">ID:</span>
              <span :class="['config-value', { 'config-value--empty': !getPacketMessageId(packet.id) }]">
                {{ getPacketMessageId(packet.id) || '未配置' }}
              </span>
            </span>
          </template>

          <!-- DDS: 显示 Topic 和 QoS -->
          <template v-if="interfaceConnectionType === 'DDS'">
            <span class="ide-packet-item-config ide-packet-item-config--dds">
              <span class="config-label">Topic:</span>
              <span :class="['config-value', { 'config-value--empty': !getPacketTopicName(packet.id) }]">
                {{ getPacketTopicName(packet.id) || '未配置' }}
              </span>
            </span>
            <span v-if="getPacketQoS(packet.id)" class="ide-packet-item-qos">
              {{ getPacketQoS(packet.id) }}
            </span>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="packetList.length === 0" class="ide-interface-packets-empty">
        <el-icon :size="UI_SIZE.ICON_SIZE_SMALL">
          <Document />
        </el-icon>

        <span>暂无报文，请点击<br />添加报文</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <Transition name="context-menu">
        <div
          v-if="contextMenuVisible"
          class="ide-packet-context-menu"
          :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
        >
          <div class="ide-packet-context-menu-item" @click="handleContextMenuEditConfig">
            <el-icon :size="14"><Setting /></el-icon>
            <span>编辑配置</span>
          </div>
          <div class="ide-packet-context-menu-item" @click="handleContextMenuToggleDirection">
            <el-icon :size="14"><Switch /></el-icon>
            <span>{{ getToggleDirectionText() }}</span>
          </div>
          <div class="ide-packet-context-menu-item ide-packet-context-menu-item--danger" @click="handleContextMenuRemove">
            <el-icon :size="14"><Delete /></el-icon>
            <span>移除</span>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 编辑配置弹窗 -->
    <el-dialog
      v-model="editConfigDialogVisible"
      title="编辑通信配置"
      width="480px"
      destroy-on-close
    >
      <el-form label-width="100px" @submit.prevent>
        <!-- TCP/UDP: 信息标识 -->
        <template v-if="interfaceConnectionType === 'TCP' || interfaceConnectionType === 'UDP'">
          <el-form-item label="信息标识">
            <el-input
              v-model="editConfigForm.message_id"
              placeholder="例如: 0x01 或 1"
            />
          </el-form-item>
        </template>

        <!-- DDS 配置 -->
        <template v-if="interfaceConnectionType === 'DDS'">
          <el-form-item label="Topic Name">
            <el-input
              v-model="editConfigForm.topic_name"
              placeholder="DDS Topic 名称"
            />
          </el-form-item>

          <el-form-item label="Reliability">
            <el-select v-model="editConfigForm.reliability" style="width: 100%">
              <el-option label="RELIABLE" value="reliable" />
              <el-option label="BEST_EFFORT" value="best_effort" />
            </el-select>
          </el-form-item>

          <el-form-item label="Durability">
            <el-select v-model="editConfigForm.durability" style="width: 100%">
              <el-option label="VOLATILE" value="volatile" />
              <el-option label="TRANSIENT_LOCAL" value="transient_local" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="editConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editConfigSaving" :disabled="editConfigSaving" @click="confirmEditConfig">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <div class="ide-interface-packets-actions">
      <el-button size="small" @click="openAddPacketDialog">
        <el-icon>
          <Plus />
        </el-icon>
        添加报文
      </el-button>
    </div>
  </div>

  <!-- 关联报文弹窗（组件内部管理） -->
  <AddPacketDialog
    v-model:visible="addPacketDialogVisible"
    :comp-options="{
      form: addPacketForm,
      loadingOptions: loadingMessageIdOptions,
      messageIdOptions: messageIdOptionList,
      versionOptions: versionOptionList,
      connectionType: interfaceConnectionType
    }"
    @message-id-change="handleMessageIdChange"
    @packet-id-change="handlePacketIdChange"
    @direction-change="handleDirectionChange"
    @comm-message-id-change="handleCommMessageIdChange"
    @topic-name-change="handleTopicNameChange"
    @reliability-change="handleReliabilityChange"
    @durability-change="handleDurabilityChange"
    @confirm="confirmAddPacket"
    @cancel="addPacketDialogVisible = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Loading, Document, Delete, Switch, Setting } from '@element-plus/icons-vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { UI_SIZE } from '@/constants';
import { getPacketDirectionText } from '@/utils/formatUtils';
import { communicationNodeApi } from '@/api/communicationNode';
import { getMessageList, getMessageVersionList, getMessagePublishedDetail } from '@/api/messageManagement';
import { normalizeNumberedList, arrayUtils, parseVersion } from '@/utils';
import { API_CONFIG } from '@/views/ide/constants';
import type { PacketData } from '../../types';
import AddPacketDialog from '../add-packet-dialog/index.vue';

interface Emits {
  (e: 'select', packet: PacketData): void;
  (e: 'loaded', packetList: PacketData[]): void;
}

const emit = defineEmits<Emits>();
const props = defineProps<{
  readonly?: boolean;
}>();

const route = useRoute();
const router = useRouter();

// 从 URL 读取参数
const interfaceId = computed(() => route.query.interfaceId as string || '');
const systemNodeId = computed(() => route.query.systemNodeId as string || '');
const protocolAlgorithmId = computed(() => route.query.protocolAlgorithmId as string | undefined);

// 当前激活的报文 ID（从 URL 读取）
const activePacketId = computed(() => protocolAlgorithmId.value);

// 内部状态
const packetList = ref<PacketData[]>([]);
const loading = ref(false);
const saving = ref(false);

// 当前接口的连接类型
const interfaceConnectionType = ref<string>('TCP');

// 本地维护的报文引用列表（用于新建/删除，扩展了 message_id 和 dds 配置）
const packetRefListLocal = ref<Array<{
  packet_id: number;
  direction: 'input' | 'output';
  message_id?: string;
  topic_name?: string;
  reliability?: 'best_effort' | 'reliable';
  durability?: 'volatile' | 'transient_local';
}>>([]);

// 关联报文弹窗状态
const addPacketDialogVisible = ref(false);

// 右键菜单状态
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuPacket = ref<PacketData | null>(null);
const loadingMessageIdOptions = ref(false);
const messageIdOptionList = ref<Array<{ value: string; label: string }>>([]);
const versionOptionList = ref<Array<{ value: number; label: string }>>([]);

const addPacketForm = ref<{
  message_id: string;
  packet_id: number | undefined;
  direction: 'input' | 'output';
  // TCP/UDP 配置
  comm_message_id: string;
  // DDS 配置
  topic_name: string;
  reliability: 'best_effort' | 'reliable';
  durability: 'volatile' | 'transient_local';
}>({
  message_id: '',
  packet_id: undefined,
  direction: 'input',
  comm_message_id: '',
  topic_name: '',
  reliability: 'reliable',
  durability: 'volatile'
});

// 编辑配置弹窗状态
const editConfigDialogVisible = ref(false);
const editConfigSaving = ref(false);
const editConfigPacketId = ref<number | null>(null);
const editConfigForm = ref<{
  message_id: string;
  topic_name: string;
  reliability: 'best_effort' | 'reliable';
  durability: 'volatile' | 'transient_local';
}>({
  message_id: '',
  topic_name: '',
  reliability: 'reliable',
  durability: 'volatile'
});

/**
 * 加载报文列表
 * @returns {Promise<void>}
 */
async function loadPacketList() {
  if (!interfaceId.value || !systemNodeId.value) {
    packetList.value = [];
    packetRefListLocal.value = [];
    return;
  }

  loading.value = true;
  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '获取节点接口容器失败');
    }

    const container = ensureRes.datum as any;
    const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];

    const endpoint = endpointList.find((e: any) => String(e?.interface_id || '').trim() === String(interfaceId.value));

    // 保存接口的连接类型
    if (endpoint?.type) {
      // 从 endpoint.type 推导连接类型（如 "TCP Server" -> "TCP"）
      if (endpoint.type.includes('TCP')) {
        interfaceConnectionType.value = 'TCP';
      } else if (endpoint.type.includes('UDP')) {
        interfaceConnectionType.value = 'UDP';
      } else if (endpoint.type === 'DDS') {
        interfaceConnectionType.value = 'DDS';
      } else if (endpoint.type === 'Serial') {
        interfaceConnectionType.value = 'Serial';
      } else if (endpoint.type === 'CAN') {
        interfaceConnectionType.value = 'CAN';
      } else {
        interfaceConnectionType.value = endpoint.type;
      }
    }

    if (endpoint && endpoint.packet_ref_list) {
      const refList = normalizeNumberedList<{
        packet_id: number;
        direction: 'input' | 'output';
        message_id?: string;
        topic_name?: string;
        reliability?: 'best_effort' | 'reliable';
        durability?: 'volatile' | 'transient_local';
      }>(
        endpoint.packet_ref_list,
        'packet_id',
        'input'
      );

      // 同步本地引用列表
      packetRefListLocal.value = refList;

      // 将 refList 转换为 PacketData 列表，并加载报文名称
      const result: PacketData[] = [];
      for (const ref of refList) {
        let packetName = '未命名报文';
        try {
          const detailRes = await getMessagePublishedDetail(ref.packet_id);
          if (detailRes?.status === 'success' && detailRes.datum?.name) {
            packetName = detailRes.datum.name;
          }
        } catch {
          // 加载失败时使用默认名称
        }
        result.push({
          id: ref.packet_id,
          name: packetName,
          direction: ref.direction,
          fields: []
        });
      }

      packetList.value = result;
    } else {
      packetList.value = [];
      packetRefListLocal.value = [];
    }
  } catch (error) {
    console.error('[PacketListPanel] 加载失败:', error);
    packetList.value = [];
    packetRefListLocal.value = [];
  } finally {
    loading.value = false;
  }

  // 通知父组件数据已加载
  emit('loaded', packetList.value);
}

// 监听 URL 参数变化，重新加载数据
watch(
  [interfaceId, systemNodeId],
  ([newInterfaceId, newSystemNodeId]) => {
    if (newInterfaceId && newSystemNodeId) {
      loadPacketList();
    } else {
      packetList.value = [];
    }
  },
  { immediate: true }
);

// 加载完成后，如果没有选中项且有数据，默认选中第一条
watch(packetList, (newList) => {
  if (newList.length > 0 && !protocolAlgorithmId.value) {
    const first = newList[0];
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        protocolAlgorithmId: String(first.id)
      }
    });
  }
});

/**
 * 点击报文 item
 * @param {PacketData} packet - 报文数据
 * @returns {void}
 */
function handleSelectPacket(packet: PacketData) {
  emit('select', packet);

  // 更新 URL 中的 protocolAlgorithmId
  if (interfaceId.value && systemNodeId.value) {
    router.replace({
      path: route.path,
      query: {
        ...route.query,
        protocolAlgorithmId: String(packet.id)
      }
    });
  }
}

/**
 * 移除报文
 * @param {PacketData} packet - 报文数据
 * @returns {Promise<void>}
 */
async function handleRemovePacket(packet: PacketData) {
  const packet_id = typeof packet.id === 'number' ? packet.id : Number(packet.id);
  if (!Number.isFinite(packet_id) || packet_id <= 0) {
    ElMessage.warning('无效的报文 ID');
    return;
  }

  if (saving.value) {
    return;
  }

  saving.value = true;
  try {
    const res = await communicationNodeApi.deletePacketRef(systemNodeId.value, interfaceId.value, packet_id);
    if (res.status === 'success') {
      await loadPacketList();
      ElMessage.success('已移除报文关联');
    } else {
      ElMessage.error(res.message || '移除失败');
    }
  } catch (error) {
    console.error('[PacketListPanel] 移除失败:', error);
    ElMessage.error('移除失败，请重试');
  } finally {
    saving.value = false;
  }
}

/**
 * 显示右键菜单
 * @param {MouseEvent} event - 鼠标事件对象
 * @param {PacketData} packet - 报文数据
 * @returns {void}
 */
function showContextMenu(event: MouseEvent, packet: PacketData) {
  contextMenuPacket.value = packet;

  // 计算菜单位置，确保不超出视口
  const menuWidth = 120;
  const menuHeight = 120; // 三个菜单项：编辑配置 + 切换方向 + 移除
  const padding = 8;

  let x = event.clientX;
  let y = event.clientY;

  // 检测右边界
  if (x + menuWidth + padding > window.innerWidth) {
    x = window.innerWidth - menuWidth - padding;
  }

  // 检测下边界
  if (y + menuHeight + padding > window.innerHeight) {
    y = event.clientY - menuHeight - padding;
  }

  contextMenuPosition.value = { x, y };
  contextMenuVisible.value = true;
}

/**
 * 隐藏右键菜单
 * @returns {void}
 */
function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuPacket.value = null;
}

/**
 * 右键菜单 - 移除
 * @returns {void}
 */
function handleContextMenuRemove() {
  if (contextMenuPacket.value) {
    handleRemovePacket(contextMenuPacket.value);
  }
  hideContextMenu();
}

/**
 * 右键菜单 - 编辑配置
 * @returns {void}
 */
function handleContextMenuEditConfig() {
  if (!contextMenuPacket.value) {
    hideContextMenu();
    return;
  }

  const packet = contextMenuPacket.value;
  const packet_id = typeof packet.id === 'number' ? packet.id : Number(packet.id);
  const ref = packetRefListLocal.value.find(r => r.packet_id === packet_id);

  // 初始化编辑表单
  editConfigPacketId.value = packet_id;
  editConfigForm.value = {
    message_id: ref?.message_id || '',
    topic_name: ref?.topic_name || '',
    reliability: ref?.reliability || 'reliable',
    durability: ref?.durability || 'volatile'
  };

  hideContextMenu();
  editConfigDialogVisible.value = true;
}

/**
 * 确认编辑配置
 * @returns {Promise<void>}
 */
async function confirmEditConfig() {
  if (!editConfigPacketId.value || !Number.isFinite(editConfigPacketId.value)) {
    ElMessage.warning('无效的报文 ID');
    return;
  }

  if (!systemNodeId.value) {
    ElMessage.warning('缺少节点ID，无法保存');
    return;
  }
  if (!interfaceId.value) {
    ElMessage.warning('缺少接口ID，无法保存');
    return;
  }
  if (editConfigSaving.value) {
    return;
  }

  editConfigSaving.value = true;
  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '获取节点接口容器失败');
    }

    const container = ensureRes.datum as any;
    const containerId = String(container.id);
    const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];
    const endpointIndex = endpointList.findIndex((e: any) => String(e?.interface_id || '').trim() === String(interfaceId.value));
    if (endpointIndex < 0) {
      ElMessage.error('接口未找到，无法保存');
      return;
    }

    const endpoint = endpointList[endpointIndex] as any;
    const packet_id = editConfigPacketId.value;
    const packetRefList = Array.isArray(endpoint?.packet_ref_list) ? endpoint.packet_ref_list : [];
    const packetRefIndex = packetRefList.findIndex((r: any) => Number(r?.packet_id) === Number(packet_id));
    if (packetRefIndex < 0) {
      ElMessage.error('该报文未关联到接口，无法保存');
      return;
    }

    const oldRef = packetRefList[packetRefIndex] || {};
    const newRef = { ...oldRef };

    if (interfaceConnectionType.value === 'TCP' || interfaceConnectionType.value === 'UDP') {
      newRef.message_id = String(editConfigForm.value.message_id || '').trim();
    } else if (interfaceConnectionType.value === 'DDS') {
      newRef.topic_name = String(editConfigForm.value.topic_name || '').trim();
      newRef.reliability = editConfigForm.value.reliability;
      newRef.durability = editConfigForm.value.durability;
    } else {
      ElMessage.warning('当前连接类型不支持编辑通信配置');
      return;
    }

    const newPacketRefList = [...packetRefList];
    newPacketRefList.splice(packetRefIndex, 1, newRef);

    const newEndpoint = { ...endpoint, packet_ref_list: newPacketRefList };
    const newEndpointList = [...endpointList];
    newEndpointList.splice(endpointIndex, 1, newEndpoint);

    const updateRes = await communicationNodeApi.updateEndpoints(containerId, newEndpointList);
    if (updateRes.status !== 'success') {
      throw new Error(updateRes.message || '保存配置失败');
    }

    // 保存成功后重新加载，确保数据已落库并刷新 UI
    await loadPacketList();
    ElMessage.success('配置已保存');
    editConfigDialogVisible.value = false;
  } catch (error: any) {
    console.error('[PacketListPanel] 保存配置失败:', error);
    ElMessage.error(error?.message || '保存失败');
  } finally {
    editConfigSaving.value = false;
  }
}

/**
 * 获取切换方向的菜单文本
 * @returns {string} 菜单文本
 */
function getToggleDirectionText(): string {
  if (!contextMenuPacket.value) return '切换方向';
  const currentDirection = contextMenuPacket.value.direction;
  return currentDirection === 'input' ? '切换为 发送' : '切换为 接收';
}

/**
 * 获取报文的 MessageID（用于 TCP/UDP）
 * @param {number | string} packetId - 报文 ID
 * @returns {string} MessageID
 */
function getPacketMessageId(packetId: number | string): string {
  const ref = packetRefListLocal.value.find(r => r.packet_id === Number(packetId));
  return ref?.message_id || '';
}

/**
 * 获取报文的 Topic 名称（用于 DDS）
 * @param {number | string} packetId - 报文 ID
 * @returns {string} Topic 名称
 */
function getPacketTopicName(packetId: number | string): string {
  const ref = packetRefListLocal.value.find(r => r.packet_id === Number(packetId));
  return ref?.topic_name || '';
}

/**
 * 获取报文的 QoS 配置（用于 DDS）
 * @param {number | string} packetId - 报文 ID
 * @returns {string} QoS 配置字符串
 */
function getPacketQoS(packetId: number | string): string {
  const ref = packetRefListLocal.value.find(r => r.packet_id === Number(packetId));
  if (!ref) return '';
  const parts: string[] = [];
  if (ref.reliability) {
    parts.push(ref.reliability === 'reliable' ? 'RELIABLE' : 'BEST_EFFORT');
  }
  if (ref.durability) {
    parts.push(ref.durability === 'transient_local' ? 'TRANSIENT' : 'VOLATILE');
  }
  return parts.join(' / ');
}

/**
 * 右键菜单 - 切换方向
 * @returns {Promise<void>}
 */
async function handleContextMenuToggleDirection() {
  if (!contextMenuPacket.value) {
    hideContextMenu();
    return;
  }

  const packet = contextMenuPacket.value;
  const packet_id = typeof packet.id === 'number' ? packet.id : Number(packet.id);

  if (!Number.isFinite(packet_id) || packet_id <= 0) {
    ElMessage.warning('无效的报文 ID');
    hideContextMenu();
    return;
  }

  if (saving.value) {
    return;
  }

  // 计算新方向
  const currentDirection = packet.direction || 'input';
  const newDirection: 'input' | 'output' = currentDirection === 'input' ? 'output' : 'input';

  hideContextMenu();
  saving.value = true;

  try {
    // 先删除旧引用
    const deleteRes = await communicationNodeApi.deletePacketRef(systemNodeId.value, interfaceId.value, packet_id);
    if (deleteRes.status !== 'success') {
      ElMessage.error(deleteRes.message || '切换方向失败');
      return;
    }

    // 创建新引用（新方向）
    const createRes = await communicationNodeApi.createPacketRef(systemNodeId.value, interfaceId.value, packet_id, newDirection);
    if (createRes.status === 'success') {
      await loadPacketList();
      ElMessage.success(`已切换为${newDirection === 'input' ? '接收' : '发送'}`);
    } else {
      // 创建失败，尝试恢复原引用
      await communicationNodeApi.createPacketRef(systemNodeId.value, interfaceId.value, packet_id, currentDirection);
      await loadPacketList();
      ElMessage.error(createRes.message || '切换方向失败');
    }
  } catch (error) {
    console.error('[PacketListPanel] 切换方向失败:', error);
    ElMessage.error('切换方向失败，请重试');
    // 尝试重新加载列表以恢复状态
    await loadPacketList();
  } finally {
    saving.value = false;
  }
}

/**
 * 点击外部关闭右键菜单
 * @param {MouseEvent} event - 鼠标事件对象
 * @returns {void}
 */
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.ide-packet-context-menu')) {
    hideContextMenu();
  }
}

// 注册全局点击事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

/**
 * 打开关联报文弹窗
 * @returns {Promise<void>}
 */
async function openAddPacketDialog() {
  if (!systemNodeId.value || !interfaceId.value) {
    ElMessage.warning('缺少接口信息，无法新增报文');
    return;
  }

  addPacketForm.value = {
    message_id: '',
    packet_id: undefined,
    direction: 'input',
    comm_message_id: '',
    topic_name: '',
    reliability: 'reliable',
    durability: 'volatile'
  };
  versionOptionList.value = [];
  addPacketDialogVisible.value = true;

  // 加载报文选项（如果还没加载过）
  if (messageIdOptionList.value.length > 0) return;

  loadingMessageIdOptions.value = true;
  try {
    const res = await getMessageList(API_CONFIG.PAGINATION_LARGE);
    if (res?.status !== 'success') return;
    const list = Array.isArray(res.datum?.list) ? res.datum.list : [];

    const unique_list = arrayUtils.uniqueBy(list.filter((item: any) => {
      const mid = String(item?.message_id || '').trim();
      return mid !== '';
    }), 'message_id');
    messageIdOptionList.value = unique_list.map((p: any) => ({
      value: String(p.message_id),
      label: `${p.name || p.message_id}`
    }));
  } finally {
    loadingMessageIdOptions.value = false;
  }
}

/**
 * 处理 message_id 变化
 * @param {string} message_id - 报文 ID
 * @returns {Promise<void>}
 */
async function handleMessageIdChange(message_id: string) {
  addPacketForm.value.message_id = message_id;
  addPacketForm.value.packet_id = undefined;
  versionOptionList.value = [];
  const mid = String(message_id || '').trim();
  if (!mid) return;

  try {
    const res = await getMessageVersionList(mid);
    if (res?.status !== 'success') return;
    const list = Array.isArray(res.datum) ? res.datum : (Array.isArray(res.datum?.list) ? res.datum.list : []);
    const publishedList = Array.isArray(list) ? list.filter((x: any) => x && x.publish_status === 1) : [];

    versionOptionList.value = publishedList.map((p: any) => ({
      value: Number(p.id),
      label: `v${p.version}（id=${p.id}）`
    }));

    // 默认选择最新版本
    let bestId: number | undefined = undefined;
    let bestVer = { major: -1, minor: -1 };
    for (const p of publishedList) {
      const ver = parseVersion(p.version);
      if (ver.major > bestVer.major || (ver.major === bestVer.major && ver.minor > bestVer.minor)) {
        bestVer = ver;
        bestId = Number(p.id);
      }
    }
    if (bestId && Number.isFinite(bestId)) {
      addPacketForm.value.packet_id = bestId;
    }
  } catch (error) {
    console.error('[PacketListPanel] 加载版本列表失败:', error);
  }
}

/**
 * 处理 packet_id 变化
 * @param {number | undefined} value - 报文 ID
 * @returns {void}
 */
function handlePacketIdChange(value: number | undefined) {
  addPacketForm.value.packet_id = value;
}

/**
 * 处理方向变化
 * @param {'input' | 'output'} value - 方向
 * @returns {void}
 */
function handleDirectionChange(value: 'input' | 'output') {
  addPacketForm.value.direction = value;
}

/**
 * 处理通信 Message ID 变化（TCP/UDP）
 * @param {string} value - Message ID
 * @returns {void}
 */
function handleCommMessageIdChange(value: string) {
  addPacketForm.value.comm_message_id = value;
}

/**
 * 处理 Topic 名称变化（DDS）
 * @param {string} value - Topic 名称
 * @returns {void}
 */
function handleTopicNameChange(value: string) {
  addPacketForm.value.topic_name = value;
}

/**
 * 处理可靠性变化（DDS）
 * @param {'best_effort' | 'reliable'} value - 可靠性级别
 * @returns {void}
 */
function handleReliabilityChange(value: 'best_effort' | 'reliable') {
  addPacketForm.value.reliability = value;
}

/**
 * 处理持久性变化（DDS）
 * @param {'volatile' | 'transient_local'} value - 持久性级别
 * @returns {void}
 */
function handleDurabilityChange(value: 'volatile' | 'transient_local') {
  addPacketForm.value.durability = value;
}

/**
 * 确认关联报文
 * @returns {Promise<void>}
 */
async function confirmAddPacket() {
  const packet_id = typeof addPacketForm.value.packet_id === 'number'
    ? addPacketForm.value.packet_id
    : Number(addPacketForm.value.packet_id);

  if (!Number.isFinite(packet_id) || packet_id <= 0) {
    ElMessage.warning('请选择具体版本（packet_id）');
    return;
  }

  if (saving.value) {
    return;
  }

  const direction = addPacketForm.value.direction === 'output' ? 'output' : 'input';

  // 构建扩展配置（用于后续保存到 packet_ref_list）
  const extendedConfig: Record<string, any> = {};
  if (interfaceConnectionType.value === 'TCP' || interfaceConnectionType.value === 'UDP') {
    if (addPacketForm.value.comm_message_id) {
      extendedConfig.message_id = addPacketForm.value.comm_message_id;
    }
  } else if (interfaceConnectionType.value === 'DDS') {
    if (addPacketForm.value.topic_name) {
      extendedConfig.topic_name = addPacketForm.value.topic_name;
    }
    extendedConfig.reliability = addPacketForm.value.reliability;
    extendedConfig.durability = addPacketForm.value.durability;
  }

  saving.value = true;
  try {
    const res = await communicationNodeApi.createPacketRef(systemNodeId.value, interfaceId.value, packet_id, direction);
    if (res.status === 'success') {
      // createPacketRef 只保证 packet_id/direction 落库；扩展字段通过 update-endpoints 写入 endpoint_description
      let extendedSaved = true;
      if (Object.keys(extendedConfig).length > 0) {
        try {
          const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
          if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
            throw new Error(ensureRes.message || '获取节点接口容器失败');
          }

          const container = ensureRes.datum as any;
          const containerId = String(container.id);
          const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];
          const endpointIndex = endpointList.findIndex((e: any) => String(e?.interface_id || '').trim() === String(interfaceId.value));
          if (endpointIndex < 0) {
            throw new Error('接口未找到，无法保存配置');
          }

          const endpoint = endpointList[endpointIndex] as any;
          const packetRefList = Array.isArray(endpoint?.packet_ref_list) ? endpoint.packet_ref_list : [];
          const packetRefIndex = packetRefList.findIndex((r: any) => Number(r?.packet_id) === Number(packet_id));
          if (packetRefIndex < 0) {
            throw new Error('报文关联未找到，无法保存配置');
          }

          const oldRef = packetRefList[packetRefIndex] || {};
          const newRef = { ...oldRef, ...extendedConfig };
          const newPacketRefList = [...packetRefList];
          newPacketRefList.splice(packetRefIndex, 1, newRef);

          const newEndpoint = { ...endpoint, packet_ref_list: newPacketRefList };
          const newEndpointList = [...endpointList];
          newEndpointList.splice(endpointIndex, 1, newEndpoint);

          const updateRes = await communicationNodeApi.updateEndpoints(containerId, newEndpointList);
          if (updateRes.status !== 'success') {
            throw new Error(updateRes.message || '保存配置失败');
          }
        } catch (e) {
          extendedSaved = false;
          console.warn('[PacketListPanel] 添加报文：扩展配置保存失败（不影响关联）', e);
        }
      }

      // 关闭弹窗
      addPacketDialogVisible.value = false;
      // 刷新列表
      await loadPacketList();
      // 更新 URL 选中新添加的报文
      router.replace({
        path: route.path,
        query: {
          ...route.query,
          protocolAlgorithmId: String(packet_id)
        }
      });
      if (extendedSaved) {
        ElMessage.success('报文已关联到接口');
      } else {
        ElMessage.warning('报文已关联，但配置保存失败（可右键编辑配置再次保存）');
      }
    } else {
      ElMessage.error(res.message || '添加失败');
    }
  } catch (error) {
    console.error('[PacketListPanel] 添加失败:', error);
    ElMessage.error('添加失败，请重试');
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
