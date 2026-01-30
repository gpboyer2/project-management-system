/**
 * 需求管理接口
 * 包含需求基础信息管理和需求流程节点管理
 */
const express = require('express');
const router = express.Router();
const requirementController = require('../mvc/controllers/requirement');

/**
 * @swagger
 * tags:
 *   name: 需求管理
 *   description: 需求基础信息和流程节点管理接口
 */

/**
 * @swagger
 * /api/requirements/query:
 *   get:
 *     summary: 获取需求列表
 *     tags: [需求管理]
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
 *         description: 需求状态
 *     responses:
 *       200:
 *         description: 成功获取需求列表
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
 *                         $ref: '#/components/schemas/Requirement'
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
router.get('/query', requirementController.getRequirementList);

/**
 * @swagger
 * /api/requirements/create:
 *   post:
 *     summary: 创建需求
 *     tags: [需求管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 需求名称
 *               description:
 *                 type: string
 *                 description: 需求描述
 *               type_id:
 *                 type: integer
 *                 description: 需求类型ID
 *               priority:
 *                 type: integer
 *                 description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *               status_id:
 *                 type: integer
 *                 description: 需求状态ID
 *               current_assignee_id:
 *                 type: integer
 *                 description: 当前负责人用户ID
 *               reporter_id:
 *                 type: integer
 *                 description: 提出人用户ID
 *               project_id:
 *                 type: integer
 *                 description: 所属项目ID
 *               planned_version:
 *                 type: string
 *                 description: 规划版本
 *               actual_version:
 *                 type: string
 *                 description: 实际上线版本
 *             required:
 *               - name
 *               - type_id
 *               - priority
 *               - status_id
 *               - reporter_id
 *     responses:
 *       200:
 *         description: 需求创建成功
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
 *                   $ref: '#/components/schemas/Requirement'
 */
router.post('/create', requirementController.createRequirement);

/**
 * @swagger
 * /api/requirements/update:
 *   post:
 *     summary: 更新需求
 *     tags: [需求管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 需求ID
 *               name:
 *                 type: string
 *                 description: 需求名称
 *               description:
 *                 type: string
 *                 description: 需求描述
 *               type_id:
 *                 type: integer
 *                 description: 需求类型ID
 *               priority:
 *                 type: integer
 *                 description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *               status_id:
 *                 type: integer
 *                 description: 需求状态ID
 *               current_assignee_id:
 *                 type: integer
 *                 description: 当前负责人用户ID
 *               reporter_id:
 *                 type: integer
 *                 description: 提出人用户ID
 *               project_id:
 *                 type: integer
 *                 description: 所属项目ID
 *               planned_version:
 *                 type: string
 *                 description: 规划版本
 *               actual_version:
 *                 type: string
 *                 description: 实际上线版本
 *             required:
 *               - id
 *     responses:
 *       200:
 *         description: 需求更新成功
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
 *                   $ref: '#/components/schemas/Requirement'
 */
router.post('/update', requirementController.updateRequirement);

/**
 * @swagger
 * /api/requirements/delete:
 *   post:
 *     summary: 删除需求
 *     tags: [需求管理]
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
 *                 description: 需求ID列表
 *             required:
 *               - data
 *     responses:
 *       200:
 *         description: 需求删除成功
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
router.post('/delete', requirementController.deleteRequirements);

/**
 * @swagger
 * /api/requirements/detail:
 *   get:
 *     summary: 获取需求详情
 *     tags: [需求管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 需求ID
 *     responses:
 *       200:
 *         description: 成功获取需求详情
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
 *                   $ref: '#/components/schemas/Requirement'
 */
router.get('/detail', requirementController.getRequirementDetail);

/**
 * @swagger
 * /api/requirements/process-nodes/query:
 *   get:
 *     summary: 获取需求流程节点列表
 *     tags: [需求管理]
 *     parameters:
 *       - in: query
 *         name: requirementId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 需求ID
 *     responses:
 *       200:
 *         description: 成功获取需求流程节点列表
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
 *                     $ref: '#/components/schemas/RequirementProcessNode'
 */
router.get('/process-nodes/query', requirementController.getRequirementProcessNodes);

/**
 * @swagger
 * /api/requirements/process-nodes/create:
 *   post:
 *     summary: 创建需求流程节点
 *     tags: [需求管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requirement_id:
 *                 type: integer
 *                 description: 关联需求ID
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
 *               - requirement_id
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
 *                   $ref: '#/components/schemas/RequirementProcessNode'
 */
router.post('/process-nodes/create', requirementController.createRequirementProcessNode);

/**
 * @swagger
 * /api/requirements/process-nodes/update:
 *   post:
 *     summary: 更新需求流程节点
 *     tags: [需求管理]
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
 *                   $ref: '#/components/schemas/RequirementProcessNode'
 */
router.post('/process-nodes/update', requirementController.updateRequirementProcessNode);

/**
 * @swagger
 * /api/requirements/process-nodes/delete:
 *   post:
 *     summary: 删除需求流程节点
 *     tags: [需求管理]
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
router.post('/process-nodes/delete', requirementController.deleteRequirementProcessNodes);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Requirement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 需求ID
 *         name:
 *           type: string
 *           description: 需求名称
 *         type_id:
 *           type: integer
 *           description: 需求类型ID
 *         description:
 *           type: string
 *           description: 需求描述
 *         priority:
 *           type: integer
 *           description: 优先级（1-P0 2-P1 3-P2 4-P3）
 *         status_id:
 *           type: integer
 *           description: 需求状态ID
 *         current_assignee_id:
 *           type: integer
 *           description: 当前负责人用户ID
 *         reporter_id:
 *           type: integer
 *           description: 提出人用户ID
 *         project_id:
 *           type: integer
 *           description: 所属项目ID
 *         planned_version:
 *           type: string
 *           description: 规划版本
 *         actual_version:
 *           type: string
 *           description: 实际上线版本
 *         create_time:
 *           type: integer
 *           description: 创建时间（Unix时间戳）
 *         update_time:
 *           type: integer
 *           description: 更新时间（Unix时间戳）
 *         current_assignee:
 *           $ref: '#/components/schemas/User'
 *         reporter:
 *           $ref: '#/components/schemas/User'
 *         project:
 *           $ref: '#/components/schemas/Project'
 *
 *     RequirementProcessNode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 节点ID
 *         requirement_id:
 *           type: integer
 *           description: 关联需求ID
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
