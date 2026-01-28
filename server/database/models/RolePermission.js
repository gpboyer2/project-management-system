/**
 * 角色权限关联数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RolePermission = sequelize.define('role_permissions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  permission_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = RolePermission;
