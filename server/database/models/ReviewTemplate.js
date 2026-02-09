/**
 * 评审流程模板模型
 * 存储评审流程的模板信息，用于创建评审时快速生成流程结构
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ReviewTemplate = sequelize.define('review_templates', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '评审模板ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '模板名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '模板描述'
  },
  template_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '模板类型：1-技术评审 2-业务评审 3-产品评审'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为默认模板'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-启用 0-禁用'
  },
  create_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建时间，Unix时间戳'
  },
  update_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '更新时间，Unix时间戳'
  }
}, {
  timestamps: false,
  tableName: 'review_templates'
});

// 定义关联关系
ReviewTemplate.associate = function(models) {
  // 模板与模板节点的关联
  ReviewTemplate.hasMany(models.ReviewTemplateNode, {
    foreignKey: 'template_id',
    as: 'nodes'
  });
};

module.exports = ReviewTemplate;
