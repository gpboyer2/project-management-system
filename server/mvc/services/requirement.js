/**
 * 需求管理服务
 * 处理需求管理的业务逻辑
 */
const { Requirement, RequirementProcessNode, RequirementProcessNodeRelation, RequirementProcessNodeUser, User, Project } = require('../../database/models');

/**
 * 获取需求列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.projectId 项目ID
 * @param {number} params.status 需求状态
 * @returns {Object} 需求列表和分页信息
 */
exports.getRequirementList = async (params) => {
  const { page = 1, pageSize = 20, projectId, status } = params;
  const where = {};

  if (projectId) {
    where.project_id = projectId;
  }

  if (status) {
    where.status_id = status;
  }

  const { count, rows } = await Requirement.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize),
    order: [['create_time', 'DESC']],
    include: [
      { model: User, as: 'current_assignee' },
      { model: User, as: 'reporter' },
      { model: Project, as: 'project' }
    ]
  });

  return {
    list: rows,
    pagination: {
      current_page: parseInt(page),
      page_size: parseInt(pageSize),
      total: count
    }
  };
};

/**
 * 创建需求
 * @param {Object} requirementData 需求数据
 * @param {string} requirementData.name 需求名称
 * @param {string} requirementData.description 需求描述
 * @param {number} requirementData.type_id 需求类型ID
 * @param {number} requirementData.priority 优先级（1-P0 2-P1 3-P2 4-P3）
 * @param {number} requirementData.status_id 需求状态ID
 * @param {number} requirementData.current_assignee_id 当前负责人用户ID
 * @param {number} requirementData.reporter_id 提出人用户ID
 * @param {number} requirementData.project_id 所属项目ID
 * @param {string} requirementData.planned_version 规划版本
 * @param {string} requirementData.actual_version 实际上线版本
 * @returns {Object} 新创建的需求
 */
exports.createRequirement = async (requirementData) => {
  const { name, description, type_id, priority, status_id, current_assignee_id, reporter_id, project_id, planned_version, actual_version } = requirementData;

  return await Requirement.create({
    name,
    description,
    type_id,
    priority,
    status_id,
    current_assignee_id,
    reporter_id,
    project_id,
    planned_version,
    actual_version,
    create_time: Date.now(),
    update_time: Date.now()
  });
};

/**
 * 更新需求
 * @param {number} id 需求ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的需求
 */
exports.updateRequirement = async (id, updateData) => {
  const requirement = await Requirement.findByPk(id);
  if (!requirement) {
    throw new Error('需求不存在');
  }

  updateData.update_time = Date.now();
  return await requirement.update(updateData);
};

/**
 * 删除需求
 * @param {Array<number>} ids 需求ID列表
 * @returns {void}
 */
exports.deleteRequirements = async (ids) => {
  await Requirement.destroy({ where: { id: ids } });
};

/**
 * 获取需求详情
 * @param {number} id 需求ID
 * @returns {Object} 需求详情
 */
exports.getRequirementDetail = async (id) => {
  return await Requirement.findByPk(id, {
    include: [
      { model: User, as: 'current_assignee' },
      { model: User, as: 'reporter' },
      { model: Project, as: 'project' },
      { model: RequirementProcessNode, as: 'process_nodes' }
    ]
  });
};

/**
 * 获取需求流程节点列表
 * @param {number} requirementId 需求ID
 * @returns {Array} 需求流程节点列表
 */
exports.getRequirementProcessNodes = async (requirementId) => {
  return await RequirementProcessNode.findAll({
    where: { requirement_id: requirementId },
    order: [['node_order', 'ASC']]
  });
};

/**
 * 创建需求流程节点
 * @param {Object} nodeData 节点数据
 * @returns {Object} 新创建的节点
 */
exports.createRequirementProcessNode = async (nodeData) => {
  nodeData.create_time = Date.now();
  nodeData.update_time = Date.now();
  return await RequirementProcessNode.create(nodeData);
};

/**
 * 更新需求流程节点
 * @param {number} id 节点ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的节点
 */
exports.updateRequirementProcessNode = async (id, updateData) => {
  const node = await RequirementProcessNode.findByPk(id);
  if (!node) {
    throw new Error('节点不存在');
  }

  updateData.update_time = Date.now();
  return await node.update(updateData);
};

/**
 * 删除需求流程节点
 * @param {Array<number>} ids 节点ID列表
 * @returns {void}
 */
exports.deleteRequirementProcessNodes = async (ids) => {
  await RequirementProcessNode.destroy({ where: { id: ids } });
};
