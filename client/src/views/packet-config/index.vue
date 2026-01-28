<template>
  <div class="page-packet-config" tabindex="0">
    <div class="packet-config-content">
      <PacketList
        v-show="!showDetailView"
        v-model:filter-info="filterInfo"
        v-model:selected-info="selectedInfo"
        v-model:page-info="pageInfo"
        @edit-packet="editPacket"
      />

      <div v-show="showDetailView" class="packet-detail-view">
        <EditorToolbar
          :is-view-mode="isViewMode"
          :show-discard-draft="!isViewMode && route.query.mode === 'edit' && currentPacket?.message_id"
          @save="savePacket"
          @back="cancelEdit"
          @generate-code="handleGenerateCode"
          @simulate="showSimulator"
          @publish="handlePublish"
          @discard-draft="handleDiscardDraft"
          @create-revision="createRevisionDraft"
        />

        <div class="editor-container">
          <div class="editor-sidebar editor-sidebar-left">
            <div class="sidebar-header">
              <h3 class="sidebar-title">
                字段结构
              </h3>
            </div>

            <div class="sidebar-content">
              <FieldTypeTree
                :field-type-list="formattedFieldTypeList"
                @add-field="addFieldToEnd"
                @clone="cloneFieldType"
              />
            </div>
          </div>

          <div class="editor-main">
            <PacketBasicInfo
              v-if="currentPacket"
              :expanded="panels.basicInfo.expanded"
              :readonly="isViewMode"
              :packet-name="currentPacket.name || ''"
              :version="currentVersion"
              :byte-order="currentPacket.default_byte_order || ''"
              :struct-alignment="currentPacket.struct_alignment || 1"
              :description="currentPacket.description || ''"
              :byte-order-options="defaultByteOrderOptions"
              :alignment-options="structAlignmentOptions"
              @update:expanded="panels.basicInfo.expanded = $event"
              @update:field="updateBasicInfoField"
            />

            <PacketFieldList
              :readonly="isViewMode"
              :expanded="panels.protocolContent.expanded"
              :fields="currentPacket?.fields || []"
              :flattened-fields="flattenedFields"
              :selected-field-index="selectedFieldIndex"
              :comp-options="{ fieldOptions }"
              @update:expanded="panels.protocolContent.expanded = $event"
              @field-add="handleFieldAdd"
              @field-reorder="handleFieldReorder"
              @field-select="selectField"
              @field-double-click="handleFieldDoubleClick"
              @field-delete="removeFieldByFlatIndex"
              @field-toggle-expand="toggleFieldExpanded"
              @add-field-placeholder="showAddFieldMenu"
              @update-field-name="updateFieldName"
              @update-field-length="updateFieldLength"
              @update-field-byte-length="updateFieldByteLength"
            />
          </div>

          <div v-if="asideVisible" class="resizer" @mousedown="startResize" />

          <div
            ref="asideRef"
            class="editor-aside editor-sidebar-right"
            :class="{ 'aside-collapsed': !asideVisible }"
            :style="{ width: asideVisible ? `${asideWidth}px` : '0' }"
          >
            <EditorAside
              v-if="(selectedField || asideVisible) && currentPacket"
              :selected-field="selectedField"
              :comp-options="{ fieldList: currentPacket.fields, packetIndex: null }"
              @close="closeAside"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <CodePreviewDialog
    v-model:visible="codePreviewVisible"
    v-model:current-index="currentFileIndex"
    :comp-options="{
      loading: isGeneratingCode,
      files: generatedFiles
    }"
    @copy="copyCode"
  />

  <PublishDialog
    v-model:visible="publishDialogVisible"
    v-model:active-tab="publishActiveTab"
    :comp-options="{
      activeTab: publishActiveTab,
      currentView: publishCurrentView,
      currentVersion,
      nextVersion,
      impactAnalysisList,
      publishL0Nodes,
      publishL2Context,
      publishL2Hardware,
      publishL2Nodes,
      publishEdgeList,
      affectedNodeList: publishAffectedNodeList
    }"
    @show-level0="publishShowLevel0"
    @show-level2="publishShowLevel2"
    @cancel="publishDialogVisible = false"
    @confirm="confirmPublish"
  />

  <PacketSimulator v-model="simulatorVisible" :packet="currentPacket" />

  <div
    v-if="addFieldMenuVisible"
    class="packet-config-add-field-menu-overlay"
    @click="hideAddFieldMenu"
  />

  <el-popover
    :visible="addFieldMenuVisible"
    placement="bottom-start"
    :show-arrow="false"
    :teleported="true"
    virtual-triggering
    :virtual-ref="addFieldMenuVirtualRef"
    popper-class="packet-config-add-field-menu-popper"
    @update:visible="(v: boolean) => { if (!v) hideAddFieldMenu(); }"
  >
    <AddFieldMenu
      :field-type-list="fieldTypeList"
      @select="addFieldFromMenu"
    />
  </el-popover>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, provide, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { WarningFilled, CircleCloseFilled, Switch, Share, Monitor } from '@element-plus/icons-vue';
