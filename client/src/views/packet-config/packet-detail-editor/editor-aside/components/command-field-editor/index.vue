<!-- 命令字类型字段编辑器 (Command) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      命令字属性
    </div>

    <div class="form-group">
      <label class="form-label">
        基础类型
      </label>

      <el-select
        v-model="field.base_type"
        placeholder="请选择基础类型"
        style="width: 100%"
        @change="$emit('update', { path: '', property: 'base_type', value: field.base_type })"
      >
        <el-option label="无符号整数" value="unsigned" />

        <el-option label="有符号整数" value="signed" />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        基础长度
      </label>

      <el-select
        v-model="field.byte_length"
        placeholder="请选择字节长度"
        style="width: 100%"
        @change="$emit('update', { path: '', property: 'byte_length', value: field.byte_length })"
      >
        <el-option label="1字节" :value="1" />

        <el-option label="2字节" :value="2" />

        <el-option label="4字节" :value="4" />

        <el-option label="8字节" :value="8" />
      </el-select>
    </div>

    <div class="form-group">
      <label class="form-label">
        命令分支列表
        <span class="form-label-tip">
          （双击命令值进行修改）
        </span>
      </label>

      <div class="command-cases-list">
        <!-- 表头 -->
        <div v-if="field.cases && Object.keys(field.cases).length > 0" class="command-cases-header">
          <span class="command-cases-col">
            命令值
          </span>

          <span class="command-cases-col">
            子字段名称
          </span>
        </div>

        <!-- 命令分支列表 -->
        <div
          v-for="(caseField, caseKey) in field.cases || {}"
          :key="caseKey"
          class="command-cases-item"
        >
          <span
            class="command-cases-value"
            :class="{ 'is-editing': editingCommandKey === caseKey }"
            @dblclick="startEditingCommand(caseKey as string)"
          >
            <template v-if="editingCommandKey === caseKey">
              <input
                :ref="(el) => setCommandInputRef(el, caseKey as string)"
                type="text"
                class="form-control form-control-small"
                :value="caseKey"
                placeholder="命令值"
                @blur="stopEditingCommand"
                @keyup.enter="stopEditingCommand"
                @change="updateCommandCaseKey(caseKey as string, ($event.target as HTMLInputElement).value)"
              />
            </template>

            <template v-else>
              <span class="command-value-text" title="双击可编辑">
                {{ caseKey }}
              </span>
            </template>
          </span>

          <span class="command-cases-name">
            {{ (caseField as any).field_name || '未命名' }}
          </span>
        </div>

        <!-- 无命令分支时的提示 -->
        <div v-if="!field.cases || Object.keys(field.cases).length === 0" class="command-cases-empty">
          暂无命令分支，请在协议列表中点击命令字的 ➕ 按钮添加
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

defineProps<{
  field: any;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
}>();

const editingCommandKey = ref<string | null>(null);
const commandInputRefs = ref<Record<string, any>>({});

/**
 * 设置命令输入框的引用
 * @param {any} el - DOM 元素引用
 * @param {string} key - 命令值的键
 */
const setCommandInputRef = (el: any, key: string) => {
  if (el) {
    commandInputRefs.value[key] = el;
  }
};

/**
 * 开始编辑命令值
 * @param {string} key - 要编辑的命令值的键
 */
const startEditingCommand = (key: string) => {
  editingCommandKey.value = key;
  nextTick(() => {
    const el = commandInputRefs.value[key];
    if (el) {
      el.focus();
    }
  });
};

/**
 * 停止编辑命令值
 */
const stopEditingCommand = () => {
  editingCommandKey.value = null;
};

/**
 * 更新命令分支的键值
 * @param {string} oldKey - 原命令值
 * @param {string} newKey - 新命令值
 */
const updateCommandCaseKey = (oldKey: string, newKey: string) => {
  if (!props.field || !props.field.cases) return;

  const trimmedNewKey = newKey.trim();

  if (oldKey === trimmedNewKey) return;

  if (!trimmedNewKey) {
    ElMessage.warning('命令值不能为空');
    return;
  }

  if (props.field.cases[trimmedNewKey]) {
    ElMessage.warning(`命令值 ${trimmedNewKey} 已存在`);
    return;
  }

  const caseData = props.field.cases[oldKey];

  delete props.field.cases[oldKey];
  props.field.cases[trimmedNewKey] = caseData;

  props.field.fields = Object.entries(props.field.cases).map(([key, value]) => ({
    ...(value as any),
    field_name: `[${key}] ${((value as any).field_name || '').replace(/^\[.*?\]\s*/, '')}`.trim()
  }));

  ElMessage.success(`命令值已从 ${oldKey} 修改为 ${trimmedNewKey}`);
};
</script>

<style lang="scss" src="./index.scss"></style>
