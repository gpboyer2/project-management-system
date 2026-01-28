<!-- 发布对话框拓扑图组件 -->
<template>
  <div ref="canvasRef" class="publish-topology-canvas">
    <!-- 导航条 -->
    <div class="publish-navbar">
      <div class="publish-nav-item" @click="$emit('show-level0')">
        体系全景
      </div>

      <template v-if="options.currentView === 'l2'">
        <div class="publish-nav-arrow">
          &gt;
        </div>

        <div class="publish-nav-item">
          智能汽车 (内部交互)
        </div>
      </template>
    </div>

    <!-- SVG连线层 -->
    <svg ref="svgRef" class="publish-svg-layer" />

    <!-- 节点层 -->
    <div class="publish-node-layer">
      <!-- Level 0 视图 -->
      <template v-if="options.currentView === 'l0'">
        <div
          v-for="node in options.l0Nodes"
          :id="'publish-' + node.id"
          :key="node.id"
          class="publish-node publish-l0-system"
          :class="{ 'publish-affected': options.affectedNodes.includes(node.id) }"
          :style="{ left: (node.x - 70) + 'px', top: (node.y - 40) + 'px' }"
          @dblclick="node.id === 'sys_car' ? $emit('show-level2') : null"
        >
          <div>{{ node.name }}</div>

          <div class="publish-node-hint">
            [双击钻取]
          </div>
        </div>
      </template>

      <!-- Level 2 视图 -->
      <template v-if="options.currentView === 'l2'">
        <!-- 外部上下文节点 -->
        <div
          v-for="node in options.l2Context"
          :id="'publish-' + node.id"
          :key="node.id"
          class="publish-node publish-context-node"
          :class="{ 'publish-affected': options.affectedNodes.includes(node.id) }"
          :style="{ left: (node.x - 50) + 'px', top: (node.y - 30) + 'px' }"
        >
          <div class="publish-context-label">
            外部系统
          </div>

          <div>{{ node.name }}</div>
        </div>

        <!-- 系统边界框 -->
        <div class="publish-system-boundary">
          <div class="publish-boundary-label">
            智能汽车 (System Boundary)
          </div>
        </div>

        <!-- 内部硬件节点 -->
        <div
          v-for="hw in options.l2Hardware"
          :id="'publish-' + hw.id"
          :key="hw.id"
          class="publish-node publish-internal-hardware"
          :class="{ 'publish-affected': options.affectedNodes.includes(hw.id) }"
          :style="{ left: hw.x + 'px', top: hw.y + 'px' }"
        >
          <div class="publish-hw-header">
            {{ hw.name }}
          </div>

          <!-- 内部节点 -->
          <div
            v-for="sw in getChildNodes(hw.id)"
            :id="'publish-' + sw.id"
            :key="sw.id"
            class="publish-internal-node"
            :class="{ 'publish-affected': options.affectedNodes.includes(sw.id) }"
          >
            {{ sw.name }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

/**
 *
 * 发布拓扑图配置选项
 * 将多个拓扑数据合并为一个 options 对象
 *
 */
interface PublishTopologyOptions {
  currentView: 'l0' | 'l2';
  l0Nodes: any[];
  l2Context: any[];
  l2Hardware: any[];
  l2Nodes: any[];
  edgeList: any[];
  affectedNodes: string[];
}

defineProps<{
  compOptions: PublishTopologyOptions;
}>();

const emit = defineEmits<{
  (e: 'show-level0'): void;
  (e: 'show-level2'): void;
}>();

const canvasRef = ref<HTMLElement>();
const svgRef = ref<SVGSVGElement>();

/**
 * 获取父节点下的所有子节点
 * @param {string} parentId - 父节点ID
 * @returns {any[]} 子节点列表
 */
function getChildNodes(parentId: string) {
  return props.compOptions.l2Nodes.filter(node => node.parent === parentId);
}

/**
 * 渲染节点间的连接线
 * 根据当前视图的边列表绘制SVG连线和标签
 * @returns {void}
 */
function renderEdges() {
  const svg = svgRef.value;
  const canvas = canvasRef.value;
  if (!svg || !canvas) return;

  svg.innerHTML = '';
  const canvasRect = canvas.getBoundingClientRect();

  const currentEdgeList = props.compOptions.edgeList.filter(e => e.view === props.compOptions.currentView);

  currentEdgeList.forEach(edge => {
    const sourceEl = document.getElementById('publish-' + edge.source);
    const targetEl = document.getElementById('publish-' + edge.target);

    if (sourceEl && targetEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
      const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
      const x2 = targetRect.left + targetRect.width / 2 - canvasRect.left;
      const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

      const isAffected = edge.proto === 'mqtt';

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('class', isAffected ? 'edge affected-edge' : 'edge');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String((x1 + x2) / 2));
      text.setAttribute('y', String((y1 + y2) / 2 - 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', isAffected ? 'edge-label affected-text' : 'edge-label');
      text.textContent = edge.label;
      svg.appendChild(text);
    }
  });
}

watch(() => props.compOptions.currentView, () => {
  nextTick(() => {
    setTimeout(() => {
      renderEdges();
    }, 50);
  });
});

defineExpose({
  renderEdges
});
</script>

<style lang="scss" src="./index.scss"></style>
