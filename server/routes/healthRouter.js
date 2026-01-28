/**
 * 健康检查路由
 * 用于 Docker 容器健康检查和负载均衡器探测
 */
const express = require('express');
const router = express.Router();
const { testConnection } = require('../database/sequelize');
const logger = require('../middleware/log4jsPlus').getLogger();

/**
 * 健康检查接口
 * GET /api/health
 * 返回服务状态，用于容器健康检查
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @returns {Promise<void>} 无返回值，直接发送响应
 */
router.get('/', async (req, res) => {
    try {
        // 检查数据库连接
        await testConnection();

        res.apiSuccess(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected'
            },
            '服务正常'
        );
    } catch (error) {
        logger.error('健康检查失败:', error);
        // 健康检查失败时返回 HTTP 503，确保容器能正确检测到
        res.status(503).apiError(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            },
            '服务异常'
        );
    }
});

module.exports = router;
