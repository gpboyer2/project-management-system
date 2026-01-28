/**
 * 用户管理路由，只提供增删改查四个接口
 */
const express = require('express');
const router = express.Router();
const UserController = require("../mvc/controllers/user");
const { authenticateToken, checkPermission } = require("../middleware/auth");


/**
 * 查询用户列表
 * GET /api/user/list?page=1&size=10&keyword=xxx&role=1&status=1
 */
router.get('/list', authenticateToken, checkPermission('SYSTEM:USER:VIEW'), UserController.list);


/**
 * 新增用户（支持批量）
 * POST /api/user/create  body: { data: [{ USER_NAME, PASSWORD, ... }] }
 */
router.post('/create', authenticateToken, checkPermission('SYSTEM:USER:CREATE'), UserController.create);


/**
 * 更新用户（支持批量）
 * POST /api/user/update  body: { data: [{ USER_ID, ...updateFields }] }
 */
router.post('/update', authenticateToken, checkPermission('SYSTEM:USER:EDIT'), UserController.update);


/**
 * 删除用户（支持批量）
 * POST /api/user/delete  body: { data: [USER_ID1, USER_ID2, ...] }
 */
router.post('/delete', authenticateToken, checkPermission('SYSTEM:USER:DELETE'), UserController.delete);


module.exports = router;




/**
 * @swagger
 * /api/user/list:
 *   get:
 *     summary: 查询用户列表
 *     description: 分页查询用户列表，支持关键字搜索和角色、状态筛选
 *     tags: [用户管理]
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
 *         name: keyword
 *         schema:
 *           type: string
 *           default: ""
 *         description: 搜索关键字（用户名、真实姓名、邮箱、手机号）
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *           description: 角色ID筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           description: 状态筛选（0：禁用，1：启用）
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
 *                         $ref: '#/components/schemas/User'
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
 * /api/user/create:
 *   post:
 *     summary: 新增用户（支持批量）
 *     description: 批量创建用户，支持同时创建多个用户
 *     tags: [用户管理]
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
 *                   $ref: '#/components/schemas/CreateUserRequest'
 *                 example:
 *                   - USER_NAME: "testuser"
 *                     PASSWORD: "password123"
 *                     REAL_NAME: "测试用户"
 *                     EMAIL: "test@example.com"
 *                     PHONE: "13800138000"
 *                     ROLE_ID: 2
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
 *                   example: "成功创建 1 个用户"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       USER_NAME:
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
 * /api/user/update:
 *   post:
 *     summary: 更新用户（支持批量）
 *     description: 批量更新用户信息，支持同时更新多个用户
 *     tags: [用户管理]
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
 *                   $ref: '#/components/schemas/UpdateUserRequest'
 *                 example:
 *                   - USER_ID: 1
 *                     REAL_NAME: "更新的真实姓名"
 *                     EMAIL: "updated@example.com"
 *                     PHONE: "13900139000"
 *                     ROLE_ID: 3
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
 *                   example: "成功更新 1 个用户"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       USER_ID:
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
 * /api/user/delete:
 *   post:
 *     summary: 删除用户（支持批量）
 *     description: 批量删除用户，支持同时删除多个用户（超级管理员不能被删除）
 *     tags: [用户管理]
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
 *                   description: 用户ID数组
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
 *                   example: "成功删除 2 个用户"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       success:
 *                         type: boolean
 *                       USER_ID:
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
 *     User:
 *       type: object
 *       properties:
 *         USER_ID:
 *           type: integer
 *           description: 用户ID
 *         USER_NAME:
 *           type: string
 *           description: 用户名
 *         REAL_NAME:
 *           type: string
 *           description: 真实姓名
 *         PASSWORD:
 *           type: string
 *           description: 密码（通常不返回）
 *         EMAIL:
 *           type: string
 *           description: 邮箱
 *         PHONE:
 *           type: string
 *           description: 手机号
 *         ROLE_ID:
 *           type: integer
 *           description: 角色ID
 *         ROLE_NAME:
 *           type: string
 *           description: 角色名称
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用）
 *         CREATE_TIME:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         UPDATE_TIME:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *       example:
 *         USER_ID: 1
 *         USER_NAME: "admin"
 *         REAL_NAME: "系统管理员"
 *         EMAIL: "admin@example.com"
 *         PHONE: "13800138000"
 *         ROLE_ID: 1
 *         ROLE_NAME: "超级管理员"
 *         STATUS: 1
 *         CREATE_TIME: "2024-01-01T00:00:00.000Z"
 *         UPDATE_TIME: "2024-01-01T00:00:00.000Z"
 *
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - USER_NAME
 *         - PASSWORD
 *       properties:
 *         USER_NAME:
 *           type: string
 *           description: 用户名（必填，唯一）
 *           example: "newuser"
 *         PASSWORD:
 *           type: string
 *           description: 密码（必填）
 *           example: "password123"
 *         REAL_NAME:
 *           type: string
 *           description: 真实姓名
 *           example: "新用户"
 *         EMAIL:
 *           type: string
 *           format: email
 *           description: 邮箱地址
 *           example: "newuser@example.com"
 *         PHONE:
 *           type: string
 *           description: 手机号
 *           example: "13800138000"
 *         ROLE_ID:
 *           type: integer
 *           description: 角色ID（必填）
 *           example: 2
 *         STATUS:
 *           type: integer
 *           description: 状态（0：禁用，1：启用，默认为1）
 *           example: 1
 *
 *     UpdateUserRequest:
 *       type: object
 *       required:
 *         - USER_ID
 *       properties:
 *         USER_ID:
 *           type: integer
 *           description: 用户ID（必填）
 *           example: 1
 *         USER_NAME:
 *           type: string
 *           description: 用户名（更新时需唯一）
 *           example: "updateduser"
 *         PASSWORD:
 *           type: string
 *           description: 新密码（可选）
 *           example: "newpassword123"
 *         REAL_NAME:
 *           type: string
 *           description: 真实姓名
 *           example: "更新的用户姓名"
 *         EMAIL:
 *           type: string
 *           format: email
 *           description: 邮箱地址
 *           example: "updated@example.com"
 *         PHONE:
 *           type: string
 *           description: 手机号
 *           example: "13900139000"
 *         ROLE_ID:
 *           type: integer
 *           description: 角色ID
 *           example: 3
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