import { usePacketConfigStore, type Packet } from '@/stores/packet-config';
import { fieldOptions } from '@/stores/packet-field-options';
import { FIELD_TYPE_ORDER } from '@/constants/field-types';
import EditorAside from './packet-detail-editor/editor-aside/index.vue';
import PacketList from './packet-list/index.vue';
import PacketSimulator from './packet-simulator/index.vue';
import {
  EditorToolbar,
  PacketBasicInfo,
  FieldTypeTree,
  CodePreviewDialog,
  PublishDialog,
  AddFieldMenu,
  PacketFieldList,
} from './components';
import {
  useFieldOperations,
  useFieldTransform,
  usePublishFlow,
  useFieldEditor,
  useSidebarResize,
  usePacketRoute,
  useCodeGeneration,
} from './composables';
import {
  postMessageDraftCreate,
  putMessageDraftUpdate,
} from '@/api/messageManagement';

const route = useRoute();
const router = useRouter();
const packetStore = usePacketConfigStore();

const isViewMode = computed(() => route.query.mode === 'view');

const currentPacket = ref<Packet | null>(null);
const hasUnsavedChanges = ref(false);
const lastSavedPacket = ref<string>('');

const panels = reactive({
  basicInfo: { expanded: false },
  protocolContent: { expanded: true },
});

const filterInfo = ref({ keyword: '', hierarchy_node_id: '', status: '' });
const selectedInfo = ref({ ids: [] as string[], selectAll: false });
const pageInfo = ref({ current_page: 1, page_size: 20, total: 0 });

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

const fieldTypeList = computed(() => {
  const options = Object.values(fieldOptions);
  return options.sort((a, b) => {
    const indexA = FIELD_TYPE_ORDER.indexOf(a.fieldType as any);
    const indexB = FIELD_TYPE_ORDER.indexOf(b.fieldType as any);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.field_name.localeCompare(b.field_name);
  });
});

const formattedFieldTypeList = computed(() => fieldTypeList.value);

const simulatorVisible = ref(false);

const {
  showDetailView,
  currentVersion,
  nextVersion,
  handleRouteChange,
  createRevisionDraft,
} = usePacketRoute({
  currentPacket,
  hasUnsavedChanges,
  lastSavedPacket,
  isViewMode,
  onPacketLoaded: () => {
    panels.basicInfo.expanded = route.query.mode === 'add';
  },
});

const { convertLoadedDataToUIFormat, filterPacketFields, validateFields, formatValidationErrors } = useFieldTransform();

const fieldOps = useFieldOperations({
  currentPacket,
  onFieldUpdated: () => {
    hasUnsavedChanges.value = true;
  },
});

const fieldEditor = useFieldEditor({
  currentPacket,
  findFieldById: fieldOps.findFieldById,
  findFieldParentInfo: fieldOps.findFieldParentInfo,
  collectAllFieldNames: fieldOps.collectAllFieldNames,
  onFieldUpdated: () => {
    hasUnsavedChanges.value = true;
  },
});

const sidebarResize = useSidebarResize();

const {
  codePreviewVisible,
  isGeneratingCode,
  generatedFiles,
  currentFileIndex,
  copyCode,
  handleGenerateCode,
} = useCodeGeneration({
  currentPacket,
  hasUnsavedChanges,
  onSaveBeforeGenerate: async () => {
    await savePacket();
  },
});

const {
  publishDialogVisible,
  publishActiveTab,
  publishCurrentView,
  publishAffectedNodeList,
  handlePublish,
  confirmPublish,
  handleDiscardDraft,
} = usePublishFlow({
  currentPacket,
  isViewMode,
  hasUnsavedChanges,
  onSaveAndPublish: async () => {
    await savePacket();
  },
  onPublishSuccess: (version, id) => {
    router.replace({
      path: '/packet-config',
      query: { mode: 'view', id: String(id) }
    });
  },
});

const publishL0Nodes = ref([
  { id: 'sys_car', name: '智能汽车', x: 400, y: 250 },
  { id: 'sys_cloud', name: '车企云平台', x: 400, y: 80 },
  { id: 'sys_app', name: '手机 App', x: 650, y: 250 }
]);

