'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProcessNodeUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 关联到流程节点
      ProcessNodeUser.belongsTo(models.ProcessNode, {
        foreignKey: 'node_id',
        as: 'node'
      });

      // 关联到用户
      ProcessNodeUser.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  ProcessNodeUser.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '流程节点ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    role_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '用户角色类型：1-负责人 2-参与者 3-观察者'
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：1-正常 0-已移除'
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
    modelName: 'ProcessNodeUser',
    tableName: 'process_node_users',
    timestamps: false,
    indexes: []
  });

  return ProcessNodeUser;
};
