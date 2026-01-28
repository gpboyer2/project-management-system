<!--
  树节点编辑对话框组件
  用于新增/编辑体系层级节点、协议分类、报文等
-->
<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="400px"
    @update:model-value="handleVisibleChange"
  >
    <el-form :model="{ name: nodeName }" label-width="80px" @submit.prevent>
      <el-form-item :label="labelText">
        <el-input
          ref="inputRef"
          v-model="inputValue"
          :placeholder="placeholderText"
          @keyup.enter="handleEnterKey"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">
        取消
      </el-button>

      <el-button
        ref="confirmButtonRef"
        type="primary"
        @click="handleConfirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';

// 对话框模式类型
type DialogMode = 'add' | 'edit';
type DialogScope = 'hierarchy' | 'packet-category' | 'packet-message';

/**
 * 树节点编辑对话框配置选项
 */
interface TreeNodeEditDialogOptions {
  mode: DialogMode
  scope: DialogScope
  nodeName: string
}

// Props
const props = defineProps<{
  visible: boolean
  compOptions: TreeNodeEditDialogOptions;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', name: string): void
}>();

// 组件引用
const inputRef = ref<InstanceType<typeof ElInput> | null>(null);
const confirmButtonRef = ref<HTMLButtonElement | null>(null);

// 本地输入值
const inputValue = ref(props.compOptions.nodeName);

// 监听 nodeName 变化
watch(() => props.compOptions.nodeName, (newVal) => {
  inputValue.value = newVal;
});

// 监听 visible 变化，重置输入并聚焦
watch(() => props.visible, (visible) => {
  if (visible) {
    inputValue.value = props.compOptions.nodeName;
    // 弹窗打开时自动聚焦输入框
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// 对话框标题
const dialogTitle = computed(() => {
  const scope = props.compOptions.scope;
  const mode = props.compOptions.mode;
  if (scope === 'packet-message') return '新增报文';
  if (scope === 'packet-category') return mode === 'add' ? '新增分类' : '编辑分类';
  return mode === 'add' ? '新增节点' : '编辑节点';
});

// 标签文本
const labelText = computed(() => {
  const scope = props.compOptions.scope;
  if (scope === 'packet-message') return '报文名称';
  if (scope === 'packet-category') return '分类名称';
  return '节点名称';
});

// 占位符文本
const placeholderText = computed(() => {
  return `请输入${labelText.value}`;
});

// 处理回车键
function handleEnterKey() {
  // 使用 nextTick 确保输入框的值已经同步到响应式系统
  nextTick(() => {
    handleConfirm();
  });
}

// 处理显示状态变化
function handleVisibleChange(value: boolean) {
  emit('update:visible', value);
}

// 处理取消
function handleCancel() {
  emit('update:visible', false);
}

// 处理确认
function handleConfirm() {
  const name = String(inputValue.value || '').trim();

  if (!name) {
    return;
  }

  emit('confirm', name);
}
</script>

<style lang="scss" src="./index.scss"></style>
