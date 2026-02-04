/**
 * 需求类型管理接口
 * 包含需求类型的基础信息管理
 */
const express = require('express');
const router = express.Router();
const requirementTypeController = require('../mvc/controllers/requirementType');
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: 需求类型管理
 *   description: 需求类型基础信息管理接口
 */

/**
 * @swagger
 * /api/requirement-types/query:
 *   get:
 *     summary: 获取需求类型列表
 *     tags: [需求类型管理]
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
 *         description: 需求类型名称（模糊搜索）
 *       - in: query
 *         name: type
 *         schema:
 *           type: integer
 *         description: 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
 *     responses:
 *       200:
 *         description: 成功获取需求类型列表
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
 *                         $ref: '#/components/schemas/RequirementType'
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
router.get('/query', authenticateToken, requirementTypeController.getRequirementTypeList);

/**
 * @swagger
 * /api/requirement-types/create:
 *   post:
 *     summary: 创建需求类型
 *     tags: [需求类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 需求类型名称
 *               type:
 *                 type: integer
 *                 description: 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
 *               description:
 *                 type: string
 *                 description: 需求类型描述
 *               sort_order:
 *                 type: integer
 *                 description: 排序号（越小越靠前）
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *             required:
 *               - name
 *               - type
 *     responses:
 *       200:
 *         description: 需求类型创建成功
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
 *                   $ref: '#/components/schemas/RequirementType'
 */
router.post('/create', authenticateToken, requirementTypeController.createRequirementType);

/**
 * @swagger
 * /api/requirement-types/update:
 *   post:
 *     summary: 更新需求类型
 *     tags: [需求类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 需求类型ID
 *               name:
 *                 type: string
 *                 description: 需求类型名称
 *               type:
 *                 type: integer
 *                 description: 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
 *               description:
 *                 type: string
 *                 description: 需求类型描述
 *               sort_order:
 *                 type: integer
 *                 description: 排序号（越小越靠前）
 *               config:
 *                 type: object
 *                 description: 配置信息（JSON格式）
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 需求类型更新成功
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
 *                   $ref: '#/components/schemas/RequirementType'
 */
router.post('/update', authenticateToken, requirementTypeController.updateRequirementType);

/**
 * @swagger
 * /api/requirement-types/delete:
 *   post:
 *     summary: 删除需求类型
 *     tags: [需求类型管理]
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
 *                 description: 需求类型ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 需求类型删除成功
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
router.post('/delete', authenticateToken, requirementTypeController.deleteRequirementTypes);

/**
 * @swagger
 * /api/requirement-types/detail:
 *   get:
 *     summary: 获取需求类型详情
 *     tags: [需求类型管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 需求类型ID
 *     responses:
 *       200:
 *         description: 成功获取需求类型详情
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
 *                   $ref: '#/components/schemas/RequirementType'
 */
router.get('/detail', authenticateToken, requirementTypeController.getRequirementTypeDetail);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     RequirementType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 需求类型ID
 *         name:
 *           type: string
 *           description: 需求类型名称
 *         type:
 *           type: integer
 *           description: 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
 *         description:
 *           type: string
 *           description: 需求类型描述
 *         sort_order:
 *           type: integer
 *           description: 排序号（越小越靠前）
 *         config:
 *           type: object
 *           description: 配置信息（JSON格式）
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
