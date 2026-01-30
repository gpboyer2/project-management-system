'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProcessNode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 节点属于流程
      ProcessNode.belongsTo(models.ProcessFlow, {
        foreignKey: 'flow_id',
        as: 'flow'
      });

      // 节点属于节点类型
      ProcessNode.belongsTo(models.ProcessNodeType, {
        foreignKey: 'node_type_id',
        as: 'node_type'
      });

      // 节点有父节点（树形结构）
      ProcessNode.belongsTo(models.ProcessNode, {
        foreignKey: 'parent_node_id',
        as: 'parent_node'
      });

      // 节点有子节点
      ProcessNode.hasMany(models.ProcessNode, {
        foreignKey: 'parent_node_id',
        as: 'children_nodes'
      });

      // 节点作为源节点的关系
      ProcessNode.hasMany(models.ProcessNodeRelation, {
        foreignKey: 'source_node_id',
        as: 'source_relations'
      });

      // 节点作为目标节点的关系
      ProcessNode.hasMany(models.ProcessNodeRelation, {
        foreignKey: 'target_node_id',
        as: 'target_relations'
      });

      // 节点有多个任务
      ProcessNode.hasMany(models.Task, {
        foreignKey: 'node_id',
        as: 'tasks'
      });

      // 节点有多个执行记录
      ProcessNode.hasMany(models.ProcessExecution, {
        foreignKey: 'node_id',
        as: 'executions'
      });

      // 节点有多个用户（多对多关系）
      ProcessNode.belongsToMany(models.User, {
        through: models.ProcessNodeUser,
        foreignKey: 'node_id',
        otherKey: 'user_id',
        as: 'users'
      });
    }
  }

  ProcessNode.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    flow_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '流程ID'
    },
    node_name: {
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
    sequelize,
    modelName: 'ProcessNode',
    tableName: 'process_nodes',
    timestamps: false,
    indexes: []
  });

  return ProcessNode;
};
