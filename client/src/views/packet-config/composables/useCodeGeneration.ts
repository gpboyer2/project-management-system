import { ref, type Ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { h } from 'vue';
import { WarningFilled } from '@element-plus/icons-vue';
import type { Packet } from '@/stores/packet-config';
import { generateMessageCode } from '@/api/messageManagement';
import { copyToClipboard } from '@/utils/clipboard';

/**
 * 生成的代码文件接口
 */
interface GeneratedFile {
  name: string;
  relativePath: string;
  content: string;
}

/**
 * 代码生成配置选项接口
 */
interface UseCodeGenerationOptions {
  currentPacket: Ref<Packet | null>;
  hasUnsavedChanges: Ref<boolean>;
  onSaveBeforeGenerate?: () => Promise<void>;
}

/**
 * 代码生成组合函数
 * @param {UseCodeGenerationOptions} options - 配置选项
 * @returns {Object} 包含状态和方法的响应式对象
 */
export function useCodeGeneration(options: UseCodeGenerationOptions) {
  const { currentPacket, hasUnsavedChanges, onSaveBeforeGenerate } = options;

  const codePreviewVisible = ref(false);
  const isGeneratingCode = ref(false);
  const generatedFiles = ref<GeneratedFile[]>([]);
  const currentFileIndex = ref(0);

  /**
   * 复制代码到剪贴板
   * @param {string} content - 要复制的代码内容
   */
  function copyCode(content: string) {
    copyToClipboard(content, '代码已复制到剪贴板');
  }

  /**
   * 显示错误提示对话框
   * @param {any[]} errorList - 错误列表
   */
  function showErrorDialog(errorList: any[]) {
    const errorHtml = `
      <div style="max-height: 400px; overflow-y: auto;">
        <p style="margin-bottom: 12px; color: #606266;">请修复以下配置问题后重试：</p>
        <ol style="padding-left: 20px; margin: 0;">
          ${errorList.map((err: any) => `
            <li style="margin-bottom: 8px; line-height: 1.5;">
              <span style="color: #303133;">${err.message}</span>
              <div style="font-size: 12px; color: #909399;">位置: ${err.fieldPath}</div>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
    ElMessageBox.alert(errorHtml, '生成失败', {
      dangerouslyUseHTMLString: true,
      type: 'warning',
      confirmButtonText: '我知道了',
      customClass: 'validation-error-dialog',
      icon: h(WarningFilled, { style: { fontSize: '22px', color: '#faad14' } }),
    });
  }

  /**
   * 处理代码生成操作
   * 检查是否有未保存的更改，调用API生成代码，处理错误情况
   */
  async function handleGenerateCode() {
    if (!currentPacket.value || !currentPacket.value.id) {
      ElMessage.warning('请先保存报文');
      return;
    }

    if (hasUnsavedChanges.value) {
      try {
        await ElMessageBox.confirm('当前有未保存的更改，生成代码前需要保存，是否保存？', '提示', {
          confirmButtonText: '保存并生成',
          cancelButtonText: '取消',
          type: 'warning',
          icon: h(WarningFilled, { style: { fontSize: '22px', color: '#faad14' } }),
        });
        if (onSaveBeforeGenerate) {
          await onSaveBeforeGenerate();
        }
      } catch {
        return;
      }
    }

    codePreviewVisible.value = true;
    isGeneratingCode.value = true;
    generatedFiles.value = [];
    currentFileIndex.value = 0;

    try {
      const res = await generateMessageCode(currentPacket.value.id);
      if (!res || res.status !== 'success') {
        const errorList = (res as any)?.datum?.errorList;
        if (errorList && Array.isArray(errorList) && errorList.length > 0) {
          codePreviewVisible.value = false;
          showErrorDialog(errorList);
          return;
        }
        ElMessage.error(res?.message || '生成代码失败');
        return;
      }

      const fileList = (res as any)?.datum?.files;
      if (Array.isArray(fileList) && fileList.length > 0) {
        generatedFiles.value = fileList;
      } else {
        ElMessage.warning('未生成任何代码文件');
      }
    } catch (error: any) {
      console.error('生成代码失败:', error);
      const errorList = error?.response?.data?.datum?.errorList;
      if (errorList && errorList.length > 0) {
        codePreviewVisible.value = false;
        showErrorDialog(errorList);
      } else {
        ElMessage.error(error.message || '生成代码失败');
      }
    } finally {
      isGeneratingCode.value = false;
    }
  }

  return {
    codePreviewVisible,
    isGeneratingCode,
    generatedFiles,
    currentFileIndex,
    copyCode,
    handleGenerateCode,
  };
}

export type CodeGenerationReturn = ReturnType<typeof useCodeGeneration>;
