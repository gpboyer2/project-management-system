/**
 * 需求类型管理控制器
 * 处理需求类型的请求
 */
const requirementTypeService = require('../services/requirementType');

/**
 * 获取需求类型列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementTypeList = async (req, res) => {
  try {
    const result = await requirementTypeService.getRequirementTypeList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建需求类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createRequirementType = async (req, res) => {
  try {
    const result = await requirementTypeService.createRequirementType(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新需求类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateRequirementType = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await requirementTypeService.updateRequirementType(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除需求类型
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteRequirementTypes = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementTypeService.deleteRequirementTypes(data);
    res.apiSuccess(null, '需求类型删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取需求类型详情
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getRequirementTypeDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await requirementTypeService.getRequirementTypeDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};
