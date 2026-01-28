<!--
  节点调色板组件
  展示可拖拽的节点列表
-->
<template>
  <div class="flowchart-sidebar">
    <!-- 搜索区域 -->
    <div class="palette-search">
      <el-icon :size="16">
        <Search />
      </el-icon>

      <input
        id="flowchart-node-search"
        v-model="searchQuery"
        name="nodeSearch"
        type="text"
        class="searchBox-input"
        placeholder="搜索"
        @input="handleSearch"
      />
    </div>

    <!-- 调色板容器 -->
    <div class="palette-container palette-scroll">
      <!-- 数据传输分类 -->
      <div class="palette-category" :class="{ 'palette-closed': !categories.communication }">
        <div class="palette-header" @click="toggleCategory('communication')">
          <el-icon><component :is="categories.communication ? ArrowDown : ArrowRight" /></el-icon>

          <span>数据传输</span>
        </div>

        <div v-show="categories.communication" class="palette-content">
          <div class="palette-node-list">
            <div
              v-for="node in filteredNodes.communication"
              :key="node.type"
              class="palette-node"
              :data-palette-type="node.type"
              :data-palette-label="node.label"
              @mousedown="handleNodeDragStart(node, $event)"
            >
              <div class="palette-icon-container" :style="{ backgroundColor: node.color }" :data-palette-icon="node.icon">
                <div v-if="node.icon.startsWith('http') || node.icon.startsWith('/') || node.icon.includes('assets/')" class="palette-icon" :style="{ backgroundImage: `url(${node.icon})` }" />

                <el-icon v-else :size="14">
                  <component :is="node.icon" />
                </el-icon>
              </div>

              <div class="palette-label">
                {{ node.label }}
              </div>

              <div
                v-if="node.outputPort"
                class="palette-port palette-port-output"
              />

              <div
                v-if="node.inputPort"
                class="palette-port palette-port-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 协议处理分类 -->
      <div class="palette-category" :class="{ 'palette-closed': !categories.processing }">
        <div class="palette-header" @click="toggleCategory('processing')">
          <el-icon><component :is="categories.processing ? ArrowDown : ArrowRight" /></el-icon>

          <span>协议处理</span>
        </div>

        <div v-show="categories.processing" class="palette-content">
          <div class="palette-node-list">
            <div
              v-for="node in filteredNodes.processing"
              :key="node.type"
              class="palette-node"
              :data-palette-type="node.type"
              :data-palette-label="node.label"
              @mousedown="handleNodeDragStart(node, $event)"
            >
              <div class="palette-icon-container" :style="{ backgroundColor: node.color }" :data-palette-icon="node.icon">
                <div v-if="node.icon.startsWith('http') || node.icon.startsWith('/') || node.icon.includes('assets/')" class="palette-icon" :style="{ backgroundImage: `url(${node.icon})` }" />

                <el-icon v-else :size="14">
                  <component :is="node.icon" />
                </el-icon>
              </div>

              <div class="palette-label">
                {{ node.label }}
              </div>

              <div
                v-if="node.outputPort"
                class="palette-port palette-port-output"
              />

              <div
                v-if="node.inputPort"
                class="palette-port palette-port-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 通用分类（一期隐藏） -->
      <div v-show="false" class="palette-category" :class="{ 'palette-closed': !categories.common }">
        <div class="palette-header" @click="toggleCategory('common')">
          <el-icon><component :is="categories.common ? ArrowDown : ArrowRight" /></el-icon>

          <span>通用</span>
        </div>

        <div v-show="categories.common" class="palette-content">
          <div class="palette-node-list">
            <div
              v-for="node in filteredNodes.common"
              :key="node.type"
              class="palette-node"
              :data-palette-type="node.type"
              :data-palette-label="node.label"
              @mousedown="handleNodeDragStart(node, $event)"
            >
              <div class="palette-icon-container" :style="{ backgroundColor: node.color }" :data-palette-icon="node.icon">
                <div v-if="node.icon.startsWith('http') || node.icon.startsWith('/') || node.icon.includes('assets/')" class="palette-icon" :style="{ backgroundImage: `url(${node.icon})` }" />

                <el-icon v-else :size="14">
                  <component :is="node.icon" />
                </el-icon>
              </div>

              <div class="palette-label">
                {{ node.label }}
              </div>

              <div
                v-if="node.outputPort"
                class="palette-port palette-port-output"
              />

              <div
                v-if="node.inputPort"
                class="palette-port palette-port-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 网络分类（一期隐藏） -->
      <div v-show="false" class="palette-category" :class="{ 'palette-closed': !categories.network }">
        <div class="palette-header" @click="toggleCategory('network')">
          <el-icon><component :is="categories.network ? ArrowDown : ArrowRight" /></el-icon>

          <span>网络</span>
        </div>

        <div v-show="categories.network" class="palette-content">
          <div class="palette-node-list">
            <div
              v-for="node in filteredNodes.network"
              :key="node.type"
              class="palette-node"
              :data-palette-type="node.type"
              :data-palette-label="node.label"
              @mousedown="handleNodeDragStart(node, $event)"
            >
              <div class="palette-icon-container" :style="{ backgroundColor: node.color }" :data-palette-icon="node.icon">
                <div v-if="node.icon.startsWith('http') || node.icon.startsWith('/') || node.icon.includes('assets/')" class="palette-icon" :style="{ backgroundImage: `url(${node.icon})` }" />

                <el-icon v-else :size="14">
                  <component :is="node.icon" />
                </el-icon>
              </div>

              <div class="palette-label">
                {{ node.label }}
              </div>

              <div
                v-if="node.outputPort"
                class="palette-port palette-port-output"
              />

              <div
                v-if="node.inputPort"
                class="palette-port palette-port-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 存储分类（一期隐藏） -->
      <div v-show="false" class="palette-category" :class="{ 'palette-closed': !categories.storage }">
        <div class="palette-header" @click="toggleCategory('storage')">
          <el-icon><component :is="categories.storage ? ArrowDown : ArrowRight" /></el-icon>

          <span>存储</span>
        </div>

        <div v-show="categories.storage" class="palette-content">
          <div class="palette-node-list">
            <div
              v-for="node in filteredNodes.storage"
              :key="node.type"
              class="palette-node"
              :data-palette-type="node.type"
              :data-palette-label="node.label"
              @mousedown="handleNodeDragStart(node, $event)"
            >
              <div class="palette-icon-container" :style="{ backgroundColor: node.color }" :data-palette-icon="node.icon">
                <div v-if="node.icon.startsWith('http') || node.icon.startsWith('/') || node.icon.includes('assets/')" class="palette-icon" :style="{ backgroundImage: `url(${node.icon})` }" />

                <el-icon v-else :size="14">
                  <component :is="node.icon" />
                </el-icon>
              </div>

              <div class="palette-label">
                {{ node.label }}
              </div>

              <div
                v-if="node.outputPort"
                class="palette-port palette-port-output"
              />

              <div
                v-if="node.inputPort"
                class="palette-port palette-port-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, ArrowDown, ArrowRight } from '@element-plus/icons-vue';