const publishL2Context = ref([
  { id: 'ctx_cloud', name: '车企云平台', x: 400, y: 40 },
  { id: 'ctx_app', name: '手机 App', x: 700, y: 220 }
]);

const publishL2Hardware = ref([
  { id: 'hw_cockpit', name: '座舱域控制器 (8295)', x: 120, y: 150 },
  { id: 'hw_adas', name: '智驾域控制器 (Orin)', x: 120, y: 320 },
  { id: 'hw_gateway', name: '中央网关 (NXP)', x: 400, y: 150 }
]);

const publishL2Nodes = ref([
  { id: 'sw_hmi', name: 'HMI 交互界面', parent: 'hw_cockpit' },
  { id: 'sw_nav', name: '导航引擎', parent: 'hw_cockpit' },
  { id: 'sw_plan', name: '规划控制算法', parent: 'hw_adas' },
  { id: 'sw_percept', name: '视觉感知', parent: 'hw_adas' },
  { id: 'sw_tbox', name: 'T-Box 通信服务', parent: 'hw_gateway' },
  { id: 'sw_route', name: '路由转发', parent: 'hw_gateway' }
]);

const publishEdgeList = ref([
  { source: 'sys_car', target: 'sys_cloud', label: 'MQTT/4G', proto: 'mqtt', view: 'l0' },
  { source: 'sys_app', target: 'sys_cloud', label: 'HTTPS', proto: 'https', view: 'l0' },
  { source: 'sw_hmi', target: 'sw_route', label: 'SOME/IP', proto: 'someip', view: 'l2' },
  { source: 'sw_plan', target: 'sw_route', label: 'SOME/IP', proto: 'someip', view: 'l2' },
  { source: 'sw_tbox', target: 'ctx_cloud', label: 'MQTT (遥测)', proto: 'mqtt', view: 'l2' },
  { source: 'ctx_app', target: 'ctx_cloud', label: 'HTTPS', proto: 'https', view: 'l2' }
]);

const impactAnalysisList = computed(() => {
  return [
    {
      type: 'protocol',
      icon: 'Share',
      name: 'MQTT 协议变更',
      level: 'high',
      levelText: '高影响',
      description: '车云通信协议升级，影响遥测数据传输和远程控制功能。',
      affectedList: ['T-Box 通信服务', '车企云平台', '智能汽车']
    },
    {
      type: 'hardware',
      icon: 'Monitor',
      name: '中央网关 (NXP)',
      level: 'medium',
      levelText: '中影响',
      description: '网关固件需要同步更新以支持新的协议版本。',
      affectedList: ['路由转发', 'T-Box 通信服务']
    },
    {
      type: 'node',
      icon: 'Switch',
      name: 'HMI 交互界面',
      level: 'low',
      levelText: '低影响',
      description: '界面需要更新状态显示逻辑以反映新协议状态。',
      affectedList: ['导航引擎']
    }
  ];
});

watch(() => route.query, (newQuery) => {
  const mode = newQuery.mode as string | undefined;
  const id = newQuery.id as string | undefined;
  handleRouteChange(mode, id);
}, { immediate: true });

watch(
  () => currentPacket.value,
  (newVal) => {
    if (isViewMode.value) {
      hasUnsavedChanges.value = false;
      return;
    }
    if (newVal && lastSavedPacket.value) {
      const currentState = JSON.stringify(newVal);
      hasUnsavedChanges.value = currentState !== lastSavedPacket.value;
    }
  },
  { deep: true }
);

/**
 * 保存报文
 * @returns {Promise<void>}
 */
