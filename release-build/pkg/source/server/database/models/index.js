/**
 * 数据模型统一导出
 * 定义模型间的关联关系并统一导出
 */
const NodeType = require('./NodeType');
const SystemLevelDesignTreeNode = require('./SystemLevelDesignTreeNode');
const Flowchart = require('./Flowchart');
const CommunicationNode = require('./CommunicationNode');
const PacketMessage = require('./PacketMessage');
const PacketMessageCategory = require('./PacketMessageCategory');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const UserSession = require('./UserSession');
const FrontendLog = require('./FrontendLog');

// 不定义外键关联关系，避免外键约束导致的删除问题

module.exports = {
  NodeType,
  SystemLevelDesignTreeNode,
  Flowchart,
  CommunicationNode,
  PacketMessage,
  PacketMessageCategory,
  User,
  Role,
  Permission,
  RolePermission,
  UserSession,
  FrontendLog
};
