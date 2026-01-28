/**
 * 权限数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Permission = sequelize.define('permissions', {
  permission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permission_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permission_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING
  },
  resource_path: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  },
  parent_id: {
    type: DataTypes.INTEGER
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
  }
});

module.exports = Permission;
