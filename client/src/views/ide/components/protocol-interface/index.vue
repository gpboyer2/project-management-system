<!--
  协议算法接口编辑器组件 (Protocol Interface Editor)
  使用场景：直接访问 type=interface 路由
  路径示例：/#/editor/ide?type=interface&protocolAlgorithmId=xxx

  左侧报文列表 + 右侧内容区（顶部控制栏 + 底部内容区）
  物理分离原因：与 hierarchy-interface-editor 分离，便于后续独立演进
-->
<template>
  <!-- 编辑器主容器 -->
  <div
    class="ide-interface-editor"
    v-bind="$attrs"
    :data-debug-hierarchy="sourceType === 'hierarchy' ? sourceIdValue : undefined"
    :data-debug-protocol="sourceType === 'protocol' ? sourceIdValue : undefined"
  >
    <!-- 1.1 左侧报文列表（已删除）
       原因：协议编辑视图不需要报文列表功能，直接通过 URL 参数 protocolAlgorithmId 访问单个报文
       如需恢复，参考 logic-node-interface/components/packet-list-panel
    -->

    <!-- 1.2 右侧内容区 -->
    <div v-if="activePacket" class="ide-interface-content">
      <!-- 1.2.1 顶部控制栏 -->
      <div class="ide-interface-content-toolbox">
        <div class="ide-interface-header-left">
          <div class="ide-interface-icon-wrapper">
            <div class="ide-interface-icon">
              <el-icon><Document /></el-icon>
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

        <!-- 操作按钮区：左右分区布局 -->
        <div class="ide-interface-header-actions">
          <!-- 左侧：视图切换标签页（位置固定） -->
          <div class="ide-icd-editor-tabs">
            <button
              class="ide-icd-editor-tab"
              :class="{ 'ide-icd-editor-tab--active': activeView === 'definition' }"
              @click="setActiveView('definition')"
            >
              报文定义
            </button>

            <button
              class="ide-icd-editor-tab"
              :class="{ 'ide-icd-editor-tab--active': activeView === 'impact' }"
              @click="setActiveView('impact')"
            >
              引用与影响分析
            </button>
          </div>

          <!-- 右侧：操作按钮（靠右对齐） -->
          <div class="ide-interface-action-buttons">
            <!-- ========== 草稿模式操作区 ========== -->
            <template v-if="showDraftActions">
              <!-- 历史版本 -->
              <el-button
                v-if="is_backend_message"
                size="small"
                @click="handleViewVersionHistory"
              >
                <el-icon><Clock /></el-icon>
                历史版本
              </el-button>

              <!-- 保存草稿 -->
              <el-button
                size="small"
                type="primary"
                :disabled="is_saving"
                @click="handleSave"
              >
                <el-icon><Select /></el-icon>
                {{ saveButtonText }}
              </el-button>

              <!-- 放弃草稿 -->
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="is_saving || is_publishing"
                @click="handleDiscardDraftWrapper"
              >
                <el-icon><CircleCloseFilled /></el-icon>
                放弃草稿
              </el-button>

              <!-- 无改动提示：发布将被禁用 -->
              <div v-if="publishNoChangeBlocked" class="toolbar-status toolbar-status--no-change">
                <el-icon :size="UI_SIZE.ICON_SIZE_TINY">
                  <Warning />
                </el-icon>
                <span>无改动</span>
              </div>

              <!-- 发布 -->
              <el-tooltip
                placement="top"
                :disabled="!publishNoChangeBlocked"
                :content="publishNoChangeTooltip"
              >
                <span class="ide-interface-btn-wrapper">
                  <el-button
                    size="small"
                    type="success"
                    :disabled="is_publishing || publishNoChangeBlocked"
                    @click="handlePublishWrapper"
                  >
                    <el-icon><Upload /></el-icon>
                    {{ is_publishing ? '发布中...' : '发布' }}
                  </el-button>
                </span>
              </el-tooltip>
            </template>

            <!-- ========== 只读模式操作区 ========== -->
            <template v-if="showRevisionActions">
              <!-- 版本过期状态和操作 -->
              <template v-if="showOutdatedActions">
                <div class="toolbar-status toolbar-status--outdated">
                  <el-icon :size="UI_SIZE.ICON_SIZE_TINY">
                    <Warning />
                  </el-icon>

                  <span>版本过期</span>
                </div>

                <el-button size="small" @click="handleViewVersionDiffWrapper">
                  查看差异
                </el-button>

                <el-button size="small" @click="handleUpgradeToLatest">
                  升级到最新
                </el-button>
              </template>

              <!-- 历史版本 -->
              <el-button
                v-if="is_backend_message"
                size="small"
                @click="handleViewVersionHistory"
              >
                <el-icon><Clock /></el-icon>
                历史版本
              </el-button>

              <!-- 创建修订草稿 -->
              <el-button
                v-if="!has_existing_draft"
                size="small"
                type="primary"
                :disabled="isPacketOutdatedComputed || isViewingHistoryVersion"
                @click="handleCreateRevisionDraftWrapper"
              >
                <el-icon><Edit /></el-icon>
                创建修订草稿
              </el-button>

              <!-- 继续修订草稿（有草稿时显示） -->
              <el-button
                v-if="has_existing_draft"
                size="small"
                type="primary"
                :disabled="isViewingHistoryVersion"
                @click="handleContinueDraftWrapper"
              >
                <el-icon><Edit /></el-icon>
                继续修订草稿
              </el-button>
            </template>

            <!-- ========== 非后端报文操作区 ========== -->
            <el-button
              v-if="!is_backend_message"
              size="small"
              @click="handleNavigateToDefinition"
            >
              <el-icon><Link /></el-icon>
              编辑报文定义
            </el-button>
          </div>
        </div>
      </div>

      <!-- 1.2.2 底部内容区（左右布局） -->
      <div v-if="activeView === 'definition'" class="ide-interface-content-main">
        <!-- 1.2.2.1 左侧信息区 -->
        <div class="ide-interface-cm-info" :class="{ 'ide-interface-cm-info--readonly': isPacketReadonly }">
          <!-- 1.2.2.1.1 基本信息面板（与 design/packet-config 完全一致的交互） -->
          <PacketBasicInfo
            v-if="activePacket"
            :expanded="basicInfoExpanded"
            :readonly="isPacketReadonly"
            :readonly-display="isPacketReadonly"
            :packet-name="activePacket.name || ''"
            :version="String(activePacket.version || '')"
            :byte-order="String((activePacket as any).default_byte_order || 'big')"
            :struct-alignment="Number((activePacket as any).struct_alignment ?? 1)"
            :description="String((activePacket as any).description || '')"
            :byte-order-options="defaultByteOrderOptions"
            :alignment-options="structAlignmentOptions"
            @update:expanded="basicInfoExpanded = $event"
            @update:field="updateBasicInfoField"
          />

          <!-- 1.2.2.1.2 字段列表（与 design/packet-config 完全一致的交互） -->
          <PacketFieldList
            :readonly="isPacketReadonly"
            :expanded="fieldListExpanded"
            :fields="(activePacket as any)?.fields || []"
            :flattened-fields="flattenedFields"
            :selected-field-index="selectedFieldIndex ?? -1"
            :comp-options="{ fieldOptions }"
            @update:expanded="fieldListExpanded = $event"
            @field-add="handleFieldAdd"
            @field-reorder="handleFieldReorder"
            @field-select="selectField"
            @field-double-click="handleFieldDoubleClick"
            @field-delete="removeField"
            @field-toggle-expand="toggleFieldExpanded"
            @add-field-placeholder="showAddFieldMenu"
            @update-field-name="handleUpdateFieldName"
            @update-field-length="handleUpdateFieldLength"
            @update-field-byte-length="handleUpdateFieldByteLength"
          />
        </div>

        <!-- 1.2.2.2 右侧属性面板（Tab 切换） -->
        <div class="ide-interface-cm-attr">
          <template v-if="isPacketReadonly">
            <div class="ide-toolbox-header">
              <div class="ide-toolbox-tabs">
                <div class="ide-toolbox-tab ide-toolbox-tab--active">
                  字段属性
                </div>
              </div>
            </div>

            <div class="ide-toolbox-content">
              <FieldPropsReadonly :field="selectedField" />
            </div>
          </template>

          <template v-else>
            <div class="ide-toolbox-header">
              <div class="ide-toolbox-tabs">
                <div
                  class="ide-toolbox-tab"
                  :class="{ 'ide-toolbox-tab--active': rightTab === 'field-list' }"
                  @click="setRightTab('field-list')"
                >
                  字段列表
                </div>

                <div
                  class="ide-toolbox-tab"
                  :class="{ 'ide-toolbox-tab--active': rightTab === 'field-props' }"
                  @click="setRightTab('field-props')"
                >
                  字段属性
                </div>
              </div>
            </div>

            <div class="ide-toolbox-content">
              <!-- Tab 1: 字段属性 -->
              <template v-if="rightTab === 'field-props'">
                <template v-if="selectedField">
                  <EditorAside
                    :selected-field="selectedField"
                    :comp-options="{
                      fieldList: activePacket?.fields || [],
                      packetIndex: null,
                      readonly: editStatus === EDIT_STATUS.HISTORY || editStatus === EDIT_STATUS.READONLY
                    }"
                    @close="clearSelectedField()"
                  />
                </template>

                <template v-else>
                  <div class="ide-toolbox-empty">
                    <el-icon class="ide-toolbox-empty-icon"><Tickets /></el-icon>

                    <p>选择一个字段查看属性</p>
                  </div>
                </template>
              </template>

              <!-- Tab 2: 字段列表（可拖拽工具箱） -->
              <template v-if="rightTab === 'field-list'">
                <FieldToolbox :packet-data="activePacket" @dblclick="handleFieldTypeDoubleClick" />
              </template>
            </div>
          </template>
        </div>
      </div>

      <!-- 引用与影响分析视图 -->
      <div v-else class="ide-icd-editor-impact">
        <div class="ide-icd-editor-impact-right">
          <div class="ide-icd-editor-impact-right-header">
            <div class="ide-icd-editor-impact-stats">
              <div class="ide-icd-editor-impact-stat">
                <span class="ide-icd-editor-impact-stat-value">{{ packetReferencesSummary.total }}</span>
                <span class="ide-icd-editor-impact-stat-label">引用节点</span>
              </div>

              <div class="ide-icd-editor-impact-stat ide-icd-editor-impact-stat--warning" v-if="packetReferencesSummary.outdated > 0">
                <span class="ide-icd-editor-impact-stat-value">{{ packetReferencesSummary.outdated }}</span>
                <span class="ide-icd-editor-impact-stat-label">版本过期</span>
              </div>

              <div class="ide-icd-editor-impact-stat ide-icd-editor-impact-stat--success" v-else>
                <span class="ide-icd-editor-impact-stat-value">
                  <el-icon><CircleCheck /></el-icon>
                </span>
                <span class="ide-icd-editor-impact-stat-label">全部同步</span>
              </div>
            </div>

            <button class="ide-icd-editor-sync-btn" @click="handleNotifyPlaceholder">
              <el-icon><Bell /></el-icon>
              一键通知
            </button>
          </div>

          <div class="ide-icd-editor-impact-table-wrapper">
            <template v-if="packetReferencesState.loading">
              <div class="ide-icd-editor-impact-empty">
                <p>加载中...</p>
              </div>
            </template>

            <template v-else-if="packetReferencesState.error">
              <div class="ide-icd-editor-impact-empty">
                <p>加载失败：{{ packetReferencesState.error }}</p>
              </div>
            </template>

            <template v-else-if="packetReferencesList.length === 0">
              <div class="ide-icd-editor-impact-empty">
                <p>暂无引用</p>
              </div>
            </template>

            <template v-else>
              <table class="ide-icd-editor-impact-table">
                <thead>
                  <tr>
                    <th>关联节点</th>
                    <th>角色</th>
                    <th>版本</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, idx) in packetReferencesList" :key="idx">
                    <td>
                      <div class="ide-icd-editor-app-cell">
                        <el-icon class="ide-icd-editor-app-icon"><Grid /></el-icon>
                        <span class="ide-icd-editor-app-name">
                          {{ row.nodeName || row.nodeId || '-' }}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        class="ide-icd-editor-role-tag"
                        :class="row.role === 'Pub' ? 'ide-icd-editor-role-tag--pub' : 'ide-icd-editor-role-tag--sub'"
                      >
                        {{ row.role === 'Pub' ? '发送方' : '接收方' }}
                      </span>
                    </td>

                    <td>
                      <span>{{ row.localVersion || '-' }}</span>
                      <span style="margin: 0 6px; color: var(--component-text-tertiary);">→</span>
                      <span>{{ row.latestVersion || '-' }}</span>
                    </td>

                    <td>
                      <div
                        class="ide-icd-editor-status"
                        :class="row.status === 'Sync' ? 'ide-icd-editor-status--sync' : 'ide-icd-editor-status--outdated'"
                      >
                        <el-icon>
                          <CircleCheck v-if="row.status === 'Sync'" />
                          <WarningFilled v-else />
                        </el-icon>
                        {{ row.status === 'Sync' ? '已同步' : '已过期' }}
                      </div>
                    </td>

                    <td>
                      <button
                        class="ide-icd-editor-action-btn"
                        :disabled="row.status === 'Sync'"
                        @click="handleViewReferenceDiff(row)"
                      >
                        查看差异
                        <el-icon><ArrowRight /></el-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>
        </div>
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
    @compare="handleVersionCompare"
  />

  <!-- 关联报文弹窗（节点接口视图） -->
  <AddPacketDialog
    v-model:visible="addPacketDialogVisible"
    :comp-options="{
      form: addPacketForm,
      loadingOptions: loadingAddPacketOptionList,
      messageIdOptions: messageIdOptionList,
      versionOptions: versionOptionList
    }"
    @message-id-change="handleMessageIdChange"
    @packet-id-change="handlePacketIdChange"
    @direction-change="handleDirectionChange"
    @confirm="confirmAddPacketRef"
    @cancel="addPacketDialogVisible = false"
  />

  <!-- 添加字段菜单：仅编辑模式 -->
  <div
    v-if="addFieldMenuVisible"
    class="ide-add-field-menu-overlay"
    @click="hideAddFieldMenu"
  />

  <el-popover
    :visible="addFieldMenuVisible"
    placement="bottom-start"
    :width="420"
    :show-arrow="false"
    :teleported="true"
    :popper-options="addFieldMenuPopperOptions"
    virtual-triggering
    :virtual-ref="addFieldMenuVirtualRef"
    popper-class="ide-add-field-menu-popper"
    @update:visible="(v: boolean) => { if (!v) hideAddFieldMenu(); }"
  >
    <AddFieldMenu @select="addFieldFromMenu" />
  </el-popover>
