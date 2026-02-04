<template>
  <div class="requirement-type-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">需求类型管理</h1>
        <p class="page-subtitle">管理需求的分类和类型</p>
      </div>
      <div class="header-right">
        <el-button type="primary" class="create-btn" @click="handleCreateRequirementType">
          <el-icon><Plus /></el-icon>
          创建需求类型
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
              placeholder="搜索需求类型名称"
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

    <!-- 需求类型列表 -->
    <div class="list-section">
      <el-card class="list-card">
        <el-table
          :data="requirementTypeList"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="name" label="需求类型名称" min-width="200">
            <template #default="scope">
              <div class="requirement-type-name">
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
                  @click="handleViewRequirementType(scope.row)"
                  class="name-link"
                >
                  {{ scope.row.name }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="需求类型描述" min-width="250">
            <template #default="scope">
              <div class="requirement-type-description">{{ scope.row.description }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="需求类型" width="120">
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
                @click="handleEditRequirementType(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="text"
                size="small"
                text-color="#ff4d4f"
                @click="handleDeleteRequirementType(scope.row)"
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

    <!-- 需求类型详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentRequirementType.name || '需求类型详情'"
      width="800px"
      class="requirement-type-detail-dialog"
    >
      <el-tabs v-model="activeTab" type="card" class="detail-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="需求类型名称">{{ currentRequirementType.name }}</el-descriptions-item>
            <el-descriptions-item label="需求类型">
              <el-tag :type="getTypeColor(currentRequirementType.type)" size="small">
                {{ getTypeText(currentRequirementType.type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="需求类型描述" :span="2">{{ currentRequirementType.description }}</el-descriptions-item>
            <el-descriptions-item label="排序">{{ currentRequirementType.sort_order || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentRequirementType.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(currentRequirementType.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 配置信息 -->
        <el-tab-pane label="配置信息" name="config">
          <div v-if="currentRequirementType.config" class="config-content">
            <pre>{{ JSON.stringify(currentRequirementType.config, null, 2) }}</pre>
          </div>
          <el-empty v-else description="暂无配置信息" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑需求类型对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建需求类型' : '编辑需求类型'"
      width="600px"
      class="requirement-type-dialog"
    >
      <el-form
        ref="requirementTypeFormRef"
        :model="requirementTypeForm"
        :rules="requirementTypeFormRules"
        label-width="100px"
      >
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="requirementTypeForm.name" placeholder="请输入需求类型名称" />
        </el-form-item>
        <el-form-item label="需求类型" prop="type">
          <el-select v-model="requirementTypeForm.type" placeholder="请选择需求类型">
            <el-option label="功能需求" :value="1" />
            <el-option label="性能需求" :value="2" />
            <el-option label="安全需求" :value="3" />
            <el-option label="兼容性需求" :value="4" />
            <el-option label="用户体验需求" :value="5" />
            <el-option label="其他需求" :value="99" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型描述" prop="description">
          <el-input
            v-model="requirementTypeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入需求类型描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number
            v-model="requirementTypeForm.sort_order"
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
import { requirementTypeApi } from '@/api';
import { Plus, Search } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const requirementTypeList = ref([]);
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
const requirementTypeFormRef = ref();
const requirementTypeForm = reactive({
  id: undefined,
  name: '',
  type: 99,
  description: '',
  sort_order: 0,
  config: {},
});
const configText = ref('');
const requirementTypeFormRules = reactive({
  name: [
    { required: true, message: '请输入需求类型名称', trigger: 'blur' },
    { min: 1, max: 200, message: '需求类型名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择需求类型', trigger: 'change' },
  ],
});

// 页面加载时获取数据
onMounted(() => {
  getRequirementTypeList();
});

// 获取需求类型列表
const getRequirementTypeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await requirementTypeApi.getRequirementTypeList(params);
    if (response.status === 'success') {
      requirementTypeList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
    } else {
      ElMessage.error(response.message || '获取需求类型列表失败');
    }
  } catch (error) {
    ElMessage.error('获取需求类型列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getRequirementTypeList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  pagination.currentPage = 1;
  getRequirementTypeList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getRequirementTypeList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getRequirementTypeList();
};

// 选择行
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return 'requirement-type-row';
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
    1: '功能需求',
    2: '性能需求',
    3: '安全需求',
    4: '兼容性需求',
    5: '用户体验需求',
    99: '其他需求',
  };
  return typeMap[type] || '未知类型';
};

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: 'purple',
    99: 'gray',
  };
  return colorMap[type] || 'gray';
};

// 详情弹窗相关
const detailDialogVisible = ref(false);
const activeTab = ref('basic');
const currentRequirementType = ref({});

// 查看需求类型
const handleViewRequirementType = (row) => {
  currentRequirementType.value = row;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';
};

// 编辑需求类型
const handleEditRequirementType = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(requirementTypeForm, row);
  // 配置信息转换为字符串
  if (row.config) {
    configText.value = JSON.stringify(row.config, null, 2);
  } else {
    configText.value = '';
  }
};

// 删除需求类型
const handleDeleteRequirementType = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除需求类型"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await requirementTypeApi.deleteRequirementTypes([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getRequirementTypeList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建需求类型
const handleCreateRequirementType = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  requirementTypeForm.id = undefined;
  requirementTypeForm.name = '';
  requirementTypeForm.type = 99;
  requirementTypeForm.description = '';
  requirementTypeForm.sort_order = 0;
  requirementTypeForm.config = {};
  configText.value = '';
  if (requirementTypeFormRef.value) {
    requirementTypeFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await requirementTypeFormRef.value.validate();

    // 处理配置信息
    const formData = { ...requirementTypeForm };
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
      response = await requirementTypeApi.createRequirementType(formData);
    } else {
      response = await requirementTypeApi.updateRequirementType(formData);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getRequirementTypeList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.requirement-type-management {
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

:deep(.el-table .requirement-type-row:hover > td.el-table__cell) {
  background-color: var(--color-bg-secondary);
}

/* 需求类型名称 */
.requirement-type-name {
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

/* 需求类型描述 */
.requirement-type-description {
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

/* 需求类型详情弹窗样式 */
.requirement-type-detail-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.requirement-type-detail-dialog :deep(.el-dialog__body) {
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
.requirement-type-dialog {
  border-radius: 12px;
}

:deep(.requirement-type-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--color-border-secondary);
  padding: 20px 24px;
}

:deep(.requirement-type-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

:deep(.requirement-type-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.requirement-type-dialog .el-dialog__footer) {
  border-top: 1px solid var(--color-border-secondary);
  padding: 16px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .requirement-type-management {
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
