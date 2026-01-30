/**
 * 流程执行记录数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProcessExecution = sequelize.define('process_executions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联需求ID'
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  executor_id: {
    type: DataTypes.INTEGER
  },
  action: {
    type: DataTypes.INTEGER,
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

module.exports = ProcessExecution;
