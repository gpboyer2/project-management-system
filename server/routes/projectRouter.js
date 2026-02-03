/**
 * 项目管理接口
 * 包含项目基础信息管理和项目团队管理
 */
const express = require('express');
const router = express.Router();
const projectController = require('../mvc/controllers/project');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 项目管理
 *   description: 项目基础信息和团队管理接口
 */

/**
 * @swagger
 * /api/projects/query:
 *   get:
 *     summary: 获取项目列表
 *     tags: [项目管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量，默认20
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
 *     responses:
 *       200:
 *         description: 成功获取项目列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: 响应状态
 *                 message:
 *                   type: string
 *                   description: 响应消息
 *                 datum:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         page_size:
 *                           type: integer
 *                         total:
 *                           type: integer
 */
router.get('/query', authenticateToken, projectController.getProjectList);

/**
 * @swagger
 * /api/projects/create:
 *   post:
 *     summary: 创建项目
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 项目名称
 *               description:
 *                 type: string
 *                 description: 项目描述
 *               status:
 *                 type: integer
 *                 description: 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
 *               manager_id:
 *                 type: integer
 *                 description: 项目经理ID
 *               department_id:
 *                 type: integer
 *                 description: 部门ID
 *               start_date:
 *                 type: integer
 *                 description: 开始时间（Unix时间戳）
 *               end_date:
 *                 type: integer
 *                 description: 结束时间（Unix时间戳）
 *               budget:
 *                 type: number
 *                 description: 项目预算
 *             required:
 *               - name
 *               - manager_id
 *     responses:
 *       200:
 *         description: 项目创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 datum:
 *                   $ref: '#/components/schemas/Project'
 */
router.post('/create', authenticateToken, projectController.createProject);

/**
 * @swagger
 * /api/projects/update:
 *   post:
 *     summary: 更新项目
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 项目ID
 *               name:
 *                 type: string
 *                 description: 项目名称
 *               description:
 *                 type: string
 *                 description: 项目描述
 *               status:
 *                 type: integer
 *                 description: 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
 *               manager_id:
 *                 type: integer
 *                 description: 项目经理ID
 *               department_id:
 *                 type: integer
 *                 description: 部门ID
 *               start_date:
 *                 type: integer
 *                 description: 开始时间（Unix时间戳）
 *               end_date:
 *                 type: integer
 *                 description: 结束时间（Unix时间戳）
 *               budget:
 *                 type: number
 *                 description: 项目预算
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 项目更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 datum:
 *                   $ref: '#/components/schemas/Project'
 */
router.post('/update', authenticateToken, projectController.updateProject);

/**
 * @swagger
 * /api/projects/delete:
 *   post:
 *     summary: 删除项目
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 项目ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 项目删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/delete', authenticateToken, projectController.deleteProjects);

/**
 * @swagger
 * /api/projects/team/query:
 *   get:
 *     summary: 获取项目团队成员列表
 *     tags: [项目管理]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取项目团队成员列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 datum:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       project_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       role_id:
 *                         type: integer
 *                       status:
 *                         type: integer
 *                       join_time:
 *                         type: integer
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       role:
 *                         $ref: '#/components/schemas/Role'
 */
router.get('/team/query', authenticateToken, projectController.getProjectTeamList);

/**
 * @swagger
 * /api/projects/team/create:
 *   post:
 *     summary: 添加项目团队成员
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 description: 项目ID
 *               user_id:
 *                 type: integer
 *                 description: 用户ID
 *               role_id:
 *                 type: integer
 *                 description: 角色ID
 *             required:
 *               - project_id
 *               - user_id
 *               - role_id
 *     responses:
 *       200:
 *         description: 项目团队成员添加成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 datum:
 *                   $ref: '#/components/schemas/ProjectTeam'
 */
router.post('/team/create', authenticateToken, projectController.addProjectTeamMember);

/**
 * @swagger
 * /api/projects/team/update:
 *   post:
 *     summary: 更新项目团队成员
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 项目团队成员ID
 *               role_id:
 *                 type: integer
 *                 description: 角色ID
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 项目团队成员更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 datum:
 *                   $ref: '#/components/schemas/ProjectTeam'
 */
router.post('/team/update', authenticateToken, projectController.updateProjectTeamMember);

/**
 * @swagger
 * /api/projects/team/delete:
 *   post:
 *     summary: 删除项目团队成员
 *     tags: [项目管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 项目团队成员ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 项目团队成员删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/team/delete', authenticateToken, projectController.deleteProjectTeamMembers);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 项目ID
 *         name:
 *           type: string
 *           description: 项目名称
 *         description:
 *           type: string
 *           description: 项目描述
 *         status:
 *           type: integer
 *           description: 项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
 *         manager_id:
 *           type: integer
 *           description: 项目经理ID
 *         department_id:
 *           type: integer
 *           description: 部门ID
 *         start_date:
 *           type: integer
 *           description: 开始时间（Unix时间戳）
 *         end_date:
 *           type: integer
 *           description: 结束时间（Unix时间戳）
 *         budget:
 *           type: number
 *           description: 项目预算
 *         create_time:
 *           type: integer
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 *
 *     ProjectTeam:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 项目团队成员ID
 *         project_id:
 *           type: integer
 *           description: 项目ID
 *         user_id:
 *           type: integer
 *           description: 用户ID
 *         role_id:
 *           type: integer
 *           description: 角色ID
 *         status:
 *           type: integer
 *           description: 状态（1-正常 0-已移除）
 *         join_time:
 *           type: integer
 *           description: 加入时间（Unix时间戳）
 *         leave_time:
 *           type: integer
 *           description: 离开时间（Unix时间戳）
 *         create_time:
 *           type: integer
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 */
