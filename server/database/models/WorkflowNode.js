/**
 * 流程节点数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const WorkflowNode = sequelize.define('workflow_nodes', {
  node_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workflow_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  node_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  node_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  node_order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignee_type: {
    type: DataTypes.STRING
  },
  assignee_id: {
    type: DataTypes.INTEGER
  },
  duration_limit: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = WorkflowNode;
