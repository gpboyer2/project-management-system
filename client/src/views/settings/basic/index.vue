<template>
  <div class="settings-basic">
    <div class="settings-section-header">
      <h2 class="settings-section-title">
        基础设置
      </h2>

      <p class="settings-section-desc">
        配置系统的基本信息和显示参数
      </p>
    </div>

    <div class="settings-form">
      <div class="settings-form-group">
        <label class="settings-form-label">
          系统名称
        </label>

        <el-input v-model="localSettings.systemName" placeholder="请输入系统名称" />
      </div>

      <div class="settings-form-group">
        <label class="settings-form-label">
          系统描述
        </label>

        <el-input
          v-model="localSettings.description"
          type="textarea"
          :rows="3"
          placeholder="请输入系统描述"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ElInput } from 'element-plus';

const localSettings = reactive({
  systemName: 'Node-View流程设计器',
  description: '基于LogicFlow的可视化流程设计工具'
});

const emit = defineEmits<{
  (e: 'update:settings', value: typeof localSettings): void
}>();

watch(localSettings, () => {
  emit('update:settings', { ...localSettings });
}, { deep: true });

/**
 * 重置基础设置为默认值
 * @returns {void}
 */
defineExpose({
  localSettings,
  reset: () => {
    localSettings.systemName = 'Node-View流程设计器';
    localSettings.description = '基于LogicFlow的可视化流程设计工具';
  }
});
</script>

<style lang="scss" scoped>
@use '@/views/settings/index.scss' as *;
</style>
