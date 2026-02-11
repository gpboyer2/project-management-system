/**
 * 流程节点类型管理接口
 * 包含流程节点类型的基础信息管理
 */
const express = require('express');
const router = express.Router();
const processNodeTypeController = require('../mvc/controllers/processNodeType');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 流程节点类型管理
 *   description: 流程节点类型基础信息管理接口
 */

/**
 * @swagger
 * /api/process-node-types/query:
 *   get:
 *     summary: 获取流程节点类型列表
 *     tags: [流程节点类型管理]
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
 *         name: name
 *         schema:
 *           type: string
 *         description: 节点类型名称（模糊搜索）
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *         description: 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
 *     responses:
 *       200:
 *         description: 成功获取流程节点类型列表
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
 *                         $ref: '#/components/schemas/ProcessNodeType'
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
router.get('/query', authenticateToken, processNodeTypeController.getProcessNodeTypeList);

/**
 * @swagger
 * /api/process-node-types/create:
 *   post:
 *     summary: 创建流程节点类型
 *     tags: [流程节点类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 节点类型名称
 *               type:
 *                 type: integer
 *                 description: 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
 *               description:
 *                 type: string
 *                 description: 节点类型描述
 *               sort_order:
 *                 type: integer
 *                 description: 排序号（越小越靠前）
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *               tasks:
 *                 type: array
 *                 description: 任务占位配置列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 任务名称
 *                     description:
 *                       type: string
 *                       description: 任务描述
 *                     task_type:
 *                       type: integer
 *                       description: 任务类型：1-必填 2-可选
 *             required:
 *               - name
 *               - type
 *     responses:
 *       200:
 *         description: 流程节点类型创建成功
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
 *                   $ref: '#/components/schemas/ProcessNodeType'
 */
router.post('/create', authenticateToken, processNodeTypeController.createProcessNodeType);

/**
 * @swagger
 * /api/process-node-types/update:
 *   post:
 *     summary: 更新流程节点类型
 *     tags: [流程节点类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 流程节点类型ID
 *               name:
 *                 type: string
 *                 description: 节点类型名称
 *               type:
 *                 type: integer
 *                 description: 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
 *               description:
 *                 type: string
 *                 description: 节点类型描述
 *               sort_order:
 *                 type: integer
 *                 description: 排序号（越小越靠前）
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *               tasks:
 *                 type: array
 *                 description: 任务占位配置列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 任务名称
 *                     description:
 *                       type: string
 *                       description: 任务描述
 *                     task_type:
 *                       type: integer
 *                       description: 任务类型：1-必填 2-可选
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 流程节点类型更新成功
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
 *                   $ref: '#/components/schemas/ProcessNodeType'
 */
router.post('/update', authenticateToken, processNodeTypeController.updateProcessNodeType);

/**
 * @swagger
 * /api/process-node-types/delete:
 *   post:
 *     summary: 删除流程节点类型
 *     tags: [流程节点类型管理]
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
 *                 description: 流程节点类型ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 流程节点类型删除成功
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
router.post('/delete', authenticateToken, processNodeTypeController.deleteProcessNodeTypes);

/**
 * @swagger
 * /api/process-node-types/detail:
 *   get:
 *     summary: 获取流程节点类型详情
 *     tags: [流程节点类型管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 流程节点类型ID
 *     responses:
 *       200:
 *         description: 成功获取流程节点类型详情
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
 *                   $ref: '#/components/schemas/ProcessNodeType'
 */
router.get('/detail', authenticateToken, processNodeTypeController.getProcessNodeTypeDetail);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessNodeType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 流程节点类型ID
 *         name:
 *           type: string
 *           description: 节点类型名称
 *         type:
 *           type: integer
 *           description: 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
 *         description:
 *           type: string
 *           description: 节点类型描述
 *         sort_order:
 *           type: integer
 *           description: 排序号（越小越靠前）
 *         config:
 *           type: object
 *           description: 配置信息（JSON格式）
 *         tasks:
 *           type: array
 *           description: 任务占位配置列表
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 任务名称
 *               description:
 *                 type: string
 *                 description: 任务描述
 *               task_type:
 *                 type: integer
 *                 description: 任务类型：1-必填 2-可选
 *         status:
 *           type: integer
 *           description: 状态（1-正常 0-已禁用）
 *         create_time:
 *           type: integer
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 */
