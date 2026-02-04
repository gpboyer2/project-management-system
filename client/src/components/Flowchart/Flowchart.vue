<template>
  <div class="flowchart-container">
    <!-- 工具栏 -->
    <div class="flowchart-toolbar">
      <el-button type="primary" size="small" @click="handleSave">
        <el-icon><DocumentAdd /></el-icon>
        保存流程
      </el-button>
      <el-button size="small" @click="handleAddNode">
        <el-icon><Plus /></el-icon>
        添加节点
      </el-button>
      <el-button size="small" @click="handleDeleteSelected">
        <el-icon><Delete /></el-icon>
        删除选中
      </el-button>
      <el-button size="small" @click="handleZoomIn">
        <el-icon><ZoomIn /></el-icon>
        放大
      </el-button>
      <el-button size="small" @click="handleZoomOut">
        <el-icon><ZoomOut /></el-icon>
        缩小
      </el-button>
      <el-button size="small" @click="handleFitView">
        <el-icon><FullScreen /></el-icon>
        适配视图
      </el-button>
    </div>

    <!-- 画布区域 -->
    <div ref="lfContainer" class="flowchart-canvas"></div>

    <!-- 节点属性面板 -->
    <el-drawer
      v-model="nodePropsVisible"
      size="350px"
      title="节点属性"
      direction="rtl"
      style="z-index: 1000"
    >
      <div v-if="selectedNode" class="node-props-panel">
        <el-form :model="selectedNodeData" label-width="80px">
          <el-form-item label="节点名称">
            <el-input v-model="selectedNodeData.name" />
          </el-form-item>
          <el-form-item label="节点类型">
            <el-select v-model="selectedNodeData.node_type_id" placeholder="请选择节点类型">
              <el-option label="需求评审" :value="1" />
              <el-option label="技术设计" :value="2" />
              <el-option label="开发" :value="3" />
              <el-option label="测试" :value="4" />
              <el-option label="上线" :value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="负责人">
            <el-select v-model="selectedNodeData.assignee_id" placeholder="请选择负责人" clearable>
              <el-option
                v-for="user in userList"
                :key="user.user_id"
                :label="user.real_name || user.user_name"
                :value="user.user_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="处理时限">
            <el-input-number
              v-model="selectedNodeData.duration_limit"
              :min="0"
              :max="1000"
              controls-position="right"
              placeholder="小时"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch
              v-model="selectedNodeData.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-form>

        <div class="node-tasks-section">
          <div class="section-header">
            <span>任务列表</span>
            <el-button type="primary" size="small" link @click="handleAddTask">
              添加任务
            </el-button>
          </div>
          <div v-if="nodeTasks.length === 0" class="empty-tasks">
            暂无任务
          </div>
          <div v-else class="tasks-list">
            <div
              v-for="task in nodeTasks"
              :key="task.id"
              class="task-item"
            >
              <div class="task-name">{{ task.name }}</div>
              <div class="task-actions">
                <el-button type="text" size="small" @click="handleEditTask(task)">
                  编辑
                </el-button>
                <el-button type="text" size="small" text-color="#ff4d4f" @click="handleDeleteTask(task)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="node-users-section">
          <div class="section-header">
            <span>参与用户</span>
            <el-button type="primary" size="small" link @click="handleAddUser">
              添加用户
            </el-button>
          </div>
          <div v-if="nodeUsers.length === 0" class="empty-users">
            暂无参与用户
          </div>
          <div v-else class="users-list">
            <div
              v-for="user in nodeUsers"
              :key="user.id"
              class="user-item"
            >
              <div class="user-info">
                <span class="user-name">{{ getUserRealName(user.user_id) }}</span>
                <el-tag
                  :type="getUserRoleType(user.role_type)"
                  size="small"
                >
                  {{ getUserRoleText(user.role_type) }}
                </el-tag>
              </div>
              <el-button type="text" size="small" text-color="#ff4d4f" @click="handleRemoveUser(user)">
                移除
              </el-button>
            </div>
          </div>
        </div>

        <div class="node-actions">
          <el-button type="primary" @click="handleUpdateNode">
            更新节点
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 添加任务对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="taskDialogType === 'create' ? '添加任务' : '编辑任务'"
      width="500px"
    >
      <el-form :model="taskForm" :rules="taskFormRules" label-width="80px">
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
        <el-form-item label="状态" prop="status_id">
          <el-select v-model="taskForm.status_id" placeholder="请选择状态">
            <el-option label="待办" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee_id">
          <el-select v-model="taskForm.assignee_id" placeholder="请选择负责人" clearable>
            <el-option
              v-for="user in userList"
              :key="user.user_id"
              :label="user.real_name || user.user_name"
              :value="user.user_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预估工时">
          <el-input-number
            v-model="taskForm.estimated_hours"
            :min="0"
            :max="1000"
            controls-position="right"
            placeholder="小时"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      title="添加参与用户"
      width="500px"
    >
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户">
          <el-select v-model="userForm.user_id" placeholder="请选择用户">
            <el-option
              v-for="user in availableUsers"
              :key="user.user_id"
              :label="user.real_name || user.user_name"
              :value="user.user_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="userForm.role_type">
            <el-radio :label="1">负责人</el-radio>
            <el-radio :label="2">参与者</el-radio>
            <el-radio :label="3">观察者</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddUserSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import LogicFlow from '@logicflow/core';
