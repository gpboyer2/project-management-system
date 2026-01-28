<!--
  逻辑流 Tab
  显示节点的逻辑流列表，支持添加、配置逻辑流
-->
<template>
  <div class="ide-logic-list">
    <div class="ide-logic-header">
      <h3 class="ide-logic-title">
        逻辑流列表
      </h3>

      <button class="ide-logic-add-btn" @click="handleAddLogic">
        <el-icon><Plus /></el-icon>
        新建逻辑
      </button>
    </div>

    <div v-if="logicList.length > 0" class="ide-logic-items">
      <div
        v-for="logic in logicList"
        :key="logic.id"
        class="ide-logic-card"
      >
        <div class="ide-logic-card-left">
          <div class="ide-logic-icon">
            <svg
              class="ide-logic-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>

          <div class="ide-logic-info">
            <h4 class="ide-logic-name">
              {{ logic.name }}
            </h4>

            <p class="ide-logic-trigger">
              触发: {{ logic.trigger }}
            </p>
          </div>
        </div>

        <button class="ide-logic-edit-btn" @click="handleConfigLogic(logic)">
          <svg
            class="ide-logic-edit-btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>

          <span>编排</span>
        </button>
      </div>
    </div>

    <div v-else class="ide-list-empty">
      <p>暂无逻辑流配置</p>

      <button class="ide-logic-add-btn" @click="handleAddLogic">
        <el-icon><Plus /></el-icon>
        新建逻辑
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

const nodeId = computed(() => {
  return route.query.systemNodeId as string || '';
});

const logicList = ref([
  { id: 'lg-foc', name: 'FOC_Control_Loop', trigger: 'Cyclic (50μs)' },
  { id: 'lg-thermal', name: 'Thermal_Monitor', trigger: 'Cyclic (100ms)' }
]);

/**
 * 配置逻辑流
 * 跳转到逻辑流编排页面
 * @param {any} logic - 逻辑流对象
 * @returns {void} 无返回值
 */
function handleConfigLogic(logic: any) {
  const id = nodeId.value;
  if (!id) return;

  router.push({
    path: '/editor/ide/flow',
    query: {
      systemNodeId: id,
      logicId: logic.id
    }
  });
}

/**
 * 添加新逻辑流
 * 生成新的逻辑流 ID，然后跳转到编排页面
 * @returns {void} 无返回值
 */
function handleAddLogic() {
  const id = nodeId.value;
  if (!id) return;

  const newLogicId = `logic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  router.push({
    path: '/editor/ide/flow',
    query: {
      systemNodeId: id,
      logicId: newLogicId
    }
  });
}
</script>

<style lang="scss" scoped>
@use '../../../index.scss' as *;
@use './index.scss' as *;
</style>
