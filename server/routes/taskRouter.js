/**
 * 任务管理接口
 * 包含任务基础信息管理
 */
const express = require('express');
const router = express.Router();
const taskController = require('../mvc/controllers/task');

/**
 * @swagger
 * tags:
 *   name: 任务管理
 *   description: 任务基础信息管理接口
 */

/**
 * @swagger
 * /api/tasks/query:
 *   get:
 *     summary: 获取任务列表
 *     tags: [任务管理]
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
 *         name: requirementId
 *         schema:
 *           type: integer
 *         description: 需求ID
 *       - in: query
 *         name: reviewId
 *         schema:
 *           type: integer
 *         description: 评审ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 任务状态
 *     responses:
 *       200:
 *         description: 成功获取任务列表
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
 *                         $ref: '#/components/schemas/Task'
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
router.get('/query', taskController.getTaskList);

/**
 * @swagger
 * /api/tasks/create:
 *   post:
 *     summary: 创建任务
 *     tags: [任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 任务名称
 *               description:
 *                 type: string
 *                 description: 任务描述
 *               priority:
 *                 type: integer
 *                 description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *               task_status_id:
 *                 type: integer
 *                 description: 任务状态ID
 *               assignee_id:
 *                 type: integer
 *                 description: 负责人用户ID
 *               reporter_id:
 *                 type: integer
 *                 description: 创建人用户ID
 *               requirement_id:
 *                 type: integer
 *                 description: 关联需求ID
 *               review_id:
 *                 type: integer
 *                 description: 关联评审ID
 *               requirement_node_id:
 *                 type: integer
 *                 description: 需求管理流程节点ID
 *               review_node_id:
 *                 type: integer
 *                 description: 评审管理流程节点ID
 *               estimated_hours:
 *                 type: number
 *                 description: 预估工时(小时)
 *               actual_hours:
 *                 type: number
 *                 description: 实际工时(小时)
 *               start_time:
 *                 type: integer
 *                 description: 开始时间（Unix时间戳）
 *               end_time:
 *                 type: integer
 *                 description: 结束时间（Unix时间戳）
 *             required:
 *               - name
 *               - priority
 *               - task_status_id
 *               - reporter_id
 *     responses:
 *       200:
 *         description: 任务创建成功
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
 *                   $ref: '#/components/schemas/Task'
 */
router.post('/create', taskController.createTask);

/**
 * @swagger
 * /api/tasks/update:
 *   post:
 *     summary: 更新任务
 *     tags: [任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 任务ID
 *               name:
 *                 type: string
 *                 description: 任务名称
 *               description:
 *                 type: string
 *                 description: 任务描述
 *               priority:
 *                 type: integer
 *                 description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *               task_status_id:
 *                 type: integer
 *                 description: 任务状态ID
 *               assignee_id:
 *                 type: integer
 *                 description: 负责人用户ID
 *               reporter_id:
 *                 type: integer
 *                 description: 创建人用户ID
 *               requirement_id:
 *                 type: integer
 *                 description: 关联需求ID
 *               review_id:
 *                 type: integer
 *                 description: 关联评审ID
 *               requirement_node_id:
 *                 type: integer
 *                 description: 需求管理流程节点ID
 *               review_node_id:
 *                 type: integer
 *                 description: 评审管理流程节点ID
 *               estimated_hours:
 *                 type: number
 *                 description: 预估工时(小时)
 *               actual_hours:
 *                 type: number
 *                 description: 实际工时(小时)
 *               start_time:
 *                 type: integer
 *                 description: 开始时间（Unix时间戳）
 *               end_time:
 *                 type: integer
 *                 description: 结束时间（Unix时间戳）
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 任务更新成功
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
 *                   $ref: '#/components/schemas/Task'
 */
router.post('/update', taskController.updateTask);

/**
 * @swagger
 * /api/tasks/delete:
 *   post:
 *     summary: 删除任务
 *     tags: [任务管理]
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
 *                 description: 任务ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 任务删除成功
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
router.post('/delete', taskController.deleteTasks);

/**
 * @swagger
 * /api/tasks/detail:
 *   get:
 *     summary: 获取任务详情
 *     tags: [任务管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 成功获取任务详情
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
 *                   $ref: '#/components/schemas/Task'
 */
router.get('/detail', taskController.getTaskDetail);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 任务ID
 *         name:
 *           type: string
 *           description: 任务名称
 *         description:
 *           type: string
 *           description: 任务描述
 *         priority:
 *           type: integer
 *           description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *         task_status_id:
 *           type: integer
 *           description: 任务状态ID
 *         assignee_id:
 *           type: integer
 *           description: 负责人用户ID
 *         reporter_id:
 *           type: integer
 *           description: 创建人用户ID
 *         requirement_id:
 *           type: integer
 *           description: 关联需求ID
 *         review_id:
 *           type: integer
 *           description: 关联评审ID
 *         requirement_node_id:
 *           type: integer
 *           description: 需求管理流程节点ID
 *         review_node_id:
 *           type: integer
 *           description: 评审管理流程节点ID
 *         estimated_hours:
 *           type: number
 *           description: 预估工时(小时)
 *         actual_hours:
 *           type: number
 *           description: 实际工时(小时)
 *         start_time:
 *           type: integer
 *           description: 开始时间（Unix时间戳）
 *         end_time:
 *           type: integer
 *           description: 结束时间（Unix时间戳）
 *         create_time:
 *           type: integer
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 *         assignee:
 *           $ref: '#/components/schemas/User'
 *         reporter:
 *           $ref: '#/components/schemas/User'
 *         requirement:
 *           $ref: '#/components/schemas/Requirement'
 *         review:
 *           $ref: '#/components/schemas/Review'
 *         requirement_node:
 *           $ref: '#/components/schemas/RequirementProcessNode'
 *         review_node:
 *           $ref: '#/components/schemas/ReviewProcessNode'
 */
