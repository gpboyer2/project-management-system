/**
 * 通信节点路由
 * 处理通信节点（接口）的 CRUD 操作，包括接口连接信息（endpoint_description）的管理
 */
const express = require('express');
const router = express.Router();
const CommunicationNodeController = require('../mvc/controllers/communicationNode');
const { authenticateToken } = require("../middleware/auth");

/**
 * 获取所有通信节点
 * GET /api/communication-nodes
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回所有通信节点列表
 */
router.get('/', authenticateToken, CommunicationNodeController.getAllNodes);

/**
 * 查询通信节点（支持过滤）
 * GET /api/communication-nodes/query  params: { node_id?, include_endpoints? }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} [req.query.node_id] - 节点ID（可选）
 * @param {boolean} [req.query.include_endpoints] - 是否包含端点信息（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回查询结果
 */
router.get('/query', authenticateToken, CommunicationNodeController.queryNodes);

/**
 * 根据层级节点ID获取通信节点列表
 * GET /api/communication-nodes/by-node  params: { node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.node_id - 层级节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回通信节点列表
 */
router.get('/by-node', authenticateToken, CommunicationNodeController.getNodeListByNodeId);

/**
 * 确保"节点接口容器行"存在（一个层级节点一行）
 * POST /api/communication-nodes/ensure  body: { node_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.node_id - 层级节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回操作结果
 */
router.post('/ensure', authenticateToken, CommunicationNodeController.ensureNodeInterfaceContainer);

/**
 * 根据 ID 获取通信节点详情
 * GET /api/communication-nodes/detail  params: { id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回通信节点详情
 */
router.get('/detail', authenticateToken, CommunicationNodeController.getNodeById);

/**
 * 创建通信节点
 * POST /api/communication-nodes  body: { node_id, name, ... }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.node_id - 层级节点ID
 * @param {string} req.body.name - 通信节点名称
 * @param {Array} [req.body.endpoint_description] - 端点描述数组（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回创建的通信节点信息
 */
router.post('/', authenticateToken, CommunicationNodeController.createNode);

/**
 * 更新通信节点
 * POST /api/communication-nodes/update  body: { id, name, ... }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.id - 通信节点ID
 * @param {string} [req.body.name] - 通信节点名称（可选）
 * @param {Array} [req.body.endpoint_description] - 端点描述数组（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回更新结果
 */
router.post('/update', authenticateToken, CommunicationNodeController.updateNode);

/**
 * 更新通信节点的接口连接信息
 * POST /api/communication-nodes/update-endpoints  body: { id, endpoint_description }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.id - 通信节点ID
 * @param {Array} req.body.endpoint_description - 端点描述数组
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回更新结果
 */
router.post('/update-endpoints', authenticateToken, CommunicationNodeController.updateEndpointDescription);

/**
 * 删除通信节点
 * POST /api/communication-nodes/delete  body: { data: [id1, id2, ...] }
 * 入参为数组，天然支持批量操作
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {Array<string>} req.body.data - 通信节点ID数组
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回删除结果
 */
router.post('/delete', authenticateToken, CommunicationNodeController.delete);

/**
 * 建立通信节点连接
 * POST /api/communication-nodes/connect  body: { id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回连接结果
 */
router.post('/connect', authenticateToken, CommunicationNodeController.connectNode);

/**
 * 断开通信节点连接
 * POST /api/communication-nodes/disconnect  body: { id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回断开连接结果
 */
router.post('/disconnect', authenticateToken, CommunicationNodeController.disconnectNode);

/**
 * 获取通信节点连接状态
 * GET /api/communication-nodes/connection-status  params: { id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.id - 通信节点ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回连接状态信息
 */
router.get('/connection-status', authenticateToken, CommunicationNodeController.getConnectionStatus);

/**
 * 添加报文关联到接口
 * POST /api/communication-nodes/packet-ref/create  body: { node_id, interface_id, packet_id, direction }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.node_id - 通信节点ID
 * @param {string} req.body.interface_id - 接口ID
 * @param {string} req.body.packet_id - 报文ID
 * @param {string} req.body.direction - 方向（input/output）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回创建结果
 */
router.post('/packet-ref/create', authenticateToken, CommunicationNodeController.createPacketRef);

/**
 * 从接口移除报文关联
 * POST /api/communication-nodes/packet-ref/delete  body: { node_id, interface_id, packet_id }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.node_id - 通信节点ID
 * @param {string} req.body.interface_id - 接口ID
 * @param {string} req.body.packet_id - 报文ID
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回删除结果
 */
router.post('/packet-ref/delete', authenticateToken, CommunicationNodeController.deletePacketRef);

module.exports = router;


