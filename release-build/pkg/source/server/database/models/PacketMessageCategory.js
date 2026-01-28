// 报文层级分类数据模型
// 存储报文的层级分类信息，支持无限层级嵌套
// 对应数据表 packet_message_categories
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PacketMessageCategory = sequelize.define('packet_message_categories', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  parent_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.INTEGER
  },
  updated_at: {
    type: DataTypes.INTEGER
  }
});

module.exports = PacketMessageCategory;

