const express = require('express');
const router = express.Router();
const PacketMessageCategoryController = require("../mvc/controllers/packetMessageCategory");
const { authenticateToken } = require("../middleware/auth");

// 获取所有分类（平铺列表） GET /api/packet-message-categories/list
router.get('/list', authenticateToken, PacketMessageCategoryController.getAllCategories);


// 获取分类树（包含报文，用于资源管理器展示） GET /api/packet-message-categories/tree
router.get('/tree', authenticateToken, PacketMessageCategoryController.getCategoryTree);


// 获取分类详情 GET /api/packet-message-categories/detail?id=xxx
router.get('/detail', authenticateToken, PacketMessageCategoryController.getCategoryById);


// 创建分类（支持批量） POST /api/packet-message-categories/create  body: [{ id, name, parent_id, ... }]
router.post('/create', authenticateToken, PacketMessageCategoryController.createCategory);


// 更新分类（支持批量） PUT /api/packet-message-categories/update  body: [{ id, name, parent_id, ... }]
router.put('/update', authenticateToken, PacketMessageCategoryController.updateCategory);


// 删除分类（支持批量） POST /api/packet-message-categories/delete  body: { ids: [...] }
router.post('/delete', authenticateToken, PacketMessageCategoryController.deleteCategory);


module.exports = router;



/**
 * @swagger
 * tags:
 *   - name: 报文分类管理
 *     description: 报文层级分类管理接口
 */

/**
 * @swagger
 * /api/packet-message-categories/list:
 *   get:
 *     summary: 获取所有分类
 *     description: 获取报文分类的平铺列表
 *     tags:
 *       - 报文分类管理
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /api/packet-message-categories/tree:
 *   get:
 *     summary: 获取分类树
 *     description: 获取报文分类树结构（包含报文）
 *     tags:
 *       - 报文分类管理
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /api/packet-message-categories/detail:
 *   get:
 *     summary: 获取分类详情
 *     description: 根据ID获取分类详情
 *     tags:
 *       - 报文分类管理
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类ID
 *     responses:
 *       200:
 *         description: 成功
 */

/**
 * @swagger
 * /api/packet-message-categories/create:
 *   post:
 *     summary: 创建分类
 *     description: 创建报文分类（支持批量）
 *     tags:
 *       - 报文分类管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - name
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 parent_id:
 *                   type: string
 *                 description:
 *                   type: string
 *     responses:
 *       200:
 *         description: 创建成功
 */

/**
 * @swagger
 * /api/packet-message-categories/update:
 *   put:
 *     summary: 更新分类
 *     description: 更新报文分类（支持批量）
 *     tags:
 *       - 报文分类管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 parent_id:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */

/**
 * @swagger
 * /api/packet-message-categories/delete:
 *   post:
 *     summary: 删除分类
 *     description: 删除报文分类（支持批量）
 *     tags:
 *       - 报文分类管理
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */

