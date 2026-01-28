<template>
  <div class="settings-notification">
    <div class="settings-section-header">
      <h2 class="settings-section-title">
        通知设置
      </h2>

      <p class="settings-section-desc">
        配置系统通知和消息推送
      </p>
    </div>

    <div class="settings-form">
      <div class="settings-switch-group">
        <div class="settings-switch-item">
          <div class="settings-switch-info">
            <el-icon class="settings-switch-icon"><Message /></el-icon>

            <div class="settings-switch-text">
              <span class="settings-switch-label">
                邮件通知
              </span>

              <span class="settings-switch-desc">
                接收系统邮件通知
              </span>
            </div>
          </div>

          <el-switch v-model="localSettings.email" />
        </div>

        <div class="settings-switch-item">
          <div class="settings-switch-info">
            <el-icon class="settings-switch-icon"><Bell /></el-icon>

            <div class="settings-switch-text">
              <span class="settings-switch-label">
                系统通知
              </span>

              <span class="settings-switch-desc">
                接收系统内通知消息
              </span>
            </div>
          </div>

          <el-switch v-model="localSettings.system" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ElSwitch } from 'element-plus';
import { Message, Bell } from '@element-plus/icons-vue';

const localSettings = reactive({
  email: true,
  system: true
});

const emit = defineEmits<{
  (e: 'update:settings', value: typeof localSettings): void
}>();

watch(localSettings, () => {
  emit('update:settings', { ...localSettings });
}, { deep: true });

/**
 * 重置通知设置为默认值
 * @returns {void}
 */
defineExpose({
  localSettings,
  reset: () => {
    localSettings.email = true;
    localSettings.system = true;
  }
});
</script>

<style lang="scss" scoped>
@use '@/views/settings/index.scss' as *;
</style>
