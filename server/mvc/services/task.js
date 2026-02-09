/**
 * 任务管理服务
 * 处理任务管理的业务逻辑
 */
const { Task, Requirement, Review, RequirementProcessNode, ReviewProcessNode } = require('../../database/models');

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
  const task = await Task.findByPk(id);

  if (!task) {
    throw new Error('任务不存在');
  }

  return task;
};

/**
 * 获取节点任务列表
 * @param {number} nodeId 节点ID
 * @param {string} nodeType 节点类型：requirement 或 review
 * @returns {Object} 任务列表和分页信息
 */
exports.getNodeTaskList = async (nodeId, nodeType) => {
  const where = {};

  if (nodeType === 'requirement') {
    where.requirement_node_id = nodeId;
  } else if (nodeType === 'review') {
    where.review_node_id = nodeId;
  }

const tasks = await Task.findAll({
    where,
    order: [['create_time', 'DESC']]
  });

  return {
    list: tasks,
    pagination: {
      current_page: 1,
      page_size: tasks.length,
      total: tasks.length
    }
  };
};

/**
 * 绑定任务到节点
 * @param {number} taskId 任务ID
 * @param {number} nodeId 节点ID
 * @param {string} nodeType 节点类型：requirement 或 review
 * @returns {Object} 更新后的任务
 */
exports.bindTaskToNode = async (taskId, nodeId, nodeType) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }

  const updateData = {
    update_time: Date.now()
  };

  if (nodeType === 'requirement') {
    const requirementNode = await RequirementProcessNode.findByPk(nodeId);
    if (!requirementNode) {
      throw new Error('需求管理流程节点不存在');
    }
    updateData.requirement_node_id = nodeId;
  } else if (nodeType === 'review') {
    const reviewNode = await ReviewProcessNode.findByPk(nodeId);
    if (!reviewNode) {
      throw new Error('评审管理流程节点不存在');
    }
    updateData.review_node_id = nodeId;
  }

  return await task.update(updateData);
};

/**
 * 解绑任务与节点
 * @param {number} taskId 任务ID
 * @param {string} nodeType 节点类型：requirement 或 review
 * @returns {Object} 更新后的任务
 */
exports.unbindTaskFromNode = async (taskId, nodeType) => {
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }

  const updateData = {
    update_time: Date.now()
  };

  if (nodeType === 'requirement') {
    updateData.requirement_node_id = null;
  } else if (nodeType === 'review') {
    updateData.review_node_id = null;
  }

  return await task.update(updateData);
};

/**
 * 获取子任务列表
 * @param {number} parentTaskId 父任务ID
 * @returns {Object} 子任务列表和分页信息
 */
exports.getSubTaskList = async (parentTaskId) => {
const tasks = await Task.findAll({
    where: { parent_task_id: parentTaskId },
    order: [['create_time', 'DESC']]
  });

  return {
    list: tasks,
    pagination: {
      current_page: 1,
      page_size: tasks.length,
      total: tasks.length
    }
  };
};

/**
 * 创建子任务
 * @param {Object} taskData 任务数据
 * @param {number} parentTaskId 父任务ID
 * @returns {Object} 新创建的子任务
 */
exports.createSubTask = async (taskData, parentTaskId) => {
  // 检查父任务是否存在
  const parentTask = await Task.findByPk(parentTaskId);
  if (!parentTask) {
    throw new Error('父任务不存在');
  }

  // 继承父任务的一些属性
  taskData.parent_task_id = parentTaskId;
  taskData.requirement_id = taskData.requirement_id || parentTask.requirement_id;
  taskData.review_id = taskData.review_id || parentTask.review_id;
  taskData.requirement_node_id = taskData.requirement_node_id || parentTask.requirement_node_id;
  taskData.review_node_id = taskData.review_node_id || parentTask.review_node_id;

  return await exports.createTask(taskData);
};

/**
 * 获取任务树（包含子任务）
 * @param {number} taskId 任务ID
 * @returns {Object} 任务树
 */
exports.getTaskTree = async (taskId) => {
  const task = await exports.getTaskDetail(taskId);
  const subTasks = await exports.getSubTaskList(taskId);

  return {
    ...task.toJSON(),
    sub_tasks: subTasks.list
  };
};
