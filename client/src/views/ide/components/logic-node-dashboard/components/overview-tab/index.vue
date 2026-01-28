<!--
  节点概览 Tab
  显示节点基本信息（名称、版本、描述），支持编辑保存
-->
<template>
  <div class="ide-dashboard-overview">
    <div class="ide-dashboard-info-section">
      <div class="ide-dashboard-info-form">
        <div class="ide-dashboard-info-field">
          <label class="ide-dashboard-info-label">
            <span class="ide-dashboard-info-required">*</span>
            名称：
          </label>

          <input
            v-model="formData.name"
            type="text"
            class="ide-dashboard-info-input"
            placeholder="请输入名称"
            @change="handleSaveInfo"
          />
        </div>

        <div class="ide-dashboard-info-field">
          <label class="ide-dashboard-info-label">版本：</label>

          <input
            v-model="formData.version"
            type="text"
            class="ide-dashboard-info-input"
            placeholder="请输入版本号"
            @change="handleSaveInfo"
          />
        </div>

        <div class="ide-dashboard-info-field">
          <label class="ide-dashboard-info-label">描述：</label>

          <textarea
            v-model="formData.description"
            class="ide-dashboard-info-textarea"
            rows="4"
            placeholder="请输入描述信息"
            @change="handleSaveInfo"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useSystemLevelDesignStore } from '@/stores';
import { MESSAGE } from '@/constants';

const props = defineProps<{
  nodeId: string;
  nodeData?: any;
}>();

const emit = defineEmits<{
  (e: 'error', error: any): void;
}>();

const systemDesignStore = useSystemLevelDesignStore();

const formData = ref({
  name: '',
  version: '',
  description: ''
});

/**
 * 初始化表单数据
 * 从 props.nodeData 中提取节点信息，填充表单
 * @returns {void} 无返回值
 */
function initFormData() {
  if (props.nodeData) {
    const props_data = props.nodeData.properties || {};
    formData.value = {
      name: props_data['名称'] || props.nodeData.name || '',
      version: props_data['版本'] || props.nodeData.version || '',
      description: props_data['描述'] || props.nodeData.description || ''
    };
  } else {
    formData.value = {
      name: '',
      version: '',
      description: ''
    };
  }
}

/**
 * 保存节点基本信息
 * 将表单数据更新到系统层级设计节点
 * @returns {Promise<void>} 无返回值
 */
async function handleSaveInfo() {
  try {
    await systemDesignStore.updateHierarchyNode(props.nodeId, {
      '名称': formData.value.name,
      '版本': formData.value.version,
      '描述': formData.value.description
    });

    ElMessage.success(MESSAGE.SAVE_SUCCESS);
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(MESSAGE.SAVE_FAILED);
  }
}

watch(() => props.nodeData, initFormData, { immediate: true });
</script>

<style lang="scss" scoped>
@use '../../../index.scss' as *;
@use './index.scss' as *;
</style>
