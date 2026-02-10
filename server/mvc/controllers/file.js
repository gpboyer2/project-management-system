/**
 * 文件管理控制器
 * 处理文件上传、下载、删除、查询等请求
 */
const fileService = require('../services/file');

/**
 * 获取文件列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getFileList = async (req, res) => {
  try {
    const result = await fileService.getFileList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建文件记录
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createFile = async (req, res) => {
  try {
    const result = await fileService.createFile(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新文件记录
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateFile = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await fileService.updateFile(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除文件记录
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteFiles = async (req, res) => {
  try {
    const { data } = req.body;
    await fileService.deleteFiles(data);
    res.apiSuccess(null, '文件删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取文件详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getFileDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await fileService.getFileDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取任务关联的文件列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.query;
    const result = await fileService.getTaskFiles(taskId);
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
    const { taskId, fileIds } = req.body;
    await fileService.addFilesToTask(taskId, fileIds);
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
    await fileService.removeFilesFromTask(taskId, fileIds);
    res.apiSuccess(null, '文件移除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取临时文件列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTempFiles = async (req, res) => {
  try {
    const { uploaderId } = req.query;
    const result = await fileService.getTempFiles(uploaderId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 清理临时文件
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.cleanupTempFiles = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    await fileService.cleanupTempFiles(parseInt(hours));
    res.apiSuccess(null, '临时文件清理成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
