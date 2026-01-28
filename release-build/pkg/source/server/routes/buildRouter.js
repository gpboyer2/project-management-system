/**
 * 构建路由，提供构建任务管理接口
 */
const express = require('express');
const router = express.Router();
const BuildController = require('../mvc/controllers/build');
const { authenticateToken } = require("../middleware/auth");

/**
 * 创建构建任务
 * POST /api/build/tasks  body: { contextType, contextId, contextName?, options }
 */
router.post('/tasks', authenticateToken, BuildController.createTask);

/**
 * 获取构建历史
 * GET /api/build/tasks?contextType=&contextId=&limit=&offset=
 */
router.get('/tasks', authenticateToken, BuildController.listTasks);

/**
 * 查询构建任务
 * GET /api/build/tasks/:taskId
 */
router.get('/tasks/:taskId', authenticateToken, BuildController.getTask);

/**
 * 下载构建产物
 * GET /api/build/tasks/:taskId/download
 */
router.get('/tasks/:taskId/download', authenticateToken, BuildController.downloadTask);

/**
 * 取消构建任务
 * POST /api/build/tasks/:taskId/cancel
 */
router.post('/tasks/:taskId/cancel', authenticateToken, BuildController.cancelTask);

module.exports = router;


/**
 * @swagger
 * /api/build/start:
 *   post:
 *     summary: 启动构建任务
 *     description: 启动一个新的构建任务
 *     tags: [构建管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: 项目ID
 *                 example: "project_001"
 *               options:
 *                 type: object
 *                 description: 构建选项
 *                 properties:
 *                   cppSdk:
 *                     type: boolean
 *                     description: 是否生成C++ SDK
 *                     example: true
 *                   icdDoc:
 *                     type: boolean
 *                     description: 是否生成ICD文档
 *                     example: false
 *                   language:
 *                     type: string
 *                     description: 目标语言
 *                     enum: [cpp11, cpp17, cpp20, python]
 *                     example: "cpp17"
 *                   platform:
 *                     type: string
 *                     description: 目标平台
 *                     enum: [linux-x64, linux-arm64, windows-x64, qnx, vxworks]
 *                     example: "linux-x64"
 *     responses:
 *       200:
 *         description: 构建任务启动成功
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
 *                     taskId:
 *                       type: string
 *                       description: 构建任务ID
 *                     version:
 *                       type: string
 *                       description: 版本号
 *                     status:
 *                       type: string
 *                       description: 任务状态
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/build/history:
 *   get:
 *     summary: 获取构建历史
 *     description: 获取构建任务历史记录
 *     tags: [构建管理]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 项目ID（可选，用于筛选）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
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
 *                         $ref: '#/components/schemas/BuildHistory'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/build/status:
 *   get:
 *     summary: 查询构建状态
 *     description: 查询指定构建任务的状态
 *     tags: [构建管理]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: 构建任务ID
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
 *                   $ref: '#/components/schemas/BuildTask'
 *       404:
 *         description: 任务不存在
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/build/download:
 *   get:
 *     summary: 下载构建产物
 *     description: 下载指定构建任务的产物
 *     tags: [构建管理]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: 构建任务ID
 *     responses:
 *       200:
 *         description: 下载成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: 构建尚未完成
 *       404:
 *         description: 任务不存在
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/build/cancel:
 *   post:
 *     summary: 取消构建任务
 *     description: 取消指定的构建任务
 *     tags: [构建管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: 构建任务ID
 *     responses:
 *       200:
 *         description: 取消成功
 *       400:
 *         description: 任务已完成，无法取消
 *       404:
 *         description: 任务不存在
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     BuildTask:
 *       type: object
 *       properties:
 *         taskId:
 *           type: string
 *           description: 构建任务ID
 *         version:
 *           type: string
 *           description: 版本号
 *         status:
 *           type: string
 *           enum: [building, completed, failed, cancelled]
 *           description: 任务状态
 *         progress:
 *           type: integer
 *           description: 构建进度（0-100）
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: 完成时间
 *         downloadUrl:
 *           type: string
 *           description: 下载地址
 *
 *     BuildHistory:
 *       type: object
 *       properties:
 *         version:
 *           type: string
 *           description: 版本号
 *         projectId:
 *           type: string
 *           description: 项目ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: 完成时间
 *         status:
 *           type: string
 *           enum: [completed, failed]
 *           description: 状态
 *         downloadUrl:
 *           type: string
 *           description: 下载地址
 */
