/**
 * 操作记录数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const OperationRecord = sequelize.define('operation_records', {
  record_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  business_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  operation_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  operation_detail: {
    type: DataTypes.TEXT
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = OperationRecord;
