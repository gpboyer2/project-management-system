<template>
  <div class="details-content">
    <div class="details-header">
      <h3>{{ editType === 'edit' ? `编辑${levelName}` : `新增${levelName}` }}</h3>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="details-loading">
      <el-icon class="is-loading" :size="24">
        <Loading />
      </el-icon>

      <span>加载中...</span>
    </div>

    <div v-else class="details-content-body">
      <!-- 动态字段渲染 -->
      <div v-for="field in levelFields" :key="field.id" class="form-group">
        <label :class="{ required: field.required }">
          {{ field.name }}：
        </label>

        <input
          v-if="field.type === 'string' || field.type === 'number'"
          v-model="localDatum[field.name]"
          :type="field.type === 'number' ? 'number' : 'text'"
          :placeholder="field.placeholder || `请输入${field.name}`"
          class="form-input"
        />

        <textarea
          v-else-if="field.type === 'textarea'"
          v-model="localDatum[field.name]"
          :placeholder="field.placeholder || `请输入${field.name}`"
          class="form-textarea"
        />

        <input
          v-else-if="field.type === 'date'"
          v-model="localDatum[field.name]"
          type="date"
          class="form-input"
        />

        <select
          v-else-if="field.type === 'select' && field.options"
          v-model="localDatum[field.name]"
          class="form-input"
        >
          <option value="">
            请选择
          </option>

          <option v-for="opt in field.options" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>

      <!-- 数据处理流程（独立模块） -->
      <div v-if="currentLevel?.enable_comm_node_list" class="comm-node-list-section">
        <div class="comm-node-list-title">
          <span>数据处理流程</span>

          <el-button type="primary" icon="Plus" @click="goToFlowchart()">
            新增流程
          </el-button>
        </div>

        <div v-if="commNodeList.length === 0" class="comm-node-empty">
          暂无处理流程，点击"新增"添加
        </div>

        <div v-else class="comm-node-items">
          <div v-for="(commNode, idx) in commNodeList" :key="commNode.id" class="comm-node-item">
            <div class="comm-node-info" @click="goToFlowchart(commNode)">
              <span class="comm-node-index">
                {{ idx + 1 }}
              </span>

              <span class="comm-node-icon">
                <el-icon :size="16">
                  <Connection />
                </el-icon>
              </span>

              <div class="comm-node-main">
                <span class="comm-node-name">
                  {{ commNode.name || '未命名流程' }}
                </span>

                <span v-if="commNode.updated_at" class="comm-node-time">
                  更新于 {{ formatTime(commNode.updated_at) }}
                </span>
              </div>

              <el-tag
                v-if="commNode.status"
                :type="commNode.status === 'active' ? 'success' : 'info'"
                size="small"
              >
                {{ commNode.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </div>

            <div class="comm-node-actions">
              <el-tooltip content="删除" placement="top">
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  @click.stop="removeCommNode(idx)"
                />
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <el-button type="primary" icon="Check" @click="handleSave">
          保存数据
        </el-button>

        <el-button
          v-if="currentLevel?.enable_comm_node_list"
          type="primary"
          icon="DocumentCopy"
          :disabled="commNodeList.length === 0"
          @click="handleGenerateCode"
        >
          生成代码
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, h, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useSystemLevelDesignStore } from '@/stores/system-level-design';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { systemLevelDesignTreeApi, flowchartApi } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Connection, Delete, Loading, CircleCheck, Warning } from '@element-plus/icons-vue';

// 组件配置选项接口
interface CompOptions {
  levelConfig: {
    id: string
    display_name: string
    fields: Array<{
      id: string
      name: string
      type: 'string' | 'number' | 'textarea' | 'date' | 'select'
      required?: boolean
      placeholder?: string
      defaultValue?: string | number
      options?: string[]
      order?: number
    }>
    enable_comm_node_list?: boolean
  }
}

// Props
const props = defineProps<{
  formData: {
    id?: string
    parentId?: string
  }
  editType: 'add' | 'edit'
  compOptions: CompOptions
}>();

// Emits
const emit = defineEmits<{
  submit: []
}>();

// Store & Router
const systemDesignStore = useSystemLevelDesignStore();
const router = useRouter();

// 获取当前层级配置（从 compOptions 获取）
const currentLevel = computed(() => props.compOptions.levelConfig);

// 层级名称
const levelName = computed(() => currentLevel.value?.display_name || '节点');

// 获取层级字段配置（从 compOptions 获取）
const levelFields = computed(() => currentLevel.value?.fields || []);

