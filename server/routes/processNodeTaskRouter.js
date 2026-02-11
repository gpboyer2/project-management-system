/**
 * 流程节点任务关联接口
 * 处理流程节点与任务的关联关系，支持占位任务管理
 */
const express = require('express');
const router = express.Router();
const processNodeTaskController = require('../mvc/controllers/processNodeTask');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 流程节点任务管理
 *   description: 流程节点与任务的关联关系管理接口
 */

/**
 * @swagger
 * /api/process-node-tasks/query:
 *   get:
 *     summary: 获取流程节点任务列表
 *     tags: [流程节点任务管理]
 *     parameters:
 *       - in: query
 *         name: node_id
 *         schema:
 *           type: integer
 *         description: 流程节点ID
 *       - in: query
 *         name: node_type
 *         schema:
 *           type: integer
 *         description: 节点类型：1-评审流程节点 2-评审模板节点
 *       - in: query
 *         name: is_placeholder
 *         schema:
 *           type: boolean
 *         description: 是否占位任务
 *     responses:
 *       200:
 *         description: 成功获取流程节点任务列表
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
 *                         $ref: '#/components/schemas/ProcessNodeTask'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/query', authenticateToken, processNodeTaskController.getProcessNodeTasks);

/**
 * @swagger
 * /api/process-node-tasks/create:
 *   post:
 *     summary: 创建流程节点任务关联
 *     tags: [流程节点任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               node_id:
 *                 type: integer
 *                 description: 流程节点ID
 *               task_id:
 *                 type: integer
 *                 description: 任务ID（占位任务时为null）
 *               node_type:
 *                 type: integer
 *                 description: 节点类型：1-评审流程节点 2-评审模板节点
 *               is_placeholder:
 *                 type: boolean
 *                 description: 是否占位任务：true-占位任务 false-实际任务
 *               task_name:
 *                 type: string
 *                 description: 任务名称（占位任务时必填）
 *               task_description:
 *                 type: string
 *                 description: 任务描述（占位任务时可选）
 *               task_type:
 *                 type: integer
 *                 description: 任务类型：1-必填 2-可选
 *               sort_order:
 *                 type: integer
 *                 description: 排序顺序
 *             required:
 *               - node_id
 *               - node_type
 *     responses:
 *       200:
 *         description: 流程节点任务关联创建成功
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
 *                   $ref: '#/components/schemas/ProcessNodeTask'
 */
router.post('/create', authenticateToken, processNodeTaskController.createProcessNodeTask);

/**
 * @swagger
 * /api/process-node-tasks/update:
 *   post:
 *     summary: 更新流程节点任务关联
 *     tags: [流程节点任务管理]
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
 *               task_id:
 *                 type: integer
 *                 description: 任务ID（占位任务时为null）
 *               is_placeholder:
 *                 type: boolean
 *                 description: 是否占位任务：true-占位任务 false-实际任务
 *               task_name:
 *                 type: string
 *                 description: 任务名称（占位任务时必填）
 *               task_description:
 *                 type: string
 *                 description: 任务描述（占位任务时可选）
 *               task_type:
 *                 type: integer
 *                 description: 任务类型：1-必填 2-可选
 *               sort_order:
 *                 type: integer
 *                 description: 排序顺序
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 流程节点任务关联更新成功
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
 *                   $ref: '#/components/schemas/ProcessNodeTask'
 */
router.post('/update', authenticateToken, processNodeTaskController.updateProcessNodeTask);

/**
 * @swagger
 * /api/process-node-tasks/delete:
 *   post:
 *     summary: 删除流程节点任务关联
 *     tags: [流程节点任务管理]
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
 *         description: 流程节点任务关联删除成功
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
router.post('/delete', authenticateToken, processNodeTaskController.deleteProcessNodeTasks);

/**
 * @swagger
 * /api/process-node-tasks/detail:
 *   get:
 *     summary: 获取流程节点任务关联详情
 *     tags: [流程节点任务管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 关联ID
 *     responses:
 *       200:
 *         description: 成功获取流程节点任务关联详情
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
 *                   $ref: '#/components/schemas/ProcessNodeTask'
 */
