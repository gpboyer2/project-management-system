<!--
  导入数据弹窗
  支持上传 ZIP 或 JSON 文件，选择导入策略，预览数据
-->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入数据"
    width="480px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="import-dialog-content">
      <el-upload
        drag
        :auto-upload="false"
        :limit="1"
        accept=".zip,.json"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
      >
        <el-icon><Upload /></el-icon>

        <div class="el-upload__text">
          拖拽文件到此处，或点击上传
        </div>

        <div class="el-upload__tip">
          支持 .zip 或 .json 文件
        </div>
      </el-upload>

      <div class="import-dialog-strategy">
        <p class="import-dialog-label">
          导入策略：
        </p>

        <el-radio-group v-model="strategy">
          <el-radio label="overwrite">
            完全覆盖 - 清空现有数据，用导入替换
          </el-radio>

          <el-radio label="merge">
            智能合并 - 已存在更新，不存在新增
          </el-radio>

          <el-radio label="append">
            仅追加 - 保留现有，仅添加新数据
          </el-radio>
        </el-radio-group>
      </div>

      <div v-if="previewData" class="import-dialog-preview">
        <div class="import-dialog-preview-header">
          <el-icon><TrendCharts /></el-icon>

          <span>数据预览</span>
        </div>

        <div
          v-for="(item, key) in previewData"
          :key="key"
          class="import-dialog-preview-item"
        >
          检测到模块：{{ moduleNameMap[key] || key }} ({{ item.count }} 条)
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">
        取消
      </el-button>

      <el-button
        type="primary"
        :disabled="!file || !strategy"
        :loading="importing"
        @click="handleImport"
      >
        导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload, TrendCharts } from '@element-plus/icons-vue';
import type { UploadFile, UploadUserFile } from 'element-plus';
import JSZip from 'jszip';
import { handleFileRemove as dialogHandleFileRemove } from '@/utils/dialogUtils';

interface PreviewData {
  [key: string]: { count: number };
}

const moduleNameMap: Record<string, string> = {
  hierarchy: '体系层级',
  protocols: '协议集'
};

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'import', file: File, strategy: string): void;
}>();

const file = ref<File | null>(null);
const fileList = ref<UploadUserFile[]>([]);
const strategy = ref<string>('merge');
const previewData = ref<PreviewData | null>(null);
const importing = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

/**
 * 处理文件上传变化事件
 * @param {UploadFile} uploadFile - 上传的文件对象
 * @returns {Promise<void>}
 */
async function handleFileChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw;
  if (!rawFile) return;

  const fileName = rawFile.name.toLowerCase();
  const isValidFormat = fileName.endsWith('.zip') || fileName.endsWith('.json');

  if (!isValidFormat) {
    ElMessage.error('文件格式不正确，请上传 .zip 或 .json 文件');
    fileList.value = [];
    file.value = null;
    previewData.value = null;
    return;
  }

  file.value = rawFile;

  try {
    if (fileName.endsWith('.zip')) {
      await parseZipFile(rawFile);
    } else {
      await parseJsonFile(rawFile);
    }
  } catch (err) {
    console.error('解析文件失败:', err);
    ElMessage.error('解析文件失败，请检查文件格式');
    previewData.value = null;
  }
}

/**
 * 解析 ZIP 文件并生成预览数据
 * @param {File} zipFile - ZIP 文件对象
 * @returns {Promise<void>}
 */
async function parseZipFile(zipFile: File) {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);

  const preview: PreviewData = {};

  for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
    if (zipEntry.dir) continue;

    const fileName = relativePath.split('/').pop() || '';
    if (fileName.endsWith('.json')) {
      try {
        const content = await zipEntry.async('text');
        const data = JSON.parse(content);

        if (data.module === 'hierarchy' && Array.isArray(data.data)) {
          preview.hierarchy = { count: data.data.length };
        } else if (data.module === 'protocols' && Array.isArray(data.data)) {
          preview.protocols = { count: countProtocolItems(data.data) };
        }
      } catch {
        console.warn(`无法解析文件: ${fileName}`);
      }
    }
  }

  previewData.value = Object.keys(preview).length > 0 ? preview : null;
}

/**
 * 解析 JSON 文件并生成预览数据
 * @param {File} jsonFile - JSON 文件对象
 * @returns {Promise<void>}
 */
async function parseJsonFile(jsonFile: File) {
  const text = await jsonFile.text();
  const data = JSON.parse(text);

  const preview: PreviewData = {};

  if (data.module === 'hierarchy' && Array.isArray(data.data)) {
    preview.hierarchy = { count: data.data.length };
  } else if (data.module === 'protocols' && Array.isArray(data.data)) {
    preview.protocols = { count: countProtocolItems(data.data) };
  }

  previewData.value = Object.keys(preview).length > 0 ? preview : null;
}

/**
 * 递归统计协议数据项的总数
 * @param {any[]} data - 协议数据数组
 * @returns {number} 数据项总数
 */
function countProtocolItems(data: any[]): number {
  let count = 0;
  function traverse(items: any[]) {
    for (const item of items) {
      count++;
      if (item.children && Array.isArray(item.children)) {
        traverse(item.children);
      }
    }
  }
  traverse(data);
  return count;
}

/**
 * 处理文件移除事件
 * @returns {void}
 */
function handleFileRemove() {
  dialogHandleFileRemove(file, fileList, previewData);
}

/**
 * 处理导入操作
 * @returns {Promise<void>}
 */
async function handleImport() {
  if (!file.value) {
    ElMessage.warning('请先选择文件');
    return;
  }

  if (!strategy.value) {
    ElMessage.warning('请选择导入策略');
    return;
  }

  importing.value = true;
  try {
    emit('import', file.value, strategy.value);
  } finally {
    importing.value = false;
  }
}

/**
 * 处理对话框关闭事件，重置所有状态
 * @returns {void}
 */
function handleClosed() {
  file.value = null;
  fileList.value = [];
  previewData.value = null;
  strategy.value = 'merge';
  importing.value = false;
}
</script>

<style lang="scss" src="./index.scss"></style>
