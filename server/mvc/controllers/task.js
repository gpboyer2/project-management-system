/**
 * 任务管理控制器
 * 处理任务管理的请求
 */
const taskService = require('../services/task');

/**
 * 获取任务列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskList = async (req, res) => {
  try {
    const result = await taskService.getTaskList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createTask = async (req, res) => {
  try {
    const result = await taskService.createTask(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateTask = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await taskService.updateTask(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteTasks = async (req, res) => {
  try {
    const { data } = req.body;
    await taskService.deleteTasks(data);
    res.apiSuccess(null, '任务删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取任务详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await taskService.getTaskDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
