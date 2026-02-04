/**
 * 流程节点类型管理控制器
 * 处理流程节点类型的请求
 */
const processNodeTypeService = require('../services/processNodeType');

/**
 * 获取流程节点类型列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProcessNodeTypeList = async (req, res) => {
  try {
    const result = await processNodeTypeService.getProcessNodeTypeList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建流程节点类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createProcessNodeType = async (req, res) => {
  try {
    const result = await processNodeTypeService.createProcessNodeType(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新流程节点类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateProcessNodeType = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await processNodeTypeService.updateProcessNodeType(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除流程节点类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteProcessNodeTypes = async (req, res) => {
  try {
    const { data } = req.body;
    await processNodeTypeService.deleteProcessNodeTypes(data);
    res.apiSuccess(null, '流程节点类型删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取流程节点类型详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProcessNodeTypeDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await processNodeTypeService.getProcessNodeTypeDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
