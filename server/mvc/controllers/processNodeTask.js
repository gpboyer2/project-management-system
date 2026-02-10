/**
 * 流程节点任务关联控制器
 * 处理流程节点与任务的关联关系，支持占位任务管理
 */
const processNodeTaskService = require('../services/processNodeTask');

/**
 * 获取流程节点任务列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProcessNodeTasks = async (req, res) => {
  try {
    const result = await processNodeTaskService.getProcessNodeTasks(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建流程节点任务关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createProcessNodeTask = async (req, res) => {
  try {
    const result = await processNodeTaskService.createProcessNodeTask(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新流程节点任务关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateProcessNodeTask = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await processNodeTaskService.updateProcessNodeTask(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除流程节点任务关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteProcessNodeTasks = async (req, res) => {
  try {
    const { data } = req.body;
    await processNodeTaskService.deleteProcessNodeTasks(data);
    res.apiSuccess(null, '任务关联删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取流程节点任务关联详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProcessNodeTaskDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await processNodeTaskService.getProcessNodeTaskDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 为流程节点添加任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.addTasksToNode = async (req, res) => {
  try {
    const { nodeId, nodeType, taskIds } = req.body;
    await processNodeTaskService.addTasksToNode(nodeId, nodeType, taskIds);
    res.apiSuccess(null, '任务添加成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 从流程节点中移除任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.removeTasksFromNode = async (req, res) => {
  try {
    const { nodeId, nodeType, taskIds } = req.body;
    await processNodeTaskService.removeTasksFromNode(nodeId, nodeType, taskIds);
    res.apiSuccess(null, '任务移除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 为流程节点添加占位任务
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.addPlaceholderTasksToNode = async (req, res) => {
  try {
    const { nodeId, nodeType, placeholderTasks } = req.body;
    await processNodeTaskService.addPlaceholderTasksToNode(nodeId, nodeType, placeholderTasks);
    res.apiSuccess(null, '占位任务添加成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 复制流程节点任务关联（用于模板深拷贝）
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.copyProcessNodeTasks = async (req, res) => {
  try {
    const { sourceNodeId, sourceNodeType, targetNodeId, targetNodeType } = req.body;
    await processNodeTaskService.copyProcessNodeTasks(sourceNodeId, sourceNodeType, targetNodeId, targetNodeType);
    res.apiSuccess(null, '任务关联复制成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
