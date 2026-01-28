/**
 * 数据库管理模块测试
 */

const { test, describe, before, beforeEach } = require('../../lib/test-runner');
const { expect } = require('../../lib/assertions');
const { getApiClient } = require('../../context');

const apiClient = getApiClient();

// 辅助函数: 确保已登录
async function ensureLoggedIn() {
  const currentToken = apiClient.getToken();
  if (currentToken) {
    try {
      await apiClient.get('/auth/me', null, { expect: 'success' });
      return currentToken;
    } catch (error) {
      // token 无效, 继续执行登录
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

describe('数据库管理模块', () => {
  let testTableName;

  // 在所有测试前执行一次登录
  before(async () => {
    await ensureLoggedIn();
  });

  // 每个测试前确保 token 有效
  beforeEach(async () => {
    await ensureLoggedIn();
  });

  test('获取数据库表列表 - 正常情况', async () => {
    const response = await apiClient.get('/database/tables', {}, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(Array.isArray(response.datum.list)).to.equal(true);

    // 保存第一个表名用于后续测试
    if (response.datum.list && response.datum.list.length > 0) {
      testTableName = response.datum.list[0];
    }
  });

  test('获取表结构 - 正常情况', async () => {
    if (!testTableName) {
      return; // 跳过如果没有可用的表
    }

    await apiClient.get('/database/schema', {
      tableName: testTableName
    }, { expect: 'success' });
  });

  test('查询表数据 - 正常情况', async () => {
    if (!testTableName) {
      return; // 跳过如果没有可用的表
    }

    const response = await apiClient.post('/database/query', {
      tableName: testTableName,
      page_num: 1,
      page_size: 10
    }, { expect: 'success' });

    expect(response.datum.list).to.be.truthy();
    expect(Array.isArray(response.datum.list)).to.equal(true);
  });

  test('执行SQL查询 - 正常情况', async () => {
    await apiClient.post('/database/execute', {
      sql: `SELECT name FROM sqlite_master WHERE type='table' LIMIT 5`
    }, { expect: 'success' });
  });

  test('查询表数据 - 带搜索条件', async () => {
    if (!testTableName) {
      return; // 跳过如果没有可用的表
    }

    await apiClient.post('/database/query', {
      tableName: testTableName,
      page_num: 1,
      page_size: 10,
      search: '',
      sort_field: 'id',
      sort_order: 'ASC'
    }, { expect: 'success' });
  });

  test('获取表结构 - 不存在的表', async () => {
    await apiClient.get('/database/schema', {
      tableName: 'non_existent_table_' + Date.now()
    }, { expect: 'error' });
  });
});
