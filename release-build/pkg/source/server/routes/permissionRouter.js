/**
 * 权限管理路由，提供增删改查四个接口
 */
const express = require('express');
const router = express.Router();
const PermissionController = require("../mvc/controllers/permission");
const { authenticateToken, checkPermission } = require("../middleware/auth");

/**
 * 查询权限列表
 * GET /api/permissions/list?status=1
 */
router.get('/list', authenticateToken, checkPermission('SYSTEM:PERMISSION:VIEW'), PermissionController.list);

/**
 * 新增权限（支持批量）
 * POST /api/permissions/create  body: { data: [{ PERMISSION_NAME, PERMISSION_CODE, ... }] }
 */
router.post('/create', authenticateToken, checkPermission('SYSTEM:PERMISSION:CREATE'), PermissionController.create);

/**
 * 更新权限（支持批量）
 * POST /api/permissions/update  body: { data: [{ PERMISSION_ID, ...updateFields }] }
 */
router.post('/update', authenticateToken, checkPermission('SYSTEM:PERMISSION:EDIT'), PermissionController.update);

/**
 * 删除权限（支持批量）
 * POST /api/permissions/delete  body: { data: [PERMISSION_ID1, PERMISSION_ID2, ...] }
 */
router.post('/delete', authenticateToken, checkPermission('SYSTEM:PERMISSION:DELETE'), PermissionController.delete);

module.exports = router;




/**
 * @swagger
 * /api/permissions/list:
 *   get:
 *     summary: 查询权限列表
 *     description: 分页查询权限列表，支持状态筛选
 *     tags: [权限管理]
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
 *           description: 状态筛选（0：禁用，1：启用）
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键字（权限名称或权限代码）
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
 *                         $ref: '#/components/schemas/Permission'
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
 * /api/permissions/create:
 *   post:
 *     summary: 新增权限（支持批量）
 *     description: 批量创建权限，支持同时创建多个权限
 *     tags: [权限管理]
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
 *                   $ref: '#/components/schemas/CreatePermissionRequest'
 *                 example:
 *                   - PERMISSION_NAME: "用户查看"
 *                     PERMISSION_CODE: "SYSTEM:USER:VIEW"
 *                     DESCRIPTION: "查看用户列表和详情"
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
 *                   example: "成功创建 1 个权限"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       PERMISSION_NAME:
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
 * /api/permissions/update:
 *   post:
 *     summary: 更新权限（支持批量）
 *     description: 批量更新权限信息，支持同时更新多个权限
 *     tags: [权限管理]
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
 *                   $ref: '#/components/schemas/UpdatePermissionRequest'
 *                 example:
 *                   - PERMISSION_ID: 1
 *                     PERMISSION_NAME: "更新后的用户查看"
 *                     DESCRIPTION: "更新后的权限描述"
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
 *                   example: "成功更新 1 个权限"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       PERMISSION_ID:
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
 * /api/permissions/delete:
 *   post:
 *     summary: 删除权限（支持批量）
 *     description: 批量删除权限，支持同时删除多个权限
 *     tags: [权限管理]
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
 *                   description: 权限ID数组
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
 *                   example: "成功删除 2 个权限"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       PERMISSION_ID:
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
 *     Permission:
 *       type: object
 *       properties:
 *         PERMISSION_ID:
 *           type: integer
 *           description: 权限ID
 *           example: 1
 *         PERMISSION_NAME:
 *           type: string
 *           description: 权限名称
 *           example: "用户查看"
 *         PERMISSION_CODE:
 *           type: string
 *           description: 权限代码
 *           example: "SYSTEM:USER:VIEW"
 *         DESCRIPTION:
 *           type: string
 *           description: 权限描述
 *           example: "查看用户列表和详情"
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
 *     CreatePermissionRequest:
 *       type: object
 *       required:
 *         - PERMISSION_NAME
 *         - PERMISSION_CODE
 *       properties:
 *         PERMISSION_NAME:
 *           type: string
 *           description: 权限名称（必填，唯一）
 *           example: "用户查看"
 *         PERMISSION_CODE:
 *           type: string
 *           description: 权限代码（必填，唯一）
 *           example: "SYSTEM:USER:VIEW"
 *         DESCRIPTION:
 *           type: string
 *           description: 权限描述
 *           example: "查看用户列表和详情"
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用，默认为1）
 *           example: 1
 *
 *     UpdatePermissionRequest:
 *       type: object
 *       required:
 *         - PERMISSION_ID
 *       properties:
 *         PERMISSION_ID:
 *           type: integer
 *           description: 权限ID（必填）
 *           example: 1
 *         PERMISSION_NAME:
 *           type: string
 *           description: 权限名称（更新时需唯一）
 *           example: "更新后的用户查看"
 *         PERMISSION_CODE:
 *           type: string
 *           description: 权限代码（更新时需唯一）
 *           example: "SYSTEM:USER:VIEW:UPDATED"
 *         DESCRIPTION:
 *           type: string
 *           description: 权限描述
 *           example: "更新后的权限描述"
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