/**
 * 操作记录数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const OperationRecord = sequelize.define('operation_records', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  business_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '业务类型：1-需求 2-任务 3-项目 4-流程节点 5-评审维度'
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联的业务ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作人用户ID'
  },
  operation_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作类型：1-创建 2-更新 3-删除 4-状态变更 5-分配 6-评论 7-审批'
  },
  operation_detail: {
    type: DataTypes.TEXT,
    comment: '操作详情（JSON格式，包含变更前和变更后的数据）'
  },
  ip_address: {
    type: DataTypes.STRING,
    comment: '操作人IP地址'
  },
  user_agent: {
    type: DataTypes.STRING,
    comment: '用户代理（浏览器信息）'
  },
  create_time: {
    type: DataTypes.INTEGER,
    comment: '操作时间，Unix时间戳'
  }
});

// 定义关联关系
OperationRecord.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = OperationRecord;
