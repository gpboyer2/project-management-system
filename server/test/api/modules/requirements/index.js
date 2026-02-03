/**
 * 需求管理模块测试
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
let testRequirementId = null;
let testProjectId = null;

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
    description: '用于需求测试的临时项目',
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

describe('需求管理模块', () => {
  // 在所有测试前执行：初始化全局测试数据并登录
  before(async () => {
    console.log('[需求模块 before] 初始化全局测试数据...');
    // 初始化 Mock.js 全局测试数据
    initializeGlobalTestData();
    console.log('[需求模块 before] 全局测试数据初始化完成');

    await ensureLoggedIn();
    testProjectId = await createTempProject();
    console.log('[需求模块 before] 临时项目创建成功:', testProjectId);
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('查询需求列表 - 正常情况', async () => {
    const response = await apiClient.get('/requirements/query', {
      current_page: 1,
      page_size: 10
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();
  });

  test('查询需求列表 - 按项目筛选', async () => {
    await apiClient.get('/requirements/query', {
      current_page: 1,
      page_size: 10,
      projectId: testProjectId
    }, { expect: 'success' });
  });

  test('查询需求列表 - 按状态筛选', async () => {
    await apiClient.get('/requirements/query', {
      current_page: 1,
      page_size: 10,
      status: 1
    }, { expect: 'success' });
  });

  test('创建需求 - 正常情况', async () => {
    const requirementData = {
      name: `测试需求_${Date.now()}`,
      description: '这是一个测试需求的描述',
      type_id: 1,
      priority: 2,
      status_id: 1,
      current_assignee_id: 1,
      reporter_id: 1,
      project_id: testProjectId,
      planned_version: 'v1.0',
      actual_version: ''
    };

    const response = await apiClient.post('/requirements/create', requirementData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(requirementData.name);

    // 保存创建的需求 ID
    testRequirementId = response.datum.id;
    dataTracker.track('/requirements/delete', { id: testRequirementId, name: requirementData.name });

    console.log('[需求模块] 测试需求创建成功:', {
      id: testRequirementId,
      name: requirementData.name
    });
  });

  test('创建需求 - 缺少必填字段', async () => {
    await apiClient.post('/requirements/create', {
      description: '缺少名称的需求'
    }, { expect: 'error' });
  });

  test('创建需求 - 项目不存在', async () => {
    const requirementData = {
      name: `无效项目需求_${Date.now()}`,
      description: '项目不存在的需求',
      type_id: 1,
      priority: 2,
      status_id: 1,
      current_assignee_id: 1,
      reporter_id: 1,
      project_id: 999999,
      planned_version: 'v1.0'
    };

    await apiClient.post('/requirements/create', requirementData, { expect: 'error' });
  });

  test('获取需求详情 - 正常情况', async () => {
    if (!testRequirementId) {
      test.skip('没有可用的测试需求 ID');
      return;
    }

    const response = await apiClient.get('/requirements/detail', { id: testRequirementId }, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.id).to.equal(testRequirementId);
  });

  test('获取需求详情 - 需求不存在', async () => {
    await apiClient.get('/requirements/detail', { id: 999999 }, { expect: 'error' });
  });

  test('更新需求 - 正常情况', async () => {
    if (!testRequirementId) {
      test.skip('没有可用的测试需求 ID');
      return;
    }

    const updateData = {
      id: testRequirementId,
      name: `更新后的测试需求_${Date.now()}`,
      description: '更新后的需求描述',
      priority: 1
    };

    const response = await apiClient.post('/requirements/update', updateData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(updateData.name);
    expect(response.datum.priority).to.equal(updateData.priority);
  });

  test('更新需求 - 需求不存在', async () => {
    await apiClient.post('/requirements/update', {
      id: 999999,
      name: '不存在的需求'
    }, { expect: 'error' });
  });

  test('创建需求流程节点 - 正常情况', async () => {
    if (!testRequirementId) {
      test.skip('没有可用的测试需求 ID');
      return;
    }

    const nodeData = {
      requirement_id: testRequirementId,
      name: `测试流程节点_${Date.now()}`,
      node_type_id: 1,
      parent_node_id: null,
      node_order: 1,
      assignee_type: 1,
      assignee_id: 1,
      duration_limit: 24,
      status: 1
    };

    const response = await apiClient.post('/requirements/process-nodes/create', nodeData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(nodeData.name);
  });

  test('查询需求流程节点 - 正常情况', async () => {
    if (!testRequirementId) {
      test.skip('没有可用的测试需求 ID');
      return;
    }

    const response = await apiClient.get('/requirements/process-nodes/query', {
      requirementId: testRequirementId
    }, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(Array.isArray(response.datum)).to.be.true;
  });

  test('删除需求 - 单个删除（不删除测试需求，避免影响后续测试）', async () => {
    // 创建一个临时需求用于删除测试
    const tempRequirementData = {
      name: `临时删除需求_${Date.now()}`,
      description: '临时需求描述',
      type_id: 1,
      priority: 2,
      status_id: 1,
      current_assignee_id: 1,
      reporter_id: 1,
      project_id: testProjectId,
      planned_version: 'v1.0'
    };

    const createResponse = await apiClient.post('/requirements/create', tempRequirementData, { expect: 'success' });
    const tempRequirementId = createResponse.datum.id;

    // 删除刚创建的临时需求
    await apiClient.post('/requirements/delete', { data: [tempRequirementId] }, { expect: 'success' });

    console.log('[需求模块] 临时需求已删除');
  });

  test('删除需求 - 批量删除', async () => {
    // 先创建一些测试需求
    const requirementsToCreate = [];
    const timestamp = Date.now();
    for (let i = 0; i < 2; i++) {
      requirementsToCreate.push({
        name: `批量删除需求_${i}_${timestamp}`,
        description: `批量删除需求描述_${i}`,
        type_id: 1,
        priority: 2,
        status_id: 1,
        current_assignee_id: 1,
        reporter_id: 1,
        project_id: testProjectId,
        planned_version: 'v1.0'
      });
    }

    // 并行创建需求
    const createResponses = await Promise.all(
      requirementsToCreate.map(requirementData =>
        apiClient.post('/requirements/create', requirementData, { expect: 'success' })
      )
    );

    const requirementIds = createResponses.map(response => response.datum.id);

    if (requirementIds.length > 0) {
      await apiClient.post('/requirements/delete', { data: requirementIds }, { expect: 'success' });
    }
  });

  test('查询需求列表 - 未登录', async () => {
    const tempClient = createApiClient();
    await tempClient.get('/requirements/query', null, { expect: 'error' });
  });
});
