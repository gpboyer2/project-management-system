<!--
  报文字段列表组件
  显示和编辑报文字段列表，支持拖拽、内联编辑、展开/收起等操作
-->
<template>
  <div class="editor-panel" :class="{ 'panel-collapsed': !expanded }">
    <div class="panel-header" @click="toggleExpanded">
      <h3 class="panel-title">
        <el-icon class="panel-icon"><Tickets /></el-icon>
        报文协议
      </h3>

      <div class="panel-header-right">
        <span v-if="fieldCount > 0" class="field-count">
          共 {{ fieldCount }} 个字段
        </span>

        <span class="panel-toggle" :class="{ 'panel-toggle-expanded': expanded }">
          <i class="toggle-icon">
            {{ expanded ? '▼' : '▶' }}
          </i>
        </span>
      </div>
    </div>

    <div v-show="expanded" class="panel-content">
      <div
        v-if="isEmpty"
        class="protocol-drop-zone-empty"
      >
        <template v-if="!readonly">
          <VueDraggable
            :model-value="fields"
            group="fields"
            :animation="dragOptions.animation"
            :ghost-class="dragOptions.ghostClass"
            :chosen-class="dragOptions.chosenClass"
            :drag-class="dragOptions.dragClass"
            class="empty-drop-zone"
            @update:model-value="() => {}"
            @add="handleFieldAdd"
          >
            <div class="drop-zone-hint">
              <span class="drop-zone-icon">
                <Rank />
              </span>

              <p>从左侧拖拽字段到此处</p>

              <p class="drop-zone-subhint">
                支持拖拽调整字段顺序
              </p>
            </div>
          </VueDraggable>
        </template>

        <template v-else>
          <div class="drop-zone-hint drop-zone-hint--readonly">
            <span class="drop-zone-icon">
              <Rank />
            </span>
            <p>暂无字段定义</p>
          </div>
        </template>
      </div>

      <div v-else class="protocol-content-list">
        <div class="list-item list-header">
          <div class="list-cell header-cell drag-handle-cell" />

          <div class="list-cell header-cell">
            名称
          </div>

          <div class="list-cell header-cell">
            类型
          </div>

          <div class="list-cell header-cell">
            字节长度
          </div>

          <div class="list-cell header-cell action-cell">
            操作
          </div>
        </div>

        <VueDraggable
          v-if="!readonly"
          :model-value="flattenedFields"
          group="fields"
          :animation="dragOptions.animation"
          handle=".field-drag-handle"
          :ghost-class="dragOptions.ghostClass"
          :chosen-class="dragOptions.chosenClass"
          :drag-class="dragOptions.dragClass"
          class="field-list-draggable"
          @update:model-value="handleFieldReorder"
          @add="handleFieldAdd"
        >
          <template v-for="(field, index) in flattenedFields" :key="field.id || (field.isPlaceholder ? ('placeholder_' + field.parentId) : index)">
            <div
              v-if="field.isPlaceholder"
              class="placeholder-row"
              :data-debug-placeholder-parent-id="field.parentId"
              :data-debug-placeholder-level="field.level || 0"
              @click="$emit('add-field-placeholder', $event, field.parentId)"
            >
              <div class="placeholder-line">
                <span class="placeholder-icon" title="点击添加字段">
                  +
                </span>
              </div>
            </div>

            <div
              v-else
              :class="['list-item', 'field-item', { 'list-item-selected': selectedIndex === index }]"
              :data-debug-field-id="field.id"
              :data-debug-field-type="field.type"
              :data-debug-level="field.level || 0"
              @click="$emit('field-select', index)"
              @dblclick="$emit('field-double-click', index)"
            >
              <div class="list-cell drag-handle-cell">
                <span
                  v-if="canHaveChildren(field.type)"
                  class="field-expand-toggle"
                  :class="{ expanded: field.expanded }"
                  @click.stop="$emit('field-toggle-expand', field.id)"
                >
                  {{ field.expanded ? '▼' : '▶' }}
                </span>

                <span class="field-drag-handle">
                  ⋮⋮
                </span>
              </div>

              <div class="list-cell editable-cell name-cell" :style="{ paddingLeft: `${(field.level || 0) * 24}px` }" @dblclick="startEditCell(field, 'name', $event)">
                <template v-if="editingCell?.fieldId === field.id && editingCell?.column === 'name'">
                  <input
                    :value="editingValue"
                    type="text"
                    class="cell-input"
                    @input="onEditInputChange($event)"
                    @blur="saveEditCell"
                    @keydown="handleEditKeydown"
                  />
                </template>

                <template v-else>
                  <span class="field-name-text">
                    {{ field.field_name || fieldOptions[field.type || '']?.field_name || '未命名' }}
                  </span>
                </template>
              </div>

              <div class="list-cell">
                <span
                  class="type-tag"
                  :style="{
                    backgroundColor: fieldOptions[field.type || '']?.icon_bg_color || '#f5f5f5',
                    color: fieldOptions[field.type || '']?.icon_color || '#666',
                  }"
                >
                  <el-icon><component :is="getFieldTypeIcon(fieldOptions[field.type || '']?.icon)" /></el-icon>
                  {{ fieldOptions[field.type || '']?.field_name || field.type || '' }}
                </span>
              </div>

              <div class="list-cell length-cell">
                <template v-if="!showByteLengthInTable(field.type)">
                  <span class="field-byte-length">
                    -
                  </span>
                </template>

                <template v-else-if="needsLengthField(field.type)">
                  <input
                    :value="getRealFieldLength(field.id)"
                    type="number"
                    min="0"
                    class="cell-input"
                    placeholder="0=变长"
                    title="请输入字符串长度，0表示变长字符串"
                    @input="handleRealFieldLengthInput(field.id, $event)"
                  />
                </template>

                <template v-else-if="getByteLengthOptions(field.type) === null">
                  <input
                    :value="getRealFieldByteLength(field.id)"
                    type="number"
                    min="1"
                    class="cell-input"
                    placeholder="字节数"
                    @input="handleRealFieldByteLengthInput(field.id, $event)"
                  />
                </template>

                <template v-else-if="getByteLengthOptions(field.type)?.length">
                  <el-select
                    :model-value="getRealFieldByteLength(field.id)"
                    size="small"
                    style="width: 80px"
                    placeholder="-"
                    @update:model-value="handleRealFieldByteLengthSelect(field.id, $event)"
                  >
                    <el-option
                      v-for="opt in getByteLengthOptions(field.type) || []"
                      :key="opt"
                      :label="opt"
                      :value="opt"
                    />
                  </el-select>
                </template>

                <template v-else>
                  <span class="field-byte-length">
                    -
                  </span>
                </template>
              </div>

              <div class="list-cell action-cell">
                <el-tooltip content="删除字段" placement="top">
                  <el-button
                    link
                    type="danger"
                    :icon="Delete"
                    @click.stop="$emit('field-delete', index)"
                  />
                </el-tooltip>
              </div>
            </div>
          </template>
        </VueDraggable>

        <template v-else>
          <template v-for="(field, index) in flattenedFields" :key="field.id || index">
            <div
              v-if="!field.isPlaceholder"
              :class="['list-item', 'field-item', { 'list-item-selected': selectedIndex === index }]"
              @click="$emit('field-select', index)"
            >
              <div class="list-cell drag-handle-cell">
                <span
                  v-if="canHaveChildren(field.type)"
                  class="field-expand-toggle"
                  :class="{ expanded: field.expanded }"
                  @click.stop="$emit('field-toggle-expand', field.id)"
                >
                  {{ field.expanded ? '▼' : '▶' }}
                </span>
              </div>

              <div class="list-cell name-cell" :style="{ paddingLeft: `${(field.level || 0) * 24}px` }">
                <span class="field-name-text">
                  {{ field.field_name || fieldOptions[field.type || '']?.field_name || '未命名' }}
                </span>

                <span
                  v-if="getStructChildCount(field) > 0"
                  class="struct-child-badge"
                >
                  含{{ getStructChildCount(field) }}个字段
                </span>
              </div>

              <div class="list-cell">
                <span
                  class="type-tag"
                  :style="{
                    backgroundColor: fieldOptions[field.type || '']?.icon_bg_color || '#f5f5f5',
                    color: fieldOptions[field.type || '']?.icon_color || '#666',
                  }"
                >
                  <el-icon><component :is="getFieldTypeIcon(fieldOptions[field.type || '']?.icon)" /></el-icon>
                  {{ fieldOptions[field.type || '']?.field_name || field.type || '' }}
                </span>
              </div>

              <div class="list-cell length-cell">
                <template v-if="!showByteLengthInTable(field.type)">
                  <span class="field-byte-length">-</span>
                </template>
                <template v-else-if="needsLengthField(field.type)">
                  <span class="field-byte-length">{{ getRealFieldLength(field.id) }}</span>
                </template>
                <template v-else>
                  <span class="field-byte-length">{{ getRealFieldByteLength(field.id) }}</span>
                </template>
              </div>

              <div class="list-cell action-cell" />
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Delete, Tickets, QuestionFilled } from '@element-plus/icons-vue';
import { fieldOptions as defaultFieldOptions } from '@/stores/packet-field-options';
import { getFieldTypeIcon } from '@/utils/iconUtils';
import type { PacketField } from '@/stores/packet-config';

