/**
 * @file communicationNode.js
 * @brief 通信节点服务，处理通信节点的业务逻辑，包括接口连接信息（endpoint_description）的管理
 * @date 2025-12-25
 */

const CommunicationNodeModel = require('../models/communicationNode');
const { connectionManager, ConnectionStatus } = require('./connectionManager');

class CommunicationNodeService {
  /**
   * 确保"节点接口容器行"存在（一行对应一个层级节点）
   * - communication_nodes.node_id = 层级节点ID
   * - endpoint_description 数组中每个元素代表一个接口
   * @param {string} nodeId 层级节点ID
   */
  static async ensureNodeInterfaceContainer(nodeId) {
    const node_id = typeof nodeId === 'string' ? nodeId.trim() : '';
    if (!node_id) {
      throw new Error('缺少必填参数: node_id');
    }

    const nodeList = await CommunicationNodeModel.findByNodeId(node_id);
    const existing = (Array.isArray(nodeList) ? nodeList : []).find((n) => {
      const cfg = n?.config;
      return cfg && typeof cfg === 'object' && cfg.is_node_interface_container === true;
    });
    if (existing) {
      return existing;
    }

    // 创建容器行：name 仅用于满足非空约束与唯一索引
    const created = await this.createNode({
      node_id,
      name: `节点接口列表_${node_id}`,
      endpoint_description: [],
      config: { is_node_interface_container: true }
    });
    return created;
  }

  /**
   * 获取所有通信节点
   */
  static async getAllNodes() {
    try {
      const nodeList = await CommunicationNodeModel.findAll();
      return nodeList;
    } catch (error) {
      throw new Error('getAllNodes Failed: ' + error.message);
    }
  }

  /**
   * 查询通信节点（支持过滤）
   * GET /api/communication-nodes/query
   * @param {object} options 查询选项 { node_id, include_endpoints }
   */
  static async queryNodes(options = {}) {
    try {
      const { node_id, include_endpoints = true } = options;
      let nodeList = await CommunicationNodeModel.findAll();

      // 过滤 node_id
      if (node_id) {
        nodeList = nodeList.filter(n => n.node_id === node_id);
      }

      // 默认只返回节点接口容器行（config.is_node_interface_container === true）
      const filteredList = nodeList.filter(n => {
        const cfg = n?.config;
        return cfg && typeof cfg === 'object' && cfg.is_node_interface_container === true;
      });

      // 如果不需要返回 endpoint_detail，清理掉大字段
      if (!include_endpoints) {
        return filteredList.map(n => ({
          ...n,
          endpoint_description: undefined
        }));
      }

      return filteredList;
    } catch (error) {
      throw new Error('queryNodes Failed: ' + error.message);
    }
  }

  /**
   * 根据 ID 获取通信节点
   * @param {string} id 通信节点ID
   */
  static async getNodeById(id) {
    try {
      const node = await CommunicationNodeModel.findById(id);
      return node;
    } catch (error) {
      throw new Error('getNodeById Failed: ' + error.message);
    }
  }

  /**
   * 根据层级节点ID获取通信节点列表
   * @param {string} nodeId 层级节点ID（arch_tree_nodes.id）
   */
  static async getNodeListByNodeId(nodeId) {
    try {
      // 新语义：一个层级节点一行（容器行），接口列表存储在 endpoint_description 数组中
      const container = await this.ensureNodeInterfaceContainer(nodeId);
      return container ? [container] : [];
    } catch (error) {
      throw new Error('getNodeListByNodeId Failed: ' + error.message);
    }
  }

