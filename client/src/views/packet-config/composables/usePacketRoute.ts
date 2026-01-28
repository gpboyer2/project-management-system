import { ref, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { h } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import type { Packet } from '@/stores/packet-config';
import { useFieldTransform } from './useFieldTransform';
import {
  getMessageDraftDetail,
  getMessageDetail,
  postMessageDraftEnsure,
} from '@/api/messageManagement';

interface UsePacketRouteOptions {
  currentPacket: Ref<Packet | null>;
  hasUnsavedChanges: Ref<boolean>;
  lastSavedPacket: Ref<string>;
  onPacketLoaded?: () => void;
}

export function usePacketRoute(options: UsePacketRouteOptions) {
  const { currentPacket, hasUnsavedChanges, lastSavedPacket, onPacketLoaded } = options;
  const router = useRouter();

  const showDetailView = ref(false);
  const currentVersion = ref('0.0');
  const nextVersion = ref('1.0');

  const { convertLoadedDataToUIFormat } = useFieldTransform();

  function calcNextPublishVersion(version: string): string {
    const match = String(version || '').trim().match(/^(\d+)\.0$/);
    if (!match) return '1.0';
    const major = parseInt(match[1], 10);
    if (Number.isNaN(major)) return '1.0';
    return `${major + 1}.0`;
  }

  async function handleRouteChange(mode: string | undefined, id: string | undefined) {
    if (!mode) {
      showDetailView.value = false;
      currentPacket.value = null;
      return;
    }

    if (mode === 'add') {
      const newPacket: Packet = {
        id: 0,
        name: 'NewMessage',
        description: '',
        hierarchy_node_id: '',
        protocol: 'tcp',
        status: 1,
        version: undefined,
        default_byte_order: 'big',
        struct_alignment: 1,
        field_count: 0,
        updated_at: Date.now(),
        fields: [],
      };
      currentPacket.value = newPacket;
      currentVersion.value = '0.0';
      nextVersion.value = '1.0';
      lastSavedPacket.value = '';
      hasUnsavedChanges.value = false;
      showDetailView.value = true;
      onPacketLoaded?.();
      return;
    }

    if (!id) {
      showDetailView.value = false;
      currentPacket.value = null;
      return;
    }

    if (mode === 'view') {
      try {
        const pubRes = await getMessageDetail(id);
        if (pubRes?.status !== 'success' || !pubRes.datum) {
          router.replace({ path: '/packet-config' });
          return;
        }
        const datum = pubRes.datum as any;
        if (!Array.isArray(datum.fields)) {
          datum.fields = [];
        }
        if (datum.fields.length > 0) {
          datum.fields = convertLoadedDataToUIFormat(datum.fields);
        }
        currentPacket.value = datum as Packet;
        lastSavedPacket.value = JSON.stringify(currentPacket.value);
        hasUnsavedChanges.value = false;
        const v = String((datum as any).version || '').trim();
        currentVersion.value = v ? v : '0.0';
        nextVersion.value = calcNextPublishVersion(currentVersion.value);
      } catch (error) {
        router.replace({ path: '/packet-config' });
        return;
      }
      showDetailView.value = true;
      onPacketLoaded?.();
      return;
    }

    try {
      const draftRes = await getMessageDraftDetail(id);
      if (draftRes?.status === 'success' && draftRes.datum) {
        if (!Array.isArray(draftRes.datum.fields)) {
          draftRes.datum.fields = [];
        }
        if (draftRes.datum.fields.length > 0) {
          draftRes.datum.fields = convertLoadedDataToUIFormat(draftRes.datum.fields);
        }
        currentPacket.value = draftRes.datum as Packet;
        lastSavedPacket.value = JSON.stringify(currentPacket.value);
        hasUnsavedChanges.value = false;
        await refreshPublishVersionInfo();
      } else {
        try {
          await ElMessageBox.confirm(
            '该版本已发布不可直接修改，是否创建修订草稿？',
            '提示',
            {
              confirmButtonText: '创建修订草稿',
              cancelButtonText: '只读查看',
              type: 'warning',
              icon: h(WarningFilled, { style: { fontSize: '22px', color: '#faad14' } }),
            }
          );
        } catch {
          await router.replace({ path: '/packet-config', query: { mode: 'view', id } });
          return;
        }
        const pubRes = await getMessageDetail(id);
        const message_id = String(pubRes?.datum?.message_id || '').trim();
        if (pubRes?.status !== 'success' || !message_id) {
          router.replace({ path: '/packet-config' });
          return;
        }
        const ensureRes = await postMessageDraftEnsure({ message_id });
        if (ensureRes?.status !== 'success' || !ensureRes.datum?.id) {
          router.replace({ path: '/packet-config' });
          return;
        }
        await router.replace({ path: '/packet-config', query: { mode: 'edit', id: String(ensureRes.datum.id) } });
        return;
      }
    } catch (error) {
      router.replace({ path: '/packet-config' });
      return;
    }
    showDetailView.value = true;
    onPacketLoaded?.();
  }

  async function refreshPublishVersionInfo() {
    if (!currentPacket.value?.message_id) {
      currentVersion.value = '0.0';
      nextVersion.value = '1.0';
      return;
    }
    try {
      const { getMessageVersionList } = await import('@/api/messageManagement');
      const res = await getMessageVersionList(String(currentPacket.value.message_id));
      if (res?.status === 'success' && Array.isArray(res.datum) && res.datum.length > 0) {
        const latest = res.datum[0]?.version || '0.0';
        currentVersion.value = latest;
        nextVersion.value = calcNextPublishVersion(latest);
        return;
      }
    } catch (e) {
    }
    currentVersion.value = '0.0';
    nextVersion.value = '1.0';
  }

  async function createRevisionDraft() {
    try {
      const { postMessageDraftEnsure } = await import('@/api/messageManagement');
      const message_id = String(currentPacket.value?.message_id || '').trim();
      if (!message_id) {
        ElMessage.warning('缺少 message_id，无法创建修订草稿');
        return;
      }
      const ensureRes = await postMessageDraftEnsure({ message_id });
      if (ensureRes?.status !== 'success' || !ensureRes.datum?.id) {
        throw new Error(ensureRes?.message || '创建修订草稿失败');
      }
      await router.replace({
        path: '/packet-config',
        query: { mode: 'edit', id: String(ensureRes.datum.id) }
      });
    } catch (e: any) {
      ElMessage.error(e?.message || '创建修订草稿失败');
    }
  }

  return {
    showDetailView,
    currentVersion,
    nextVersion,
    handleRouteChange,
    refreshPublishVersionInfo,
    createRevisionDraft,
    calcNextPublishVersion,
  };
}

export type PacketRouteReturn = ReturnType<typeof usePacketRoute>;
