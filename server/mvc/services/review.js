/**
 * 评审管理服务
 * 处理评审管理的业务逻辑
 */
const { Review, ReviewProcessNode, ReviewProcessNodeRelation, ReviewProcessNodeUser, User, Project, ReviewTemplate, ReviewTemplateNode, ProcessNodeTask } = require('../../database/models');

/**
 * 获取评审列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.projectId 项目ID
 * @param {number} params.status 评审状态
 * @returns {Object} 评审列表和分页信息
 */
exports.getReviewList = async (params) => {
  const { current_page = 1, page_size = 20, projectId, status } = params;
  const where = {};

  if (projectId) {
    where.project_id = projectId;
  }

  if (status) {
    where.status = status;
  }

  const { count, rows } = await Review.findAndCountAll({
    where,
    offset: (current_page - 1) * page_size,
    limit: parseInt(page_size),
    order: [['create_time', 'DESC']],
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'reviewer' },
      { model: Project, as: 'project' }
    ]
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
 * 创建评审
 * @param {Object} reviewData 评审数据
 * @param {string} reviewData.name 评审名称
 * @param {string} reviewData.description 评审描述
 * @param {number} reviewData.review_type 评审类型（1-技术评审 2-业务评审 3-产品评审）
 * @param {number} reviewData.status 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 * @param {number} reviewData.reporter_id 评审发起人用户ID
 * @param {number} reviewData.reviewer_id 评审负责人用户ID
 * @param {number} reviewData.project_id 所属项目ID
 * @param {number} reviewData.start_time 开始时间（Unix时间戳）
 * @param {number} reviewData.end_time 结束时间（Unix时间戳）
 * @returns {Object} 新创建的评审
 */
exports.createReview = async (reviewData) => {
  const { name, description, review_type = 1, status = 1, reporter_id, reviewer_id, project_id, start_time, end_time, template_id } = reviewData;

  // 检查项目是否存在
  if (project_id) {
    const project = await Project.findByPk(project_id);
    if (!project) {
      throw new Error('项目不存在');
    }
  }

  // 创建评审
  const review = await Review.create({
    name,
    description,
    review_type,
    status,
    reporter_id,
    reviewer_id,
    project_id,
    template_id, // 添加模板ID
    start_time,
    end_time,
    create_time: Date.now(),
    update_time: Date.now()
  });

  // 如果有模板ID，从模板中复制节点和任务配置
  if (template_id) {
    const template = await ReviewTemplate.findByPk(template_id, {
      include: [{ model: ReviewTemplateNode, as: 'nodes' }]
    });

    if (template && template.nodes.length > 0) {
      // 复制模板节点到评审流程节点，添加来源模板节点ID
      const reviewNodes = template.nodes.map(node => ({
        review_id: review.id,
        name: node.name,
        node_type_id: node.node_type_id,
        parent_node_id: node.parent_node_id,
        node_order: node.node_order,
        assignee_type: node.assignee_type,
        assignee_id: node.assignee_id,
        duration_limit: node.duration_limit,
        source_template_node_id: node.id, // 记录来源模板节点ID
        status: node.status,
        create_time: Date.now(),
        update_time: Date.now()
      }));

      const createdNodes = await ReviewProcessNode.bulkCreate(reviewNodes);

      // 创建模板节点到评审流程节点的ID映射
      const templateNodeIdMap = new Map();
      template.nodes.forEach((templateNode, index) => {
        templateNodeIdMap.set(templateNode.id, createdNodes[index].id);
      });

      // 复制流程节点任务关联（占位任务）
      for (const templateNode of template.nodes) {
        const templateNodeTasks = await ProcessNodeTask.findAll({
          where: {
            node_id: templateNode.id,
            node_type: 2, // 2-评审模板节点
            status: 1
          }
        });

        if (templateNodeTasks.length > 0) {
          const reviewNodeId = templateNodeIdMap.get(templateNode.id);
          const reviewNodeTasks = templateNodeTasks.map(task => ({
            node_id: reviewNodeId,
            node_type: 1, // 1-评审流程节点
            is_placeholder: task.is_placeholder,
            task_name: task.task_name,
            task_description: task.task_description,
            task_type: task.task_type,
            sort_order: task.sort_order,
            status: 1,
            create_time: Date.now(),
            update_time: Date.now()
          }));

          await ProcessNodeTask.bulkCreate(reviewNodeTasks);
        }
      }
    }
  } else {
    // 如果没有模板，检查是否有默认模板
    const defaultTemplate = await ReviewTemplate.findOne({
      where: {
        template_type: review_type,
        is_default: true,
        status: 1
      },
      include: [{ model: ReviewTemplateNode, as: 'nodes' }]
    });

    if (defaultTemplate && defaultTemplate.nodes.length > 0) {
      // 复制默认模板节点到评审流程节点，添加来源模板节点ID
      const reviewNodes = defaultTemplate.nodes.map(node => ({
        review_id: review.id,
        name: node.name,
        node_type_id: node.node_type_id,
        parent_node_id: node.parent_node_id,
        node_order: node.node_order,
        assignee_type: node.assignee_type,
        assignee_id: node.assignee_id,
        duration_limit: node.duration_limit,
        source_template_node_id: node.id, // 记录来源模板节点ID
        status: node.status,
        create_time: Date.now(),
        update_time: Date.now()
      }));

      const createdNodes = await ReviewProcessNode.bulkCreate(reviewNodes);

      // 创建模板节点到评审流程节点的ID映射
      const templateNodeIdMap = new Map();
      defaultTemplate.nodes.forEach((templateNode, index) => {
        templateNodeIdMap.set(templateNode.id, createdNodes[index].id);
      });

      // 复制流程节点任务关联（占位任务）
      for (const templateNode of defaultTemplate.nodes) {
        const templateNodeTasks = await ProcessNodeTask.findAll({
          where: {
            node_id: templateNode.id,
            node_type: 2, // 2-评审模板节点
            status: 1
          }
        });

        if (templateNodeTasks.length > 0) {
          const reviewNodeId = templateNodeIdMap.get(templateNode.id);
          const reviewNodeTasks = templateNodeTasks.map(task => ({
            node_id: reviewNodeId,
            node_type: 1, // 1-评审流程节点
            is_placeholder: task.is_placeholder,
            task_name: task.task_name,
            task_description: task.task_description,
            task_type: task.task_type,
            sort_order: task.sort_order,
            status: 1,
            create_time: Date.now(),
            update_time: Date.now()
          }));

          await ProcessNodeTask.bulkCreate(reviewNodeTasks);
        }
      }
    }
  }

  return review;
};

/**
 * 更新评审
 * @param {number} id 评审ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的评审
 */
exports.updateReview = async (id, updateData) => {
  const review = await Review.findByPk(id);
  if (!review) {
    throw new Error('评审不存在');
  }

  updateData.update_time = Date.now();
  return await review.update(updateData);
};

/**
 * 删除评审
 * @param {Array<number>} ids 评审ID列表
 * @returns {void}
 */
exports.deleteReviews = async (ids) => {
  // 先删除关联的流程节点用户
  const nodes = await ReviewProcessNode.findAll({ where: { review_id: ids } });
  const nodeIds = nodes.map(node => node.id);
  if (nodeIds.length > 0) {
    await ReviewProcessNodeUser.destroy({ where: { node_id: nodeIds } });
  }

  // 再删除关联的流程节点关系
  await ReviewProcessNodeRelation.destroy({ where: { review_id: ids } });

  // 然后删除关联的流程节点
  await ReviewProcessNode.destroy({ where: { review_id: ids } });

  // 最后删除评审
  await Review.destroy({ where: { id: ids } });
};

/**
 * 获取评审详情
 * @param {number} id 评审ID
 * @returns {Object} 评审详情
 */
exports.getReviewDetail = async (id) => {
  const review = await Review.findByPk(id, {
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'reviewer' },
      { model: Project, as: 'project' },
      { model: ReviewProcessNode, as: 'process_nodes' }
    ]
  });

  if (!review) {
    throw new Error('评审不存在');
  }

  return review;
};

