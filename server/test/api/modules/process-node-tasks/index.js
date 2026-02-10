/**
 * 流程节点任务关联模块测试
 */

const { test, describe, before, beforeEach } = require('../../lib/test-runner');
const { expect } = require('../../lib/assertions');
const { getApiClient, getDataTracker, createApiClient } = require('../../context');
const { initializeGlobalTestData, getTestData, setTestData } = require('../../utils/mock-data-generator');
const Mock = require('mockjs');

// 使用全局共享的实例
const apiClient = getApiClient();
const dataTracker = getDataTracker();

// 临时存储测试数据
let testNodeId = null;
let testNodeType = 1; // 1-评审流程节点
let testTaskIds = [];

// 辅助函数：确保已登录
async function ensureLoggedIn() {
  const currentToken = apiClient.getToken();
  if (currentToken) {
    try {
      await apiClient.get('/auth/me', {}, { expect: 'success' });
      return currentToken;
    } catch (error) {
      // token 无效，继续执行登录
    }
  }
  // 登录
  const loginResponse = await apiClient.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, { expect: 'success' });
  const token = loginResponse.datum.accessToken;
  apiClient.setToken(token);
  return token;
}

// 辅助函数：创建临时任务
async function createTempTask() {
  const taskData = {
    name: `临时任务_${Date.now()}`,
    description: '用于流程节点任务关联测试的临时任务',
    priority: 2,
    status_id: 1,
    assignee_id: 1,
    reporter_id: 1,
    requirement_id: null,
    review_id: null,
    requirement_node_id: null,
    review_node_id: null,
    estimated_hours: 8.00,
    actual_hours: 0.00,
    start_time: Date.now(),
    end_time: Date.now() + 24 * 60 * 60 * 1000
  };

  const response = await apiClient.post('/tasks/create', taskData, { expect: 'success' });
  const taskId = response.datum.id;
  dataTracker.track('/tasks/delete', { id: taskId, name: taskData.name });

  return taskId;
}

describe('流程节点任务关联模块', () => {
  // 在所有测试前执行：初始化全局测试数据并登录
  before(async () => {
    console.log('[流程节点任务关联模块 before] 初始化全局测试数据...');
    // 初始化 Mock.js 全局测试数据
    initializeGlobalTestData();
    console.log('[流程节点任务关联模块 before] 全局测试数据初始化完成');

    await ensureLoggedIn();
    // 创建几个临时任务
    for (let i = 0; i < 3; i++) {
      const taskId = await createTempTask();
      testTaskIds.push(taskId);
    }

    // 创建一个临时项目用于测试
    const projectData = {
      name: `临时项目_${Date.now()}`,
      description: '用于流程节点任务关联测试的临时项目',
      status: 1,
      manager_id: 1,
      department_id: 1,
      start_date: Date.now(),
      end_date: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    const projectResponse = await apiClient.post('/projects/create', projectData, { expect: 'success' });
    const projectId = projectResponse.datum.id;
    dataTracker.track('/projects/delete', { id: projectId, name: projectData.name });

    // 创建一个临时评审和评审流程节点用于测试
    const reviewData = {
      name: `临时评审_${Date.now()}`,
      description: '用于流程节点任务关联测试的临时评审',
      status_id: 1,
      project_id: projectId,
      manager_id: 1,
      reporter_id: 1, // 添加报告人ID
      start_time: Date.now(),
      end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const reviewResponse = await apiClient.post('/reviews/create', reviewData, { expect: 'success' });
    const reviewId = reviewResponse.datum.id;
    dataTracker.track('/reviews/delete', { id: reviewId, name: reviewData.name });

    // 创建一个评审流程节点
    const nodeData = {
      review_id: reviewId,
      node_type_id: 1,
      name: `临时评审节点_${Date.now()}`,
      description: '用于流程节点任务关联测试的临时节点',
      sort_order: 0,
      node_order: 0, // 添加节点排序字段
      status: 1
    };

    const nodeResponse = await apiClient.post('/reviews/process-nodes/create', nodeData, { expect: 'success' });
    testNodeId = nodeResponse.datum.id;
    dataTracker.track('/reviews/process-nodes/delete', { id: testNodeId, name: nodeData.name });

    console.log('[流程节点任务关联模块 before] 临时任务和节点创建成功');
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('查询流程节点任务列表 - 正常情况', async () => {
    const response = await apiClient.get('/process-node-tasks/query', {
      node_id: testNodeId,
      node_type: testNodeType,
      is_placeholder: false
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(Array.isArray(response.datum.list)).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();

    // 检查返回的数据结构是否符合预期（节点包含 tasks 数组）
    response.datum.list.forEach(node => {
      expect(node.node_id).to.be.truthy();
      expect(node.node_type).to.be.truthy();
      expect(Array.isArray(node.tasks)).to.be.truthy();
    });
  });

  test('查询流程节点任务列表 - 无参数', async () => {
    const response = await apiClient.get('/process-node-tasks/query', {}, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(Array.isArray(response.datum.list)).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();
  });

  test('为流程节点添加任务 - 正常情况', async () => {
    await apiClient.post('/process-node-tasks/add-tasks', {
      nodeId: testNodeId,
      nodeType: testNodeType,
      taskIds: testTaskIds.slice(0, 2) // 添加前两个任务
    }, { expect: 'success' });
  });

  test('为流程节点添加任务 - 无效节点ID', async () => {
    await apiClient.post('/process-node-tasks/add-tasks', {
      nodeId: 999999,
      nodeType: testNodeType,
      taskIds: testTaskIds.slice(0, 1)
    }, { expect: 'error' });
  });

  test('为流程节点添加任务 - 无效任务ID', async () => {
    await apiClient.post('/process-node-tasks/add-tasks', {
      nodeId: testNodeId,
      nodeType: testNodeType,
      taskIds: [999999]
    }, { expect: 'error' });
  });

  test('从流程节点移除任务 - 正常情况', async () => {
    await apiClient.post('/process-node-tasks/remove-tasks', {
      nodeId: testNodeId,
      nodeType: testNodeType,
      taskIds: testTaskIds.slice(0, 1) // 移除第一个任务
    }, { expect: 'success' });
  });

  test('为流程节点添加占位任务 - 正常情况', async () => {
    const placeholderTasks = [
      {
        task_name: `占位任务1_${Date.now()}`,
        task_description: '这是一个占位任务',
        task_type: 1
      },
      {
        task_name: `占位任务2_${Date.now()}`,
        task_description: '这是另一个占位任务',
        task_type: 2
      }
    ];

    await apiClient.post('/process-node-tasks/add-placeholder-tasks', {
      nodeId: testNodeId,
      nodeType: testNodeType,
      placeholderTasks: placeholderTasks
    }, { expect: 'success' });
  });

  test('查询流程节点任务列表 - 包含占位任务', async () => {
    const response = await apiClient.get('/process-node-tasks/query', {
      node_id: testNodeId,
      node_type: testNodeType
    }, { expect: 'success' });

    // 检查是否返回了包含任务的节点
    const nodesWithTasks = response.datum.list.filter(node => node.tasks.length > 0);
    expect(nodesWithTasks.length > 0).to.be.truthy();

    // 检查是否包含占位任务
    const hasPlaceholderTasks = nodesWithTasks.some(node =>
      node.tasks.some(task => task.is_placeholder === true)
    );
    expect(hasPlaceholderTasks).to.be.truthy();
  });
});