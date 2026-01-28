/**
 *
 * 接口报文引用管理 composable
 * 处理节点接口视图中的报文引用列表加载、添加、删除、升级等操作
 *
 */
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { communicationNodeApi } from '@/api/communicationNode';
import { getMessagePublishedDetail } from '@/api/messageManagement';
import type { PacketData } from '../types';
import { normalizeNumberedList } from '@/utils';
import { resolve_numeric_id } from '@/utils/validationUtils';

export interface CompOptions {
  // interfaceInfo 相关
  interfaceId?: string;
  interfaceName?: string;
  nodeId?: string;

  // sourceContext 相关
  protocolId?: string;
  packetId?: string;
  sourceType?: 'hierarchy' | 'protocol';
  sourceId?: string;

  // EditorOptions 相关
  showPacketList?: boolean;
  selectedPacketId?: string;
  packetData?: PacketData;
  preloadedPackets?: Array<{
    id: number;
    name: string;
    message_id: string;
    version: string;
    direction: 'input' | 'output';
    fields: any[];
  }>;
  readonly?: boolean;
}

export function useInterfacePacketRefs(
  props: CompOptions
) {
  // 可编辑的引用列表
  const packetRefListLocal = ref<Array<{ packet_id: number; direction: 'input' | 'output' }>>([]);
  const loadingPacketRefs = ref(false);
  const initialLoadDone = ref(false);

  // 当前列表展示数据（不做缓存复用，每次按需调接口刷新）
  const packetList = ref<PacketData[]>([]);

  async function reloadPacketListFromRefs(): Promise<void> {
    if (!props.showPacketList) {
      packetList.value = [];
      return;
    }

    const refList = Array.isArray(packetRefListLocal.value) ? packetRefListLocal.value : [];
    if (refList.length === 0) {
      packetList.value = [];
      return;
    }

    const result = await Promise.all(refList.map(async (r) => {
      try {
        const res = await getMessagePublishedDetail(r.packet_id);
        if (res?.status === 'success' && res.datum?.id) {
          const loaded: any = res.datum;
          loaded.fields = Array.isArray(loaded.fields) ? loaded.fields : [];
          return { ...(loaded as PacketData), direction: r.direction };
        }
      } catch (e) {
        // ignore
      }
      return {
        id: r.packet_id,
        name: `报文#${r.packet_id}`,
        direction: r.direction,
        fields: [],
      } as PacketData;
    }));

    packetList.value = result;
  }

  /**
   * 从后端加载接口的报文引用列表
   */
  async function loadInterfacePacketRefs(): Promise<void> {
    if (!props.showPacketList) return;
    if (!props.nodeId || !props.interfaceId) return;

    initialLoadDone.value = false;

    // 优先使用预加载数据
    if (props.preloadedPackets && props.preloadedPackets.length > 0) {
      loadingPacketRefs.value = true;
      try {
        const refList: Array<{ packet_id: number; direction: 'input' | 'output' }> = [];
        for (const packet of props.preloadedPackets) {
          const id = typeof packet.id === 'number' ? packet.id : Number(packet.id);
          if (Number.isFinite(id) && id > 0) {
            refList.push({
              packet_id: id,
              direction: packet.direction || 'input'
            });
          }
        }
        packetRefListLocal.value = refList;
        await reloadPacketListFromRefs();
      } catch (error) {
        console.error('[InterfaceEditor] 使用预加载数据失败:', error);
      } finally {
        loadingPacketRefs.value = false;
        initialLoadDone.value = true;
      }
      return;
    }

    // 从后端加载
    try {
      loadingPacketRefs.value = true;

      const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(props.nodeId);
      if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
        throw new Error(ensureRes.message || '获取节点接口容器失败');
      }

      const container = ensureRes.datum as any;
      const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];

      const endpoint = endpointList.find((e: any) => String(e?.interface_id || '').trim() === String(props.interfaceId));

      if (endpoint && endpoint.packet_ref_list) {
        packetRefListLocal.value = normalizeNumberedList<{ packet_id: number; direction: 'input' | 'output' }>(
          endpoint.packet_ref_list,
          'packet_id',
          'input'
        );
      } else {
        packetRefListLocal.value = [];
      }
      await reloadPacketListFromRefs();
    } catch (error) {
      console.error('[InterfaceEditor] 加载报文引用列表失败:', error);
      ElMessage.error('加载报文列表失败');
      packetRefListLocal.value = [];
      packetList.value = [];
    } finally {
      loadingPacketRefs.value = false;
      initialLoadDone.value = true;
    }
  }

  /**
   * 回写 packet_ref_list 到后端
   */
  async function savePacketRefListToBackend(): Promise<void> {
    if (!props.nodeId) {
      ElMessage.warning('缺少节点ID，无法保存');
      return;
    }
    if (!props.interfaceId) {
      ElMessage.warning('缺少接口ID，无法保存');
      return;
    }

    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(props.nodeId);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '确保节点接口容器失败');
    }

    const container = ensureRes.datum as any;
    const containerId = String(container.id);
    const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];
    let idx = endpointList.findIndex((e: any) => String(e?.interface_id || '').trim() === String(props.interfaceId));

    // 如果找不到接口配置，自动创建一个默认接口
    if (idx < 0) {
      const newEndpoint = {
        interface_id: String(props.interfaceId),
        name: `接口_${props.interfaceId}`,
        type: 'TCP Server',
        packet_ref_list: []
      };
      endpointList.push(newEndpoint);
      idx = endpointList.length - 1;
    }

    const newEndpoint = Object.assign({}, endpointList[idx], {
      packet_ref_list: packetRefListLocal.value.map((r) => ({ packet_id: r.packet_id, direction: r.direction }))
    });
    const newEndpointList = [...endpointList];
    newEndpointList.splice(idx, 1, newEndpoint);

    const updateRes = await communicationNodeApi.updateEndpoints(containerId, newEndpointList);
    if (updateRes.status !== 'success') {
      throw new Error(updateRes.message || '保存报文关联失败');
    }
  }

  // 监听引用列表变化，按需刷新列表（不缓存）
  watch(
    () => packetRefListLocal.value,
    async () => {
      await reloadPacketListFromRefs();
    },
    { immediate: true, deep: true }
  );

  // 获取报文方向文本
  function getPacketDirectionText(packet: PacketData): string {
    const resolved_id = resolve_numeric_id(packet.id);
    if (!resolved_id) return '';
    const ref = packetRefListLocal.value.find((r) => r.packet_id === Number(resolved_id));
    if (!ref) return '';
    return ref.direction === 'output' ? '发送' : '接收';
  }

  return {
    packetRefListLocal,
    loadingPacketRefs,
    initialLoadDone,
    packetList,
    loadInterfacePacketRefs,
    savePacketRefListToBackend,
    getPacketDirectionText,
  };
}
