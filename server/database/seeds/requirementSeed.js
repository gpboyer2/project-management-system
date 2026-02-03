// 需求管理模块种子数据初始化脚本
const log4js = require("../../middleware/log4jsPlus")
const defaultLogger = log4js.getLogger("default")
const { Requirement } = require('../models');

// 默认需求数据
const defaultRequirementList = [
  {
    name: '用户登录功能优化',
    type_id: 2,
    description: '优化用户登录流程，添加验证码功能，提高系统安全性',
    priority: 1,
    status_id: 3,
    current_assignee_id: 1,
    reporter_id: 1,
    project_id: 1,
    planned_version: 'v2.1',
    actual_version: '',
    create_time: Date.now() - 7 * 24 * 60 * 60 * 1000
  },
  {
    name: '项目管理模块开发',
    type_id: 1,
    description: '开发项目管理模块，支持项目创建、编辑、删除和团队管理',
    priority: 2,
    status_id: 4,
    current_assignee_id: 2,
    reporter_id: 1,
    project_id: 1,
    planned_version: 'v2.2',
    actual_version: '',
    create_time: Date.now() - 14 * 24 * 60 * 60 * 1000
  },
  {
    name: '需求流程编排设计',
    type_id: 3,
    description: '设计需求流程编排功能，支持自定义流程节点和流转条件',
    priority: 1,
    status_id: 2,
    current_assignee_id: 1,
    reporter_id: 2,
    project_id: 2,
    planned_version: 'v3.0',
    actual_version: '',
    create_time: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    name: '报表统计功能开发',
    type_id: 2,
    description: '开发报表统计功能，支持需求、项目、任务等数据的图表展示',
    priority: 3,
    status_id: 1,
    current_assignee_id: null,
    reporter_id: 1,
    project_id: 1,
    planned_version: 'v2.3',
    actual_version: '',
    create_time: Date.now() - 21 * 24 * 60 * 60 * 1000
  },
  {
    name: '移动端适配',
    type_id: 2,
    description: '对系统进行移动端适配，支持在手机和平板设备上正常使用',
    priority: 4,
    status_id: 5,
    current_assignee_id: 2,
    reporter_id: 2,
    project_id: 2,
    planned_version: 'v2.1',
    actual_version: '',
    create_time: Date.now() - 10 * 24 * 60 * 60 * 1000
  }
];

/**
 * 初始化需求数据
 * 当需求表为空时，插入默认需求数据
 * @returns {Promise<void>}
 */
async function initRequirementList() {
  try {
    const count = await Requirement.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 需求数据已存在，跳过初始化');
      return;
    }

    await Requirement.bulkCreate(defaultRequirementList.map(req => ({
      ...req,
      update_time: Date.now()
    })));
    defaultLogger.info('[Seed] 需求数据初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 需求数据初始化失败:', error);
  }
}

/**
 * 执行所有种子数据初始化
 * @returns {Promise<void>}
 */
async function runSeed() {
  defaultLogger.info('[Seed] 开始初始化需求管理模块种子数据...');

  await initRequirementList();

  defaultLogger.info('[Seed] 需求管理模块种子数据初始化完成');
}

module.exports = {
  runSeed,
  initRequirementList
};
