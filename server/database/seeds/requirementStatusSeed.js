/**
 * 需求状态种子数据初始化脚本
 * 用于在服务器启动时初始化默认的需求状态数据
 */
const log4js = require("../../middleware/log4jsPlus");
const defaultLogger = log4js.getLogger("default");
const { RequirementStatus } = require("../models");

// 默认需求状态数据
const defaultRequirementStatusList = [
  {
    name: "待处理",
    status: 1,
    description: "需求已创建但尚未处理",
    sort_order: 1,
    config: {},
  },
  {
    name: "处理中",
    status: 2,
    description: "需求正在处理中",
    sort_order: 2,
    config: {},
  },
  {
    name: "已完成",
    status: 3,
    description: "需求已处理完成",
    sort_order: 3,
    config: {},
  },
  {
    name: "已取消",
    status: 4,
    description: "需求已取消",
    sort_order: 4,
    config: {},
  },
];

/**
 * 初始化需求状态数据
 * 当数据库中没有需求状态数据时，插入默认数据
 */
async function initRequirementStatusList() {
  try {
    // 检查是否已存在需求状态数据
    const count = await RequirementStatus.count();
    if (count > 0) {
      defaultLogger.info("[Seed] 需求状态数据已存在，跳过初始化");
      return;
    }

    // 插入默认需求状态数据
    const requirementStatuses = await RequirementStatus.bulkCreate(
      defaultRequirementStatusList.map((status) => ({
        ...status,
        create_time: Date.now(),
        update_time: Date.now(),
      }))
    );

    defaultLogger.info(
      `[Seed] 需求状态数据初始化完成，共创建 ${requirementStatuses.length} 条数据`
    );
  } catch (error) {
    defaultLogger.error("[Seed] 需求状态数据初始化失败:", error);
  }
}

/**
 * 执行所有种子数据初始化操作
 */
async function runSeed() {
  defaultLogger.info("[Seed] 开始初始化需求状态种子数据...");
  await initRequirementStatusList();
  defaultLogger.info("[Seed] 需求状态种子数据初始化完成");
}

module.exports = {
  runSeed,
  initRequirementStatusList,
};
