/**
 * 数据模型统一导出
 * 不定义外键关联关系，避免外键约束导致的删除问题
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
const Requirement = require('./Requirement');
const Task = require('./Task');
const Project = require('./Project');
const ProjectTeam = require('./ProjectTeam');
const Comment = require('./Comment');
const OperationRecord = require('./OperationRecord');
const Notification = require('./Notification');
const RequirementType = require('./RequirementType');
const RequirementStatus = require('./RequirementStatus');
const RequirementTaskStatus = require('./RequirementTaskStatus');
const ProcessNodeType = require('./ProcessNodeType');
const ProcessNode = require('./ProcessNode');
const ProcessNodeRelation = require('./ProcessNodeRelation');
const ProcessNodeUser = require('./ProcessNodeUser');
const ProcessExecution = require('./ProcessExecution');
const DataImportExport = require('./DataImportExport');
const RequirementVersion = require('./RequirementVersion');
const Review = require('./Review');
const RequirementProcessNode = require('./RequirementProcessNode');
const RequirementProcessNodeRelation = require('./RequirementProcessNodeRelation');
const RequirementProcessNodeUser = require('./RequirementProcessNodeUser');
const ReviewProcessNode = require('./ReviewProcessNode');
const ReviewProcessNodeRelation = require('./ReviewProcessNodeRelation');
const ReviewProcessNodeUser = require('./ReviewProcessNodeUser');
const ReviewDimension = require('./ReviewDimension');
const ReviewTemplate = require('./ReviewTemplate');
const ReviewTemplateNode = require('./ReviewTemplateNode');
const ProcessNodeTask = require('./ProcessNodeTask');
const TaskFile = require('./TaskFile');
const File = require('./File');

// 建立模型关联关系
const models = {
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
  FrontendLog,
  Requirement,
  Task,
  Project,
  ProjectTeam,
  Comment,
  OperationRecord,
  Notification,
  RequirementType,
  RequirementStatus,
  RequirementTaskStatus,
  ProcessNodeType,
  ProcessNode,
  ProcessNodeRelation,
  ProcessNodeUser,
  ProcessExecution,
  DataImportExport,
  RequirementVersion,
  Review,
  RequirementProcessNode,
  RequirementProcessNodeRelation,
  RequirementProcessNodeUser,
  ReviewProcessNode,
  ReviewProcessNodeRelation,
  ReviewProcessNodeUser,
  ReviewDimension,
  ReviewTemplate,
  ReviewTemplateNode,
  ProcessNodeTask,
  TaskFile,
  File
};

// 初始化所有模型的关联关系
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = models;
