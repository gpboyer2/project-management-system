<template>
  <div
    v-show="false"
    class="tools-palette"
    data-desc="这个组件是一个 LogicFlow 节点拖拽调色板演示组件，用于展示如何在 LogicFlow 画布中通过拖拽创建节点"
    data-key="client/src/components/node-view/tools/palette/index.vue"
  >
    <el-collapse v-model="activeNames">
      <el-collapse-item title="基础节点" name="base">
        <div
          v-for="(item, index) in baseNodes"
          :key="index"
          class="red-ui-palette-node ui-draggable ui-draggable-handle"
          :style="{ backgroundColor: item.background }"
          @mousedown="startDrag(item)"
        >
          <div class="red-ui-palette-label">
            {{ item.text }}
          </div>

          <div class="red-ui-palette-icon-container">
            <div class="red-ui-palette-icon" :style="{ backgroundImage: `url(${item.icon})`}" />
          </div>

          <div class="red-ui-palette-port red-ui-palette-port-input" />

          <div class="red-ui-palette-port red-ui-palette-port-output" />
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  lf: {
    type: Object,
    required: true,
  }
});

const activeNames = ref(['base']);

/**
 * 开始拖拽节点
 * @param {any} item - 节点配置对象
 * @returns {void}
 */
const startDrag = (item: any) => {
  const { lf } = props;
  (lf as any).dnd.startDrag({
    type: item.type,
    text: item.text
  });
};

const baseNodes = ref([
  {
    type: 'fetch-node',
    text: 'fetch',
    background: 'rgb(231, 231, 174)',
    icon: 'public/images/fetch.svg'
  },
  {
    type: 'function-node',
    text: 'function',
    background: 'rgb(253, 208, 162)',
    icon: 'public/images/function.svg'
  },
  {
    type: 'switch-node',
    text: 'switch',
    background: 'rgb(226, 217, 110)',
    icon: 'public/images/switch.svg'
  },
  {
    type: 'delay-node',
    text: 'delay',
    background: 'rgb(230, 224, 248)',
    icon: 'public/images/delay.svg'
  }
]);
</script>

<style lang="scss" src="./index.scss"></style>