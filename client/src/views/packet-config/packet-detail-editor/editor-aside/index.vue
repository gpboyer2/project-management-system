<!--
  字段属性编辑器容器组件
  根据字段类型动态加载对应的编辑器子组件
-->
<template>
  <div class="editor-aside-wrapper">
    <div v-if="field" class="editor-aside-detail">
      <FieldEditorHeader @close="$emit('close')" />

      <div class="panel-content" data-key="editor-aside-panel-content">
        <form class="protocol-content-form">
          <!-- 只读模式：禁用整个表单，确保字段属性不可修改 -->
          <fieldset class="protocol-content-fieldset" :disabled="!!compOptions.readonly">
            <!-- 基本信息（所有字段类型通用） -->
            <BasicInfoEditor
              :field="field"
              @update="update"
            />

            <!-- 数值类型属性 -->
            <template v-if="field.type === 'SignedInt' || field.type === 'UnsignedInt'">
              <NumericFieldEditor
                :field="field"
                @update="update"
                @remove="remove"
                @add="add"
              />
            </template>

            <!-- 报文标识属性 -->
            <template v-if="field.type === 'MessageId'">
              <MessageIdFieldEditor
                :field="field"
                @update="update"
              />
            </template>

            <!-- 浮点型属性 -->
            <template v-if="field.type === 'Float'">
              <FloatFieldEditor
                :field="field"
                @update="update"
                @remove="remove"
                @add="add"
              />
            </template>

            <!-- 编码属性 -->
            <template v-if="field.type === 'Encode'">
              <EncodeFieldEditor
                :field="field"
                @update="update"
                @remove="remove"
                @add="add"
              />
            </template>

            <!-- BCD码属性 -->
            <template v-if="field.type === 'Bcd'">
              <BcdFieldEditor
                :field="field"
                @update="update"
                @remove="remove"
                @add="add"
              />
            </template>

            <!-- 时间戳属性 -->
            <template v-if="field.type === 'Timestamp'">
              <TimestampFieldEditor
                :field="field"
                @update="update"
              />
            </template>

            <!-- 位域属性 -->
            <template v-if="field.type === 'Bitfield'">
              <BitfieldFieldEditor
                :field="field"
                @update="update"
                @remove="remove"
                @add="add"
              />
            </template>

            <!-- 字符串属性 -->
            <template v-if="field.type === 'String'">
              <StringFieldEditor
                :field="field"
                @update="update"
              />
            </template>

            <!-- 数组属性 -->
            <template v-if="field.type === 'Array'">
              <ArrayFieldEditor
                :field="field"
                :fields-before-array="fieldsBeforeArray"
                @update="update"
              />
            </template>

            <!-- 命令字属性 -->
            <template v-if="field.type === 'Command'">
              <CommandFieldEditor
                :field="field"
                @update="update"
              />
            </template>

            <!-- 校验位属性 -->
            <template v-if="field.type === 'Checksum'">
              <ChecksumFieldEditor
                :comp-options="{ field, fieldsBeforeChecksum }"
                @update="update"
              />
            </template>

            <!-- 有效性条件区段 - 通用区段，多种字段类型共用 -->
            <template v-if="supportsValidWhen">
              <ValidWhenEditor
                :field="field"
                :field-list="props.fieldList"
                :is-first-field="isFirstField"
                :field-options-data="fieldOptionsData"
                @update="update"
                @enable-valid-when="handleEnableValidWhen"
              />
            </template>

            <!-- 描述（所有字段类型通用） -->
            <DescriptionEditor
              :field="field"
              @update="update"
            />
          </fieldset>
        </form>
      </div>
    </div>

    <div v-else class="editor-aside-empty">
      <FieldEditorHeader @close="$emit('close')" />

      <div class="panel-content panel-content-empty">
        <p>请点击左侧字段查看详细信息</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePacketConfigStore } from "@/stores/packet-config";
import {
  FieldEditorHeader,
  BasicInfoEditor,
  NumericFieldEditor,
  FloatFieldEditor,
  MessageIdFieldEditor,
  TimestampFieldEditor,
  BcdFieldEditor,
  BitfieldFieldEditor,
  EncodeFieldEditor,
  StringFieldEditor,
  ArrayFieldEditor,
  CommandFieldEditor,
  ChecksumFieldEditor,
  ValidWhenEditor,
  DescriptionEditor
} from "./components";

