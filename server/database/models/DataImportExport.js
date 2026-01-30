/**
 * 数据导入导出记录数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const DataImportExport = sequelize.define('data_import_exports', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  operation_type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data_type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING
  },
  file_size: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  error_message: {
    type: DataTypes.TEXT
  },
  record_count: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = DataImportExport;
