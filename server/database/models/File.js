/**
 * 文件管理模型
 * 存储上传的文件信息，支持与任务、需求、评审等业务关联
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const File = sequelize.define('files', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '文件ID'
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '文件名'
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '文件存储路径'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文件大小(字节)'
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '文件类型(如: image/png, application/pdf)'
  },
  business_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '业务类型：1-需求 2-任务 3-评审 4-项目'
  },
  business_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联业务ID'
  },
  uploader_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '上传用户ID'
  },
  is_temp: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否临时文件：true-临时 false-永久'
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
  tableName: 'files'
});

// 定义关联关系
File.associate = function(models) {
  // 文件与上传用户的关联
  File.belongsTo(models.User, {
    foreignKey: 'uploader_id',
    as: 'uploader'
  });

  // 文件与任务的关联（通过任务文件关联表）
  File.belongsToMany(models.Task, {
    through: models.TaskFile,
    foreignKey: 'file_id',
    otherKey: 'task_id',
    as: 'tasks'
  });
};

module.exports = File;