</template>

<script setup lang="ts">
// Protocol Interface Editor - 协议算法接口编辑器
// 使用场景：直接访问 type=interface 路由
console.log('[Protocol Interface Editor] 组件加载');

// 禁用自动属性继承，手动绑定到根元素（因为组件有多个根节点）
defineOptions({
  inheritAttrs: false
});

import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Document,
  Clock,
  Select,
  CircleCloseFilled,
  Upload,
  Edit,
  Link,
  Tickets,
  CircleCheck,
  Bell,
  Grid,
  WarningFilled,
  ArrowRight,
  Warning
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useIcdStore, useIdeStore } from '@/stores';
import { buildEditorTabKey } from '@/utils/routeParamHelper';
import { useDialogEnterKey } from '@/utils/useDialogEnterKey';
import { convert_loaded_data_to_ui_format, arrayUtils, parseVersion } from '@/utils';
import { resolve_numeric_id } from '@/utils/validationUtils';
import { validateId } from '@/utils/idUtils';
import {
  getMessageList,
  getMessageVersionList,
  getMessagePublishedDetail,
  getMessageDraftDetail,
  getPacketReferences
} from '@/api/messageManagement';
import { build_packet_for_save } from '@/utils/fieldUtils';
import EditorAside from '@/views/packet-config/packet-detail-editor/editor-aside/index.vue';
import { PacketBasicInfo, PacketFieldList } from '@/views/packet-config/components';
import ProtocolDiffDialog from '../protocol-diff-dialog/index.vue';
import VersionHistoryDialog from '../shared-version-dialog/index.vue';
import {
  AddPacketDialog,
  FieldPropsReadonly
} from './components';
import {
  FieldToolbox,
  AddFieldMenu
} from '../icd-packet-editor/components';
import { useFieldOperations } from '../icd-packet-editor/composables/useFieldOperations';
import {
  useInterfacePacketRefs,
  useInterfaceVersionControl,
  useInterfaceDraft
} from './composables';
import type { PacketData, EditStatus } from './types';
import { UI_SIZE } from '@/constants';
import { EDIT_STATUS, API_CONFIG } from '@/views/ide/constants';
import { fieldOptions } from '@/stores/packet-field-options';

