/**
 * 流程节点类型数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProcessNodeType = sequelize.define('process_node_types', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.INTEGER,
    defaultValue: 99
  },
  description: {
    type: DataTypes.TEXT
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  config: {
    type: DataTypes.JSON
  },
  tasks: {
    type: DataTypes.JSON
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = ProcessNodeType;
