/**
 * 用户认证路由
 */
const express = require('express');
const router = express.Router();
const AuthController = require("../mvc/controllers/auth");
const { authenticateToken } = require("../middleware/auth");


/**
 * 用户登录
 * POST /api/auth/login  body: { username, password }
 */
router.post('/login', AuthController.login);


/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', AuthController.logout);


/**
 * 刷新Token
 * POST /api/auth/refresh  body: { refreshToken }
 */
router.post('/refresh', AuthController.refresh);


/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, AuthController.me);


/**
 * 修改密码
 * POST /api/auth/change-password  body: { oldPassword, newPassword }
 */
router.post('/change-password', authenticateToken, AuthController.changePassword);


module.exports = router;




/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户名密码登录，返回JWT token
 *     tags: [用户认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: 密码
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: 登录成功
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
 *                   example: "登录成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT访问令牌
 *                     refreshToken:
 *                       type: string
 *                       description: 刷新令牌
 *                     expiresIn:
 *                       type: integer
 *                       description: 令牌有效期（秒）
 *                     user:
 *                       $ref: '#/components/schemas/UserInfo'
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 用户名或密码错误
 *       500:
 *         description: 服务器错误
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     description: 清除服务端会话，使token失效
 *     tags: [用户认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
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
 *                   example: "登出成功"
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新Token
 *     description: 使用刷新令牌获取新的访问令牌
 *     tags: [用户认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: 刷新令牌
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: 令牌刷新成功
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
 *                   example: "刷新成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: 新的访问令牌
 *                     expiresIn:
 *                       type: integer
 *                       description: 令牌有效期（秒）
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 刷新令牌无效或已过期
 *       500:
 *         description: 服务器错误
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的详细信息，包括角色和权限
 *     tags: [用户认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                   $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: 修改密码
 *     description: 修改当前登录用户的密码
 *     tags: [用户认证]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: 旧密码
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 description: 新密码（至少6位）
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: 密码修改成功
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
 *                   example: "密码修改成功"
 *       400:
 *         description: 参数错误（旧密码不正确或新密码格式不符合要求）
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInfo:
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
 *           description: 用户状态
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: 权限列表
 *       example:
 *         USER_ID: 1
 *         USER_NAME: "admin"
 *         REAL_NAME: "系统管理员"
 *         EMAIL: "admin@example.com"
 *         PHONE: "13800138000"
 *         ROLE_ID: 1
 *         ROLE_NAME: "超级管理员"
 *         STATUS: 1
 *         permissions: ["SYSTEM:USER:VIEW", "SYSTEM:USER:CREATE", "SYSTEM:USER:EDIT", "SYSTEM:USER:DELETE"]
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT认证token
 */