/**
 * 需求管理控制器
 * 处理需求管理的请求
 */
const requirementService = require('../services/requirement');

/**
 * 获取需求列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementList = async (req, res) => {
  try {
    const result = await requirementService.getRequirementList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建需求
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createRequirement = async (req, res) => {
  try {
    const result = await requirementService.createRequirement(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新需求
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateRequirement = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await requirementService.updateRequirement(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除需求
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteRequirements = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementService.deleteRequirements(data);
    res.apiSuccess(null, '需求删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await requirementService.getRequirementDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求流程节点列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementProcessNodes = async (req, res) => {
  try {
    const { requirementId } = req.query;
    const result = await requirementService.getRequirementProcessNodes(requirementId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建需求流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createRequirementProcessNode = async (req, res) => {
  try {
    const result = await requirementService.createRequirementProcessNode(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新需求流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateRequirementProcessNode = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await requirementService.updateRequirementProcessNode(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除需求流程节点
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteRequirementProcessNodes = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementService.deleteRequirementProcessNodes(data);
    res.apiSuccess(null, '节点删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求流程节点详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementProcessNodeDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await requirementService.getRequirementProcessNodeDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求流程节点用户列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementProcessNodeUsers = async (req, res) => {
  try {
    const { nodeId } = req.query;
    const result = await requirementService.getRequirementProcessNodeUsers(nodeId);
    res.apiSuccess({ list: result });
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建需求流程节点用户关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createRequirementProcessNodeUser = async (req, res) => {
  try {
    const result = await requirementService.createRequirementProcessNodeUser(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除需求流程节点用户关联
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteRequirementProcessNodeUsers = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementService.deleteRequirementProcessNodeUsers(data);
    res.apiSuccess(null, '用户关联删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求流程节点关系列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementProcessNodeRelations = async (req, res) => {
  try {
    const { requirementId } = req.query;
    const result = await requirementService.getRequirementProcessNodeRelations(requirementId);
    res.apiSuccess({ list: result });
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建需求流程节点关系
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createRequirementProcessNodeRelation = async (req, res) => {
  try {
    const result = await requirementService.createRequirementProcessNodeRelation(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新需求流程节点关系
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateRequirementProcessNodeRelation = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await requirementService.updateRequirementProcessNodeRelation(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除需求流程节点关系
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteRequirementProcessNodeRelations = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementService.deleteRequirementProcessNodeRelations(data);
    res.apiSuccess(null, '关系删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 保存需求流程
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.saveRequirementProcess = async (req, res) => {
  try {
    const result = await requirementService.saveRequirementProcess(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