// Emits
const emit = defineEmits<{
  (e: 'error', error: any): void;
  (e: 'navigate-to-definition', protocolId: string, packetId: string, packetName?: string, packetVersion?: string): void;
  (e: 'save', packetList: PacketData[]): void;
  (e: 'discard-draft', packetId: string): void;
}>();

// Router
const route = useRoute();
const router = useRouter();

// Store
const icdStore = useIcdStore();
const ideStore = useIdeStore();

// 从 URL 获取参数
const interfaceId = computed(() => route.query.interfaceId as string | undefined);
const systemNodeId = computed(() => route.query.systemNodeId as string | undefined);
const protocolAlgorithmId = computed(() => route.query.protocolAlgorithmId as string | undefined);
const showPacketList = computed(() => false);

type UrlMode = 'draft' | 'editable' | 'readonly' | 'history';
type ActiveView = 'definition' | 'impact';
type RightTab = 'field-props' | 'field-list';

/**
 * 规范化 URL 模式参数
 * @param {any} raw - 原始模式值
 * @returns {UrlMode | undefined} 规范化后的模式或 undefined
 */
function normalizeMode(raw: any): UrlMode | undefined {
  const v = String(raw ?? '').trim();
  if (v === 'draft' || v === 'editable' || v === 'readonly' || v === 'history') return v;
  return undefined;
}

/**
 * 规范化视图参数
 * @param {any} raw - 原始视图值
 * @returns {ActiveView} 规范化后的视图
 */
function normalizeView(raw: any): ActiveView {
  const v = String(raw ?? '').trim();
  return v === 'impact' ? 'impact' : 'definition';
}

/**
 * 规范化右侧标签页参数
 * @param {any} raw - 原始标签页值
 * @returns {RightTab} 规范化后的标签页
 */
function normalizeRightTab(raw: any): RightTab {
  const v = String(raw ?? '').trim();
  return v === 'field-props' ? 'field-props' : 'field-list';
}

const url_mode = computed<UrlMode | undefined>(() => normalizeMode(route.query.mode));
const activeView = computed<ActiveView>(() => normalizeView(route.query.view));
const rightTab = computed<RightTab>(() => normalizeRightTab(route.query.rightTab));
const url_field_id = computed<string>(() => String(route.query.fieldId ?? '').trim());

/**
 * 构建下一个查询参数对象
 * @param {Record<string, any>} patch - 要更新的参数
 * @param {string[]} removeKeys - 要删除的参数键
 * @returns {Record<string, any>} 新的查询参数对象
 */
function buildNextQuery(patch: Record<string, any>, removeKeys: string[] = []): Record<string, any> {
  const next: Record<string, any> = { ...route.query, ...patch };
  for (const k of removeKeys) delete next[k];
  Object.keys(next).forEach((k) => {
    if (next[k] === undefined || next[k] === null || String(next[k]).trim() === '') delete next[k];
  });
  return next;
}

/**
 * 更新 URL 查询参数
 * @param {Record<string, any>} patch - 要更新的参数
 * @param {string[]} removeKeys - 要删除的参数键
 */
function updateUrlQuery(patch: Record<string, any>, removeKeys: string[] = []) {
  router.replace({ path: route.path, query: buildNextQuery(patch, removeKeys) });
}

/**
 * 设置活动视图
 * @param {ActiveView} view - 视图类型
 */
function setActiveView(view: ActiveView) {
  updateUrlQuery({ view });
}

/**
 * 设置右侧标签页
 * @param {RightTab} tab - 标签页类型
 */
function setRightTab(tab: RightTab) {
  updateUrlQuery({ rightTab: tab });
}

/**
 * 清除选中的字段
 */
function clearSelectedField() {
  updateUrlQuery({}, ['fieldId']);
}

/**
 * 设置 URL 模式参数
 * @param {UrlMode} mode - 模式类型
 */
function setMode(mode?: UrlMode) {
  if (mode) {
    updateUrlQuery({ mode });
    return;
  }
  updateUrlQuery({}, ['mode']);
}

// 使用 composables
const {
  packetRefListLocal,
  loadingPacketRefs,
  packetList,
  loadInterfacePacketRefs,
  savePacketRefListToBackend,
} = useInterfacePacketRefs({
  nodeId: systemNodeId.value,
  interfaceId: interfaceId.value,
  showPacketList: false,
  readonly: false,
});

