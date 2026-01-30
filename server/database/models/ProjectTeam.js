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
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  join_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = ProjectTeam;
