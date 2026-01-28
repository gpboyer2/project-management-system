<template>
  <div class="nv-flow-chart">
    <div ref="container" class="nv-container" data-file-key="client/src/components/node-view/index.vue" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import LogicFlow from '@logicflow/core';
import '@logicflow/core/dist/style/index.css';
import { DndPanel } from '@logicflow/extension';
import '@logicflow/extension/lib/style/index.css';
import NodeRedExtension from './index.js';

const container = ref<HTMLElement | null>(null);
let lf: any = null;
let resizeObserver: ResizeObserver | null = null;

/**
 * 获取 LogicFlow 实例
 * @returns {any} LogicFlow 实例对象
 */
function getLf() {
  return lf;
}

/**
 * 选中画布中的所有节点
 * @returns {void}
 */
function selectAllNodes() {
  if (!lf) return;
  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  const nodes = graphData.nodes || [];
  nodes.forEach((node: any) => {
    lf.selectNodeById(node.id, true);
  });
}

/**
 * 自动布局节点，按层级排列
 * @returns {void}
 */
function autoLayout() {
  if (!lf) return;
  // 简单的自动布局实现
  const graphData = lf.getGraphRawData ? lf.getGraphRawData() : lf.getGraphData();
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  // 按层级排序
  const levels: Map<string, number> = new Map();
  const visited = new Set<string>();

  /**
   * 计算节点的层级
   * @param {string} nodeId - 节点ID
   * @returns {number} 节点层级
   */
  function getLevel(nodeId: string): number {
    if (levels.has(nodeId)) return levels.get(nodeId)!;
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    // 找到所有指向当前节点的边
    const incomingEdges = edges.filter((e: any) => e.targetNodeId === nodeId);
    if (incomingEdges.length === 0) {
      levels.set(nodeId, 0);
      return 0;
    }

    let maxLevel = 0;
    incomingEdges.forEach((edge: any) => {
      const level = getLevel(edge.sourceNodeId);
      maxLevel = Math.max(maxLevel, level);
    });

    levels.set(nodeId, maxLevel + 1);
    return maxLevel + 1;
  }

  // 计算每个节点的层级
  nodes.forEach((node: any) => {
    getLevel(node.id);
  });

  // 根据层级重新排列节点
  const levelGroups: Map<number, any[]> = new Map();
  levels.forEach((level, nodeId) => {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    const node = nodes.find((n: any) => n.id === nodeId);
    if (node) {
      levelGroups.get(level)!.push(node);
    }
  });

  // 设置节点位置
  const xSpacing = 200;
  const ySpacing = 100;
  levelGroups.forEach((groupNodes, level) => {
    groupNodes.forEach((node: any, index: number) => {
      lf.addNode({
        ...node,
        x: 100 + level * xSpacing,
        y: 100 + index * ySpacing
      });
    });
  });
}

/**
 * 设置网格显示状态
 * @param {boolean} visible - 是否显示网格
 * @returns {void}
 */
function setGridVisible(visible: boolean) {
  if (!lf) return;
  // LogicFlow 的网格显示切换
  const containerEl = container.value;
  if (!containerEl) return;
  const gridLayer = containerEl.querySelector('.lf-graph');
  if (gridLayer) {
    (gridLayer as HTMLElement).style.backgroundImage = visible
      ? 'linear-gradient(#e8e8e8 1px, transparent 1px), linear-gradient(90deg, #e8e8e8 1px, transparent 1px)'
      : 'none';
    (gridLayer as HTMLElement).style.backgroundSize = '20px 20px';
  }
}

/**
 * 调整 LogicFlow 画布大小以适应容器
 * @returns {void}
 */
function resizeLf() {
  const el = container.value;
  if (!lf || !el) return;
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return;
  // LogicFlow resize 可能需要显式传入宽高（更兼容）
  if (typeof lf.resize === 'function') {
    lf.resize(w, h);
  }
}

onMounted(() => {
  if (!container.value) return;

  lf = new LogicFlow({
    container: container.value,
    grid: {
      visible: true,
      type: 'mesh',
      size: 10,
      config: {
        color: '#eeeeee'
      }
    },
    hoverOutline: false,
    edgeSelectedOutline: false,
    hideAnchors: false,
    keyboard: {
      enabled: true,
    },
    plugins: [
      NodeRedExtension,
      DndPanel
    ]
  });

  lf.render({
    nodes: [],
    edges: []
  });

  lf.on('node-red:start', () => {
    console.log('我要开始执行流程了');
  });

  lf.on('vue-node:click', (data: any) => {
    lf.setProperties(data.id, {
      t: ++data.val
    });
  });

  // 关键：Tab 切换/布局变化时，容器尺寸可能从 0 变为正常值，需要触发 resize 才能显示画布
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    resizeObserver = new ResizeObserver(() => {
      // 用微任务/下一帧兜底，避免频繁 resize 抖动
      requestAnimationFrame(() => resizeLf());
    });
    resizeObserver.observe(container.value);
  }

  // 初次挂载后也做一次 resize，避免首次渲染尺寸不准
  nextTick(() => requestAnimationFrame(() => resizeLf()));
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (lf) {
    // 移除所有事件监听
    lf.off('node-red:start');
    lf.off('vue-node:click');
    lf.off('node:click');
    lf.off('blank:click');
    lf.off('node:dnd-add');

    // 清除画布数据
    lf.clearData();

    // 销毁插件（NodeRedExtension）
    const plugins = lf.extension;
    if (plugins && plugins.NodeRedExtension && typeof plugins.NodeRedExtension.destroy === 'function') {
      plugins.NodeRedExtension.destroy();
    }

    // 清空引用
    lf = null;
  }
});

defineExpose({
  getLf,
  selectAllNodes,
  autoLayout,
  setGridVisible
});
</script>

<style lang="scss" src="./index.scss"></style>
