<!--
  版本历史弹窗 (Version History Dialog)
  用于展示报文的所有已发布版本，支持与当前版本对比
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="版本历史"
    width="700px"
    top="10vh"
    :close-on-click-modal="false"
    class="version-history-dialog"
    @closed="handleClosed"
  >
    <!-- 报文基本信息 -->
    <div class="version-header">
      <div class="version-header-item">
        <span class="version-label">
          报文名称:
        </span>

        <span class="version-value">
          {{ packetName }}
        </span>
      </div>
    </div>

    <!-- 版本列表 -->
    <div v-loading="loading" class="version-list">
      <div
        v-for="(version, index) in versionList"
        :key="version.id"
        class="version-item"
        :class="{
          'version-item--current': version.id === currentVersionId,
          'version-item--latest': index === 0
        }"
      >
        <div class="version-item-main">
          <div class="version-info">
            <span class="version-number">
              v{{ version.version }}
            </span>

            <el-tag
              v-if="index === 0"
              type="success"
              size="small"
              effect="plain"
              class="version-tag"
            >
              最新
            </el-tag>

            <el-tag
              v-if="version.id === currentVersionId"
              type="info"
              size="small"
              effect="plain"
              class="version-tag"
            >
              当前
            </el-tag>
          </div>

          <div class="version-meta">
            <span v-if="version.published_at" class="version-time">
              {{ dateUtils.format(version.published_at, 'YYYY-MM-DD HH:mm') }}
            </span>
          </div>
        </div>

        <div class="version-item-action">
          <el-button
            type="primary"
            size="small"
            :disabled="version.id === currentVersionId"
            @click.stop="handleCompareVersion(version)"
          >
            {{ version.id === currentVersionId ? '当前版本' : '对比' }}
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && versionList.length === 0" class="version-empty">
        <el-icon :size="UI_SIZE.ICON_SIZE_LARGE" color="#cbd5e1">
          <Document />
        </el-icon>

        <p>暂无历史版本</p>
      </div>
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="version-footer">
        <el-button @click="dialogVisible = false">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Document } from '@element-plus/icons-vue';
import { getMessageVersionList, getMessagePublishedDetail } from '@/api/messageManagement';
import { dateUtils, parseVersion } from '@/utils';
import { UI_SIZE } from '@/constants';

// 版本信息类型
interface VersionInfo {
  id: number
  version: string
  message_id?: string
  published_at?: number
  field_count?: number
  publish_status?: number
}

// Props
const props = defineProps<{
  visible: boolean
  packetName: string
  messageId?: string
  currentVersionId?: number
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', version: VersionInfo): void
  (e: 'compare', data: { selectedVersion: VersionInfo; selectedDetail: any }): void
}>();

const loading = ref(false);
const versionList = ref<VersionInfo[]>([]);

// 弹窗可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

/**
 * 加载版本列表
 * @returns {Promise<void>}
 */
async function loadVersions() {
  if (!props.messageId) return;

  loading.value = true;
  try {
    const res = await getMessageVersionList(props.messageId);
    if (res?.status === 'success') {
      const list = Array.isArray(res.datum) ? res.datum : [];
      // 过滤出已发布版本，按版本号降序排序，版本号相同则按发布时间降序
      const publishedList = list
        .filter((v: VersionInfo) => v && v.publish_status === 1)
        .sort((a: VersionInfo, b: VersionInfo) => {
          const verA = parseVersion(a.version);
          const verB = parseVersion(b.version);
          // 先按版本号排序
          if (verB.major !== verA.major) return verB.major - verA.major;
          if (verB.minor !== verA.minor) return verB.minor - verA.minor;
          // 版本号相同则按发布时间降序
          return (b.published_at || 0) - (a.published_at || 0);
        });
      versionList.value = publishedList;
    }
  } catch (error) {
    console.error('加载版本列表失败:', error);
    ElMessage.error('加载版本列表失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 对比选中的版本
 * @param {VersionInfo} version - 选中的版本信息
 * @returns {Promise<void>}
 */
async function handleCompareVersion(version: VersionInfo) {
  if (version.id === props.currentVersionId) return;

  loading.value = true;
  try {
    const res = await getMessagePublishedDetail(version.id);
    if (res?.status === 'success' && res.datum) {
      emit('compare', {
        selectedVersion: version,
        selectedDetail: res.datum
      });
      // 不关闭版本历史窗口，让用户可以继续选择其他版本对比
    } else {
      ElMessage.error('加载版本详情失败');
    }
  } catch (error) {
    console.error('加载版本详情失败:', error);
    ElMessage.error('加载版本详情失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 处理对话框关闭事件，清空版本列表
 * @returns {void}
 */
function handleClosed() {
  versionList.value = [];
}

// 监听弹窗打开
watch(() => props.visible, (visible) => {
  if (visible) {
    loadVersions();
  }
});
</script>

<style lang="scss" src="./index.scss"></style>
