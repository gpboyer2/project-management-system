/**
 * 文件管理服务
 * 处理文件上传、下载、删除、查询等业务逻辑
 */
const { File, TaskFile, Task } = require('../../database/models');

/**
 * 获取文件列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.business_type 业务类型：1-需求 2-任务 3-评审 4-项目
 * @param {number} params.business_id 业务ID
 * @param {number} params.uploader_id 上传用户ID
 * @returns {Object} 文件列表和分页信息
 */
exports.getFileList = async (params) => {
  const { current_page = 1, page_size = 20, business_type, business_id, uploader_id } = params;
  const where = {};

  if (business_type) {
    where.business_type = business_type;
  }

  if (business_id) {
    where.business_id = business_id;
  }

  if (uploader_id) {
    where.uploader_id = uploader_id;
  }

  where.status = 1; // 只返回正常状态的文件

  const { count, rows } = await File.findAndCountAll({
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
 * 创建文件记录
 * @param {Object} fileData 文件数据
 * @param {string} fileData.file_name 文件名
 * @param {string} fileData.file_path 文件存储路径
 * @param {number} fileData.file_size 文件大小(字节)
 * @param {string} fileData.file_type 文件类型(如: image/png, application/pdf)
 * @param {number} fileData.business_type 业务类型：1-需求 2-任务 3-评审 4-项目
 * @param {number} fileData.business_id 业务ID
 * @param {number} fileData.uploader_id 上传用户ID
 * @param {boolean} fileData.is_temp 是否临时文件：true-临时 false-永久
 * @returns {Object} 新创建的文件记录
 */
exports.createFile = async (fileData) => {
  const { file_name, file_path, file_size, file_type, business_type, business_id, uploader_id, is_temp = false } = fileData;

  const file = await File.create({
    file_name,
    file_path,
    file_size,
    file_type,
    business_type,
    business_id,
    uploader_id,
    is_temp,
    status: 1,
    create_time: Date.now(),
    update_time: Date.now()
  });

  return file;
};

/**
 * 更新文件记录
 * @param {number} id 文件ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的文件记录
 */
exports.updateFile = async (id, updateData) => {
  const file = await File.findByPk(id);
  if (!file) {
    throw new Error('文件不存在');
  }

  updateData.update_time = Date.now();
  return await file.update(updateData);
};

/**
 * 删除文件记录
 * @param {Array<number>} ids 文件ID列表
 * @returns {void}
 */
exports.deleteFiles = async (ids) => {
  // 先删除关联的任务文件关联
  const taskFiles = await TaskFile.findAll({ where: { file_id: ids } });
  const taskFileIds = taskFiles.map(tf => tf.id);
  if (taskFileIds.length > 0) {
    await TaskFile.destroy({ where: { id: taskFileIds } });
  }

  // 然后删除文件记录
  await File.update({
    status: 0,
    update_time: Date.now()
  }, { where: { id: ids } });
};

/**
 * 获取文件详情
 * @param {number} id 文件ID
 * @returns {Object} 文件详情
 */
exports.getFileDetail = async (id) => {
  const file = await File.findByPk(id);
  if (!file) {
    throw new Error('文件不存在');
  }
  return file;
};

/**
 * 获取任务关联的文件列表
 * @param {number} taskId 任务ID
 * @returns {Object} 文件列表
 */
exports.getTaskFiles = async (taskId) => {
  const taskFiles = await TaskFile.findAll({
    where: { task_id: taskId, status: 1 },
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
 * 为任务添加文件
 * @param {number} taskId 任务ID
 * @param {Array<number>} fileIds 文件ID列表
 * @returns {void}
 */
exports.addFilesToTask = async (taskId, fileIds) => {
  // 检查任务是否存在
  const task = await Task.findByPk(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }

  // 获取当前任务已关联的文件
  const existingTaskFiles = await TaskFile.findAll({ where: { task_id: taskId } });
  const existingFileIds = existingTaskFiles.map(tf => tf.file_id);

  // 过滤掉已关联的文件
  const newFileIds = fileIds.filter(fileId => !existingFileIds.includes(fileId));

  if (newFileIds.length === 0) {
    return;
  }

  // 创建新的任务文件关联
  const taskFiles = newFileIds.map((fileId, index) => ({
    task_id: taskId,
    file_id: fileId,
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
  await TaskFile.destroy({ where: { task_id: taskId, file_id: fileIds } });
};

/**
 * 获取临时文件列表
 * @param {number} uploaderId 上传用户ID
 * @returns {Object} 临时文件列表
 */
exports.getTempFiles = async (uploaderId) => {
  const files = await File.findAll({
    where: {
      uploader_id: uploaderId,
      is_temp: true,
      status: 1
    },
    order: [['create_time', 'DESC']]
  });

  return {
    list: files,
    pagination: {
      current_page: 1,
      page_size: files.length,
      total: files.length
    }
  };
};

/**
 * 清理临时文件
 * @param {number} hours 保留小时数，默认24小时
 * @returns {void}
 */
exports.cleanupTempFiles = async (hours = 24) => {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const tempFiles = await File.findAll({
    where: {
      is_temp: true,
      status: 1,
      create_time: { [Op.lt]: cutoffTime }
    }
  });

  if (tempFiles.length > 0) {
    const fileIds = tempFiles.map(file => file.id);
    await exports.deleteFiles(fileIds);
  }
};
