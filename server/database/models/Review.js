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
    allowNull: false,
    comment: '所属项目ID'
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
  // 评审属于项目
  Review.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // 评审有发起人
  Review.belongsTo(models.User, {
    foreignKey: 'reporter_id',
    targetKey: 'id',
    as: 'reporter'
  });

  // 评审有负责人
  Review.belongsTo(models.User, {
    foreignKey: 'reviewer_id',
    targetKey: 'id',
    as: 'reviewer'
  });

  // 评审有多个流程节点
  Review.hasMany(models.ReviewProcessNode, {
    foreignKey: 'review_id',
    as: 'process_nodes'
  });

  // 评审有多个流程节点关系
  Review.hasMany(models.ReviewProcessNodeRelation, {
    foreignKey: 'review_id',
    as: 'process_node_relations'
  });

  // 评审有多个任务
  Review.hasMany(models.Task, {
    foreignKey: 'review_id',
    as: 'tasks'
  });
};

module.exports = Review;
