<template>
  <div class="nv-setting-panel" data-key="client/src/components/node-view/tools/setting/index.vue">
    <div>设置</div>

    <span v-show="false">
      ({{ nodeData.text.value }})
    </span>

    <div class="setting-item-title">
      选择风格
    </div>

    <div class="style-wrapper">
      <div
        v-for="(item, index) in styleConfig"
        :key="index"
        class="style-item"
        :style="item"
        @click="$emit('changeStyle', item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps({
  nodeData: {
    type: Object,
    default: () => {
      return {};
    }
  }
});

const styleConfig = ref([
  {
    backgroundColor: 'rgb(255, 255, 255)',
    borderColor: 'rgb(42, 42, 42)',
    borderWidth: '1px'
  },
  {
    backgroundColor: 'rgb(245, 245, 245)',
    borderColor: 'rgb(102, 102, 102)',
    borderWidth: '1px'
  },
  {
    backgroundColor: 'rgb(218, 232, 252)',
    borderColor: 'rgb(108, 142, 191)',
    borderWidth: '1px'
  },
  {
    backgroundColor: 'rgb(213, 232, 212)',
    borderColor: 'rgb(130, 179, 102)',
    borderWidth: '1px'
  },
  {
    backgroundColor: 'rgb(248, 206, 204)',
    borderColor: 'rgb(184, 84, 80)',
    borderWidth: '1px'
  }
]);
</script>

<style lang="scss" src="./index.scss"></style>