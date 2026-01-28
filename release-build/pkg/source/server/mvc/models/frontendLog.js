/**
 * 前端日志模型，处理前端日志的存储和查询
 */
const { FrontendLog } = require("../../database/models");
const { Op } = require("sequelize");

class FrontendLogModel {
  // 创建前端日志
  static async create(level, message) {
    try {
      return await FrontendLog.create({
        level,
        message,
        created_at: Date.now()
      });
    } catch (error) {
      throw error;
    }
  }

  // 批量创建前端日志
  static async createBatch(log_list) {
    try {
      const log_data_list = log_list.map(log => ({
        level: log.level,
        message: log.message,
        created_at: Date.now()
      }));
      return await FrontendLog.bulkCreate(log_data_list);
    } catch (error) {
      throw error;
    }
  }

  // 获取所有前端日志（按时间正序，旧→新）
  static async findAll() {
    try {
      const log_list = await FrontendLog.findAll({
        order: [['created_at', 'ASC']],
        raw: true
      });
      return log_list;
    } catch (error) {
      throw error;
    }
  }

  // 清理指定时间之前的日志
  static async cleanOld(beforeTimestamp) {
    try {
      return await FrontendLog.destroy({
        where: {
          created_at: { [Op.lt]: beforeTimestamp }
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FrontendLogModel;
