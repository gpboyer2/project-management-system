<template>
  <span class="base-button">
    <button
      :class="buttonClass"
      :disabled="disabled"
      @click="handleClick"
    >
      <i v-if="icon" :class="icon" class="btn-icon" />

      <slot />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  icon?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false
});

const emit = defineEmits<{
  click: []
}>();

const buttonClass = computed(() => [
  'btn',
  `btn--${props.type}`,
  `btn--${props.size}`,
  {
    'btn--disabled': props.disabled
  }
]);

/**
 * 处理按钮点击事件
 * 当按钮未禁用时触发点击事件
 * @returns {void}
 */
function handleClick() {
  if (!props.disabled) {
    emit('click');
  }
}
</script>

<style lang="scss" src="./index.scss"></style>