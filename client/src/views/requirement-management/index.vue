<template>
  <div class="requirement-management">
    <div class="page-header">
      <h2>需求管理</h2>
      <el-button type="primary" @click="handleCreateRequirement">创建需求</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="需求名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入需求名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="需求状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择需求状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待设计" :value="1" />
            <el-option label="待产品评审" :value="2" />
            <el-option label="待技术评审" :value="3" />
            <el-option label="开发中" :value="4" />
            <el-option label="测试中" :value="5" />
            <el-option label="已上线" :value="6" />
            <el-option label="已结束" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="searchForm.priority"
            placeholder="请选择优先级"
            clearable
            style="width: 120px"
          >
            <el-option label="P0" :value="1" />
            <el-option label="P1" :value="2" />
            <el-option label="P2" :value="3" />
            <el-option label="P3" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择需求类型"
            clearable
            style="width: 120px"
          >
            <el-option label="业务需求" :value="1" />
            <el-option label="技术需求" :value="2" />
            <el-option label="产品需求" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <el-table
        :data="requirementList"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="需求名称" min-width="200">
          <template #default="scope">
            <el-button
              type="primary"
              link
              @click="handleViewRequirementDetail(scope.row)"
            >
              {{ scope.row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="需求描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status_id" label="需求状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status_id)"
              size="small"
            >
              {{ getStatusText(scope.row.status_id) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前负责人" width="120">
          <template #default="scope">
            {{ getUserRealName(scope.row.current_assignee_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type_id" label="需求类型" width="120">
          <template #default="scope">
            <el-tag size="small">{{ getRequirementTypeText(scope.row.type_id) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="提出时间" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="创建者" width="120">
          <template #default="scope">
            {{ getUserRealName(scope.row.reporter_id) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="handleEditRequirement(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              text-color="#ff4d4f"
              @click="handleDeleteRequirement(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 创建/编辑需求对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建需求' : '编辑需求'"
      width="700px"
    >
      <el-form
        ref="requirementFormRef"
        :model="requirementForm"
        :rules="requirementFormRules"
        label-width="100px"
      >
        <el-form-item label="需求名称" prop="name">
          <el-input v-model="requirementForm.name" placeholder="请输入需求名称" />
        </el-form-item>
        <el-form-item label="需求类型" prop="type_id">
          <el-select v-model="requirementForm.type_id" placeholder="请选择需求类型">
            <el-option label="业务需求" :value="1" />
            <el-option label="技术需求" :value="2" />
            <el-option label="产品需求" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求描述" prop="description">
          <el-input
            v-model="requirementForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入需求描述"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="requirementForm.priority" placeholder="请选择优先级">
            <el-option label="P0" :value="1" />
            <el-option label="P1" :value="2" />
            <el-option label="P2" :value="3" />
            <el-option label="P3" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求状态" prop="status_id">
          <el-select v-model="requirementForm.status_id" placeholder="请选择需求状态">
            <el-option label="待设计" :value="1" />
            <el-option label="待产品评审" :value="2" />
            <el-option label="待技术评审" :value="3" />
            <el-option label="开发中" :value="4" />
            <el-option label="测试中" :value="5" />
            <el-option label="已上线" :value="6" />
            <el-option label="已结束" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="current_assignee_id">
          <el-input v-model="requirementForm.current_assignee_id" placeholder="请输入负责人ID" />
        </el-form-item>
        <el-form-item label="提出人" prop="reporter_id">
          <el-input v-model="requirementForm.reporter_id" placeholder="请输入提出人ID" />
        </el-form-item>
        <el-form-item label="所属项目" prop="project_id">
          <el-input v-model="requirementForm.project_id" placeholder="请输入项目ID" />
        </el-form-item>
        <el-form-item label="规划版本" prop="planned_version">
          <el-input v-model="requirementForm.planned_version" placeholder="请输入规划版本" />
        </el-form-item>
        <el-form-item label="实际上线版本" prop="actual_version">
          <el-input v-model="requirementForm.actual_version" placeholder="请输入实际上线版本" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 需求详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentRequirement.name || '需求详情'"
      width="900px"
      class="requirement-detail-dialog"
    >
      <el-tabs v-model="activeTab" type="card" class="detail-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="需求名称">{{ currentRequirement.name }}</el-descriptions-item>
            <el-descriptions-item label="需求类型">{{ getRequirementTypeText(currentRequirement.type_id) }}</el-descriptions-item>
            <el-descriptions-item label="需求描述" :span="2">{{ currentRequirement.description }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="getPriorityType(currentRequirement.priority)" size="small">
                {{ getPriorityText(currentRequirement.priority) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="需求状态">
              <el-tag :type="getStatusType(currentRequirement.status_id)" size="small">
                {{ getStatusText(currentRequirement.status_id) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提出时间">{{ formatDate(currentRequirement.create_time) }}</el-descriptions-item>
            <el-descriptions-item label="规划版本">{{ currentRequirement.planned_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际上线版本">{{ currentRequirement.actual_version || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="assignee-section">
            <h4>负责人信息</h4>
            <div class="assignee-list">
              <div class="assignee-item">
                <span class="assignee-label">当前负责人：</span>
                <span class="assignee-name">{{ getUserRealName(currentRequirement.current_assignee_id) }}</span>
              </div>
              <div class="assignee-item">
                <span class="assignee-label">需求创建者：</span>
                <span class="assignee-name">{{ getUserRealName(currentRequirement.reporter_id) }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 节点详情 -->
        <el-tab-pane label="节点详情" name="nodes">
          <el-table :data="processNodes" style="width: 100%">
            <el-table-column prop="name" label="节点名称" min-width="200" />
            <el-table-column prop="node_type_id" label="节点类型" width="120">
              <template #default="scope">
                {{ getNodeTypeText(scope.row.node_type_id) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getNodeStatusType(scope.row.status)" size="small">
                  {{ getNodeStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="负责人" width="120">
              <template #default="scope">
                {{ getUserRealName(scope.row.assignee_id) }}
              </template>
            </el-table-column>
            <el-table-column prop="expected_start_time" label="预计开始时间" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.expected_start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="expected_end_time" label="预计结束时间" width="150">
              <template #default="scope">
                {{ formatDate(scope.row.expected_end_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="duration_limit" label="处理时限(小时)" width="120">
              <template #default="scope">
                {{ scope.row.duration_limit || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 流程图 -->
        <el-tab-pane label="流程图" name="flowchart">
          <Flowchart
            :requirement-id="currentRequirement.id"
            :editable="true"
            style="height: 600px"
          />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requirementApi, userApi } from '@/api';
import Flowchart from '@/components/Flowchart/Flowchart.vue';

// 响应式数据
const loading = ref(false);
const requirementList = ref([]);
const searchForm = reactive({
  name: '',
  status: undefined,
  priority: undefined,
  type: undefined,
});
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});
const selectedRows = ref([]);

// 用户信息缓存
const userInfoCache = ref(new Map());

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref('create');
const requirementFormRef = ref();
const requirementForm = reactive({
  id: undefined,
  name: '',
  type_id: 1,
  description: '',
  priority: 2,
  status_id: 1,
  current_assignee_id: undefined,
  reporter_id: undefined,
  project_id: undefined,
  planned_version: '',
  actual_version: '',
});
const requirementFormRules = reactive({
  name: [
    { required: true, message: '请输入需求名称', trigger: 'blur' },
    { min: 1, max: 200, message: '需求名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  type_id: [
    { required: true, message: '请选择需求类型', trigger: 'change' },
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' },
  ],
  status_id: [
    { required: true, message: '请选择需求状态', trigger: 'change' },
  ],
  reporter_id: [
    { required: true, message: '请输入提出人ID', trigger: 'blur' },
  ],
});

// 需求详情弹窗相关
const detailDialogVisible = ref(false);
const activeTab = ref('basic');
const currentRequirement = ref({});
const processNodes = ref([]);

// 页面加载时获取数据
onMounted(() => {
  getRequirementList();
  loadUserInfoCache();
});

// 加载用户信息缓存
const loadUserInfoCache = async () => {
  try {
    const response = await userApi.list({ current_page: 1, page_size: 100 });
    if (response.status === 'success') {
      const users = response.datum.list || [];
      users.forEach(user => {
        userInfoCache.value.set(user.USER_ID, {
          user_id: user.USER_ID,
          user_name: user.USER_NAME,
          real_name: user.REAL_NAME || user.USER_NAME
        });
      });
    }
  } catch (error) {
    console.error('加载用户信息缓存失败:', error);
  }
};

// 获取用户真实姓名
const getUserRealName = (userId) => {
  if (!userId) return '-';
  const user = userInfoCache.value.get(userId);
  return user ? user.real_name : `用户${userId}`;
};

// 获取需求列表
const getRequirementList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: searchForm.status,
      priority: searchForm.priority,
      type: searchForm.type,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await requirementApi.getRequirementList(params);
    if (response.status === 'success') {
      requirementList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
    } else {
      ElMessage.error(response.message || '获取需求列表失败');
    }
  } catch (error) {
    ElMessage.error('获取需求列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getRequirementList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  searchForm.priority = undefined;
  searchForm.type = undefined;
  pagination.currentPage = 1;
  getRequirementList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getRequirementList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getRequirementList();
};

// 选择行
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

// 获取需求类型文本
const getRequirementTypeText = (typeId) => {
  const typeMap = {
    1: '业务需求',
    2: '技术需求',
    3: '产品需求',
  };
  return typeMap[typeId] || '未知';
};

// 获取优先级文本
const getPriorityText = (priority) => {
  const priorityMap = {
    1: 'P0',
    2: 'P1',
    3: 'P2',
    4: 'P3',
  };
  return priorityMap[priority] || '未知';
};

// 获取优先级类型
const getPriorityType = (priority) => {
  const typeMap = {
    1: 'danger',
    2: 'warning',
    3: 'info',
    4: 'success',
  };
  return typeMap[priority] || 'info';
};

// 获取状态文本
const getStatusText = (statusId) => {
  const statusMap = {
    1: '待设计',
    2: '待产品评审',
    3: '待技术评审',
    4: '开发中',
    5: '测试中',
    6: '已上线',
    7: '已结束',
  };
  return statusMap[statusId] || '未知';
};

// 获取状态类型
const getStatusType = (statusId) => {
  const typeMap = {
    1: 'info',
    2: 'warning',
    3: 'warning',
    4: 'success',
    5: 'success',
    6: 'success',
    7: 'success',
  };
  return typeMap[statusId] || 'info';
};

// 获取节点类型文本
const getNodeTypeText = (nodeTypeId) => {
  const typeMap = {
    1: '需求评审',
    2: '技术设计',
    3: '开发',
    4: '测试',
    5: '上线',
  };
  return typeMap[nodeTypeId] || '未知';
};

// 获取节点状态文本
const getNodeStatusText = (status) => {
  const statusMap = {
    0: '已禁用',
    1: '启用',
  };
  return statusMap[status] || '未知';
};

// 获取节点状态类型
const getNodeStatusType = (status) => {
  const typeMap = {
    0: 'danger',
    1: 'success',
  };
  return typeMap[status] || 'info';
};

// 查看需求详情
const handleViewRequirementDetail = async (row) => {
  currentRequirement.value = row;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';

  // 加载流程节点数据
  await loadProcessNodes(row.id);
};

// 加载流程节点数据
const loadProcessNodes = async (requirementId) => {
  try {
    const response = await requirementApi.getRequirementProcessNodes(requirementId);
    if (response.status === 'success') {
      processNodes.value = response.datum.list || [];
    } else {
      ElMessage.error(response.message || '获取流程节点失败');
    }
  } catch (error) {
    console.error('获取流程节点失败:', error);
  }
};

// 编辑需求
const handleEditRequirement = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(requirementForm, row);
};

// 删除需求
const handleDeleteRequirement = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除需求"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await requirementApi.deleteRequirements([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getRequirementList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建需求
const handleCreateRequirement = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  requirementForm.id = undefined;
  requirementForm.name = '';
  requirementForm.type_id = 1;
  requirementForm.description = '';
  requirementForm.priority = 2;
  requirementForm.status_id = 1;
  requirementForm.current_assignee_id = undefined;
  requirementForm.reporter_id = undefined;
  requirementForm.project_id = undefined;
  requirementForm.planned_version = '';
  requirementForm.actual_version = '';
  if (requirementFormRef.value) {
    requirementFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await requirementFormRef.value.validate();

    let response;
    if (dialogType.value === 'create') {
      response = await requirementApi.createRequirement(requirementForm);
    } else {
      response = await requirementApi.updateRequirement(requirementForm);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getRequirementList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.requirement-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
}

.search-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.list-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 需求详情弹窗样式 */
.requirement-detail-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.requirement-detail-dialog :deep(.el-dialog__body) {
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

.assignee-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e8eaed;
}

.assignee-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.assignee-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignee-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-label {
  font-size: 14px;
  color: #4e5969;
  font-weight: 500;
  min-width: 100px;
}

.assignee-name {
  font-size: 14px;
  color: #1d2129;
  font-weight: 400;
}
</style>