// 本地编辑数据
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localDatum = ref<Record<string, any>>({});

// 加载节点详情的 loading 状态
const loading = ref(false);

/**
 * 初始化表单数据
 * - 新增模式：使用字段默认值
 * - 编辑模式：从 API 获取节点最新数据
 */
const initializeData = async () => {
  console.log('[NodeForm] initializeData 开始执行', {
    editType: props.editType,
    formDataId: props.formData.id,
    levelConfigId: props.compOptions.levelConfig.id
  });

  const fields = levelFields.value;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newData: Record<string, any> = {};

  // 初始化所有字段默认值
  fields.forEach(field => {
    newData[field.name] = field.defaultValue || '';
  });

  // 编辑模式：从 API 获取最新数据
  if (props.editType === 'edit' && props.formData.id) {
    console.log('[NodeForm] 编辑模式，准备调用 getNodeById 接口，节点 ID:', props.formData.id);
    loading.value = true;
    try {
      const node = await systemDesignStore.getNodeById(props.formData.id);
      console.log('[NodeForm] getNodeById 接口返回成功:', node);
      if (node) {
        fields.forEach(field => {
          newData[field.name] = node[field.name] || field.defaultValue || '';
        });
      }
    } catch (error) {
      console.error('[NodeForm] 获取节点详情失败:', error);
      // 降级：从 store 本地获取
      const node = systemDesignStore.findNodeById(systemDesignStore.hierarchyNodes, props.formData.id);
      if (node) {
        fields.forEach(field => {
          newData[field.name] = node[field.name] || field.defaultValue || '';
        });
      }
    } finally {
      loading.value = false;
    }
  } else {
    console.log('[NodeForm] 非编辑模式或缺少 ID，跳过接口调用');
  }

  localDatum.value = newData;
  console.log('[NodeForm] initializeData 完成，localDatum:', localDatum.value);
};

/**
 * 保存节点数据（新增或更新）
 */
const handleSave = async () => {
  // 验证必填字段
  const requiredFields = levelFields.value.filter(f => f.required);
  for (const field of requiredFields) {
    if (!localDatum.value[field.name] || String(localDatum.value[field.name]).trim() === '') {
      ElMessage.warning(`请输入${field.name}`);
      return;
    }
  }

  try {
    const nameField = levelFields.value.find(f => f.name === '名称');
    const nodeName = nameField ? localDatum.value[nameField.name] : '节点';

    if (props.editType === 'edit' && props.formData.id) {
      // 编辑模式 - 调用 API（所有字段都保存到 properties）
      await systemDesignStore.updateHierarchyNode(props.formData.id, { ...localDatum.value });
      ElMessage.success(`${levelName.value}"${nodeName}"更新成功`);
    } else {
      // 新增模式 - 调用 API
      const newNode = await systemDesignStore.addHierarchyNode(
        props.formData.parentId || null,
        props.compOptions.levelConfig.id,
        { ...localDatum.value }
      );
      ElMessage.success(`${levelName.value}"${nodeName}"添加成功`);
    }
    emit('submit');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('操作失败，请重试');
  }
};

/**
 * 生成代码并自动下载
 * - 成功：自动下载 ZIP 文件，显示详细信息弹窗
 * - 失败：显示错误列表或错误提示
 */