type PacketReferenceRow = {
  nodeId: string;
  nodeName: string;
  interfaceId: string;
  interfaceName: string;
  role: 'Pub' | 'Sub';
  refPacketId: number;
  localVersion: string;
  latestVersion: string;
  status: 'Sync' | 'Outdated';
};

const packetReferencesState = ref<{ loading: boolean; error: string | null }>({ loading: false, error: null });
const packetReferencesList = ref<PacketReferenceRow[]>([]);
const packetReferencesMeta = ref<{ latestVersion: string; fieldCount: number }>({ latestVersion: '', fieldCount: 0 });

const packetReferencesSummary = computed(() => {
  const total = packetReferencesList.value.length;
  const outdated = packetReferencesList.value.filter((x) => x.status === 'Outdated').length;
  return { total, outdated };
});

async function loadPacketReferencesForActivePacket(): Promise<void> {
  if (activeView.value !== 'impact') return;
  if (!activePacket.value) return;
  const id = validateId(activePacket.value.id);
  if (!id) return;

  packetReferencesState.value = { loading: true, error: null };
  try {
    const res = await getPacketReferences(id);
    if (res?.status !== 'success' || !res.datum) {
      throw new Error(res?.message || '获取引用关系失败');
    }

    const datum: any = res.datum;
    packetReferencesMeta.value = {
      latestVersion: String(datum.latestVersion || ''),
      fieldCount: Number(datum.fieldCount || 0),
    };
    packetReferencesList.value = Array.isArray(datum.referenceList) ? (datum.referenceList as PacketReferenceRow[]) : [];
  } catch (e: any) {
    packetReferencesList.value = [];
    packetReferencesState.value = { loading: false, error: e?.message || String(e) };
    return;
  } finally {
    packetReferencesState.value.loading = false;
  }
}

function handleNotifyPlaceholder() {
  ElMessage.info({ message: '待实现', plain: true });
}

async function handleViewReferenceDiff(row: PacketReferenceRow) {
  if (!row || row.status !== 'Outdated') return;

  // 用后端返回的 refPacketId 作为 local 版本；latestVersion 对应的“最新已发布”版本 id 需要由前端现有逻辑获取
  // 这里复用现有 handleViewVersionDiff 需要 activePacket 作为 local，因此临时加载 local packet 并填充弹窗数据
  try {
    // 1) 本地（引用版本）详情
    const localRes = await getMessagePublishedDetail(row.refPacketId);
    if (localRes?.status !== 'success' || !localRes.datum?.id) {
      throw new Error(localRes?.message || '加载引用版本详情失败');
    }
    const localPacket = localRes.datum as any;
    localPacket.fields = Array.isArray(localPacket.fields) ? localPacket.fields : [];

    // 2) 最新版本：沿用 message_id 的最新已发布信息（与当前 activePacket 一致）
    const message_id = String((activePacket.value as any)?.message_id || '').trim();
    if (!message_id) {
      throw new Error('缺少 message_id，无法获取最新版本');
    }
    const latest = await loadLatestPublishedInfo(message_id);
    if (!latest || !latest.id) {
      throw new Error('未获取到最新已发布版本');
    }

    // 3) 加载最新版本详情到 cache
    const latestRes = await getMessagePublishedDetail(latest.id);
    if (latestRes?.status !== 'success' || !latestRes.datum?.id) {
      throw new Error(latestRes?.message || '加载最新版本详情失败');
    }
    const latestPacket = latestRes.datum as any;
    latestPacket.fields = Array.isArray(latestPacket.fields) ? latestPacket.fields : [];

    versionDiffDialogData.value = {
      meta: {
        packetName: String(activePacket.value?.name || ''),
        appName: String(row.nodeName || ''),
        role: row.role,
      },
      local: {
        version: String(localPacket.version || row.localVersion || ''),
        fieldList: localPacket.fields,
      },
      latest: {
        version: String(latestPacket.version || row.latestVersion || ''),
        fieldList: latestPacket.fields,
      }
    };
    versionDiffDialogVisible.value = true;
  } catch (e: any) {
    ElMessage.error({ message: e?.message || String(e), plain: true });
  }
}

const {
  latestPublishedInfo,
  versionDiffDialogVisible,
  versionDiffDialogData,
  versionHistoryDialogVisible,
  loadLatestPublishedInfo,
  refreshLatestPublishedInfo,
  handleViewVersionDiff,
} = useInterfaceVersionControl();

const isViewingHistoryVersion = computed(() => url_mode.value === 'history');

const {
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
} = useInterfaceDraft();

// 基本信息面板展开状态
// 与 design/packet-config 对齐：默认收起
const basicInfoExpanded = ref(false);

// 字段列表展开状态
// 与 design/packet-config 对齐：默认展开
const fieldListExpanded = ref(true);

const isPacketReadonly = computed(() => {
  return editStatus.value === EDIT_STATUS.HISTORY || editStatus.value === EDIT_STATUS.READONLY;
});

const defaultByteOrderOptions = ref<{ value: string; label: string }[]>([
  { value: 'big', label: '大端' },
  { value: 'little', label: '小端' },
]);

const structAlignmentOptions = ref<{ value: number; label: string }[]>([
  { value: 1, label: '1字节对齐' },
  { value: 2, label: '2字节对齐' },
  { value: 4, label: '4字节对齐' },
  { value: 8, label: '8字节对齐' },
]);

// 模板中使用的来源类型和来源 ID（固定为 protocol 类型）
const sourceType = computed(() => 'protocol');
const sourceIdValue = computed(() => systemNodeId.value);

// 当前激活的报文 ID
const activePacketId = ref<number | string>('');

// 单个报文数据（直接访问场景）
const singlePacketData = ref<PacketData | null>(null);
const loadingSinglePacket = ref(false);

// 当前激活的报文
const activePacket = computed(() => {
  // 直接访问场景：从 singlePacketData 中获取
  if (singlePacketData.value) {
    return singlePacketData.value;
  }
  // 从 packetList 中查找
  return packetList.value.find(p => String(p.id) === String(activePacketId.value)) || null;
});

// 使用字段操作 composable（必须在 activePacket 定义之后）
const {
  selectedFieldIndex,
  addFieldMenuVisible,
  addFieldMenuPosition,
  flattenedFields,
  findFieldById,
  toggleFieldExpanded,
  handleFieldAdd,
  handleFieldReorder,
  removeField,
  showAddFieldMenu,
  hideAddFieldMenu,
  addFieldFromMenu,
  updateFieldProperty,
} = useFieldOperations(() => activePacket.value, () => editStatus.value === EDIT_STATUS.HISTORY || editStatus.value === EDIT_STATUS.READONLY);

const addFieldMenuVirtualRef = computed(() => {
  return {
    getBoundingClientRect: () => DOMRect.fromRect({
      x: addFieldMenuPosition.x,
      y: addFieldMenuPosition.y,
      width: 0,
      height: 0,
    })
  };
});

