/**
 * 报文配置管理路由
 */
const express = require('express');
const router = express.Router();
const PacketMessageController = require("../mvc/controllers/packetMessage");
const { authenticateToken } = require("../middleware/auth");


/**
 * 获取报文列表
 * GET /api/packet-messages/list?page=1&size=10
 */
router.get('/list', authenticateToken, PacketMessageController.list);

/**
 * 管理端列表（包含草稿 + 最新已发布）
 * GET /api/packet-messages/manage/list
 */
router.get('/manage/list', authenticateToken, PacketMessageController.manageList);

/**
 * 版本系统（草稿/发布/历史）
 */
// 创建草稿（未发布修订）
router.post('/draft/create', authenticateToken, PacketMessageController.draftCreate);
// 保存草稿（未发布修订）
router.post('/draft/update', authenticateToken, PacketMessageController.draftUpdate);
// 获取草稿详情
router.get('/draft/detail', authenticateToken, PacketMessageController.draftDetail);
// 检查草稿是否存在（根据 message_id）
// GET 支持单个，POST 支持批量（入参为数组）
router.get('/draft/check', authenticateToken, PacketMessageController.draftCheck);
router.post('/draft/check', authenticateToken, PacketMessageController.draftCheck);
// 确保草稿存在（不存在则从最新已发布复制）
router.post('/draft/ensure', authenticateToken, PacketMessageController.draftEnsure);
// 草稿复制（从某条报文复制出一个新的协议草稿）
router.post('/draft/duplicate', authenticateToken, PacketMessageController.draftDuplicate);
// 发布草稿（自动 +1.0）
router.post('/draft/publish', authenticateToken, PacketMessageController.draftPublish);
// 版本列表（仅已发布版本）
router.get('/versions', authenticateToken, PacketMessageController.versionList);


/**
 * 创建新报文
 * POST /api/packet-messages/create  body: { name, hierarchy_node_id, protocol, ... }
 */
router.post('/create', authenticateToken, PacketMessageController.create);


/**
 * 获取已发布报文详情
 * GET /api/packet-messages/published  params: { id }
 */
router.get('/published', authenticateToken, PacketMessageController.publishedDetail);

/**
 * 获取报文详情
 * GET /api/packet-messages/detail  params: { id }
 */
router.get('/detail', authenticateToken, PacketMessageController.detail);


/**
 * 更新报文
 * POST /api/packet-messages/update  body: { id, name, hierarchy_node_id, protocol, ... }
 */
router.post('/update', authenticateToken, PacketMessageController.update);


/**
 * 复制报文
 * POST /api/packet-messages/duplicate  body: { id }
 */
router.post('/duplicate', authenticateToken, PacketMessageController.duplicate);


/**
 * 导出报文
 * POST /api/packet-messages/export-single  body: { id }
 */
router.post('/export-single', authenticateToken, PacketMessageController.export);


/**
 * 获取报文引用关系
 * GET /api/packet-messages/references  params: { id }
 */
router.get('/references', authenticateToken, PacketMessageController.getPacketReferences);


/**
 * 添加字段
 * POST /api/packet-messages/add-field  body: { id, name, type, ... }
 */
router.post('/add-field', authenticateToken, PacketMessageController.addField);


/**
 * 更新字段
 * POST /api/packet-messages/update-field  body: { id, field_id, name, type, ... }
 */
router.post('/update-field', authenticateToken, PacketMessageController.updateField);


/**
 * 删除字段
 * POST /api/packet-messages/delete-field  body: { id, field_id }
 */
router.post('/delete-field', authenticateToken, PacketMessageController.deleteField);


/**
 * 添加嵌套字段
 * POST /api/packet-messages/add-nested-field  body: { id, parent_id, name, type, ... }
 */
router.post('/add-nested-field', authenticateToken, PacketMessageController.addNestedField);


/**
 * 获取扁平化字段列表
 * GET /api/packet-messages/fields/flattened  params: { id }
 */
router.get('/fields/flattened', authenticateToken, PacketMessageController.getFlattenedFields);


/**
 * 切换字段展开状态
 * POST /api/packet-messages/toggle-field  body: { id, field_id, expanded }
 */
router.post('/toggle-field', authenticateToken, PacketMessageController.toggleFieldExpanded);


/**
 * 重新排序字段
 * POST /api/packet-messages/reorder-fields  body: { id, field_ids }
 */
router.post('/reorder-fields', authenticateToken, PacketMessageController.reorderFields);


