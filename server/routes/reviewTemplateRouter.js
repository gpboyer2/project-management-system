/**
 * 评审流程模板管理接口
 * 包含评审流程模板和模板节点管理
 */
const express = require('express');
const router = express.Router();
const reviewTemplateController = require('../mvc/controllers/reviewTemplateController');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 评审流程模板管理
 *   description: 评审流程模板和模板节点管理接口
 */

/**
 * @swagger
 * /api/review-templates/query:
 *   get:
 *     summary: 获取评审模板列表
 *     tags: [评审流程模板管理]
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
 *         name: template_type
 *         schema:
 *           type: integer
 *         description: 模板类型（1-技术评审 2-业务评审 3-产品评审）
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 状态（1-启用 0-禁用）
 *     responses:
 *       200:
 *         description: 成功获取评审模板列表
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
 *                         $ref: '#/components/schemas/ReviewTemplate'
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
router.get('/query', authenticateToken, reviewTemplateController.getReviewTemplateList);

/**
 * @swagger
 * /api/review-templates/get:
 *   get:
 *     summary: 获取模板详情
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 成功获取模板详情
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
 *                   $ref: '#/components/schemas/ReviewTemplate'
 */
router.get('/get', authenticateToken, reviewTemplateController.getReviewTemplateById);

/**
 * @swagger
 * /api/review-templates/get-default:
 *   get:
 *     summary: 获取默认模板
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: template_type
 *         schema:
 *           type: integer
 *         description: 模板类型（1-技术评审 2-业务评审 3-产品评审），默认1
 *     responses:
 *       200:
 *         description: 成功获取默认模板
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
 *                   $ref: '#/components/schemas/ReviewTemplate'
 */
router.get('/get-default', authenticateToken, reviewTemplateController.getDefaultReviewTemplate);

/**
 * @swagger
 * /api/review-templates/create:
 *   post:
 *     summary: 创建评审模板
 *     tags: [评审流程模板管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *                 description: 模板名称
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               template_type:
 *                 type: integer
 *                 description: 模板类型（1-技术评审 2-业务评审 3-产品评审），默认1
 *               is_default:
 *                 type: boolean
 *                 description: 是否为默认模板，默认false
 *               nodes:
 *                 type: array
 *                 description: 模板节点列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     node_type_id:
 *                       type: integer
 *                     parent_node_id:
 *                       type: integer
 *                     node_order:
 *                       type: integer
 *                     assignee_type:
 *                       type: integer
 *                     assignee_id:
 *                       type: integer
 *                     duration_limit:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 成功创建评审模板
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
 *                   $ref: '#/components/schemas/ReviewTemplate'
 */
router.post('/create', authenticateToken, reviewTemplateController.createReviewTemplate);

/**
 * @swagger
 * /api/review-templates/update:
 *   post:
 *     summary: 更新评审模板
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 模板ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               description:
 *                 type: string
 *                 description: 模板描述
 *               template_type:
 *                 type: integer
 *                 description: 模板类型（1-技术评审 2-业务评审 3-产品评审）
 *               is_default:
 *                 type: boolean
 *                 description: 是否为默认模板
 *               nodes:
 *                 type: array
 *                 description: 模板节点列表
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     node_type_id:
 *                       type: integer
 *                     parent_node_id:
 *                       type: integer
 *                     node_order:
 *                       type: integer
 *                     assignee_type:
 *                       type: integer
 *                     assignee_id:
 *                       type: integer
 *                     duration_limit:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 成功更新评审模板
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
 *                   $ref: '#/components/schemas/ReviewTemplate'
 */
router.post('/update', authenticateToken, reviewTemplateController.updateReviewTemplate);

/**
 * @swagger
 * /api/review-templates/delete:
 *   post:
 *     summary: 删除评审模板
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 成功删除评审模板
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
 *                   type: null
 */
router.post('/delete', authenticateToken, reviewTemplateController.deleteReviewTemplate);

/**
 * @swagger
 * /api/review-templates/update-status:
 *   post:
 *     summary: 启用/禁用评审模板
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 模板ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         required: true
 *         description: 状态（1-启用 0-禁用）
 *     responses:
 *       200:
 *         description: 成功更新模板状态
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
 *                   type: null
 */
router.post('/update-status', authenticateToken, reviewTemplateController.updateReviewTemplateStatus);

/**
 * @swagger
 * /api/review-templates/set-default:
 *   post:
 *     summary: 设置默认模板
 *     tags: [评审流程模板管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 模板ID
 *     responses:
 *       200:
 *         description: 成功设置默认模板
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
 *                   type: null
 */
router.post('/set-default', authenticateToken, reviewTemplateController.setDefaultReviewTemplate);

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 模板ID
 *         name:
 *           type: string
 *           description: 模板名称
 *         description:
 *           type: string
 *           description: 模板描述
 *         template_type:
 *           type: integer
 *           description: 模板类型（1-技术评审 2-业务评审 3-产品评审）
 *         is_default:
 *           type: boolean
 *           description: 是否为默认模板
 *         status:
 *           type: integer
 *           description: 状态（1-启用 0-禁用）
 *         create_time:
 *           type: integer
 *           description: 创建时间
 *         update_time:
 *           type: integer
 *           description: 更新时间
 *         nodes:
 *           type: array
 *           description: 模板节点列表
 *           items:
 *             $ref: '#/components/schemas/ReviewTemplateNode'
 *
 *     ReviewTemplateNode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 节点ID
 *         template_id:
 *           type: integer
 *           description: 模板ID
 *         name:
 *           type: string
 *           description: 节点名称
 *         node_type_id:
 *           type: integer
 *           description: 节点类型ID
 *         parent_node_id:
 *           type: integer
 *           description: 父节点ID
 *         node_order:
 *           type: integer
 *           description: 节点顺序
 *         assignee_type:
 *           type: integer
 *           description: 负责人类型（1-固定用户 2-角色 3-部门）
 *         assignee_id:
 *           type: integer
 *           description: 负责人ID
 *         duration_limit:
 *           type: integer
 *           description: 处理时限(小时)
 *         status:
 *           type: integer
 *           description: 状态（1-启用 0-禁用）
 *         create_time:
 *           type: integer
 *           description: 创建时间
 *         update_time:
 *           type: integer
 *           description: 更新时间
 *         nodeType:
 *           $ref: '#/components/schemas/ProcessNodeType'
 *         assignee:
 *           $ref: '#/components/schemas/User'
 */

module.exports = router;
