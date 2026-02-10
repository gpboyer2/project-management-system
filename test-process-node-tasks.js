const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:9200';
const TEST_NODE_ID = 1;
const TEST_NODE_TYPE = 1;

// 登录函数
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (response.data.status === 'success') {
      console.log('✅ 登录成功');
      return response.data.datum.accessToken;
    } else {
      console.error('❌ 登录失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return null;
  }
}

// 测试查询流程节点任务
async function testQueryProcessNodeTasks(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/process-node-tasks/query`, {
      params: {
        node_id: TEST_NODE_ID,
        node_type: TEST_NODE_TYPE,
        is_placeholder: false
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.status === 'success') {
      console.log('✅ 查询流程节点任务成功');
      console.log('📦 响应数据:', JSON.stringify(response.data, null, 2));

      // 验证返回格式
      if (response.data.datum && Array.isArray(response.data.datum.list)) {
        console.log(`✅ 节点数量: ${response.data.datum.list.length}`);

        // 验证节点是否包含 tasks 数组
        response.data.datum.list.forEach(node => {
          if (node.node_id && Array.isArray(node.tasks)) {
            console.log(`✅ 节点 ${node.node_id} 包含 ${node.tasks.length} 个任务`);
          }
        });
      }

      return true;
    } else {
      console.error('❌ 查询失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 查询请求失败:', error.message);
    return false;
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始测试流程节点任务查询...');
  console.log('');

  // 登录
  const token = await login();
  if (!token) {
    console.error('❌ 无法登录，测试终止');
    return;
  }

  console.log('');

  // 测试查询流程节点任务
  console.log('🔍 测试查询流程节点任务...');
  const queryResult = await testQueryProcessNodeTasks(token);

  console.log('');
  console.log('📊 测试结果:');
  if (queryResult) {
    console.log('✅ 所有测试通过！');
  } else {
    console.error('❌ 测试失败！');
  }
}

// 运行测试
main().catch(error => {
  console.error('❌ 测试过程中发生未处理的异常:', error);
});