/**
 * 流程节点任务关联模型
 * 存储流程节点与任务的关联关系，支持一个节点绑定多个任务，包含占位任务标识
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProcessNodeTask = sequelize.define('process_node_tasks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关联ID'
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '流程节点ID'
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '任务ID（占位任务时为null）'
  },
  node_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '节点类型：1-评审流程节点 2-评审模板节点'
  },
  is_placeholder: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否占位任务：true-占位任务 false-实际任务'
  },
  task_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '任务名称（占位任务时必填）'
  },
  task_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '任务描述（占位任务时可选）'
  },
  task_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '任务类型：1-必填 2-可选'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：1-正常 0-已删除'
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
  tableName: 'process_node_tasks'
});

// 定义关联关系
ProcessNodeTask.associate = function(models) {
  // 关联流程节点（根据 node_type 区分是评审流程节点还是评审模板节点）
  // 由于 Sequelize 不支持条件关联，这里不直接定义 belongsTo 关联，使用查询时手动判断

  // 关联任务（实际任务时）
  ProcessNodeTask.belongsTo(models.Task, {
    foreignKey: 'task_id',
    as: 'task'
  });
};

module.exports = ProcessNodeTask;