/**
 * 启用报文（支持批量）
 * POST /api/packet-messages/enable  body: { ids }
 */
router.post('/enable', authenticateToken, PacketMessageController.enable);


/**
 * 禁用报文（支持批量）
 * POST /api/packet-messages/disable  body: { ids }
 */
router.post('/disable', authenticateToken, PacketMessageController.disable);


/**
 * 删除报文（支持批量）
 * POST /api/packet-messages/delete  body: { ids }
 */
router.post('/delete', authenticateToken, PacketMessageController.deleteList);


/**
 * 批量导出报文
 * POST /api/packet-messages/export  body: { ids }
 */
router.post('/export', authenticateToken, PacketMessageController.batchExport);


/**
 * 生成代码（预览）
 * POST /api/packet-messages/generate-code  body: { id }
 */
router.post('/generate-code', authenticateToken, PacketMessageController.generateCode);


/**
 * 导入报文
 * POST /api/packet-messages/import  body: multipart/form-data
 */
router.post('/import', authenticateToken, PacketMessageController.import);


/**
 * 获取字段类型列表
 * GET /api/packet-messages/field-types/list
 */
router.get('/field-types/list', authenticateToken, PacketMessageController.getFieldTypes);


/**
 * 获取字段类型配置
 * GET /api/packet-messages/field-types/config  params: { type }
 */
router.get('/field-types/config', authenticateToken, PacketMessageController.getFieldTypeConfig);


/**
 * 获取层级节点列表
 * GET /api/packet-messages/nodes/list
 */
router.get('/nodes/list', authenticateToken, PacketMessageController.getHierarchyNodeList);


module.exports = router;




/**
 * @swagger
 * /api/packet-messages/list:
 *   get:
 *     summary: 获取报文列表
 *     description: 获取所有报文配置，支持分页、搜索和筛选
 *     tags: [报文配置管理]
 *     parameters:
 *       - in: query
 *         name: current_page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 当前页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词（报文名称或描述）
 *       - in: query
 *         name: hierarchy_node_id
 *         schema:
 *           type: string
 *         description: 层级节点筛选
 *       - in: query
 *         name: protocol
 *         schema:
 *           type: string
 *         description: 协议筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: 状态筛选（0-禁用，1-启用）
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PacketMessageListResponse'
 */

/**
 * @swagger
 * /api/packet-messages/create:
 *   post:
 *     summary: 创建新报文
 *     description: 创建新的报文配置
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageCreate'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/detail:
 *   get:
 *     summary: 获取报文详情
 *     description: 获取指定报文的完整配置信息（含字段定义）
 *     tags: [报文配置管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 报文ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageDetailResponse'
 */

/**
 * @swagger
 * /api/packet-messages/update:
 *   post:
 *     summary: 更新报文
 *     description: 更新指定报文的配置信息
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageUpdate'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/duplicate:
 *   post:
 *     summary: 复制报文
 *     description: 复制指定的报文配置
 *     tags: [报文配置管理]
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
 *                 description: 报文ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/export-single:
 *   post:
 *     summary: 导出报文
 *     description: 导出指定的报文配置为JSON文件
 *     tags: [报文配置管理]
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
 *                 description: 报文ID
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/packet-messages/enable:
 *   post:
 *     summary: 启用报文（支持批量）
 *     description: 启用选中的报文，入参为数组，天然支持批量操作
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchOperationRequest'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/disable:
 *   post:
 *     summary: 禁用报文（支持批量）
 *     description: 禁用选中的报文，入参为数组，天然支持批量操作
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchOperationRequest'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/delete:
 *   post:
 *     summary: 删除报文（支持批量）
 *     description: 删除选中的报文，入参为数组，天然支持批量操作
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchOperationRequest'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/export:
 *   post:
 *     summary: 导出报文（支持批量）
 *     description: 导出选中的报文为JSON文件，入参为数组，天然支持批量操作
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchOperationRequest'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/packet-messages/import:
 *   post:
 *     summary: 导入报文
 *     description: 从JSON文件导入报文配置
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 报文配置文件
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/packet-messages/field-types/list:
 *   get:
 *     summary: 获取字段类型列表
 *     description: 获取所有支持的字段类型
 *     tags: [报文配置管理]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FieldTypeListResponse'
 */