interface CompOptions {
  fieldOptions?: Record<string, any>;
  dragOptions?: {
    animation?: number;
    ghostClass?: string;
    chosenClass?: string;
    dragClass?: string;
  };
  uiOptions?: {
    showFieldCount?: boolean;
    showEmptyHint?: boolean;
  };
}

interface Props {
  expanded?: boolean;
  readonly?: boolean;
  fields?: PacketField[];
  flattenedFields?: any[];
  selectedFieldIndex?: number;
  compOptions?: CompOptions;
}

interface Emits {
  (e: 'update:expanded', value: boolean): void;
  (e: 'field-add', event: any): void;
  (e: 'field-reorder', fields: any[]): void;
  (e: 'field-select', index: number): void;
  (e: 'field-double-click', index: number): void;
  (e: 'field-delete', index: number): void;
  (e: 'field-toggle-expand', id: string): void;
  (e: 'add-field-placeholder', event: MouseEvent, parentId: string): void;
  (e: 'update-field-name', fieldId: string, value: string): void;
  (e: 'update-field-length', fieldId: string | undefined, value: number): void;
  (e: 'update-field-byte-length', fieldId: string | undefined, value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: true,
  readonly: false,
  fields: () => [],
  flattenedFields: () => [],
  selectedFieldIndex: -1,
  compOptions: () => ({}),
});

