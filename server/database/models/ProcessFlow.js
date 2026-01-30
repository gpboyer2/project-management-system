'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProcessFlow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
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
    }
  }

  ProcessFlow.init({
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
    flow_name: {
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
    sequelize,
    modelName: 'ProcessFlow',
    tableName: 'process_flows',
    timestamps: false,
    indexes: []
  });

  return ProcessFlow;
};
