<!--
  报文基本信息面板
  可折叠，显示报文名称、版本、字节序、描述
-->
<template>
  <div class="editor-panel" :class="{ 'panel-collapsed': !expanded }">
    <div class="panel-header" @click="$emit('toggle')">
      <h3 class="panel-title">
        <el-icon class="panel-icon"><InfoFilled /></el-icon>
        基本信息
      </h3>

      <div class="panel-header-right">
        <span v-if="packetData" class="panel-summary">
          {{ packetData.name }}
          <span v-if="packetData.version" class="version-tag">
            v{{ packetData.version }}
          </span>
        </span>

        <span class="panel-toggle" :class="{ 'panel-toggle-expanded': expanded }">
          <el-icon>
            <ArrowDown v-if="expanded" />

            <ArrowRight v-else />
          </el-icon>
        </span>
      </div>
    </div>

    <div v-show="expanded && packetData" class="panel-content">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            报文名称
          </label>

          <template v-if="readonly">
            <span class="form-value">
              {{ packetData?.name || '-' }}
            </span>
          </template>

          <template v-else>
            <input
              v-model="packetData.name"
              type="text"
              class="form-control"
              placeholder="请输入报文名称"
            />
          </template>
        </div>

        <div class="form-group">
          <label class="form-label">
            协议版本
          </label>

          <span class="form-value">
            {{ packetData?.version || '-' }}
          </span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            默认字节序
          </label>

          <template v-if="readonly">
            <span class="form-value">
              {{ getByteOrderLabel(packetData?.default_byte_order) }}
            </span>
          </template>

          <template v-else>
            <el-select
              v-model="packetData.default_byte_order"
              placeholder="请选择字节序"
              class="form-control-select"
            >
              <el-option
                v-for="item in byteOrderOptionList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          描述
        </label>

        <template v-if="readonly">
          <span class="form-value form-value-multiline">
            {{ packetData?.description || '-' }}
          </span>
        </template>

        <template v-else>
          <textarea
            v-model="packetData.description"
            class="form-control form-control-textarea"
            rows="2"
            placeholder="请输入报文描述"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowRight, InfoFilled } from '@element-plus/icons-vue';
import { byteOrderOptionList, getByteOrderLabel } from '@/utils/byteOrder';

defineProps<{
  packetData: any;
  readonly?: boolean;
  expanded?: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
