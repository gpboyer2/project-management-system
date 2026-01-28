<template>
  <teleport to="body">
    <span v-if="visible" class="base-modal">
      <div class="modal-overlay" @click="handleOverlayClick">
        <div class="modal" :class="`modal--${size}`" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ title }}
            </h3>

            <button class="modal-close" @click="handleClose">
              <i class="icon-close">
                ×
              </i>
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </span>
  </teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  size?: 'small' | 'medium' | 'large'
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'medium',
  closeOnOverlay: true
});

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  close: []
}>();

/**
 * 处理遮罩层点击事件
 * 当允许点击遮罩层关闭时触发关闭操作
 * @returns {void}
 */
function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleClose();
  }
}

/**
 * 处理关闭弹窗事件
 * 触发更新可见性状态和关闭事件
 * @returns {void}
 */
function handleClose() {
  emit('update:visible', false);
  emit('close');
}
</script>

<style lang="scss" src="./index.scss"></style>