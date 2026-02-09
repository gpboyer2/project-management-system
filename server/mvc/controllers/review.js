/**
 * 评审管理控制器
 * 处理评审管理的请求
 */
const reviewService = require('../services/review');

/**
 * 获取评审列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewList = async (req, res) => {
  try {
    const result = await reviewService.getReviewList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建评审
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createReview = async (req, res) => {
  try {
    const result = await reviewService.createReview(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新评审
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateReview = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await reviewService.updateReview(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除评审
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteReviews = async (req, res) => {
  try {
    const { data } = req.body;
    await reviewService.deleteReviews(data);
    res.apiSuccess(null, '评审删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取评审详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await reviewService.getReviewDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取评审流程节点列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewProcessNodes = async (req, res) => {
  try {
    const { reviewId } = req.query;
    const result = await reviewService.getReviewProcessNodes(reviewId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建评审流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createReviewProcessNode = async (req, res) => {
  try {
    const result = await reviewService.createReviewProcessNode(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新评审流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateReviewProcessNode = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await reviewService.updateReviewProcessNode(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取评审流程节点关系列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewProcessNodeRelations = async (req, res) => {
  try {
    const { reviewId } = req.query;
    const result = await reviewService.getReviewProcessNodeRelations(reviewId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除评审流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteReviewProcessNodes = async (req, res) => {
  try {
    const { data } = req.body;
    await reviewService.deleteReviewProcessNodes(data);
    res.apiSuccess(null, '节点删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取评审流程节点详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewProcessNodeDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await reviewService.getReviewProcessNodeDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取评审流程节点用户列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getReviewProcessNodeUsers = async (req, res) => {
  try {
    const { nodeId } = req.query;
    const result = await reviewService.getReviewProcessNodeUsers(nodeId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建评审流程节点用户
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createReviewProcessNodeUser = async (req, res) => {
  try {
    const result = await reviewService.createReviewProcessNodeUser(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除评审流程节点用户
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteReviewProcessNodeUsers = async (req, res) => {
  try {
    const { data } = req.body;
    await reviewService.deleteReviewProcessNodeUsers(data);
    res.apiSuccess(null, '用户删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除评审流程节点关系
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteReviewProcessNodeRelations = async (req, res) => {
  try {
    const { data } = req.body;
    await reviewService.deleteReviewProcessNodeRelations(data);
    res.apiSuccess(null, '关系删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 保存评审流程（批量保存节点和关系）
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.saveReviewProcess = async (req, res) => {
  try {
    await reviewService.saveReviewProcess(req.body);
    res.apiSuccess(null, '流程保存成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新评审流程节点完成状态
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateReviewProcessNodeCompletionStatus = async (req, res) => {
  try {
    const { nodeId, completionStatus } = req.body;
    const result = await reviewService.updateReviewProcessNodeCompletionStatus(nodeId, completionStatus);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
