/**
 * 需求类型种子数据初始化脚本
 */
const log4js = require("../../middleware/log4jsPlus")
const defaultLogger = log4js.getLogger("default")
const { RequirementType } = require('../models');

// 默认需求类型数据
const defaultRequirementTypeList = [
  { name: '功能需求', type: 1, description: '产品功能相关的需求', sort_order: 1, status: 1, config: {} },
  { name: '性能需求', type: 2, description: '系统性能相关的需求', sort_order: 2, status: 1, config: {} },
  { name: '安全需求', type: 3, description: '系统安全相关的需求', sort_order: 3, status: 1, config: {} },
  { name: '兼容性需求', type: 4, description: '系统兼容性相关的需求', sort_order: 4, status: 1, config: {} },
  { name: '用户体验需求', type: 5, description: '用户体验相关的需求', sort_order: 5, status: 1, config: {} },
  { name: '其他需求', type: 99, description: '其他类型的需求', sort_order: 6, status: 1, config: {} }
];

/**
 * 初始化需求类型数据
 * 当需求类型表为空时，插入默认需求类型数据
 * @returns {Promise<void>}
 */
async function initRequirementTypeList() {
  try {
    const count = await RequirementType.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 需求类型数据已存在，跳过初始化');
      return;
    }

    await RequirementType.bulkCreate(defaultRequirementTypeList.map(requirementType => ({
      ...requirementType,
      create_time: Date.now(),
      update_time: Date.now()
    })));
    defaultLogger.info('[Seed] 需求类型数据初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 需求类型数据初始化失败:', error);
  }
}

/**
 * 执行所有种子数据初始化
 * 初始化需求类型数据
 * @returns {Promise<void>}
 */
async function runSeed() {
  defaultLogger.info('[Seed] 开始初始化需求类型种子数据...');
  await initRequirementTypeList();
  defaultLogger.info('[Seed] 需求类型种子数据初始化完成');
}

module.exports = {
  runSeed,
  initRequirementTypeList
};