router.get('/detail', authenticateToken, processNodeTaskController.getProcessNodeTaskDetail);

/**
 * @swagger
 * /api/process-node-tasks/add-tasks:
 *   post:
 *     summary: 为流程节点添加任务
 *     tags: [流程节点任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nodeId:
 *                 type: integer
 *                 description: 流程节点ID
 *               nodeType:
 *                 type: integer
 *                 description: 节点类型：1-评审流程节点 2-评审模板节点
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 任务ID列表
 *             required:
 *               - nodeId
 *               - nodeType
 *               - taskIds
 *     responses:
 *       200:
 *         description: 任务添加成功
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
router.post('/add-tasks', authenticateToken, processNodeTaskController.addTasksToNode);

/**
 * @swagger
 * /api/process-node-tasks/remove-tasks:
 *   post:
 *     summary: 从流程节点中移除任务
 *     tags: [流程节点任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nodeId:
 *                 type: integer
 *                 description: 流程节点ID
 *               nodeType:
 *                 type: integer
 *                 description: 节点类型：1-评审流程节点 2-评审模板节点
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 任务ID列表
 *             required:
 *               - nodeId
 *               - nodeType
 *               - taskIds
 *     responses:
 *       200:
 *         description: 任务移除成功
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
router.post('/remove-tasks', authenticateToken, processNodeTaskController.removeTasksFromNode);

/**
 * @swagger
 * /api/process-node-tasks/add-placeholder-tasks:
 *   post:
 *     summary: 为流程节点添加占位任务
 *     tags: [流程节点任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nodeId:
 *                 type: integer
 *                 description: 流程节点ID
 *               nodeType:
 *                 type: integer
 *                 description: 节点类型：1-评审流程节点 2-评审模板节点
 *               placeholderTasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     task_name:
 *                       type: string
 *                       description: 任务名称
 *                     task_description:
 *                       type: string
 *                       description: 任务描述
 *                     task_type:
 *                       type: integer
 *                       description: 任务类型：1-必填 2-可选
 *                     sort_order:
 *                       type: integer
 *                       description: 排序顺序
 *                 description: 占位任务数据列表
 *             required:
 *               - nodeId
 *               - nodeType
 *               - placeholderTasks
 *     responses:
 *       200:
 *         description: 占位任务添加成功
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
router.post('/add-placeholder-tasks', authenticateToken, processNodeTaskController.addPlaceholderTasksToNode);

/**
 * @swagger
 * /api/process-node-tasks/copy:
 *   post:
 *     summary: 复制流程节点任务关联（用于模板深拷贝）
 *     tags: [流程节点任务管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceNodeId:
 *                 type: integer
 *                 description: 源节点ID
 *               sourceNodeType:
 *                 type: integer
 *                 description: 源节点类型：1-评审流程节点 2-评审模板节点
 *               targetNodeId:
 *                 type: integer
 *                 description: 目标节点ID
 *               targetNodeType:
 *                 type: integer
 *                 description: 目标节点类型：1-评审流程节点 2-评审模板节点
 *             required:
 *               - sourceNodeId
 *               - sourceNodeType
 *               - targetNodeId
 *               - targetNodeType
 *     responses:
 *       200:
 *         description: 任务关联复制成功
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
router.post('/copy', authenticateToken, processNodeTaskController.copyProcessNodeTasks);

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessNodeTask:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 关联ID
 *         node_id:
 *           type: integer
 *           description: 流程节点ID
 *         task_id:
 *           type: integer
 *           description: 任务ID（占位任务时为null）
 *         node_type:
 *           type: integer
 *           description: 节点类型：1-评审流程节点 2-评审模板节点
 *         is_placeholder:
 *           type: boolean
 *           description: 是否占位任务：true-占位任务 false-实际任务
 *         task_name:
 *           type: string
 *           description: 任务名称（占位任务时必填）
 *         task_description:
 *           type: string
 *           description: 任务描述（占位任务时可选）
 *         task_type:
 *           type: integer
 *           description: 任务类型：1-必填 2-可选
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
 *         task:
 *           $ref: '#/components/schemas/Task'
 */

module.exports = router;
