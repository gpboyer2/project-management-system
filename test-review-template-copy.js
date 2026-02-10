const axios = require('axios');

const BASE_URL = 'http://localhost:9200';
const API_PREFIX = '/api';

async function testReviewTemplateCopy() {
  try {
    console.log('🚀 测试 /review-templates/copy 接口...');

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
    const createProcessNodeTypeResponse = await axios.post(`${BASE_URL}${API_PREFIX}/process-node-types/create`, {
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

    if (createProcessNodeTypeResponse.data.status !== 'success') {
      throw new Error('创建流程节点类型失败');
    }

    const processNodeTypeId = createProcessNodeTypeResponse.data.datum.id;
    console.log('✅ 创建成功');
    console.log('📦 流程节点类型ID:', processNodeTypeId);

    // 创建评审模板
    console.log('🔍 创建评审模板...');
    const createReviewTemplateResponse = await axios.post(`${BASE_URL}${API_PREFIX}/review-templates/create`, {
      name: `测试评审模板_${Date.now()}`,
      description: '用于测试任务占位功能的评审模板',
      template_type: 1,
      is_default: false,
      nodes: [
        {
          name: '测试节点1',
          node_type_id: processNodeTypeId,
          assignee_type: 1,
          assignee_id: 1,
          duration_limit: 3600,
          status: 1
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (createReviewTemplateResponse.data.status !== 'success') {
      throw new Error('创建评审模板失败');
    }

    const reviewTemplateId = createReviewTemplateResponse.data.datum.id;
    console.log('✅ 创建成功');
    console.log('📦 评审模板ID:', reviewTemplateId);

    // 深拷贝评审模板
    console.log('🔍 深拷贝评审模板...');
    const copyReviewTemplateResponse = await axios.post(`${BASE_URL}${API_PREFIX}/review-templates/copy`, {
      id: reviewTemplateId,
      new_name: `测试评审模板_副本_${Date.now()}`,
      new_description: '用于测试任务占位功能的评审模板副本',
      is_default: false
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (copyReviewTemplateResponse.data.status !== 'success') {
      throw new Error('深拷贝评审模板失败');
    }

    const copiedReviewTemplateId = copyReviewTemplateResponse.data.datum.id;
    console.log('✅ 深拷贝成功');
    console.log('📦 拷贝后的评审模板ID:', copiedReviewTemplateId);

    // 查询拷贝后的评审模板详情
    console.log('🔍 查询拷贝后的评审模板详情...');
    const queryCopiedReviewTemplateResponse = await axios.get(`${BASE_URL}${API_PREFIX}/review-templates/get`, {
      params: {
        id: copiedReviewTemplateId
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (queryCopiedReviewTemplateResponse.data.status !== 'success') {
      throw new Error('查询拷贝后的评审模板详情失败');
    }

    console.log('✅ 查询成功');

    // 获取拷贝后的评审模板节点ID
    const copiedReviewTemplate = queryCopiedReviewTemplateResponse.data.datum;
    if (!copiedReviewTemplate || !copiedReviewTemplate.nodes || copiedReviewTemplate.nodes.length === 0) {
      throw new Error('拷贝后的评审模板节点未找到');
    }

    // 查询拷贝后的流程节点任务关联
    console.log('🔍 查询拷贝后的流程节点任务关联...');
    const queryCopiedProcessNodeTasksResponse = await axios.get(`${BASE_URL}${API_PREFIX}/process-node-tasks/query`, {
      params: {
        node_id: copiedReviewTemplate.nodes[0].id,
        node_type: 2 // 2-评审模板节点
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (queryCopiedProcessNodeTasksResponse.data.status !== 'success') {
      throw new Error('查询拷贝后的流程节点任务关联失败');
    }

    console.log('✅ 查询成功');
    console.log('📦 拷贝后的流程节点任务关联:', queryCopiedProcessNodeTasksResponse.data.datum);

    // 验证任务占位是否已复制
    if (queryCopiedProcessNodeTasksResponse.data.datum.list.length === 0) {
      throw new Error('任务占位未复制');
    }

    console.log('✅ 任务占位已复制');
    console.log('📦 任务占位数量:', queryCopiedProcessNodeTasksResponse.data.datum.list.length);

    // 删除原评审模板
    console.log('🔍 删除原评审模板...');
    await axios.post(`${BASE_URL}${API_PREFIX}/review-templates/delete`, {
      id: reviewTemplateId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 删除成功');

    // 删除拷贝后的评审模板
    console.log('🔍 删除拷贝后的评审模板...');
    await axios.post(`${BASE_URL}${API_PREFIX}/review-templates/delete`, {
      id: copiedReviewTemplateId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ 删除成功');

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

    console.log('✅ /review-templates/copy 接口测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testReviewTemplateCopy();
