<!--
  通信接口 Tab
  显示节点的通信接口列表，支持添加、配置、删除接口
-->
<template>
  <div class="ide-interface-list">
    <div class="ide-interface-header">
      <h3 class="ide-interface-title">
        接口列表
      </h3>

      <button class="ide-interface-add-btn" @click="handleAddInterface">
        <el-icon><Plus /></el-icon>
        新建接口
      </button>
    </div>

    <div v-if="interfaceList.length > 0" class="ide-interface-items">
      <div
        v-for="iface in interfaceList"
        :key="iface.id"
        class="ide-interface-card"
      >
        <div class="ide-interface-card-left">
          <div
            class="ide-interface-icon"
            :class="getInterfaceIconClass(iface.category)"
          >
            <component :is="getInterfaceIconName(iface.category)" />
          </div>

          <div class="ide-interface-info">
            <div class="ide-interface-name-row">
              <h4 class="ide-interface-name">
                {{ iface.name }}
              </h4>

              <span :class="['ide-interface-direction-badge', `ide-interface-direction-badge--${iface.role}`]">
                {{ iface.role === 'input' ? '接收' : '发送' }}
              </span>
            </div>

            <p class="ide-interface-detail">
              {{ iface.type }} • {{ iface.detail }}
            </p>
          </div>
        </div>

        <div class="ide-interface-card-right">
          <div class="ide-interface-actions">
            <el-tooltip content="配置物理连接 (IP/端口/协议)" placement="top" :show-after="500">
              <button class="ide-interface-config-btn btn-secondary" @click="handleConfigConnection(iface)">
                <el-icon><Setting /></el-icon>
                配置
              </button>
            </el-tooltip>

            <el-tooltip content="配置报文协议与字段" placement="top" :show-after="500">
              <button class="ide-interface-config-btn btn-primary" @click="handleConfigPackets(iface)">
                <el-icon><Files /></el-icon>
                报文（{{ iface.packetCount || 0 }}）
              </button>
            </el-tooltip>

            <el-tooltip content="删除接口" placement="top" :show-after="500">
              <button
                class="ide-interface-config-btn btn-danger"
                @click="handleDeleteInterface(iface)"
              >
                <el-icon><DeleteFilled /></el-icon>
                删除
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="ide-list-empty">
      <p>暂无通信接口配置</p>

      <button class="ide-interface-add-btn" @click="handleAddInterface">
        <el-icon><Plus /></el-icon>
        新建接口
      </button>
    </div>

    <ConnectionConfigDialog
      v-if="connectionDialog.visible"
      v-model:visible="connectionDialog.visible"
      :comp-options="{
        interfaceId: connectionDialog.interfaceId,
        interfaceName: connectionDialog.interfaceName,
        nodeId: nodeId
      }"
      @saved="handleConnectionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Setting, Files, DeleteFilled } from '@element-plus/icons-vue';
import ConnectionConfigDialog from '../../../shared-connection-dialog/index.vue';
import { communicationNodeApi, type CommunicationNode } from '@/api/communicationNode';
import { getMessagePublishedDetail } from '@/api/messageManagement';
import { convertNodeToInterfaceItem, type InterfaceItem } from '@/utils/dataAdapter';
import { getInterfaceIconClass, getInterfaceIconName } from '@/utils/iconUtils';

const router = useRouter();
const route = useRoute();

const nodeId = computed(() => {
  return route.query.systemNodeId as string || '';
});

const interfaceList = ref<InterfaceItem[]>([]);
const loadingInterfaceList = ref(false);
const nodeInterfaceContainer = ref<CommunicationNode | null>(null);

const connectionDialog = ref({
  visible: false,
  interfaceId: '',
  interfaceName: ''
});

/**
 * 加载接口列表
 * 从节点接口容器中获取所有通信接口，并解析每个接口的报文引用数量
 * @returns {Promise<void>} 无返回值
 */
async function loadInterfaceList() {
  const id = nodeId.value;
  if (!id) return;

  loadingInterfaceList.value = true;
  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(id);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '确保节点接口容器失败');
    }

    const response = await communicationNodeApi.getListByNodeId(id);
    if (response.status !== 'success') {
      throw new Error(response.message || '加载节点接口容器失败');
    }

    const container = Array.isArray(response.datum) && response.datum.length > 0 ? response.datum[0] : ensureRes.datum;
    nodeInterfaceContainer.value = container as any;

    const endpointList = Array.isArray((container as any)?.endpoint_description) ? (container as any).endpoint_description : [];
    const newInterfaceList: InterfaceItem[] = [];

    for (const endpoint of endpointList) {
      const interface_id = String(endpoint?.interface_id || '').trim();
      if (!interface_id) continue;

      const packet_ref_list = Array.isArray(endpoint?.packet_ref_list) ? endpoint.packet_ref_list : [];
      const fake_comm_node: any = {
        id: interface_id,
        name: String(endpoint?.name || '').trim() || interface_id,
        endpoint_description: [endpoint]
      };
      const item = convertNodeToInterfaceItem(fake_comm_node);
      item.packetCount = packet_ref_list.length;
      item.raw = endpoint;
      newInterfaceList.push(item);
    }

    interfaceList.value = newInterfaceList;
  } catch (error) {
    console.error('加载接口列表失败:', error);
    interfaceList.value = [];
  } finally {
    loadingInterfaceList.value = false;
  }
}

