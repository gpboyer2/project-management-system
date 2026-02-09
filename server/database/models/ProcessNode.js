/**
 * 流程节点数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProcessNode = sequelize.define('process_nodes', {
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
  tableName: 'process_nodes'
});

// 定义关联关系
ProcessNode.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = ProcessNode;