import { BpmnElement } from '@logicflow/extension';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  DocumentAdd,
  Plus,
  Delete,
  ZoomIn,
  ZoomOut,
  FullScreen
} from '@element-plus/icons-vue';
import { requirementApi, reviewApi, taskApi, userApi } from '@/api';

// 组件属性
const props = defineProps({
  requirementId: {
    type: Number,
    default: null
  },
  reviewId: {
    type: Number,
    default: null
  },
  editable: {
    type: Boolean,
    default: true
  }
});

// 响应式数据
const lfContainer = ref(null);
const lf = ref(null);
const nodePropsVisible = ref(false);
const selectedNode = ref(null);
const selectedNodeData = reactive({});
const taskDialogVisible = ref(false);
const taskDialogType = ref('create');
const taskForm = reactive({
  id: undefined,
  name: '',
  description: '',
  priority: 2,
  status_id: 1,
  assignee_id: undefined,
  reporter_id: 1,
  [props.requirementId ? 'requirement_id' : 'review_id']: props.requirementId || props.reviewId,
  [props.requirementId ? 'requirement_node_id' : 'review_node_id']: undefined,
  estimated_hours: 0
});
const userDialogVisible = ref(false);
const userForm = reactive({
  user_id: undefined,
  role_type: 2
});

// 用户信息
const userList = ref([]);
const nodeTasks = ref([]);
const nodeUsers = ref([]);

// 表单验证规则
const taskFormRules = reactive({
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 1, max: 200, message: '任务名称长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  status_id: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
});

// 计算属性：可用用户列表（排除已添加的用户）
const availableUsers = computed(() => {
  const selectedUserIds = nodeUsers.value.map(user => user.user_id);
  return userList.value.filter(user => !selectedUserIds.includes(user.user_id));
});

// 初始化 LogicFlow
const initLogicFlow = async () => {
  if (!lfContainer.value) return;

  // LogicFlow 1.x 版本使用静态方法注册插件
  LogicFlow.use(BpmnElement);

  lf.value = new LogicFlow({
    container: lfContainer.value,
    width: lfContainer.value.clientWidth,
    height: lfContainer.value.clientHeight,
    grid: true,
    snapline: true,
    keyboard: true,
    movable: props.editable,
    draggable: props.editable,
    connectable: props.editable,
    hoverable: true,
    // 设置节点默认尺寸，防止节点过大
    nodeWidth: 120,
    nodeHeight: 60
  });

  // 监听节点选择事件
  lf.value.on('node:click', async (event) => {
    const { node } = event;
    selectedNode.value = node;
    await loadNodeData(node.id);
    nodePropsVisible.value = true;
  });

  // 监听空白区域点击事件
  lf.value.on('blank:click', () => {
    selectedNode.value = null;
    nodePropsVisible.value = false;
  });

  // 监听连线事件
  lf.value.on('edge:connected', (event) => {
    const { edge } = event;
    console.log('连线创建:', edge);
  });

  // 加载流程数据
  await loadProcessData();
};

