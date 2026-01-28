<!--
  报文结构定义编辑器 (Packet Definition Editor)
  纯 UI 组件，负责报文字段的展示与编辑，支持 readonly 模式
-->
<template>
  <div class="packet-definition-editor">
    <!-- 中间：协议结构区域 -->
    <div class="packet-definition-main">
      <!-- 可滚动内容区域 -->
      <div class="packet-definition-scroll-area">
        <!-- 基本信息面板（与 design/packet-config 完全一致的交互） -->
        <PacketBasicInfo
          v-if="packetData"
          :expanded="basicInfoExpanded"
          :readonly="!!readonly"
          :packet-name="packetData.name || ''"
          :version="String(packetData.version || '')"
          :byte-order="String((packetData as any).default_byte_order || '')"
          :struct-alignment="Number((packetData as any).struct_alignment ?? 1)"
          :description="String((packetData as any).description || '')"
          :byte-order-options="defaultByteOrderOptions"
          :alignment-options="structAlignmentOptions"
          @update:expanded="basicInfoExpanded = $event"
          @update:field="updateBasicInfoField"
        />

        <!-- 字段列表（与 design/packet-config 完全一致的交互） -->
        <PacketFieldList
          :readonly="!!readonly"
          :expanded="fieldListExpanded"
          :fields="(packetData as any)?.fields || []"
          :flattened-fields="flattenedFields"
          :selected-field-index="selectedFieldIndex ?? -1"
          :comp-options="{ fieldOptions }"
          @update:expanded="fieldListExpanded = $event"
          @field-add="handleFieldAdd"
          @field-reorder="handleFieldReorder"
          @field-select="selectField"
          @field-double-click="handleFieldDoubleClickWrapper"
          @field-delete="removeField"
          @field-toggle-expand="toggleFieldExpanded"
          @add-field-placeholder="showAddFieldMenu"
          @update-field-name="handleUpdateFieldName"
          @update-field-length="handleUpdateFieldLength"
          @update-field-byte-length="handleUpdateFieldByteLength"
        />
      </div>
    </div>

    <!-- 右侧：工具箱与属性面板 -->
    <aside class="packet-definition-toolbox">
      <!-- 顶部 Tab 切换：只读模式隐藏 -->
      <div v-if="!readonly" class="ide-toolbox-tabs">
        <button
          class="ide-toolbox-tab"
          :class="{ 'ide-toolbox-tab--active': activeRightTab === 'toolbox' }"
          @click="activeRightTab = 'toolbox'"
        >
          工具箱
        </button>

        <button
          class="ide-toolbox-tab"
          :class="{ 'ide-toolbox-tab--active': activeRightTab === 'properties' }"
          @click="activeRightTab = 'properties'"
        >
          属性
        </button>
      </div>

      <!-- 只读模式：固定显示属性标题 -->
      <div v-else class="ide-toolbox-header">
        <span class="ide-toolbox-header-title">
          字段属性
        </span>
      </div>

      <!-- 工具箱内容：仅编辑模式 -->
      <div v-if="!readonly" v-show="activeRightTab === 'toolbox'" class="ide-toolbox-content">
        <FieldToolbox
          :packet-data="packetData"
          @dblclick="handleFieldDoubleClick"
        />
      </div>

      <!-- 属性面板内容 -->
      <div
        v-show="readonly || activeRightTab === 'properties'"
        class="ide-toolbox-content ide-toolbox-properties"
      >
        <template v-if="selectedField">
          <EditorAside
            :selected-field="selectedField"
            :comp-options="{ fieldList: packetData?.fields || [], packetIndex: null, readonly }"
            @close="selectedFieldIndex = null"
          />
        </template>

        <template v-else>
          <div class="ide-toolbox-empty">
            <svg
              class="ide-toolbox-empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                ry="2"
              />

              <line
                x1="3"
                y1="9"
                x2="21"
                y2="9"
              />

              <line
                x1="9"
                y1="21"
                x2="9"
                y2="9"
              />
            </svg>

            <p>{{ readonly ? '选择一个字段查看属性' : '选择一个字段以编辑属性' }}</p>
          </div>
        </template>
      </div>
    </aside>

    <!-- 添加字段菜单：仅编辑模式 -->
    <div
      v-if="addFieldMenuVisible"
      class="ide-add-field-menu-overlay"
      @click="hideAddFieldMenu"
    />

    <el-popover
      :visible="addFieldMenuVisible"
      placement="bottom-start"
      :show-arrow="false"
      :teleported="true"
      virtual-triggering
      :virtual-ref="addFieldMenuVirtualRef"
      popper-class="ide-add-field-menu-popper"
      @update:visible="(v: boolean) => { if (!v) hideAddFieldMenu(); }"
    >
      <AddFieldMenu @select="addFieldFromMenu" />
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import EditorAside from '@/views/packet-config/packet-detail-editor/editor-aside/index.vue';
import { ElMessage } from 'element-plus';
import { PacketBasicInfo, PacketFieldList } from '@/views/packet-config/components';
import { fieldOptions } from '@/stores/packet-field-options';
import {
  FieldToolbox,
  AddFieldMenu
} from './components';
import { useFieldOperations } from './composables/useFieldOperations';

