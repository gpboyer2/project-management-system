<!--
  关联报文弹窗组件
  用于节点接口视图中添加报文引用
-->
<template>
  <el-dialog
    :model-value="visible"
    title="关联报文到接口"
    width="560px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-width="120px" @submit.prevent>
      <el-form-item label="选择报文">
        <el-select
          :model-value="compOptions.form.message_id"
          placeholder="请选择报文（按 message_id 聚合）"
          filterable
          :loading="compOptions.loadingOptions"
          @change="$emit('message-id-change', $event)"
        >
          <el-option
            v-for="opt in compOptions.messageIdOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="选择版本">
        <el-select
          :model-value="compOptions.form.packet_id"
          placeholder="请选择已发布版本（packet_messages.id）"
          filterable
          :disabled="!compOptions.form.message_id"
          @change="$emit('packet-id-change', $event)"
        >
          <el-option
            v-for="opt in compOptions.versionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="方向">
        <el-radio-group
          :model-value="compOptions.form.direction"
          @change="$emit('direction-change', $event)"
        >
          <el-radio label="input">
            接收 (input)
          </el-radio>

          <el-radio label="output">
            发送 (output)
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('cancel')">
        取消
      </el-button>

      <el-button type="primary" @click="$emit('confirm')">
        确定关联
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 关联报文对话框配置选项
 * 将多个相关配置合并为一个 options 对象
 */
interface AddPacketDialogOptions {
  form: {
    message_id: string;
    packet_id: number | undefined;
    direction: 'input' | 'output';
  };
  loadingOptions: boolean;
  messageIdOptions: Array<{ value: string; label: string }>;
  versionOptions: Array<{ value: number; label: string }>;
}

defineProps<{
  visible: boolean;
  compOptions: AddPacketDialogOptions;
}>();

defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'message-id-change', value: string): void;
  (e: 'packet-id-change', value: number | undefined): void;
  (e: 'direction-change', value: 'input' | 'output'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
