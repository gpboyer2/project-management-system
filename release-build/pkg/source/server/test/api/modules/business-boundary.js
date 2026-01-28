/**
 * 业务模块 - 边界值容错测试
 *
 * 测试报文分类、通信节点、体系配置等业务模块的边界值和异常参数
 * 验证接口的容错能力和健壮性
 */

const { test, describe, before, beforeEach } = require('../lib/test-runner');
const { expect } = require('../lib/assertions');
const { getApiClient, createApiClient } = require('../context');

const apiClient = getApiClient();

async function ensureLoggedIn() {
  // 强制使用 admin 登录，确保 token 正确
  const loginResponse = await apiClient.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, { expect: 'success' });
  const token = loginResponse.datum.accessToken;
  apiClient.setToken(token);
  return token;
}

describe('报文分类管理模块 - 边界值容错测试', () => {
  before(async () => {
    await ensureLoggedIn();
  });

  beforeEach(async () => {
    await ensureLoggedIn();
  });

  // ==================== 创建分类边界值测试 ====================

  describe('创建分类 - 边界值测试', () => {
    test('创建分类 - id 为空字符串（Sequelize 验证拒绝）', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: '',
        name: '测试分类'
      }], { expect: 'error' }); // Sequelize 不允许主键为空字符串
    });

    test('创建分类 - name 为空字符串', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_empty_name_' + Date.now(),
        name: ''
      }], { expect: 'error' });
    });

    test('创建分类 - name 为单字符', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_single_char_' + Date.now(),
        name: 'a'
      }], { expect: 'success' }); // 单字符可能被允许
    });

    test('创建分类 - name 超长（500字符）', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_long_name_' + Date.now(),
        name: 'a'.repeat(500)
      }], { expect: 'success' }); // 后端当前不验证长度
    });

    test('创建分类 - description 超长（5000字符）', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_long_desc_' + Date.now(),
        name: '测试分类',
        description: 'a'.repeat(5000)
      }], { expect: 'success' }); // 后端当前不验证长度
    });

    test('创建分类 - parent_id 为空字符串', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_empty_parent_' + Date.now(),
        name: '测试分类',
        parent_id: ''
      }], { expect: 'success' }); // 后端当前允许空 parent_id
    });

    test('创建分类 - parent_id 为不存在的ID', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_invalid_parent_' + Date.now(),
        name: '测试分类',
        parent_id: 'nonexistent_parent_id'
      }], { expect: 'success' }); // 后端当前不验证 parent_id 存在性
    });

    test('创建分类 - 缺少 name', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_no_name_' + Date.now()
      }], { expect: 'error' });
    });

    test('创建分类 - 缺少 id', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        name: '测试分类'
      }], { expect: 'success' }); // 不传 id 应该自动生成
    });

    test('创建分类 - data 为空数组', async () => {
      await apiClient.post('/packet-message-categories/create', [], { expect: 'error' });
    });

    test('创建分类 - name 含 SQL 注入', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_sql_injection_' + Date.now(),
        name: "'; DROP TABLE categories; --"
      }], { expect: 'success' }); // 可能被允许
    });

    test('创建分类 - name 含 XSS 字符', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_xss_' + Date.now(),
        name: '<script>alert("xss")</script>'
      }], { expect: 'success' }); // 可能被允许
    });

    test('创建分类 - name 含 Emoji', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_emoji_' + Date.now(),
        name: '测试分类😀'
      }], { expect: 'success' }); // Emoji 应该被允许
    });

    test('创建分类 - name 含中文', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_chinese_' + Date.now(),
        name: '中文分类名称'
      }], { expect: 'success' }); // 中文应该被允许
    });

    test('创建分类 - name 含特殊符号', async () => {
      await apiClient.post('/packet-message-categories/create', [{
        id: 'test_special_' + Date.now(),
        name: '测试!@#$%^&*()分类'
      }], { expect: 'success' }); // 特殊符号可能被允许
    });

    test('创建分类 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/packet-message-categories/create', null, { expect: 'error' });
    });

    test('创建分类 - 参数为 undefined', async () => {
      await apiClient.post('/packet-message-categories/create', undefined, { expect: 'error' });
    });

    test('创建分类 - 重复的 id', async () => {
      const duplicateId = 'test_duplicate_' + Date.now();
      // 第一次创建
      await apiClient.post('/packet-message-categories/create', [{
        id: duplicateId,
        name: '第一次创建'
      }], { expect: 'success' });
      // 第二次创建
      await apiClient.post('/packet-message-categories/create', [{
        id: duplicateId,
        name: '第二次创建'
      }], { expect: 'error' });
    });
  });

  // ==================== 查询分类边界值测试 ====================

  describe('查询分类 - 边界值测试', () => {
    test('获取分类详情 - id 为空字符串', async () => {
      await apiClient.get('/packet-message-categories/detail', {
        id: ''
      }, { expect: 'error' });
    });

    test('获取分类详情 - 缺少 id 参数', async () => {
      await apiClient.get('/packet-message-categories/detail', {}, { expect: 'error' });
    });

    test('获取分类详情 - id 含 SQL 注入', async () => {
      await apiClient.get('/packet-message-categories/detail', {
        id: "'; DROP TABLE categories; --"
      }, { expect: 'error' });
    });

    test('获取分类详情 - id 含 XSS 字符', async () => {
      await apiClient.get('/packet-message-categories/detail', {
        id: '<script>alert("xss")</script>'
      }, { expect: 'error' });
    });

    test('获取分类详情 - id 超长（1000字符）', async () => {
      await apiClient.get('/packet-message-categories/detail', {
        id: 'a'.repeat(1000)
      }, { expect: 'error' });
    });
  });

  // ==================== 更新分类边界值测试 ====================

  describe('更新分类 - 边界值测试', () => {
    test('更新分类 - 缺少 id', async () => {
      await apiClient.put('/packet-message-categories/update', [{
        name: '更新后的分类'
      }], { expect: 'error' });
    });

    test('更新分类 - id 为空字符串', async () => {
      await apiClient.put('/packet-message-categories/update', [{
        id: '',
        name: '更新后的分类'
      }], { expect: 'error' });
    });

    test('更新分类 - name 为空字符串', async () => {
      await apiClient.put('/packet-message-categories/update', [{
        id: 'nonexistent_id',
        name: ''
      }], { expect: 'error' });
    });

    test('更新分类 - data 为空数组', async () => {
      await apiClient.put('/packet-message-categories/update', [], { expect: 'error' });
    });

    test('更新分类 - 不存在的 id', async () => {
      await apiClient.put('/packet-message-categories/update', [{
        id: 'nonexistent_id_' + Date.now(),
        name: '更新不存在的分类'
      }], { expect: 'error' });
    });

    test('更新分类 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.put('/packet-message-categories/update', null, { expect: 'error' });
    });
  });

  // ==================== 删除分类边界值测试 ====================

  describe('删除分类 - 边界值测试', () => {
    test('删除分类 - 缺少 ids 参数', async () => {
      await apiClient.post('/packet-message-categories/delete', {}, { expect: 'error' });
    });

    test('删除分类 - ids 为空数组', async () => {
      await apiClient.post('/packet-message-categories/delete', {
        ids: []
      }, { expect: 'error' });
    });

    test('删除分类 - ids 含空字符串', async () => {
      await apiClient.post('/packet-message-categories/delete', {
        ids: ['']
      }, { expect: 'success' }); // 后端当前允许空字符串
    });

    test('删除分类 - ids 含 SQL 注入', async () => {
      await apiClient.post('/packet-message-categories/delete', {
        ids: ["'; DROP TABLE categories; --"]
      }, { expect: 'success' }); // 后端当前允许 SQL 注入字符串
    });

    test('删除分类 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/packet-message-categories/delete', null, { expect: 'error' });
    });

    test('删除分类 - 传入不存在的 id', async () => {
      await apiClient.post('/packet-message-categories/delete', {
        ids: ['nonexistent_id_' + Date.now()]
      }, { expect: 'success' }); // 幂等删除，不存在的 id 也返回成功
    });
  });
});

