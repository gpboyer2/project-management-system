/**
 * @file       hierarchy.js
 * @brief      层级结构模型，处理节点类型和系统级设计树节点的CRUD操作，支持树形结构构建
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */

const { NodeType, SystemLevelDesignTreeNode } = require('../../database/models');
const { Op } = require('sequelize');

class HierarchyModel {
  static async findAllNodeTypes() {
    // 不使用 raw: true，让 getter/setter 自动处理 JSON 解析
    const nodeTypes = await NodeType.findAll({ order: [['order', 'ASC'], ['created_at', 'ASC']] });
    return nodeTypes.map(nt => nt.toJSON());
  }

  static async findNodeTypeById(id) {
    const nodeType = await NodeType.findByPk(id);
    return nodeType ? nodeType.toJSON() : null;
  }

  static async createNodeType(data) {
    const nodeType = await NodeType.create(data);
    return { lastID: nodeType.id, changes: 1 };
  }

  static async updateNodeType(id, data) {
    const [changes] = await NodeType.update(data, { where: { id } });
    return { changes };
  }

  static async deleteNodeType(id) {
    const changes = await NodeType.destroy({ where: { id } });
    return { changes };
  }

  static async findAllHierarchyNodes() {
    const nodes = await SystemLevelDesignTreeNode.findAll({ order: [['parent_id', 'ASC'], ['created_at', 'ASC']] });
    return nodes.map(n => n.toJSON());
  }

  static async findHierarchyNodeById(id) {
    const node = await SystemLevelDesignTreeNode.findByPk(id);
    return node ? node.toJSON() : null;
  }

  static async findHierarchyNodesByParentId(parentId) {
    const where = parentId ? { parent_id: parentId } : { [Op.or]: [{ parent_id: null }, { parent_id: '' }] };
    const nodes = await SystemLevelDesignTreeNode.findAll({ where, order: [['created_at', 'ASC']] });
    return nodes.map(n => n.toJSON());
  }

  static async createHierarchyNode(data) {
    const node = await SystemLevelDesignTreeNode.create(data);
    return { lastID: node.id, changes: 1 };
  }

  static async updateHierarchyNode(id, data) {
    const [changes] = await SystemLevelDesignTreeNode.update(data, { where: { id } });
    return { changes };
  }

  static async deleteHierarchyNode(id) {
    const children = await this.findHierarchyNodesByParentId(id);
    for (const child of children) {
      await this.deleteHierarchyNode(child.id);
    }
    const changes = await SystemLevelDesignTreeNode.destroy({ where: { id } });
    return { changes };
  }

  // 构建层级树结构
  static async buildHierarchyTree() {
    try {
      const allNodes = await this.findAllHierarchyNodes();
      const nodeTypes = await this.findAllNodeTypes();

      const nodeTypeMap = {};
      nodeTypes.forEach(type => {
        nodeTypeMap[type.id] = type;
      });

      const nodeMap = {};
      const roots = [];

      allNodes.forEach(node => {
        node.children = [];
        node.type = nodeTypeMap[node.node_type_id];
        node.properties = node.properties || {};
        nodeMap[node.id] = node;
      });

      allNodes.forEach(node => {
        if (node.parent_id && nodeMap[node.parent_id]) {
          nodeMap[node.parent_id].children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = HierarchyModel;
