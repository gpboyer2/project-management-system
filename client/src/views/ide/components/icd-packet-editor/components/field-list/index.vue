<!--
  字段列表组件
  显示报文字段列表，支持拖拽排序、展开/收起、选择等操作
-->
<template>
  <div class="editor-panel">
    <div class="panel-header" @click="$emit('toggle')">
      <h3 class="panel-title">
        <el-icon class="panel-icon"><List /></el-icon>
        字段列表
      </h3>

      <div class="panel-header-right">
        <span v-if="packetData && packetData.fields" class="panel-summary">
          共 {{ state.flattenedFields.filter(f => !f.isPlaceholder).length }} 个字段
        </span>

        <span class="panel-toggle" :class="{ 'panel-toggle-expanded': !expanded }">
          <el-icon>
            <ArrowDown v-if="!expanded" />

            <ArrowRight v-else />
          </el-icon>
        </span>
      </div>
    </div>

    <div v-show="!expanded" class="panel-content">
      <!-- 空状态 -->
      <div
        v-if="packetData && packetData.fields && packetData.fields.length === 0"
        class="protocol-drop-zone-empty"
      >
        <!-- 编辑模式：支持拖拽 -->
        <template v-if="!readonly">
          <VueDraggable
            :model-value="packetData.fields"
            group="fields"
            :animation="200"
            ghost-class="field-ghost"
            chosen-class="field-chosen"
            drag-class="field-dragging"
            class="empty-drop-zone"
            @update:model-value="() => {}"
            @add="$emit('field-add', $event)"
          >
            <div class="drop-zone-hint">
              <span class="drop-zone-icon">
                <Rank />
              </span>

              <p>从右侧拖拽字段到此处</p>

              <p class="drop-zone-subhint">
                支持拖拽调整字段顺序
              </p>
            </div>
          </VueDraggable>
        </template>
        <!-- 只读模式：简单提示 -->
        <template v-else>
          <div class="drop-zone-hint drop-zone-hint--readonly">
            <span class="drop-zone-icon">
              <Document />
            </span>

            <p>暂无字段定义</p>
          </div>
        </template>
      </div>

      <!-- 字段列表 -->
      <div
        v-else-if="packetData && packetData.fields && packetData.fields.length > 0"
        class="field-list-table-wrapper"
      >
        <table class="field-list-table">
          <thead>
            <tr>
              <th v-if="!readonly" class="drag-handle-cell" />

              <th>名称</th>

              <th>类型</th>

              <th>字节长度</th>

              <th v-if="!readonly" class="action-cell">
                操作
              </th>
            </tr>
          </thead>

          <!-- 编辑模式：支持拖拽 -->
          <VueDraggable
            v-if="!readonly"
            :model-value="state.flattenedFields"
            group="fields"
            :animation="200"
            handle=".field-drag-handle"
            ghost-class="field-ghost"
            chosen-class="field-chosen"
            drag-class="field-dragging"
            tag="tbody"
            @update:model-value="$emit('field-reorder', $event)"
            @add="$emit('field-add', $event)"
          >
            <template
              v-for="(field, index) in state.flattenedFields"
              :key="field.id || (field.isPlaceholder ? ('placeholder_' + field.parentId) : index)"
            >
              <!-- 占位符渲染 -->
              <tr
                v-if="field.isPlaceholder"
                class="placeholder-row"
                @click="$emit('show-add-menu', $event, field.parentId)"
              >
                <td :colspan="readonly ? 3 : 4">
                  <div class="placeholder-line">
                    <span class="placeholder-icon" title="点击添加字段">
                      +
                    </span>
                  </div>
                </td>
              </tr>

              <!-- 普通字段渲染 -->
              <tr
                v-else
                :class="{ 'field-row-selected': state.selectedIndex === index }"
                @click="$emit('select', index)"
              >
                <td class="drag-handle-cell">
                  <span
                    v-if="canHaveChildren(field.type)"
                    class="field-expand-toggle"
                    :class="{ expanded: field.expanded }"
                    @click.stop="$emit('toggle-expand', field.id)"
                  >
                    {{ field.expanded ? '▼' : '▶' }}
                  </span>

                  <span class="field-drag-handle">
                    ⋮⋮
                  </span>
                </td>

                <td class="name-cell" @dblclick.stop="$emit('start-editing', field)">
                  <template v-if="state.editingFieldId === field.id && !readonly">
                    <input
                      :ref="(el: any) => { if (el) fieldNameInput = el }"
                      v-model="field.field_name"
                      type="text"
                      class="cell-input field-name-input"
                      placeholder="字段名称"
                      @blur="$emit('finish-editing')"
                      @keydown.enter="$emit('finish-editing')"
                      @click.stop
                    />
                  </template>

                  <template v-else>
                    <el-tooltip
                      content="双击修改名称"
                      placement="top"
                      :disabled="readonly"
                      :show-after="500"
                      :enterable="false"
                    >
                      <span class="field-name-text">
                        {{ field.field_name || '未命名' }}
                      </span>
                    </el-tooltip>
                  </template>
                </td>

                <td class="type-cell">
                  <span
                    class="type-tag"
                    :style="{
                      backgroundColor: fieldOptions[field.type || '']?.icon_bg_color || '#f5f5f5',
                      color: fieldOptions[field.type || '']?.icon_color || '#666'
                    }"
                  >
                    <el-icon>
                      <component :is="getFieldTypeIcon(fieldOptions[field.type || '']?.icon)" />
                    </el-icon>
                    {{ fieldOptions[field.type || '']?.field_name || field.type || '' }}
                  </span>
                </td>

                <td class="length-cell">
                  <template v-if="!showByteLengthInTable(field.type)">
                    <span class="field-byte-length">
                      -
                    </span>
                  </template>

                  <template v-else-if="needsLengthField(field.type)">
                    <input
                      :value="field.length || 0"
                      type="number"
                      min="0"
                      class="cell-input"
                      placeholder="0=变长"
                      @input="$emit('length-input', field.id, $event)"
                    />
                  </template>

                  <template v-else-if="getByteLengthOptions(field.type) === null">
                    <input
                      :value="field.byte_length || 1"
                      type="number"
                      min="1"
                      class="cell-input"
                      placeholder="字节数"
                      @input="$emit('byte-length-input', field.id, $event)"
                    />
                  </template>

                  <template v-else-if="getByteLengthOptions(field.type)?.length">
                    <el-select
                      :model-value="field.byte_length || 1"
                      size="small"
                      style="width: 80px"
                      placeholder="-"
                      @update:model-value="$emit('byte-length-select', field.id, $event)"
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
                </td>

                <td class="action-cell">
                  <el-tooltip content="删除字段" placement="top">
                    <el-button
                      link
                      type="danger"
                      :icon="Delete"
                      @click.stop="$emit('remove', index)"
                    />
                  </el-tooltip>
                </td>
              </tr>
            </template>
          </VueDraggable>

          <!-- 只读模式：静态列表 -->
          <tbody v-else>
            <template
              v-for="(field, index) in state.flattenedFields"
              :key="field.id || index"
            >
              <tr
                v-if="!field.isPlaceholder"
                :class="['field-row', 'field-row--readonly', { 'field-row-selected': state.selectedIndex === index }]"
                @click="$emit('select', index)"
              >
                <td class="name-cell">
                  <span
                    v-if="canHaveChildren(field.type)"
                    class="field-expand-toggle"
                    :class="{ expanded: field.expanded }"
                    @click.stop="$emit('toggle-expand', field.id)"
                  >
                    {{ field.expanded ? '▼' : '▶' }}
                  </span>

                  <span class="field-name-text">
                    {{ field.field_name || '未命名' }}
                  </span>

                  <span
                    v-if="getStructChildCount(field) > 0"
                    class="struct-child-badge"
                  >
                    含{{ getStructChildCount(field) }}个字段
                  </span>
                </td>

                <td class="type-cell">
                  <span
                    class="type-tag"
                    :style="{
                      backgroundColor: fieldOptions[field.type || '']?.icon_bg_color || '#f5f5f5',
                      color: fieldOptions[field.type || '']?.icon_color || '#666'
                    }"
                  >
                    <el-icon>
                      <component :is="getFieldTypeIcon(fieldOptions[field.type || '']?.icon)" />
                    </el-icon>
                    {{ fieldOptions[field.type || '']?.field_name || field.type || '' }}
                  </span>
                </td>

                <td class="length-cell">
                  <span class="field-byte-length">
                    {{ getDisplayByteLength(field) }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FieldListState {
  flattenedFields: any[];
  selectedIndex?: number | null;
  editingFieldId?: string | null;
}

import { ref } from 'vue';
import { Delete, ArrowDown, ArrowRight, List } from '@element-plus/icons-vue';
import { VueDraggable } from 'vue-draggable-plus';
import { fieldOptions } from '@/stores/packet-field-options';
import { canNodeHaveChildren } from '@/utils';
import { showByteLengthInTable, needsLengthField, getByteLengthOptions, getDisplayByteLength } from '@/utils/fieldTypeUtils';
import { getFieldTypeIcon } from '@/utils/iconUtils';

defineProps<{
  packetData: any;
  state: FieldListState;
  readonly?: boolean;
  expanded?: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
  (e: 'field-add', evt: any): void;
  (e: 'field-reorder', fields: any[]): void;
  (e: 'select', index: number): void;
  (e: 'toggle-expand', fieldId: string): void;
  (e: 'start-editing', field: any): void;
  (e: 'finish-editing'): void;
  (e: 'length-input', fieldId: string, evt: Event): void;
  (e: 'byte-length-input', fieldId: string, evt: Event): void;
  (e: 'byte-length-select', fieldId: string, value: number): void;
  (e: 'remove', index: number): void;
  (e: 'show-add-menu', evt: MouseEvent, parentId: string | null): void;
}>();

const fieldNameInput = ref<HTMLInputElement | null>(null);

function canHaveChildren(type?: string): boolean {
  return canNodeHaveChildren(type, ['Struct', 'Array', 'Command']);
}

/**
 * 获取结构体类型字段的直接子字段数量
 * 仅对 Struct 类型返回有效计数，其他类型返回 0
 */
function getStructChildCount(field: any): number {
  if (field?.type !== 'Struct') return 0;
  if (!Array.isArray(field.fields)) return 0;
  return field.fields.length;
}

// 暴露给父组件用于设置字段输入框引用
defineExpose({
  fieldNameInput
});
</script>

<style lang="scss" src="./index.scss"></style>
