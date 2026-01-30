/**
 * 任务管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Task = sequelize.define('tasks', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  task_status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignee_id: {
    type: DataTypes.INTEGER
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  requirement_id: {
    type: DataTypes.INTEGER
  },
  review_id: {
    type: DataTypes.INTEGER
  },
  requirement_node_id: {
    type: DataTypes.INTEGER
  },
  review_node_id: {
    type: DataTypes.INTEGER
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  actual_hours: {
    type: DataTypes.DECIMAL(10, 2)
  },
  start_time: {
    type: DataTypes.INTEGER
  },
  end_time: {
    type: DataTypes.INTEGER
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

// 定义关联关系
Task.associate = function(models) {
  // 任务属于需求
  Task.belongsTo(models.Requirement, {
    foreignKey: 'requirement_id',
    as: 'requirement'
  });

  // 任务属于评审
  Task.belongsTo(models.Review, {
    foreignKey: 'review_id',
    as: 'review'
  });

  // 任务属于需求管理流程节点
  Task.belongsTo(models.RequirementProcessNode, {
    foreignKey: 'requirement_node_id',
    as: 'requirement_node'
  });

  // 任务属于评审管理流程节点
  Task.belongsTo(models.ReviewProcessNode, {
    foreignKey: 'review_node_id',
    as: 'review_node'
  });

  // 任务有负责人
  Task.belongsTo(models.User, {
    foreignKey: 'assignee_id',
    as: 'assignee'
  });

  // 任务有创建人
  Task.belongsTo(models.User, {
    foreignKey: 'reporter_id',
    as: 'reporter'
  });
};

module.exports = Task;
