/**
 * 前端日志路由
 * 日志通过 WebSocket 实时发送，此路由仅提供查询接口
 */
const express = require('express');
const router = express.Router();
const FrontendLogController = require("../mvc/controllers/frontendLog");


/**
 * 查询前端日志列表
 * GET /api/logs/frontend/query?current_page=1&page_size=100
 */
router.get('/frontend/query', FrontendLogController.query);


module.exports = router;




/**
 * @swagger
 * /api/logs/frontend/query:
 *   get:
 *     summary: 查询前端日志列表
 *     description: 分页查询前端日志列表，按时间正序返回（旧→新）
 *     tags: [前端日志]
 *     parameters:
 *       - in: query
 *         name: current_page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: 当前页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 100
 *           minimum: 1
 *           maximum: 1000
 *         description: 每页数量
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
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: 日志消息列表（按时间正序，旧→新）
 *                       example:
 *                         - "[ICD Store] 已初始化"
 *                         - "[IcdBundleEditor] 加载完成"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page:
 *                           type: integer
 *                           description: 当前页码
 *                         page_size:
 *                           type: integer
 *                           description: 每页数量
 *                         total:
 *                           type: integer
 *                           description: 总记录数
 */

/**
 * @swagger
 * components:
 *   x-websocket:
 *     description: 前端日志通过 WebSocket 实时发送
 *     connectionUrl: ws://{host}/socket.io/
 *     event:
 *       name: frontend-log
 *       description: 发送前端日志
 *       data:
 *         type: object
 *         properties:
 *           logs:
 *             type: array
 *             items:
 *               type: string
 *             description: 日志消息数组
 *             example:
 *               - "[LOG] 页面加载完成"
 *               - "[ERROR] 请求失败"
 */
