<!--
  关联报文弹窗组件
  用于节点接口视图中添加报文引用
  支持 TCP/UDP（MessageID）和 DDS（Topic/QoS）配置
-->
<template>
  <el-dialog
    :model-value="visible"
    title="关联报文到接口"
    width="560px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form @submit.prevent label-width="120px">
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
            {{ compOptions.connectionType === 'DDS' ? '订阅 (Subscriber)' : '接收 (input)' }}
          </el-radio>

          <el-radio label="output">
            {{ compOptions.connectionType === 'DDS' ? '发布 (Publisher)' : '发送 (output)' }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- TCP/UDP: 信息标识配置 -->
      <template v-if="compOptions.connectionType === 'TCP' || compOptions.connectionType === 'UDP'">
        <el-divider content-position="left">
          <span class="config-divider-text">TCP/UDP 配置</span>
        </el-divider>

        <el-form-item label="信息标识">
          <el-input
            :model-value="compOptions.form.comm_message_id"
            placeholder="例如: 0x01 或 1"
            @input="$emit('comm-message-id-change', $event)"
          />
        </el-form-item>
      </template>

      <!-- DDS: Topic/QoS 配置 -->
      <template v-if="compOptions.connectionType === 'DDS'">
        <el-divider content-position="left">
          <span class="config-divider-text">DDS 配置</span>
        </el-divider>

        <el-form-item label="Topic Name">
          <el-input
            :model-value="compOptions.form.topic_name"
            placeholder="DDS Topic 名称"
            @input="$emit('topic-name-change', $event)"
          />
        </el-form-item>

        <el-form-item label="Reliability">
          <el-select
            :model-value="compOptions.form.reliability"
            @change="$emit('reliability-change', $event)"
          >
            <el-option label="RELIABLE" value="reliable" />
            <el-option label="BEST_EFFORT" value="best_effort" />
          </el-select>
        </el-form-item>

        <el-form-item label="Durability">
          <el-select
            :model-value="compOptions.form.durability"
            @change="$emit('durability-change', $event)"
          >
            <el-option label="VOLATILE" value="volatile" />
            <el-option label="TRANSIENT_LOCAL" value="transient_local" />
          </el-select>
        </el-form-item>
      </template>
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
    // TCP/UDP 配置
    comm_message_id?: string;
    // DDS 配置
    topic_name?: string;
    reliability?: 'best_effort' | 'reliable';
    durability?: 'volatile' | 'transient_local';
  };
  loadingOptions: boolean;
  messageIdOptions: Array<{ value: string; label: string }>;
  versionOptions: Array<{ value: number; label: string }>;
  // 当前接口的连接类型
  connectionType?: string;
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
  // TCP/UDP 配置
  (e: 'comm-message-id-change', value: string): void;
  // DDS 配置
  (e: 'topic-name-change', value: string): void;
  (e: 'reliability-change', value: 'best_effort' | 'reliable'): void;
  (e: 'durability-change', value: 'volatile' | 'transient_local'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