// 从 compOptions 中提取常用配置，提供默认值
const fieldOptions = computed(() => props.compOptions?.fieldOptions || defaultFieldOptions);
const dragOptions = computed(() => props.compOptions?.dragOptions || {
  animation: 200,
  ghostClass: 'field-ghost',
  chosenClass: 'field-chosen',
  dragClass: 'field-dragging',
});
// 预留 UI 配置扩展点
const _uiOptions = computed(() => props.compOptions?.uiOptions || {
  showFieldCount: true,
  showEmptyHint: true,
});

const emit = defineEmits<Emits>();

const selectedIndex = computed(() => props.selectedFieldIndex);
const fieldCount = computed(() => props.fields?.length || 0);
const isEmpty = computed(() => fieldCount.value === 0);

const editingCell = ref<{ fieldId: string; column: string } | null>(null);
const editingValue = ref('');

/**
 * 切换面板展开/收起状态
 */
function toggleExpanded() {
  emit('update:expanded', !props.expanded);
}

/**
 * 处理字段添加事件（拖拽添加）
 * @param {any} event - 拖拽事件对象
 */
function handleFieldAdd(event: any) {
  emit('field-add', event);
}

/**
 * 处理字段重新排序事件
 * @param {any[]} fields - 排序后的字段列表
 */
function handleFieldReorder(fields: any[]) {
  emit('field-reorder', fields);
}

/**
 * 判断字段类型是否可以包含子字段
 * @param {string} fieldType - 字段类型
 * @returns {boolean} 是否可以包含子字段
 */
function canHaveChildren(fieldType?: string): boolean {
  return fieldType === 'Struct' || fieldType === 'Array' || fieldType === 'Command';
}

/**
 * 获取结构体类型字段的直接子字段数量
 * @param {any} field - 字段对象
 * @returns {number} 子字段数量，非Struct类型或无效字段返回0
 */
function getStructChildCount(field: any): number {
  if (field?.type !== 'Struct') return 0;
  if (!Array.isArray(field.fields)) return 0;
  return field.fields.length;
}

