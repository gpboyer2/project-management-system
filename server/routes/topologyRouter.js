/**
 * 拓扑展示路由（纯展示用，基于体系配置和通信节点动态组装数据）
 */
const express = require('express');
const router = express.Router();
const TopologyController = require("../mvc/controllers/topology");
const { authenticateToken } = require("../middleware/auth");


/**
 * 获取拓扑数据（节点和连线）
 * GET /api/topology/nodes
 * 返回：{ nodes: [...], edges: [...], inEndpointList: [...], outEndpointList: [...] }
 * @param {Express.Request} req - Express 请求对象
 * @param {Express.Response} res - Express 响应对象
 * @returns {void} 无返回值，通过 res.send() 发送响应
 */
router.get('/nodes', authenticateToken, TopologyController.getAllNodes);

module.exports = router;



/**
 * @swagger
 * tags:
 *   - name: 拓扑展示
 *     description: 拓扑展示接口（纯展示，数据动态组装）
 */

/**
 * @swagger
 * /api/topology/nodes:
 *   get:
 *     summary: 获取拓扑数据
 *     description: 根据体系配置和通信节点的 TCP IN/OUT 配置动态生成拓扑节点和连线
 *     tags:
 *       - 拓扑展示
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     nodes:
 *                       type: array
 *                       description: 拓扑节点列表
 *                     edges:
 *                       type: array
 *                       description: 拓扑连线列表
 *                     inEndpointList:
 *                       type: array
 *                       description: 数据接收端点列表
 *                     outEndpointList:
 *                       type: array
 *                       description: 数据发送端点列表
 */
