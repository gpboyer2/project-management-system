/**
 * 评审流程模板管理服务
 * 处理评审流程模板的业务逻辑
 */
const { ReviewTemplate, ReviewTemplateNode, ProcessNodeType, User } = require('../../database/models');

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

    await ReviewTemplateNode.bulkCreate(templateNodes);
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

    await ReviewTemplateNode.bulkCreate(templateNodes);
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