// 加载流程数据
const loadProcessData = async () => {
  try {
    let nodesResponse, relationsResponse;

    if (props.requirementId) {
      // 加载需求管理流程数据
      nodesResponse = await requirementApi.getRequirementProcessNodes(props.requirementId);
      relationsResponse = await requirementApi.getRequirementProcessNodeRelations(props.requirementId);
    } else if (props.reviewId) {
      // 加载评审管理流程数据
      nodesResponse = await reviewApi.getReviewProcessNodes(props.reviewId);
      relationsResponse = await reviewApi.getReviewProcessNodeRelations(props.reviewId);
    } else {
      ElMessage.warning('请提供需求ID或评审ID');
      return;
    }

    if (nodesResponse.status === 'success') {
      const nodes = nodesResponse.datum.list || [];

      const edges = (relationsResponse.status === 'success' ? relationsResponse.datum.list : []).map(relation => ({
        id: relation.id.toString(),
        sourceNodeId: relation.source_node_id.toString(),
        targetNodeId: relation.target_node_id.toString(),
        type: 'bpmn:sequenceFlow',
        properties: {
          relationType: relation.relation_type,
          condition: relation.condition
        }
      }));

      // 渲染到画布
      lf.value.render({
        nodes: nodes.map(node => ({
          id: node.id.toString(),
          type: getNodeType(node.node_type_id),
          x: node.x || Math.random() * 400 + 100,
          y: node.y || Math.random() * 300 + 100,
          text: node.name,
          width: 120, // 设置节点宽度
          height: 60, // 设置节点高度
          properties: {
            nodeData: node
          }
        })),
        edges
      });
    }
  } catch (error) {
    console.error('加载流程数据失败:', error);
    ElMessage.error('加载流程数据失败');
  }
};

// 获取节点类型对应的 BPMN 类型
const getNodeType = (nodeTypeId) => {
  const typeMap = {
    1: 'bpmn:startEvent',
    2: 'bpmn:userTask', // 技术设计对应用户任务节点
    3: 'bpmn:serviceTask',
    4: 'bpmn:exclusiveGateway',
    5: 'bpmn:endEvent'
  };
  return typeMap[nodeTypeId] || 'bpmn:userTask';
};

// 加载节点数据（任务和用户）
const loadNodeData = async (nodeId) => {
  try {
    // 加载节点信息
    let nodeResponse;
    if (props.requirementId) {
      nodeResponse = await requirementApi.getRequirementProcessNodeDetail(parseInt(nodeId));
    } else if (props.reviewId) {
      nodeResponse = await reviewApi.getReviewProcessNodeDetail(parseInt(nodeId));
    }

    if (nodeResponse.status === 'success') {
      Object.assign(selectedNodeData, nodeResponse.datum);
    }

    // 加载节点任务
    const tasksResponse = await taskApi.getTaskList({
      [props.requirementId ? 'requirement_node_id' : 'review_node_id']: parseInt(nodeId),
      page: 1,
      pageSize: 100
    });
    if (tasksResponse.status === 'success') {
      nodeTasks.value = tasksResponse.datum.list || [];
    }

    // 加载节点用户
    let usersResponse;
    if (props.requirementId) {
      usersResponse = await requirementApi.getRequirementProcessNodeUsers(parseInt(nodeId));
    } else if (props.reviewId) {
      usersResponse = await reviewApi.getReviewProcessNodeUsers(parseInt(nodeId));
    }

    if (usersResponse.status === 'success') {
      nodeUsers.value = usersResponse.datum.list || [];
    }
  } catch (error) {
    console.error('加载节点数据失败:', error);
  }
};

