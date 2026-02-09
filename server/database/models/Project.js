/**
 * 项目管理数据模型
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Project = sequelize.define('projects', {
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
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER
  },
  start_date: {
    type: DataTypes.INTEGER
  },
  end_date: {
    type: DataTypes.INTEGER
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2)
  },
  create_time: {
    type: DataTypes.INTEGER
  },
  update_time: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: false,
  tableName: 'projects'
});

// 定义关联关系
Project.associate = function(models) {
  // 移除所有关联关系，避免外键约束检查
};

module.exports = Project;
