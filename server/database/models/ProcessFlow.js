/**
 * 流程数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const ProcessFlow = sequelize.define('process_flows', {
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
    comment: '流程名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '流程描述'
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
  tableName: 'process_flows'
});

// 定义关联关系
ProcessFlow.associate = function(models) {
  // 流程关联到需求
  ProcessFlow.belongsTo(models.Requirement, {
    foreignKey: 'requirement_id',
    as: 'requirement'
  });

  // 流程包含多个节点
  ProcessFlow.hasMany(models.ProcessNode, {
    foreignKey: 'flow_id',
    as: 'nodes'
  });

  // 流程包含多个节点关系
  ProcessFlow.hasMany(models.ProcessNodeRelation, {
    foreignKey: 'flow_id',
    as: 'relations'
  });

  // 流程有多个执行记录
  ProcessFlow.hasMany(models.ProcessExecution, {
    foreignKey: 'flow_id',
    as: 'executions'
  });
};

module.exports = ProcessFlow;