// 保存流程
const handleSave = async () => {
  try {
    const graphData = lf.value.getGraphData();

    // 保存节点
    const nodes = graphData.nodes.map(node => ({
      id: parseInt(node.id) > 0 ? parseInt(node.id) : null, // 只保留正整数 ID，新节点不设置 ID，让数据库自增
      [props.requirementId ? 'requirement_id' : 'review_id']: props.requirementId || props.reviewId,
      name: typeof node.text === 'string' ? node.text : (node.text?.value || '未命名节点'),
      node_type_id: getNodeTypeId(node.type),
      x: node.x,
      y: node.y,
      node_order: 0,
      status: 1,
      // 只保留需要的属性，避免覆盖新的位置信息
      assignee_type: node.properties?.nodeData?.assignee_type,
      assignee_id: node.properties?.nodeData?.assignee_id,
      duration_limit: node.properties?.nodeData?.duration_limit
    }));

    // 保存节点关系
    const relations = graphData.edges.map(edge => ({
      id: edge.id && parseInt(edge.id) > 0 ? parseInt(edge.id) : null, // 只保留正整数 ID，新关系不设置 ID，让数据库自增
      [props.requirementId ? 'requirement_id' : 'review_id']: props.requirementId || props.reviewId,
      source_node_id: parseInt(edge.sourceNodeId), // 直接使用节点的 ID，不处理临时 ID
      target_node_id: parseInt(edge.targetNodeId), // 直接使用节点的 ID，不处理临时 ID
      relation_type: edge.properties?.relationType || 1,
      condition: edge.properties?.condition
    }));

    // 保存流程
    if (props.requirementId) {
      const response = await requirementApi.saveRequirementProcess({
        nodes,
        relations
      });
      if (response.status === 'success') {
        await loadProcessData();
        ElMessage.success('流程保存成功');
      }
    } else if (props.reviewId) {
      const response = await reviewApi.saveReviewProcess({
        nodes,
        relations
      });
      if (response.status === 'success') {
        await loadProcessData();
        ElMessage.success('流程保存成功');
      }
    }
  } catch (error) {
    console.error('保存流程失败:', error);
    ElMessage.error('保存流程失败');
  }
};

// 获取节点类型 ID
const getNodeTypeId = (nodeType) => {
  const typeMap = {
    'bpmn:startEvent': 1,
    'bpmn:userTask': 2,
    'bpmn:serviceTask': 3,
    'bpmn:exclusiveGateway': 4,
    'bpmn:endEvent': 5,
    'rect': 2, // 矩形节点对应用户任务类型
    'circle': 2, // 圆形节点对应用户任务类型
    'polygon': 2 // 多边形节点对应用户任务类型
  };
  return typeMap[nodeType] || 2;
};

