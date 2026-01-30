/**
 * 评审管理流程节点关系数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ReviewProcessNodeRelation = sequelize.define('review_process_node_relations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  review_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联评审ID'
  },
  source_node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '源节点ID'
  },
  target_node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '目标节点ID'
  },
  relation_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '关系类型：1-顺序 2-并行 3-条件'
  },
  condition: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '条件表达式（如：状态=通过）'
  },
  create_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建时间，Unix时间戳'
  }
}, {
  timestamps: false,
  tableName: 'review_process_node_relations'
});

// 定义关联关系
ReviewProcessNodeRelation.associate = function(models) {
  // 关系属于评审
  ReviewProcessNodeRelation.belongsTo(models.Review, {
    foreignKey: 'review_id',
    as: 'review'
  });

  // 源节点
  ReviewProcessNodeRelation.belongsTo(models.ReviewProcessNode, {
    foreignKey: 'source_node_id',
    as: 'source_node'
  });

  // 目标节点
  ReviewProcessNodeRelation.belongsTo(models.ReviewProcessNode, {
    foreignKey: 'target_node_id',
    as: 'target_node'
  });
};

module.exports = ReviewProcessNodeRelation;
