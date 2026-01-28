/**
 * 流程执行记录数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const WorkflowExecution = sequelize.define('workflow_executions', {
  execution_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  instance_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  executor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT
  },
  start_time: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  end_time: {
    type: DataTypes.INTEGER
  },
  duration: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = WorkflowExecution;