/**
 * @swagger
 * /api/packet-messages/field-types/config:
 *   get:
 *     summary: 获取字段类型配置
 *     description: 获取指定字段类型的详细配置
 *     tags: [报文配置管理]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: 字段类型
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FieldTypeConfigResponse'
 */

/**
 * @swagger
 * /api/packet-messages/nodes/list:
 *   get:
 *     summary: 获取层级节点列表
 *     description: 获取所有层级节点列表
 *     tags: [报文配置管理]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceListResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MessageCreate:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: 报文名称
 *         description:
 *           type: string
 *           description: 报文描述
 *         hierarchy_node_id:
 *           type: string
 *           description: 关联层级节点
 *         protocol:
 *           type: string
 *           description: 通信协议
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MessageField'
 *           description: 字段定义列表
 *
 *     MessageUpdate:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: 报文ID
 *         name:
 *           type: string
 *           description: 报文名称
 *         description:
 *           type: string
 *           description: 报文描述
 *         hierarchy_node_id:
 *           type: string
 *           description: 关联层级节点
 *         protocol:
 *           type: string
 *           description: 通信协议
 *         status:
 *           type: integer
 *           enum: [0, 1]
 *           description: 状态（0-禁用，1-启用）
 *
 *     MessageField:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           description: 字段名称
 *         type:
 *           type: string
 *           description: 字段类型
 *         description:
 *           type: string
 *           description: 字段描述
 *         length:
 *           type: integer
 *           description: 字段长度
 *         required:
 *           type: boolean
 *           description: 是否必需
 *         defaultValue:
 *           type: string
 *           description: 默认值
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MessageField'
 *           description: 子字段列表
 *
 *     BatchOperationRequest:
 *       type: object
 *       required:
 *         - ids
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: 报文ID列表
 *
 *     PacketMessageListResponse:
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
 *             list:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PacketMessage'
 *             pagination:
 *               $ref: '#/components/schemas/Pagination'
 *
 *     PacketMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         hierarchy_node_id:
 *           type: string
 *         protocol:
 *           type: string
 *         status:
 *           type: integer
 *         createTime:
 *           type: string
 *           format: date-time
 *         updateTime:
 *           type: string
 *           format: date-time
 *
 *     MessageDetailResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           $ref: '#/components/schemas/PacketMessageDetail'
 *
 *     PacketMessageDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/PacketMessage'
 *         - type: object
 *           properties:
 *             fields:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MessageField'
 *
 *     FieldTypeListResponse:
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
 *             type: string
 *
 *     FieldTypeConfigResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *         message:
 *           type: string
 *           description: 响应消息
 *         datum:
 *           $ref: '#/components/schemas/FieldTypeConfig'
 *
 *     FieldTypeConfig:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         properties:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FieldProperty'
 *
 *     FieldProperty:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         required:
 *           type: boolean
 *         defaultValue:
 *           type: string
 *
 *     DeviceListResponse:
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
 *             type: string
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: 状态（success/error）
 *           example: "success"
 *         message:
 *           type: string
 *           description: 响应消息
 *           example: "操作成功"
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
 *           example: 1
 *         page_size:
 *           type: integer
 *           description: 每页数量
 *           example: 10
 *         total:
 *           type: integer
 *           description: 总记录数
 *           example: 100
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT认证token
 */

/**
 * @swagger
 * /api/packet-messages/draft/check:
 *   get:
 *     summary: 检查草稿是否存在
 *     description: 根据 message_id 检查是否存在未发布的草稿
 *     tags: [报文配置管理]
 *     parameters:
 *       - in: query
 *         name: message_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 报文唯一标识
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 操作成功
 *                 datum:
 *                   type: object
 *                   properties:
 *                     hasDraft:
 *                       type: boolean
 *                       description: 是否存在草稿
 *                     draft:
 *                       type: object
 *                       description: 草稿详情（如果存在）
 *                       nullable: true
 *   post:
 *     summary: 检查草稿是否存在（批量）
 *     description: 批量检查多个 message_id 是否存在未发布的草稿，入参为数组，天然支持批量操作
 *     tags: [报文配置管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message_ids
 *             properties:
 *               message_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 报文唯一标识列表
 *                 example: ["msg-001", "msg-002"]
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 操作成功
 *                 datum:
 *                   type: object
 *                   description: 以 message_id 为 key 的映射对象
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       hasDraft:
 *                         type: boolean
 *                         description: 是否存在草稿
 *                       draft:
 *                         type: object
 *                         description: 草稿详情（如果存在）
 *                         nullable: true
 */