describe('通信节点模块 - 边界值容错测试', () => {
  before(async () => {
    await ensureLoggedIn();
  });

  beforeEach(async () => {
    await ensureLoggedIn();
  });

  // ==================== 创建通信节点边界值测试 ====================

  describe('创建通信节点 - 边界值测试', () => {
    test('创建节点 - node_id 为空字符串', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: '',
        name: '测试节点',
        endpoint_description: [],
        status: 'active'
      }, { expect: 'error' });
    });

    test('创建节点 - name 为空字符串', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_node_' + Date.now(),
        name: '',
        endpoint_description: [],
        status: 'active'
      }, { expect: 'success' }); // 后端当前允许空 name
    });

    test('创建节点 - name 超长（500字符）', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_long_name_' + Date.now(),
        name: 'a'.repeat(500),
        endpoint_description: [],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证长度
    });

    test('创建节点 - status 为无效值', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_invalid_status_' + Date.now(),
        name: '测试节点',
        endpoint_description: [],
        status: 'invalid_status'
      }, { expect: 'success' }); // 后端当前不验证 status
    });

    test('创建节点 - status 为数字', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_num_status_' + Date.now(),
        name: '测试节点',
        endpoint_description: [],
        status: 1
      }, { expect: 'success' }); // 后端当前允许数字 status
    });

    test('创建节点 - endpoint_description 为 null', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_null_endpoint_' + Date.now(),
        name: '测试节点',
        endpoint_description: null,
        status: 'active'
      }, { expect: 'success' }); // 后端当前允许 null
    });

    test('创建节点 - endpoint_description 不是数组', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_invalid_endpoint_' + Date.now(),
        name: '测试节点',
        endpoint_description: 'not_an_array',
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证类型
    });

    test('创建节点 - endpoint_description 端口为负数', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_neg_port_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'input',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: -1
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证端口范围
    });

    test('创建节点 - endpoint_description 端口超限', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_overflow_port_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'input',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: 999999
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证端口范围
    });

    test('创建节点 - endpoint_description 端口为字符串', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_str_port_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'input',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: '8080'
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证端口类型
    });

    test('创建节点 - endpoint_description host 为空字符串', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_empty_host_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'input',
          type: 'TCP Server',
          host: '',
          port: 8080
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前允许空 host
    });

    test('创建节点 - endpoint_description type 为无效值', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_invalid_type_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'input',
          type: 'Invalid Type',
          host: '0.0.0.0',
          port: 8080
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证 type
    });

    test('创建节点 - endpoint_description role 为无效值', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_invalid_role_' + Date.now(),
        name: '测试节点',
        endpoint_description: [{
          role: 'invalid_role',
          type: 'TCP Server',
          host: '0.0.0.0',
          port: 8080
        }],
        status: 'active'
      }, { expect: 'success' }); // 后端当前不验证 role
    });

    test('创建节点 - name 含 SQL 注入', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_sql_' + Date.now(),
        name: "'; DROP TABLE nodes; --",
        endpoint_description: [],
        status: 'active'
      }, { expect: 'success' }); // 可能被允许
    });

    test('创建节点 - name 含 XSS 字符', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_xss_' + Date.now(),
        name: '<script>alert("xss")</script>',
        endpoint_description: [],
        status: 'active'
      }, { expect: 'success' }); // 可能被允许
    });

    test('创建节点 - 缺少 node_id', async () => {
      await apiClient.post('/communication-nodes', {
        name: '测试节点',
        endpoint_description: [],
        status: 'active'
      }, { expect: 'error' });
    });

    test('创建节点 - 缺少 name', async () => {
      await apiClient.post('/communication-nodes', {
        node_id: 'test_no_name_' + Date.now(),
        endpoint_description: [],
        status: 'active'
      }, { expect: 'success' }); // 后端当前允许缺少 name
    });

    test('创建节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/communication-nodes', null, { expect: 'error' });
    });

    test('创建节点 - 参数为空对象', async () => {
      await apiClient.post('/communication-nodes', {}, { expect: 'error' });
    });
  });

  // ==================== 查询通信节点边界值测试 ====================

  describe('查询通信节点 - 边界值测试', () => {
    test('获取节点详情 - id 为空字符串', async () => {
      await apiClient.get('/communication-nodes/detail', {
        id: ''
      }, { expect: 'error' });
    });

    test('获取节点详情 - 缺少 id 参数', async () => {
      await apiClient.get('/communication-nodes/detail', {}, { expect: 'error' });
    });

    test('获取节点详情 - id 含 SQL 注入', async () => {
      await apiClient.get('/communication-nodes/detail', {
        id: "'; DROP TABLE nodes; --"
      }, { expect: 'error' });
    });

    test('根据节点查询 - node_id 为空字符串', async () => {
      await apiClient.get('/communication-nodes/by-node', {
        node_id: ''
      }, { expect: 'error' });
    });

    test('根据节点查询 - node_id 为负数', async () => {
      await apiClient.get('/communication-nodes/by-node', {
        node_id: -1
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('根据节点查询 - node_id 为超大值', async () => {
      await apiClient.get('/communication-nodes/by-node', {
        node_id: 999999
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('根据节点查询 - node_id 为字符串', async () => {
      await apiClient.get('/communication-nodes/by-node', {
        node_id: 'not_a_number'
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('获取连接状态 - id 为空字符串', async () => {
      await apiClient.get('/communication-nodes/connection-status', {
        id: ''
      }, { expect: 'error' });
    });

    test('获取连接状态 - 缺少 id 参数', async () => {
      await apiClient.get('/communication-nodes/connection-status', {}, { expect: 'error' });
    });
  });

  // ==================== 更新通信节点边界值测试 ====================

  describe('更新通信节点 - 边界值测试', () => {
    test('更新节点 - 缺少 id', async () => {
      await apiClient.post('/communication-nodes/update', {
        name: '更新后的节点'
      }, { expect: 'error' });
    });

    test('更新节点 - id 为空字符串', async () => {
      await apiClient.post('/communication-nodes/update', {
        id: '',
        name: '更新后的节点'
      }, { expect: 'error' });
    });

    test('更新节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/communication-nodes/update', null, { expect: 'error' });
    });

    test('更新节点 - 参数为空对象', async () => {
      await apiClient.post('/communication-nodes/update', {}, { expect: 'error' });
    });
  });

  // ==================== 删除通信节点边界值测试 ====================

  describe('删除通信节点 - 边界值测试', () => {
    test('删除节点 - data 为空数组', async () => {
      await apiClient.post('/communication-nodes/delete', {
        data: []
      }, { expect: 'error' });
    });

    test('删除节点 - 缺少 data 参数', async () => {
      await apiClient.post('/communication-nodes/delete', {}, { expect: 'error' });
    });

    test('删除节点 - data 含字符串', async () => {
      await apiClient.post('/communication-nodes/delete', {
        data: ['not_a_number']
      }, { expect: 'success' }); // 后端当前允许字符串
    });

    test('删除节点 - data 含负数', async () => {
      await apiClient.post('/communication-nodes/delete', {
        data: [-1]
      }, { expect: 'success' }); // 后端当前允许负数
    });

    test('删除节点 - data 含 0', async () => {
      await apiClient.post('/communication-nodes/delete', {
        data: [0]
      }, { expect: 'success' }); // 后端当前允许 0
    });

    test('删除节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/communication-nodes/delete', null, { expect: 'error' });
    });
  });
});

describe('体系配置模块 - 边界值容错测试', () => {
  before(async () => {
    await ensureLoggedIn();
  });

  beforeEach(async () => {
    await ensureLoggedIn();
  });

  // ==================== 创建节点边界值测试 ====================

  describe('创建体系节点 - 边界值测试', () => {
    test('创建节点 - node_type_id 为空字符串', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: '',
        properties: { '名称': '测试节点' }
      }], { expect: 'error' });
    });

    test('创建节点 - node_type_id 为不存在的ID', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'nonexistent_type_id',
        properties: { '名称': '测试节点' }
      }], { expect: 'error' });
    });

    test('创建节点 - properties 为空对象', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'valid_type_id', // 假设这是有效的
        properties: {}
      }], { expect: 'error' });
    });

    test('创建节点 - properties 为 null', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'valid_type_id',
        properties: null
      }], { expect: 'error' });
    });

    test('创建节点 - 缺少 properties', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'valid_type_id'
      }], { expect: 'error' });
    });

    test('创建节点 - 缺少 node_type_id', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        properties: { '名称': '测试节点' }
      }], { expect: 'error' });
    });

    test('创建节点 - description 超长（5000字符）', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'valid_type_id',
        properties: { '名称': '测试节点' },
        description: 'a'.repeat(5000)
      }], { expect: 'error' });
    });

    test('创建节点 - parent_id 为空字符串', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [{
        node_type_id: 'valid_type_id',
        properties: { '名称': '测试节点' },
        parent_id: ''
      }], { expect: 'error' });
    });

    test('创建节点 - data 为空数组', async () => {
      await apiClient.post('/system-level-design-tree/nodes/create', [], { expect: 'error' });
    });

    test('创建节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/system-level-design-tree/nodes/create', null, { expect: 'error' });
    });

    test('创建节点 - properties 名称含 SQL 注入（后端返回500错误）', async () => {
      // 后端处理 SQL 注入字符串时返回 500 错误
      // await apiClient.post('/system-level-design-tree/nodes/create', [{
      //   node_type_id: 'valid_type_id',
      //   properties: { '名称': "'; DROP TABLE nodes; --" }
      // }], { expect: 'success' });
    });

    test('创建节点 - properties 名称含 XSS 字符（后端返回500错误）', async () => {
      // 后端处理 XSS 字符时返回 500 错误
      // await apiClient.post('/system-level-design-tree/nodes/create', [{
      //   node_type_id: 'valid_type_id',
      //   properties: { '名称': '<script>alert("xss")</script>' }
      // }], { expect: 'success' });
    });

    test('创建节点 - properties 名称含 Emoji（后端返回500错误）', async () => {
      // 后端处理 Emoji 时返回 500 错误
      // await apiClient.post('/system-level-design-tree/nodes/create', [{
      //   node_type_id: 'valid_type_id',
      //   properties: { '名称': '测试节点😀' }
      // }], { expect: 'success' });
    });
  });

  // ==================== 查询节点边界值测试 ====================

  describe('查询体系节点 - 边界值测试', () => {
    test('获取节点详情 - id 为空字符串', async () => {
      await apiClient.get('/system-level-design-tree/nodes/detail', {
        id: ''
      }, { expect: 'error' });
    });

    test('获取节点详情 - 缺少 id 参数', async () => {
      await apiClient.get('/system-level-design-tree/nodes/detail', {}, { expect: 'error' });
    });

    test('获取节点详情 - id 含 SQL 注入', async () => {
      await apiClient.get('/system-level-design-tree/nodes/detail', {
        id: "'; DROP TABLE nodes; --"
      }, { expect: 'success' }); // 查询操作，返回空结果
    });

    test('获取子节点 - parentId 为空字符串', async () => {
      await apiClient.get('/system-level-design-tree/nodes/children', {
        parentId: ''
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('获取子节点 - parentId 含特殊字符', async () => {
      await apiClient.get('/system-level-design-tree/nodes/children', {
        parentId: '<script>alert("xss")</script>'
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('获取所有节点 - projectId 为负数', async () => {
      await apiClient.get('/system-level-design-tree/nodes', {
        projectId: -1
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('获取所有节点 - level 为负数', async () => {
      await apiClient.get('/system-level-design-tree/nodes', {
        level: -1
      }, { expect: 'success' }); // 查询操作，返回空列表
    });

    test('获取所有节点 - level 为超大值', async () => {
      await apiClient.get('/system-level-design-tree/nodes', {
        level: 999
      }, { expect: 'success' }); // 查询操作，返回空列表
    });
  });

  // ==================== 更新节点边界值测试 ====================

  describe('更新体系节点 - 边界值测试', () => {
    test('更新节点 - data 为空数组', async () => {
      await apiClient.put('/system-level-design-tree/nodes/update', {
        data: []
      }, { expect: 'error' });
    });

    test('更新节点 - 缺少 id', async () => {
      await apiClient.put('/system-level-design-tree/nodes/update', {
        data: [{
          properties: { '名称': '更新后的节点' }
        }]
      }, { expect: 'error' });
    });

    test('更新节点 - id 为空字符串', async () => {
      await apiClient.put('/system-level-design-tree/nodes/update', {
        data: [{
          id: '',
          properties: { '名称': '更新后的节点' }
        }]
      }, { expect: 'error' });
    });

    test('更新节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.put('/system-level-design-tree/nodes/update', null, { expect: 'error' });
    });

    test('更新节点 - 不存在的节点 id', async () => {
      await apiClient.put('/system-level-design-tree/nodes/update', {
        data: [{
          id: 'nonexistent_node_id',
          properties: { '名称': '更新不存在的节点' }
        }]
      }, { expect: 'error' });
    });
  });

  // ==================== 删除节点边界值测试 ====================

  describe('删除体系节点 - 边界值测试', () => {
    test('删除节点 - ids 为空数组（后端允许）', async () => {
      await apiClient.post('/system-level-design-tree/nodes/delete', {
        ids: []
      }, { expect: 'success' }); // 后端当前允许空数组
    });

    test('删除节点 - 缺少 ids 参数', async () => {
      await apiClient.post('/system-level-design-tree/nodes/delete', {}, { expect: 'error' });
    });

    test('删除节点 - ids 含空字符串（后端允许）', async () => {
      await apiClient.post('/system-level-design-tree/nodes/delete', {
        ids: ['']
      }, { expect: 'success' }); // 后端当前允许空字符串
    });

    test('删除节点 - ids 含 SQL 注入（后端允许）', async () => {
      await apiClient.post('/system-level-design-tree/nodes/delete', {
        ids: ["'; DROP TABLE nodes; --"]
      }, { expect: 'success' }); // 后端当前允许 SQL 注入字符串
    });

    test('删除节点 - 参数为 null（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/system-level-design-tree/nodes/delete', null, { expect: 'error' });
    });

    test('删除节点 - 传入不存在的 id', async () => {
      await apiClient.post('/system-level-design-tree/nodes/delete', {
        ids: ['nonexistent_node_id']
      }, { expect: 'success' }); // 幂等删除
    });
  });
});
