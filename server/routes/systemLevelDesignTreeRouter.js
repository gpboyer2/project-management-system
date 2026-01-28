const express = require('express');
const router = express.Router();
const SystemLevelDesignTreeController = require("../mvc/controllers/systemLevelDesignTree");
const { authenticateToken } = require("../middleware/auth");


/**
 * 获取所有节点
 * GET /api/system-level-design-tree/nodes?projectId=1&level=1
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.get('/nodes', authenticateToken, SystemLevelDesignTreeController.getAllNodes);

/**
 * 获取节点详情
 * GET /api/system-level-design-tree/nodes/detail?id=xxx
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.get('/nodes/detail', authenticateToken, SystemLevelDesignTreeController.getNodeById);

/**
 * 获取子节点
 * GET /api/system-level-design-tree/nodes/children?parentId=xxx
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.get('/nodes/children', authenticateToken, SystemLevelDesignTreeController.getChildNodes);

/**
 * 创建节点（支持单个和批量，入参统一为数组）
 * POST /api/system-level-design-tree/nodes/create
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.post('/nodes/create', authenticateToken, SystemLevelDesignTreeController.createNodeList);

/**
 * 更新节点（支持单个和批量，入参统一为数组）
 * PUT /api/system-level-design-tree/nodes/update
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.put('/nodes/update', authenticateToken, SystemLevelDesignTreeController.updateNodeList);

/**
 * 删除节点（支持单个和批量，入参为 { ids: [...] }）
 * POST /api/system-level-design-tree/nodes/delete
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.post('/nodes/delete', authenticateToken, SystemLevelDesignTreeController.deleteNodeList);

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: 体系配置树管理
 *     description: 架构树节点管理相关接口
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes:
 *   get:
 *     summary: 获取所有节点
 *     description: 获取体系配置树的所有节点，支持按项目和层级筛选
 *     tags:
 *       - 体系配置树管理
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: 项目ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: 层级
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeListResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/detail:
 *   get:
 *     summary: 根据ID获取节点
 *     description: 获取指定ID的节点详细信息
 *     tags:
 *       - 体系配置树管理
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 节点ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/children:
 *   get:
 *     summary: 获取子节点
 *     description: 获取指定节点的所有子节点
 *     tags:
 *       - 体系配置树管理
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 父节点ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NodeListResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes:
 *   post:
 *     summary: 创建节点
 *     description: 创建新的体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NodeCreate'
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/create:
 *   post:
 *     summary: 批量创建节点
 *     description: 批量创建体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchNodeCreate'
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/update:
 *   put:
 *     summary: 更新节点
 *     description: 更新指定的体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NodeUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/update:
 *   put:
 *     summary: 批量更新节点
 *     description: 批量更新体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchNodeUpdate'
 *     responses:
 *       200:
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/delete:
 *   post:
 *     summary: 删除节点
 *     description: 删除指定的体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchDeleteRequest'
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/system-level-design-tree/nodes/delete:
 *   post:
 *     summary: 批量删除节点
 *     description: 批量删除体系配置树节点
 *     tags:
 *       - 体系配置树管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchDeleteRequest'
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           type: object
 *           description: 响应数据
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         current_page:
 *           type: integer
 *           description: 当前页码
 *         page_size:
 *           type: integer
 *           description: 每页数量
 *         total:
 *           type: integer
 *           description: 总记录数
 *
 *     NodeCreate:
 *       type: object
 *       required:
 *         - node_type_id
 *         - properties
 *       properties:
 *         node_type_id:
 *           type: string
 *           description: 节点类型ID（对应层级配置的id，由用户在层级设置页面自定义）
 *         parent_id:
 *           type: string
 *           description: 父节点ID
 *         description:
 *           type: string
 *           description: 节点描述
 *         properties:
 *           $ref: '#/components/schemas/NodeProperties'
 *           description: 节点属性（必须包含"名称"字段）
 *
 *     NodeUpdate:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           description: 节点ID
 *         description:
 *           type: string
 *           description: 节点描述
 *         properties:
 *           $ref: '#/components/schemas/NodeProperties'
 *           description: 节点属性（必须包含"名称"字段）
 *
 *     NodeProperties:
 *       type: object
 *       required:
 *         - 名称
 *       properties:
 *         名称:
 *           type: string
 *           description: 节点名称（必填）
 *         版本:
 *           type: string
 *           description: 节点版本
 *         描述:
 *           type: string
 *           description: 节点描述
 *       description: 节点动态属性，内容由层级配置决定，"名称"字段为必填
 *
 *     BatchNodeCreate:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/NodeCreate'
 *
 *     BatchNodeUpdate:
 *       type: array
 *       items:
 *         allOf:
 *           - $ref: '#/components/schemas/NodeUpdate'
 *           - type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 节点ID
 *
 *     BatchDeleteRequest:
 *       type: object
 *       required:
 *         - ids
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: 节点ID数组
 *
 *     NodeListResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SystemLevelDesignTree'
 *
 *     NodeResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           $ref: '#/components/schemas/SystemLevelDesignTree'
 *
 *     SystemLevelDesignTree:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         type:
 *           type: string
 *         parentId:
 *           type: integer
 *         projectId:
 *           type: integer
 *         level:
 *           type: integer
 *         properties:
 *           type: object
 *           description: 节点属性（包含"名称"字段）
 *         createTime:
 *           type: string
 *           format: date-time
 *         updateTime:
 *           type: string
 *           format: date-time
 *
 *     GenerateCodeResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           type: object
 *           properties:
 *             nodeId:
 *               type: string
 *             codeFiles:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fileName:
 *                     type: string
 *                   content:
 *                     type: string
 */
