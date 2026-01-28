/**
 * 体系层级路由，提供层级类型和层级节点管理接口
 */
const express = require('express');
const router = express.Router();
const HierarchyController = require("../mvc/controllers/hierarchy");
const { authenticateToken } = require("../middleware/auth");


/**
 * 获取层级类型列表
 * GET /api/hierarchy-levels/list
 */
router.get('/hierarchy-levels/list', authenticateToken, HierarchyController.getAllNodeTypes);

/**
 * 获取层级类型详情
 * GET /api/hierarchy-levels/detail  params: { id }
 */
router.get('/hierarchy-levels/detail', authenticateToken, HierarchyController.getNodeTypeById);

/**
 * 创建层级类型
 * POST /api/hierarchy-levels/create  body: { name, description, level, fields }
 */
router.post('/hierarchy-levels/create', authenticateToken, HierarchyController.createNodeType);

/**
 * 更新层级类型
 * POST /api/hierarchy-levels/update  body: { id, name, description, level, fields }
 */
router.post('/hierarchy-levels/update', authenticateToken, HierarchyController.updateNodeType);

/**
 * 删除层级类型
 * POST /api/hierarchy-levels/delete  body: { id }
 */
router.post('/hierarchy-levels/delete', authenticateToken, HierarchyController.deleteNodeType);

/**
 * 添加层级字段
 * POST /api/hierarchy-levels/add-field  body: { id, name, type, required, description }
 */
router.post('/hierarchy-levels/add-field', authenticateToken, HierarchyController.createNodeTypeField);

/**
 * 更新层级字段
 * POST /api/hierarchy-levels/update-field  body: { id, field_id, name, type, required, description }
 */
router.post('/hierarchy-levels/update-field', authenticateToken, HierarchyController.updateNodeTypeField);

/**
 * 删除层级字段
 * POST /api/hierarchy-levels/delete-field  body: { id, field_id }
 */
router.post('/hierarchy-levels/delete-field', authenticateToken, HierarchyController.deleteNodeTypeField);

/**
 * 层级节点管理接口
 */
/**
 * 获取层级节点树
 * GET /api/hierarchy-nodes/list
 */
router.get('/hierarchy-nodes/list', authenticateToken, HierarchyController.getHierarchyTree);

/**
 * 获取层级节点详情
 * GET /api/hierarchy-nodes/detail  params: { id }
 */
router.get('/hierarchy-nodes/detail', authenticateToken, HierarchyController.getHierarchyNodeById);

/**
 * 创建层级节点
 * POST /api/hierarchy-nodes/create  body: { name, type_id, parent_id, data }
 */
router.post('/hierarchy-nodes/create', authenticateToken, HierarchyController.createHierarchyNode);

/**
 * 更新层级节点
 * POST /api/hierarchy-nodes/update  body: { id, name, parent_id, data }
 */
router.post('/hierarchy-nodes/update', authenticateToken, HierarchyController.updateHierarchyNode);

/**
 * 删除层级节点
 * POST /api/hierarchy-nodes/delete  body: { id }
 */
router.post('/hierarchy-nodes/delete', authenticateToken, HierarchyController.deleteHierarchyNode);

module.exports = router;




