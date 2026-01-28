/**
 * 需求标签关联数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RequirementTag = sequelize.define('requirement_tags', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  create_time: {
    type: DataTypes.INTEGER
  }
});

module.exports = RequirementTag;