const addFieldMenuPopperOptions = computed(() => {
  return {
    strategy: 'fixed',
    modifiers: [
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport',
          padding: 12,
        },
      },
      {
        name: 'flip',
        options: {
          boundary: 'viewport',
          padding: 12,
          fallbackPlacements: ['top-start', 'right-start', 'left-start', 'bottom-start'],
        },
      },
    ],
  };
});

function updateBasicInfoField(field: string, value: any) {
  if (!activePacket.value) return;
  const pkt: any = activePacket.value;
  if (field === 'name') {
    pkt.name = value;
  } else if (field === 'default_byte_order') {
    pkt.default_byte_order = value;
  } else if (field === 'struct_alignment') {
    pkt.struct_alignment = Number(value);
  } else if (field === 'description') {
    pkt.description = value;
  }
}

function collectAllFieldNames(fieldList: any[], names: Set<string> = new Set()): Set<string> {
  for (const f of fieldList || []) {
    const n = String((f as any)?.field_name || '').trim();
    if (n) names.add(n);
    if (Array.isArray((f as any)?.fields) && (f as any).fields.length > 0) {
      collectAllFieldNames((f as any).fields, names);
    }
  }
  return names;
}

function validateAndUpdateFieldName(fieldId: string, value: string): boolean {
  if (!activePacket.value?.fields) return false;
  const field = findFieldById(activePacket.value.fields as any, fieldId) as any;
  if (!field) return false;

  const oldName = String(field.field_name || '').trim();
  const newName = String(value || '').trim();

  if (!newName) {
    ElMessage.warning('字段名称不能为空');
    return false;
  }
  const englishNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!englishNameRegex.test(newName)) {
    ElMessage.warning('字段名称必须是英文，以字母开头，只能包含字母、数字和下划线');
    return false;
  }

  const existing = collectAllFieldNames(activePacket.value.fields as any);
  existing.delete(oldName);
  if (existing.has(newName)) {
    ElMessage.warning(`字段名称 "${newName}" 已存在，请使用其他名称`);
    return false;
  }

  field.field_name = newName;
  return true;
}

function handleUpdateFieldName(fieldId: string, value: string) {
  validateAndUpdateFieldName(fieldId, value);
}

function handleUpdateFieldLength(fieldId: string | undefined, value: number) {
  if (!fieldId) return;
  updateFieldProperty(fieldId, 'length', value);
}

function handleUpdateFieldByteLength(fieldId: string | undefined, value: number) {
  if (!fieldId) return;
  updateFieldProperty(fieldId, 'byte_length', value);
}

function handleFieldDoubleClick(index: number) {
  selectField(index);
}

/** 处理字段类型双击事件（从字段列表工具箱添加字段） */
function handleFieldTypeDoubleClick(fieldType: any) {
  if (!activePacket.value || isPacketReadonly.value) return;

  const field_type = fieldType?.fieldType || fieldType?.field_type || '';
  const FIELD_TYPE_TO_ENGLISH: Record<string, string> = {
    'SignedInt': 'signedInt',
    'UnsignedInt': 'unsignedInt',
    'Float': 'float',
    'String': 'string',
    'Timestamp': 'timestamp',
    'Bool': 'bool',
    'Struct': 'struct',
    'Array': 'array',
    'Bitfield': 'bitfield',
    'Padding': 'padding',
    'Checksum': 'checksum',
    'Command': 'command',
  };

  // 生成唯一字段名
  const base_name = FIELD_TYPE_TO_ENGLISH[field_type] || 'field';
  const existing_names = collectAllFieldNames((activePacket.value as any)?.fields || []);

  let counter = 1;
  let field_name = `${base_name}${counter}`;
  while (existing_names.has(field_name)) {
    counter++;
    field_name = `${base_name}${counter}`;
  }

  const is_container = field_type === 'Struct' || field_type === 'Array' || field_type === 'Command';

  const newField = {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    field_name: field_name,
    type: field_type,
    description: '',
    byte_length: 1,
    default_value: 0,
    display_format: 'decimal',
    is_required: true,
    valid_when: { field: '', value: null },
    message_id_value: null,
    value_type: '',
    precision: null,
    unit: '',
    value_range: [],
    length: null,
    sub_fields: [],
    base_type: '',
    maps: [],
    count: null,
    count_from_field: '',
    bytes_in_trailer: null,
    algorithm: '',
    parameters: {},
    expanded: is_container,
  };

  // 添加到字段列表末尾
  const fields = (activePacket.value as any).fields || [];
  fields.push(newField);
  (activePacket.value as any).fields = fields;
}

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

const showOutdatedActions = computed(() => {
  return isPacketOutdatedComputed.value && isPacketReadonly.value;
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
  if (status === 0) return false;
  if (status === 1) return true;
  return true;
});

// 后端报文草稿状态
const is_draft_backend_packet = computed(() => {
  if (!is_backend_message.value) return false;
  const status = (activePacket.value as any)?.publish_status;
  return status === 0;
});

// 编辑状态
const editStatus = computed<EditStatus>(() => {
  if (url_mode.value === 'history') return EDIT_STATUS.HISTORY;
  if (url_mode.value === 'readonly') return EDIT_STATUS.READONLY;
  if (url_mode.value === 'draft') return EDIT_STATUS.DRAFT;
  if (url_mode.value === 'editable') return EDIT_STATUS.EDITABLE;
  if (is_backend_message.value && is_published_backend_packet.value) return EDIT_STATUS.READONLY;
  if (is_backend_message.value && is_draft_backend_packet.value) return EDIT_STATUS.DRAFT;
  return 'editable';
});

// 是否显示草稿管理操作
const showDraftActions = computed(() => {
  return editStatus.value === EDIT_STATUS.DRAFT;
});

// 是否显示修订草稿操作
const showRevisionActions = computed(() => {
  return editStatus.value === EDIT_STATUS.READONLY;
});

// 保存按钮是否禁用
const saveButtonDisabled = computed(() => {
  if (is_saving.value) return true;
  return editStatus.value === EDIT_STATUS.HISTORY || editStatus.value === EDIT_STATUS.READONLY;
});

// 保存按钮文本
const saveButtonText = computed(() => {
  if (is_saving.value) return '保存中...';
  return editStatus.value === EDIT_STATUS.DRAFT ? '保存草稿' : '保存';
});

// ==================== 发布校验：无改动禁止发布（前端提示 + 后端兜底） ====================

const publishNoChangeTooltip = computed(() => '没有任何改动，无法发布新版本');
const latestPublishedPacketCanonical = ref<string | null>(null);
const latestPublishedPacketCanonicalKey = ref<string>('');