async function savePacket() {
  if (!currentPacket.value) return;
  if (isViewMode.value) {
    ElMessage.warning('已发布版本为只读，请创建修订草稿后再保存');
    return;
  }

  if (!Array.isArray(currentPacket.value.fields)) {
    currentPacket.value.fields = [];
  }

  const validationErrors = validateFields(currentPacket.value.fields);
  if (validationErrors.length > 0) {
    const errorMessage = formatValidationErrors(validationErrors);
    console.warn('字段校验失败:', validationErrors);
    ElMessageBox.alert(
      `<div style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${errorMessage}</div>`,
      '字段校验失败',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了',
        type: 'warning',
        icon: h(WarningFilled, { style: 'font-size: 22px; color: #faad14;' }),
      }
    );
    return;
  }

  try {
    const filteredPacket = filterPacketFields(currentPacket.value);
    const result = filteredPacket;
    const isAddMode = route.query.mode === 'add';

    if (isAddMode) {
      const response = await postMessageDraftCreate(result);
      if (response?.status !== 'success' || !response.datum?.id) {
        throw new Error(response?.message || '创建草稿失败');
      }
      currentPacket.value = response.datum as Packet;
      lastSavedPacket.value = JSON.stringify(currentPacket.value);
      hasUnsavedChanges.value = false;
      await router.replace({ path: '/packet-config', query: { mode: 'edit', id: currentPacket.value.id } });
    } else {
      const response = await putMessageDraftUpdate(currentPacket.value.id, result);
      if (response?.status !== 'success') {
        throw new Error(response?.message || '保存草稿失败');
      }
      const { getMessageDraftDetail } = await import('@/api/messageManagement');
      const detailResponse = await getMessageDraftDetail(currentPacket.value.id);
      if (detailResponse?.status !== 'success' || !detailResponse.datum?.id) {
        throw new Error(detailResponse?.message || '重新加载草稿详情失败');
      }
      const reloadedData = detailResponse.datum;
      if (reloadedData.fields && Array.isArray(reloadedData.fields) && reloadedData.fields.length > 0) {
        reloadedData.fields = convertLoadedDataToUIFormat(reloadedData.fields);
      }
      currentPacket.value = reloadedData as Packet;
      lastSavedPacket.value = JSON.stringify(currentPacket.value);
      hasUnsavedChanges.value = false;
    }
    ElMessage.success({ message: '保存成功', plain: true });
  } catch (err: any) {
    console.error('保存报文失败:', err);
    ElMessage.error({ message: '保存失败: ' + (err.response?.data?.message || err.message || '未知错误'), plain: true });
  }
}

/**
 * 显示仿真器
 * @returns {void}
 */
function showSimulator() {
  if (!currentPacket.value) {
    ElMessage.warning('请先选择或创建一个报文');
    return;
  }
  simulatorVisible.value = true;
}

/**
 * 编辑报文
 * @param {any} packet - 报文对象
 * @returns {void}
 */
function editPacket(packet: any) {
  if (packet && typeof packet === 'object') {
    if (packet.publish_status === 1) {
      router.push({
        path: '/packet-config',
        query: { mode: 'view', id: packet.id },
      });
      return;
    }
  }
  router.push({
    path: '/packet-config',
    query: { mode: 'edit', id: packet.id },
  });
}

/**
 * 返回列表页
 * @returns {void}
 */
function backToList() {
  router.push({ path: '/packet-config' });
}

/**
 * 取消编辑
 * @returns {void}
 */
function cancelEdit() {
  if (isViewMode.value) {
    backToList();
    return;
  }
  if (!hasUnsavedChanges.value) {
    backToList();
    return;
  }

  ElMessageBox.confirm('当前修改尚未保存，确定放弃？', '放弃更改', {
    confirmButtonText: '继续',
    cancelButtonText: '放弃',
    type: 'warning',
    customClass: 'confirm-dialog-brand',
    icon: h(WarningFilled, { style: 'font-size: 22px; color: #faad14;' }),
  }).catch(() => backToList());
}

/**
 * 更新基本信息字段
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 * @returns {void}
 */
function updateBasicInfoField(field: string, value: any) {
  if (!currentPacket.value) return;
  if (field === 'name') {
    currentPacket.value.name = value;
  } else if (field === 'default_byte_order') {
    currentPacket.value.default_byte_order = value;
  } else if (field === 'struct_alignment') {
    currentPacket.value.struct_alignment = value;
  } else if (field === 'description') {
    currentPacket.value.description = value;
  }
  hasUnsavedChanges.value = true;
}

/**
 * 选择字段
 * @param {number} index - 字段索引
 * @returns {void}
 */
function selectField(index: number) {
  fieldOps.selectField(index);
  if (!sidebarResize.asideVisible.value) {
    sidebarResize.openAside();
  }
}

/**
 * 添加字段到末尾
 * @param {any} fieldType - 字段类型
 * @returns {void}
 */
function addFieldToEnd(fieldType: any) {
  fieldOps.addFieldToEnd(fieldType);
}

/**
 * 克隆字段类型
 * @param {any} fieldType - 字段类型
 * @returns {any} 克隆的字段类型
 */
function cloneFieldType(fieldType: any) {
  return fieldOps.cloneFieldType(fieldType);
}

/**
 * 处理字段添加
 * @param {any} evt - 事件对象
 * @returns {Promise<void>}
 */
async function handleFieldAdd(evt: any) {
  await fieldOps.handleFieldAdd(evt);
}

/**
 * 处理字段重新排序
 * @param {any[]} newFlattenedFields - 新的扁平化字段列表
 * @returns {void}
 */
