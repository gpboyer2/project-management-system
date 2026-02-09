/**
 * 需求管理服务
 * 处理需求管理的业务逻辑
 */
const { Requirement, RequirementProcessNode, RequirementProcessNodeRelation, RequirementProcessNodeUser, User, Project } = require('../../database/models');

/**
 * 获取需求列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.projectId 项目ID
 * @param {number} params.status 需求状态
 * @returns {Object} 需求列表和分页信息
 */
exports.getRequirementList = async (params) => {
  const { current_page = 1, page_size = 20, projectId, status } = params;
  const where = {};

  if (projectId) {
    where.project_id = projectId;
  }

  if (status) {
    where.status_id = status;
  }

  const { count, rows } = await Requirement.findAndCountAll({
    where,
    offset: (current_page - 1) * page_size,
    limit: parseInt(page_size),
    order: [['create_time', 'DESC']]
  });

  return {
    list: rows,
    pagination: {
      current_page: parseInt(current_page),
      page_size: parseInt(page_size),
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

  // 检查项目是否存在
  if (project_id) {
    const project = await Project.findByPk(project_id);
    if (!project) {
      throw new Error('项目不存在');
    }
  }

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
  const requirement = await Requirement.findByPk(id);

  if (!requirement) {
    throw new Error('需求不存在');
  }

  return requirement;
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

/**
 * 获取需求流程节点详情
 * @param {number} id 节点ID
 * @returns {Object} 节点详情
 */
exports.getRequirementProcessNodeDetail = async (id) => {
  const node = await RequirementProcessNode.findByPk(id);
  if (!node) {
    throw new Error('节点不存在');
  }
  return node;
};

/**
 * 更新需求流程节点完成状态
 * @param {number} nodeId 节点ID
 * @param {number} completionStatus 完成状态：0-未开始 1-进行中 2-已完成
 * @returns {Object} 更新后的节点
 */
exports.updateRequirementProcessNodeCompletionStatus = async (nodeId, completionStatus) => {
  const node = await RequirementProcessNode.findByPk(nodeId);
  if (!node) {
    throw new Error('节点不存在');
  }

  return await node.update({
    completion_status: completionStatus,
    update_time: Date.now()
  });
};

/**
 * 获取需求流程节点用户列表
 * @param {number} nodeId 节点ID
 * @returns {Array} 节点用户列表
 */
exports.getRequirementProcessNodeUsers = async (nodeId) => {
  return await RequirementProcessNodeUser.findAll({
    where: { node_id: nodeId, status: 1 }
  });
};

/**
 * 创建需求流程节点用户关联
 * @param {Object} userData 用户关联数据
 * @returns {Object} 新创建的用户关联
 */
exports.createRequirementProcessNodeUser = async (userData) => {
  userData.create_time = Date.now();
  userData.update_time = Date.now();
  userData.status = 1;
  return await RequirementProcessNodeUser.create(userData);
};

/**
 * 删除需求流程节点用户关联
 * @param {Array<number>} ids 用户关联ID列表
 * @returns {void}
 */
exports.deleteRequirementProcessNodeUsers = async (ids) => {
  await RequirementProcessNodeUser.destroy({ where: { id: ids } });
};

/**
 * 获取需求流程节点关系列表
 * @param {number} requirementId 需求ID
 * @returns {Array} 节点关系列表
 */
exports.getRequirementProcessNodeRelations = async (requirementId) => {
  return await RequirementProcessNodeRelation.findAll({
    where: { requirement_id: requirementId }
  });
};

/**
 * 创建需求流程节点关系
 * @param {Object} relationData 关系数据
 * @returns {Object} 新创建的关系
 */
exports.createRequirementProcessNodeRelation = async (relationData) => {
  relationData.create_time = Date.now();
  return await RequirementProcessNodeRelation.create(relationData);
};

/**
 * 更新需求流程节点关系
 * @param {number} id 关系ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的关系
 */
exports.updateRequirementProcessNodeRelation = async (id, updateData) => {
  const relation = await RequirementProcessNodeRelation.findByPk(id);
  if (!relation) {
    throw new Error('关系不存在');
  }
  return await relation.update(updateData);
};

/**
 * 删除需求流程节点关系
 * @param {Array<number>} ids 关系ID列表
 * @returns {void}
 */
exports.deleteRequirementProcessNodeRelations = async (ids) => {
  await RequirementProcessNodeRelation.destroy({ where: { id: ids } });
};

/**
 * 保存需求流程（批量保存节点和关系）
 * @param {Object} processData 流程数据
 * @param {Array} processData.nodes 节点列表
 * @param {Array} processData.relations 关系列表
 * @returns {Object} 保存结果
 */
exports.saveRequirementProcess = async (processData) => {
  const { nodes, relations } = processData;

  // 获取需求ID
  const requirementId = nodes[0]?.requirement_id || relations[0]?.requirement_id;
  if (!requirementId) {
    throw new Error('需求ID不能为空');
  }

  // 获取数据库中现有的节点和关系
  const existingNodes = await RequirementProcessNode.findAll({
    where: { requirement_id: requirementId }
  });
  const existingRelations = await RequirementProcessNodeRelation.findAll({
    where: { requirement_id: requirementId }
  });

  // 保存节点
  const savedNodes = [];
  for (const node of nodes) {
    if (node.id) {
      // 更新现有节点
      const updatedNode = await exports.updateRequirementProcessNode(node.id, node);
      savedNodes.push(updatedNode);
    } else {
      // 创建新节点
      const newNode = await exports.createRequirementProcessNode(node);
      savedNodes.push(newNode);
    }
  }

  // 保存关系（如果关系数组不为空）
  const savedRelations = [];
  if (relations.length > 0) {
    for (const relation of relations) {
      if (relation.id) {
        // 更新现有关系
        await exports.updateRequirementProcessNodeRelation(relation.id, relation);
      } else {
        // 检查源节点和目标节点是否存在
        const sourceNodeExists = savedNodes.some(node => node.id === relation.source_node_id);
        const targetNodeExists = savedNodes.some(node => node.id === relation.target_node_id);
        if (sourceNodeExists && targetNodeExists) {
          // 创建新关系
          const newRelation = await exports.createRequirementProcessNodeRelation(relation);
          savedRelations.push(newRelation);
        }
      }
    }
  }

  // 删除不存在的节点
  const nodeIds = nodes.map(node => node.id);
  for (const existingNode of existingNodes) {
    if (!nodeIds.includes(existingNode.id)) {
      await exports.deleteRequirementProcessNodes([existingNode.id]);
    }
  }

  // 删除不存在的关系
  if (relations.length > 0) {
    const relationIds = relations.map(relation => relation.id);
    for (const existingRelation of existingRelations) {
      if (!relationIds.includes(existingRelation.id)) {
        await exports.deleteRequirementProcessNodeRelations([existingRelation.id]);
      }
    }
  }

  return {
    message: '流程保存成功',
    nodes: savedNodes,
    relations: savedRelations
  };
};
