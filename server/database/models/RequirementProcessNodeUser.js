/**
 * 需求管理流程节点用户关联数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RequirementProcessNodeUser = sequelize.define('requirement_process_node_users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '流程节点ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  role_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '用户角色类型：1-负责人 2-参与者 3-观察者'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-正常 0-已移除'
  },
  create_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建时间，Unix时间戳'
  },
  update_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '更新时间，Unix时间戳'
  }
}, {
  timestamps: false,
  tableName: 'requirement_process_node_users'
});

// 定义关联关系
RequirementProcessNodeUser.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = RequirementProcessNodeUser;
