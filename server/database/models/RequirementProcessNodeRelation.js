/**
 * 需求管理流程节点关系数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const RequirementProcessNodeRelation = sequelize.define('requirement_process_node_relations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requirement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联需求ID'
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
  tableName: 'requirement_process_node_relations'
});

// 定义关联关系
RequirementProcessNodeRelation.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = RequirementProcessNodeRelation;
