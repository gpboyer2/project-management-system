/**
 * 需求版本管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RequirementVersion = sequelize.define('requirement_versions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  version_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  planned_start_time: {
    type: DataTypes.INTEGER
  },
  planned_end_time: {
    type: DataTypes.INTEGER
  },
  actual_start_time: {
    type: DataTypes.INTEGER
  },
  actual_end_time: {
    type: DataTypes.INTEGER
  },
  status: {
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

module.exports = RequirementVersion;
