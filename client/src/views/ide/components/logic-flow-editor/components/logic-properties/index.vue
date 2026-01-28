<!--
  逻辑编辑器属性面板组件
  显示节点/边的属性配置表单
-->
<template>
  <div v-show="activeTab === 'properties'" class="ide-toolbox-content ide-toolbox-properties">
    <!-- 节点属性 -->
    <template v-if="selectedNode">
      <div v-if="currentNodeForm" class="cssc-property-section">
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
                  :value="nodeConfig[fieldName] ?? currentNodeForm.defaults[fieldName].value"
                  :placeholder="currentNodeForm.defaults[fieldName].placeholder"
                  @input="updateNodeConfig(fieldName, ($event.target as HTMLInputElement).value)"
                />

                <!-- 数字输入 -->
                <input
                  v-else-if="currentNodeForm.defaults[fieldName].type === 'number'"
                  type="number"
                  :value="nodeConfig[fieldName] ?? currentNodeForm.defaults[fieldName].value"
                  :min="currentNodeForm.defaults[fieldName].min"
                  :max="currentNodeForm.defaults[fieldName].max"
                  :placeholder="currentNodeForm.defaults[fieldName].placeholder"
                  @input="updateNodeConfig(fieldName, Number(($event.target as HTMLInputElement).value))"
                />

                <!-- 下拉选择 -->
                <select
                  v-else-if="currentNodeForm.defaults[fieldName].type === 'select'"
                  :value="nodeConfig[fieldName] ?? currentNodeForm.defaults[fieldName].value"
                  @change="updateNodeConfig(fieldName, ($event.target as HTMLSelectElement).value)"
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
                    @change="updateNodeConfig(fieldName, ($event.target as HTMLInputElement).checked)"
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
                  @change="updateNodeConfig(fieldName, $event)"
                >
                  <el-option
                    v-for="opt in compOptions.packetOptions"
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

      <!-- 普通节点属性兜底 -->
      <div v-else class="ide-properties-section">
        <h4 class="ide-properties-section-title">
          节点属性
        </h4>

        <div class="ide-properties-form">
          <div class="ide-properties-field">
            <label>节点 ID</label>

            <input type="text" :value="selectedNode.id" disabled />
          </div>
        </div>
      </div>
    </template>

    <!-- 边属性 -->
    <template v-else-if="selectedEdge">
      <div class="cssc-property-section">
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
              @input="updateEdgeLabel(($event.target as HTMLInputElement).value)"
            />
          </div>

          <div class="cssc-form-field">
            <label>连接颜色</label>

            <input
              type="color"
              :value="selectedEdge.color || '#868e96'"
              @input="updateEdgeColor(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <template v-else>
      <div class="ide-toolbox-empty">
        <el-icon class="ide-toolbox-empty-icon"><InfoFilled /></el-icon>

        <p>选择一个元素查看属性</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import { getNodeForm } from '@/components/node-view/forms';

// 节点/边数据类型
interface LogicNode {
  id: string
  type: string
  properties?: Record<string, any>
}

interface LogicEdge {
  id: string
  label?: string
  color?: string
}

interface PacketOption {
  value: string | number
  label: string
}

interface PropertiesOptions {
  packetOptions: PacketOption[]
}

// Props
const props = defineProps<{
  activeTab: string
  selectedNode: LogicNode | null
  selectedEdge: LogicEdge | null
  compOptions: PropertiesOptions
}>();

// Emits
const emit = defineEmits<{
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

// 字段可见性判断
/**
 * 判断字段是否可见
 * @param {any} fieldConfig - 字段配置对象
 * @returns {boolean} 字段是否可见
 */
function isFieldVisible(fieldConfig: any): boolean {
  if (!fieldConfig || !fieldConfig.visible) return true;
  return fieldConfig.visible(nodeConfig.value);
}

// 更新节点配置
/**
 * 更新节点配置
 * @param {string} fieldName - 字段名称
 * @param {any} value - 字段值
 * @returns {void}
 */
function updateNodeConfig(fieldName: string, value: any) {
  if (!props.selectedNode) return;
  nodeConfig.value[fieldName] = value;
  emit('update-node-config', fieldName, value);
}

// 更新边标签
/**
 * 更新边标签
 * @param {string} label - 标签文本
 * @returns {void}
 */
function updateEdgeLabel(label: string) {
  if (!props.selectedEdge) return;
  emit('update-edge-label', label);
}

// 更新边颜色
/**
 * 更新边颜色
 * @param {string} color - 颜色值
 * @returns {void}
 */
function updateEdgeColor(color: string) {
  if (!props.selectedEdge) return;
  emit('update-edge-color', color);
}
</script>

<style lang="scss" src="./index.scss"></style>
