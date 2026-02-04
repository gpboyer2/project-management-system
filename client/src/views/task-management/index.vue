<template>
  <div class="task-management">
    <div class="page-header">
      <h2>任务管理</h2>
      <el-button type="primary" @click="handleCreateTask">创建任务</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择任务状态"
            clearable
            style="width: 150px"
          >
            <el-option label="未开始" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
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
        <el-form-item label="关联需求">
          <el-input
            v-model="searchForm.requirement_id"
            placeholder="请输入需求ID"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="关联评审">
          <el-input
            v-model="searchForm.review_id"
            placeholder="请输入评审ID"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <el-table
        :data="taskList"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" label="任务名称" min-width="200" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="scope">
            <el-tag :type="getPriorityType(scope.row.priority)" size="small">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="task_status_id" label="任务状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.task_status_id)"
              size="small"
            >
              {{ getStatusText(scope.row.task_status_id) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_id" label="负责人" width="120" />
        <el-table-column prop="reporter_id" label="创建人" width="120" />
        <el-table-column prop="requirement_id" label="关联需求" width="120" />
        <el-table-column prop="review_id" label="关联评审" width="120" />
        <el-table-column prop="estimated_hours" label="预估工时" width="100">
          <template #default="scope">
            {{ scope.row.estimated_hours ? `${scope.row.estimated_hours}h` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_hours" label="实际工时" width="100">
          <template #default="scope">
            {{ scope.row.actual_hours ? `${scope.row.actual_hours}h` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="handleViewTask(scope.row)"
            >
              查看
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleEditTask(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              text-color="#ff4d4f"
              @click="handleDeleteTask(scope.row)"
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

    <!-- 创建/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建任务' : '编辑任务'"
      width="700px"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskFormRules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级">
            <el-option label="P0" :value="1" />
            <el-option label="P1" :value="2" />
            <el-option label="P2" :value="3" />
            <el-option label="P3" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态" prop="task_status_id">
          <el-select v-model="taskForm.task_status_id" placeholder="请选择任务状态">
            <el-option label="未开始" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee_id">
          <el-input v-model="taskForm.assignee_id" placeholder="请输入负责人ID" />
        </el-form-item>
        <el-form-item label="创建人" prop="reporter_id">
          <el-input v-model="taskForm.reporter_id" placeholder="请输入创建人ID" />
        </el-form-item>
        <el-form-item label="关联需求" prop="requirement_id">
          <el-input v-model="taskForm.requirement_id" placeholder="请输入需求ID" />
        </el-form-item>
        <el-form-item label="关联评审" prop="review_id">
          <el-input v-model="taskForm.review_id" placeholder="请输入评审ID" />
        </el-form-item>
        <el-form-item label="需求流程节点" prop="requirement_node_id">
          <el-input v-model="taskForm.requirement_node_id" placeholder="请输入需求流程节点ID" />
        </el-form-item>
        <el-form-item label="评审流程节点" prop="review_node_id">
          <el-input v-model="taskForm.review_node_id" placeholder="请输入评审流程节点ID" />
        </el-form-item>
        <el-form-item label="预估工时" prop="estimated_hours">
          <el-input-number
            v-model="taskForm.estimated_hours"
            :min="0"
            :precision="2"
            placeholder="请输入预估工时"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实际工时" prop="actual_hours">
          <el-input-number
            v-model="taskForm.actual_hours"
            :min="0"
            :precision="2"
            placeholder="请输入实际工时"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="taskForm.start_time"
            type="date"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="taskForm.end_time"
            type="date"
            placeholder="请选择结束时间"
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { taskApi } from '@/api';

// 响应式数据
const loading = ref(false);
const taskList = ref([]);
const searchForm = reactive({
  name: '',
  status: undefined,
  priority: undefined,
  requirement_id: undefined,
  review_id: undefined,
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
const taskFormRef = ref();
const taskForm = reactive({
  id: undefined,
  name: '',
  description: '',
  priority: 2,
  task_status_id: 1,
  assignee_id: undefined,
  reporter_id: undefined,
  requirement_id: undefined,
  review_id: undefined,
  requirement_node_id: undefined,
  review_node_id: undefined,
  estimated_hours: undefined,
  actual_hours: undefined,
  start_time: undefined,
  end_time: undefined,
});
const taskFormRules = reactive({
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 1, max: 200, message: '任务名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' },
  ],
  task_status_id: [
    { required: true, message: '请选择任务状态', trigger: 'change' },
  ],
  reporter_id: [
    { required: true, message: '请输入创建人ID', trigger: 'blur' },
  ],
});

// 页面加载时获取数据
onMounted(() => {
  getTaskList();
});

// 获取任务列表
const getTaskList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: searchForm.status,
      priority: searchForm.priority,
      requirementId: searchForm.requirement_id,
      reviewId: searchForm.review_id,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await taskApi.getTaskList(params);
    if (response.status === 'success') {
      taskList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
    } else {
      ElMessage.error(response.message || '获取任务列表失败');
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getTaskList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  searchForm.priority = undefined;
  searchForm.requirement_id = undefined;
  searchForm.review_id = undefined;
  pagination.currentPage = 1;
  getTaskList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getTaskList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getTaskList();
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
    1: '未开始',
    2: '进行中',
    3: '已完成',
    4: '已取消',
  };
  return statusMap[statusId] || '未知';
};

// 获取状态类型
const getStatusType = (statusId) => {
  const typeMap = {
    1: 'info',
    2: 'success',
    3: 'success',
    4: 'danger',
  };
  return typeMap[statusId] || 'info';
};

// 查看任务
const handleViewTask = (row) => {
  // 跳转到任务详情页面
  console.log('查看任务:', row);
  ElMessage.info('查看任务功能待开发');
};

// 编辑任务
const handleEditTask = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(taskForm, row);
  // 日期处理
  if (row.start_time) {
    taskForm.start_time = new Date(row.start_time * 1000);
  }
  if (row.end_time) {
    taskForm.end_time = new Date(row.end_time * 1000);
  }
};

// 删除任务
const handleDeleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await taskApi.deleteTasks([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getTaskList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建任务
const handleCreateTask = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  taskForm.id = undefined;
  taskForm.name = '';
  taskForm.description = '';
  taskForm.priority = 2;
  taskForm.task_status_id = 1;
  taskForm.assignee_id = undefined;
  taskForm.reporter_id = undefined;
  taskForm.requirement_id = undefined;
  taskForm.review_id = undefined;
  taskForm.requirement_node_id = undefined;
  taskForm.review_node_id = undefined;
  taskForm.estimated_hours = undefined;
  taskForm.actual_hours = undefined;
  taskForm.start_time = undefined;
  taskForm.end_time = undefined;
  if (taskFormRef.value) {
    taskFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await taskFormRef.value.validate();

    // 处理日期
    const formData = { ...taskForm };
    if (formData.start_time) {
      formData.start_time = Math.floor(formData.start_time.getTime() / 1000);
    }
    if (formData.end_time) {
      formData.end_time = Math.floor(formData.end_time.getTime() / 1000);
    }

    let response;
    if (dialogType.value === 'create') {
      response = await taskApi.createTask(formData);
    } else {
      response = await taskApi.updateTask(formData);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getTaskList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.task-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.list-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
