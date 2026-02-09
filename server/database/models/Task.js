/**
 * 任务管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Task = sequelize.define('tasks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignee_id: {
    type: DataTypes.INTEGER
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requirement_id: {
    type: DataTypes.INTEGER
  },
  review_id: {
    type: DataTypes.INTEGER
  },
  requirement_node_id: {
    type: DataTypes.INTEGER
  },
  review_node_id: {
    type: DataTypes.INTEGER
  },
  parent_task_id: {
    type: DataTypes.INTEGER,
    comment: '父任务ID，支持子任务层级结构'
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  actual_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  start_time: {
    type: DataTypes.INTEGER
  },
  end_time: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

// 定义关联关系
Task.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = Task;
