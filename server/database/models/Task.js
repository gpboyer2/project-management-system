/**
 * 任务管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Task = sequelize.define('tasks', {
  task_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
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
  project_id: {
    type: DataTypes.INTEGER
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

module.exports = Task;
