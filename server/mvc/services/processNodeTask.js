/**
 * 流程节点任务关联服务
 * 处理流程节点与任务的关联关系，支持占位任务管理
 */
const { ProcessNodeTask, Task, ReviewProcessNode, ReviewTemplateNode } = require('../../database/models');

/**
 * 获取流程节点任务列表
 * @param {Object} params 查询参数
 * @param {number} params.node_id 流程节点ID
 * @param {number} params.node_type 节点类型：1-评审流程节点 2-评审模板节点
 * @param {boolean} params.is_placeholder 是否占位任务
 * @returns {Object} 任务列表
 */
exports.getProcessNodeTasks = async (params) => {
  const { node_id, node_type, is_placeholder } = params;
  const where = {};

  if (node_id) {
    where.node_id = node_id;
  }

  if (node_type !== undefined) {
    where.node_type = node_type;
  }

  if (is_placeholder !== undefined) {
    where.is_placeholder = is_placeholder;
  }

  where.status = 1; // 只返回正常状态的关联

  const tasks = await ProcessNodeTask.findAll({
    where,
    include: is_placeholder ? [] : [{ model: Task, as: 'task' }],
    order: [['sort_order', 'ASC']]
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
 * 创建流程节点任务关联
 * @param {Object} taskData 关联数据
 * @param {number} taskData.node_id 流程节点ID
 * @param {number} taskData.task_id 任务ID（占位任务时为null）
 * @param {number} taskData.node_type 节点类型：1-评审流程节点 2-评审模板节点
 * @param {boolean} taskData.is_placeholder 是否占位任务：true-占位任务 false-实际任务
 * @param {string} taskData.task_name 任务名称（占位任务时必填）
 * @param {string} taskData.task_description 任务描述（占位任务时可选）
 * @param {number} taskData.task_type 任务类型：1-必填 2-可选
 * @param {number} taskData.sort_order 排序顺序
 * @returns {Object} 新创建的关联
 */
exports.createProcessNodeTask = async (taskData) => {
  const {
    node_id,
    task_id,
    node_type = 1,
    is_placeholder = false,
    task_name,
    task_description,
    task_type = 1,
    sort_order = 0
  } = taskData;

  // 验证节点是否存在
  if (node_type === 1) {
    // 评审流程节点
    const node = await ReviewProcessNode.findByPk(node_id);
    if (!node) {
      throw new Error('评审流程节点不存在');
    }
  } else if (node_type === 2) {
    // 评审模板节点
    const node = await ReviewTemplateNode.findByPk(node_id);
    if (!node) {
      throw new Error('评审模板节点不存在');
    }
  }

  // 验证任务是否存在（如果不是占位任务）
  if (!is_placeholder && task_id) {
    const task = await Task.findByPk(task_id);
    if (!task) {
      throw new Error('任务不存在');
    }
  }

  // 占位任务必须有任务名称
  if (is_placeholder && !task_name) {
    throw new Error('占位任务必须填写任务名称');
  }

  const processNodeTask = await ProcessNodeTask.create({
    node_id,
    task_id,
    node_type,
    is_placeholder,
    task_name,
    task_description,
    task_type,
    sort_order,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  });

  return processNodeTask;
};

/**
 * 更新流程节点任务关联
 * @param {number} id 关联ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的关联
 */
exports.updateProcessNodeTask = async (id, updateData) => {
  const processNodeTask = await ProcessNodeTask.findByPk(id);
  if (!processNodeTask) {
    throw new Error('流程节点任务关联不存在');
  }

  // 如果更新了 task_id，验证任务是否存在
  if (updateData.task_id && !updateData.is_placeholder) {
    const task = await Task.findByPk(updateData.task_id);
    if (!task) {
      throw new Error('任务不存在');
    }
  }

  // 如果是占位任务，确保有任务名称
  if (updateData.is_placeholder && !updateData.task_name && !processNodeTask.task_name) {
    throw new Error('占位任务必须填写任务名称');
  }

  updateData.update_time = Date.now();
  return await processNodeTask.update(updateData);
};

/**
 * 删除流程节点任务关联
 * @param {Array<number>} ids 关联ID列表
 * @returns {void}
 */
exports.deleteProcessNodeTasks = async (ids) => {
  await ProcessNodeTask.update({
    status: 0,
    update_time: Date.now()
  }, { where: { id: ids } });
};

/**
 * 获取流程节点任务关联详情
 * @param {number} id 关联ID
 * @returns {Object} 关联详情
 */
exports.getProcessNodeTaskDetail = async (id) => {
  const processNodeTask = await ProcessNodeTask.findByPk(id, {
    include: !processNodeTask?.is_placeholder ? [{ model: Task, as: 'task' }] : []
  });
  if (!processNodeTask) {
    throw new Error('流程节点任务关联不存在');
  }
  return processNodeTask;
};

/**
 * 为流程节点添加任务
 * @param {number} nodeId 流程节点ID
 * @param {number} nodeType 节点类型：1-评审流程节点 2-评审模板节点
 * @param {Array<number>} taskIds 任务ID列表
 * @returns {void}
 */
exports.addTasksToNode = async (nodeId, nodeType, taskIds) => {
  // 验证节点是否存在
  if (nodeType === 1) {
    const node = await ReviewProcessNode.findByPk(nodeId);
    if (!node) {
      throw new Error('评审流程节点不存在');
    }
  } else if (nodeType === 2) {
    const node = await ReviewTemplateNode.findByPk(nodeId);
    if (!node) {
      throw new Error('评审模板节点不存在');
    }
  }

  // 获取当前节点已关联的任务
  const existingTasks = await ProcessNodeTask.findAll({
    where: { node_id: nodeId, node_type: nodeType, status: 1 }
  });

  // 过滤掉已关联的任务
  const newTaskIds = taskIds.filter(taskId =>
    !existingTasks.some(pt => pt.task_id === taskId)
  );

  if (newTaskIds.length === 0) {
    return;
  }

  // 创建新的任务关联
  const nodeTasks = newTaskIds.map((taskId, index) => ({
    node_id: nodeId,
    task_id: taskId,
    node_type: nodeType,
    is_placeholder: false,
    sort_order: existingTasks.length + index,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  }));

  await ProcessNodeTask.bulkCreate(nodeTasks);
};

/**
 * 从流程节点中移除任务
 * @param {number} nodeId 流程节点ID
 * @param {number} nodeType 节点类型：1-评审流程节点 2-评审模板节点
 * @param {Array<number>} taskIds 任务ID列表
 * @returns {void}
 */
exports.removeTasksFromNode = async (nodeId, nodeType, taskIds) => {
  await ProcessNodeTask.destroy({
    where: {
      node_id: nodeId,
      node_type: nodeType,
      task_id: taskIds
    }
  });
};

/**
 * 为流程节点添加占位任务
 * @param {number} nodeId 流程节点ID
 * @param {number} nodeType 节点类型：1-评审流程节点 2-评审模板节点
 * @param {Array<Object>} placeholderTasks 占位任务数据列表
 * @returns {void}
 */
exports.addPlaceholderTasksToNode = async (nodeId, nodeType, placeholderTasks) => {
  // 验证节点是否存在
  if (nodeType === 1) {
    const node = await ReviewProcessNode.findByPk(nodeId);
    if (!node) {
      throw new Error('评审流程节点不存在');
    }
  } else if (nodeType === 2) {
    const node = await ReviewTemplateNode.findByPk(nodeId);
    if (!node) {
      throw new Error('评审模板节点不存在');
    }
  }

  // 验证占位任务数据
  const validTasks = placeholderTasks.filter(task => task.task_name);
  if (validTasks.length === 0) {
    return;
  }

  // 获取当前节点已关联的任务数量，用于排序
  const existingCount = await ProcessNodeTask.count({
    where: { node_id: nodeId, node_type: nodeType, status: 1 }
  });

  // 创建占位任务关联
  const nodeTasks = validTasks.map((task, index) => ({
    node_id: nodeId,
    node_type: nodeType,
    is_placeholder: true,
    task_name: task.task_name,
    task_description: task.task_description,
    task_type: task.task_type || 1,
    sort_order: existingCount + index,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  }));

  await ProcessNodeTask.bulkCreate(nodeTasks);
};

/**
 * 复制流程节点任务关联（用于模板深拷贝）
 * @param {number} sourceNodeId 源节点ID
 * @param {number} sourceNodeType 源节点类型：1-评审流程节点 2-评审模板节点
 * @param {number} targetNodeId 目标节点ID
 * @param {number} targetNodeType 目标节点类型：1-评审流程节点 2-评审模板节点
 * @returns {void}
 */
exports.copyProcessNodeTasks = async (sourceNodeId, sourceNodeType, targetNodeId, targetNodeType) => {
  const sourceTasks = await ProcessNodeTask.findAll({
    where: {
      node_id: sourceNodeId,
      node_type: sourceNodeType,
      status: 1
    }
  });

  if (sourceTasks.length > 0) {
    const targetTasks = sourceTasks.map(task => ({
      node_id: targetNodeId,
      node_type: targetNodeType,
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
};