const packetStore = usePacketConfigStore();

const emit = defineEmits(["close", "update"]);

const props = defineProps<{
  selectedField?: any;
  fieldIndex?: number | null;
  compOptions: {
    fieldList?: any[];
    packetIndex: number | null;
    readonly?: boolean;
  };
}>();

// 第一个字段是否是当前字段类型（用于禁用有效性条件）
const isFirstField = computed(() => {
  return props.compOptions.fieldList && props.compOptions.fieldList[0]?.fieldType === props.selectedField?.type;
});

/**
 * 收集当前字段之前的所有字段（包括嵌套字段）
 * @param {any[]} fieldList - 字段列表
 * @param {string} currentFieldId - 当前字段的ID
 * @returns {any[]} 当前字段之前的所有字段列表
 */
function getFieldsBeforeCurrent(fieldList: any[], currentFieldId: string): any[] {
  if (!Array.isArray(fieldList) || !currentFieldId) return [];

  const result: any[] = [];
  let foundCurrent = false;

  const traverse = (fields: any[], prefix: string = ''): boolean => {
    for (const field of fields) {
      if (field.id === currentFieldId) {
        foundCurrent = true;
        return true;
      }

      const fullName = prefix ? `${prefix}.${field.field_name}` : field.field_name;

      result.push({
        ...field,
        field_name: fullName,
        display_name: fullName
      });

      if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
        const found = traverse(field.fields, fullName);
        if (found) return true;
      }

      if (field.element && field.type === 'Array') {
        const found = traverse([field.element], fullName);
        if (found) return true;
      }
    }

    return false;
  };

  traverse(fieldList);
  return result;
}

// 获取数组字段之前的所有字段（用于动态关联长度选择）
const fieldsBeforeArray = computed(() => {
  if (!props.compOptions.fieldList || !props.selectedField) return [];

  return getFieldsBeforeCurrent(props.compOptions.fieldList, props.selectedField.id);
});

// 获取校验位之前的所有字段（用于校验范围选择）
const fieldsBeforeChecksum = computed(() => {
  if (!props.compOptions.fieldList || !props.selectedField) return [];

  const flattenFields = (fieldList: any[], parentPath: string = ''): { label: string; value: string }[] => {
    const result: { label: string; value: string }[] = [];

    for (const item of fieldList) {
      if (item.id === props.selectedField?.id) {
        break;
      }

      const currentPath = parentPath ? `${parentPath}.${item.field_name}` : item.field_name;

      result.push({
        label: parentPath ? `${currentPath} (${item.field_name})` : item.field_name,
        value: currentPath
      });

      if (item.fields && Array.isArray(item.fields) && item.fields.length > 0) {
        result.push(...flattenFields(item.fields, currentPath));
      }
    }

    return result;
  };

  return flattenFields(props.compOptions.fieldList);
});

// 有效性条件相关
const fieldOptionsData = ref<any[]>([]);

// 支持有效性条件的字段类型列表
const fieldTypesSupportingValidWhen = [
  'SignedInt',
  'UnsignedInt',
  'Float',
  'Bcd',
  'Bitfield',
  'Encode',
  'String',
  'Struct',
  'Array',
  'Command'
];

// 判断当前字段类型是否支持有效性条件
const supportsValidWhen = computed(() => {
  if (!field.value || !field.value.type) return false;
  return fieldTypesSupportingValidWhen.includes(field.value.type);
});

/**
 * 处理有效性条件启用状态变化
 * @param {boolean} enabled - 是否启用有效性条件
 * @returns {void}
 */
function handleEnableValidWhen(enabled: boolean) {
  if (enabled) {
    if (props.compOptions.fieldList && props.selectedField && props.selectedField.id) {
      const result = getFieldsBeforeCurrent(props.compOptions.fieldList, props.selectedField.id);
      fieldOptionsData.value = result;
    }
  } else {
    fieldOptionsData.value = [];
  }
}

