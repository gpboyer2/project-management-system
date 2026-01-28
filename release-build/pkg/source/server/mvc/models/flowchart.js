/**
 * @file       flowchart.js
 * @brief      流程图模型，处理流程图数据的CRUD操作，支持按架构节点ID和通信节点ID查询
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */

const { Flowchart } = require('../../database/models');

class FlowchartModel {
  static async findAll() {
    const flowcharts = await Flowchart.findAll();
    return flowcharts.map(f => f.toJSON());
  }

  static async findById(id) {
    const flowchart = await Flowchart.findByPk(id);
    return flowchart ? flowchart.toJSON() : null;
  }

  static async findByArchNodeId(archNodeId) {
    const flowchart = await Flowchart.findOne({ where: { arch_node_id: archNodeId } });
    return flowchart ? flowchart.toJSON() : null;
  }

  static async findByCommunicationNodeId(communicationNodeId) {
    const flowchart = await Flowchart.findOne({ where: { communication_node_id: communicationNodeId } });
    return flowchart ? flowchart.toJSON() : null;
  }

  static async create(data) {
    const flowchart = await Flowchart.create(data);
    return { lastID: flowchart.id, changes: 1 };
  }

  static async update(id, data) {
    const [changes] = await Flowchart.update(data, { where: { id } });
    return { changes };
  }

  static async delete(id) {
    const changes = await Flowchart.destroy({ where: { id } });
    return { changes };
  }

  // 根据通信节点ID删除流程图
  static async deleteByCommunicationNodeId(communicationNodeId) {
    const changes = await Flowchart.destroy({ where: { communication_node_id: communicationNodeId } });
    return { changes };
  }
}

module.exports = FlowchartModel;
