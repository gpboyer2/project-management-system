const axios = require('axios');

const BASE_URL = 'http://localhost:9200';
const API_PREFIX = '/api';

async function testProcessNodeTypeCreate() {
  try {
    console.log('🚀 测试 /process-node-types/create 接口...');

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

    // 创建流程节点类型（包含任务占位）
    console.log('🔍 创建流程节点类型（包含任务占位）...');
    const createResponse = await axios.post(`${BASE_URL}${API_PREFIX}/process-node-types/create`, {
      name: `测试节点类型_${Date.now()}`,
      type: 99,
      description: '用于测试任务占位功能的流程节点类型',
      sort_order: 10,
      config: {},
      tasks: [
        {
          name: '任务1',
          task_type: 1
        },
        {
          name: '任务2',
          task_type: 1
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (createResponse.data.status !== 'success') {
      throw new Error('创建流程节点类型失败');
    }

    const processNodeTypeId = createResponse.data.datum.id;
    console.log('✅ 创建成功');
    console.log('📦 流程节点类型ID:', processNodeTypeId);

    // 查询流程节点类型详情
    console.log('🔍 查询流程节点类型详情...');
    const queryResponse = await axios.get(`${BASE_URL}${API_PREFIX}/process-node-types/detail`, {
      params: {
        id: processNodeTypeId
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (queryResponse.data.status !== 'success') {
      throw new Error('查询流程节点类型详情失败');
    }

    console.log('✅ 查询成功');
    console.log('📦 流程节点类型详情:', queryResponse.data.datum);

    // 验证任务占位配置是否已保存
    if (!queryResponse.data.datum.config || !queryResponse.data.datum.config.tasks) {
      throw new Error('任务占位配置未保存');
    }

    console.log('✅ 任务占位配置已保存');
    console.log('📦 任务占位配置:', queryResponse.data.datum.config.tasks);

    // 删除流程节点类型
    console.log('🔍 删除流程节点类型...');
    await axios.post(`${BASE_URL}${API_PREFIX}/process-node-types/delete`, {
      data: [processNodeTypeId]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 删除成功');

    console.log('✅ /process-node-types/create 接口测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testProcessNodeTypeCreate();