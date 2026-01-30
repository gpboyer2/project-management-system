/**
 * 项目团队数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProjectTeam = sequelize.define('project_teams', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属项目ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '角色ID'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1-正常 0-已移除'
  },
  join_time: {
    type: DataTypes.INTEGER,
    comment: '加入时间，Unix时间戳'
  },
  leave_time: {
    type: DataTypes.INTEGER,
    comment: '离开时间，Unix时间戳'
  },
  create_time: {
    type: DataTypes.INTEGER,
    comment: '创建时间，Unix时间戳'
  },
  update_time: {
    type: DataTypes.INTEGER,
    comment: '更新时间，Unix时间戳'
  }
}, {
  timestamps: false,
  tableName: 'project_teams'
});

// 定义关联关系
ProjectTeam.associate = function(models) {
  // 项目团队关联项目
  ProjectTeam.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // 项目团队关联用户
  ProjectTeam.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // 项目团队关联角色
  ProjectTeam.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role'
  });
};

module.exports = ProjectTeam;
