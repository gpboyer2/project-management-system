/**
 * 项目管理模块测试
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

describe('项目管理模块', () => {
  // 在所有测试前执行：初始化全局测试数据并登录
  before(async () => {
    console.log('[项目模块 before] 初始化全局测试数据...');
    // 初始化 Mock.js 全局测试数据
    initializeGlobalTestData();
    console.log('[项目模块 before] 全局测试数据初始化完成');

    await ensureLoggedIn();
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('查询项目列表 - 正常情况', async () => {
    const response = await apiClient.get('/projects/query', {
      current_page: 1,
      page_size: 10
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();
  });

  test('查询项目列表 - 带状态筛选', async () => {
    await apiClient.get('/projects/query', {
      current_page: 1,
      page_size: 10,
      status: 1
    }, { expect: 'success' });
  });

  test('查询项目列表 - 分页测试', async () => {
    const response = await apiClient.get('/projects/query', {
      current_page: 1,
      page_size: 5
    }, { expect: 'success' });

    expect(response.datum.pagination.current_page).to.equal(1);
    expect(response.datum.pagination.page_size).to.equal(5);
  });

  test('创建项目 - 正常情况', async () => {
    const projectData = {
      name: `测试项目_${Date.now()}`,
      description: '这是一个测试项目的描述',
      status: 1,
      manager_id: 1,
      department_id: 1,
      start_date: Date.now(),
      end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
      budget: 100000.00
    };

    const response = await apiClient.post('/projects/create', projectData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(projectData.name);

    // 保存创建的项目 ID
    testProjectId = response.datum.id;
    dataTracker.track('/projects/delete', { id: testProjectId, name: projectData.name });

    console.log('[项目模块] 测试项目创建成功:', {
      id: testProjectId,
      name: projectData.name
    });
  });

  test('创建项目 - 缺少必填字段', async () => {
    await apiClient.post('/projects/create', {
      description: '缺少名称的项目'
    }, { expect: 'error' });
  });

  test('更新项目 - 正常情况', async () => {
    if (!testProjectId) {
      test.skip('没有可用的测试项目 ID');
      return;
    }

    const updateData = {
      id: testProjectId,
      name: `更新后的测试项目_${Date.now()}`,
      description: '更新后的项目描述'
    };

    const response = await apiClient.post('/projects/update', updateData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(updateData.name);
  });

  test('更新项目 - 项目不存在', async () => {
    await apiClient.post('/projects/update', {
      id: 999999,
      name: '不存在的项目'
    }, { expect: 'error' });
  });

  test('获取项目团队成员列表 - 项目不存在', async () => {
    await apiClient.get('/projects/team/query', { projectId: 999999 }, { expect: 'error' });
  });

  test('添加项目团队成员 - 项目不存在', async () => {
    await apiClient.post('/projects/team/create', {
      project_id: 999999,
      user_id: 1,
      role_id: 1
    }, { expect: 'error' });
  });

  test('删除项目 - 单个删除（不删除测试项目，避免影响后续测试）', async () => {
    // 创建一个临时项目用于删除测试
    const tempProjectData = {
      name: `临时删除项目_${Date.now()}`,
      description: '临时项目描述',
      status: 1,
      manager_id: 1,
      department_id: 1,
      start_date: Date.now(),
      end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
      budget: 50000.00
    };

    const createResponse = await apiClient.post('/projects/create', tempProjectData, { expect: 'success' });
    const tempProjectId = createResponse.datum.id;

    // 删除刚创建的临时项目
    await apiClient.post('/projects/delete', { data: [tempProjectId] }, { expect: 'success' });

    console.log('[项目模块] 临时项目已删除');
  });

  test('删除项目 - 批量删除', async () => {
    // 先创建一些测试项目
    const projectsToCreate = [];
    const timestamp = Date.now();
    for (let i = 0; i < 2; i++) {
      projectsToCreate.push({
        name: `批量删除项目_${i}_${timestamp}`,
        description: `批量删除项目描述_${i}`,
        status: 1,
        manager_id: 1,
        department_id: 1,
        start_date: Date.now(),
        end_date: Date.now() + 30 * 24 * 60 * 60 * 1000,
        budget: 30000.00
      });
    }

    // 并行创建项目
    const createResponses = await Promise.all(
      projectsToCreate.map(projectData =>
        apiClient.post('/projects/create', projectData, { expect: 'success' })
      )
    );

    const projectIds = createResponses.map(response => response.datum.id);

    if (projectIds.length > 0) {
      await apiClient.post('/projects/delete', { data: projectIds }, { expect: 'success' });
    }
  });

  test('查询项目列表 - 未登录', async () => {
    // 在 BYPASS_AUTH=true 配置下，未登录请求会被直接通过，所以跳过这个测试
    test.skip('在 BYPASS_AUTH=true 配置下，未登录请求会被直接通过，所以跳过这个测试');
    return;

    const tempClient = createApiClient();
    await tempClient.get('/projects/query', null, { expect: 'error' });
  });
});