/**
 * 获取字段类型的字节长度选项
 * @param {string} fieldType - 字段类型
 * @returns {number[] | null} 可选字节数组，无固定选项时返回null
 */
function getByteLengthOptions(fieldType: string) {
  const options: Record<string, number[] | null> = {
    Float: [4, 8],
    Timestamp: [4, 8],
  };
  return options[fieldType] ?? null;
}

/**
 * 判断字段类型是否需要长度字段
 * @param {string} fieldType - 字段类型
 * @returns {boolean} 是否需要长度字段
 */
function needsLengthField(fieldType: string): boolean {
  return fieldType === 'String' || fieldType === 'Bcd';
}

/**
 * 判断是否在表格中显示字节长度
 * @param {string} fieldType - 字段类型
 * @returns {boolean} 是否显示字节长度
 */
function showByteLengthInTable(fieldType?: string): boolean {
  if (!fieldType) return false;
  const noLengthTypes = ['MessageId', 'Command', 'Checksum', 'Padding', 'Reserved', 'Encode', 'Bitfield'];
  return !noLengthTypes.includes(fieldType);
}

/**
 * 获取字段的实际字节长度
 * @param {string} fieldId - 字段ID
 * @returns {number} 字节长度，未找到时返回0
 */
function getRealFieldByteLength(fieldId?: string): number {
  if (!fieldId || !props.fields) return 0;
  const findField = (fields: PacketField[]): PacketField | null => {
    for (const f of fields) {
      if (f.id === fieldId) return f;
      if (f.fields) {
        const found = findField(f.fields);
        if (found) return found;
      }
    }
    return null;
  };
  const field = findField(props.fields);
  return (field as any)?.byte_length || 0;
}

/**
 * 获取字段的实际长度
 * @param {string} fieldId - 字段ID
 * @returns {number} 字段长度，未找到时返回0
 */
function getRealFieldLength(fieldId?: string): number {
  if (!fieldId || !props.fields) return 0;
  const findField = (fields: PacketField[]): PacketField | null => {
    for (const f of fields) {
      if (f.id === fieldId) return f;
      if (f.fields) {
        const found = findField(f.fields);
        if (found) return found;
      }
    }
    return null;
  };
  const field = findField(props.fields);
  return (field as any)?.length || 0;
}

/**
 * 处理字段长度输入事件
 * @param {string | undefined} fieldId - 字段ID
 * @param {Event} event - 输入事件对象
 */
function handleRealFieldLengthInput(fieldId: string | undefined, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value, 10) || 0;
  emit('update-field-length', fieldId, value);
}

/**
 * 处理字段字节长度输入事件
 * @param {string | undefined} fieldId - 字段ID
 * @param {Event} event - 输入事件对象
 */
function handleRealFieldByteLengthInput(fieldId: string | undefined, event: Event) {
  const target = event.target as HTMLInputElement;
  const value = parseInt(target.value, 10) || 1;
  emit('update-field-byte-length', fieldId, value);
}

/**
 * 处理字段字节长度选择事件
 * @param {string | undefined} fieldId - 字段ID
 * @param {unknown} value - 选定的字节长度值
 */
function handleRealFieldByteLengthSelect(fieldId: string | undefined, value: unknown) {
  emit('update-field-byte-length', fieldId, value as number);
}

/**
 * 开始编辑单元格
 * @param {PacketField} field - 要编辑的字段对象
 * @param {'name'} column - 要编辑的列名
 * @param {MouseEvent} event - 鼠标事件对象
 */
function startEditCell(field: PacketField, column: 'name', event: MouseEvent) {
  if (props.readonly) return;
  editingCell.value = { fieldId: field.id!, column };
  editingValue.value = (field as any).field_name || '';
}

/**
 * 处理编辑输入框内容变化
 * @param {Event} event - 输入事件对象
 */
function onEditInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  editingValue.value = target.value;
}

/**
 * 保存单元格编辑内容
 */
function saveEditCell() {
  if (editingCell.value) {
    emit('update-field-name', editingCell.value.fieldId, editingValue.value);
  }
  editingCell.value = null;
  editingValue.value = '';
}

/**
 * 处理编辑框按键事件
 * @param {KeyboardEvent} event - 键盘事件对象
 */
function handleEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveEditCell();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    editingCell.value = null;
    editingValue.value = '';
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
