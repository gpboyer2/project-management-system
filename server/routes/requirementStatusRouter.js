/**
 * 需求状态管理接口路由
 */
const express = require('express');
const router = express.Router();
const requirementStatusController = require('../mvc/controllers/requirementStatus');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: 需求状态管理
 *   description: 需求状态的增删改查操作
 */

/**
 * @swagger
 * /api/requirement-statuses/query:
 *   get:
 *     summary: 获取需求状态列表
 *     tags: [需求状态管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 需求状态名称（模糊搜索）
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 状态（1-待处理，2-处理中，3-已完成，4-已取消）
 *     responses:
 *       200:
 *         description: 成功获取需求状态列表
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
 *                         $ref: '#/components/schemas/RequirementStatus'
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
router.get('/query', authenticateToken, requirementStatusController.getRequirementStatusList);

/**
 * @swagger
 * /api/requirement-statuses/detail:
 *   get:
 *     summary: 获取需求状态详情
 *     tags: [需求状态管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 需求状态ID
 *     responses:
 *       200:
 *         description: 成功获取需求状态详情
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
 *                   $ref: '#/components/schemas/RequirementStatus'
 */
router.get('/detail', authenticateToken, requirementStatusController.getRequirementStatusDetail);

/**
 * @swagger
 * /api/requirement-statuses/create:
 *   post:
 *     summary: 创建需求状态
 *     tags: [需求状态管理]
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
 *                 description: 需求状态名称
 *               status:
 *                 type: integer
 *                 default: 1
 *                 description: 状态（1-待处理，2-处理中，3-已完成，4-已取消）
 *               description:
 *                 type: string
 *                 description: 需求状态描述
 *               sort_order:
 *                 type: integer
 *                 default: 0
 *                 description: 排序号
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *     responses:
 *       200:
 *         description: 成功创建需求状态
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
 *                   $ref: '#/components/schemas/RequirementStatus'
 */
router.post('/create', authenticateToken, requirementStatusController.createRequirementStatus);

/**
 * @swagger
 * /api/requirement-statuses/update:
 *   post:
 *     summary: 更新需求状态
 *     tags: [需求状态管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 required: true
 *                 description: 需求状态ID
 *               name:
 *                 type: string
 *                 description: 需求状态名称
 *               status:
 *                 type: integer
 *                 description: 状态（1-待处理，2-处理中，3-已完成，4-已取消）
 *               description:
 *                 type: string
 *                 description: 需求状态描述
 *               sort_order:
 *                 type: integer
 *                 description: 排序号
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *     responses:
 *       200:
 *         description: 成功更新需求状态
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
 *                   $ref: '#/components/schemas/RequirementStatus'
 */
router.post('/update', authenticateToken, requirementStatusController.updateRequirementStatus);

/**
 * @swagger
 * /api/requirement-statuses/delete:
 *   post:
 *     summary: 删除需求状态
 *     tags: [需求状态管理]
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
 *                 required: true
 *                 description: 需求状态ID列表
 *     responses:
 *       200:
 *         description: 成功删除需求状态
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
 */
router.post('/delete', authenticateToken, requirementStatusController.deleteRequirementStatuses);

/**
 * @swagger
 * components:
 *   schemas:
 *     RequirementStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 需求状态ID
 *         name:
 *           type: string
 *           description: 需求状态名称
 *         status:
 *           type: integer
 *           description: 状态（1-待处理，2-处理中，3-已完成，4-已取消）
 *         description:
 *           type: string
 *           description: 需求状态描述
 *         sort_order:
 *           type: integer
 *           description: 排序号
 *         config:
 *           type: object
 *           description: 配置信息（JSON格式）
 *         created_at:
 *           type: integer
 *           description: 创建时间（时间戳）
 *         updated_at:
 *           type: integer
 *           description: 更新时间（时间戳）
 */

module.exports = router;