/**
 * 获取评审流程节点列表
 * @param {number} reviewId 评审ID
 * @returns {Object} 评审流程节点列表和分页信息
 */
exports.getReviewProcessNodes = async (reviewId) => {
  const nodes = await ReviewProcessNode.findAll({
    where: { review_id: reviewId },
    order: [['node_order', 'ASC']]
  });

  return {
    list: nodes,
    pagination: {
      current_page: 1,
      page_size: nodes.length,
      total: nodes.length
    }
  };
};

/**
 * 创建评审流程节点
 * @param {Object} nodeData 节点数据
 * @returns {Object} 新创建的节点
 */
exports.createReviewProcessNode = async (nodeData) => {
  const { review_id } = nodeData;

  // 检查评审是否存在
  if (review_id) {
    const review = await Review.findByPk(review_id);
    if (!review) {
      throw new Error('评审不存在');
    }
  }

  nodeData.create_time = Date.now();
  nodeData.update_time = Date.now();
  return await ReviewProcessNode.create(nodeData);
};

/**
 * 更新评审流程节点
 * @param {number} id 节点ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的节点
 */
exports.updateReviewProcessNode = async (id, updateData) => {
  const node = await ReviewProcessNode.findByPk(id);
  if (!node) {
    throw new Error('节点不存在');
  }

  updateData.update_time = Date.now();
  return await node.update(updateData);
};