// 计算属性：当前编辑的字段
const field = computed<any>(() => {
  if (props.selectedField) {
    if (props.selectedField.id && props.compOptions.fieldList) {
      const findFieldRecursive = (fields: any[], id: string): any => {
        if (!Array.isArray(fields)) return null;
        for (const item of fields) {
          if (item.id === id) return item;
          if (item.fields && Array.isArray(item.fields)) {
            const found = findFieldRecursive(item.fields, id);
            if (found) return found;
          }
        }
        return null;
      };
      const originalField = findFieldRecursive(props.compOptions.fieldList, props.selectedField.id);
      if (originalField) return originalField;
    }
    return props.selectedField;
  }

  if (props.compOptions.packetIndex === null || props.compOptions.packetIndex === undefined) return null;
  if (props.fieldIndex === null || props.fieldIndex === undefined) return null;
  const packet = packetStore.packetList?.[props.compOptions.packetIndex];
  if (!packet || !Array.isArray(packet.fields)) return null;
  return packet.fields[props.fieldIndex];
});

// 监听字段变化，同步更新有效性条件的启用状态
watch(field, (newField: any) => {
  if (!newField) {
    fieldOptionsData.value = [];
    return;
  }

  if (newField.valid_when && newField.valid_when.field) {
    if (props.compOptions.fieldList && newField.id) {
      const result = getFieldsBeforeCurrent(props.compOptions.fieldList, newField.id);
      fieldOptionsData.value = result;
    }
  } else {
    fieldOptionsData.value = [];
  }
}, { immediate: true });

/**
 * 更新字段属性值
 * @param {{ path: string; property: string; value: any }} operation - 更新操作对象，包含路径、属性名和值
 * @returns {void}
 */
function update(operation: { path: string; property: string; value: any }) {
  if (props.compOptions.readonly) return;
  if (!field.value) return;

  if (!operation.path) {
    field.value[operation.property] = operation.value;
    return;
  }

  const parts = operation.path.split(".");
  let target: any = field.value;

  const isArrayIndex = (val: string) => /^\d+$/.test(val);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (isArrayIndex(part)) {
      const idx = Number(part);
      if (!Array.isArray(target)) return;
      if (!target[idx]) target[idx] = {};
      target = target[idx];
      continue;
    }

    if (target[part] === undefined || target[part] === null) {
      const next = parts[i + 1];
      target[part] = next && isArrayIndex(next) ? [] : {};
    }
    target = target[part];
  }

  if (target && typeof target === "object") {
    target[operation.property] = operation.value;
  }
}

/**
 * 在指定路径添加新项
 * @param {{ path: string; item?: any }} operation - 添加操作对象，包含路径和要添加的项
 * @returns {void}
 */
function add(operation: { path: string; item?: any }) {
  if (props.compOptions.readonly) return;
  if (!field.value) return;

  const parts = operation.path.split(".");
  let target: any = field.value;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const isArrayIndex = !isNaN(parseInt(nextKey));

    if (!isNaN(parseInt(key))) {
      const idx = parseInt(key);
      if (!Array.isArray(target)) return;

      if (!target[idx]) target[idx] = {};
      target = target[idx];
    } else {
      if (!target[key]) {
        target[key] = isArrayIndex ? [] : {};
      }
      target = target[key];
    }
  }

  const lastKey = parts[parts.length - 1];

  if (!target[lastKey]) target[lastKey] = [];
  target[lastKey].push(operation.item || {});
}

/**
 * 在指定路径删除项
 * @param {{ path: string; index: number }} operation - 删除操作对象，包含路径和要删除的索引
 * @returns {void}
 */
function remove(operation: { path: string; index: number }) {
  if (props.compOptions.readonly) return;
  if (!field.value) return;
  const parts = operation.path.split(".");
  let target: any = field.value;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const idx = parseInt(part);

    if (!isNaN(idx)) {
      target = target[idx];
    } else {
      if (!target[part]) return;
      target = target[part];
    }

    if (!target) return;
  }

  const last = parts[parts.length - 1];
  if (!target[last] || !Array.isArray(target[last])) return;

  target[last].splice(operation.index, 1);
}
</script>

<style lang="scss" src="./index.scss"></style>
