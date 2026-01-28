/**
 * @file       dataImportExportRouter.js
 * @brief      数据导入导出路由
 * @date       2025-01-06
 * @copyright  Copyright (c) 2025
 */
const express = require('express');
const router = express.Router();
const DataImportExportController = require('../mvc/controllers/dataImportExport');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { MAX_FILE_UPLOAD_SIZE } = require('../etc/config');

// 配置文件上传（存储在内存中）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_UPLOAD_SIZE
  }
});

// 获取导出预览数据 GET /api/ide/export/preview
/**
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} [req.query.module_list] - 模块列表（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回导出预览数据
 */
router.get('/export/preview', authenticateToken, DataImportExportController.getExportPreview);

// 导出数据 POST /api/ide/export  body: { module_list: [...] }
/**
 * @param {Object} req - Express 请求对象
 * @param {Object} req.body - 请求体
 * @param {Array<string>} req.body.module_list - 模块列表
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回导出结果
 */
router.post('/export', authenticateToken, DataImportExportController.exportData);

// 下载导出文件 GET /api/ide/download?file_name=xxx
/**
 * @param {Object} req - Express 请求对象
 * @param {Object} req.query - 查询参数
 * @param {string} req.query.file_name - 文件名
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回文件下载流
 */
router.get('/download', authenticateToken, DataImportExportController.downloadFile);

// 导入数据 POST /api/ide/import  multipart: { file, strategy }
/**
 * @param {Object} req - Express 请求对象
 * @param {Object} req.file - 上传的文件对象（由 multer 处理）
 * @param {Object} req.body - 请求体
 * @param {string} [req.body.strategy] - 导入策略（可选）
 * @param {Object} res - Express 响应对象
 * @returns {void} 返回导入结果
 */
router.post('/import', authenticateToken, upload.single('file'), (req, res) => {
  // 将 multer 处理后的文件挂载到 req.body 上，保持接口一致性
  req.body.file = req.file;
  DataImportExportController.importData(req, res);
});

module.exports = router;
