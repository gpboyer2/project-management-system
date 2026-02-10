/**
 * 任务文件关联服务
 * 处理任务与文件的关联关系
 */
const { TaskFile, File, Task } = require('../../database/models');

/**
 * 获取任务文件列表
 * @param {Object} params 查询参数
 * @param {number} params.task_id 任务ID
 * @param {number} params.file_type 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 * @returns {Object} 文件列表
 */
exports.getTaskFiles = async (params) => {
  const { task_id, file_type } = params;
  const where = {};

  if (task_id) {
    where.task_id = task_id;
  }

  if (file_type !== undefined) {
    where.file_type = file_type;
  }

  where.status = 1; // 只返回正常状态的关联

  const taskFiles = await TaskFile.findAll({
    where,
    include: [{ model: File, as: 'file' }],
    order: [['sort_order', 'ASC']]
  });

  return {
    list: taskFiles,
    pagination: {
      current_page: 1,
      page_size: taskFiles.length,
      total: taskFiles.length
    }
  };
};

/**
 * 创建任务文件关联
 * @param {Object} taskFileData 关联数据
 * @param {number} taskFileData.task_id 任务ID
 * @param {number} taskFileData.file_id 文件ID
 * @param {number} taskFileData.file_type 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 * @param {number} taskFileData.sort_order 排序顺序
 * @returns {Object} 新创建的关联
 */
exports.createTaskFile = async (taskFileData) => {
  const { task_id, file_id, file_type, sort_order = 0 } = taskFileData;

  // 验证任务是否存在
  const task = await Task.findByPk(task_id);
  if (!task) {
    throw new Error('任务不存在');
  }

  // 验证文件是否存在
  const file = await File.findByPk(file_id);
  if (!file) {
    throw new Error('文件不存在');
  }

  // 检查关联是否已存在
  const existing = await TaskFile.findOne({
    where: {
      task_id,
      file_id,
      status: 1
    }
  });

  if (existing) {
    throw new Error('文件已关联到该任务');
  }

  const taskFile = await TaskFile.create({
    task_id,
    file_id,
    file_type,
    sort_order,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  });

  return taskFile;
};

/**
 * 更新任务文件关联
 * @param {number} id 关联ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的关联
 */
exports.updateTaskFile = async (id, updateData) => {
  const taskFile = await TaskFile.findByPk(id);
  if (!taskFile) {
    throw new Error('任务文件关联不存在');
  }

  updateData.update_time = Date.now();
  return await taskFile.update(updateData);
};

/**
 * 删除任务文件关联
 * @param {Array<number>} ids 关联ID列表
 * @returns {void}
 */
exports.deleteTaskFiles = async (ids) => {
  await TaskFile.update({
    status: 0,
    update_time: Date.now()
  }, { where: { id: ids } });
};

/**
 * 获取任务文件关联详情
 * @param {number} id 关联ID
 * @returns {Object} 关联详情
 */
exports.getTaskFileDetail = async (id) => {
  const taskFile = await TaskFile.findByPk(id, {
    include: [{ model: File, as: 'file' }]
  });
  if (!taskFile) {
    throw new Error('任务文件关联不存在');
  }
  return taskFile;
};

/**
 * 为任务添加文件
 * @param {number} taskId 任务ID
 * @param {Array<number>} fileIds 文件ID列表
 * @param {number} fileType 文件类型
 * @returns {void}
 */
exports.addFilesToTask = async (taskId, fileIds, fileType) => {
  // 验证任务是否存在
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }

  // 获取当前任务已关联的文件
  const existingTaskFiles = await TaskFile.findAll({
    where: { task_id: taskId, status: 1 }
  });

  // 过滤掉已关联的文件
  const newFileIds = fileIds.filter(fileId =>
    !existingTaskFiles.some(tf => tf.file_id === fileId)
  );

  if (newFileIds.length === 0) {
    return;
  }

  // 创建新的任务文件关联
  const taskFiles = newFileIds.map((fileId, index) => ({
    task_id: taskId,
    file_id: fileId,
    file_type: fileType,
    sort_order: existingTaskFiles.length + index,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  }));

  await TaskFile.bulkCreate(taskFiles);
};

