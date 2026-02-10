/**
 * 任务文件关联模型
 * 存储任务与文件的关联关系，支持一个任务传入多个文件
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const TaskFile = sequelize.define('task_files', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关联ID'
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '任务ID'
  },
  file_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文件ID'
  },
  file_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他'
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
  tableName: 'task_files'
});

// 定义关联关系
TaskFile.associate = function(models) {
  // 关联任务
  TaskFile.belongsTo(models.Task, {
    foreignKey: 'task_id',
    as: 'task'
  });

  // 关联文件
  TaskFile.belongsTo(models.File, {
    foreignKey: 'file_id',
    as: 'file'
  });
};

module.exports = TaskFile;