/**
 * 获取评审流程节点关系列表
 * @param {number} reviewId 评审ID
 * @returns {Object} 评审流程节点关系列表和分页信息
 */
exports.getReviewProcessNodeRelations = async (reviewId) => {
  const relations = await ReviewProcessNodeRelation.findAll({
    where: { review_id: reviewId }
  });

  return {
    list: relations,
    pagination: {
      current_page: 1,
      page_size: relations.length,
      total: relations.length
    }
  };
};

/**
 * 删除评审流程节点
 * @param {Array<number>} ids 节点ID列表
 * @returns {void}
 */
exports.deleteReviewProcessNodes = async (ids) => {
  await ReviewProcessNode.destroy({ where: { id: ids } });
};

/**
 * 获取评审流程节点详情
 * @param {number} nodeId 节点ID
 * @returns {Object} 节点详情
 */
exports.getReviewProcessNodeDetail = async (nodeId) => {
  const node = await ReviewProcessNode.findByPk(nodeId);
  if (!node) {
    throw new Error('节点不存在');
  }
  return node;
};

/**
 * 更新评审流程节点完成状态
 * @param {number} nodeId 节点ID
 * @param {number} completionStatus 完成状态：0-未开始 1-进行中 2-已完成
 * @returns {Object} 更新后的节点
 */
exports.updateReviewProcessNodeCompletionStatus = async (nodeId, completionStatus) => {
  const node = await ReviewProcessNode.findByPk(nodeId);
  if (!node) {
    throw new Error('节点不存在');
  }

  return await node.update({
    completion_status: completionStatus,
    update_time: Date.now()
  });
};

/**
 * 获取评审流程节点用户列表
 * @param {number} nodeId 节点ID
 * @returns {Object} 节点用户列表
 */
exports.getReviewProcessNodeUsers = async (nodeId) => {
  const users = await ReviewProcessNodeUser.findAll({
    where: { node_id: nodeId }
  });
  return {
    list: users,
    pagination: {
      current_page: 1,
      page_size: users.length,
      total: users.length
    }
  };
};

/**
 * 创建评审流程节点用户
 * @param {Object} userData 用户数据
 * @returns {Object} 新创建的用户
 */