/**
 * @swagger
 * /api/communication-nodes:
 *   get:
 *     summary: 获取所有通信节点
 *     description: 获取系统中所有的通信节点列表
 *     tags: [通信节点管理]
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommunicationNode'
 *
 *   post:
 *     summary: 创建通信节点
 *     description: 创建新的通信节点
 *     tags: [通信节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               node_id:
 *                 type: string
 *                 description: 所属层级节点ID
 *               name:
 *                 type: string
 *                 description: 通信节点名称
 *               endpoint_description:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EndpointDescription'
 *               status:
 *                 type: string
 *                 enum: [active, inactive, error, deprecated]
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数错误
 *
 * /api/communication-nodes/delete:
 *   post:
 *     summary: 删除通信节点
 *     description: 删除通信节点，入参为数组天然支持批量操作
 *     tags: [通信节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 description: 通信节点ID数组
 *                 items:
 *                   type: string
 *                 example: ["comm-123", "comm-456"]
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 参数错误
 *
 * /api/communication-nodes/by-node:
 *   get:
 *     summary: 根据层级节点ID获取通信节点列表
 *     description: 获取指定层级节点下的所有通信节点（接口）
 *     tags: [通信节点管理]
 *     parameters:
 *       - in: query
 *         name: node_id
 *         required: true
 *         schema:
 *           type: string
 *         description: 层级节点ID
 *     responses:
 *       200:
 *         description: 查询成功
 *
 * /api/communication-nodes/detail:
 *   get:
 *     summary: 获取通信节点详情
 *     tags: [通信节点管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通信节点ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/update:
 *   post:
 *     summary: 更新通信节点
 *     tags: [通信节点管理]
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
 *                 type: string
 *                 description: 通信节点ID
 *               name:
 *                 type: string
 *                 description: 通信节点名称
 *               endpoint_description:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/EndpointDescription'
 *               status:
 *                 type: string
 *                 enum: [active, inactive, error, deprecated]
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/update-endpoints:
 *   post:
 *     summary: 更新通信节点的接口连接信息
 *     description: 更新通信节点的 endpoint_description 字段，存储接口连接配置（TCP/UDP/CAN/Serial等）
 *     tags: [通信节点管理]
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
 *                 type: string
 *                 description: 通信节点ID
 *               endpoint_description:
 *                 type: array
 *                 description: 端点描述数组
 *                 items:
 *                   $ref: '#/components/schemas/EndpointDescription'
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/connect:
 *   post:
 *     summary: 建立通信节点连接
 *     description: 建立通信节点的网络连接
 *     tags: [通信节点管理]
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
 *                 type: string
 *                 description: 通信节点ID
 *     responses:
 *       200:
 *         description: 连接成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/disconnect:
 *   post:
 *     summary: 断开通信节点连接
 *     description: 断开通信节点的网络连接
 *     tags: [通信节点管理]
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
 *                 type: string
 *                 description: 通信节点ID
 *     responses:
 *       200:
 *         description: 断开成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/connection-status:
 *   get:
 *     summary: 获取通信节点连接状态
 *     description: 获取通信节点的当前网络连接状态
 *     tags: [通信节点管理]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 通信节点ID
 *     responses:
 *       200:
 *         description: 查询成功
 *       404:
 *         description: 通信节点不存在
 *
 * /api/communication-nodes/ensure:
 *   post:
 *     summary: 确保节点接口容器行存在
 *     description: 确保指定层级节点的接口容器行存在，不存在则创建
 *     tags: [通信节点管理]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - node_id
 *             properties:
 *               node_id:
 *                 type: string
 *                 description: 层级节点ID
 *     responses:
 *       200:
 *         description: 操作成功
 *
 * components:
 *   schemas:
 *     CommunicationNode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 通信节点ID
 *         node_id:
 *           type: string
 *           description: 所属层级节点ID
 *         name:
 *           type: string
 *           description: 通信节点名称
 *         endpoint_description:
 *           type: array
 *           description: 端点描述数组
 *           items:
 *             $ref: '#/components/schemas/EndpointDescription'
 *         status:
 *           type: string
 *           enum: [active, inactive, error, deprecated]
 *           description: 节点状态
 *         flow_version:
 *           type: string
 *           description: 流程版本号
 *
 *     EndpointDescription:
 *       type: object
 *       required:
 *         - role
 *         - type
 *       properties:
 *         role:
 *           type: string
 *           enum: [input, output]
 *           description: 端点角色（输入/输出）
 *         type:
 *           type: string
 *           description: 连接类型（TCP Server, TCP Client, UDP, UDP Multicast, Serial, CAN）
 *         host:
 *           type: string
 *           description: 主机地址（TCP/UDP）
 *         port:
 *           type: integer
 *           description: 端口（TCP/UDP）
 *         remote_host:
 *           type: string
 *           description: 远程主机地址（TCP Client/UDP）
 *         remote_port:
 *           type: integer
 *           description: 远程端口（TCP Client/UDP）
 *         group:
 *           type: string
 *           description: 组播地址（UDP Multicast）
 *         port_name:
 *           type: string
 *           description: 串口名称（Serial）
 *         baud_rate:
 *           type: integer
 *           description: 波特率（Serial）
 *         can_channel:
 *           type: string
 *           description: CAN 通道
 *         can_bitrate:
 *           type: integer
 *           description: CAN 波特率
 */

