/**
 * 通信节点模块测试
 */

const { test, describe } = require('../../lib/test-runner');
const { expect } = require('../../lib/assertions');
const { getApiClient, getDataTracker, createApiClient, setAdminToken } = require('../../context');

const apiClient = getApiClient();
const dataTracker = getDataTracker();

// 辅助函数：确保已登录
async function ensureLoggedIn() {
  try {
    await apiClient.get('/communication-nodes', {}, { expect: 'error' });
  } catch (error) {
    const loginResponse = await apiClient.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, { expect: 'success' });
    const token = loginResponse.datum.accessToken;
    apiClient.setToken(token);
    setAdminToken(token);
    return token;
  }
}

describe('通信节点模块', () => {
  let testNodeId;

  test('模块初始化 - 管理员登录', async () => {
    const response = await apiClient.post('/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, { expect: 'success' });

    expect(response.datum.accessToken).to.be.truthy();

    apiClient.setToken(response.datum.accessToken);
  });

  test('获取所有通信节点 - 正常情况', async () => {
    await ensureLoggedIn();

    const response = await apiClient.get('/communication-nodes', {}, { expect: 'success' });

    expect(Array.isArray(response.datum)).to.equal(true);
  });

  test('根据层级节点ID获取通信节点列表 - 正常情况', async () => {
    await ensureLoggedIn();

    const nodeId = 1;
    const response = await apiClient.get('/communication-nodes/by-node', { node_id: nodeId }, { expect: 'success' });

    expect(Array.isArray(response.datum)).to.equal(true);
  });

  test('根据层级节点ID获取通信节点列表 - 不存在的节点', async () => {
    await ensureLoggedIn();

    const nodeId = 999999;
    const response = await apiClient.get('/communication-nodes/by-node', { node_id: nodeId }, { expect: 'success' });

    expect(Array.isArray(response.datum)).to.equal(true);
  });

  test('创建通信节点 - 正常情况', async () => {
    await ensureLoggedIn();

    const timestamp = Date.now();
    const nodeData = {
      node_id: `test-node-${timestamp}`,
      name: `测试通信节点-${timestamp}`,
      endpoint_description: [
        {
          role: 'input',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: 8080
        }
      ],
      status: 'active'
    };

    const response = await apiClient.post('/communication-nodes', nodeData, { expect: 'success' });

    if (response.datum && response.datum.id) {
      testNodeId = response.datum.id;
      dataTracker.track('/communication-nodes/delete', { id: testNodeId, name: nodeData.name });
    }
  });

  test('更新通信节点 - 正常情况', async () => {
    await ensureLoggedIn();

    if (!testNodeId) {
      return;
    }

    const updateData = {
      id: testNodeId,
      name: '更新后的通信节点',
      endpoint_description: [
        {
          role: 'input',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: 9090
        },
        {
          role: 'output',
          type: 'TCP Client',
          host: '192.168.1.1',
          port: 8080,
          remote_host: '192.168.1.2',
          remote_port: 8081
        }
      ]
    };

    await apiClient.post('/communication-nodes/update', updateData, { expect: 'success' });
  });

  test('更新通信节点的接口连接信息 - 正常情况', async () => {
    await ensureLoggedIn();

    if (!testNodeId) {
      return;
    }

    const endpointData = {
      id: testNodeId,
      endpoint_description: [
        {
          role: 'input',
          type: 'UDP',
          host: '0.0.0.0',
          port: 8888
        }
      ]
    };

    await apiClient.post('/communication-nodes/update-endpoints', endpointData, { expect: 'success' });
  });

  test('获取通信节点详情 - 正常情况', async () => {
    await ensureLoggedIn();

    if (!testNodeId) {
      return;
    }

    await apiClient.get('/communication-nodes/detail', { id: testNodeId }, { expect: 'success' });
  });

  test('获取通信节点连接状态 - 正常情况', async () => {
    await ensureLoggedIn();

    if (!testNodeId) {
      return;
    }

    await apiClient.get('/communication-nodes/connection-status', { id: testNodeId }, { expect: 'success' });
  });

  test('删除通信节点 - 正常情况', async () => {
    await ensureLoggedIn();

    if (!testNodeId) {
      return;
    }

    await apiClient.post('/communication-nodes/delete', {
      data: [testNodeId]
    }, { expect: 'success' });

    testNodeId = null;
  });

  test('删除通信节点 - 多选删除', async () => {
    await ensureLoggedIn();

    const timestamp = Date.now();

    const createData1 = {
      node_id: `test-multi-1-${timestamp}`,
      name: `多选测试节点1-${timestamp}`,
      endpoint_description: [],
      status: 'active'
    };

    const createData2 = {
      node_id: `test-multi-2-${timestamp}`,
      name: `多选测试节点2-${timestamp}`,
      endpoint_description: [],
      status: 'active'
    };

    const response1 = await apiClient.post('/communication-nodes', createData1, { expect: 'success' });
    const response2 = await apiClient.post('/communication-nodes', createData2, { expect: 'success' });

    const nodeIds = [];
    if (response1.datum && response1.datum.id) {
      nodeIds.push(response1.datum.id);
    }
    if (response2.datum && response2.datum.id) {
      nodeIds.push(response2.datum.id);
    }

    if (nodeIds.length > 0) {
      await apiClient.post('/communication-nodes/delete', {
        data: nodeIds
      }, { expect: 'success' });
    }
  });

  test('获取通信节点列表 - 未登录', async () => {
    const tempClient = createApiClient();

    await tempClient.get('/communication-nodes', {}, { expect: 'error' });
  });
});
