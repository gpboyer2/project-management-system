/**
 * @file       communicationNode.js
 * @brief      通信节点控制器，处理通信节点相关的HTTP请求
 * @date       2025-12-25
 */

const CommunicationNodeService = require('../services/communicationNode');

class CommunicationNodeController {
  /**
   * 获取所有通信节点
   * GET /api/communication-nodes
   */
  static async getAllNodes(req, res) {
    try {
      const nodeList = await CommunicationNodeService.getAllNodes();
      res.apiSuccess(nodeList);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 查询通信节点（支持过滤）
   * GET /api/communication-nodes/query  params: { node_id?, include_endpoints? }
   */
  static async queryNodes(req, res) {
    try {
      const { node_id, include_endpoints } = req.query;
      const options = {
        node_id,
        include_endpoints: include_endpoints !== 'false'
      };
      const nodeList = await CommunicationNodeService.queryNodes(options);
      res.apiSuccess(nodeList);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 根据 ID 获取通信节点
   * GET /api/communication-nodes/detail  params: { id }
   */
  static async getNodeById(req, res) {
    try {
      const { id } = req.query;
      if (!id) {
        return res.apiError(null, '缺少必填参数: id');
      }
      const node = await CommunicationNodeService.getNodeById(id);
      if (!node) {
        return res.apiError(null, '通信节点不存在');
      }
      res.apiSuccess(node);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 根据层级节点ID获取通信节点列表
   * GET /api/communication-nodes/by-node  params: { node_id }
   */
  static async getNodeListByNodeId(req, res) {
    try {
      const { node_id } = req.query;
      if (!node_id) {
        return res.apiError(null, '缺少必填参数: node_id');
      }
      const nodeList = await CommunicationNodeService.getNodeListByNodeId(node_id);
      res.apiSuccess(nodeList);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 确保"节点接口容器行"存在
   * POST /api/communication-nodes/ensure  body: { node_id }
   */
  static async ensureNodeInterfaceContainer(req, res) {
    try {
      const { node_id } = req.body;
      if (!node_id) {
        return res.apiError(null, '缺少必填参数: node_id');
      }
      const result = await CommunicationNodeService.ensureNodeInterfaceContainer(node_id);
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 创建通信节点
   * POST /api/communication-nodes  body: { node_id, name, ... }
   */
  static async createNode(req, res) {
    try {
      const data = req.body;
      if (!data.node_id) {
        return res.apiError(null, '缺少必填字段: node_id（所属层级节点ID）');
      }

      // 验证 name（如果提供）
      if (data.name !== undefined && data.name !== null) {
        if (typeof data.name !== 'string') {
          return res.apiError(null, '节点名称必须是字符串');
        }
        if (data.name.length > 500) {
          return res.apiError(null, '节点名称长度不能超过500个字符');
        }
      }

      const node = await CommunicationNodeService.createNode(data);
      res.apiSuccess(node);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 更新通信节点
   * POST /api/communication-nodes/update  body: { id, name, ... }
   */
  static async updateNode(req, res) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.apiError(null, '缺少必填字段: id');
      }
      const data = req.body;

      // 检查节点是否存在
      const existing = await CommunicationNodeService.getNodeById(id);
      if (!existing) {
        return res.apiError(null, '通信节点不存在');
      }

      const node = await CommunicationNodeService.updateNode(id, data);
      res.apiSuccess(node);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 更新通信节点的接口连接信息
   * POST /api/communication-nodes/update-endpoints  body: { id, endpoint_description }
   */
  static async updateEndpointDescription(req, res) {
    try {
      const { id, endpoint_description } = req.body;
      if (!id) {
        return res.apiError(null, '缺少必填字段: id');
      }

      // 检查节点是否存在
      const existing = await CommunicationNodeService.getNodeById(id);
      if (!existing) {
        return res.apiError(null, '通信节点不存在');
      }

      // 校验 endpoint_description 格式
      if (endpoint_description !== null && !Array.isArray(endpoint_description)) {
        return res.apiError(null, 'endpoint_description 必须是数组格式');
      }

      const node = await CommunicationNodeService.updateEndpointDescription(id, endpoint_description);
      res.apiSuccess(node);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 删除通信节点
   * POST /api/communication-nodes/delete  body: { data: [id1, id2, ...] }
   * 入参为数组，天然支持批量操作
   */
  static async delete(req, res) {
    try {
      const { data } = req.body;

      if (!Array.isArray(data) || data.length === 0) {
        return res.apiError(null, '缺少必填字段: data（必须是非空数组）');
      }

      const result = await CommunicationNodeService.delete(data);
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 建立通信节点连接
   * POST /api/communication-nodes/connect  body: { id }
   */
  static async connectNode(req, res) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.apiError(null, '缺少必填字段: id');
      }
      const result = await CommunicationNodeService.connectNode(id);
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 断开通信节点连接
   * POST /api/communication-nodes/disconnect  body: { id }
   */
  static async disconnectNode(req, res) {
    try {
      const { id } = req.body;
      if (!id) {
        return res.apiError(null, '缺少必填字段: id');
      }
      const result = await CommunicationNodeService.disconnectNode(id);
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 获取通信节点连接状态
   * GET /api/communication-nodes/connection-status  params: { id }
   */
  static async getConnectionStatus(req, res) {
    try {
      const { id } = req.query;
      if (!id) {
        return res.apiError(null, '缺少必填参数: id');
      }
      const status = await CommunicationNodeService.getConnectionStatus(id);
      res.apiSuccess(status);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 添加报文关联到接口
   * POST /api/communication-nodes/packet-ref/create  body: { node_id, interface_id, packet_id, direction }
   */
  static async createPacketRef(req, res) {
    try {
      const { node_id, interface_id, packet_id, direction } = req.body;
      if (!node_id) {
        return res.apiError(null, '缺少必填参数: node_id');
      }
      if (!interface_id) {
        return res.apiError(null, '缺少必填参数: interface_id');
      }
      if (packet_id === undefined || packet_id === null) {
        return res.apiError(null, '缺少必填参数: packet_id');
      }

      const result = await CommunicationNodeService.createPacketRef(
        node_id,
        interface_id,
        Number(packet_id),
        direction || 'input'
      );
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }

  /**
   * 从接口移除报文关联
   * POST /api/communication-nodes/packet-ref/delete  body: { node_id, interface_id, packet_id }
   */
  static async deletePacketRef(req, res) {
    try {
      const { node_id, interface_id, packet_id } = req.body;
      if (!node_id) {
        return res.apiError(null, '缺少必填参数: node_id');
      }
      if (!interface_id) {
        return res.apiError(null, '缺少必填参数: interface_id');
      }
      if (packet_id === undefined || packet_id === null) {
        return res.apiError(null, '缺少必填参数: packet_id');
      }

      const result = await CommunicationNodeService.deletePacketRef(
        node_id,
        interface_id,
        Number(packet_id)
      );
      res.apiSuccess(result);
    } catch (error) {
      res.apiError(null, error.message);
    }
  }
}

module.exports = CommunicationNodeController;
