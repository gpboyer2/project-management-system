/**
 * 任务文件关联控制器
 * 处理任务与文件的关联关系
 */
const taskFileService = require('../services/taskFile');

/**
 * 获取任务文件列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskFiles = async (req, res) => {
  try {
    const result = await taskFileService.getTaskFiles(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建任务文件关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createTaskFile = async (req, res) => {
  try {
    const result = await taskFileService.createTaskFile(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新任务文件关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateTaskFile = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await taskFileService.updateTaskFile(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除任务文件关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteTaskFiles = async (req, res) => {
  try {
    const { data } = req.body;
    await taskFileService.deleteTaskFiles(data);
    res.apiSuccess(null, '任务文件关联删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取任务文件关联详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskFileDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await taskFileService.getTaskFileDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 为任务添加文件
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.addFilesToTask = async (req, res) => {
  try {
    const { taskId, fileIds, fileType } = req.body;
    await taskFileService.addFilesToTask(taskId, fileIds, fileType);
    res.apiSuccess(null, '文件添加成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 从任务中移除文件
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.removeFilesFromTask = async (req, res) => {
  try {
    const { taskId, fileIds } = req.body;
    await taskFileService.removeFilesFromTask(taskId, fileIds);
    res.apiSuccess(null, '文件移除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 为任务设置文件（替换所有关联）
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.setTaskFiles = async (req, res) => {
  try {
    const { taskId, fileIds, fileType } = req.body;
    await taskFileService.setTaskFiles(taskId, fileIds, fileType);
    res.apiSuccess(null, '任务文件设置成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 批量创建任务文件关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.bulkCreateTaskFiles = async (req, res) => {
  try {
    const { taskFilesData } = req.body;
    await taskFileService.bulkCreateTaskFiles(taskFilesData);
    res.apiSuccess(null, '任务文件关联批量创建成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 复制任务文件关联（用于任务复制）
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.copyTaskFiles = async (req, res) => {
  try {
    const { sourceTaskId, targetTaskId } = req.body;
    await taskFileService.copyTaskFiles(sourceTaskId, targetTaskId);
    res.apiSuccess(null, '任务文件关联复制成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
