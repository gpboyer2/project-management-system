/**
 * 流程节点类型种子数据初始化脚本
 */
const log4js = require("../../middleware/log4jsPlus")
const defaultLogger = log4js.getLogger("default")
const { ProcessNodeType } = require('../models');

// 默认流程节点类型数据
const defaultProcessNodeTypeList = [
  { node_type_name: '需求分析', description: '需求分析阶段的流程节点', sort_order: 1, status: 1 },
  { node_type_name: '系统设计', description: '系统设计阶段的流程节点', sort_order: 2, status: 1 },
  { node_type_name: '编码实现', description: '编码实现阶段的流程节点', sort_order: 3, status: 1 },
  { node_type_name: '测试验证', description: '测试验证阶段的流程节点', sort_order: 4, status: 1 },
  { node_type_name: '上线部署', description: '上线部署阶段的流程节点', sort_order: 5, status: 1 }
];

/**
 * 初始化流程节点类型数据
 * 当流程节点类型表为空时，插入默认流程节点类型数据
 * @returns {Promise<void>}
 */
async function initProcessNodeTypeList() {
  try {
    const count = await ProcessNodeType.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 流程节点类型数据已存在，跳过初始化');
      return;
    }

    await ProcessNodeType.bulkCreate(defaultProcessNodeTypeList.map(nodeType => ({
      ...nodeType,
      create_time: Date.now()
    })));
    defaultLogger.info('[Seed] 流程节点类型数据初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 流程节点类型数据初始化失败:', error);
  }
}

/**
 * 执行所有种子数据初始化
 * 初始化流程节点类型数据
 * @returns {Promise<void>}
 */
async function runSeed() {
  defaultLogger.info('[Seed] 开始初始化流程节点类型种子数据...');
  await initProcessNodeTypeList();
  defaultLogger.info('[Seed] 流程节点类型种子数据初始化完成');
}

module.exports = {
  runSeed,
  initProcessNodeTypeList
};