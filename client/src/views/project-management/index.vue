<template>
  <div class="project-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">项目管理</h1>
        <p class="page-subtitle">管理和跟踪您的所有项目</p>
      </div>
      <div class="header-right">
        <el-button type="primary" class="create-btn" @click="handleCreateProject">
          <el-icon><Plus /></el-icon>
          创建项目
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
              placeholder="搜索项目名称"
              clearable
              style="width: 240px"
              prefix-icon="Search"
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="searchForm.status"
              placeholder="项目状态"
              clearable
              style="width: 160px"
            >
              <el-option label="待立项" :value="1" />
              <el-option label="进行中" :value="2" />
              <el-option label="已暂停" :value="3" />
              <el-option label="已完成" :value="4" />
              <el-option label="已取消" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 项目统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总项目数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon paused">
              <el-icon><Pause /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.paused }}</div>
              <div class="stat-label">已暂停</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 项目列表 -->
    <div class="list-section">
      <el-card class="list-card">
        <el-table
          :data="projectList"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="name" label="项目名称" min-width="200">
            <template #default="scope">
              <div class="project-name">
                <el-tag
                  :type="getStatusType(scope.row.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
                <el-button
                  type="primary"
                  link
                  @click="handleViewProject(scope.row)"
                  class="name-link"
                >
                  {{ scope.row.name }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="项目描述" min-width="250">
            <template #default="scope">
              <div class="project-description">{{ scope.row.description }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="manager_id" label="项目经理" width="120" />
          <el-table-column prop="start_date" label="开始时间" width="150">
            <template #default="scope">
              {{ formatDate(scope.row.start_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="end_date" label="结束时间" width="150">
            <template #default="scope">
              {{ formatDate(scope.row.end_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="budget" label="预算" width="120">
            <template #default="scope">
              {{ scope.row.budget ? `¥${scope.row.budget}` : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="text"
                size="small"
                @click="handleEditProject(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="text"
                size="small"
                text-color="#ff4d4f"
                @click="handleDeleteProject(scope.row)"
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

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProject.name || '项目详情'"
      width="900px"
      class="project-detail-dialog"
    >
      <el-tabs v-model="activeTab" type="card" class="detail-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="项目名称">{{ currentProject.name }}</el-descriptions-item>
            <el-descriptions-item label="项目状态">
              <el-tag :type="getStatusType(currentProject.status)" size="small">
                {{ getStatusText(currentProject.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="项目描述" :span="2">{{ currentProject.description }}</el-descriptions-item>
            <el-descriptions-item label="项目经理">{{ currentProject.manager_id }}</el-descriptions-item>
            <el-descriptions-item label="部门ID">{{ currentProject.department_id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDate(currentProject.start_date) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatDate(currentProject.end_date) }}</el-descriptions-item>
            <el-descriptions-item label="项目预算">{{ currentProject.budget ? `¥${currentProject.budget}` : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 项目进度 -->
        <el-tab-pane label="项目进度" name="progress">
          <el-empty description="暂无进度数据" />
        </el-tab-pane>

        <!-- 团队成员 -->
        <el-tab-pane label="团队成员" name="team">
          <el-empty description="暂无团队成员数据" />
        </el-tab-pane>

        <!-- 操作记录 -->
        <el-tab-pane label="操作记录" name="operations">
          <el-empty description="暂无操作记录" />
        </el-tab-pane>

        <!-- 评论/备注 -->
        <el-tab-pane label="评论/备注" name="comments">
          <el-empty description="暂无评论" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建项目' : '编辑项目'"
      width="700px"
      class="project-dialog"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectFormRules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="projectForm.status" placeholder="请选择项目状态">
            <el-option label="待立项" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已暂停" :value="3" />
            <el-option label="已完成" :value="4" />
            <el-option label="已取消" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目经理" prop="manager_id">
          <el-input v-model="projectForm.manager_id" placeholder="请输入项目经理ID" />
        </el-form-item>
        <el-form-item label="部门ID" prop="department_id">
          <el-input v-model="projectForm.department_id" placeholder="请输入部门ID" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_date">
          <el-date-picker
            v-model="projectForm.start_date"
            type="date"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_date">
          <el-date-picker
            v-model="projectForm.end_date"
            type="date"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="项目预算" prop="budget">
          <el-input-number
            v-model="projectForm.budget"
            :min="0"
            :precision="2"
            placeholder="请输入项目预算"
            style="width: 100%"
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
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { projectApi } from '@/api';
import { Plus, FolderOpened, CircleCheck, Check, VideoPause, Search } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const projectList = ref([]);
const searchForm = reactive({
  name: '',
  status: undefined,
});
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});
const selectedRows = ref([]);

// 统计数据
const stats = reactive({
  total: 0,
  active: 0,
  completed: 0,
  paused: 0,
});

// 计算统计数据
const calculateStats = (list) => {
  stats.total = list.length;
  stats.active = list.filter(item => item.status === 2).length;
  stats.completed = list.filter(item => item.status === 4).length;
  stats.paused = list.filter(item => item.status === 3).length;
};

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref('create');
const projectFormRef = ref();
const projectForm = reactive({
  id: undefined,
  name: '',
  description: '',
  status: 1,
  manager_id: undefined,
  department_id: undefined,
  start_date: undefined,
  end_date: undefined,
  budget: undefined,
});
const projectFormRules = reactive({
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 1, max: 200, message: '项目名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  manager_id: [
    { required: true, message: '请输入项目经理ID', trigger: 'blur' },
  ],
});

// 页面加载时获取数据
onMounted(() => {
  getProjectList();
});

// 获取项目列表
const getProjectList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: searchForm.status,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await projectApi.getProjectList(params);
    if (response.status === 'success') {
      projectList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
      calculateStats(response.datum.list);
    } else {
      ElMessage.error(response.message || '获取项目列表失败');
    }
  } catch (error) {
    ElMessage.error('获取项目列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getProjectList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  pagination.currentPage = 1;
  getProjectList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getProjectList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getProjectList();
};

// 选择行
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 表格行样式
const tableRowClassName = ({ row, rowIndex }) => {
  return 'project-row';
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '待立项',
    2: '进行中',
    3: '已暂停',
    4: '已完成',
    5: '已取消',
  };
  return statusMap[status] || '未知';
};

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    1: 'info',
    2: 'success',
    3: 'warning',
    4: 'success',
    5: 'danger',
  };
  return typeMap[status] || 'info';
};

// 详情弹窗相关
const detailDialogVisible = ref(false);
const activeTab = ref('basic');
const currentProject = ref({});

// 查看项目
const handleViewProject = (row) => {
  currentProject.value = row;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';
};

// 编辑项目
const handleEditProject = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(projectForm, row);
  // 日期处理
  if (row.start_date) {
    projectForm.start_date = new Date(row.start_date * 1000);
  }
  if (row.end_date) {
    projectForm.end_date = new Date(row.end_date * 1000);
  }
};

// 删除项目
const handleDeleteProject = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除项目"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await projectApi.deleteProjects([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getProjectList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建项目
const handleCreateProject = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  projectForm.id = undefined;
  projectForm.name = '';
  projectForm.description = '';
  projectForm.status = 1;
  projectForm.manager_id = undefined;
  projectForm.department_id = undefined;
  projectForm.start_date = undefined;
  projectForm.end_date = undefined;
  projectForm.budget = undefined;
  if (projectFormRef.value) {
    projectFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await projectFormRef.value.validate();

    // 处理日期
    const formData = { ...projectForm };
    if (formData.start_date) {
      formData.start_date = Math.floor(formData.start_date.getTime() / 1000);
    }
    if (formData.end_date) {
      formData.end_date = Math.floor(formData.end_date.getTime() / 1000);
    }

    let response;
    if (dialogType.value === 'create') {
      response = await projectApi.createProject(formData);
    } else {
      response = await projectApi.updateProject(formData);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getProjectList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.project-management {
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

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: var(--color-bg-container);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total {
  background-color: var(--color-primary-50);
  color: var(--color-primary-500);
}

.stat-icon.active {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.stat-icon.completed {
  background-color: var(--color-info-bg);
  color: var(--color-info);
}

.stat-icon.paused {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
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

:deep(.el-table .project-row:hover > td.el-table__cell) {
  background-color: var(--color-bg-secondary);
}

/* 项目名称 */
.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
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

/* 项目描述 */
.project-description {
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

/* 项目详情弹窗样式 */
.project-detail-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.project-detail-dialog :deep(.el-dialog__body) {
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

/* 对话框 */
.project-dialog {
  border-radius: 12px;
}

:deep(.project-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--color-border-secondary);
  padding: 20px 24px;
}

:deep(.project-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

:deep(.project-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.project-dialog .el-dialog__footer) {
  border-top: 1px solid var(--color-border-secondary);
  padding: 16px 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-management {
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

  .stats-section .el-col {
    margin-bottom: 16px;
  }
}
</style>
