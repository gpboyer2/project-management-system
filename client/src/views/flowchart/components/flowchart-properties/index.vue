<!--
  流程图属性面板组件
  显示节点/边的属性配置
-->
<template>
  <div class="flowchart-right" :style="{ width: compOptions.show_panel ? compOptions.right_panel_width + 'px' : '0' }">
    <div v-if="compOptions.show_panel" class="resize-handle" @mousedown="handleResizeStart" />

    <div class="cssc-properties-header">
      <h3>属性配置</h3>

      <el-button class="cssc-properties-close" link @click="handleClose">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <div class="cssc-properties-content">
      <!-- 节点属性 -->
      <div v-if="selectedNode && currentNodeForm" class="cssc-property-section">
        <h4>{{ currentNodeForm.label }}</h4>

        <!-- 基础信息 -->
        <div class="cssc-property-form">
          <div class="cssc-form-field">
            <label>节点ID</label>

            <input type="text" :value="selectedNode.id" disabled />
          </div>

          <div class="cssc-form-field">
            <label>节点类型</label>

            <input type="text" :value="selectedNode.type" disabled />
          </div>
        </div>

        <!-- 动态表单 -->
        <div v-for="section in currentNodeForm.formLayout" :key="section.section" class="cssc-form-section">
          <h5 v-if="section.section" class="cssc-section-title">
            {{ section.section }}
          </h5>

          <div class="cssc-property-form">
            <template v-for="fieldName in section.fields" :key="fieldName">
              <div v-if="isFieldVisible(currentNodeForm.defaults[fieldName])" class="cssc-form-field">
                <label>
                  {{ currentNodeForm.defaults[fieldName].label }}
                  <span v-if="currentNodeForm.defaults[fieldName].help" class="cssc-field-help">
                    {{ currentNodeForm.defaults[fieldName].help }}
                  </span>
                </label>

                <!-- 文本输入 -->
                <input
                  v-if="!currentNodeForm.defaults[fieldName].type || currentNodeForm.defaults[fieldName].type === 'text'"
                  type="text"
                  :value="nodeConfig[fieldName] || currentNodeForm.defaults[fieldName].value"
                  :placeholder="currentNodeForm.defaults[fieldName].placeholder"
                  @input="handleUpdateNodeConfig(fieldName, ($event.target as HTMLInputElement).value)"
                />

                <!-- 数字输入 -->
                <input
                  v-else-if="currentNodeForm.defaults[fieldName].type === 'number'"
                  type="number"
                  :value="nodeConfig[fieldName] || currentNodeForm.defaults[fieldName].value"
                  :min="currentNodeForm.defaults[fieldName].min"
                  :max="currentNodeForm.defaults[fieldName].max"
                  :placeholder="currentNodeForm.defaults[fieldName].placeholder"
                  @input="handleUpdateNodeConfig(fieldName, Number(($event.target as HTMLInputElement).value))"
                />

                <!-- 下拉选择 -->
                <select
                  v-else-if="currentNodeForm.defaults[fieldName].type === 'select'"
                  :value="nodeConfig[fieldName] || currentNodeForm.defaults[fieldName].value"
                  @change="handleUpdateNodeConfig(fieldName, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="opt in currentNodeForm.defaults[fieldName].options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>

                <!-- 复选框 -->
                <label v-else-if="currentNodeForm.defaults[fieldName].type === 'checkbox'" class="cssc-checkbox-label">
                  <input
                    :name="fieldName"
                    type="checkbox"
                    :checked="nodeConfig[fieldName] !== undefined ? nodeConfig[fieldName] : currentNodeForm.defaults[fieldName].value"
                    @change="handleUpdateNodeConfig(fieldName, ($event.target as HTMLInputElement).checked)"
                  />

                  <span>{{ currentNodeForm.defaults[fieldName].label }}</span>
                </label>

                <!-- 多选（报文配置列表） -->
                <el-select
                  v-else-if="currentNodeForm.defaults[fieldName].type === 'multi-select'"
                  :model-value="nodeConfig[fieldName] || []"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :placeholder="currentNodeForm.defaults[fieldName].placeholder"
                  style="width: 100%"
                  @change="handleUpdateNodeConfig(fieldName, $event)"
                >
                  <el-option
                    v-for="opt in compOptions.packet_options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 边属性 -->
      <div v-else-if="selectedEdge" class="cssc-property-section">
        <h4>连接属性</h4>

        <div class="cssc-property-form">
          <div class="cssc-form-field">
            <label>连接ID</label>

            <input type="text" :value="selectedEdge.id" disabled />
          </div>

          <div class="cssc-form-field">
            <label>连接标签</label>

            <input
              type="text"
              :value="selectedEdge.label || ''"
              @input="handleUpdateEdgeLabel(($event.target as HTMLInputElement).value)"
            />
          </div>

          <div class="cssc-form-field">
            <label>连接颜色</label>

            <input
              type="color"
              :value="selectedEdge.color || '#868e96'"
              @input="handleUpdateEdgeColor(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- 无选中内容 -->
      <div v-else class="cssc-empty-properties">
        <el-icon><Box /></el-icon>

        <p>选择一个节点或连接来编辑属性</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Close, Box } from '@element-plus/icons-vue';
