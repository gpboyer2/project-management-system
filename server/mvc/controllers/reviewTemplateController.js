/**
 * 评审流程模板管理控制器
 * 处理评审流程模板的 HTTP 请求
 */
const reviewTemplateService = require('../services/reviewTemplate');

/**
 * 获取评审模板列表
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.getReviewTemplateList = async (req, res) => {
  try {
    const params = {
      current_page: req.query.current_page,
      page_size: req.query.page_size,
      template_type: req.query.template_type,
      status: req.query.status
    };

    const result = await reviewTemplateService.getReviewTemplateList(params);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取模板详情
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.getReviewTemplateById = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.apiError(null, '模板ID不能为空');
    }

    const template = await reviewTemplateService.getReviewTemplateById(parseInt(id));
    res.apiSuccess(template);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取默认模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.getDefaultReviewTemplate = async (req, res) => {
  try {
    const { template_type = 1 } = req.query;
    const template = await reviewTemplateService.getDefaultReviewTemplate(parseInt(template_type));
    res.apiSuccess(template);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建评审模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.createReviewTemplate = async (req, res) => {
  try {
    const { name, description, template_type, is_default, nodes } = req.body;
    if (!name) {
      return res.apiError(null, '模板名称不能为空');
    }

    const templateData = {
      name,
      description,
      template_type: parseInt(template_type) || 1,
      is_default: is_default || false,
      nodes: nodes || []
    };

    const template = await reviewTemplateService.createReviewTemplate(templateData);
    res.apiSuccess(template);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新评审模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.updateReviewTemplate = async (req, res) => {
  try {
    const { id } = req.query;
    const { name, description, template_type, is_default, nodes } = req.body;

    if (!id) {
      return res.apiError(null, '模板ID不能为空');
    }

    const updateData = {
      name,
      description,
      template_type: template_type !== undefined ? parseInt(template_type) : undefined,
      is_default: is_default !== undefined ? is_default : undefined,
      nodes: nodes || []
    };

    const template = await reviewTemplateService.updateReviewTemplate(parseInt(id), updateData);
    res.apiSuccess(template);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除评审模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.deleteReviewTemplate = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.apiError(null, '模板ID不能为空');
    }

    await reviewTemplateService.deleteReviewTemplate(parseInt(id));
    res.apiSuccess(null, '删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 启用/禁用评审模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.updateReviewTemplateStatus = async (req, res) => {
  try {
    const { id, status } = req.query;
    if (!id || status === undefined) {
      return res.apiError(null, '模板ID和状态不能为空');
    }

    await reviewTemplateService.updateReviewTemplateStatus(parseInt(id), parseInt(status));
    res.apiSuccess(null, '更新成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 设置默认模板
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 */
exports.setDefaultReviewTemplate = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.apiError(null, '模板ID不能为空');
    }

    await reviewTemplateService.setDefaultReviewTemplate(parseInt(id));
    res.apiSuccess(null, '设置成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
