/**
 * 需求管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Requirement = sequelize.define('requirements', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type_id: {
    type: DataTypes.INTEGER,
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
  current_assignee_id: {
    type: DataTypes.INTEGER
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER
  },
  planned_version: {
    type: DataTypes.STRING
  },
  actual_version: {
    type: DataTypes.STRING
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = Requirement;