function canonicalizeForPublishCompare(packetLike: any): string | null {
  if (!packetLike) return null;
  try {
    const payload = build_packet_for_save(packetLike as any) || {};

    const TRANSIENT_KEYS = new Set([
      'id',
      'expanded',
      'level',
      'parentId',
      'parent_id',
      'children',
      'isPlaceholder',
    ]);

    const stripAndSort = (v: any): any => {
      if (Array.isArray(v)) return v.map(stripAndSort);
      if (!v || typeof v !== 'object') return v;
      const keys = Object.keys(v).filter((k) => !TRANSIENT_KEYS.has(k) && v[k] !== undefined).sort();
      const out: any = {};
      for (const k of keys) out[k] = stripAndSort(v[k]);
      return out;
    };

    const fields = Array.isArray(payload.fields) ? payload.fields : [];

    const canonical = {
      message_id: String(payload.message_id || '').trim() || null,
      name: String(payload.name || ''),
      description: String(payload.description || ''),
      hierarchy_node_id: String(payload.hierarchy_node_id || ''),
      protocol: String(payload.protocol || ''),
      category_id: payload.category_id ?? null,
      default_byte_order: String(payload.default_byte_order || ''),
      struct_alignment: payload.struct_alignment !== undefined && payload.struct_alignment !== null ? Number(payload.struct_alignment) : null,
      status: payload.status !== undefined && payload.status !== null ? Number(payload.status) : null,
      field_count: fields.length,
      fields: stripAndSort(fields),
    };

    return JSON.stringify(canonical);
  } catch {
    return null;
  }
}

async function refreshLatestPublishedPacketCanonical() {
  const pkt: any = activePacket.value as any;
  const message_id = String(pkt?.message_id || '').trim();
  if (!message_id) {
    latestPublishedPacketCanonical.value = null;
    latestPublishedPacketCanonicalKey.value = '';
    return;
  }

  const latest = latestPublishedInfo.value && latestPublishedInfo.value.message_id === message_id ? latestPublishedInfo.value : null;
  const latest_id = latest && latest.id ? Number(latest.id) : NaN;
  if (!Number.isFinite(latest_id) || latest_id <= 0) {
    // 没有最新已发布版本：首次发布不需要对比
    latestPublishedPacketCanonical.value = null;
    latestPublishedPacketCanonicalKey.value = '';
    return;
  }

  const key = `${message_id}:${latest_id}`;
  if (latestPublishedPacketCanonicalKey.value === key && latestPublishedPacketCanonical.value) {
    return;
  }

  latestPublishedPacketCanonicalKey.value = key;
  latestPublishedPacketCanonical.value = null;

  try {
    const res = await getMessagePublishedDetail(latest_id);
    if (res?.status !== 'success' || !res.datum?.id) {
      throw new Error(res?.message || '加载最新版本详情失败');
    }
    const latestPacket: any = res.datum;
    latestPacket.fields = Array.isArray(latestPacket.fields) ? latestPacket.fields : [];
    latestPacket.fields = convert_loaded_data_to_ui_format(latestPacket.fields);

    latestPublishedPacketCanonical.value = canonicalizeForPublishCompare(latestPacket);
  } catch {
    // 加载失败时不阻断发布（由后端兜底）
    latestPublishedPacketCanonical.value = null;
  }
}

watch(
  [() => activePacket.value?.message_id, () => latestPublishedInfo.value?.id],
  async () => {
    await refreshLatestPublishedPacketCanonical();
  },
  { immediate: true }
);

const publishNoChangeBlocked = computed(() => {
  if (!is_backend_message.value) return false;
  if (!is_draft_backend_packet.value) return false;
  if (!latestPublishedPacketCanonical.value) return false;
  const current = canonicalizeForPublishCompare(activePacket.value as any);
  return !!current && current === latestPublishedPacketCanonical.value;
});

// 计算属性：是否只读（用于控制保存按钮等编辑操作的显示）
const computedReadonly = computed(() => {
  return editStatus.value === EDIT_STATUS.READONLY || editStatus.value === EDIT_STATUS.HISTORY;
});

// 选中的字段
const selectedField = computed(() => {
  if (selectedFieldIndex.value === null) return null;
  const field = flattenedFields.value[selectedFieldIndex.value];
  if (!field) return null;
  if ((field as any).isPlaceholder) return null;
  return field;
});

// URL 驱动字段选中：fieldId -> selectedFieldIndex
watch(
  [() => url_field_id.value, () => flattenedFields.value],
  ([field_id]) => {
    const fid = String(field_id || '').trim();
    if (!fid) {
      selectedFieldIndex.value = null;
      return;
    }
    const idx = flattenedFields.value.findIndex((f: any) => String(f?.id || '').trim() === fid);
    selectedFieldIndex.value = idx >= 0 ? idx : null;
  },
  { immediate: true }
);

// 关联报文弹窗状态
const addPacketDialogVisible = ref(false);
const loadingAddPacketOptionList = ref(false);
const messageIdOptionList = ref<Array<{ value: string; label: string }>>([]);
const versionOptionList = ref<Array<{ value: number; label: string }>>([]);

const addPacketForm = ref<{
  message_id: string;
  packet_id: number | undefined;
  direction: 'input' | 'output';
}>({
  message_id: '',
  packet_id: undefined,
  direction: 'input'
});

// 弹窗回车确认
const addPacketDialogVisibleComputed = computed(() => addPacketDialogVisible.value);
useDialogEnterKey(addPacketDialogVisibleComputed, confirmAddPacketRef);

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
watch(() => activePacket.value?.message_id, async (new_message_id) => {
  await checkDraft(String(new_message_id || ''), is_published_backend_packet.value);
}, { immediate: true });

// 监听报文列表变化，选中第一个报文
watch(packetList, (newList) => {
  if (newList.length === 0) return;
  if (!activePacketId.value) {
    activePacketId.value = newList[0].id;
  }
}, { immediate: true });

// 监听 URL 参数中的 protocolAlgorithmId
watch(
  () => protocolAlgorithmId.value,
  async (newId) => {
    console.log('[Protocol Interface Editor] 报文 ID 变化:', newId);

    if (!newId) return;

    await loadSinglePacket(newId);
  },
  { immediate: true }
);

watch([() => activeView.value, () => activePacket.value?.id], async () => {
  await loadPacketReferencesForActivePacket();
});

// 初始化
onMounted(() => {
  if (icdStore.bundleList.length === 0) {
    icdStore.initSampleData();
  }
  if (interfaceId.value) {
    icdStore.setActiveBundle(interfaceId.value);
  }
  if (packetList.value.length > 0) {
    activePacketId.value = packetList.value[0].id;
  }
});

/** 更新标签页标题
 * @param packetName 报文名称
 */
function updateTabTitle(packetName: string) {
  const tabKey = buildEditorTabKey(route.path, route.query);
  const title = packetName || '未命名报文';
  ideStore.setTabTitle(tabKey, title);
}

// 监听当前报文变化，更新标签页标题
watch(
  () => activePacket.value?.name,
  (newName) => {
    if (newName) {
      updateTabTitle(newName);
    }
  },
  { immediate: true }
);

