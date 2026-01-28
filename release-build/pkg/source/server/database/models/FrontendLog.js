/**
 * 前端日志数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const FrontendLog = sequelize.define('logs_frontend', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  level: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '日志级别: LOG, WARN, ERROR, INFO, DEBUG, TRACE, TABLE, DIR, GROUP, TIME, COUNT, ASSERT, CLEAR'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '日志内容'
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建时间（Unix 时间戳）'
  }
}, {
  tableName: 'logs_frontend',
  timestamps: false
});

module.exports = FrontendLog;
