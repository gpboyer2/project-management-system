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
router.get('/export/preview', authenticateToken, DataImportExportController.getExportPreview);

// 导出数据 POST /api/ide/export  body: { module_list: [...] }
router.post('/export', authenticateToken, DataImportExportController.exportData);

// 下载导出文件 GET /api/ide/download?file_name=xxx
router.get('/download', authenticateToken, DataImportExportController.downloadFile);

// 导入数据 POST /api/ide/import  multipart: { file, strategy }
router.post('/import', authenticateToken, upload.single('file'), (req, res) => {
  // 将 multer 处理后的文件挂载到 req.body 上，保持接口一致性
  req.body.file = req.file;
  DataImportExportController.importData(req, res);
});

module.exports = router;