// Props
const props = defineProps<{
  packetData: any;
  readonly?: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:packetData', value: any): void;
  (e: 'field-select', field: any, index: number | null): void;
}>();

// 使用字段操作 composable
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
  handleFieldDoubleClick,
  updateFieldProperty,
} = useFieldOperations(() => props.packetData, () => props.readonly);

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

// 基本信息面板展开状态
// 与 design/packet-config 对齐：默认收起
const basicInfoExpanded = ref(false);

// 字段列表展开状态（与 design/packet-config 对齐：默认展开）
const fieldListExpanded = ref(true);

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

// 右侧栏激活的Tab
const activeRightTab = ref<'toolbox' | 'properties'>('toolbox');

// 选中的字段
const selectedField = computed(() => {
  if (selectedFieldIndex.value === null) return null;
  const field = flattenedFields.value[selectedFieldIndex.value];
  if (!field) return null;
  if ((field as any).isPlaceholder) return null;
  return field;
});

// 监听选中字段变化，自动切换到属性 Tab（仅编辑模式）
watch(selectedField, (newField) => {
  if (newField && !props.readonly) {
    activeRightTab.value = 'properties';
  }
  emit('field-select', newField, selectedFieldIndex.value);
});

/**
 * 更新基本信息字段
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 * @returns {void} 无返回值
 */
function updateBasicInfoField(field: string, value: any): void {
  if (!props.packetData) return;
  const pkt: any = props.packetData;
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

/**
 * 收集所有字段名称
 * @param {any[]} fieldList - 字段列表
 * @param {Set<string>} names - 字段名称集合
 * @returns {Set<string>} 所有字段名称的集合
 */
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

/**
 * 验证并更新字段名称
 * @param {string} fieldId - 字段ID
 * @param {string} value - 新字段名称
 * @returns {boolean} 是否更新成功
 */
function validateAndUpdateFieldName(fieldId: string, value: string): boolean {
  if (!props.packetData?.fields) return false;
  const field = findFieldById(props.packetData.fields as any, fieldId) as any;
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

  const existing = collectAllFieldNames(props.packetData.fields as any);
  existing.delete(oldName);
  if (existing.has(newName)) {
    ElMessage.warning(`字段名称 "${newName}" 已存在，请使用其他名称`);
    return false;
  }

  field.field_name = newName;
  return true;
}

/**
 * 处理更新字段名称
 * @param {string} fieldId - 字段ID
 * @param {string} value - 新字段名称
 * @returns {void} 无返回值
 */
function handleUpdateFieldName(fieldId: string, value: string): void {
  validateAndUpdateFieldName(fieldId, value);
}

/**
 * 处理更新字段长度
 * @param {string | undefined} fieldId - 字段ID
 * @param {number} value - 新长度值
 * @returns {void} 无返回值
 */
function handleUpdateFieldLength(fieldId: string | undefined, value: number): void {
  if (!fieldId) return;
  updateFieldProperty(fieldId, 'length', value);
}

/**
 * 处理更新字段字节长度
 * @param {string | undefined} fieldId - 字段ID
 * @param {number} value - 新字节长度值
 * @returns {void} 无返回值
 */
function handleUpdateFieldByteLength(fieldId: string | undefined, value: number): void {
  if (!fieldId) return;
  updateFieldProperty(fieldId, 'byte_length', value);
}

/**
 * 处理字段双击包装器
 * @param {number} index - 字段索引
 * @returns {void} 无返回值
 */
function handleFieldDoubleClickWrapper(index: number): void {
  selectField(index);
}

/**
 * 选择字段
 * @param {number} index - 字段索引
 * @returns {void} 无返回值
 */
function selectField(index: number): void {
  const field = flattenedFields.value[index];
  if ((field as any)?.isPlaceholder) return;
  selectedFieldIndex.value = index;
}

</script>

<style lang="scss" src="./index.scss"></style>