/** 加载单个报文（直接访问场景） */
async function loadSinglePacket(packetId: string | number) {
  console.log('[Protocol Interface Editor] 加载单个报文:', packetId);
  loadingSinglePacket.value = true;
  singlePacketData.value = null;
  
  try {
    const id = typeof packetId === 'number' ? packetId : Number(packetId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`无效的报文 ID: ${packetId}`);
    }
    
    const prefer_draft = url_mode.value === 'draft';
    let res = prefer_draft ? await getMessageDraftDetail(id) : await getMessagePublishedDetail(id);
    if (prefer_draft && res?.status !== 'success') {
      res = await getMessagePublishedDetail(id);
    }
    console.log('[Protocol Interface Editor] API 返回:', res);
    
    if (res?.status === 'success' && res.datum) {
      // 使用 convert_loaded_data_to_ui_format 为字段补齐 id，确保只读模式展开/收起可用
      const rawFields = Array.isArray(res.datum.fields) ? res.datum.fields : [];
      const publish_status = typeof (res.datum as any)?.publish_status === 'number'
        ? (res.datum as any).publish_status
        : (prefer_draft ? 0 : 1);
      const packet: any = {
        id: res.datum.id,
        name: res.datum.name,
        message_id: res.datum.message_id,
        version: res.datum.version,
        fields: convert_loaded_data_to_ui_format(rawFields),
        publish_status,
      };
      singlePacketData.value = packet;
      activePacketId.value = id;
      console.log('[Protocol Interface Editor] 报文加载成功:', packet);
      // 更新标签页标题
      updateTabTitle(packet.name);
    } else {
      throw new Error(res?.message || '加载报文失败');
    }
  } catch (error) {
    console.error('[Protocol Interface Editor] 加载报文失败:', error);
    ElMessage.error(`加载报文失败: ${error}`);
  } finally {
    loadingSinglePacket.value = false;
  }
}

/** 打开关联报文弹窗 */
async function openAddPacketDialog() {
  if (!systemNodeId.value || !interfaceId.value) {
    ElMessage.warning('缺少接口信息，无法新增报文');
    return;
  }

  addPacketForm.value = {
    message_id: '',
    packet_id: undefined,
    direction: 'input'
  };
  versionOptionList.value = [];
  addPacketDialogVisible.value = true;

  if (messageIdOptionList.value.length > 0) return;
  loadingAddPacketOptionList.value = true;
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
    loadingAddPacketOptionList.value = false;
  }
}

/** 处理 message_id 变化 */
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
  } catch (e) {
    // ignore
  }
}

function handlePacketIdChange(value: number | undefined) {
  addPacketForm.value.packet_id = value;
}

function handleDirectionChange(value: 'input' | 'output') {
  addPacketForm.value.direction = value;
}

/** 确认关联报文 */
async function confirmAddPacketRef() {
  const packet_id = typeof addPacketForm.value.packet_id === 'number' ? addPacketForm.value.packet_id : Number(addPacketForm.value.packet_id);
  if (!Number.isFinite(packet_id) || packet_id <= 0) {
    ElMessage.warning('请选择具体版本（packet_id）');
    return;
  }

  const direction = addPacketForm.value.direction === 'output' ? 'output' : 'input';
  const existedIndex = packetRefListLocal.value.findIndex((r) => r.packet_id === packet_id);
  if (existedIndex >= 0) {
    packetRefListLocal.value.splice(existedIndex, 1, { packet_id, direction });
  } else {
    packetRefListLocal.value.push({ packet_id, direction });
  }

  await savePacketRefListToBackend();
  activePacketId.value = packet_id;
  if (url_mode.value === 'history') {
    setMode('readonly');
  }
  addPacketDialogVisible.value = false;
  ElMessage.success('报文已关联到接口');
}

/** 升级到最新版本 */
async function handleUpgradeToLatest() {
  if (!activePacket.value || !currentPacketRef.value) return;

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

  await savePacketRefListToBackend();
  activePacketId.value = latest.id;
  if (url_mode.value === 'history') {
    setMode('readonly');
  }
  ElMessage.success('已升级到最新版本');
}

/** 查看版本差异（包装器） */
async function handleViewVersionDiffWrapper() {
  await handleViewVersionDiff(
    activePacket.value,
    false,
    '',
    currentPacketRef.value?.direction
  );
}

/** 版本差异同步 */
function handleVersionDiffSync() {
  versionDiffDialogVisible.value = false;
  handleUpgradeToLatest();
}

/** 打开版本历史对话框 */
function handleViewVersionHistory() {
  if (!activePacket.value) return;
  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  if (!message_id) {
    ElMessage.warning('该报文没有历史版本');
    return;
  }
  versionHistoryDialogVisible.value = true;
}

/** 对比历史版本（从版本历史弹窗触发）
 * - 草稿模式：对比"当前草稿"与"选中的历史版本"
 * - 只读模式：对比"选中的历史版本"与"最新已发布版本"
 */
async function handleVersionCompare(data: { selectedVersion: any; selectedDetail: any }) {
  if (!activePacket.value) return;

  const { selectedVersion, selectedDetail } = data;
  const message_id = String((activePacket.value as any)?.message_id || '').trim();

  if (!message_id) {
    ElMessage.warning('缺少报文标识，无法对比');
    return;
  }

  // 准备选中版本的字段数据
  const selectedFields = Array.isArray(selectedDetail.fields) ? selectedDetail.fields : [];

  // 草稿模式：对比当前草稿与选中的历史版本
  if (is_draft_backend_packet.value) {
    const currentFields = Array.isArray((activePacket.value as any)?.fields)
      ? (activePacket.value as any).fields
      : [];

    versionDiffDialogData.value = {
      meta: {
        packetName: String(activePacket.value?.name || ''),
        appName: '',
        role: 'Pub' as const,
      },
      local: {
        version: String(selectedVersion.version || ''),
        fieldList: selectedFields,
      },
      latest: {
        version: `${activePacket.value?.version || ''} (草稿)`,
        fieldList: currentFields,
      }
    };
    versionDiffDialogVisible.value = true;
    return;
  }

  // 只读模式：对比选中的历史版本与最新已发布版本
  const latest = await loadLatestPublishedInfo(message_id);
  if (!latest || !latest.id) {
    ElMessage.warning('未获取到最新已发布版本');
    return;
  }

  try {
    // 加载最新版本详情
    const latestRes = await getMessagePublishedDetail(latest.id);
    if (latestRes?.status !== 'success' || !latestRes.datum?.id) {
      throw new Error(latestRes?.message || '加载最新版本详情失败');
    }
    const latestPacket = latestRes.datum as any;
    latestPacket.fields = Array.isArray(latestPacket.fields) ? latestPacket.fields : [];

    // 设置对比弹窗数据
    versionDiffDialogData.value = {
      meta: {
        packetName: String(activePacket.value?.name || ''),
        appName: '',
        role: 'Pub' as const,
      },
      local: {
        version: String(selectedVersion.version || ''),
        fieldList: selectedFields,
      },
      latest: {
        version: String(latestPacket.version || ''),
        fieldList: latestPacket.fields,
      }
    };
    versionDiffDialogVisible.value = true;
  } catch (e: any) {
    ElMessage.error({ message: e?.message || String(e), plain: true });
  }
}

/** 选择历史版本（保留用于兼容） */
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

  const selected_id = typeof versionData?.id === 'number' ? versionData.id : Number(versionData?.id);
  if (!Number.isFinite(selected_id) || selected_id <= 0) {
    ElMessage.warning('版本 ID 无效，无法切换');
    return;
  }

  // 历史版本查看通过 URL 驱动
  updateUrlQuery(
    {
      protocolAlgorithmId: String(selected_id),
      mode: 'history',
      view: 'definition',
      rightTab: 'field-props',
    },
    ['fieldId']
  );
}