// 添加节点
const handleAddNode = () => {
  ElMessageBox.prompt('请输入节点名称', '添加节点', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入节点名称',
    inputPattern: /.+/,
    inputErrorMessage: '节点名称不能为空'
  }).then(({ value }) => {
    // 生成临时的唯一标识符（负数，避免与数据库生成的正整数ID冲突）
    // LogicFlow 要求节点必须有 ID，所以我们需要生成一个临时 ID
    const tempId = -Date.now();
    // 添加新节点
    const newNode = {
      id: tempId.toString(), // LogicFlow 要求 id 为字符串
      type: 'bpmn:userTask', // 使用 BPMN 用户任务节点类型，与 loadProcessData 函数一致
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      text: value,
      width: 120, // 设置节点宽度
      height: 60, // 设置节点高度
      properties: {
        nodeData: {
          [props.requirementId ? 'requirement_id' : 'review_id']: props.requirementId || props.reviewId,
          node_type_id: 2, // 默认用户任务类型
          name: value,
          status: 1,
          node_order: 0
        }
      }
    };
    // 使用 LogicFlow 的 addNode 方法添加节点，而不是直接操作 graphData
    lf.value.addNode(newNode);
    ElMessage.success('节点添加成功');
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除选中
const handleDeleteSelected = async () => {
  // LogicFlow 1.x 使用 getSelectElements() 来获取选中的元素
  const selectedElements = lf.value.getSelectElements();
  const selectedNodes = selectedElements.nodes || [];
  const selectedEdges = selectedElements.edges || [];

  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    ElMessage.warning('请先选择要删除的节点或连线');
    return;
  }

  try {
    await ElMessageBox.confirm('确定要删除选中的节点和连线吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 删除节点
    for (const node of selectedNodes) {
      if (props.requirementId) {
        await requirementApi.deleteRequirementProcessNodes([parseInt(node.id)]);
      } else if (props.reviewId) {
        await reviewApi.deleteReviewProcessNodes([parseInt(node.id)]);
      }
    }

    // 删除连线
    for (const edge of selectedEdges) {
      if (props.requirementId) {
        await requirementApi.deleteRequirementProcessNodeRelations([parseInt(edge.id)]);
      } else if (props.reviewId) {
        await reviewApi.deleteReviewProcessNodeRelations([parseInt(edge.id)]);
      }
    }

    // 从画布中删除
    selectedNodes.forEach(node => lf.value.deleteNode(node.id));
    selectedEdges.forEach(edge => lf.value.deleteEdge(edge.id));

    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 更新节点
const handleUpdateNode = async () => {
  try {
    if (props.requirementId) {
      await requirementApi.updateRequirementProcessNode(selectedNodeData);
    } else if (props.reviewId) {
      await reviewApi.updateReviewProcessNode(selectedNodeData);
    }
    // 更新画布上的节点文本
    const node = lf.value.getNodeById(selectedNode.value.id);
    node.text = selectedNodeData.name;
    lf.value.updateNode(node);

    ElMessage.success('节点更新成功');
  } catch (error) {
    console.error('更新节点失败:', error);
    ElMessage.error('更新节点失败');
  }
};

// 添加任务
const handleAddTask = () => {
  taskDialogType.value = 'create';
  taskForm.id = undefined;
  taskForm.name = '';
  taskForm.description = '';
  taskForm.priority = 2;
  taskForm.status_id = 1;
  taskForm.assignee_id = undefined;
  taskForm[props.requirementId ? 'requirement_node_id' : 'review_node_id'] = parseInt(selectedNode.value.id);
  taskForm.estimated_hours = 0;
  taskDialogVisible.value = true;
};

// 编辑任务
const handleEditTask = (task) => {
  taskDialogType.value = 'edit';
  Object.assign(taskForm, task);
  taskDialogVisible.value = true;
};

// 删除任务
const handleDeleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务"${task.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    await taskApi.deleteTasks([task.id]);
    nodeTasks.value = nodeTasks.value.filter(t => t.id !== task.id);
    ElMessage.success('任务删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error);
      ElMessage.error('删除任务失败');
    }
  }
};

// 提交任务
const handleSubmitTask = async () => {
  try {
    let response;
    if (taskDialogType.value === 'create') {
      response = await taskApi.createTask(taskForm);
    } else {
      response = await taskApi.updateTask(taskForm);
    }

    if (response.status === 'success') {
      ElMessage.success(taskDialogType.value === 'create' ? '任务创建成功' : '任务更新成功');
      taskDialogVisible.value = false;
      await loadNodeData(selectedNode.value.id);
    } else {
      ElMessage.error(response.message || (taskDialogType.value === 'create' ? '任务创建失败' : '任务更新失败'));
    }
  } catch (error) {
    console.error('提交任务失败:', error);
    ElMessage.error('提交任务失败');
  }
};

// 添加用户
const handleAddUser = () => {
  userForm.user_id = undefined;
  userForm.role_type = 2;
  userDialogVisible.value = true;
};

// 添加用户提交
const handleAddUserSubmit = async () => {
  try {
    if (props.requirementId) {
      await requirementApi.createRequirementProcessNodeUser({
        node_id: parseInt(selectedNode.value.id),
        user_id: userForm.user_id,
        role_type: userForm.role_type
      });
    } else if (props.reviewId) {
      await reviewApi.createReviewProcessNodeUser({
        node_id: parseInt(selectedNode.value.id),
        user_id: userForm.user_id,
        role_type: userForm.role_type
      });
    }

    ElMessage.success('用户添加成功');
    userDialogVisible.value = false;
    await loadNodeData(selectedNode.value.id);
  } catch (error) {
    console.error('添加用户失败:', error);
    ElMessage.error('添加用户失败');
  }
};

// 移除用户
const handleRemoveUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要移除用户"${getUserRealName(user.user_id)}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    if (props.requirementId) {
      await requirementApi.deleteRequirementProcessNodeUsers([user.id]);
    } else if (props.reviewId) {
      await reviewApi.deleteReviewProcessNodeUsers([user.id]);
    }

    nodeUsers.value = nodeUsers.value.filter(u => u.id !== user.id);
    ElMessage.success('用户移除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除用户失败:', error);
      ElMessage.error('移除用户失败');
    }
  }
};