const handleGenerateCode = async () => {
  if (!props.formData.id) {
    ElMessage.warning('请先保存节点');
    return;
  }
  ElMessage.info('正在生成代码，请稍候...');
  const response = await systemLevelDesignTreeApi.generateCode(props.formData.id);
  if (response.status === 'success') {
    // 显示成功提示
    ElMessage.success('代码生成成功，正在下载...');

    // 自动触发下载
    if (response.datum.downloadUrl) {
      // 使用 fetch 下载，以便携带认证信息
      try {
        const token = localStorage.getItem('token');
        const fetchResponse = await fetch(response.datum.downloadUrl, {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!fetchResponse.ok) {
          throw new Error(`下载失败: ${fetchResponse.status}`);
        }

        // 获取文件 blob 并触发下载
        const blob = await fetchResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = response.datum.zipFileName || 'generated_code.zip';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.error('下载文件失败:', downloadError);
        ElMessage.error('下载文件失败，请重试');
      }
    }

    // 显示详细信息
    const successHtml = `
      <div style="padding: 10px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #606266; width: 80px; text-align: right; margin-right: 12px;">节点名称：</span>
          <span style="color: #303133; font-weight: 500; font-size: 15px;">${response.datum.nodeName}</span>
        </div>
        <div style="display: flex; align-items: baseline; margin-bottom: 16px;">
          <span style="color: #606266; width: 80px; text-align: right; margin-right: 12px;">文件名称：</span>
          <span style="color: #303133; font-family: monospace; word-break: break-all;">${response.datum.zipFileName || '无'}</span>
        </div>
      </div>
    `;

    ElMessageBox.alert(
      successHtml,
      '代码生成完成',
      {
        type: 'success',
        confirmButtonText: '确定',
        dangerouslyUseHTMLString: true,
        customClass: 'code-gen-success-dialog',
        center: true,
        icon: h(resolveComponent('el-icon'), { style: { fontSize: '22px', color: '#52c41a' } }, () => h(CircleCheck)),
      }
    );
  } else {
    // 检查是否有结构化的错误列表
    const errorList = response.datum?.errorList;
    if (errorList && errorList.length > 0) {
      // 用 Dialog 展示错误列表
      const errorHtml = `
        <div style="max-height: 400px; overflow-y: auto;">
          <p style="margin-bottom: 12px; color: #606266;">请修复以下报文配置问题后重试：</p>
          <ol style="padding-left: 20px; margin: 0;">
            ${errorList.map((err: any) => `
              <li style="margin-bottom: 8px; line-height: 1.5;">
                <span style="color: #409EFF; font-weight: 500;">【${err.packetName}】</span>
                <span style="color: #303133;">${err.message}</span>
              </li>
            `).join('')}
          </ol>
        </div>
      `;
      ElMessageBox.alert(errorHtml, '报文配置校验失败', {
        dangerouslyUseHTMLString: true,
        type: 'warning',
        confirmButtonText: '我知道了',
        customClass: 'validation-error-dialog',
        icon: h(resolveComponent('el-icon'), { style: { fontSize: '22px', color: '#faad14' } }, () => h(Warning)),
      });
    } else {
      // 普通错误用 toast
      ElMessage.error(response.message || '生成代码失败');
    }
  }
};

// 通信节点列表（从 API 获取）
interface CommNode {
  id: string
  name: string
  node_id: string
  status?: string
  flow_version?: string
  created_at?: number
  updated_at?: number
}
const commNodeList = ref<CommNode[]>([]);

/**
 * 加载通信节点列表
 */
const loadCommNodeList = async () => {
  // 新增模式或未启用通信节点列表时，清空数据
  if (!props.formData.id || !currentLevel.value?.enable_comm_node_list) {
    commNodeList.value = [];
    return;
  }
  const response = await flowchartApi.getCommNodeList(props.formData.id);
  if (response.status === 'success') {
    commNodeList.value = response.datum || [];
  } else {
    commNodeList.value = [];
  }
};

/**
 * 删除通信节点
 * @param {number} index - 通信节点在列表中的索引
 */
const removeCommNode = async (index: number) => {
  const commNode = commNodeList.value[index];
  if (!commNode) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除通信节点"${commNode.name}"吗？关联的流程图也会被删除。`,
      '确认删除',
      {
        type: 'warning',
        icon: h(resolveComponent('el-icon'), { style: { fontSize: '22px', color: '#faad14' } }, () => h(Warning)),
      }
    );
    const response = await flowchartApi.deleteCommNode(commNode.id);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      await loadCommNodeList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      // User cancelled the confirmation dialog
    }
  }
};

/**
 * 跳转到流程图页面
 * - 新增模式：只带 archNodeId，显示空白画布
 * - 编辑模式：带 archNodeId + commNodeId，加载已有流程图
 * @param {{ id: string; name: string }} commNode - 可选，编辑已有流程时传入
 */
const goToFlowchart = (commNode?: { id: string; name: string }) => {
  const query: Record<string, string> = { archNodeId: props.formData.id || '' };
  if (commNode) {
    query.commNodeId = commNode.id;
  }
  router.push({ path: '/flowchart', query });
};

/**
 * 格式化时间戳为相对时间或绝对时间
 * @param {number} timestamp - Unix 时间戳（毫秒）
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 一分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  // 一小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }
  // 今天内
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  // 其他
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 监听 props 变化
watch(() => [props.formData.id, props.compOptions.levelConfig.id, props.editType], () => {
  initializeData();
  loadCommNodeList();
}, { immediate: true });
</script>

<style lang="scss" src="./index.scss"></style>
