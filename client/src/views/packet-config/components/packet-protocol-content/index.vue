<!--
  报文协议内容面板组件
  显示和编辑报文字段列表
-->
<template>
  <div
    class="editor-panel"
    :class="{ 'panel-collapsed': !expanded }"
  >
    <div
      class="panel-header"
      @click="toggleExpanded"
    >
      <h3 class="panel-title">
        <el-icon class="panel-icon"><Tickets /></el-icon>
        报文协议
      </h3>

      <div class="panel-header-right">
        <span v-if="fieldCount > 0" class="field-count">
          共 {{ fieldCount }} 个字段
        </span>

        <span
          class="panel-toggle"
          :class="{ 'panel-toggle-expanded': expanded }"
        >
          <i class="toggle-icon">
            {{ expanded ? '▼' : '▶' }}
          </i>
        </span>
      </div>
    </div>

    <div
      v-show="expanded"
      class="panel-content panel-content-protocol"
    >
      <!-- 空状态 - 拖拽提示 -->
      <div
        v-if="fieldCount === 0"
        class="protocol-drop-zone-empty"
      >
        <VueDraggable
          :model-value="fields"
          group="fields"
          :animation="200"
          ghost-class="field-ghost"
          chosen-class="field-chosen"
          drag-class="field-dragging"
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
      </div>

      <!-- 字段列表 -->
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
          :model-value="flattenedFields"
          group="fields"
          :animation="200"
          handle=".field-drag-handle"
          ghost-class="field-ghost"
          chosen-class="field-chosen"
          drag-class="field-dragging"
          class="field-list-draggable"
          @update:model-value="handleFieldReorder"
          @add="handleFieldAdd"
        >
          <template
            v-for="(field, index) in flattenedFields"
            :key="field.id || index"
          >
            <!-- 占位符 -->
            <div
              v-if="field.isPlaceholder"
              class="placeholder-row"
              :style="{ paddingLeft: `${field.level * 20 + 40}px` }"
              @click="handleAddFieldPlaceholder(field.parentId)"
            >
              <div class="placeholder-line">
                <span class="placeholder-icon" title="点击添加字段">
                  +
                </span>
              </div>
            </div>

            <!-- 普通字段 -->
            <div
              v-else
              :class="[
                'list-item',
                'field-item',
                { 'list-item-selected': selectedIndex === index }
              ]"
              :style="{ paddingLeft: `${field.level * 20}px` }"
              @click="selectField(index)"
              @dblclick="handleFieldDoubleClick(index)"
            >
              <div class="list-cell drag-handle-cell">
                <span
                  v-if="canHaveChildren(field.type)"
                  class="field-expand-toggle"
                  :class="{ expanded: field.expanded }"
                  @click.stop="toggleFieldExpanded(field.id)"
                >
                  {{ field.expanded ? '▼' : '▶' }}
                </span>

                <span class="field-drag-handle">
                  ⋮⋮
                </span>
              </div>

              <div class="list-cell editable-cell name-cell">
                {{ field.name }}
              </div>

              <div class="list-cell type-cell">
                {{ field.type }}
              </div>

              <div class="list-cell length-cell">
                {{ field.byteLength }}
              </div>

              <div class="list-cell action-cell">
                <button
                  class="action-btn"
                  title="删除"
                  @click.stop="deleteField(field.id)"
                >
                  <el-icon><DeleteFilled /></el-icon>
                </button>
              </div>
            </div>
          </template>
        </VueDraggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Tickets, DeleteFilled } from '@element-plus/icons-vue';

interface Field {
  id: string;
  name: string;
  type: string;
  byteLength: number;
  level?: number;
  expanded?: boolean;
  isPlaceholder?: boolean;
  parentId?: string;
}

interface Props {
  expanded?: boolean;
  fields: Field[];
  selectedIndex?: number;
}

interface Emits {
  (e: 'update:expanded', value: boolean): void;
  (e: 'field-add', event: any): void;
  (e: 'field-reorder', fields: Field[]): void;
  (e: 'field-select', index: number): void;
  (e: 'field-double-click', index: number): void;
  (e: 'field-delete', id: string): void;
  (e: 'field-toggle-expand', id: string): void;
  (e: 'add-field-placeholder', parentId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: true,
  selectedIndex: -1
});

const emit = defineEmits<Emits>();

const fieldCount = computed(() => props.fields.length);

/**
 * 扁平化字段列表，将嵌套结构展平并计算层级
 * @returns {Field[]} 扁平化后的字段列表
 */
const flattenedFields = computed(() => {
  /**
   * 递归扁平化字段树
   * @param {Field[]} fields - 字段数组
   * @param {number} level - 当前层级
   * @returns {Field[]} 扁平化后的字段数组
   */
  function flatten(fields: Field[], level = 0): Field[] {
    const result: Field[] = [];
    for (const field of fields) {
      result.push({ ...field, level });
      if (field.expanded && field.children) {
        result.push(...flatten(field.children, level + 1));
      }
      // 添加占位符用于添加子字段
      if (canHaveChildren(field.type)) {
        result.push({
          id: `placeholder-${field.id}`,
          isPlaceholder: true,
          level: level + 1,
          parentId: field.id,
          name: '',
          type: '',
          byteLength: 0
        } as Field);
      }
    }
    return result;
  }
  return flatten(props.fields);
});

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
 * @param {Field[]} fields - 排序后的字段列表
 */
function handleFieldReorder(fields: Field[]) {
  emit('field-reorder', fields);
}

/**
 * 选中指定索引的字段
 * @param {number} index - 字段索引
 */
function selectField(index: number) {
  emit('field-select', index);
}

/**
 * 处理字段双击事件
 * @param {number} index - 字段索引
 */
function handleFieldDoubleClick(index: number) {
  emit('field-double-click', index);
}

/**
 * 删除指定字段
 * @param {string} id - 字段ID
 */
function deleteField(id: string) {
  emit('field-delete', id);
}

/**
 * 切换字段展开/收起状态
 * @param {string} id - 字段ID
 */
function toggleFieldExpanded(id: string) {
  emit('field-toggle-expand', id);
}

/**
 * 处理添加字段占位符点击事件
 * @param {string} parentId - 父字段ID
 */
function handleAddFieldPlaceholder(parentId: string) {
  emit('add-field-placeholder', parentId);
}

/**
 * 判断字段类型是否可以包含子字段
 * @param {string} type - 字段类型
 * @returns {boolean} 是否可以包含子字段
 */
function canHaveChildren(type: string): boolean {
  return ['struct', 'union', 'array'].includes(type);
}
</script>

<style lang="scss" src="./index.scss"></style>
