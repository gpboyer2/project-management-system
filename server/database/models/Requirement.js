/**
 * 需求管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Requirement = sequelize.define('requirements', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  current_assignee_id: {
    type: DataTypes.INTEGER
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  project_id: {
    type: DataTypes.INTEGER
  },
  planned_version: {
    type: DataTypes.STRING
  },
  actual_version: {
    type: DataTypes.STRING
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
});

// 定义关联关系
Requirement.associate = function(models) {
  // 需求属于项目
  Requirement.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // 需求属于需求类型
  Requirement.belongsTo(models.RequirementType, {
    foreignKey: 'type_id',
    as: 'type'
  });

  // 需求属于需求状态
  Requirement.belongsTo(models.RequirementStatus, {
    foreignKey: 'status_id',
    as: 'status'
  });

  // 需求有当前负责人
  Requirement.belongsTo(models.User, {
    foreignKey: 'current_assignee_id',
    as: 'current_assignee'
  });

  // 需求有提出人
  Requirement.belongsTo(models.User, {
    foreignKey: 'reporter_id',
    as: 'reporter'
  });

  // 需求有多个流程节点
  Requirement.hasMany(models.RequirementProcessNode, {
    foreignKey: 'requirement_id',
    as: 'process_nodes'
  });

  // 需求有多个流程节点关系
  Requirement.hasMany(models.RequirementProcessNodeRelation, {
    foreignKey: 'requirement_id',
    as: 'process_node_relations'
  });

  // 需求有多个任务
  Requirement.hasMany(models.Task, {
    foreignKey: 'requirement_id',
    as: 'tasks'
  });

  // 需求有多个版本
  Requirement.hasMany(models.RequirementVersion, {
    foreignKey: 'requirement_id',
    as: 'versions'
  });
};

module.exports = Requirement;
