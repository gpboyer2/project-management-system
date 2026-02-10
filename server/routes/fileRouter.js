/**
 * 文件管理接口
 * 处理文件上传、下载、删除、查询等操作
 */
const express = require('express');
const router = express.Router();
const fileController = require('../mvc/controllers/file');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 文件管理
 *   description: 文件上传、下载、删除、查询接口
 */

/**
 * @swagger
 * /api/files/query:
 *   get:
 *     summary: 获取文件列表
 *     tags: [文件管理]
 *     parameters:
 *       - in: query
 *         name: current_page
 *         schema:
 *           type: integer
 *         description: 页码，默认1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *         description: 每页数量，默认20
 *       - in: query
 *         name: business_type
 *         schema:
 *           type: integer
 *         description: 业务类型：1-需求 2-任务 3-评审 4-项目
 *       - in: query
 *         name: business_id
 *         schema:
 *           type: integer
 *         description: 业务ID
 *       - in: query
 *         name: uploader_id
 *         schema:
 *           type: integer
 *         description: 上传用户ID
 *     responses:
 *       200:
 *         description: 成功获取文件列表
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
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/query', authenticateToken, fileController.getFileList);

/**
 * @swagger
 * /api/files/create:
 *   post:
 *     summary: 创建文件记录
 *     tags: [文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_name:
 *                 type: string
 *                 description: 文件名
 *               file_path:
 *                 type: string
 *                 description: 文件存储路径
 *               file_size:
 *                 type: integer
 *                 description: 文件大小(字节)
 *               file_type:
 *                 type: string
 *                 description: 文件类型(如: image/png, application/pdf)
 *               business_type:
 *                 type: integer
 *                 description: 业务类型：1-需求 2-任务 3-评审 4-项目
 *               business_id:
 *                 type: integer
 *                 description: 业务ID
 *               uploader_id:
 *                 type: integer
 *                 description: 上传用户ID
 *               is_temp:
 *                 type: boolean
 *                 description: 是否临时文件：true-临时 false-永久
 *             required:
 *               - file_name
 *               - file_path
 *               - file_size
 *               - uploader_id
 *     responses:
 *       200:
 *         description: 文件记录创建成功
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
 *                   $ref: '#/components/schemas/File'
 */
router.post('/create', authenticateToken, fileController.createFile);

/**
 * @swagger
 * /api/files/update:
 *   post:
 *     summary: 更新文件记录
 *     tags: [文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 文件ID
 *               file_name:
 *                 type: string
 *                 description: 文件名
 *               file_path:
 *                 type: string
 *                 description: 文件存储路径
 *               file_type:
 *                 type: string
 *                 description: 文件类型(如: image/png, application/pdf)
 *               business_type:
 *                 type: integer
 *                 description: 业务类型：1-需求 2-任务 3-评审 4-项目
 *               business_id:
 *                 type: integer
 *                 description: 业务ID
 *               is_temp:
 *                 type: boolean
 *                 description: 是否临时文件：true-临时 false-永久
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 文件记录更新成功
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
 *                   $ref: '#/components/schemas/File'
 */
router.post('/update', authenticateToken, fileController.updateFile);

/**
 * @swagger
 * /api/files/delete:
 *   post:
 *     summary: 删除文件记录
 *     tags: [文件管理]
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
 *                 description: 文件ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 文件删除成功
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
router.post('/delete', authenticateToken, fileController.deleteFiles);

/**
 * @swagger
 * /api/files/detail:
 *   get:
 *     summary: 获取文件详情
 *     tags: [文件管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 成功获取文件详情
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
 *                   $ref: '#/components/schemas/File'
 */
router.get('/detail', authenticateToken, fileController.getFileDetail);

/**
 * @swagger
 * /api/files/task-files/query:
 *   get:
 *     summary: 获取任务关联的文件列表
 *     tags: [文件管理]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 成功获取任务关联的文件列表
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
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TaskFile'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/task-files/query', authenticateToken, fileController.getTaskFiles);

/**
 * @swagger
 * /api/files/task-files/add:
 *   post:
 *     summary: 为任务添加文件
 *     tags: [文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: integer
 *                 description: 任务ID
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 文件ID列表
 *             required:
 *               - taskId
 *               - fileIds
 *     responses:
 *       200:
 *         description: 文件添加成功
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
router.post('/task-files/add', authenticateToken, fileController.addFilesToTask);

/**
 * @swagger
 * /api/files/task-files/remove:
 *   post:
 *     summary: 从任务中移除文件
 *     tags: [文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: integer
 *                 description: 任务ID
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 文件ID列表
 *             required:
 *               - taskId
 *               - fileIds
 *     responses:
 *       200:
 *         description: 文件移除成功
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
router.post('/task-files/remove', authenticateToken, fileController.removeFilesFromTask);

/**
 * @swagger
 * /api/files/temp/query:
 *   get:
 *     summary: 获取临时文件列表
 *     tags: [文件管理]
 *     parameters:
 *       - in: query
 *         name: uploaderId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 上传用户ID
 *     responses:
 *       200:
 *         description: 成功获取临时文件列表
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
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/File'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/temp/query', authenticateToken, fileController.getTempFiles);

/**
 * @swagger
 * /api/files/temp/cleanup:
 *   get:
 *     summary: 清理临时文件
 *     tags: [文件管理]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *         description: 保留小时数，默认24小时
 *     responses:
 *       200:
 *         description: 临时文件清理成功
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
router.get('/temp/cleanup', authenticateToken, fileController.cleanupTempFiles);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 文件ID
 *         file_name:
 *           type: string
 *           description: 文件名
 *         file_path:
 *           type: string
 *           description: 文件存储路径
 *         file_size:
 *           type: integer
 *           description: 文件大小(字节)
 *         file_type:
 *           type: string
 *           description: 文件类型(如: image/png, application/pdf)
 *         business_type:
 *           type: integer
 *           description: 业务类型：1-需求 2-任务 3-评审 4-项目
 *         business_id:
 *           type: integer
 *           description: 业务ID
 *         uploader_id:
 *           type: integer
 *           description: 上传用户ID
 *         is_temp:
 *           type: boolean
 *           description: 是否临时文件：true-临时 false-永久
 *         status:
 *           type: integer
 *           description: 状态：1-正常 0-已删除
 *         create_time:
 *           type: integer
 *           description: 创建时间，Unix时间戳
 *         update_time:
 *           type: integer
 *           description: 更新时间，Unix时间戳
 *
 *     TaskFile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 任务文件关联ID
 *         task_id:
 *           type: integer
 *           description: 任务ID
 *         file_id:
 *           type: integer
 *           description: 文件ID
 *         file_type:
 *           type: integer
 *           description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *         sort_order:
 *           type: integer
 *           description: 排序顺序
 *         status:
 *           type: integer
 *           description: 状态：1-正常 0-已删除
 *         create_time:
 *           type: integer
 *           description: 创建时间，Unix时间戳
 *         update_time:
 *           type: integer
 *           description: 更新时间，Unix时间戳
 *         file:
 *           $ref: '#/components/schemas/File'
 */
