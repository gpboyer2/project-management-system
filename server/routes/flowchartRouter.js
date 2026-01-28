/**
 * 流程图路由，提供流程图保存/加载接口
 */
const express = require('express');
const router = express.Router();
const FlowchartController = require("../mvc/controllers/flowchart");
const { authenticateToken } = require("../middleware/auth");

/**
 * 保存流程图
 * POST /api/flowcharts/save  body: { arch_node_id, name, nodes, edges }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.arch_node_id - 体系节点ID
 * @param {string} [req.body.name] - 流程图名称（可选）
 * @param {Array} [req.body.nodes] - 流程图节点数据（可选）
 * @param {Array} [req.body.edges] - 流程图连线数据（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回保存结果
 */
router.post('/save', authenticateToken, FlowchartController.saveFlowchart);

/**
 * 根据体系节点ID加载流程图
 * GET /api/flowcharts/by-arch-node  params: { arch_node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.arch_node_id - 体系节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回流程图数据
 */
router.get('/by-arch-node', authenticateToken, FlowchartController.loadFlowchartByArchNodeId);

/**
 * 根据通信节点ID加载流程图
 * GET /api/flowcharts/by-comm-node  params: { comm_node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.comm_node_id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回流程图数据
 */
router.get('/by-comm-node', authenticateToken, FlowchartController.loadFlowchartByCommNodeId);

/**
 * 根据体系节点ID获取通信节点列表
 * GET /api/flowcharts/comm-nodes  params: { arch_node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.arch_node_id - 体系节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回通信节点列表
 */
router.get('/comm-nodes', authenticateToken, FlowchartController.getCommNodeListByArchNodeId);

/**
 * 删除通信节点（同时删除关联的流程图）
 * POST /api/flowcharts/delete-comm-node  body: { comm_node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.comm_node_id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回删除结果
 */
router.post('/delete-comm-node', authenticateToken, FlowchartController.deleteCommNode);

module.exports = router;




/**
 * @swagger
 * /api/flowcharts/save:
 *   post:
 *     summary: 保存流程图
 *     description: 根据体系节点ID保存流程图（自动创建或更新）
 *     tags: [流程图管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - arch_node_id
 *             properties:
 *               arch_node_id:
 *                 type: string
 *                 description: 体系节点ID
 *                 example: "arch_node_001"
 *               name:
 *                 type: string
 *                 description: 流程图名称
 *                 example: "通信流程图"
 *               nodes:
 *                 type: array
 *                 description: 流程图节点数据
 *                 items:
 *                   type: object
 *                 example: []
 *               edges:
 *                 type: array
 *                 description: 流程图连线数据
 *                 items:
 *                   type: object
 *                 example: []
 *     responses:
 *       200:
 *         description: 保存成功
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
 *                     id:
 *                       type: integer
 *                       description: 流程图ID
 *                     arch_node_id:
 *                       type: string
 *                       description: 体系节点ID
 *       400:
 *         description: 参数错误或协议配置校验失败
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/flowcharts/by-arch-node:
 *   get:
 *     summary: 根据体系节点ID加载流程图
 *     description: 根据体系节点ID获取对应的流程图数据
 *     tags: [流程图管理]
 *     parameters:
 *       - in: query
 *         name: arch_node_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 体系节点ID
 *         example: "arch_node_001"
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
 *                     id:
 *                       type: integer
 *                       description: 流程图ID
 *                     arch_node_id:
 *                       type: string
 *                       description: 体系节点ID
 *                     name:
 *                       type: string
 *                       description: 流程图名称
 *                     nodes:
 *                       type: array
 *                       description: 流程图节点数据
 *                     edges:
 *                       type: array
 *                       description: 流程图连线数据
 *                   nullable: true
 *       404:
 *         description: 未找到对应的流程图
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/flowcharts/by-comm-node:
 *   get:
 *     summary: 根据通信节点ID加载流程图
 *     description: 根据通信节点ID获取对应的流程图数据
 *     tags: [流程图管理]
 *     parameters:
 *       - in: query
 *         name: comm_node_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通信节点ID
 *         example: "comm_node_001"
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
 *                     id:
 *                       type: integer
 *                       description: 流程图ID
 *                     comm_node_id:
 *                       type: string
 *                       description: 通信节点ID
 *                     name:
 *                       type: string
 *                       description: 流程图名称
 *                     nodes:
 *                       type: array
 *                       description: 流程图节点数据
 *                     edges:
 *                       type: array
 *                       description: 流程图连线数据
 *                   nullable: true
 *       404:
 *         description: 未找到对应的流程图
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/flowcharts/comm-nodes:
 *   get:
 *     summary: 根据体系节点ID获取通信节点列表
 *     description: 获取指定体系节点下的所有通信节点列表
 *     tags: [流程图管理]
 *     parameters:
 *       - in: query
 *         name: arch_node_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 体系节点ID
 *         example: "arch_node_001"
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommNode'
 *       404:
 *         description: 未找到对应的体系节点
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/flowcharts/delete-comm-node:
 *   post:
 *     summary: 删除通信节点（同时删除关联的流程图）
 *     description: 删除指定的通信节点及其关联的流程图数据
 *     tags: [流程图管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comm_node_id
 *             properties:
 *               comm_node_id:
 *                 type: string
 *                 description: 通信节点ID
 *                 example: "comm_node_001"
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
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *       404:
 *         description: 未找到对应的通信节点
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Flowchart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 流程图ID
 *           example: 1
 *         arch_node_id:
 *           type: string
 *           description: 体系节点ID
 *           example: "arch_node_001"
 *         comm_node_id:
 *           type: string
 *           description: 通信节点ID
 *           example: "comm_node_001"
 *         name:
 *           type: string
 *           description: 流程图名称
 *           example: "通信流程图"
 *         nodes:
 *           type: array
 *           description: 流程图节点数据
 *           items:
 *             type: object
 *           example: []
 *         edges:
 *           type: array
 *           description: 流程图连线数据
 *           items:
 *             type: object
 *           example: []
 *         create_time:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         update_time:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     CommNode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 通信节点ID
 *           example: "comm_node_001"
 *         arch_node_id:
 *           type: string
 *           description: 所属体系节点ID
 *           example: "arch_node_001"
 *         name:
 *           type: string
 *           description: 通信节点名称
 *           example: "通信节点1"
 *         description:
 *           type: string
 *           description: 通信节点描述
 *           example: "负责数据传输的节点"
 *
 *     SaveFlowchartRequest:
 *       type: object
 *       required:
 *         - arch_node_id
 *       properties:
 *         arch_node_id:
 *           type: string
 *           description: 体系节点ID（必填）
 *           example: "arch_node_001"
 *         name:
 *           type: string
 *           description: 流程图名称（可选）
 *           example: "通信流程图"
 *         nodes:
 *           type: array
 *           description: 流程图节点数据（可选）
 *           items:
 *             type: object
 *           example: []
 *         edges:
 *           type: array
 *           description: 流程图连线数据（可选）
 *           items:
 *             type: object
 *           example: []
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT认证token
 */
