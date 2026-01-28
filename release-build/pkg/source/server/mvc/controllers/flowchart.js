/**
 * @file       flowchart.js
 * @brief      流程图控制器，负责处理流程图保存、加载和通信节点管理的HTTP请求
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */
const log4js = require("../../middleware/log4jsPlus");
const logger = log4js.getLogger("default");
const FlowchartService = require('../services/flowchart');

class FlowchartController {
  // 保存流程图
  static async saveFlowchart(req, res) {
    try {
      const { arch_node_id } = req.body;
      if (!arch_node_id) {
        return res.apiError(null, '缺少必填参数: arch_node_id');
      }
      const result = await FlowchartService.saveFlowchart(req.body);
      res.apiSuccess(result);
    } catch (error) {
      logger.error(error);
      res.apiError(null, error.message || '服务器内部错误');
    }
  }

  // 根据体系节点ID加载流程图
  // GET /api/flowcharts/by-arch-node  params: { arch_node_id }
  static async loadFlowchartByArchNodeId(req, res) {
    try {
      const { arch_node_id } = req.query;
      if (!arch_node_id) {
        return res.apiError(null, '缺少必填参数: arch_node_id');
      }
      const result = await FlowchartService.loadFlowchartByArchNodeId(arch_node_id);
      res.apiSuccess(result);
    } catch (error) {
      logger.error(error);
      res.apiError(null, '服务器内部错误');
    }
  }

  // 根据通信节点ID加载流程图
  // GET /api/flowcharts/by-comm-node  params: { comm_node_id }
  static async loadFlowchartByCommNodeId(req, res) {
    try {
      const { comm_node_id } = req.query;
      if (!comm_node_id) {
        return res.apiError(null, '缺少必填参数: comm_node_id');
      }
      const result = await FlowchartService.loadFlowchartByCommNodeId(comm_node_id);
      res.apiSuccess(result);
    } catch (error) {
      logger.error(error);
      res.apiError(null, '服务器内部错误');
    }
  }

  // 根据体系节点ID获取通信节点列表
  // GET /api/flowcharts/comm-nodes  params: { arch_node_id }
  static async getCommNodeListByArchNodeId(req, res) {
    try {
      const { arch_node_id } = req.query;
      if (!arch_node_id) {
        return res.apiError(null, '缺少必填参数: arch_node_id');
      }
      const result = await FlowchartService.getCommNodeListByArchNodeId(arch_node_id);
      res.apiSuccess(result);
    } catch (error) {
      logger.error(error);
      res.apiError(null, '服务器内部错误');
    }
  }

  // 删除通信节点（同时删除关联的流程图）
  // POST /api/flowcharts/delete-comm-node  body: { comm_node_id }
  static async deleteCommNode(req, res) {
    try {
      const { comm_node_id } = req.body;
      if (!comm_node_id) {
        return res.apiError(null, '缺少必填字段: comm_node_id');
      }
      const result = await FlowchartService.deleteCommNode(comm_node_id);
      res.apiSuccess(result);
    } catch (error) {
      logger.error(error);
      res.apiError(null, '服务器内部错误');
    }
  }
}

module.exports = FlowchartController;
