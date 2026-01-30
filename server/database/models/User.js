/**
 * 用户数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  real_name: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  avatar: {
    type: DataTypes.STRING
  },
  role_id: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  },
  last_login_time: {
    type: DataTypes.INTEGER
  },
  last_login_ip: {
    type: DataTypes.STRING
  }
});

// 定义关联关系
User.associate = function(models) {
  // 用户参与多个流程节点（多对多关系）
  User.belongsToMany(models.ProcessNode, {
    through: models.ProcessNodeUser,
    foreignKey: 'user_id',
    otherKey: 'node_id',
    as: 'process_nodes'
  });
};

module.exports = User;
