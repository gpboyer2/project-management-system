/**
 * 需求状态数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RequirementStatus = sequelize.define('requirement_statuses', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
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
  config: {
    type: DataTypes.JSON
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = RequirementStatus;
