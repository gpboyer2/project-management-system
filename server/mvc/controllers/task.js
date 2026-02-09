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

/**
 * 获取节点任务列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getNodeTaskList = async (req, res) => {
  try {
    const { nodeId, nodeType } = req.query;
    const result = await taskService.getNodeTaskList(nodeId, nodeType);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 绑定任务到节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.bindTaskToNode = async (req, res) => {
  try {
    const { taskId, nodeId, nodeType } = req.body;
    const result = await taskService.bindTaskToNode(taskId, nodeId, nodeType);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 解绑任务与节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.unbindTaskFromNode = async (req, res) => {
  try {
    const { taskId, nodeType } = req.body;
    const result = await taskService.unbindTaskFromNode(taskId, nodeType);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取子任务列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getSubTaskList = async (req, res) => {
  try {
    const { parentTaskId } = req.query;
    const result = await taskService.getSubTaskList(parentTaskId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建子任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createSubTask = async (req, res) => {
  try {
    const { parentTaskId, ...taskData } = req.body;
    const result = await taskService.createSubTask(taskData, parentTaskId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取任务树（包含子任务）
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getTaskTree = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await taskService.getTaskTree(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
