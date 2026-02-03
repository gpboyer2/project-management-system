/**
 * 任务管理服务
 * 处理任务管理的业务逻辑
 */
const { Task, User, Requirement, Review, RequirementProcessNode, ReviewProcessNode } = require('../../database/models');

/**
 * 获取任务列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.requirementId 需求ID
 * @param {number} params.reviewId 评审ID
 * @param {number} params.status 任务状态
 * @returns {Object} 任务列表和分页信息
 */
exports.getTaskList = async (params) => {
  const { current_page = 1, page_size = 20, requirementId, reviewId, status } = params;
  const where = {};

  if (requirementId) {
    where.requirement_id = requirementId;
  }

  if (reviewId) {
    where.review_id = reviewId;
  }

  if (status) {
    where.status_id = status;
  }

  const { count, rows } = await Task.findAndCountAll({
    where,
    offset: (current_page - 1) * page_size,
    limit: parseInt(page_size),
    order: [['create_time', 'DESC']],
    include: [
      { model: User, as: 'assignee' },
      { model: User, as: 'reporter' },
      { model: Requirement, as: 'requirement' },
      { model: Review, as: 'review' },
      { model: RequirementProcessNode, as: 'requirement_node' },
      { model: ReviewProcessNode, as: 'review_node' }
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
 * 创建任务
 * @param {Object} taskData 任务数据
 * @param {string} taskData.name 任务名称
 * @param {string} taskData.description 任务描述
 * @param {number} taskData.priority 优先级（1-P0 2-P1 3-P2 4-P3）
 * @param {number} taskData.status_id 任务状态ID
 * @param {number} taskData.assignee_id 负责人用户ID
 * @param {number} taskData.reporter_id 创建人用户ID
 * @param {number} taskData.requirement_id 关联需求ID
 * @param {number} taskData.review_id 关联评审ID
 * @param {number} taskData.requirement_node_id 需求管理流程节点ID
 * @param {number} taskData.review_node_id 评审管理流程节点ID
 * @param {number} taskData.estimated_hours 预估工时(小时)
 * @param {number} taskData.actual_hours 实际工时(小时)
 * @param {number} taskData.start_time 开始时间（Unix时间戳）
 * @param {number} taskData.end_time 结束时间（Unix时间戳）
 * @returns {Object} 新创建的任务
 */
exports.createTask = async (taskData) => {
  const { name, description, priority, status_id, assignee_id, reporter_id, requirement_id, review_id, requirement_node_id, review_node_id, estimated_hours, actual_hours, start_time, end_time } = taskData;

  // 检查需求是否存在
  if (requirement_id) {
    const requirement = await Requirement.findByPk(requirement_id);
    if (!requirement) {
      throw new Error('需求不存在');
    }
  }

  // 检查评审是否存在
  if (review_id) {
    const review = await Review.findByPk(review_id);
    if (!review) {
      throw new Error('评审不存在');
    }
  }

  // 检查需求管理流程节点是否存在
  if (requirement_node_id) {
    const requirementNode = await RequirementProcessNode.findByPk(requirement_node_id);
    if (!requirementNode) {
      throw new Error('需求管理流程节点不存在');
    }
  }

  // 检查评审管理流程节点是否存在
  if (review_node_id) {
    const reviewNode = await ReviewProcessNode.findByPk(review_node_id);
    if (!reviewNode) {
      throw new Error('评审管理流程节点不存在');
    }
  }

  return await Task.create({
    name,
    description,
    priority,
    status_id,
    assignee_id,
    reporter_id,
    requirement_id,
    review_id,
    requirement_node_id,
    review_node_id,
    estimated_hours,
    actual_hours,
    start_time,
    end_time,
    create_time: Date.now(),
    update_time: Date.now()
  });
};

/**
 * 更新任务
 * @param {number} id 任务ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的任务
 */
exports.updateTask = async (id, updateData) => {
  const task = await Task.findByPk(id);
  if (!task) {
    throw new Error('任务不存在');
  }

  updateData.update_time = Date.now();
  return await task.update(updateData);
};

/**
 * 删除任务
 * @param {Array<number>} ids 任务ID列表
 * @returns {void}
 */
exports.deleteTasks = async (ids) => {
  await Task.destroy({ where: { id: ids } });
};

/**
 * 获取任务详情
 * @param {number} id 任务ID
 * @returns {Object} 任务详情
 */
exports.getTaskDetail = async (id) => {
  const task = await Task.findByPk(id, {
    include: [
      { model: User, as: 'assignee' },
      { model: User, as: 'reporter' },
      { model: Requirement, as: 'requirement' },
      { model: Review, as: 'review' },
      { model: RequirementProcessNode, as: 'requirement_node' },
      { model: ReviewProcessNode, as: 'review_node' }
    ]
  });

  if (!task) {
    throw new Error('任务不存在');
  }

  return task;
};
