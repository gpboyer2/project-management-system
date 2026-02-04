<template>
  <div class="process-node-type-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">流程节点类型管理</h1>
        <p class="page-subtitle">管理流程编排中的节点类型</p>
      </div>
      <div class="header-right">
        <el-button type="primary" class="create-btn" @click="handleCreateProcessNodeType">
          <el-icon><Plus /></el-icon>
          创建节点类型
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item>
            <el-input
              v-model="searchForm.name"
              placeholder="搜索节点类型名称"
              clearable
              style="width: 240px"
              prefix-icon="Search"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 节点类型列表 -->
    <div class="list-section">
      <el-card class="list-card">
        <el-table
          :data="processNodeTypeList"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="name" label="节点类型名称" min-width="200">
            <template #default="scope">
              <div class="node-type-name">
                <el-tag
                  :type="getTypeColor(scope.row.type)"
                  size="small"
                  class="type-tag"
                >
                  {{ getTypeText(scope.row.type) }}
                </el-tag>
                <el-button
                  type="primary"
                  link
                  @click="handleViewProcessNodeType(scope.row)"
                  class="name-link"
                >
                  {{ scope.row.name }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="节点类型描述" min-width="250">
            <template #default="scope">
              <div class="node-type-description">{{ scope.row.description }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="节点类型" width="120">
            <template #default="scope">
              <el-tag :type="getTypeColor(scope.row.type)" size="small">
                {{ getTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort_order" label="排序" width="80">
            <template #default="scope">
              {{ scope.row.sort_order || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="150">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="text"
                size="small"
                @click="handleEditProcessNodeType(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="text"
                size="small"
                text-color="#ff4d4f"
                @click="handleDeleteProcessNodeType(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </el-card>
    </div>

    <!-- 节点类型详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProcessNodeType.name || '节点类型详情'"
      width="800px"
      class="process-node-type-detail-dialog"
    >
      <el-tabs v-model="activeTab" type="card" class="detail-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="节点类型名称">{{ currentProcessNodeType.name }}</el-descriptions-item>
            <el-descriptions-item label="节点类型">
              <el-tag :type="getTypeColor(currentProcessNodeType.type)" size="small">
                {{ getTypeText(currentProcessNodeType.type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="节点类型描述" :span="2">{{ currentProcessNodeType.description }}</el-descriptions-item>
            <el-descriptions-item label="排序">{{ currentProcessNodeType.sort_order || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentProcessNodeType.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(currentProcessNodeType.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 配置信息 -->
        <el-tab-pane label="配置信息" name="config">
          <div v-if="currentProcessNodeType.config" class="config-content">
            <pre>{{ JSON.stringify(currentProcessNodeType.config, null, 2) }}</pre>
          </div>
          <el-empty v-else description="暂无配置信息" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑节点类型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建节点类型' : '编辑节点类型'"
      width="600px"
      class="process-node-type-dialog"
    >
      <el-form
        ref="processNodeTypeFormRef"
        :model="processNodeTypeForm"
        :rules="processNodeTypeFormRules"
        label-width="100px"
      >
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="processNodeTypeForm.name" placeholder="请输入节点类型名称" />
        </el-form-item>
        <el-form-item label="节点类型" prop="type">
          <el-select v-model="processNodeTypeForm.type" placeholder="请选择节点类型">
            <el-option label="开始节点" :value="1" />
            <el-option label="结束节点" :value="2" />
            <el-option label="评审节点" :value="3" />
            <el-option label="开发节点" :value="4" />
            <el-option label="测试节点" :value="5" />
            <el-option label="部署节点" :value="6" />
            <el-option label="其他节点" :value="99" />
          </el-select>
        </el-form-item>
        <el-form-item label="节点描述" prop="description">
          <el-input
            v-model="processNodeTypeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入节点类型描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number
            v-model="processNodeTypeForm.sort_order"
            :min="0"
            :max="999"
            placeholder="请输入排序号"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="配置信息" prop="config">
          <el-input
            v-model="configText"
            type="textarea"
            :rows="4"
            placeholder="请输入配置信息（JSON格式）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { processNodeTypeApi } from '@/api';
import { Plus, Search } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const processNodeTypeList = ref([]);
const searchForm = reactive({
  name: '',
});
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});
const selectedRows = ref([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref('create');
const processNodeTypeFormRef = ref();
const processNodeTypeForm = reactive({
  id: undefined,
  name: '',
  type: 99,
  description: '',
  sort_order: 0,
  config: {},
});
const configText = ref('');
const processNodeTypeFormRules = reactive({
  name: [
    { required: true, message: '请输入节点类型名称', trigger: 'blur' },
    { min: 1, max: 200, message: '节点类型名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择节点类型', trigger: 'change' },
  ],
});

// 页面加载时获取数据
onMounted(() => {
  getProcessNodeTypeList();
});

// 获取节点类型列表
const getProcessNodeTypeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await processNodeTypeApi.getProcessNodeTypeList(params);
    if (response.status === 'success') {
      processNodeTypeList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
    } else {
      ElMessage.error(response.message || '获取节点类型列表失败');
    }
  } catch (error) {
    ElMessage.error('获取节点类型列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getProcessNodeTypeList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  pagination.currentPage = 1;
  getProcessNodeTypeList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getProcessNodeTypeList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getProcessNodeTypeList();
};

// 选择行
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return 'process-node-type-row';
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    1: '开始节点',
    2: '结束节点',
    3: '评审节点',
    4: '开发节点',
    5: '测试节点',
    6: '部署节点',
    99: '其他节点',
  };
  return typeMap[type] || '未知类型';
};

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    1: 'success',
    2: 'danger',
    3: 'warning',
    4: 'primary',
    5: 'info',
    6: 'purple',
    99: 'gray',
  };
  return colorMap[type] || 'gray';
};

// 详情弹窗相关
const detailDialogVisible = ref(false);
const activeTab = ref('basic');
const currentProcessNodeType = ref({});

// 查看节点类型
const handleViewProcessNodeType = (row) => {
  currentProcessNodeType.value = row;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';
};

// 编辑节点类型
const handleEditProcessNodeType = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(processNodeTypeForm, row);
  // 配置信息转换为字符串
  if (row.config) {
    configText.value = JSON.stringify(row.config, null, 2);
  } else {
    configText.value = '';
  }
};

// 删除节点类型
const handleDeleteProcessNodeType = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除节点类型"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await processNodeTypeApi.deleteProcessNodeTypes([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getProcessNodeTypeList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建节点类型
const handleCreateProcessNodeType = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  processNodeTypeForm.id = undefined;
  processNodeTypeForm.name = '';
  processNodeTypeForm.type = 99;
  processNodeTypeForm.description = '';
  processNodeTypeForm.sort_order = 0;
  processNodeTypeForm.config = {};
  configText.value = '';
  if (processNodeTypeFormRef.value) {
    processNodeTypeFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await processNodeTypeFormRef.value.validate();

    // 处理配置信息
    const formData = { ...processNodeTypeForm };
    if (configText.value) {
      try {
        formData.config = JSON.parse(configText.value);
      } catch (error) {
        ElMessage.error('配置信息格式不正确');
        return;
      }
    }

    let response;
    if (dialogType.value === 'create') {
      response = await processNodeTypeApi.createProcessNodeType(formData);
    } else {
      response = await processNodeTypeApi.updateProcessNodeType(formData);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getProcessNodeTypeList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.process-node-type-management {
  padding: 24px 32px;
  background-color: var(--color-bg-page);
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.header-right {
  flex-shrink: 0;
}

.create-btn {
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 24px;
}

.search-card {
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

/* 列表区域 */
.list-section {
  margin-bottom: 24px;
}

.list-card {
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--color-bg-secondary);
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 13px;
  padding: 16px 12px;
}

:deep(.el-table td.el-table__cell) {
  padding: 16px 12px;
  font-size: 14px;
  color: var(--color-text-primary);
}

:deep(.el-table .process-node-type-row:hover > td.el-table__cell) {
  background-color: var(--color-bg-secondary);
}

/* 节点类型名称 */
.node-type-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  margin-right: 8px;
}

.name-link {
  padding: 0;
  height: auto;
  font-weight: 500;
  color: var(--color-primary-500);
}

.name-link:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}

/* 节点类型描述 */
.node-type-description {
  color: var(--color-text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 分页 */
.pagination {
  margin-top: 24px;
  text-align: right;
}

/* 节点类型详情弹窗样式 */
.process-node-type-detail-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.process-node-type-detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.detail-tabs {
  margin-bottom: 20px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.detail-descriptions {
  margin-bottom: 24px;
}

.detail-descriptions :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #4e5969;
}

.detail-descriptions :deep(.el-descriptions__content) {
  color: #1d2129;
}

/* 配置信息 */
.config-content {
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
}

.config-content pre {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 对话框 */
.process-node-type-dialog {
  border-radius: 12px;
}

:deep(.process-node-type-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--color-border-secondary);
  padding: 20px 24px;
}

:deep(.process-node-type-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

:deep(.process-node-type-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.process-node-type-dialog .el-dialog__footer) {
  border-top: 1px solid var(--color-border-secondary);
  padding: 16px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-node-type-management {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .search-form {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
