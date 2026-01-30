/**
 * 角色数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Role = sequelize.define('roles', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
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
}, {
  timestamps: false,
  tableName: 'roles'
});

// 定义关联关系
Role.associate = function(models) {
  // 角色关联项目团队（一对多关系）
  Role.hasMany(models.ProjectTeam, {
    foreignKey: 'role_id',
    as: 'project_teams'
  });
};

module.exports = Role;
