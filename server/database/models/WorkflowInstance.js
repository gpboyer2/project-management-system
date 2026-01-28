/**
 * 流程实例数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const WorkflowInstance = sequelize.define('workflow_instances', {
  instance_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workflow_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  business_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  current_node_id: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  create_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = WorkflowInstance;
