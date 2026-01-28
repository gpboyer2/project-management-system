/**
 * @file       dataImportExport.js
 * @brief      数据导入导出控制器
 * @date       2025-01-06
 * @copyright  Copyright (c) 2025
 */
const DataImportExportService = require('../services/dataImportExport');
const path = require('path');
const fs = require('fs');
const logger = require('../../middleware/log4jsPlus').getLogger('httpApi');

class DataImportExportController {
  // 获取导出预览数据
  static async getExportPreview(req, res) {
    try {
      const result = await DataImportExportService.getExportPreview();
      res.apiSuccess(result);
    } catch (error) {
      logger.error('[DataImportExport] getExportPreview error:', error);
      res.apiError(null, error.message);
    }
  }

  // 导出数据
  static async exportData(req, res) {
    try {
      const { module_list } = req.body;

      if (!module_list) {
        return res.apiError(null, '缺少参数 module_list');
      }

      // 兼容新旧两种格式：
      // - 旧格式：['hierarchy', 'protocols'] 导出全部
      // - 新格式：{ hierarchy: ['id1', 'id2'], protocols: ['id1', 'id2'] } 精细化导出
      const isArrayFormat = Array.isArray(module_list);
      if (isArrayFormat) {
        // 旧格式验证
        const valid_modules = ['hierarchy', 'protocols'];
        const invalid_modules = module_list.filter(m => !valid_modules.includes(m));
        if (invalid_modules.length > 0) {
          return res.apiError(null, `无效的模块: ${invalid_modules.join(', ')}`);
        }
      } else if (typeof module_list !== 'object') {
        return res.apiError(null, '参数 module_list 格式错误');
      }

      const result = await DataImportExportService.exportData(module_list);
      res.apiSuccess(result);
    } catch (error) {
      logger.error('[DataImportExport] exportData error:', error);
      res.apiError(null, error.message);
    }
  }

  // 下载导出文件
  static async downloadFile(req, res) {
    try {
      const { file_name } = req.query;

      if (!file_name) {
        return res.apiError(null, '缺少参数 file_name');
      }

      // 安全检查：防止路径遍历
      const safe_name = path.basename(file_name);
      const file_path = path.join(__dirname, '../../temp', safe_name);

      if (!fs.existsSync(file_path)) {
        return res.apiError(null, '文件不存在或已过期');
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safe_name)}"`);

      // 读取并发送文件
      const file_content = fs.readFileSync(file_path);
      res.send(file_content);

      // 发送完成后删除临时文件
      setTimeout(() => {
        fs.unlink(file_path, () => {});
      }, 1000);
    } catch (error) {
      logger.error('[DataImportExport] downloadFile error:', error);
      res.apiError(null, error.message);
    }
  }

  // 导入数据
  static async importData(req, res) {
    try {
      const { file, strategy } = req.body;

      if (!file) {
        return res.apiError(null, '请选择要导入的文件');
      }

      if (!strategy) {
        return res.apiError(null, '请选择导入策略');
      }

      if (!['overwrite', 'merge', 'append'].includes(strategy)) {
        return res.apiError(null, '无效的导入策略');
      }

      const result = await DataImportExportService.importData(file, strategy);
      res.apiSuccess(result);
    } catch (error) {
      logger.error('[DataImportExport] importData error:', error);
      res.apiError(null, error.message);
    }
  }
}

module.exports = DataImportExportController;
