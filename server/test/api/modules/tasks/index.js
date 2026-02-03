/**
 * 任务管理模块测试
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
let testTaskId = null;
let testProjectId = null;
let testRequirementId = null;
let testReviewId = null;

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

// 辅助函数：创建临时项目
async function createTempProject() {
  const projectData = {
    name: `临时项目_${Date.now()}`,
    description: '用于任务测试的临时项目',
    status: 1,
    manager_id: 1,
    department_id: 1,
    start_date: Date.now(),
    end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
    budget: 50000.00
  };

  const response = await apiClient.post('/projects/create', projectData, { expect: 'success' });
  const projectId = response.datum.id;
  dataTracker.track('/projects/delete', { id: projectId, name: projectData.name });

  return projectId;
}

// 辅助函数：创建临时需求
async function createTempRequirement(projectId) {
  const requirementData = {
    name: `临时需求_${Date.now()}`,
    description: '用于任务测试的临时需求',
    type_id: 1,
    priority: 2,
    status_id: 1,
    current_assignee_id: 1,
    reporter_id: 1,
    project_id: projectId,
    planned_version: 'v1.0',
    actual_version: ''
  };

  const response = await apiClient.post('/requirements/create', requirementData, { expect: 'success' });
  const requirementId = response.datum.id;
  dataTracker.track('/requirements/delete', { id: requirementId, name: requirementData.name });

  return requirementId;
}

// 辅助函数：创建临时评审
async function createTempReview(projectId) {
  const reviewData = {
    name: `临时评审_${Date.now()}`,
    description: '用于任务测试的临时评审',
    review_type: 1,
    status: 1,
    reporter_id: 1,
    reviewer_id: 1,
    project_id: projectId,
    start_time: Date.now(),
    end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  const response = await apiClient.post('/reviews/create', reviewData, { expect: 'success' });
  const reviewId = response.datum.id;
  dataTracker.track('/reviews/delete', { id: reviewId, name: reviewData.name });

  return reviewId;
}

describe('任务管理模块', () => {
  // 在所有测试前执行：初始化全局测试数据并登录
  before(async () => {
    console.log('[任务模块 before] 初始化全局测试数据...');
    // 初始化 Mock.js 全局测试数据
    initializeGlobalTestData();
    console.log('[任务模块 before] 全局测试数据初始化完成');

    await ensureLoggedIn();
    testProjectId = await createTempProject();
    testRequirementId = await createTempRequirement(testProjectId);
    testReviewId = await createTempReview(testProjectId);
    console.log('[任务模块 before] 临时项目、需求、评审创建成功');
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('查询任务列表 - 正常情况', async () => {
    const response = await apiClient.get('/tasks/query', {
      current_page: 1,
      page_size: 10
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();
  });

  test('查询任务列表 - 按需求筛选', async () => {
    await apiClient.get('/tasks/query', {
      current_page: 1,
      page_size: 10,
      requirementId: testRequirementId
    }, { expect: 'success' });
  });

  test('查询任务列表 - 按评审筛选', async () => {
    await apiClient.get('/tasks/query', {
      current_page: 1,
      page_size: 10,
      reviewId: testReviewId
    }, { expect: 'success' });
  });

  test('查询任务列表 - 按状态筛选', async () => {
    await apiClient.get('/tasks/query', {
      current_page: 1,
      page_size: 10,
      status: 1
    }, { expect: 'success' });
  });

  test('创建任务 - 正常情况', async () => {
    const taskData = {
      name: `测试任务_${Date.now()}`,
      description: '这是一个测试任务的描述',
      priority: 2,
      status_id: 1,
      assignee_id: 1,
      reporter_id: 1,
      requirement_id: testRequirementId,
      review_id: testReviewId,
      requirement_node_id: null,
      review_node_id: null,
      estimated_hours: 8.00,
      actual_hours: 0.00,
      start_time: Date.now(),
      end_time: Date.now() + 24 * 60 * 60 * 1000
    };

    const response = await apiClient.post('/tasks/create', taskData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(taskData.name);

    // 保存创建的任务 ID
    testTaskId = response.datum.id;
    dataTracker.track('/tasks/delete', { id: testTaskId, name: taskData.name });

    console.log('[任务模块] 测试任务创建成功:', {
      id: testTaskId,
      name: taskData.name
    });
  });

  test('创建任务 - 缺少必填字段', async () => {
    await apiClient.post('/tasks/create', {
      description: '缺少名称的任务'
    }, { expect: 'error' });
  });

  test('获取任务详情 - 正常情况', async () => {
    if (!testTaskId) {
      test.skip('没有可用的测试任务 ID');
      return;
    }

    const response = await apiClient.get('/tasks/detail', { id: testTaskId }, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.id).to.equal(testTaskId);
  });

  test('获取任务详情 - 任务不存在', async () => {
    await apiClient.get('/tasks/detail', { id: 999999 }, { expect: 'error' });
  });

  test('更新任务 - 正常情况', async () => {
    if (!testTaskId) {
      test.skip('没有可用的测试任务 ID');
      return;
    }

    const updateData = {
      id: testTaskId,
      name: `更新后的测试任务_${Date.now()}`,
      description: '更新后的任务描述',
      priority: 1,
      status_id: 2,
      estimated_hours: 10.00
    };

    const response = await apiClient.post('/tasks/update', updateData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(updateData.name);
    expect(response.datum.priority).to.equal(updateData.priority);
    expect(response.datum.status_id).to.equal(updateData.status_id);
  });

  test('更新任务 - 任务不存在', async () => {
    await apiClient.post('/tasks/update', {
      id: 999999,
      name: '不存在的任务'
    }, { expect: 'error' });
  });

  test('删除任务 - 单个删除（不删除测试任务，避免影响后续测试）', async () => {
    // 创建一个临时任务用于删除测试
    const tempTaskData = {
      name: `临时删除任务_${Date.now()}`,
      description: '临时任务描述',
      priority: 2,
      status_id: 1,
      assignee_id: 1,
      reporter_id: 1,
      requirement_id: testRequirementId,
      review_id: testReviewId,
      estimated_hours: 4.00,
      actual_hours: 0.00
    };

    const createResponse = await apiClient.post('/tasks/create', tempTaskData, { expect: 'success' });
    const tempTaskId = createResponse.datum.id;

    // 删除刚创建的临时任务
    await apiClient.post('/tasks/delete', { data: [tempTaskId] }, { expect: 'success' });

    console.log('[任务模块] 临时任务已删除');
  });

  test('删除任务 - 批量删除', async () => {
    // 先创建一些测试任务
    const tasksToCreate = [];
    const timestamp = Date.now();
    for (let i = 0; i < 2; i++) {
      tasksToCreate.push({
        name: `批量删除任务_${i}_${timestamp}`,
        description: `批量删除任务描述_${i}`,
        priority: 2,
        status_id: 1,
        assignee_id: 1,
        reporter_id: 1,
        requirement_id: testRequirementId,
        review_id: testReviewId,
        estimated_hours: 4.00,
        actual_hours: 0.00
      });
    }

    // 并行创建任务
    const createResponses = await Promise.all(
      tasksToCreate.map(taskData =>
        apiClient.post('/tasks/create', taskData, { expect: 'success' })
      )
    );

    const taskIds = createResponses.map(response => response.datum.id);

    if (taskIds.length > 0) {
      await apiClient.post('/tasks/delete', { data: taskIds }, { expect: 'success' });
    }
  });

  test('查询任务列表 - 未登录', async () => {
    const tempClient = createApiClient();
    await tempClient.get('/tasks/query', null, { expect: 'error' });
  });

  test('创建任务 - 需求不存在', async () => {
    const taskData = {
      name: `无效需求任务_${Date.now()}`,
      description: '需求不存在的任务',
      priority: 2,
      status_id: 1,
      assignee_id: 1,
      reporter_id: 1,
      requirement_id: 999999,
      review_id: testReviewId,
      estimated_hours: 4.00,
      actual_hours: 0.00
    };

    await apiClient.post('/tasks/create', taskData, { expect: 'error' });
  });

  test('创建任务 - 评审不存在', async () => {
    const taskData = {
      name: `无效评审任务_${Date.now()}`,
      description: '评审不存在的任务',
      priority: 2,
      status_id: 1,
      assignee_id: 1,
      reporter_id: 1,
      requirement_id: testRequirementId,
      review_id: 999999,
      estimated_hours: 4.00,
      actual_hours: 0.00
    };

    await apiClient.post('/tasks/create', taskData, { expect: 'error' });
  });
});
