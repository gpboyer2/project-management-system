/**
 * 评审管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Review = sequelize.define('reviews', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '所属项目ID'
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联评审模板ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '评审名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '评审描述'
  },
  review_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '评审类型：1-技术评审 2-业务评审 3-产品评审'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '评审状态：1-待开始 2-进行中 3-已完成 4-已取消'
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '评审发起人用户ID'
  },
  reviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '评审负责人用户ID'
  },
  start_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '开始时间，Unix时间戳'
  },
  end_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '结束时间，Unix时间戳'
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
  tableName: 'reviews'
});

// 定义关联关系
Review.associate = function(models) {
  // 关联评审模板
  Review.belongsTo(models.ReviewTemplate, {
    foreignKey: 'template_id',
    as: 'template'
  });

  // 评审发起人
  Review.belongsTo(models.User, {
    foreignKey: 'reporter_id',
    as: 'reporter'
  });

  // 评审负责人
  Review.belongsTo(models.User, {
    foreignKey: 'reviewer_id',
    as: 'reviewer'
  });

  // 所属项目
  Review.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // 评审流程节点
  Review.hasMany(models.ReviewProcessNode, {
    foreignKey: 'review_id',
    as: 'process_nodes'
  });
};

module.exports = Review;