// 缩放功能
const handleZoomIn = () => {
  lf.value.zoom(true);
};

const handleZoomOut = () => {
  lf.value.zoom(false);
};

const handleFitView = () => {
  // 适配视图
  lf.value.fitView({
    padding: 20
  });
};

// 获取用户真实姓名
const getUserRealName = (userId) => {
  const user = userList.value.find(u => u.user_id === userId);
  return user ? (user.real_name || user.user_name) : `用户${userId}`;
};

// 获取用户角色文本
const getUserRoleText = (roleType) => {
  const roleMap = {
    1: '负责人',
    2: '参与者',
    3: '观察者'
  };
  return roleMap[roleType] || '未知';
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

// 加载用户列表
const loadUserList = async () => {
  try {
    const response = await userApi.list({ current_page: 1, page_size: 100 });
    if (response.status === 'success') {
      userList.value = response.datum.list || [];
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
  }
};

// 页面加载
onMounted(async () => {
  await loadUserList();
  await nextTick();
  await initLogicFlow();
});
</script>

<style scoped>
.flowchart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

.flowchart-toolbar {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.flowchart-canvas {
  flex: 1;
  min-height: 500px;
  background: #ffffff;
  margin: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
  /* 确保画布内容完整显示 */
  overflow: visible !important;
}

.node-props-panel {
  padding: 20px;
}

.node-tasks-section,
.node-users-section {
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.empty-tasks,
.empty-users {
  text-align: center;
  color: #94a3b8;
  padding: 24px 0;
  font-size: 14px;
}

.tasks-list,
.users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item,
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.task-item:hover,
.user-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 1px 3px 0 rgba(59, 130, 246, 0.1);
}

.task-name {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.task-actions,
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.node-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* LogicFlow 自定义样式 */
:deep(.lf-container) {
  background: #f8fafc;
  border-radius: 12px;
}

:deep(.lf-graph) {
  background: #f8fafc;
}


:deep(.lf-node) {
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  /* 确保节点选中时不发生位置偏移 */
  transform: none !important;
  /* 确保节点不被其他元素遮挡 */
  z-index: 10 !important;
  /* 确保节点完整显示，不受 SVG 裁剪影响 */
  overflow: visible !important;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
}

:deep(.lf-node:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

:deep(.lf-node.selected) {
  /* 选中时的样式，确保位置不变 */
  transform: none !important;
  box-shadow: 0 0 0 2px #3b82f6, 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

:deep(.lf-node .lf-node-content) {
  /* 确保节点内容完整显示 */
  overflow: visible !important;
}

:deep(.lf-node svg) {
  /* 确保 SVG 元素不被裁剪 */
  overflow: visible !important;
  /* 确保节点的边框和填充样式正确 */
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.lf-node text) {
  font-size: 14px;
  font-weight: 500;
  fill: #1e293b;
}

:deep(.lf-node svg) {
  /* 确保 SVG 元素不被裁剪 */
  overflow: visible !important;
  /* 确保节点的边框和填充样式正确 */
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.lf-edge) {
  stroke: #cbd5e1;
  stroke-width: 2;
}

:deep(.lf-edge:hover) {
  stroke: #3b82f6;
  stroke-width: 3;
}

:deep(.lf-grid) {
  stroke: #e2e8f0;
  stroke-width: 0.5;
}

:deep(.lf-snapline) {
  stroke: #3b82f6;
  stroke-width: 1;
}
</style>
