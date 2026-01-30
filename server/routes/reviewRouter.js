/**
 * 评审管理接口
 * 包含评审基础信息管理和评审流程节点管理
 */
const express = require('express');
const router = express.Router();
const reviewController = require('../mvc/controllers/review');

/**
 * @swagger
 * tags:
 *   name: 评审管理
 *   description: 评审基础信息和流程节点管理接口
 */

/**
 * @swagger
 * /api/reviews/query:
 *   get:
 *     summary: 获取评审列表
 *     tags: [评审管理]
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
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: 项目ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 *     responses:
 *       200:
 *         description: 成功获取评审列表
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
 *                         $ref: '#/components/schemas/Review'
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
router.get('/query', reviewController.getReviewList);

/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     summary: 创建评审
 *     tags: [评审管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 评审名称
 *               description:
 *                 type: string
 *                 description: 评审描述
 *               review_type:
 *                 type: integer
 *                 description: 评审类型（1-技术评审 2-业务评审 3-产品评审）
 *               status:
 *                 type: integer
 *                 description: 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 *               reporter_id:
 *                 type: integer
 *                 description: 评审发起人用户ID
 *               reviewer_id:
 *                 type: integer
 *                 description: 评审负责人用户ID
 *               project_id:
 *                 type: integer
 *                 description: 所属项目ID
 *               start_time:
 *                 type: integer
 *                 description: 开始时间（Unix时间戳）
 *               end_time:
 *                 type: integer
 *                 description: 结束时间（Unix时间戳）
 *             required:
 *               - name
 *               - reporter_id
 *               - project_id
 *     responses:
 *       200:
 *         description: 评审创建成功
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
 *                   $ref: '#/components/schemas/Review'
 */
router.post('/create', reviewController.createReview);

/**
 * @swagger
 * /api/reviews/update:
 *   post:
 *     summary: 更新评审
 *     tags: [评审管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 评审ID
 *               name:
 *                 type: string
 *                 description: 评审名称
 *               description:
 *                 type: string
 *                 description: 评审描述
 *               review_type:
 *                 type: integer
 *                 description: 评审类型（1-技术评审 2-业务评审 3-产品评审）
 *               status:
 *                 type: integer
 *                 description: 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 *               reporter_id:
 *                 type: integer
 *                 description: 评审发起人用户ID
 *               reviewer_id:
 *                 type: integer
 *                 description: 评审负责人用户ID
 *               project_id:
 *                 type: integer
 *                 description: 所属项目ID
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
 *         description: 评审更新成功
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
 *                   $ref: '#/components/schemas/Review'
 */
router.post('/update', reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/delete:
 *   post:
 *     summary: 删除评审
 *     tags: [评审管理]
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
 *                 description: 评审ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 评审删除成功
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
router.post('/delete', reviewController.deleteReviews);

/**
 * @swagger
 * /api/reviews/detail:
 *   get:
 *     summary: 获取评审详情
 *     tags: [评审管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 评审ID
 *     responses:
 *       200:
 *         description: 成功获取评审详情
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
 *                   $ref: '#/components/schemas/Review'
 */
router.get('/detail', reviewController.getReviewDetail);

/**
 * @swagger
 * /api/reviews/process-nodes/query:
 *   get:
 *     summary: 获取评审流程节点列表
 *     tags: [评审管理]
 *     parameters:
 *       - in: query
 *         name: reviewId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 评审ID
 *     responses:
 *       200:
 *         description: 成功获取评审流程节点列表
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReviewProcessNode'
 */
router.get('/process-nodes/query', reviewController.getReviewProcessNodes);

/**
 * @swagger
 * /api/reviews/process-nodes/create:
 *   post:
 *     summary: 创建评审流程节点
 *     tags: [评审管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               review_id:
 *                 type: integer
 *                 description: 关联评审ID
 *               name:
 *                 type: string
 *                 description: 节点名称
 *               node_type_id:
 *                 type: integer
 *                 description: 流程节点类型ID
 *               parent_node_id:
 *                 type: integer
 *                 description: 父节点ID
 *               node_order:
 *                 type: integer
 *                 description: 节点顺序
 *               assignee_type:
 *                 type: integer
 *                 description: 负责人类型（1-固定用户 2-角色 3-部门）
 *               assignee_id:
 *                 type: integer
 *                 description: 负责人ID
 *               duration_limit:
 *                 type: integer
 *                 description: 处理时限(小时)
 *               status:
 *                 type: integer
 *                 description: 状态（1-启用 0-禁用）
 *             required:
 *               - review_id
 *               - name
 *               - node_type_id
 *               - node_order
 *     responses:
 *       200:
 *         description: 节点创建成功
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
 *                   $ref: '#/components/schemas/ReviewProcessNode'
 */
router.post('/process-nodes/create', reviewController.createReviewProcessNode);

/**
 * @swagger
 * /api/reviews/process-nodes/update:
 *   post:
 *     summary: 更新评审流程节点
 *     tags: [评审管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 节点ID
 *               name:
 *                 type: string
 *                 description: 节点名称
 *               node_type_id:
 *                 type: integer
 *                 description: 流程节点类型ID
 *               parent_node_id:
 *                 type: integer
 *                 description: 父节点ID
 *               node_order:
 *                 type: integer
 *                 description: 节点顺序
 *               assignee_type:
 *                 type: integer
 *                 description: 负责人类型（1-固定用户 2-角色 3-部门）
 *               assignee_id:
 *                 type: integer
 *                 description: 负责人ID
 *               duration_limit:
 *                 type: integer
 *                 description: 处理时限(小时)
 *               status:
 *                 type: integer
 *                 description: 状态（1-启用 0-禁用）
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 节点更新成功
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
 *                   $ref: '#/components/schemas/ReviewProcessNode'
 */
router.post('/process-nodes/update', reviewController.updateReviewProcessNode);

/**
 * @swagger
 * /api/reviews/process-nodes/delete:
 *   post:
 *     summary: 删除评审流程节点
 *     tags: [评审管理]
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
 *                 description: 节点ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 节点删除成功
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
router.post('/process-nodes/delete', reviewController.deleteReviewProcessNodes);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 评审ID
 *         project_id:
 *           type: integer
 *           description: 所属项目ID
 *         name:
 *           type: string
 *           description: 评审名称
 *         description:
 *           type: string
 *           description: 评审描述
 *         review_type:
 *           type: integer
 *           description: 评审类型（1-技术评审 2-业务评审 3-产品评审）
 *         status:
 *           type: integer
 *           description: 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 *         reporter_id:
 *           type: integer
 *           description: 评审发起人用户ID
 *         reviewer_id:
 *           type: integer
 *           description: 评审负责人用户ID
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
 *         reporter:
 *           $ref: '#/components/schemas/User'
 *         reviewer:
 *           $ref: '#/components/schemas/User'
 *         project:
 *           $ref: '#/components/schemas/Project'
 *
 *     ReviewProcessNode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 节点ID
 *         review_id:
 *           type: integer
 *           description: 关联评审ID
 *         name:
 *           type: string
 *           description: 节点名称
 *         node_type_id:
 *           type: integer
 *           description: 流程节点类型ID
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
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 */
