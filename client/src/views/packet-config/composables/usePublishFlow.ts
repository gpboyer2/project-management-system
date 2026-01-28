import { ref, nextTick, type Ref } from 'vue';
import { ElMessageBox, ElMessage, type MessageBoxOptions } from 'element-plus';
import type { Packet } from '@/stores/packet-config';
import {
  postMessageDraftPublish,
  deleteMessageDraft,
  getMessageVersionList,
} from '@/api/messageManagement';

interface UsePublishFlowOptions {
  currentPacket: Ref<Packet | null>;
  isViewMode: Ref<boolean>;
  hasUnsavedChanges: Ref<boolean>;
  onSaveAndPublish?: () => Promise<void>;
  onPublishSuccess?: (version: string, id: string) => void;
}

export function usePublishFlow(options: UsePublishFlowOptions) {
  const { currentPacket, isViewMode, hasUnsavedChanges, onSaveAndPublish, onPublishSuccess } = options;

  const publishDialogVisible = ref(false);
  const publishActiveTab = ref<'text' | 'topology'>('text');
  const publishCurrentView = ref<'l0' | 'l2'>('l0');
  const publishAffectedNodeList = ref<string[]>([]);

  const currentVersion = ref('0.0');
  const nextVersion = ref('1.0');

  function calcNextPublishVersion(version: string): string {
    const match = String(version || '').trim().match(/^(\d+)\.0$/);
    if (!match) return '1.0';
    const major = parseInt(match[1], 10);
    if (Number.isNaN(major)) return '1.0';
    return `${major + 1}.0`;
  }

  async function refreshPublishVersionInfo() {
    if (!currentPacket.value?.message_id) {
      currentVersion.value = '0.0';
      nextVersion.value = '1.0';
      return;
    }
    try {
      const res = await getMessageVersionList(String(currentPacket.value.message_id));
      if (res?.status === 'success' && Array.isArray(res.datum) && res.datum.length > 0) {
        const latest = res.datum[0]?.version || '0.0';
        currentVersion.value = latest;
        nextVersion.value = calcNextPublishVersion(latest);
        return;
      }
    } catch (e) {
      // 版本信息获取失败时降级为默认值
    }
    currentVersion.value = '0.0';
    nextVersion.value = '1.0';
  }

  async function handlePublish() {
    if (!currentPacket.value || !currentPacket.value.id) {
      ElMessage.warning('请先保存报文');
      return;
    }
    if (isViewMode.value) {
      ElMessage.warning('已发布版本为只读，请创建修订草稿后再发布');
      return;
    }

    if (hasUnsavedChanges.value) {
      const confirmOptions: MessageBoxOptions = {
        confirmButtonText: '保存并发布',
        cancelButtonText: '取消',
        type: 'warning',
      };

      if (onSaveAndPublish) {
        try {
          await ElMessageBox.confirm('当前有未保存的更改，发布前需要保存，是否保存？', '提示', confirmOptions);
          await onSaveAndPublish();
        } catch {
          return;
        }
      }
    }

    await refreshPublishVersionInfo();
    publishDialogVisible.value = true;
    publishActiveTab.value = 'text';
    publishCurrentView.value = 'l0';
    publishAffectedNodeList.value = ['sys_car', 'sys_cloud'];

    nextTick(() => {
      setTimeout(() => {
        // 渲染发布边界的逻辑在主组件中
      }, 100);
    });
  }

  async function confirmPublish() {
    if (!currentPacket.value?.id) return;
    try {
      const res = await postMessageDraftPublish(currentPacket.value.id);
      if (res?.status !== 'success' || !res.datum?.version) {
        throw new Error(res?.message || '发布失败');
      }

      currentVersion.value = res.datum.version;
      nextVersion.value = calcNextPublishVersion(res.datum.version);

      publishDialogVisible.value = false;
      ElMessage.success(`发布成功，当前版本: ${res.datum.version}`);

      const publishedId = res.datum.id;
      onPublishSuccess?.(res.datum.version, publishedId);
    } catch (e: any) {
      ElMessage.error(e?.message || '发布失败');
    }
  }

  async function handleDiscardDraft(router: any, basePath: string = '/packet-config') {
    if (!currentPacket.value?.id) return;

    if (hasUnsavedChanges.value) {
      try {
        await ElMessageBox.confirm(
          '当前有未保存的更改，放弃草稿将丢失这些更改，是否继续？',
          '提示',
          {
            confirmButtonText: '放弃草稿',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return;
      }
    }

    try {
      const res = await deleteMessageDraft(currentPacket.value.id);
      if (res?.status !== 'success') {
        throw new Error(res?.message || '放弃草稿失败');
      }

      ElMessage.success('草稿已放弃');

      const message_id = String(currentPacket.value?.message_id || '').trim();
      if (message_id) {
        const versionRes = await getMessageVersionList(message_id);
        if (versionRes?.status === 'success' && Array.isArray(versionRes.datum) && versionRes.datum.length > 0) {
          const publishedId = versionRes.datum[0].id;
          await router.replace({
            path: basePath,
            query: { mode: 'view', id: String(publishedId) }
          });
          return;
        }
      }

      await router.replace({ path: basePath });
    } catch (e: any) {
      ElMessage.error(e?.message || '放弃草稿失败');
    }
  }

  return {
    publishDialogVisible,
    publishActiveTab,
    publishCurrentView,
    publishAffectedNodeList,
    currentVersion,
    nextVersion,
    calcNextPublishVersion,
    refreshPublishVersionInfo,
    handlePublish,
    confirmPublish,
    handleDiscardDraft,
  };
}

export type PublishFlowReturn = ReturnType<typeof usePublishFlow>;
