<!-- 流程图导入对话框组件 -->
<template>
  <div v-if="visible" class="import-dialog-overlay" @click="handleClose">
    <div class="import-dialog" @click.stop>
      <div class="dialog-header">
        <h3>导入流程</h3>

        <el-button class="dialog-close" link @click="handleClose">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <div class="dialog-content">
        <div class="form-field">
          <label>选择JSON文件</label>

          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            @change="handleFileChange"
          />
        </div>

        <div class="form-field">
          <label>或粘贴JSON数据</label>

          <textarea
            v-model="importData"
            rows="10"
            placeholder="粘贴流程图JSON数据..."
          />
        </div>
      </div>

      <div class="dialog-actions">
        <el-button class="button button-primary" type="primary" @click="handleConfirm">
          导入
        </el-button>

        <el-button class="button" @click="handleClose">
          取消
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElButton } from 'element-plus';

// Props
const props = defineProps<{
  visible: boolean
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: string): void
}>();

const fileInputRef = ref<HTMLInputElement>();
const importData = ref('');

// 监听显示状态，清空数据
watch(() => props.visible, (visible) => {
  if (visible) {
    importData.value = '';
  }
});

/**
 * 处理文件选择
 * @param {Event} event - 文件输入框的change事件对象
 * @returns {void} 无返回值
 */
function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      importData.value = e.target?.result as string;
    };
    reader.readAsText(file);
  }
}

/**
 * 处理确认导入
 * @description 将导入的JSON数据通过emit传递给父组件
 * @returns {void} 无返回值
 */
function handleConfirm() {
  emit('confirm', importData.value);
}

/**
 * 处理关闭对话框
 * @description 通过emit通知父组件关闭对话框
 * @returns {void} 无返回值
 */
function handleClose() {
  emit('close');
}
</script>

<style lang="scss" src="./index.scss"></style>
