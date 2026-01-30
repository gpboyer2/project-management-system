/**
 * 项目管理控制器
 * 处理项目基础信息和项目团队管理的请求
 */
const projectService = require('../services/project');

/**
 * 获取项目列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProjectList = async (req, res) => {
  try {
    const result = await projectService.getProjectList(req.query);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 创建项目
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.createProject = async (req, res) => {
  try {
    const result = await projectService.createProject(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新项目
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateProject = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await projectService.updateProject(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除项目
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteProjects = async (req, res) => {
  try {
    const { data } = req.body;
    await projectService.deleteProjects(data);
    res.apiSuccess(null, '项目删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 获取项目团队成员列表
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.getProjectTeamList = async (req, res) => {
  try {
    const { projectId } = req.query;
    const result = await projectService.getProjectTeamList(projectId);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 添加项目团队成员
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.addProjectTeamMember = async (req, res) => {
  try {
    const result = await projectService.addProjectTeamMember(req.body);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 更新项目团队成员
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.updateProjectTeamMember = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const result = await projectService.updateProjectTeamMember(id, updateData);
    res.apiSuccess(result);
  } catch (error) {
    res.apiError(null, error.message);
  }
};

/**
 * 删除项目团队成员
 * @param {Object} req Express请求对象
 * @param {Object} res Express响应对象
 */
exports.deleteProjectTeamMembers = async (req, res) => {
  try {
    const { data } = req.body;
    await projectService.deleteProjectTeamMembers(data);
    res.apiSuccess(null, '项目团队成员删除成功');
  } catch (error) {
    res.apiError(null, error.message);
  }
};