/** 保存报文 */
async function handleSave() {
  const result = await savePacket(
    activePacket.value,
    is_backend_message.value,
    is_draft_backend_packet.value,
    url_mode.value === 'history',
    false
  );

  if (result.success) {
    if (result.updatedPacket) {
      activePacketId.value = String(result.updatedPacket.id);
    }
    ElMessage.success({ message: result.message || '保存成功', plain: true });
  } else if (!is_backend_message.value) {
    // 前端报文：保存到本地 store
    const bundleId = interfaceId.value || icdStore.activeBundleId;
    if (bundleId) {
      icdStore.savePacketList(bundleId, packetList.value as any);
    }
    emit('save', packetList.value);
    ElMessage.success({ message: '已保存到本地', plain: true });
  }
}

/** 发布报文（包装器） */
async function handlePublishWrapper() {
  if (publishNoChangeBlocked.value) {
    ElMessage.warning(publishNoChangeTooltip.value);
    return;
  }

  // 保存 message_id 用于发布后刷新缓存
  const message_id = String((activePacket.value as any)?.message_id || '').trim();

  const result = await publishPacket(
    activePacket.value,
    hasUnsavedChanges(activePacket.value),
    is_backend_message.value,
    is_draft_backend_packet.value,
    handleSave
  );

  if (result.success) {
    if (result.updatedPacket) {
      const packet = activePacket.value as any;
      if (result.updatedPacket.fields && Array.isArray(result.updatedPacket.fields)) {
        result.updatedPacket.fields = convert_loaded_data_to_ui_format(result.updatedPacket.fields);
      }
      Object.assign(packet, result.updatedPacket);
      updateSnapshot(activePacket.value);
    }
    setMode('readonly');
    if (result.updatedPacket?.id) {
      updateUrlQuery({ protocolAlgorithmId: String(result.updatedPacket.id), mode: 'readonly' });
    }

    // 刷新最新版本缓存，确保当前版本不会被标记为过期
    if (message_id) {
      await refreshLatestPublishedInfo(message_id);
    }

    ElMessage.success({ message: result.message, plain: true });
  }
}

/** 放弃草稿（包装器） */
async function handleDiscardDraftWrapper() {
  // 保存当前报文的 message_id，用于放弃草稿后加载最新版本
  const message_id = String((activePacket.value as any)?.message_id || '').trim();
  
  const result = await discardDraft(
    activePacket.value,
    is_backend_message.value,
    is_draft_backend_packet.value,
    async () => {
      // 放弃草稿后，加载该报文最新的已发布版本
      if (message_id) {
        try {
          const latest = await loadLatestPublishedInfo(message_id);
          
          if (latest && latest.id) {
            updateUrlQuery(
              {
                protocolAlgorithmId: String(latest.id),
                mode: 'readonly',
                view: 'definition',
              },
              ['fieldId']
            );
            return;
          }
        } catch (e) {
          console.error('[Protocol Interface Editor] 加载最新版本失败:', e);
        }
      }
      
      // 如果是从接口报文列表访问的，使用原有逻辑
      activePacketId.value = '';
      await loadInterfacePacketRefs();
      setMode('readonly');
      if (packetList.value.length > 0) {
        activePacketId.value = packetList.value[0].id;
      }
    }
  );

  if (result.success && activePacketId.value) {
    emit('discard-draft', String(activePacketId.value));
  }
}

/** 创建修订草稿（包装器） */
async function handleCreateRevisionDraftWrapper() {
  const result = await createRevisionDraft(
    activePacket.value,
    is_backend_message.value,
    is_published_backend_packet.value,
    isPacketOutdatedComputed.value
  );

  if (result.success && result.updatedPacket) {
    if (result.updatedPacket.fields && Array.isArray(result.updatedPacket.fields)) {
      result.updatedPacket.fields = convert_loaded_data_to_ui_format(result.updatedPacket.fields);
    }
    if (result.updatedPacket.publish_status === undefined || result.updatedPacket.publish_status === null) {
      result.updatedPacket.publish_status = 0;
    }
    const packet = activePacket.value as any;
    if (packet) {
      Object.assign(packet, result.updatedPacket);
    } else {
      // activePacket 为 null，需要添加到 packetList
      packetList.value.push(result.updatedPacket);
    }
    // 保持原有的 protocolAlgorithmId 不变（草稿和已发布版本共享同一个已发布版本的 ID）
    const originalProtocolAlgorithmId = protocolAlgorithmId.value;
    activePacketId.value = String(result.updatedPacket.id);
    updateSnapshot(activePacket.value || result.updatedPacket);
    // 关键修复：protocolAlgorithmId 保持不变，只通过 mode=draft 切换到草稿模式
    updateUrlQuery(
      {
        protocolAlgorithmId: originalProtocolAlgorithmId,
        mode: 'draft',
        view: 'definition',
      },
      ['fieldId']
    );
  }
}

/** 继续修订草稿（包装器） */
async function handleContinueDraftWrapper() {
  const result = await continueDraft(activePacket.value, is_backend_message.value);

  if (result.success && result.updatedPacket) {
    if (result.updatedPacket.fields && Array.isArray(result.updatedPacket.fields)) {
      result.updatedPacket.fields = convert_loaded_data_to_ui_format(result.updatedPacket.fields);
    }
    const packet = activePacket.value as any;
    if (packet) {
      Object.assign(packet, result.updatedPacket);
    } else {
      // activePacket 为 null，需要添加到 packetList
      packetList.value.push(result.updatedPacket);
    }
    // 保持原有的 protocolAlgorithmId 不变（草稿和已发布版本共享同一个已发布版本的 ID）
    const originalProtocolAlgorithmId = protocolAlgorithmId.value;
    activePacketId.value = String(result.updatedPacket.id);
    updateSnapshot(activePacket.value || result.updatedPacket);
    // 关键修复：protocolAlgorithmId 保持不变，只通过 mode=draft 切换到草稿模式
    // loadSinglePacket 会根据 mode 参数自动调用草稿 API 或已发布版本 API
    updateUrlQuery(
      {
        protocolAlgorithmId: originalProtocolAlgorithmId,
        mode: 'draft',
        view: 'definition',
      },
      ['fieldId']
    );
  }
}

/** 跳转到协议定义 */
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

/** 选择字段 */
function selectField(index: number) {
  const field = flattenedFields.value[index];
  if ((field as any)?.isPlaceholder) return;
  const field_id = String((field as any)?.id || '').trim();
  if (!field_id) return;
  updateUrlQuery({ fieldId: field_id, rightTab: 'field-props', view: 'definition' });
}

/** 处理 length 输入 */
function handleLengthInput(fieldId: string, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value) || 0;
  updateFieldProperty(fieldId, 'length', value);
}

/** 处理字节长度输入 */
function handleByteLengthInput(fieldId: string, event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value) || 1;
  updateFieldProperty(fieldId, 'byte_length', value);
}

/** 处理字节长度选择 */
function handleByteLengthSelect(fieldId: string, value: number) {
  updateFieldProperty(fieldId, 'byte_length', value);
}
</script>

<style lang="scss" src="./index.scss"></style>
