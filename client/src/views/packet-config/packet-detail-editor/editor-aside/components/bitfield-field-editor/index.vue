<!-- 位域字段编辑器 (Bitfield) -->
<template>
  <div class="form-section">
    <div class="form-section-title">
      位域属性
    </div>

    <div class="form-group">
      <label class="form-label">
        字段名称及比特位起止位置
      </label>

      <div class="bitfield-list">
        <div
          v-for="(bitField, idx) in field.sub_fields || []"
          :key="idx"
          class="bitfield-item"
        >
          <div class="bitfield-header">
            <input
              :value="bitField.name"
              type="text"
              class="form-control form-control-inline"
              placeholder="字段名称"
              @input="$emit('update', { path: 'sub_fields.' + idx, property: 'name', value: $event.target.value })"
            />

            <input
              v-model.number="bitField.start_bit"
              type="number"
              class="form-control form-control-inline form-control-small"
              placeholder="起始位"
            />

            <span>-</span>

            <input
              v-model.number="bitField.end_bit"
              type="number"
              class="form-control form-control-inline form-control-small"
              placeholder="结束位"
            />

            <button
              class="btn-remove"
              @click="$emit('remove', { path: 'sub_fields', index: idx })"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>

          <div class="bitfield-mapping">
            <div
              v-for="(mapping, mIdx) in bitField.maps || []"
              :key="mIdx"
              class="value-mapping-item"
            >
              <input
                v-model.number="mapping.value"
                type="number"
                class="form-control form-control-inline"
                placeholder="取值"
              />

              <input
                v-model="mapping.meaning"
                type="text"
                class="form-control form-control-inline"
                placeholder="含义"
              />

              <button
                class="btn-remove"
                type="button"
                @click="$emit('remove', { path: 'sub_fields.' + idx + '.maps', index: mIdx })"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>

            <button
              class="btn-add btn-add-small"
              type="button"
              @click="$emit('add', { path: 'sub_fields.' + idx + '.maps', item: { value: 0, meaning: '' } })"
            >
              + 添加取值
            </button>
          </div>
        </div>

        <button
          class="btn-add"
          type="button"
          @click="$emit('add', { path: 'sub_fields', item: { name: '', start_bit: 0, end_bit: 0 } })"
        >
          + 添加位域字段
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';

const props = defineProps<{
  field: any;
}>();

defineEmits<{
  (e: 'update', payload: { path: string; property: string; value: any }): void;
  (e: 'remove', payload: { path: string; index: number }): void;
  (e: 'add', payload: { path: string; item: any }): void;
}>();
</script>

<style lang="scss" src="./index.scss"></style>
