<template>
  <div class="settings-security">
    <div class="settings-section-header">
      <h2 class="settings-section-title">
        安全设置
      </h2>

      <p class="settings-section-desc">
        管理账户安全和会话配置
      </p>
    </div>

    <div class="settings-form">
      <div class="settings-form-group">
        <label class="settings-form-label">
          会话超时时间
        </label>

        <div class="settings-input-with-unit">
          <el-input-number
            v-model="localSettings.sessionTimeout"
            :min="30"
            :max="1440"
            controls-position="right"
          />

          <span class="settings-unit">
            分钟
          </span>
        </div>
      </div>

      <div class="settings-form-group">
        <label class="settings-form-label">
          密码强度要求
        </label>

        <div class="settings-radio-group">
          <div
            v-for="item in passwordStrengthOptions"
            :key="item.value"
            class="settings-radio-item"
            :class="{ 'settings-radio-item--active': localSettings.passwordStrength === item.value }"
            @click="localSettings.passwordStrength = item.value"
          >
            <div class="settings-radio-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>

            <div class="settings-radio-content">
              <span class="settings-radio-label">
                {{ item.label }}
              </span>

              <span class="settings-radio-desc">
                {{ item.desc }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { ElInputNumber } from 'element-plus';
import { Unlock, Lock, CircleCheck } from '@element-plus/icons-vue';

const passwordStrengthOptions = [
  { value: 'low', label: '低', desc: '6位以上，仅包含数字或字母', icon: Unlock },
  { value: 'medium', label: '中', desc: '8位以上，包含数字和字母', icon: Lock },
  { value: 'high', label: '高', desc: '10位以上，包含数字、字母和特殊字符', icon: CircleCheck }
];

const localSettings = reactive({
  sessionTimeout: 120,
  passwordStrength: 'medium'
});

const emit = defineEmits<{
  (e: 'update:settings', value: typeof localSettings): void
}>();

watch(localSettings, () => {
  emit('update:settings', { ...localSettings });
}, { deep: true });

/**
 * 重置安全设置为默认值
 * @returns {void}
 */
defineExpose({
  localSettings,
  reset: () => {
    localSettings.sessionTimeout = 120;
    localSettings.passwordStrength = 'medium';
  }
});
</script>

<style lang="scss" scoped>
@use '@/views/settings/index.scss' as *;
</style>
