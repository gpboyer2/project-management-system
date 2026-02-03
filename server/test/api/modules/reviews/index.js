/**
 * 评审管理模块测试
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
let testReviewId = null;
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
    description: '用于评审测试的临时项目',
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

describe('评审管理模块', () => {
  // 在所有测试前执行：初始化全局测试数据并登录
  before(async () => {
    console.log('[评审模块 before] 初始化全局测试数据...');
    // 初始化 Mock.js 全局测试数据
    initializeGlobalTestData();
    console.log('[评审模块 before] 全局测试数据初始化完成');

    await ensureLoggedIn();
    testProjectId = await createTempProject();
    console.log('[评审模块 before] 临时项目创建成功:', testProjectId);
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('查询评审列表 - 正常情况', async () => {
    const response = await apiClient.get('/reviews/query', {
      current_page: 1,
      page_size: 10
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(response.datum.pagination).to.be.truthy();
  });

  test('查询评审列表 - 按项目筛选', async () => {
    await apiClient.get('/reviews/query', {
      current_page: 1,
      page_size: 10,
      projectId: testProjectId
    }, { expect: 'success' });
  });

  test('查询评审列表 - 按状态筛选', async () => {
    await apiClient.get('/reviews/query', {
      current_page: 1,
      page_size: 10,
      status: 1
    }, { expect: 'success' });
  });

  test('创建评审 - 正常情况', async () => {
    const reviewData = {
      name: `测试评审_${Date.now()}`,
      description: '这是一个测试评审的描述',
      review_type: 1,
      status: 1,
      reporter_id: 1,
      reviewer_id: 1,
      project_id: testProjectId,
      start_time: Date.now(),
      end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const response = await apiClient.post('/reviews/create', reviewData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(reviewData.name);

    // 保存创建的评审 ID
    testReviewId = response.datum.id;
    dataTracker.track('/reviews/delete', { id: testReviewId, name: reviewData.name });

    console.log('[评审模块] 测试评审创建成功:', {
      id: testReviewId,
      name: reviewData.name
    });
  });

  test('创建评审 - 缺少必填字段', async () => {
    await apiClient.post('/reviews/create', {
      description: '缺少名称的评审'
    }, { expect: 'error' });
  });

  test('创建评审 - 项目不存在', async () => {
    const reviewData = {
      name: `无效项目评审_${Date.now()}`,
      description: '项目不存在的评审',
      review_type: 1,
      status: 1,
      reporter_id: 1,
      reviewer_id: 1,
      project_id: 999999,
      start_time: Date.now(),
      end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    await apiClient.post('/reviews/create', reviewData, { expect: 'error' });
  });

  test('获取评审详情 - 正常情况', async () => {
    if (!testReviewId) {
      test.skip('没有可用的测试评审 ID');
      return;
    }

    const response = await apiClient.get('/reviews/detail', { id: testReviewId }, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.id).to.equal(testReviewId);
  });

  test('获取评审详情 - 评审不存在', async () => {
    await apiClient.get('/reviews/detail', { id: 999999 }, { expect: 'error' });
  });

  test('更新评审 - 正常情况', async () => {
    if (!testReviewId) {
      test.skip('没有可用的测试评审 ID');
      return;
    }

    const updateData = {
      id: testReviewId,
      name: `更新后的测试评审_${Date.now()}`,
      description: '更新后的评审描述',
      status: 2
    };

    const response = await apiClient.post('/reviews/update', updateData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(updateData.name);
    expect(response.datum.status).to.equal(updateData.status);
  });

  test('更新评审 - 评审不存在', async () => {
    await apiClient.post('/reviews/update', {
      id: 999999,
      name: '不存在的评审'
    }, { expect: 'error' });
  });

  test('创建评审流程节点 - 正常情况', async () => {
    if (!testReviewId) {
      test.skip('没有可用的测试评审 ID');
      return;
    }

    const nodeData = {
      review_id: testReviewId,
      name: `测试流程节点_${Date.now()}`,
      node_type_id: 1,
      parent_node_id: null,
      node_order: 1,
      assignee_type: 1,
      assignee_id: 1,
      duration_limit: 24,
      status: 1
    };

    const response = await apiClient.post('/reviews/process-nodes/create', nodeData, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(response.datum.name).to.equal(nodeData.name);
  });

  test('查询评审流程节点 - 正常情况', async () => {
    if (!testReviewId) {
      test.skip('没有可用的测试评审 ID');
      return;
    }

    const response = await apiClient.get('/reviews/process-nodes/query', {
      reviewId: testReviewId
    }, { expect: 'success' });

    expect(response.datum).to.be.truthy();
    expect(Array.isArray(response.datum)).to.be.true;
  });

  test('删除评审 - 单个删除（不删除测试评审，避免影响后续测试）', async () => {
    // 创建一个临时评审用于删除测试
    const tempReviewData = {
      name: `临时删除评审_${Date.now()}`,
      description: '临时评审描述',
      review_type: 1,
      status: 1,
      reporter_id: 1,
      reviewer_id: 1,
      project_id: testProjectId,
      start_time: Date.now(),
      end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const createResponse = await apiClient.post('/reviews/create', tempReviewData, { expect: 'success' });
    const tempReviewId = createResponse.datum.id;

    // 删除刚创建的临时评审
    await apiClient.post('/reviews/delete', { data: [tempReviewId] }, { expect: 'success' });

    console.log('[评审模块] 临时评审已删除');
  });

  test('删除评审 - 批量删除', async () => {
    // 先创建一些测试评审
    const reviewsToCreate = [];
    const timestamp = Date.now();
    for (let i = 0; i < 2; i++) {
      reviewsToCreate.push({
        name: `批量删除评审_${i}_${timestamp}`,
        description: `批量删除评审描述_${i}`,
        review_type: 1,
        status: 1,
        reporter_id: 1,
        reviewer_id: 1,
        project_id: testProjectId,
        start_time: Date.now(),
        end_time: Date.now() + 7 * 24 * 60 * 60 * 1000
      });
    }

    // 并行创建评审
    const createResponses = await Promise.all(
      reviewsToCreate.map(reviewData =>
        apiClient.post('/reviews/create', reviewData, { expect: 'success' })
      )
    );

    const reviewIds = createResponses.map(response => response.datum.id);

    if (reviewIds.length > 0) {
      await apiClient.post('/reviews/delete', { data: reviewIds }, { expect: 'success' });
    }
  });

  test('查询评审列表 - 未登录', async () => {
    const tempClient = createApiClient();
    await tempClient.get('/reviews/query', null, { expect: 'error' });
  });
});
