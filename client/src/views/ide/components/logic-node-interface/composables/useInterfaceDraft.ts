/**
 * 接口草稿管理 composable
 * 处理草稿保存、发布、放弃、创建修订、继续草稿等功能
 */
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  postMessageDraftCreate,
  putMessageDraftUpdate,
  getMessageDraftDetail,
  postMessageDraftEnsure,
  postMessageDraftPublish,
  deleteMessageDraft,
  checkMessageDraft
} from '@/api/messageManagement';
import { hasDataChanged } from '@/utils/dataUtils';
import { build_packet_for_save, convert_loaded_data_to_ui_format } from '@/utils/fieldUtils';
import type { PacketData } from '../types';

export function useInterfaceDraft() {
  const is_saving = ref(false);
  const is_publishing = ref(false);
  const last_saved_snapshot = ref<string>('');

  // 检测是否有对应的草稿
  const has_existing_draft = ref(false);
  let last_checked_message_id = '';

  /**
   * 检查是否有草稿
   * @param {string} message_id - 报文ID
   * @param {boolean} is_published_backend_packet - 是否为已发布的后端报文
   * @returns {Promise<void>} 无返回值
   */
  async function checkDraft(message_id: string, is_published_backend_packet: boolean): Promise<void> {
    if (!message_id || !is_published_backend_packet) {
      has_existing_draft.value = false;
      last_checked_message_id = '';
      return;
    }
    const message_id_str = String(message_id);
    if (message_id_str === last_checked_message_id) {
      return;
    }
    last_checked_message_id = message_id_str;

    try {
      const draftCheckRes = await checkMessageDraft(message_id_str);
      has_existing_draft.value = draftCheckRes?.status === 'success' && draftCheckRes.datum?.hasDraft;
    } catch (error) {
      has_existing_draft.value = false;
    }
  }

  /**
   * 保存报文到后端
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @param {boolean} is_backend_message - 是否为后端报文
   * @param {boolean} is_draft_backend_packet - 是否为草稿状态的后端报文
   * @param {boolean} _isViewingHistoryVersion - 是否正在查看历史版本（未使用）
   * @param {boolean} _readonly - 是否为只读模式（未使用）
   * @returns {Promise<{ success: boolean; message?: string }>} 保存结果，包含成功标识和消息
   */
  async function savePacket(
    activePacket: PacketData | null,
    is_backend_message: boolean,
    is_draft_backend_packet: boolean,
    _isViewingHistoryVersion: boolean,
    _readonly: boolean
  ): Promise<{ success: boolean; message?: string }> {
    // 如果不是后端报文，返回false由调用方处理
    if (!is_backend_message) {
      return { success: false };
    }

    if (!activePacket) {
      ElMessage.warning('暂无可保存的报文数据');
      return { success: false };
    }
    if (is_saving.value) return { success: false };

    const name = String(activePacket.name || '').trim();
    if (!name) {
      ElMessage.warning('报文名称不能为空');
      return { success: false };
    }

    is_saving.value = true;
    try {
      const packet = activePacket as any;

      // 双重检查：确保 packet 不为 null（防御性编程）
      if (!packet || !packet.id) {
        ElMessage.warning('报文数据异常，缺少必要标识');
        return { success: false };
      }

      const id_number = typeof packet.id === 'number' ? packet.id : Number(packet.id);
      const payload = build_packet_for_save(packet);

      if (!id_number || id_number <= 0) {
        // 新建：创建草稿
        const createdRes = await postMessageDraftCreate(payload as any);
        if (createdRes?.status !== 'success' || !createdRes.datum?.id) {
          throw new Error(createdRes?.message || '创建草稿失败');
        }
        const created = createdRes.datum;
        if (created.fields && Array.isArray(created.fields)) {
          created.fields = convert_loaded_data_to_ui_format(created.fields);
        }
        Object.assign(packet, created as any);
        last_saved_snapshot.value = JSON.stringify(packet);
        return { success: true, message: '保存草稿成功', updatedPacket: created };
      } else {
        // 已存在：已发布版本不可直接保存
        if (!is_draft_backend_packet) {
          ElMessage.warning('已发布版本不可直接保存，请先创建修订草稿');
          return { success: false };
        }

        const updateRes = await putMessageDraftUpdate(id_number, payload);
        if (updateRes?.status !== 'success') {
          throw new Error(updateRes?.message || '保存草稿失败');
        }

        const reloadedRes = await getMessageDraftDetail(id_number);
        if (reloadedRes?.status !== 'success' || !reloadedRes.datum?.id) {
          throw new Error(reloadedRes?.message || '重新加载草稿失败');
        }
        const reloaded = reloadedRes.datum;
        if (reloaded.fields && Array.isArray(reloaded.fields)) {
          reloaded.fields = convert_loaded_data_to_ui_format(reloaded.fields);
        }
        Object.assign(packet, reloaded as any);
        last_saved_snapshot.value = JSON.stringify(packet);
        return { success: true, message: '保存草稿成功', updatedPacket: reloaded };
      }
    } catch (error: any) {
      ElMessage.error({ message: error?.message || '保存失败', plain: true });
      return { success: false };
    } finally {
      is_saving.value = false;
    }
  }

  /**
   * 发布报文
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @param {boolean} has_unsaved_changes - 是否有未保存的更改
   * @param {boolean} is_backend_message - 是否为后端报文
   * @param {boolean} is_draft_backend_packet - 是否为草稿状态的后端报文
   * @param {() => Promise<void>} saveCallback - 保存回调函数
   * @returns {Promise<{ success: boolean; message?: string; updatedPacket?: any }>} 发布结果，包含成功标识、消息和更新后的报文数据
   */
  async function publishPacket(
    activePacket: PacketData | null,
    has_unsaved_changes: boolean,
    is_backend_message: boolean,
    is_draft_backend_packet: boolean,
    saveCallback: () => Promise<void>
  ): Promise<{ success: boolean; message?: string; updatedPacket?: any }> {
    if (!activePacket) {
      ElMessage.warning('暂无可发布的报文数据');
      return { success: false };
    }
    if (!is_backend_message) {
      ElMessage.warning('当前报文不支持发布');
      return { success: false };
    }
    if (is_publishing.value) return { success: false };

    const packet = activePacket as any;
    const resolved_id = resolve_numeric_id(packet.id);
    if (!resolved_id) {
      ElMessage.warning('请先保存报文后再发布');
      return { success: false };
    }
    if (!is_draft_backend_packet) {
      ElMessage.warning('已发布版本不可再次发布，请先创建修订草稿');
      return { success: false };
    }

    is_publishing.value = true;
    try {
      // 如果有未保存的更改，先确认并保存
      if (has_unsaved_changes) {
        await ElMessageBox.confirm('当前有未保存的更改，发布前需要保存，是否保存并发布？', '提示', {
          confirmButtonText: '保存并发布',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await saveCallback();
      }

      const draft_id = typeof packet.id === 'number' ? packet.id : Number(packet.id);
      const publishRes = await postMessageDraftPublish(draft_id);
      if (publishRes?.status !== 'success' || !publishRes.datum?.version) {
        throw new Error(publishRes?.message || '发布失败');
      }
      const published = publishRes.datum;
      if (published.fields && Array.isArray(published.fields)) {
        published.fields = convert_loaded_data_to_ui_format(published.fields);
      }
      Object.assign(packet, published as any);
      last_saved_snapshot.value = JSON.stringify(activePacket);
      return { success: true, message: `发布成功，当前版本: ${publishRes.datum.version}`, updatedPacket: published };
    } catch (error: any) {
      const msg = error?.message;
      if (msg && typeof msg === 'string' && msg.includes('cancel')) return { success: false };
      ElMessage.error({ message: error?.message || '发布失败', plain: true });
      return { success: false };
    } finally {
      is_publishing.value = false;
    }
  }

  /**
   * 放弃草稿
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @param {boolean} is_backend_message - 是否为后端报文
   * @param {boolean} is_draft_backend_packet - 是否为草稿状态的后端报文
   * @param {() => Promise<void>} reloadCallback - 重新加载回调函数
   * @returns {Promise<{ success: boolean }>} 放弃结果，包含成功标识
   */
  async function discardDraft(
    activePacket: PacketData | null,
    is_backend_message: boolean,
    is_draft_backend_packet: boolean,
    reloadCallback: () => Promise<void>
  ): Promise<{ success: boolean }> {
    if (!activePacket) return { success: false };
    if (!is_backend_message) return { success: false };
    if (!is_draft_backend_packet) return { success: false };

    const packet = activePacket as any;
    const draft_id = typeof packet.id === 'number' ? packet.id : Number(packet.id);

    if (!Number.isFinite(draft_id) || draft_id <= 0) {
      ElMessage.warning('草稿数据异常');
      return { success: false };
    }

    try {
      const res = await deleteMessageDraft(draft_id);
      if (res?.status !== 'success') {
        throw new Error(res?.message || '放弃草稿失败');
      }

      ElMessage.success({ message: '草稿已放弃', plain: true });

      await reloadCallback();
      return { success: true };
    } catch (error: any) {
      ElMessage.error({ message: error?.message || '放弃草稿失败', plain: true });
      return { success: false };
    }
  }

  /**
   * 创建修订草稿
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @param {boolean} is_backend_message - 是否为后端报文
   * @param {boolean} is_published_backend_packet - 是否为已发布的后端报文
   * @param {boolean} isPacketOutdated - 当前报文是否为过时版本（历史版本）
   * @returns {Promise<{ success: boolean; updatedPacket?: any }>} 创建结果，包含成功标识和更新后的报文数据
   */
  async function createRevisionDraft(
    activePacket: PacketData | null,
    is_backend_message: boolean,
    is_published_backend_packet: boolean,
    isPacketOutdated: boolean
  ): Promise<{ success: boolean; updatedPacket?: any }> {
    if (!activePacket) return { success: false };
    if (!is_backend_message) return { success: false };
    if (!is_published_backend_packet) return { success: false };

    // 如果当前查看的是历史版本（非最新），提示用户将基于最新版本创建草稿
    if (isPacketOutdated) {
      try {
        await ElMessageBox.confirm(
          '当前查看的是历史版本，修订草稿将基于最新版本创建，是否继续？',
          '提示',
          {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning',
          }
        );
      } catch {
        return { success: false };
      }
    }

    try {
      is_saving.value = true;
      const packet = activePacket as any;
      const message_id = String(packet?.message_id || '').trim();
      if (!message_id) {
        throw new Error('缺少 message_id，无法创建修订草稿');
      }

      const ensureRes = await postMessageDraftEnsure({ message_id });
      if (ensureRes?.status !== 'success' || !ensureRes.datum?.id) {
        throw new Error(ensureRes?.message || '创建修订草稿失败');
      }

      const draft = ensureRes.datum;
      if (draft.fields && Array.isArray(draft.fields)) {
        draft.fields = convert_loaded_data_to_ui_format(draft.fields);
      }
      Object.assign(packet, draft as any);
      last_saved_snapshot.value = JSON.stringify(packet);
      ElMessage.success({ message: '已创建修订草稿', plain: true });
      return { success: true, updatedPacket: draft };
    } catch (e: any) {
      ElMessage.error({ message: e?.message || '创建修订草稿失败', plain: true });
      return { success: false };
    } finally {
      is_saving.value = false;
    }
  }

  /**
   * 继续修订草稿
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @param {boolean} is_backend_message - 是否为后端报文
   * @returns {Promise<{ success: boolean; updatedPacket?: any }>} 加载结果，包含成功标识和更新后的报文数据
   */
  async function continueDraft(
    activePacket: PacketData | null,
    is_backend_message: boolean
  ): Promise<{ success: boolean; updatedPacket?: any }> {
    if (!activePacket) return { success: false };
    if (!is_backend_message) return { success: false };

    try {
      is_saving.value = true;
      const packet = activePacket as any;
      const message_id = String(packet?.message_id || '').trim();

      if (!message_id) {
        ElMessage.warning('无法获取报文标识');
        return { success: false };
      }

      const draftCheckRes = await checkMessageDraft(message_id);
      if (draftCheckRes?.status !== 'success' || !draftCheckRes.datum?.hasDraft) {
        ElMessage.warning('草稿不存在');
        return { success: false };
      }

      const draft_id = draftCheckRes.datum.draft.id;
      const draftRes = await getMessageDraftDetail(draft_id);
      if (draftRes?.status !== 'success' || !draftRes.datum?.id) {
        throw new Error(draftRes?.message || '加载草稿失败');
      }

      const draft = draftRes.datum;
      if (draft.fields && Array.isArray(draft.fields)) {
        draft.fields = convert_loaded_data_to_ui_format(draft.fields);
      }
      Object.assign(packet, draft as any);
      last_saved_snapshot.value = JSON.stringify(packet);
      ElMessage.success({ message: '已加载草稿', plain: true });
      return { success: true, updatedPacket: draft };
    } catch (e: any) {
      ElMessage.error({ message: e?.message || '加载草稿失败', plain: true });
      return { success: false };
    } finally {
      is_saving.value = false;
    }
  }

  /**
   * 判断是否有未保存的更改
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @returns {boolean} 是否有未保存的更改
   */
  function hasUnsavedChanges(activePacket: PacketData | null): boolean {
    return hasDataChanged(activePacket, last_saved_snapshot.value);
  }

  /**
   * 更新快照
   * @param {PacketData | null} activePacket - 当前激活的报文数据
   * @returns {void} 无返回值
   */
  function updateSnapshot(activePacket: PacketData | null) {
    if (!activePacket) {
      last_saved_snapshot.value = '';
      return;
    }
    last_saved_snapshot.value = JSON.stringify(activePacket);
  }

  return {
    is_saving,
    is_publishing,
    has_existing_draft,
    hasUnsavedChanges,
    updateSnapshot,
    checkDraft,
    savePacket,
    publishPacket,
    discardDraft,
    createRevisionDraft,
    continueDraft,
  };
}
