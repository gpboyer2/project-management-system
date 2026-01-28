/**
 * 用户会话数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const UserSession = sequelize.define('user_sessions', {
  session_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.STRING
  },
  ip_address: {
    type: DataTypes.STRING
  },
  user_agent: {
    type: DataTypes.STRING
  },
  expires_at: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = UserSession;