/**
 * 从任务中移除文件
 * @param {number} taskId 任务ID
 * @param {Array<number>} fileIds 文件ID列表
 * @returns {void}
 */
exports.removeFilesFromTask = async (taskId, fileIds) => {
  await TaskFile.destroy({
    where: {
      task_id: taskId,
      file_id: fileIds
    }
  });
};

/**
 * 为任务设置文件（替换所有关联）
 * @param {number} taskId 任务ID
 * @param {Array<number>} fileIds 文件ID列表
 * @param {number} fileType 文件类型
 * @returns {void}
 */
exports.setTaskFiles = async (taskId, fileIds, fileType) => {
  // 验证任务是否存在
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }

  // 获取当前任务已关联的文件
  const existingTaskFiles = await TaskFile.findAll({
    where: { task_id: taskId, status: 1 }
  });

  // 删除不存在于新列表中的关联
  const existingFileIds = existingTaskFiles.map(tf => tf.file_id);
  const filesToRemove = existingFileIds.filter(fileId => !fileIds.includes(fileId));
  if (filesToRemove.length > 0) {
    await exports.removeFilesFromTask(taskId, filesToRemove);
  }

  // 添加新的关联
  const newFileIds = fileIds.filter(fileId => !existingFileIds.includes(fileId));
  if (newFileIds.length > 0) {
    await exports.addFilesToTask(taskId, newFileIds, fileType);
  }
};

/**
 * 批量创建任务文件关联
 * @param {Array<Object>} taskFilesData 任务文件关联数据列表
 * @returns {void}
 */
exports.bulkCreateTaskFiles = async (taskFilesData) => {
  // 验证任务和文件是否存在
  const taskIds = [...new Set(taskFilesData.map(tf => tf.task_id))];
  const fileIds = [...new Set(taskFilesData.map(tf => tf.file_id))];

  const tasks = await Task.findAll({ where: { id: taskIds } });
  const files = await File.findAll({ where: { id: fileIds } });

  if (tasks.length !== taskIds.length) {
    const missingTaskIds = taskIds.filter(id => !tasks.some(task => task.id === id));
    throw new Error(`任务不存在: ${missingTaskIds.join(', ')}`);
  }

  if (files.length !== fileIds.length) {
    const missingFileIds = fileIds.filter(id => !files.some(file => file.id === id));
    throw new Error(`文件不存在: ${missingFileIds.join(', ')}`);
  }

  // 检查是否有重复关联
  const uniqueKeyMap = new Map();
  const uniqueData = [];

  for (const data of taskFilesData) {
    const key = `${data.task_id}_${data.file_id}`;
    if (!uniqueKeyMap.has(key)) {
      uniqueKeyMap.set(key, true);
      uniqueData.push({
        ...data,
        status: 1,
        create_time: Date.now(),
        update_time: Date.now()
      });
    }
  }

  await TaskFile.bulkCreate(uniqueData);
};

/**
 * 复制任务文件关联（用于任务复制）
 * @param {number} sourceTaskId 源任务ID
 * @param {number} targetTaskId 目标任务ID
 * @returns {void}
 */
exports.copyTaskFiles = async (sourceTaskId, targetTaskId) => {
  const sourceTaskFiles = await TaskFile.findAll({
    where: {
      task_id: sourceTaskId,
      status: 1
    }
  });

  if (sourceTaskFiles.length > 0) {
    const targetTaskFiles = sourceTaskFiles.map(tf => ({
      task_id: targetTaskId,
      file_id: tf.file_id,
      file_type: tf.file_type,
      sort_order: tf.sort_order,
      status: 1,
      create_time: Date.now(),
      update_time: Date.now()
    }));

    await TaskFile.bulkCreate(targetTaskFiles);
  }
};
