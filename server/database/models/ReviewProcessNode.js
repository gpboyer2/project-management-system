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
  source_template_node_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '来源模板节点ID'
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
  x: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '节点X坐标'
  },
  y: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '节点Y坐标'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-启用 0-禁用'
  },
  completion_status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '完成状态：0-未开始 1-进行中 2-已完成'
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
  // 移除所有关联关系，避免外键约束检查
};

module.exports = ReviewProcessNode;
