const axios = require('axios');

const BASE_URL = 'http://localhost:9200';
const API_PREFIX = '/api';

async function runTest() {
  try {
    console.log('🚀 测试流程节点任务关联接口...');

    // 登录
    console.log('🔐 登录...');
    const loginResponse = await axios.post(`${BASE_URL}${API_PREFIX}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (loginResponse.data.status !== 'success') {
      throw new Error('登录失败');
    }

    const token = loginResponse.data.datum.accessToken;
    console.log('✅ 登录成功');

    // 查询流程节点任务（无参数）
    console.log('🔍 查询流程节点任务（无参数）...');
    const queryResponse = await axios.get(`${BASE_URL}${API_PREFIX}/process-node-tasks/query`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (queryResponse.data.status !== 'success') {
      throw new Error('查询失败');
    }

    console.log('✅ 查询成功');
    console.log('📦 返回数据类型:', typeof queryResponse.data.datum);
    console.log('📋 list 类型:', Array.isArray(queryResponse.data.datum.list));
    console.log('📊 节点数量:', queryResponse.data.datum.list.length);

    // 如果有节点，检查节点数据结构
    if (queryResponse.data.datum.list.length > 0) {
      const firstNode = queryResponse.data.datum.list[0];
      console.log('📄 第一个节点数据结构:');
      console.log('   node_id:', firstNode.node_id);
      console.log('   node_type:', firstNode.node_type);
      console.log('   tasks 类型:', Array.isArray(firstNode.tasks));
      console.log('   任务数量:', firstNode.tasks.length);

      if (firstNode.tasks.length > 0) {
        console.log('📝 第一个任务数据结构:');
        console.log('   ', firstNode.tasks[0]);
      }
    }

    console.log('✅ 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

runTest();