// 节点数据定义
interface PaletteNode {
  type: string
  label: string
  color: string
  height: number
  icon: string
  outputPort: number | null
  inputPort: number | null
}

// Props
const props = defineProps<{
  nodesData: Record<string, PaletteNode[]>
}>();

// Emits
const emit = defineEmits<{
  (e: 'node-drag-start', node: PaletteNode, event: MouseEvent): void
}>();

// 搜索关键词
const searchQuery = ref('');

// 分类展开状态
const categories = ref({
  communication: true,
  processing: true,
  common: true,
  network: false,
  storage: false
});

// 过滤后的节点数据
const filteredNodes = computed<Record<string, PaletteNode[]>>(() => {
  const result: Record<string, PaletteNode[]> = {};

  Object.keys(props.nodesData).forEach(category => {
    if (searchQuery.value) {
      result[category] = props.nodesData[category].filter(node =>
        node.label.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    } else {
      result[category] = props.nodesData[category];
    }
  });

  return result;
});

/**
 * 切换分类展开/收起状态
 * @param {string} categoryName - 分类名称（communication/processing/common/network/storage）
 * @returns {void} 无返回值
 */
function toggleCategory(categoryName: string) {
  categories.value[categoryName as keyof typeof categories.value] = !categories.value[categoryName as keyof typeof categories.value];
}

/**
 * 搜索处理
 * @description 过滤逻辑在computed中自动处理，此函数为占位符
 * @returns {void} 无返回值
 */
function handleSearch() {
  // 过滤逻辑在 computed 中处理
}

/**
 * 处理节点拖拽开始事件
 * @param {PaletteNode} node - 被拖拽的节点对象
 * @param {MouseEvent} event - 鼠标按下事件对象
 * @returns {void} 无返回值
 */
function handleNodeDragStart(node: PaletteNode, event: MouseEvent) {
  event.preventDefault();
  emit('node-drag-start', node, event);
}
</script>

<style lang="scss" src="./index.scss"></style>