  /**
   * 创建通信节点
   * @param {object} data 通信节点数据
   */
  static async createNode(data) {
    try {
      const now = Date.now();
      const nodeId = `comm-${now}-${Math.random().toString(36).substr(2, 9)}`;

      const nodeData = {
        id: nodeId,
        node_id: data.node_id,
        name: data.name || '未命名接口',
        endpoint_description: data.endpoint_description || null,
        status: data.status || 'active',
        config: data.config || null,
        flow_version: data.flow_version || '1.0.0',
        flow_digest_sha256: data.flow_digest_sha256 || null,
        size_bytes: data.size_bytes || 0,
        created_at: now,
        updated_at: now
      };

      await CommunicationNodeModel.create(nodeData);
      return this.getNodeById(nodeId);
    } catch (error) {
      throw new Error('createNode Failed: ' + error.message);
    }
  }

  /**
   * 更新通信节点
   * @param {string} id 通信节点ID
   * @param {object} data 更新数据
   */
  static async updateNode(id, data) {
    try {
      const now = Date.now();
      const updateData = {
        updated_at: now
      };

      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.endpoint_description !== undefined) {
        updateData.endpoint_description = data.endpoint_description;
      }
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      if (data.config !== undefined) {
        updateData.config = data.config;
      }
      if (data.flow_version !== undefined) {
        updateData.flow_version = data.flow_version;
      }

      await CommunicationNodeModel.update(id, updateData);
      return this.getNodeById(id);
    } catch (error) {
      throw new Error('updateNode Failed: ' + error.message);
    }
  }

  /**
   * 更新通信节点的接口连接信息
   * @param {string} id 通信节点ID
   * @param {Array} endpointList 端点描述数组
   */
  static async updateEndpointDescription(id, endpointList) {
    try {
      const now = Date.now();
      // 调试日志：验证后端接收到的数据
      console.log('[updateEndpointDescription] Saving endpoint_description:', JSON.stringify(endpointList, null, 2));
      await CommunicationNodeModel.update(id, {
        endpoint_description: endpointList,
        updated_at: now
      });
      const result = await this.getNodeById(id);
      console.log('[updateEndpointDescription] Saved result:', JSON.stringify(result?.endpoint_description, null, 2));
      return result;
    } catch (error) {
      throw new Error('updateEndpointDescription Failed: ' + error.message);
    }
  }

  /**
   * 删除通信节点
   * @param {Array<string>} idList 通信节点ID数组，入参为数组，天然支持批量操作
   */
  static async delete(idList) {
    try {
      if (!Array.isArray(idList) || idList.length === 0) {
        throw new Error('idList 必须是非空数组');
      }

      const result = await CommunicationNodeModel.delete(idList);
      return {
        success: true,
        count: result.changes,
        deleted_count: result.changes
      };
    } catch (error) {
      throw new Error('delete Failed: ' + error.message);
    }
  }

  /**
   * 建立通信节点连接
   * @param {string} id 通信节点ID
   */
  static async connectNode(id) {
    try {
      const node = await CommunicationNodeModel.findById(id);
      if (!node) {
        throw new Error('通信节点不存在');
      }

      const endpointList = node.endpoint_description;

      if (!endpointList || endpointList.length === 0) {
        throw new Error('通信节点没有配置端点信息，请先配置连接参数');
      }

      const results = [];
      for (const endpoint of endpointList) {
        try {
          const result = await connectionManager.connect(id, endpoint);
          results.push({
            endpoint: endpoint.type,
            success: true,
            message: result.message
          });
        } catch (err) {
          results.push({
            endpoint: endpoint.type,
            success: false,
            message: err.message
          });
        }
      }

      const allSuccess = results.every(r => r.success);
      await CommunicationNodeModel.update(id, {
        status: allSuccess ? 'active' : 'error',
        updated_at: Date.now()
      });

      return {
        node_id: id,
        node_name: node.name,
        status: allSuccess ? ConnectionStatus.CONNECTED : ConnectionStatus.ERROR,
        results
      };
    } catch (error) {
      throw new Error('connectNode Failed: ' + error.message);
    }
  }

  /**
   * 断开通信节点连接
   * @param {string} id 通信节点ID
   */
  static async disconnectNode(id) {
    try {
      const node = await CommunicationNodeModel.findById(id);
      if (!node) {
        throw new Error('通信节点不存在');
      }

      const result = await connectionManager.disconnect(id);

      await CommunicationNodeModel.update(id, {
        status: 'inactive',
        updated_at: Date.now()
      });

      return {
        node_id: id,
        ...result
      };
    } catch (error) {
      throw new Error('disconnectNode Failed: ' + error.message);
    }
  }

  /**
   * 获取通信节点连接状态
   * @param {string} id 通信节点ID
   */
  static async getConnectionStatus(id) {
    try {
      const node = await CommunicationNodeModel.findById(id);
      if (!node) {
        throw new Error('通信节点不存在');
      }

      const connectionStatus = connectionManager.getStatus(id);

      return {
        node_id: id,
        node_name: node.name,
        db_status: node.status,
        ...connectionStatus
      };
    } catch (error) {
      throw new Error('getConnectionStatus Failed: ' + error.message);
    }
  }

  /**
   * 添加报文关联到接口
   * @param {string} nodeId 层级节点ID（systemNodeId）
   * @param {string} interfaceId 接口ID
   * @param {number} packetId 报文ID
   * @param {string} direction 方向（input/output）
   */
  static async createPacketRef(nodeId, interfaceId, packetId, direction) {
    try {
      const node = await this.ensureNodeInterfaceContainer(nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      const endpointList = Array.isArray(node.endpoint_description) ? node.endpoint_description : [];
      let endpoint = endpointList.find((e) => String(e?.interface_id || '').trim() === String(interfaceId));

      // 如果接口不存在，自动创建
      if (!endpoint) {
        endpoint = {
          interface_id: String(interfaceId),
          name: `接口_${interfaceId}`,
          type: 'TCP Server',
          packet_ref_list: []
        };
        endpointList.push(endpoint);
      }

      // 初始化 packet_ref_list
      if (!Array.isArray(endpoint.packet_ref_list)) {
        endpoint.packet_ref_list = [];
      }

      // 检查是否已存在
      const existedIndex = endpoint.packet_ref_list.findIndex((r) => r.packet_id === packetId);
      if (existedIndex >= 0) {
        // 已存在，更新方向
        endpoint.packet_ref_list[existedIndex].direction = direction;
      } else {
        // 不存在，添加
        endpoint.packet_ref_list.push({ packet_id: packetId, direction });
      }

      // 保存到数据库
      await this.updateEndpointDescription(node.id, endpointList);

      return {
        success: true,
        packet_ref_list: endpoint.packet_ref_list
      };
    } catch (error) {
      throw new Error('createPacketRef Failed: ' + error.message);
    }
  }

  /**
   * 从接口移除报文关联
   * @param {string} nodeId 层级节点ID（systemNodeId）
   * @param {string} interfaceId 接口ID
   * @param {number} packetId 报文ID
   */
  static async deletePacketRef(nodeId, interfaceId, packetId) {
    try {
      const node = await this.ensureNodeInterfaceContainer(nodeId);
      if (!node) {
        throw new Error('节点不存在');
      }

      const endpointList = Array.isArray(node.endpoint_description) ? node.endpoint_description : [];
      const endpoint = endpointList.find((e) => String(e?.interface_id || '').trim() === String(interfaceId));

      if (!endpoint) {
        throw new Error('接口不存在');
      }

      if (!Array.isArray(endpoint.packet_ref_list)) {
        throw new Error('报文列表为空');
      }

      // 过滤掉要删除的报文
      const originalLength = endpoint.packet_ref_list.length;
      endpoint.packet_ref_list = endpoint.packet_ref_list.filter((r) => r.packet_id !== packetId);

      if (endpoint.packet_ref_list.length === originalLength) {
        throw new Error('报文不存在于列表中');
      }

      // 保存到数据库
      await this.updateEndpointDescription(node.id, endpointList);

      return {
        success: true,
        packet_ref_list: endpoint.packet_ref_list
      };
    } catch (error) {
      throw new Error('deletePacketRef Failed: ' + error.message);
    }
  }
}

module.exports = CommunicationNodeService;

