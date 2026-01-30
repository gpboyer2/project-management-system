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
  node_type_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
