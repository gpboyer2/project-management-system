/**
 * 任务文件关联接口
 * 处理任务与文件的关联关系
 */
const express = require('express');
const router = express.Router();
const taskFileController = require('../mvc/controllers/taskFile');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 任务文件管理
 *   description: 任务与文件的关联关系管理接口
 */

/**
 * @swagger
 * /api/task-files/query:
 *   get:
 *     summary: 获取任务文件列表
 *     tags: [任务文件管理]
 *     parameters:
 *       - in: query
 *         name: task_id
 *         schema:
 *           type: integer
 *         description: 任务ID
 *       - in: query
 *         name: file_type
 *         schema:
 *           type: integer
 *         description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *     responses:
 *       200:
 *         description: 成功获取任务文件列表
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
router.get('/query', authenticateToken, taskFileController.getTaskFiles);

/**
 * @swagger
 * /api/task-files/create:
 *   post:
 *     summary: 创建任务文件关联
 *     tags: [任务文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task_id:
 *                 type: integer
 *                 description: 任务ID
 *               file_id:
 *                 type: integer
 *                 description: 文件ID
 *               file_type:
 *                 type: integer
 *                 description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *               sort_order:
 *                 type: integer
 *                 description: 排序顺序
 *             required:
 *               - task_id
 *               - file_id
 *     responses:
 *       200:
 *         description: 任务文件关联创建成功
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
 *                   $ref: '#/components/schemas/TaskFile'
 */
router.post('/create', authenticateToken, taskFileController.createTaskFile);

/**
 * @swagger
 * /api/task-files/update:
 *   post:
 *     summary: 更新任务文件关联
 *     tags: [任务文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 关联ID
 *               file_type:
 *                 type: integer
 *                 description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *               sort_order:
 *                 type: integer
 *                 description: 排序顺序
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 任务文件关联更新成功
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
 *                   $ref: '#/components/schemas/TaskFile'
 */
router.post('/update', authenticateToken, taskFileController.updateTaskFile);

/**
 * @swagger
 * /api/task-files/delete:
 *   post:
 *     summary: 删除任务文件关联
 *     tags: [任务文件管理]
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
 *                 description: 关联ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 任务文件关联删除成功
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
router.post('/delete', authenticateToken, taskFileController.deleteTaskFiles);

/**
 * @swagger
 * /api/task-files/detail:
 *   get:
 *     summary: 获取任务文件关联详情
 *     tags: [任务文件管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 关联ID
 *     responses:
 *       200:
 *         description: 成功获取任务文件关联详情
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
 *                   $ref: '#/components/schemas/TaskFile'
 */
router.get('/detail', authenticateToken, taskFileController.getTaskFileDetail);

/**
 * @swagger
 * /api/task-files/add-files:
 *   post:
 *     summary: 为任务添加文件
 *     tags: [任务文件管理]
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
 *               fileType:
 *                 type: integer
 *                 description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
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
router.post('/add-files', authenticateToken, taskFileController.addFilesToTask);

/**
 * @swagger
 * /api/task-files/remove-files:
 *   post:
 *     summary: 从任务中移除文件
 *     tags: [任务文件管理]
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
router.post('/remove-files', authenticateToken, taskFileController.removeFilesFromTask);

/**
 * @swagger
 * /api/task-files/set-files:
 *   post:
 *     summary: 为任务设置文件（替换所有关联）
 *     tags: [任务文件管理]
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
 *               fileType:
 *                 type: integer
 *                 description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *             required:
 *               - taskId
 *               - fileIds
 *     responses:
 *       200:
 *         description: 任务文件设置成功
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
router.post('/set-files', authenticateToken, taskFileController.setTaskFiles);

/**
 * @swagger
 * /api/task-files/bulk-create:
 *   post:
 *     summary: 批量创建任务文件关联
 *     tags: [任务文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskFilesData:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     task_id:
 *                       type: integer
 *                       description: 任务ID
 *                     file_id:
 *                       type: integer
 *                       description: 文件ID
 *                     file_type:
 *                       type: integer
 *                       description: 文件类型：1-需求文档 2-设计文档 3-测试报告 4-代码文件 5-其他
 *                     sort_order:
 *                       type: integer
 *                       description: 排序顺序
 *                 description: 任务文件关联数据列表
 *             required:
 *               - taskFilesData
 *     responses:
 *       200:
 *         description: 任务文件关联批量创建成功
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
router.post('/bulk-create', authenticateToken, taskFileController.bulkCreateTaskFiles);

/**
 * @swagger
 * /api/task-files/copy:
 *   post:
 *     summary: 复制任务文件关联（用于任务复制）
 *     tags: [任务文件管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceTaskId:
 *                 type: integer
 *                 description: 源任务ID
 *               targetTaskId:
 *                 type: integer
 *                 description: 目标任务ID
 *             required:
 *               - sourceTaskId
 *               - targetTaskId
 *     responses:
 *       200:
 *         description: 任务文件关联复制成功
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
router.post('/copy', authenticateToken, taskFileController.copyTaskFiles);

/**
 * @swagger
 * components:
 *   schemas:
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

module.exports = router;
