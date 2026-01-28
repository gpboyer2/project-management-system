/**
 *
 * 接口版本控制 composable
 * 处理版本过期检测、版本差异对比、版本历史等功能
 *
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getMessageVersionList, getMessagePublishedDetail } from '@/api/messageManagement';
import { parseVersion } from '@/utils';
import type { PacketData, PacketField } from '../types';

export function useInterfaceVersionControl() {
  // 当前报文对应的最新已发布版本信息（不做跨报文缓存）
  const latestPublishedInfo = ref<{ message_id: string; id: number; version: string } | null>(null);

  // 版本差异对话框状态
  const versionDiffDialogVisible = ref(false);
  const versionDiffDialogData = ref<{
    meta: {
      packetName: string
      appName: string
      role: 'Pub' | 'Sub'
    }
    local: {
      version: string
      fieldList: PacketField[]
    }
    latest: {
      version: string
      fieldList: PacketField[]
    }
  }>({
    meta: {
      packetName: '',
      appName: '',
      role: 'Pub'
    },
    local: {
      version: '',
      fieldList: []
    },
    latest: {
      version: '',
      fieldList: []
    }
  });

  // 版本历史对话框状态
  const versionHistoryDialogVisible = ref(false);

  /**
   * 加载最新已发布版本信息（不使用缓存）
   */
  async function loadLatestPublishedInfo(message_id: string): Promise<{ id: number; version: string } | null> {
    const key = String(message_id || '').trim();
    if (!key) {
      latestPublishedInfo.value = null;
      return null;
    }

    const res = await getMessageVersionList(key);
    if (res?.status !== 'success') {
      latestPublishedInfo.value = null;
      return null;
    }

    const list = Array.isArray(res.datum) ? res.datum : (Array.isArray((res.datum as any)?.list) ? (res.datum as any).list : []);
    const publishedList = Array.isArray(list) ? list.filter((x: any) => x && x.publish_status === 1) : [];
    if (publishedList.length === 0) {
      latestPublishedInfo.value = null;
      return null;
    }

    publishedList.sort((a: any, b: any) => {
      const verA = parseVersion(a.version);
      const verB = parseVersion(b.version);
      if (verB.major !== verA.major) return verB.major - verA.major;
      if (verB.minor !== verA.minor) return verB.minor - verA.minor;
      return Number(b.published_at || 0) - Number(a.published_at || 0);
    });

    const latest = publishedList[0];
    const id = Number(latest.id);
    if (!Number.isFinite(id) || id <= 0) {
      latestPublishedInfo.value = null;
      return null;
    }

    const version = String(latest.version || '').trim();
    latestPublishedInfo.value = { message_id: key, id, version };
    return { id, version };
  }

  /**
   * 判断报文是否过期
   */
  function isPacketOutdated(packet: PacketData | null, showPacketList: boolean): boolean {
    if (!showPacketList) return false;
    if (!packet) return false;
    const message_id = String((packet as any)?.message_id || '').trim();
    if (!message_id) return false;
    if (!latestPublishedInfo.value || latestPublishedInfo.value.message_id !== message_id) return false;
    const current_id = typeof (packet as any).id === 'number' ? (packet as any).id : Number((packet as any).id);
    if (!Number.isFinite(current_id) || current_id <= 0) return false;
    return latestPublishedInfo.value.id !== current_id;
  }

  /**
   * 查看版本差异
   */
  async function handleViewVersionDiff(
    activePacket: PacketData | null,
    showPacketList: boolean,
    interfaceName: string,
    direction: 'input' | 'output' | undefined,
    _publishedPacketCache?: Record<string, PacketData>
  ) {
    if (!showPacketList) return;
    if (!activePacket) return;

    const message_id = String((activePacket as any)?.message_id || '').trim();
    if (!message_id) {
      ElMessage.warning('缺少 message_id，无法获取版本信息');
      return;
    }

    const latest = await loadLatestPublishedInfo(message_id);
    if (!latest || !latest.id) {
      ElMessage.warning('未获取到最新已发布版本');
      return;
    }

    const latestRes = await getMessagePublishedDetail(latest.id);
    if (latestRes?.status !== 'success' || !latestRes.datum?.id) {
      ElMessage.warning('加载最新版本详情失败');
      return;
    }
    const latestPacket = latestRes.datum as PacketData;
    latestPacket.fields = Array.isArray(latestPacket.fields) ? latestPacket.fields : [];

    const role = direction === 'output' ? 'Pub' : 'Sub';

    versionDiffDialogData.value = {
      meta: {
        packetName: String(activePacket.name || ''),
        appName: interfaceName || '',
        role: role
      },
      local: {
        version: String((activePacket as any)?.version || ''),
        fieldList: Array.isArray(activePacket.fields) ? activePacket.fields : []
      },
      latest: {
        version: latest.version,
        fieldList: Array.isArray(latestPacket.fields) ? latestPacket.fields : []
      }
    };

    versionDiffDialogVisible.value = true;
  }

  return {
    latestPublishedInfo,
    versionDiffDialogVisible,
    versionDiffDialogData,
    versionHistoryDialogVisible,
    loadLatestPublishedInfo,
    isPacketOutdated,
    handleViewVersionDiff,
  };
}