exports.createReviewProcessNodeUser = async (userData) => {
  userData.create_time = Date.now();
  userData.update_time = Date.now();
  return await ReviewProcessNodeUser.create(userData);
};

/**
 * 删除评审流程节点用户
 * @param {Array<number>} ids 用户ID列表
 * @returns {void}
 */
exports.deleteReviewProcessNodeUsers = async (ids) => {
  await ReviewProcessNodeUser.destroy({ where: { id: ids } });
};

/**
 * 删除评审流程节点关系
 * @param {Array<number>} ids 关系ID列表
 * @returns {void}
 */
exports.deleteReviewProcessNodeRelations = async (ids) => {
  await ReviewProcessNodeRelation.destroy({ where: { id: ids } });
};

/**
 * 保存评审流程（批量保存节点和关系）
 * @param {Object} processData 流程数据
 * @param {Array} processData.nodes 节点列表
 * @param {Array} processData.relations 关系列表
 * @returns {Object} 保存后的节点和关系
 */
exports.saveReviewProcess = async (processData) => {
  const { nodes, relations } = processData;

  // 获取评审ID
  const reviewId = nodes[0]?.review_id || relations[0]?.review_id;
  if (!reviewId) {
    throw new Error('评审ID不能为空');
  }

  // 获取数据库中现有的节点和关系
  const existingNodes = await ReviewProcessNode.findAll({
    where: { review_id: reviewId }
  });
  const existingRelations = await ReviewProcessNodeRelation.findAll({
    where: { review_id: reviewId }
  });

  // 保存节点，建立原始ID到新ID的映射
  const nodeIdMap = new Map(); // 原始ID -> 新ID
  const savedNodes = [];

  for (const node of nodes) {
    if (node.id) {
      // 更新现有节点
      const updatedNode = await exports.updateReviewProcessNode(node.id, node);
      savedNodes.push(updatedNode);
      nodeIdMap.set(node.original_id, updatedNode.id); // 使用 original_id 作为映射键
    } else {
      // 创建新节点
      const newNode = await exports.createReviewProcessNode(node);
      savedNodes.push(newNode);
      nodeIdMap.set(node.original_id, newNode.id); // 使用 original_id 作为映射键
    }
  }

  // 保存关系（如果关系数组不为空）
  const savedRelations = [];
  if (relations.length > 0) {
    for (const relation of relations) {
      if (relation.id) {
        // 更新现有关系
        const existingRelation = await ReviewProcessNodeRelation.findByPk(relation.id);
        if (existingRelation) {
          const updatedRelation = await existingRelation.update({
            ...relation,
            update_time: Date.now()
          });
          savedRelations.push(updatedRelation);
        }
      } else {
        // 处理源节点和目标节点的临时ID
        let sourceNodeId = nodeIdMap.get(relation.source_node_id);
        let targetNodeId = nodeIdMap.get(relation.target_node_id);

        // 检查源节点和目标节点是否有效
        if (sourceNodeId && targetNodeId) {
          // 创建新关系
          const newRelation = await ReviewProcessNodeRelation.create({
            ...relation,
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId,
            create_time: Date.now(),
            update_time: Date.now()
          });
          savedRelations.push(newRelation);
        }
      }
    }
  }

  // 删除不存在的节点
  const nodeIds = nodes.map(node => node.id);
  for (const existingNode of existingNodes) {
    if (!nodeIds.includes(existingNode.id)) {
      await exports.deleteReviewProcessNodes([existingNode.id]);
    }
  }

  // 删除不存在的关系
  if (relations.length > 0) {
    const relationIds = relations.map(relation => relation.id);
    for (const existingRelation of existingRelations) {
      if (!relationIds.includes(existingRelation.id)) {
        await exports.deleteReviewProcessNodeRelations([existingRelation.id]);
      }
    }
  }

  return {
    nodes: savedNodes,
    relations: savedRelations
  };
};