import { ElButton } from 'element-plus';
import { getNodeForm } from '@/components/node-view/forms';

// 节点/边数据类型
interface FlowchartNode {
  id: string
  label: string
  type: string
  color: string
  icon: string
  description: string
  x?: number
  y?: number
  properties: Record<string, any>
}

interface FlowchartEdge {
  id: string
  from: string
  to: string
  label?: string
  color?: string
  dash?: boolean
  arrows?: string
}

interface PacketOption {
  value: string | number
  label: string
}

// 组件配置选项
interface CompOptions {
  // UI 配置
  show_panel: boolean
  right_panel_width: number

  // 报文选项配置
  packet_options: PacketOption[]
}

// Props
const props = defineProps<{
  compOptions: CompOptions
  selectedNode: FlowchartNode | null
  selectedEdge: FlowchartEdge | null
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'resize-start', event: MouseEvent): void
  (e: 'update-node-config', fieldName: string, value: any): void
  (e: 'update-edge-label', label: string): void
  (e: 'update-edge-color', color: string): void
}>();

// 节点配置（用于属性面板绑定）
const nodeConfig = ref<Record<string, any>>({});

// 当前选中节点的表单配置
const currentNodeForm = computed(() => {
  if (!props.selectedNode) return null;
  return getNodeForm(props.selectedNode.type);
});

// 监听选中节点变化，初始化 nodeConfig
watch(() => props.selectedNode, (newNode) => {
  if (newNode) {
    const nodeForm = getNodeForm(newNode.type);
    const existingProps = newNode.properties || {};
    const mergedConfig: Record<string, any> = { ...existingProps };

    if (nodeForm && nodeForm.defaults) {
      for (const [key, config] of Object.entries(nodeForm.defaults)) {
        if (mergedConfig[key] === undefined && (config as any).value !== undefined) {
          mergedConfig[key] = (config as any).value;
        }
      }
    }

    nodeConfig.value = mergedConfig;
  }
});

/**
 * 字段可见性判断
 * @param {any} fieldConfig - 字段配置对象
 * @returns {boolean} 字段是否可见
 */
function isFieldVisible(fieldConfig: any): boolean {
  if (!fieldConfig || !fieldConfig.visible) return true;
  return fieldConfig.visible(nodeConfig.value);
}

/**
 * 更新节点配置
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段新值
 * @returns {void} 无返回值
 */
function handleUpdateNodeConfig(fieldName: string, value: any) {
  if (!props.selectedNode) return;
  nodeConfig.value[fieldName] = value;
  emit('update-node-config', fieldName, value);
}

/**
 * 更新边标签
 * @param {string} label - 边的标签文本
 * @returns {void} 无返回值
 */
function handleUpdateEdgeLabel(label: string) {
  if (!props.selectedEdge) return;
  emit('update-edge-label', label);
}

/**
 * 更新边颜色
 * @param {string} color - 边的颜色值
 * @returns {void} 无返回值
 */
function handleUpdateEdgeColor(color: string) {
  if (!props.selectedEdge) return;
  emit('update-edge-color', color);
}

/**
 * 处理关闭属性面板
 * @description 通过emit通知父组件关闭面板
 * @returns {void} 无返回值
 */
function handleClose() {
  emit('close');
}

/**
 * 处理调整面板宽度开始
 * @param {MouseEvent} event - 鼠标按下事件对象
 * @returns {void} 无返回值
 */
function handleResizeStart(event: MouseEvent) {
  emit('resize-start', event);
}
</script>

<style lang="scss" src="./index.scss"></style>
