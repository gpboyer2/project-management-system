/**
 * 通知管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Notification = sequelize.define('notifications', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  business_type: {
    type: DataTypes.INTEGER
  },
  business_id: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = Notification;
