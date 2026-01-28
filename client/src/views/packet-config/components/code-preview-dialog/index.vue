<!-- 代码生成预览弹窗 -->
<template>
  <el-dialog
    :model-value="visible"
    title="代码预览"
    width="80%"
    top="5vh"
    custom-class="code-preview-dialog"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-loading="options.loading" class="code-preview-content">
      <div v-if="options.files.length > 0" class="code-viewer">
        <div class="file-list">
          <div
            v-for="(file, index) in options.files"
            :key="index"
            class="file-item"
            :class="{ active: currentIndex === index }"
            @click="$emit('update:current-index', index)"
          >
            <el-icon><Document /></el-icon>
            {{ file.name }}
          </div>
        </div>

        <div class="code-content">
          <div class="code-header">
            <span>{{ options.files[currentIndex]?.relativePath }}</span>

            <button class="copy-btn" @click="$emit('copy', options.files[currentIndex]?.content)">
              <el-icon><CopyDocument /></el-icon> 复制
            </button>
          </div>

          <pre><code class="hljs language-cpp" v-html="highlightedCode" /></pre>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        暂无代码生成
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import 'highlight.js/styles/vs.css';
import { Document, CopyDocument } from '@element-plus/icons-vue';

hljs.registerLanguage('cpp', cpp);

interface GeneratedFile {
  name: string;
  relativePath: string;
  content: string;
}

/** 代码预览对话框配置选项 */
interface CodePreviewDialogOptions {
  loading: boolean;
  files: GeneratedFile[];
}

const props = defineProps<{
  visible: boolean;
  compOptions: CodePreviewDialogOptions;
  currentIndex: number;
}>();

defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:current-index', value: number): void;
  (e: 'copy', content: string): void;
}>();

const highlightedCode = computed(() => {
  const content = props.compOptions.files[props.currentIndex]?.content;
  if (!content) return '';
  try {
    return hljs.highlight(content, { language: 'cpp' }).value;
  } catch {
    return content;
  }
});
</script>

<style lang="scss" src="./index.scss"></style>
