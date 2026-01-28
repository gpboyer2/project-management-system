/**
 * 缺陷管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Defect = sequelize.define('defects', {
  defect_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  defect_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  severity: {
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
  task_id: {
    type: DataTypes.INTEGER
  },
  project_id: {
    type: DataTypes.INTEGER
  },
  reproduce_steps: {
    type: DataTypes.TEXT
  },
  fix_version: {
    type: DataTypes.STRING
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = Defect;
