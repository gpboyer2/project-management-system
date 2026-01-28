/**
 * @file       communicationNode.js
 * @brief      通信节点模型，处理通信节点的数据访问层，负责与数据库交互，支持节点管理和关联流程图查询
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */

const { CommunicationNode, Flowchart } = require('../../database/models');

class CommunicationNodeModel {
  // 获取所有通信节点
  static async findAll() {
    const nodes = await CommunicationNode.findAll({
      order: [['created_at', 'DESC']]
    });
    return nodes.map(n => n.toJSON());
  }

  // 根据ID获取通信节点
  static async findById(id) {
    const node = await CommunicationNode.findByPk(id);
    return node ? node.toJSON() : null;
  }

  // 根据层级节点ID获取通信节点列表
  static async findByNodeId(nodeId) {
    const nodes = await CommunicationNode.findAll({
      where: { node_id: nodeId },
      order: [['created_at', 'DESC']]
    });
    return nodes.map(n => n.toJSON());
  }

  // 根据层级节点ID和名称获取通信节点
  static async findByNodeIdAndName(nodeId, name) {
    const node = await CommunicationNode.findOne({
      where: { node_id: nodeId, name }
    });
    return node ? node.toJSON() : null;
  }

  // 获取通信节点及其关联的流程图
  static async findByIdWithFlowchart(id) {
    const node = await CommunicationNode.findByPk(id);
    if (!node) return null;

    const nodeData = node.toJSON();

    // 单独查询关联的流程图
    const flowchart = await Flowchart.findOne({
      where: { communication_node_id: id }
    });

    return { ...nodeData, flowchart: flowchart ? flowchart.toJSON() : null };
  }

  // 创建通信节点
  static async create(data) {
    const node = await CommunicationNode.create(data);
    return { lastID: node.id, changes: 1 };
  }

  // 更新通信节点
  static async update(id, data) {
    const [changes] = await CommunicationNode.update(data, { where: { id } });
    return { changes };
  }

  // 删除通信节点
  // 入参为数组，天然支持批量操作
  static async delete(idList) {
    const changes = await CommunicationNode.destroy({
      where: { id: idList }
    });
    return { changes };
  }

  // 根据层级节点ID删除所有通信节点
  static async deleteByNodeId(nodeId) {
    const changes = await CommunicationNode.destroy({ where: { node_id: nodeId } });
    return { changes };
  }
}

module.exports = CommunicationNodeModel;
