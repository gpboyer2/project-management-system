<!--
  报文基本信息面板组件
  显示和编辑报文的基本信息
-->
<template>
  <div
    class="editor-panel"
    :class="{ 'panel-collapsed': !expanded }"
  >
    <div class="panel-header" @click="toggleExpanded">
      <h3 class="panel-title">
        <el-icon class="panel-icon"><InfoFilled /></el-icon>
        基本信息
      </h3>

      <div class="panel-header-right">
        <span v-if="!expanded" class="panel-summary">
          {{ packetName }} <span class="version-tag">
            v{{ displayVersion }}
          </span>
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

    <div v-show="expanded" class="panel-content">
      <template v-if="readonlyDisplay">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              报文名称
            </label>
            <div class="form-value">
              {{ packetName || '-' }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              协议版本
            </label>
            <div class="form-value">
              {{ displayVersion || '-' }}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              默认字节序
            </label>
            <div class="form-value">
              {{ getOptionLabel(byteOrderOptions, byteOrder) }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              结构体字节对齐
            </label>
            <div class="form-value">
              {{ getOptionLabel(alignmentOptions, structAlignment) }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            描述
          </label>
          <div class="form-value form-value-textarea">
            {{ description || '-' }}
          </div>
        </div>
      </template>

      <template v-else>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="packet-name">
              报文名称
            </label>

            <input
              id="packet-name"
              :value="packetName"
              type="text"
              class="form-control"
              placeholder="请输入报文名称"
              :readonly="readonly"
              @input="handleUpdate('name', $event)"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="packet-version">
              协议版本
            </label>

            <input
              id="packet-version"
              :value="displayVersion"
              type="text"
              class="form-control"
              placeholder="发布时自动生成版本号"
              readonly
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="packet-byte-order">
              默认字节序
            </label>

            <el-select
              id="packet-byte-order"
              :model-value="byteOrder"
              placeholder="请选择默认字节序"
              class="form-control-select"
              :disabled="readonly"
              @change="handleUpdate('default_byte_order', $event)"
            >
              <el-option
                v-for="item in byteOrderOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <div class="form-group">
            <label class="form-label" for="packet-alignment">
              结构体字节对齐
            </label>

            <el-select
              id="packet-alignment"
              :model-value="structAlignment"
              placeholder="请选择结构体字节对齐"
              class="form-control-select"
              :disabled="readonly"
              @change="handleUpdate('struct_alignment', $event)"
            >
              <el-option
                v-for="item in alignmentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="packet-description">
            描述
          </label>

          <textarea
            id="packet-description"
            :value="description"
            class="form-control form-control-textarea"
            rows="3"
            placeholder="请输入报文描述"
            :readonly="readonly"
            @input="handleUpdate('description', $event)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';

interface ByteOrderOption {
  label: string;
  value: string;
}

interface AlignmentOption {
  label: string;
  value: number;
}

interface Props {
  expanded?: boolean;
  readonly?: boolean;
  readonlyDisplay?: boolean;
  packetName: string;
  version: string;
  byteOrder: string;
  structAlignment: number;
  description: string;
  byteOrderOptions: ByteOrderOption[];
  alignmentOptions: AlignmentOption[];
}

interface Emits {
  (e: 'update:expanded', value: boolean): void;
  (e: 'update:field', field: string, value: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: true,
  readonly: false,
  readonlyDisplay: false
});

const emit = defineEmits<Emits>();

/**
 * 计算显示版本号
 * @returns {string} 版本号字符串，未发布时显示 '-'
 */
const displayVersion = computed(() => {
  return props.version === '0.0' ? '-' : props.version;
});

/**
 * 从选项列表中获取指定值的标签
 * @param {{ value: string | number; label: string }[]} list - 选项列表
 * @param {string | number} value - 要查找的值
 * @returns {string} 对应的标签，未找到时返回 '-'
 */
function getOptionLabel(list: { value: string | number; label: string }[], value: string | number) {
  const found = list.find((item) => item.value === value);
  return found ? found.label : '-';
}

/**
 * 切换面板展开/收起状态
 */
function toggleExpanded() {
  emit('update:expanded', !props.expanded);
}

/**
 * 处理字段更新事件
 * @param {string} field - 字段名称
 * @param {any} event - 事件对象或新值
 */
function handleUpdate(field: string, event: any) {
  const value = event.target?.value ?? event;
  emit('update:field', field, value);
}
</script>

<style lang="scss" src="./index.scss"></style>
