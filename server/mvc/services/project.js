/**
 * 项目管理服务
 * 处理项目基础信息和项目团队管理的业务逻辑
 */
const { Project, ProjectTeam, User, Role } = require('../../database/models');

/**
 * 获取项目列表
 * @param {Object} params 查询参数
 * @param {number} params.current_page 页码
 * @param {number} params.page_size 每页数量
 * @param {number} params.status 项目状态
 * @returns {Object} 项目列表和分页信息
 */
exports.getProjectList = async (params) => {
  const { current_page = 1, page_size = 20, status } = params;
  const where = status ? { status } : {};

  const { count, rows } = await Project.findAndCountAll({
    where,
    offset: (current_page - 1) * page_size,
    limit: parseInt(page_size),
    order: [['create_time', 'DESC']]
  });

  return {
    list: rows,
    pagination: {
      current_page: parseInt(current_page),
      page_size: parseInt(page_size),
      total: count
    }
  };
};

/**
 * 创建项目
 * @param {Object} projectData 项目数据
 * @param {string} projectData.name 项目名称
 * @param {string} projectData.description 项目描述
 * @param {number} projectData.status 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
 * @param {number} projectData.manager_id 项目经理ID
 * @param {number} projectData.department_id 部门ID
 * @param {number} projectData.start_date 开始时间（Unix时间戳）
 * @param {number} projectData.end_date 结束时间（Unix时间戳）
 * @param {number} projectData.budget 项目预算
 * @returns {Object} 新创建的项目
 */
exports.createProject = async (projectData) => {
  const { name, description, status = 1, manager_id, department_id, start_date, end_date, budget } = projectData;

  return await Project.create({
    name,
    description,
    status,
    manager_id,
    department_id,
    start_date,
    end_date,
    budget,
    create_time: Date.now(),
    update_time: Date.now()
  });
};

/**
 * 更新项目
 * @param {number} id 项目ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的项目
 */
exports.updateProject = async (id, updateData) => {
  const project = await Project.findByPk(id);
  if (!project) {
    throw new Error('项目不存在');
  }

  updateData.update_time = Date.now();
  return await project.update(updateData);
};

/**
 * 删除项目
 * @param {Array<number>} ids 项目ID列表
 * @returns {void}
 */
exports.deleteProjects = async (ids) => {
  await Project.destroy({ where: { id: ids } });
};

/**
 * 获取项目团队成员列表
 * @param {number} projectId 项目ID
 * @returns {Array} 项目团队成员列表
 */
exports.getProjectTeamList = async (projectId) => {
  // 检查项目是否存在
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('项目不存在');
  }

  return await ProjectTeam.findAll({
    where: { project_id: projectId, status: 1 },
    include: [
      { model: User, as: 'user' },
      { model: Role, as: 'role' }
    ],
    order: [['join_time', 'DESC']]
  });
};

/**
 * 添加项目团队成员
 * @param {Object} teamData 团队成员数据
 * @param {number} teamData.project_id 项目ID
 * @param {number} teamData.user_id 用户ID
 * @param {number} teamData.role_id 角色ID
 * @returns {Object} 新添加的团队成员
 */
exports.addProjectTeamMember = async (teamData) => {
  const { project_id, user_id, role_id } = teamData;

  // 检查用户是否已在项目团队中
  const existingMember = await ProjectTeam.findOne({
    where: { project_id, user_id, status: 1 }
  });

  if (existingMember) {
    throw new Error('用户已在项目团队中');
  }

  return await ProjectTeam.create({
    project_id,
    user_id,
    role_id,
    status: 1,
    join_time: Date.now(),
    create_time: Date.now(),
    update_time: Date.now()
  });
};

/**
 * 更新项目团队成员
 * @param {number} id 项目团队成员ID
 * @param {Object} updateData 更新数据
 * @param {number} updateData.role_id 角色ID
 * @returns {Object} 更新后的团队成员
 */
exports.updateProjectTeamMember = async (id, updateData) => {
  const teamMember = await ProjectTeam.findByPk(id);
  if (!teamMember) {
    throw new Error('项目团队成员不存在');
  }

  updateData.update_time = Date.now();
  return await teamMember.update(updateData);
};

/**
 * 删除项目团队成员
 * @param {Array<number>} ids 项目团队成员ID列表
 * @returns {void}
 */
exports.deleteProjectTeamMembers = async (ids) => {
  await ProjectTeam.update(
    {
      status: 0,
      leave_time: Date.now(),
      update_time: Date.now()
    },
    { where: { id: ids } }
  );
};
