<!--
  逻辑编辑器工具箱组件
  Tab切换：工具箱/属性
  展示当前节点接口、逻辑与编解码、数据传输节点
-->
<template>
  <div v-show="activeTab === 'toolbox'" class="ide-toolbox-content ide-toolbox-content--no-padding">
    <div class="ide-logic-toolbox ide-logic-toolbox--card-style">
      <!-- 当前节点接口 -->
      <div class="logic-card-section">
        <div class="logic-card-section-title">
          <span>当前节点接口</span>
        </div>

        <div class="logic-card-grid">
          <div
            v-for="iface in options.contextInputList"
            :key="iface.id || iface.name"
            class="logic-card-item"
            :title="iface.detail || iface.type || iface.name"
            @dragstart.prevent
            @mousedown.prevent="handleInterfaceDragStart(iface, $event)"
          >
            <div class="logic-card-icon" :class="getInterfaceIconClass(iface.category)">
              <component :is="getInterfaceIconName(iface.category)" />
            </div>

            <div class="logic-card-info">
              <div class="logic-card-name">
                {{ iface.name }}
              </div>

              <div class="logic-card-meta">
                {{ iface.type || iface.category }} • interface
              </div>
            </div>
          </div>

          <div v-if="options.contextInputList.length === 0" class="logic-card-empty">
            暂无接口配置
          </div>
        </div>
      </div>

      <!-- 逻辑与编解码 -->
      <div class="logic-card-section">
        <div class="logic-card-section-title">
          <span>逻辑与编解码</span>
        </div>

        <div class="logic-card-grid">
          <div
            v-for="node in options.processingNodes"
            :key="node.type"
            class="logic-card-item"
            :data-palette-type="node.type"
            :data-palette-label="node.label"
            @dragstart.prevent
            @mousedown.prevent="handleNodeDragStart(node, $event)"
          >
            <div class="logic-card-icon logic-card-icon--processing">
              <component :is="getProcessingIcon(node.type)" />
            </div>

            <div class="logic-card-info">
              <div class="logic-card-name">
                {{ node.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据传输 -->
      <div class="logic-card-section">
        <div class="logic-card-section-title">
          <span>数据传输</span>
        </div>

        <div class="logic-card-grid">
          <div
            v-for="node in options.communicationNodes"
            :key="node.type"
            class="logic-card-item"
            :data-palette-type="node.type"
            :data-palette-label="node.label"
            @dragstart.prevent
            @mousedown.prevent="handleNodeDragStart(node, $event)"
          >
            <div class="logic-card-icon logic-card-icon--communication">
              <component :is="getCommunicationIcon(node.type)" />
            </div>

            <div class="logic-card-info">
              <div class="logic-card-name">
                {{ node.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getInterfaceIconClass,
  getInterfaceIconName,
  getProcessingIcon,
  getCommunicationIcon
} from '@/utils/iconUtils';

interface LogicNode {
  type: string
  label: string
}

interface InterfaceInfo {
  id?: string
  name: string
  type?: string
  category?: string
  detail?: string
}

interface ToolboxOptions {
  contextInputList: InterfaceInfo[]
  processingNodes: LogicNode[]
  communicationNodes: LogicNode[]
}

const { compOptions: options } = defineProps<{
  activeTab: string
  compOptions: ToolboxOptions
}>();

const emit = defineEmits<{
  (e: 'interface-drag-start', iface: InterfaceInfo, event: MouseEvent): void
  (e: 'node-drag-start', node: LogicNode, event: MouseEvent): void
}>();

/**
 * 处理接口拖拽开始事件
 * @param {InterfaceInfo} iface - 接口信息对象
 * @param {MouseEvent} event - 鼠标事件对象
 * @returns {void}
 */
function handleInterfaceDragStart(iface: InterfaceInfo, event: MouseEvent) {
  emit('interface-drag-start', iface, event);
}

/**
 * 处理节点拖拽开始事件
 * @param {LogicNode} node - 逻辑节点对象
 * @param {MouseEvent} event - 鼠标事件对象
 * @returns {void}
 */
function handleNodeDragStart(node: LogicNode, event: MouseEvent) {
  emit('node-drag-start', node, event);
}
</script>

<style lang="scss" src="./index.scss"></style>
