<!--
  IDE 主布局组件
  采用圣杯布局变体：顶栏 + 左侧栏 + 中间画布 + 底栏
  使用通用组件：AppHeader, AppFooter
-->
<template>
  <div class="ide-layout">
    <AppHeader @open-build="handleOpenBuild" @action-save="handleSave" @action-publish="handlePublish" />

    <div class="ide-layout-main">
      <ResourceExplorer />

      <div class="ide-layout-workbench">
        <TabWorkbench />
      </div>
    </div>

    <AppFooter />

    <!-- 构建弹窗 -->
    <BuildModal />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import AppHeader from '@/components/app-header/index.vue';
import ResourceExplorer from './components/ide-resource-explorer/index.vue';
import TabWorkbench from './components/ide-tab-workbench/index.vue';
import AppFooter from '@/components/app-footer/index.vue';
import BuildModal from './components/shared-build-modal/index.vue';
import { useIdeStore } from '@/stores';
import { MESSAGE } from '@/constants';

const ideStore = useIdeStore();

/**
 * 打开构建弹窗
 * @returns {void}
 */
function handleOpenBuild() {
  ideStore.openBuildModal();
}

/**
 * 处理保存
 * @returns {void}
 */
function handleSave() {
  ElMessage.success(MESSAGE.SAVE_SUCCESS);
}

/**
 * 处理发布
 * @returns {void}
 */
function handlePublish() {
  ElMessage.success(MESSAGE.PUBLISH_SUCCESS);
}
</script>

// 样式已在 client/src/styles/index.scss 中全局导入，无需重复导入
