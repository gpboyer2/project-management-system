/**
 * 角色管理路由，提供增删改查四个接口
 */
const express = require('express');
const router = express.Router();
const RoleController = require("../mvc/controllers/role");
const { authenticateToken, checkPermission } = require("../middleware/auth");

/**
 * 查询角色列表
 * GET /api/roles/list?status=1
 */
router.get('/list', authenticateToken, checkPermission('SYSTEM:ROLE:VIEW'), RoleController.list);

/**
 * 新增角色（支持批量）
 * POST /api/roles/create  body: { data: [{ ROLE_NAME, ROLE_CODE, ... }] }
 */
router.post('/create', authenticateToken, checkPermission('SYSTEM:ROLE:CREATE'), RoleController.create);

/**
 * 更新角色（支持批量）
 * POST /api/roles/update  body: { data: [{ ROLE_ID, ...updateFields }] }
 */
router.post('/update', authenticateToken, checkPermission('SYSTEM:ROLE:EDIT'), RoleController.update);

/**
 * 删除角色（支持批量）
 * POST /api/roles/delete  body: { data: [ROLE_ID1, ROLE_ID2, ...] }
 */
router.post('/delete', authenticateToken, checkPermission('SYSTEM:ROLE:DELETE'), RoleController.delete);

module.exports = router;




/**
 * @swagger
 * /api/roles/list:
 *   get:
 *     summary: 查询角色列表
 *     description: 分页查询角色列表，支持状态筛选
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: current_page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: 当前页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 状态筛选（0：禁用，1：启用）
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键字（角色名称或角色代码）
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                         page_size:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/roles/create:
 *   post:
 *     summary: 新增角色（支持批量）
 *     description: 批量创建角色，支持同时创建多个角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateRoleRequest'
 *                 example:
 *                   - ROLE_NAME: "系统管理员"
 *                     ROLE_CODE: "SYSTEM_ADMIN"
 *                     DESCRIPTION: "系统管理员角色"
 *                     STATUS: 1
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "成功创建 1 个角色"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       ROLE_NAME:
 *                         type: string
 *                       message:
 *                         type: string
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/roles/update:
 *   post:
 *     summary: 更新角色（支持批量）
 *     description: 批量更新角色信息，支持同时更新多个角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/UpdateRoleRequest'
 *                 example:
 *                   - ROLE_ID: 1
 *                     ROLE_NAME: "更新后的系统管理员"
 *                     DESCRIPTION: "更新后的角色描述"
 *                     STATUS: 1
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "成功更新 1 个角色"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       ROLE_ID:
 *                         type: integer
 *                       message:
 *                         type: string
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/roles/delete:
 *   post:
 *     summary: 删除角色（支持批量）
 *     description: 批量删除角色，支持同时删除多个角色
 *     tags: [角色管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   description: 角色ID数组
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "成功删除 2 个角色"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       ROLE_ID:
 *                         type: integer
 *                       message:
 *                         type: string
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         ROLE_ID:
 *           type: integer
 *           description: 角色ID
 *           example: 1
 *         ROLE_NAME:
 *           type: string
 *           description: 角色名称
 *           example: "系统管理员"
 *         ROLE_CODE:
 *           type: string
 *           description: 角色代码
 *           example: "SYSTEM_ADMIN"
 *         DESCRIPTION:
 *           type: string
 *           description: 角色描述
 *           example: "系统管理员角色"
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用）
 *           example: 1
 *         CREATE_TIME:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *           example: "2024-01-01T00:00:00.000Z"
 *         UPDATE_TIME:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - ROLE_NAME
 *         - ROLE_CODE
 *       properties:
 *         ROLE_NAME:
 *           type: string
 *           description: 角色名称（必填，唯一）
 *           example: "系统管理员"
 *         ROLE_CODE:
 *           type: string
 *           description: 角色代码（必填，唯一）
 *           example: "SYSTEM_ADMIN"
 *         DESCRIPTION:
 *           type: string
 *           description: 角色描述
 *           example: "系统管理员角色"
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用，默认为1）
 *           example: 1
 *
 *     UpdateRoleRequest:
 *       type: object
 *       required:
 *         - ROLE_ID
 *       properties:
 *         ROLE_ID:
 *           type: integer
 *           description: 角色ID（必填）
 *           example: 1
 *         ROLE_NAME:
 *           type: string
 *           description: 角色名称（更新时需唯一）
 *           example: "更新后的系统管理员"
 *         ROLE_CODE:
 *           type: string
 *           description: 角色代码（更新时需唯一）
 *           example: "SYSTEM_ADMIN_UPDATED"
 *         DESCRIPTION:
 *           type: string
 *           description: 角色描述
 *           example: "更新后的角色描述"
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用）
 *           example: 1
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT认证token
 */