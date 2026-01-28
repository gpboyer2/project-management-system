<!--
  发布预览弹窗
  包含影响分析和拓扑图
-->
<template>
  <el-dialog
    :model-value="visible"
    title=""
    width="80%"
    top="5vh"
    custom-class="publish-dialog"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <template #header>
      <div class="publish-dialog-header">
        <span class="version-info">
          版本: {{ compOptions.currentVersion }} -> {{ compOptions.nextVersion }}
        </span>
      </div>
    </template>

    <div class="publish-dialog-content">
      <div class="publish-tabs">
        <button
          class="publish-tab"
          :class="{ active: compOptions.activeTab === 'text' }"
          @click="$emit('update:active-tab', 'text')"
        >
          文字
        </button>

        <button
          class="publish-tab"
          :class="{ active: compOptions.activeTab === 'topology' }"
          @click="$emit('update:active-tab', 'topology')"
        >
          拓扑
        </button>
      </div>

      <div class="publish-tab-content">
        <!-- 文字版影响分析 -->
        <div v-show="compOptions.activeTab === 'text'" class="impact-text-view">
          <div class="impact-section">
            <h3 class="impact-title">
              协议变更影响分析
            </h3>

            <div class="impact-list">
              <div v-for="(impact, index) in compOptions.impactAnalysisList" :key="index" class="impact-item">
                <div class="impact-item-header">
                  <span class="impact-icon" :class="impact.type">
                    <i :class="impact.icon" />
                  </span>

                  <span class="impact-name">
                    {{ impact.name }}
                  </span>

                  <span class="impact-badge" :class="impact.level">
                    {{ impact.levelText }}
                  </span>
                </div>

                <div class="impact-item-desc">
                  {{ impact.description }}
                </div>

                <div v-if="impact.affectedList.length > 0" class="impact-affected">
                  <span class="affected-label">
                    受影响组件：
                  </span>

                  <span v-for="(item, idx) in impact.affectedList" :key="idx" class="affected-tag">
                    {{ item }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 拓扑图视图 -->
        <div v-if="compOptions.activeTab === 'topology'" class="impact-topology-view">
          <PublishTopology
            :comp-options="{
              currentView: compOptions.currentView ?? 'l0',
              l0Nodes: compOptions.publishL0Nodes,
              l2Context: compOptions.publishL2Context,
              l2Hardware: compOptions.publishL2Hardware,
              l2Nodes: compOptions.publishL2Nodes,
              edgeList: compOptions.publishEdgeList,
              affectedNodes: compOptions.affectedNodeList
            }"
            @show-level0="$emit('show-level0')"
            @show-level2="$emit('show-level2')"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="publish-dialog-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">
          取消
        </button>

        <button class="btn btn-primary" @click="$emit('confirm')">
          确认发布
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import PublishTopology from '../publish-topology/index.vue';

/**
 * 影响分析项接口
 */
interface ImpactItem {
  type: string;
  icon: string;
  name: string;
  level: string;
  levelText: string;
  description: string;
  affectedList: string[];
}

/**
 * 发布对话框配置选项
 * 将多个相关配置合并为一个 options 对象
 */
interface PublishDialogOptions {
  // 状态配置
  activeTab?: 'text' | 'topology';
  currentView?: 'l0' | 'l2';

  // 版本信息
  currentVersion: string;
  nextVersion: string;

  // 影响分析数据
  impactAnalysisList: ImpactItem[];

  // 拓扑数据
  publishL0Nodes: any[];
  publishL2Context: any[];
  publishL2Hardware: any[];
  publishL2Nodes: any[];
  publishEdgeList: any[];
  affectedNodeList: string[];
}

/**
 * 组件属性定义
 */
const props = defineProps<{
  visible: boolean;
  compOptions: PublishDialogOptions;
}>();

/**
 * 组件事件定义
 */
defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:active-tab', value: 'text' | 'topology'): void;
  (e: 'show-level0'): void;
  (e: 'show-level2'): void;
  (e: 'cancel'): void;
  (e: 'confirm'): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
