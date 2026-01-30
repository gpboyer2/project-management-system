/**
 * 评审管理流程节点数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ReviewProcessNode = sequelize.define('review_process_nodes', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '节点名称'
  },
  node_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '流程节点类型ID，关联process_node_types表'
  },
  parent_node_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父节点ID，支持树形结构'
  },
  node_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '节点顺序'
  },
  assignee_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '负责人类型：1-固定用户 2-角色 3-部门'
  },
  assignee_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '负责人ID'
  },
  duration_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理时限(小时)'
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
  tableName: 'review_process_nodes'
});

// 定义关联关系
ReviewProcessNode.associate = function(models) {
  // 节点属于评审
  ReviewProcessNode.belongsTo(models.Review, {
    foreignKey: 'review_id',
    as: 'review'
  });

  // 节点属于节点类型
  ReviewProcessNode.belongsTo(models.ProcessNodeType, {
    foreignKey: 'node_type_id',
    as: 'node_type'
  });

  // 节点有父节点（树形结构）
  ReviewProcessNode.belongsTo(models.ReviewProcessNode, {
    foreignKey: 'parent_node_id',
    as: 'parent_node'
  });

  // 节点有子节点
  ReviewProcessNode.hasMany(models.ReviewProcessNode, {
    foreignKey: 'parent_node_id',
    as: 'children_nodes'
  });

  // 节点作为源节点的关系
  ReviewProcessNode.hasMany(models.ReviewProcessNodeRelation, {
    foreignKey: 'source_node_id',
    as: 'source_relations'
  });

  // 节点作为目标节点的关系
  ReviewProcessNode.hasMany(models.ReviewProcessNodeRelation, {
    foreignKey: 'target_node_id',
    as: 'target_relations'
  });

  // 节点有多个任务
  ReviewProcessNode.hasMany(models.Task, {
    foreignKey: 'review_node_id',
    as: 'tasks'
  });

  // 节点有多个用户（多对多关系）
  ReviewProcessNode.belongsToMany(models.User, {
    through: models.ReviewProcessNodeUser,
    foreignKey: 'node_id',
    otherKey: 'user_id',
    as: 'users'
  });
};

module.exports = ReviewProcessNode;