function handleFieldReorder(newFlattenedFields: any[]) {
  fieldOps.handleFieldReorder(newFlattenedFields);
}

/**
 * 通过扁平索引移除字段
 * @param {number} flatIndex - 扁平索引
 * @returns {Promise<void>}
 */
async function removeFieldByFlatIndex(flatIndex: number) {
  await fieldOps.removeFieldByFlatIndex(flatIndex);
}

/**
 * 处理字段双击
 * @param {number} index - 字段索引
 * @returns {void}
 */
function handleFieldDoubleClick(index: number) {
  selectField(index);
}

/**
 * 切换字段展开状态
 * @param {string} fieldId - 字段 ID
 * @returns {void}
 */
function toggleFieldExpanded(fieldId: string) {
  fieldOps.toggleFieldExpanded(fieldId);
}

/**
 * 更新字段名称
 * @param {string} fieldId - 字段 ID
 * @param {string} value - 新字段名
 * @returns {void}
 */
function updateFieldName(fieldId: string, value: string) {
  if (!currentPacket.value?.fields) return;
  const field = fieldOps.findFieldById(currentPacket.value.fields, fieldId);
  if (field) {
    (field as any).field_name = value;
    hasUnsavedChanges.value = true;
  }
}

/**
 * 更新字段长度
 * @param {string | undefined} fieldId - 字段 ID
 * @param {number} value - 新长度值
 * @returns {void}
 */
function updateFieldLength(fieldId: string | undefined, value: number) {
  fieldEditor.setRealFieldLength(fieldId, value);
  hasUnsavedChanges.value = true;
}

/**
 * 更新字段字节长度
 * @param {string | undefined} fieldId - 字段 ID
 * @param {number} value - 新字节长度值
 * @returns {void}
 */
function updateFieldByteLength(fieldId: string | undefined, value: number) {
  fieldEditor.setRealFieldByteLength(fieldId, value);
  hasUnsavedChanges.value = true;
}

/**
 * 显示添加字段菜单
 * @param {MouseEvent} event - 鼠标事件
 * @param {string} parentId - 父字段 ID
 * @returns {void}
 */
function showAddFieldMenu(event: MouseEvent, parentId: string) {
  fieldEditor.showAddFieldMenu(event, parentId);
}

/**
 * 隐藏添加字段菜单
 * @returns {void}
 */
function hideAddFieldMenu() {
  fieldEditor.hideAddFieldMenu();
}

/**
 * 从菜单添加字段
 * @param {string} fieldType - 字段类型
 * @returns {Promise<void>}
 */
async function addFieldFromMenu(fieldType: string) {
  await fieldEditor.addFieldFromMenu(fieldType, fieldOps.addFieldToContainer, (ft: string) => fieldOps.cloneFieldType(fieldOptions[ft]));
}

/**
 * 开始调整大小
 * @param {MouseEvent} e - 鼠标事件
 * @returns {void}
 */
function startResize(e: MouseEvent) {
  sidebarResize.startResize(e);
}

/**
 * 关闭侧边栏
 * @returns {void}
 */
function closeAside() {
  sidebarResize.closeAside();
}

/**
 * 显示 L0 发布视图
 * @returns {void}
 */
function publishShowLevel0() {
  publishCurrentView.value = 'l0';
}

/**
 * 显示 L2 发布视图
 * @returns {void}
 */
function publishShowLevel2() {
  publishCurrentView.value = 'l2';
  publishAffectedNodeList.value = ['sw_tbox', 'ctx_cloud', 'hw_gateway'];
}

onMounted(() => {
  pageInfo.value.total = packetStore.packetCount;
});

provide('packetList', () => packetStore.packetList);
provide('hierarchyNodeList', () => []);

const flattenedFields = computed(() => fieldOps.flattenedFields.value);
const selectedField = computed(() => fieldOps.selectedField.value);
const selectedFieldIndex = computed(() => fieldOps.selectedFieldIndex.value);
const asideVisible = computed(() => sidebarResize.asideVisible.value);
const asideWidth = computed(() => sidebarResize.asideWidth.value);
const addFieldMenuVisible = computed(() => fieldEditor.addFieldMenuVisible.value);
const addFieldMenuPosition = computed(() => fieldEditor.addFieldMenuPosition.value);

const addFieldMenuVirtualRef = computed(() => {
  return {
    getBoundingClientRect: () => DOMRect.fromRect({
      x: addFieldMenuPosition.value.x,
      y: addFieldMenuPosition.value.y,
      width: 0,
      height: 0,
    })
  };
});
</script>

<style lang="scss" src="./index.scss"></style>
