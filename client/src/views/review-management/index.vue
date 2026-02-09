<template>
  <div class="review-management">
    <div class="page-header">
      <h2>评审管理</h2>
      <el-button type="primary" @click="handleCreateReview">创建评审</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="评审名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入评审名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="评审状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择评审状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待开始" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="评审类型">
          <el-select
            v-model="searchForm.review_type"
            placeholder="请选择评审类型"
            clearable
            style="width: 150px"
          >
            <el-option label="技术评审" :value="1" />
            <el-option label="业务评审" :value="2" />
            <el-option label="产品评审" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属项目">
          <el-input
            v-model="searchForm.project_id"
            placeholder="请输入项目ID"
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
        :data="reviewList"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" label="评审名称" min-width="200" />
        <el-table-column prop="review_type" label="评审类型" width="120">
          <template #default="scope">
            <el-tag size="small">{{ getReviewTypeText(scope.row.review_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="评审状态" width="120">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reporter" label="发起人" width="120">          <template #default="scope">            {{ scope.row.reporter?.real_name || scope.row.reporter?.user_name || scope.row.reporter_id }}          </template>        </el-table-column>        <el-table-column prop="reviewer" label="负责人" width="120">          <template #default="scope">            {{ scope.row.reviewer?.real_name || scope.row.reviewer?.user_name || scope.row.reviewer_id }}          </template>        </el-table-column>        <el-table-column prop="project" label="所属项目" width="120">          <template #default="scope">            {{ scope.row.project?.name || scope.row.project_id }}          </template>        </el-table-column>
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
        <el-table-column prop="create_time" label="创建时间" width="150">
          <template #default="scope">
            {{ formatDate(scope.row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="handleViewReview(scope.row)"
            >
              查看
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleEditReview(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              text-color="#ff4d4f"
              @click="handleDeleteReview(scope.row)"
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

    <!-- 评审详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentReview.name || '评审详情'"
      width="1200px"
      class="review-detail-dialog"
      custom-class="review-detail-dialog-custom"
    >
      <!-- 上半部分：流程图 -->
      <div class="flowchart-section">
        <Flowchart
          :review-id="currentReview.id"
          :editable="true"
          style="height: 400px"
        />
      </div>

      <!-- 下半部分：标签页 -->
      <div class="detail-tabs-section">
        <el-tabs v-model="activeTab" type="card" class="detail-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="basic-info-container">
              <!-- 项目信息 -->
              <div class="info-section">
                <h3>项目信息</h3>
                <el-descriptions :column="2" border class="detail-descriptions">
                  <el-descriptions-item label="需求名称">{{ currentReview.name }}</el-descriptions-item>
                  <el-descriptions-item label="需求类型">
                    <el-tag size="small" type="purple">{{ getReviewTypeText(currentReview.review_type) }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="需求描述" :span="2">{{ currentReview.description }}</el-descriptions-item>
                  <el-descriptions-item label="优先级">
                    <el-tag size="small" type="warning">P{{ currentReview.priority || 1 }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="提出时间">{{ formatDate(currentReview.create_time) }}</el-descriptions-item>
                  <el-descriptions-item label="规划版本">
                    <el-tag size="small" type="danger">V2.0.0</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="实际上车版本">
                    <el-tag size="small" type="danger">V2.0.0</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 相关人员 -->
              <div class="info-section">
                <h3>相关人员</h3>
                <div class="related-persons">
                  <div class="person-item">
                    <span class="person-label">关注人</span>
                    <span class="person-value">待填</span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">DA</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">PM</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">需求评审委员会</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">UE</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">UI&UX</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">Android开发</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">Data开发</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">FE开发</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">QA/验收人</span>
                    <span class="person-value">
                      <el-avatar :size="32" style="background-color: #722ed1">体验官</el-avatar>
                    </span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">Server开发</span>
                    <span class="person-value">请填写Server开发</span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">UX Writer</span>
                    <span class="person-value">请填写UX Writer</span>
                  </div>
                  <div class="person-item">
                    <span class="person-label">iOS开发</span>
                    <span class="person-value">
                      <el-select placeholder="请填写iOS开发" style="width: 180px">
                        <el-option label="体验官" :value="1" />
                      </el-select>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 节点详情 -->
          <el-tab-pane label="节点详情" name="nodes">
            <div class="nodes-detail-container">
              <div class="nodes-filter">
                <el-select v-model="nodeFilter" placeholder="筛选节点" clearable style="width: 200px">
                  <el-option label="全部" :value="''" />
                  <el-option label="已完成" :value="1" />
                  <el-option label="进行中" :value="2" />
                  <el-option label="待开始" :value="3" />
                </el-select>
              </div>

              <div class="nodes-list">
                <div
                  v-for="node in filteredProcessNodes"
                  :key="node.id"
                  class="node-item"
                >
                  <div class="node-header">
                    <div class="node-title">
                      <el-icon><CircleCheck /></el-icon>
                      {{ node.name }}
                      <el-tag :type="getNodeStatusType(node.status)" size="small" class="node-status">
                        {{ getNodeStatusText(node.status) }}
                      </el-tag>
                    </div>
                    <div class="node-info">
                      <span class="node-assignee">
                        <el-avatar :size="24" style="background-color: #722ed1">体验官</el-avatar>
                      </span>
                      <span class="node-time">待填</span>
                      <span class="node-time">待填</span>
                    </div>
                  </div>

                  <div class="node-content" v-if="node.expanded">
                    <div class="node-stats">
                      <div class="stat-item">
                        <span class="stat-label">负责人</span>
                        <span class="stat-value">
                          {{ getNodeAssignee(node) }}
                        </span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">总估分</span>
                        <span class="stat-value">待填</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">总排期</span>
                        <span class="stat-value">待填</span>
                      </div>
                    </div>

                    <div class="node-users">
                      <div class="users-header">
                        <span>参与人员 ({{ node.users?.length || 0 }})</span>
                      </div>
                      <div class="users-list">
                        <div v-if="!node.users || node.users.length === 0" class="no-users">
                          暂无参与人员
                        </div>
                        <div
                          v-for="user in node.users"
                          :key="user.id"
                          class="user-item"
                        >
                          <div class="user-info">
                            <el-avatar :size="24" style="background-color: #722ed1">
                              {{ getUserInitials(user.user_id) }}
                            </el-avatar>
                            <span class="user-name">{{ getUserName(user.user_id) }}</span>
                            <el-tag :type="getUserRoleType(user.role_type)" size="small">
                              {{ getUserRoleText(user.role_type) }}
                            </el-tag>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="node-tasks">
                      <div class="tasks-header">
                        <span>全部任务 ({{ node.tasks?.length || 0 }}/{{ node.tasks?.length || 0 }})</span>
                      </div>
                      <div class="tasks-list">
                        <div v-if="!node.tasks || node.tasks.length === 0" class="no-tasks">
                          暂无任务
                        </div>
                        <div
                          v-for="task in node.tasks"
                          :key="task.id"
                          class="task-item"
                        >
                          <div class="task-info">
                            <el-checkbox v-model="task.completed" />
                            <span class="task-name">{{ task.name }}</span>
                          </div>
                          <div class="task-actions">
                            <el-button type="text" size="small">编辑</el-button>
                            <el-button type="text" size="small" text-color="#ff4d4f">删除</el-button>
                          </div>
                        </div>
                      </div>
                      <div class="add-task">
                        <el-button type="primary" size="small" @click="handleAddTask(node.id)">
                          <el-icon><Plus /></el-icon> 新增任务
                        </el-button>
                      </div>
                    </div>
                  </div>

                  <div class="node-expand" @click="node.expanded = !node.expanded">
                    <el-icon>{{ node.expanded ? 'ArrowDown' : 'ArrowRight' }}</el-icon>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 操作记录 -->
          <el-tab-pane label="操作记录" name="operations">
            <el-empty description="暂无操作记录" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 创建/编辑评审对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '创建评审' : '编辑评审'"
      width="600px"
    >
      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewFormRules"
        label-width="100px"
      >
        <el-form-item label="评审名称" prop="name">
          <el-input v-model="reviewForm.name" placeholder="请输入评审名称" />
        </el-form-item>
        <el-form-item label="评审类型" prop="review_type">
          <el-select v-model="reviewForm.review_type" placeholder="请选择评审类型">
            <el-option label="技术评审" :value="1" />
            <el-option label="业务评审" :value="2" />
            <el-option label="产品评审" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="评审描述" prop="description">
          <el-input
            v-model="reviewForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入评审描述"
          />
        </el-form-item>
        <el-form-item label="评审状态" prop="status">
          <el-select v-model="reviewForm.status" placeholder="请选择评审状态">
            <el-option label="待开始" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="发起人" prop="reporter_id">
          <el-select v-model="reviewForm.reporter_id" placeholder="请选择发起人" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.user_id"
              :label="user.real_name || user.user_name"
              :value="user.user_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="reviewer_id">
          <el-select v-model="reviewForm.reviewer_id" placeholder="请选择负责人" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.user_id"
              :label="user.real_name || user.user_name"
              :value="user.user_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属项目" prop="project_id">
          <el-input v-model="reviewForm.project_id" placeholder="请输入项目ID" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="reviewForm.start_time"
            type="date"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="reviewForm.end_time"
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
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reviewApi, userApi, taskApi } from '@/api';
import Flowchart from '@/components/Flowchart/Flowchart.vue';
import { CircleCheck, ArrowDown, ArrowRight, Plus } from '@element-plus/icons-vue';

// 响应式数据
const loading = ref(false);
const reviewList = ref([]);
const searchForm = reactive({
  name: '',
  status: undefined,
  review_type: undefined,
  project_id: undefined,
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
const reviewFormRef = ref();
const reviewForm = reactive({
  id: undefined,
  name: '',
  review_type: 1,
  description: '',
  status: 1,
  reporter_id: undefined,
  reviewer_id: undefined,
  project_id: undefined,
  start_time: undefined,
  end_time: undefined,
});
const reviewFormRules = reactive({
  name: [
    { required: true, message: '请输入评审名称', trigger: 'blur' },
    { min: 1, max: 200, message: '评审名称长度在 1 到 200 个字符', trigger: 'blur' },
  ],
  review_type: [
    { required: true, message: '请选择评审类型', trigger: 'change' },
  ],
  status: [
    { required: true, message: '请选择评审状态', trigger: 'change' },
  ],
  reporter_id: [
    { required: true, message: '请选择发起人', trigger: 'change' },
  ],
  project_id: [
    { message: '请输入项目ID', trigger: 'blur' },
  ],
});

// 页面加载时获取数据
onMounted(() => {
  getReviewList();
  loadUserList();
});

// 加载用户列表
const loadUserList = async () => {
  try {
    const response = await userApi.list({
      current_page: 1,
      page_size: 100
    });
    if (response.status === 'success') {
      userList.value = response.datum.list || [];
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
  }
};

// 获取评审列表
const getReviewList = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: searchForm.status,
      review_type: searchForm.review_type,
      projectId: searchForm.project_id,
    };
    if (searchForm.name) {
      params.name = searchForm.name;
    }

    const response = await reviewApi.getReviewList(params);
    if (response.status === 'success') {
      reviewList.value = response.datum.list;
      pagination.total = response.datum.pagination.total;
    } else {
      ElMessage.error(response.message || '获取评审列表失败');
    }
  } catch (error) {
    ElMessage.error('获取评审列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getReviewList();
};

// 重置搜索条件
const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  searchForm.review_type = undefined;
  searchForm.project_id = undefined;
  pagination.currentPage = 1;
  getReviewList();
};

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  getReviewList();
};

// 页码改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  getReviewList();
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

// 获取评审类型文本
const getReviewTypeText = (typeId) => {
  const typeMap = {
    1: '技术评审',
    2: '业务评审',
    3: '产品评审',
  };
  return typeMap[typeId] || '未知';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '待开始',
    2: '进行中',
    3: '已完成',
    4: '已取消',
  };
  return statusMap[status] || '未知';
};

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    1: 'info',
    2: 'success',
    3: 'success',
    4: 'danger',
  };
  return typeMap[status] || 'info';
};

// 详情弹窗相关
const detailDialogVisible = ref(false);
const activeTab = ref('basic');
const currentReview = ref({});
const processNodes = ref([]);
const userList = ref([]);
const nodeFilter = ref('');

// 查看评审
const handleViewReview = (row) => {
  currentReview.value = row;
  detailDialogVisible.value = true;
  activeTab.value = 'basic';
  // 加载流程节点数据
  loadProcessNodes(row.id);
};

// 加载流程节点数据
const loadProcessNodes = async (reviewId) => {
  try {
    const response = await reviewApi.getReviewProcessNodes(reviewId);
    if (response.status === "success") {
      // 为每个节点添加展开状态
      const nodes = (response.datum.list || []).map(node => ({
        ...node,
        expanded: false,
        tasks: [], // 初始化为空数组，后续通过API加载
        users: [] // 初始化为空数组，后续通过API加载
      }));
      processNodes.value = nodes;

      // 加载每个节点的任务和用户数据
      for (const node of processNodes.value) {
        await Promise.all([
          loadNodeTasks(node.id, node),
          loadNodeUsers(node.id, node)
        ]);
      }
    } else {
      ElMessage.error(response.message || "获取流程节点失败");
    }
  } catch (error) {
    console.error("获取流程节点失败:", error);
    ElMessage.error("获取流程节点失败");
  }
};

// 加载节点任务数据
const loadNodeTasks = async (nodeId, node) => {
  try {
    const tasksResponse = await taskApi.getTaskList({
      review_node_id: nodeId,
      page: 1,
      pageSize: 100
    });

    if (tasksResponse.status === "success") {
      node.tasks = tasksResponse.datum.list || [];
    }
  } catch (error) {
    console.error("获取节点任务失败:", error);
  }
};

// 加载节点用户数据
const loadNodeUsers = async (nodeId, node) => {
  try {
    const usersResponse = await reviewApi.getReviewProcessNodeUsers(nodeId);
    if (usersResponse.status === "success") {
      node.users = usersResponse.datum.list || [];
    }
  } catch (error) {
    console.error("获取节点用户失败:", error);
  }
};

// 筛选流程节点
const filteredProcessNodes = computed(() => {
  if (!nodeFilter.value) {
    return processNodes.value;
  }
  return processNodes.value.filter(node => {
    // 根据节点状态进行筛选
    if (nodeFilter.value === '1') {
      return node.status === 1;
    } else if (nodeFilter.value === '2') {
      return node.status === 2;
    } else if (nodeFilter.value === '3') {
      return node.status === 3;
    }
    return true;
  });
});

// 新增任务
const handleAddTask = (nodeId) => {
  ElMessage.success('新增任务功能开发中');
};

// 获取节点负责人
const getNodeAssignee = (node) => {
  const assignee = node.users?.find(user => user.role_type === 1);
  if (assignee) {
    return getUserName(assignee.user_id);
  }
  return '待填';
};

// 获取用户姓名
const getUserName = (userId) => {
  const user = userList.value.find(u => u.user_id === userId);
  return user ? (user.real_name || user.user_name || `用户${userId}`) : `用户${userId}`;
};

// 获取用户姓名首字母
const getUserInitials = (userId) => {
  const userName = getUserName(userId);
  return userName.charAt(0);
};

// 获取用户角色类型
const getUserRoleType = (roleType) => {
  const typeMap = {
    1: 'primary',
    2: 'success',
    3: 'info'
  };
  return typeMap[roleType] || 'info';
};

// 获取用户角色文本
const getUserRoleText = (roleType) => {
  const roleMap = {
    1: '负责人',
    2: '参与者',
    3: '观察者'
  };
  return roleMap[roleType] || '未知角色';
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

// 编辑评审
const handleEditReview = (row) => {
  dialogType.value = 'edit';
  dialogVisible.value = true;
  // 复制数据到表单
  Object.assign(reviewForm, row);
  // 日期处理
  if (row.start_time) {
    reviewForm.start_time = new Date(row.start_time * 1000);
  }
  if (row.end_time) {
    reviewForm.end_time = new Date(row.end_time * 1000);
  }
};

// 删除评审
const handleDeleteReview = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除评审"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    const response = await reviewApi.deleteReviews([row.id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      getReviewList();
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 创建评审
const handleCreateReview = () => {
  dialogType.value = 'create';
  dialogVisible.value = true;
  // 重置表单
  reviewForm.id = undefined;
  reviewForm.name = '';
  reviewForm.review_type = 1;
  reviewForm.description = '';
  reviewForm.status = 1;
  reviewForm.reporter_id = undefined;
  reviewForm.reviewer_id = undefined;
  reviewForm.project_id = undefined;
  reviewForm.start_time = undefined;
  reviewForm.end_time = undefined;
  if (reviewFormRef.value) {
    reviewFormRef.value.resetFields();
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await reviewFormRef.value.validate();

    // 处理日期
    const formData = { ...reviewForm };
    if (formData.start_time) {
      formData.start_time = Math.floor(formData.start_time.getTime() / 1000);
    }
    if (formData.end_time) {
      formData.end_time = Math.floor(formData.end_time.getTime() / 1000);
    }

    let response;
    if (dialogType.value === 'create') {
      response = await reviewApi.createReview(formData);
    } else {
      response = await reviewApi.updateReview(formData);
    }

    if (response.status === 'success') {
      ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功');
      dialogVisible.value = false;
      getReviewList();
    } else {
      ElMessage.error(response.message || (dialogType.value === 'create' ? '创建失败' : '更新失败'));
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.review-management {
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

/* 评审详情弹窗样式 */
.review-detail-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.review-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}

/* 流程图区域 */
.flowchart-section {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

/* 标签页区域 */
.detail-tabs-section {
  padding: 20px;
}

.detail-tabs {
  margin-bottom: 20px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

/* 基本信息样式 */
.basic-info-container {
  padding: 20px 0;
}

.info-section {
  margin-bottom: 32px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  border-left: 4px solid #3b82f6;
  padding-left: 12px;
}

.detail-descriptions {
  margin-bottom: 24px;
}

.detail-descriptions :deep(.el-descriptions__label) {
  font-weight: 600;
  color: #4b5563;
}

.detail-descriptions :deep(.el-descriptions__content) {
  color: #111827;
}

/* 相关人员样式 */
.related-persons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.person-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.person-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.person-value {
  font-size: 14px;
  color: #111827;
}

/* 节点详情样式 */
.nodes-detail-container {
  padding: 20px 0;
}

.nodes-filter {
  margin-bottom: 20px;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.node-item {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.node-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.node-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.node-status {
  margin-left: 8px;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.node-assignee {
  display: flex;
  align-items: center;
}

.node-time {
  font-size: 14px;
  color: #6b7280;
}

.node-content {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #f3f4f6;
}

.node-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #111827;
}

.node-tasks {
  margin-top: 20px;
}

.tasks-header {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-name {
  font-size: 14px;
  color: #111827;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.no-tasks {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
}

.add-task {
  margin-top: 16px;
}

/* 用户列表样式 */
.node-users {
  margin-top: 20px;
}

.users-header {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-users {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
  font-size: 14px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.node-expand {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
}

.node-expand:hover {
  color: #3b82f6;
}

/* 流程图容器 */
.flowchart-container {
  margin-top: 20px;
}

/* 节点详情表格样式 */
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
</style>
