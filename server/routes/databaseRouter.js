/**
 * 数据库管理路由
 */
const express = require('express');
const router = express.Router();
const DatabaseController = require("../mvc/controllers/database");
const { authenticateToken } = require("../middleware/auth");


/**
 * 获取表列表
 * GET /api/database/tables
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回数据库表列表
 */
router.get('/tables', authenticateToken, DatabaseController.getTableList);


/**
 * 获取表结构
 * GET /api/database/schema?tableName=xxx
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.tableName - 表名
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回表结构信息
 */
router.get('/schema', authenticateToken, DatabaseController.getTableSchema);


/**
 * 查询表数据
 * POST /api/database/query  body: { tableName, current_page, page_size, keyword, orderBy, orderDir }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.tableName - 表名
 * @param {number} [req.body.current_page] - 当前页码（可选）
 * @param {number} [req.body.page_size] - 每页数量（可选）
 * @param {string} [req.body.keyword] - 搜索关键字（可选）
 * @param {string} [req.body.orderBy] - 排序字段（可选）
 * @param {string} [req.body.orderDir] - 排序方向（可选，ASC/DESC）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回查询结果
 */
router.post('/query', authenticateToken, DatabaseController.queryData);


/**
 * 新增数据
 * POST /api/database/create  body: { tableName, data: [...] }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.tableName - 表名
 * @param {Array<Object>} req.body.data - 数据记录数组
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回新增结果
 */
router.post('/create', authenticateToken, DatabaseController.createData);


/**
 * 更新数据
 * POST /api/database/update  body: { tableName, primaryKey, data: [...] }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.tableName - 表名
 * @param {string} req.body.primaryKey - 主键字段名
 * @param {Array<Object>} req.body.data - 数据记录数组
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回更新结果
 */
router.post('/update', authenticateToken, DatabaseController.updateData);


/**
 * 删除数据
 * POST /api/database/delete  body: { tableName, primaryKey, data: [...] }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.tableName - 表名
 * @param {string} req.body.primaryKey - 主键字段名
 * @param {Array<Object>} req.body.data - 要删除的数据记录数组
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回删除结果
 */
router.post('/delete', authenticateToken, DatabaseController.deleteData);


/**
 * 执行自定义SQL查询
 * POST /api/database/execute  body: { sql }
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {string} req.body.sql - SQL查询语句
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回查询结果
 */
router.post('/execute', authenticateToken, DatabaseController.executeQuery);


module.exports = router;




/**
 * @swagger
 * /api/database/tables:
 *   get:
 *     summary: 获取数据库表列表
 *     description: 获取SQLite数据库中所有表的名称列表
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
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
 *                   type: object
 *                   properties:
 *                     list:
 *                       type: array
 *                       items:
 *                         type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */


/**
 * @swagger
 * /api/database/schema:
 *   get:
 *     summary: 获取表结构
 *     description: 获取指定表的字段结构信息
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tableName
 *         required: true
 *         schema:
 *           type: string
 *         description: 表名
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
 *                   $ref: '#/components/schemas/TableSchema'
 */


/**
 * @swagger
 * /api/database/query:
 *   post:
 *     summary: 查询表数据
 *     description: 分页查询指定表的数据，支持搜索和排序
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QueryRequest'
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
 *                   $ref: '#/components/schemas/QueryResponse'
 */


/**
 * @swagger
 * /api/database/create:
 *   post:
 *     summary: 新增数据
 *     description: 向指定表中插入数据，支持批量
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRequest'
 *     responses:
 *       200:
 *         description: 创建成功
 */


/**
 * @swagger
 * /api/database/update:
 *   post:
 *     summary: 更新数据
 *     description: 更新指定表中的数据，支持批量
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRequest'
 *     responses:
 *       200:
 *         description: 更新成功
 */


/**
 * @swagger
 * /api/database/delete:
 *   post:
 *     summary: 删除数据
 *     description: 删除指定表中的数据，支持批量
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteRequest'
 *     responses:
 *       200:
 *         description: 删除成功
 */


/**
 * @swagger
 * /api/database/execute:
 *   post:
 *     summary: 执行SQL查询
 *     description: 执行自定义SELECT查询语句
 *     tags: [数据库管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sql:
 *                 type: string
 *                 example: "SELECT * FROM users LIMIT 10"
 *     responses:
 *       200:
 *         description: 查询成功
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         current_page:
 *           type: integer
 *         page_size:
 *           type: integer
 *         total:
 *           type: integer
 *
 *     TableSchema:
 *       type: object
 *       properties:
 *         tableName:
 *           type: string
 *         columns:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               notNull:
 *                 type: boolean
 *               defaultValue:
 *                 type: string
 *               primaryKey:
 *                 type: boolean
 *         rowCount:
 *           type: integer
 *
 *     QueryRequest:
 *       type: object
 *       required:
 *         - tableName
 *       properties:
 *         tableName:
 *           type: string
 *         current_page:
 *           type: integer
 *           default: 1
 *         page_size:
 *           type: integer
 *           default: 20
 *         keyword:
 *           type: string
 *         orderBy:
 *           type: string
 *         orderDir:
 *           type: string
 *           enum: [ASC, DESC]
 *
 *     QueryResponse:
 *       type: object
 *       properties:
 *         list:
 *           type: array
 *           items:
 *             type: object
 *         columns:
 *           type: array
 *           items:
 *             type: string
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     CreateRequest:
 *       type: object
 *       required:
 *         - tableName
 *         - data
 *       properties:
 *         tableName:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             type: object
 *
 *     UpdateRequest:
 *       type: object
 *       required:
 *         - tableName
 *         - primaryKey
 *         - data
 *       properties:
 *         tableName:
 *           type: string
 *         primaryKey:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             type: object
 *
 *     DeleteRequest:
 *       type: object
 *       required:
 *         - tableName
 *         - primaryKey
 *         - data
 *       properties:
 *         tableName:
 *           type: string
 *         primaryKey:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             type: string
 */