/**
 * @swagger
 * /api/hierarchy-levels/list:
 *   get:
 *     summary: 获取层级类型列表
 *     description: 获取所有层级类型配置
 *     tags: [层级类型管理]
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
 *                     $ref: '#/components/schemas/NodeType'
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/detail:
 *   get:
 *     summary: 获取层级类型详情
 *     description: 根据ID获取层级类型配置
 *     tags: [层级类型管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 层级类型ID
 *         example: 1
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
 *                   $ref: '#/components/schemas/NodeType'
 *       404:
 *         description: 未找到对应的层级类型
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/create:
 *   post:
 *     summary: 创建层级类型
 *     description: 创建新的层级类型配置
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNodeTypeRequest'
 *     responses:
 *       200:
 *         description: 创建成功
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
 *                   $ref: '#/components/schemas/NodeType'
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/update:
 *   post:
 *     summary: 更新层级类型
 *     description: 更新层级类型配置
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNodeTypeRequest'
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   $ref: '#/components/schemas/NodeType'
 *       404:
 *         description: 未找到对应的层级类型
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/delete:
 *   post:
 *     summary: 删除层级类型
 *     description: 删除指定的层级类型配置
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 层级类型ID
 *                 example: 1
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
 *                     message:
 *                       type: string
 *                       example: "删除成功"
 *       404:
 *         description: 未找到对应的层级类型
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/add-field:
 *   post:
 *     summary: 添加层级字段
 *     description: 为层级类型添加自定义字段
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNodeTypeFieldRequest'
 *     responses:
 *       200:
 *         description: 创建成功
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
 *                   $ref: '#/components/schemas/NodeTypeField'
 *       404:
 *         description: 未找到对应的层级类型
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/update-field:
 *   post:
 *     summary: 更新层级字段
 *     description: 更新层级类型字段的配置
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNodeTypeFieldRequest'
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   $ref: '#/components/schemas/NodeTypeField'
 *       404:
 *         description: 未找到对应的层级类型或字段
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-levels/delete-field:
 *   post:
 *     summary: 删除层级字段
 *     description: 删除层级类型字段
 *     tags: [层级类型管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - field_id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 层级类型ID
 *                 example: 1
 *               field_id:
 *                 type: integer
 *                 description: 字段ID
 *                 example: 1
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
 *                     message:
 *                       type: string
 *                       example: "删除成功"
 *       404:
 *         description: 未找到对应的层级类型或字段
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-nodes/list:
 *   get:
 *     summary: 获取层级节点树
 *     description: 获取完整的动态层级树结构
 *     tags: [层级节点管理]
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
 *                     $ref: '#/components/schemas/HierarchyNode'
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-nodes/detail:
 *   get:
 *     summary: 获取层级节点详情
 *     description: 根据ID获取层级节点信息
 *     tags: [层级节点管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 层级节点ID
 *         example: 1
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
 *                   $ref: '#/components/schemas/HierarchyNode'
 *       404:
 *         description: 未找到对应的层级节点
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-nodes/create:
 *   post:
 *     summary: 创建层级节点
 *     description: 创建新的层级节点
 *     tags: [层级节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHierarchyNodeRequest'
 *     responses:
 *       200:
 *         description: 创建成功
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
 *                   $ref: '#/components/schemas/HierarchyNode'
 *       400:
 *         description: 参数错误
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-nodes/update:
 *   post:
 *     summary: 更新层级节点
 *     description: 更新层级节点信息
 *     tags: [层级节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHierarchyNodeRequest'
 *     responses:
 *       200:
 *         description: 更新成功
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
 *                   $ref: '#/components/schemas/HierarchyNode'
 *       404:
 *         description: 未找到对应的层级节点
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * /api/hierarchy-nodes/delete:
 *   post:
 *     summary: 删除层级节点
 *     description: 删除层级节点及其子节点
 *     tags: [层级节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 层级节点ID
 *                 example: 1
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
 *                     message:
 *                       type: string
 *                       example: "删除成功"
 *       404:
 *         description: 未找到对应的层级节点
 *       500:
 *         description: 服务器错误
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     NodeType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 层级类型ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 层级类型名称
 *           example: "系统级"
 *         description:
 *           type: string
 *           description: 层级类型描述
 *           example: "系统级别的节点类型"
 *         level:
 *           type: integer
 *           description: 层级级别
 *           example: 1
 *         fields:
 *           type: array
 *           description: 自定义字段配置
 *           items:
 *             $ref: '#/components/schemas/NodeTypeField'
 *         create_time:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         update_time:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     NodeTypeField:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 字段ID
 *           example: 1
 *         node_type_id:
 *           type: integer
 *           description: 所属层级类型ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 字段名称
 *           example: "capacity"
 *         type:
 *           type: string
 *           description: 字段类型
 *           example: "number"
 *         required:
 *           type: boolean
 *           description: 是否必填
 *           example: false
 *         description:
 *           type: string
 *           description: 字段描述
 *           example: "节点容量"
 *         default_value:
 *           type: string
 *           description: 默认值
 *           example: "100"
 *
 *     HierarchyNode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 节点ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 节点名称
 *           example: "主系统"
 *         type_id:
 *           type: integer
 *           description: 节点类型ID
 *           example: 1
 *         parent_id:
 *           type: integer
 *           description: 父节点ID
 *           example: null
 *         data:
 *           type: object
 *           description: 节点自定义数据
 *           example: {}
 *         children:
 *           type: array
 *           description: 子节点列表
 *           items:
 *             $ref: '#/components/schemas/HierarchyNode'
 *         create_time:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         update_time:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *
 *     CreateNodeTypeRequest:
 *       type: object
 *       required:
 *         - name
 *         - level
 *       properties:
 *         name:
 *           type: string
 *           description: 层级类型名称（必填）
 *           example: "系统级"
 *         description:
 *           type: string
 *           description: 层级类型描述
 *           example: "系统级别的节点类型"
 *         level:
 *           type: integer
 *           description: 层级级别（必填）
 *           example: 1
 *         fields:
 *           type: array
 *           description: 自定义字段配置
 *           items:
 *             type: object
 *           example: []
 *
 *     UpdateNodeTypeRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: 层级类型ID（必填）
 *           example: 1
 *         name:
 *           type: string
 *           description: 层级类型名称
 *           example: "更新后的系统级"
 *         description:
 *           type: string
 *           description: 层级类型描述
 *           example: "更新后的系统级别节点类型"
 *         level:
 *           type: integer
 *           description: 层级级别
 *           example: 2
 *         fields:
 *           type: array
 *           description: 自定义字段配置
 *           items:
 *             type: object
 *           example: []
 *
 *     CreateNodeTypeFieldRequest:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: 层级类型ID（必填）
 *           example: 1
 *         name:
 *           type: string
 *           description: 字段名称（必填）
 *           example: "capacity"
 *         type:
 *           type: string
 *           description: 字段类型（必填）
 *           example: "number"
 *         required:
 *           type: boolean
 *           description: 是否必填
 *           example: false
 *         description:
 *           type: string
 *           description: 字段描述
 *           example: "节点容量"
 *         default_value:
 *           type: string
 *           description: 默认值
 *           example: "100"
 *
 *     UpdateNodeTypeFieldRequest:
 *       type: object
 *       required:
 *         - id
 *         - field_id
 *       properties:
 *         id:
 *           type: integer
 *           description: 层级类型ID（必填）
 *           example: 1
 *         field_id:
 *           type: integer
 *           description: 字段ID（必填）
 *           example: 1
 *         name:
 *           type: string
 *           description: 字段名称
 *           example: "updated_capacity"
 *         type:
 *           type: string
 *           description: 字段类型
 *           example: "number"
 *         required:
 *           type: boolean
 *           description: 是否必填
 *           example: true
 *         description:
 *           type: string
 *           description: 字段描述
 *           example: "更新后的节点容量"
 *         default_value:
 *           type: string
 *           description: 默认值
 *           example: "200"
 *
 *     CreateHierarchyNodeRequest:
 *       type: object
 *       required:
 *         - name
 *         - type_id
 *       properties:
 *         name:
 *           type: string
 *           description: 节点名称（必填）
 *           example: "新系统节点"
 *         type_id:
 *           type: integer
 *           description: 节点类型ID（必填）
 *           example: 1
 *         parent_id:
 *           type: integer
 *           description: 父节点ID（可选）
 *           example: null
 *         data:
 *           type: object
 *           description: 节点自定义数据
 *           example: {}
 *
 *     UpdateHierarchyNodeRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: 节点ID（必填）
 *           example: 1
 *         name:
 *           type: string
 *           description: 节点名称
 *           example: "更新后的系统节点"
 *         parent_id:
 *           type: integer
 *           description: 父节点ID
 *           example: null
 *         data:
 *           type: object
 *           description: 节点自定义数据
 *           example: {}
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT认证token
 */