/**
 * 打开连接配置对话框
 * @param {any} iface - 接口对象
 * @returns {void} 无返回值
 */
function handleConfigConnection(iface: any) {
  connectionDialog.value = {
    visible: true,
    interfaceId: iface.id,
    interfaceName: iface.name
  };
}

/**
 * 配置接口报文
 * 预加载接口的报文数据，然后跳转到报文配置页面
 * @param {any} iface - 接口对象
 * @returns {Promise<void>} 无返回值
 */
async function handleConfigPackets(iface: any) {
  const id = nodeId.value;
  if (!id) return;

  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(id);
    if (ensureRes.status !== 'success' || !ensureRes.datum) {
      throw new Error(ensureRes.message || '获取节点接口容器失败');
    }

    const container = ensureRes.datum as any;
    const endpointList = Array.isArray(container?.endpoint_description) ? container.endpoint_description : [];

    const endpoint = endpointList.find((e: any) => String(e?.interface_id || '').trim() === String(iface.id));
    const packetRefList = Array.isArray(endpoint?.packet_ref_list) ? endpoint.packet_ref_list : [];

    const packets: any[] = [];
    if (packetRefList.length > 0) {
      const promises = packetRefList.map(async (ref: any) => {
        const packet_id = typeof ref.packet_id === 'number' ? ref.packet_id : Number(ref.packet_id);
        if (!Number.isFinite(packet_id) || packet_id <= 0) return null;

        try {
          const res = await getMessagePublishedDetail(packet_id);
          if (res?.status === 'success' && res.datum) {
            return {
              id: res.datum.id,
              name: res.datum.name,
              message_id: res.datum.message_id,
              version: res.datum.version,
              direction: ref.direction === 'output' ? 'output' : 'input',
              fields: res.datum.fields || []
            };
          }
        } catch (e) {
          console.warn(`加载报文 ${packet_id} 失败:`, e);
        }
        return null;
      });

      const results = await Promise.all(promises);
      packets.push(...results.filter(p => p !== null));
    }

    router.push({
      path: '/editor/ide/logic',
      query: {
        systemNodeId: id,
        interfaceId: iface.id
      }
    });
  } catch (error) {
    console.error('预加载报文数据失败:', error);
    router.push({
      path: '/editor/ide/logic',
      query: {
        systemNodeId: id,
        interfaceId: iface.id
      }
    });
  }
}

/**
 * 连接配置保存后的回调
 * @returns {Promise<void>} 无返回值
 */
async function handleConnectionSaved() {
  await loadInterfaceList();
}

/**
 * 添加新接口
 * 打开连接配置对话框，创建新接口
 * @returns {void} 无返回值
 */
function handleAddInterface() {
  const id = nodeId.value;
  if (!id) {
    ElMessage.warning('请先选择节点');
    return;
  }

  connectionDialog.value = {
    visible: true,
    interfaceId: 'new',
    interfaceName: '新接口-' + Date.now().toString().slice(-6)
  };
}

/**
 * 删除接口
 * 从节点接口容器中移除指定接口，需要用户确认
 * @param {InterfaceItem} iface - 要删除的接口对象
 * @returns {Promise<void>} 无返回值
 */
async function handleDeleteInterface(iface: InterfaceItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除接口 "${iface.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    const container = nodeInterfaceContainer.value;
    if (!container?.id) {
      throw new Error('缺少节点接口容器，无法删除');
    }
    const endpointList = Array.isArray((container as any).endpoint_description) ? (container as any).endpoint_description : [];
    const newEndpointList = endpointList.filter((e: any) => String(e?.interface_id || '').trim() !== iface.id);

    const updateRes = await communicationNodeApi.updateEndpoints(String(container.id), newEndpointList);
    if (updateRes.status !== 'success') {
      throw new Error(updateRes.message || '接口删除失败');
    }

    ElMessage.success('接口删除成功');
    await loadInterfaceList();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除接口失败:', error);
      ElMessage.error(error.message || '删除接口失败');
    }
  }
}

onMounted(() => {
  loadInterfaceList();
});

watch(nodeId, () => {
  loadInterfaceList();
});
</script>

<style lang="scss" scoped>
@use '../../../index.scss' as *;
@use './index.scss' as *;
</style>
