'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProcessNodeRelation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关系属于流程
      ProcessNodeRelation.belongsTo(models.ProcessFlow, {
        foreignKey: 'flow_id',
        as: 'flow'
      });

      // 源节点
      ProcessNodeRelation.belongsTo(models.ProcessNode, {
        foreignKey: 'source_node_id',
        as: 'source_node'
      });

      // 目标节点
      ProcessNodeRelation.belongsTo(models.ProcessNode, {
        foreignKey: 'target_node_id',
        as: 'target_node'
      });
    }
  }

  ProcessNodeRelation.init({
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
    source_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '源节点ID'
    },
    target_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '目标节点ID'
    },
    relation_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '关系类型：1-顺序 2-并行 3-条件'
    },
    condition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '条件表达式（如：状态=通过）'
    },
    create_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建时间，Unix时间戳'
    }
  }, {
    sequelize,
    modelName: 'ProcessNodeRelation',
    tableName: 'process_node_relations',
    timestamps: false,
    indexes: []
  });

  return ProcessNodeRelation;
};
