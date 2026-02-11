/**
 * 评审流程模板管理服务
 * 处理评审流程模板的业务逻辑
 */
const { ReviewTemplate, ReviewTemplateNode, ProcessNodeType, User, ProcessNodeTask } = require('../../database/models');
const processNodeTaskService = require('./processNodeTask');

/**
 * 获取评审模板列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.template_type 模板类型（1-技术评审 2-业务评审 3-产品评审）
 * @param {number} params.status 状态（1-启用 0-禁用）
 * @returns {Object} 模板列表和分页信息
 */
exports.getReviewTemplateList = async (params) => {
  const { current_page = 1, page_size = 20, template_type, status } = params;
  const where = {};

  if (template_type) {
    where.template_type = template_type;
  }

  if (status !== undefined) {
    where.status = status;
  }

  const { count, rows } = await ReviewTemplate.findAndCountAll({
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
 * 获取模板详情（含模板节点）
 * @param {number} id 模板ID
 * @returns {Object} 模板详情
 */
exports.getReviewTemplateById = async (id) => {
  const template = await ReviewTemplate.findByPk(id, {
    include: [
      {
        model: ReviewTemplateNode,
        as: 'nodes',
        include: [
          { model: ProcessNodeType, as: 'nodeType' },
          { model: User, as: 'assignee' }
        ],
        order: [['node_order', 'ASC']]
      }
    ]
  });

  if (!template) {
    throw new Error('模板不存在');
  }

  return template;
};

/**
 * 获取默认模板
 * @param {number} template_type 模板类型
 * @returns {Object} 默认模板
 */
exports.getDefaultReviewTemplate = async (template_type = 1) => {
  const template = await ReviewTemplate.findOne({
    where: {
      template_type,
      is_default: true,
      status: 1
    },
    include: [
      {
        model: ReviewTemplateNode,
        as: 'nodes',
        include: [
          { model: ProcessNodeType, as: 'nodeType' },
          { model: User, as: 'assignee' }
        ],
        order: [['node_order', 'ASC']]
      }
    ]
  });

  return template;
};

/**
 * 创建评审模板
 * @param {Object} templateData 模板数据
 * @param {string} templateData.name 模板名称
 * @param {string} templateData.description 模板描述
 * @param {number} templateData.template_type 模板类型（1-技术评审 2-业务评审 3-产品评审）
 * @param {boolean} templateData.is_default 是否为默认模板
 * @param {Array} templateData.nodes 模板节点数据
 * @returns {Object} 新创建的模板
 */
exports.createReviewTemplate = async (templateData) => {
  const { name, description, template_type = 1, is_default = false, nodes = [] } = templateData;

  // 如果设置为默认模板，需要将其他同类型的默认模板取消
  if (is_default) {
    await ReviewTemplate.update(
      { is_default: false },
      { where: { template_type, is_default: true } }
    );
  }

  // 创建模板
  const template = await ReviewTemplate.create({
    name,
    description,
    template_type,
    is_default,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  });

  // 创建模板节点
  if (nodes.length > 0) {
    const templateNodes = nodes.map((node, index) => ({
      template_id: template.id,
      name: node.name,
      node_type_id: node.node_type_id,
      parent_node_id: node.parent_node_id || null,
      node_order: node.node_order || index,
      assignee_type: node.assignee_type,
      assignee_id: node.assignee_id,
      duration_limit: node.duration_limit,
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
    }));

    const createdNodes = await ReviewTemplateNode.bulkCreate(templateNodes);

    // 为每个模板节点添加任务占位
    for (let i = 0; i < createdNodes.length; i++) {
      const createdNode = createdNodes[i];
      const nodeData = nodes[i];

      // 获取节点类型配置
      const processNodeType = await ProcessNodeType.findByPk(nodeData.node_type_id);
      if (processNodeType && processNodeType.tasks) {
        // 添加任务占位
        const placeholderTasks = processNodeType.tasks.map(task => ({
          task_name: task.name,
          task_description: task.description,
          task_type: task.task_type || 1
        }));

        await processNodeTaskService.addPlaceholderTasksToNode(
          createdNode.id,
          2, // 2-评审模板节点
          placeholderTasks
        );
      }
    }
  }

  // 返回包含节点的模板详情
  return await exports.getReviewTemplateById(template.id);
};

/**
 * 更新评审模板
 * @param {number} id 模板ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的模板
 */
exports.updateReviewTemplate = async (id, updateData) => {
  const template = await ReviewTemplate.findByPk(id);
  if (!template) {
    throw new Error('模板不存在');
  }

  const { name, description, template_type, is_default, nodes = [] } = updateData;

  // 如果设置为默认模板，需要将其他同类型的默认模板取消
  if (is_default && !template.is_default) {
    await ReviewTemplate.update(
      { is_default: false },
      { where: { template_type: template_type || template.template_type, is_default: true } }
    );
  }

  // 更新模板基本信息
  await template.update({
    name: name || template.name,
    description: description !== undefined ? description : template.description,
    template_type: template_type !== undefined ? template_type : template.template_type,
    is_default: is_default !== undefined ? is_default : template.is_default,
    update_time: Date.now()
  });

  // 更新模板节点（先删除旧节点，再创建新节点）
  await ReviewTemplateNode.destroy({ where: { template_id: id } });
  if (nodes.length > 0) {
    const templateNodes = nodes.map((node, index) => ({
      template_id: id,
      name: node.name,
      node_type_id: node.node_type_id,
      parent_node_id: node.parent_node_id || null,
      node_order: node.node_order || index,
      assignee_type: node.assignee_type,
      assignee_id: node.assignee_id,
      duration_limit: node.duration_limit,
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
    }));

    const createdNodes = await ReviewTemplateNode.bulkCreate(templateNodes);

    // 为每个模板节点添加任务占位
    for (let i = 0; i < createdNodes.length; i++) {
      const createdNode = createdNodes[i];
      const nodeData = nodes[i];

      // 获取节点类型配置
      const processNodeType = await ProcessNodeType.findByPk(nodeData.node_type_id);
      if (processNodeType && processNodeType.tasks) {
        // 添加任务占位
        const placeholderTasks = processNodeType.tasks.map(task => ({
          task_name: task.name,
          task_description: task.description,
          task_type: task.task_type || 1
        }));

        await processNodeTaskService.addPlaceholderTasksToNode(
          createdNode.id,
          2, // 2-评审模板节点
          placeholderTasks
        );
      }
    }
  }

  // 返回包含节点的模板详情
  return await exports.getReviewTemplateById(id);
};

/**
 * 删除评审模板
 * @param {number} id 模板ID
 */
exports.deleteReviewTemplate = async (id) => {
  const template = await ReviewTemplate.findByPk(id);
  if (!template) {
    throw new Error('模板不存在');
  }

  // 删除模板节点
  await ReviewTemplateNode.destroy({ where: { template_id: id } });

  // 删除模板
  await template.destroy();
};

/**
 * 启用/禁用评审模板
 * @param {number} id 模板ID
 * @param {number} status 状态：1-启用 0-禁用
 */
exports.updateReviewTemplateStatus = async (id, status) => {
  const template = await ReviewTemplate.findByPk(id);
  if (!template) {
    throw new Error('模板不存在');
  }

  await template.update({
    status,
    update_time: Date.now()
  });
};

/**
 * 深拷贝评审模板
 * @param {number} sourceTemplateId 源模板ID
 * @param {Object} options 拷贝选项
 * @param {string} options.newName 新模板名称
 * @param {string} options.newDescription 新模板描述
 * @param {boolean} options.isDefault 是否设置为默认模板
 * @returns {Object} 新创建的模板
 */
exports.copyReviewTemplate = async (sourceTemplateId, options = {}) => {
  const sourceTemplate = await exports.getReviewTemplateById(sourceTemplateId);
  if (!sourceTemplate) {
    throw new Error('源模板不存在');
  }

  // 设置新模板属性
  const newTemplateData = {
    name: options.newName || `${sourceTemplate.name}（副本）`,
    description: options.newDescription || sourceTemplate.description,
    template_type: sourceTemplate.template_type,
    is_default: options.isDefault || false,
    nodes: []
  };

  // 如果设置为默认模板，需要将其他同类型的默认模板取消
  if (newTemplateData.is_default) {
    await ReviewTemplate.update(
      { is_default: false },
      { where: { template_type: newTemplateData.template_type, is_default: true } }
    );
  }

  // 创建新模板
  const newTemplate = await ReviewTemplate.create({
    ...newTemplateData,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  });

  // 复制模板节点
  if (sourceTemplate.nodes && sourceTemplate.nodes.length > 0) {
    const templateNodes = sourceTemplate.nodes.map((node, index) => ({
      template_id: newTemplate.id,
      name: node.name,
      node_type_id: node.node_type_id,
      parent_node_id: node.parent_node_id,
      node_order: node.node_order || index,
      assignee_type: node.assignee_type,
      assignee_id: node.assignee_id,
      duration_limit: node.duration_limit,
      has_tasks: node.has_tasks,
      task_config: node.task_config,
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
    }));

    const createdNodes = await ReviewTemplateNode.bulkCreate(templateNodes);

    // 复制流程节点任务关联
    // 创建源节点ID到新节点ID的映射
    const nodeIdMap = new Map();
    sourceTemplate.nodes.forEach((sourceNode, index) => {
      nodeIdMap.set(sourceNode.id, createdNodes[index].id);
    });

    // 复制流程节点任务关联
    for (const sourceNode of sourceTemplate.nodes) {
      const sourceTasks = await ProcessNodeTask.findAll({
        where: {
          node_id: sourceNode.id,
          node_type: 2, // 2-评审模板节点
          status: 1
        }
      });

      if (sourceTasks.length > 0) {
        const targetNodeId = nodeIdMap.get(sourceNode.id);
        const targetTasks = sourceTasks.map(task => ({
          node_id: targetNodeId,
          node_type: 2, // 2-评审模板节点
          is_placeholder: task.is_placeholder,
          task_name: task.task_name,
          task_description: task.task_description,
          task_type: task.task_type,
          sort_order: task.sort_order,
          status: 1,
          create_time: Date.now(),
          update_time: Date.now()
        }));

        await ProcessNodeTask.bulkCreate(targetTasks);
      }
    }
  }

  // 返回包含节点的新模板详情
  return await exports.getReviewTemplateById(newTemplate.id);
};

/**
 * 设置默认模板
 * @param {number} id 模板ID
 */
exports.setDefaultReviewTemplate = async (id) => {
  const template = await ReviewTemplate.findByPk(id);
  if (!template) {
    throw new Error('模板不存在');
  }

  // 将其他同类型的默认模板取消
  await ReviewTemplate.update(
    { is_default: false },
    { where: { template_type: template.template_type, is_default: true } }
  );

  // 设置当前模板为默认模板
  await template.update({
    is_default: true,
    update_time: Date.now()
  });
};
