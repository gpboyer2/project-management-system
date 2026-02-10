/**
 * 评审流程模板节点模型
 * 存储评审流程模板的节点信息
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ReviewTemplateNode = sequelize.define('review_template_nodes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '模板节点ID'
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联模板ID'
  },
  has_tasks: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否包含任务配置：true-是 false-否'
  },
  task_config: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '任务配置（JSON格式，包含任务列表、类型、要求等）'
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
    defaultValue: 0,
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
  tableName: 'review_template_nodes'
});

// 定义关联关系
ReviewTemplateNode.associate = function(models) {
  // 模板节点与模板的关联
  ReviewTemplateNode.belongsTo(models.ReviewTemplate, {
    foreignKey: 'template_id',
    as: 'template'
  });

  // 模板节点与节点类型的关联
  ReviewTemplateNode.belongsTo(models.ProcessNodeType, {
    foreignKey: 'node_type_id',
    as: 'nodeType'
  });

  // 模板节点与用户的关联（负责人）
  ReviewTemplateNode.belongsTo(models.User, {
    foreignKey: 'assignee_id',
    as: 'assignee'
  });
};

module.exports = ReviewTemplateNode;
