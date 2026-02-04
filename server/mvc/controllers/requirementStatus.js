/**
 * 需求状态管理控制器
 * 处理需求状态的HTTP请求
 */
const requirementStatusService = require('../services/requirementStatus');

// 获取需求状态列表
exports.getRequirementStatusList = async (req, res) => {
  try {
    const result = await requirementStatusService.getRequirementStatusList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

// 获取需求状态详情
exports.getRequirementStatusDetail = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await requirementStatusService.getRequirementStatusDetail(id);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

// 创建需求状态
exports.createRequirementStatus = async (req, res) => {
  try {
    const result = await requirementStatusService.createRequirementStatus(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

// 更新需求状态
exports.updateRequirementStatus = async (req, res) => {
  try {
    const result = await requirementStatusService.updateRequirementStatus(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

// 删除需求状态
exports.deleteRequirementStatuses = async (req, res) => {
  try {
    const { data } = req.body;
    await requirementStatusService.deleteRequirementStatuses(data);
    res.apiSuccess(null, '删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
