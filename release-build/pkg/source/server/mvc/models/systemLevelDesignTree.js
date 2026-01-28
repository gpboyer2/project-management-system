/**
 * @file       systemLevelDesignTree.js
 * @brief      系统级设计树模型，处理系统级设计树节点的CRUD操作，支持按父节点查询和批量操作
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */

const { SystemLevelDesignTreeNode } = require('../../database/models');
const log4js = require("../../middleware/log4jsPlus");
const logger = log4js.getLogger();

class SystemLevelDesignTreeModel {
  static async findAll() {
    const nodes = await SystemLevelDesignTreeNode.findAll();
    return nodes.map(n => n.toJSON());
  }

  static async findById(id) {
    logger.info('[Model.findById] 查询 id:', id);
    const node = await SystemLevelDesignTreeNode.findByPk(id);
    logger.info('[Model.findById] 查询结果:', node ? '找到' : '未找到');
    if (!node) {
      const allNodes = await SystemLevelDesignTreeNode.findAll({ attributes: ['id'] });
      logger.info('[Model.findById] 数据库中所有的 ID:', allNodes.map(n => n.id).join(', '));
    }
    return node ? node.toJSON() : null;
  }

  static async findByParentId(parentId) {
    const nodes = await SystemLevelDesignTreeNode.findAll({ where: { parent_id: parentId } });
    return nodes.map(n => n.toJSON());
  }

  static async findByIds(idList) {
    if (!idList || idList.length === 0) return [];
    const nodes = await SystemLevelDesignTreeNode.findAll({
      where: { id: idList }
    });
    return nodes.map(n => n.toJSON());
  }

  static async create(data) {
    const node = await SystemLevelDesignTreeNode.create(data);
    return { lastID: node.id, changes: 1 };
  }

  // 批量创建
  static async createBatch(dataList) {
    const nodes = await SystemLevelDesignTreeNode.bulkCreate(dataList);
    return { created: nodes.map(n => n.id), changes: nodes.length };
  }

  static async update(id, data) {
    const [changes] = await SystemLevelDesignTreeNode.update(data, { where: { id } });
    return { changes };
  }

  // 批量更新
  static async updateBatch(dataList) {
    logger.info('[updateBatch] 收到更新请求，数据条数:', dataList.length);
    logger.info('[updateBatch] 数据详情:', JSON.stringify(dataList, null, 2));
    const resultList = [];
    const failedList = [];
    for (const item of dataList) {
      const { id, ...data } = item;
      logger.info(`[updateBatch] 正在更新 id=${id}, data=`, JSON.stringify(data));
      const [changes] = await SystemLevelDesignTreeNode.update(data, { where: { id } });
      logger.info(`[updateBatch] 更新结果: id=${id}, changes=${changes}`);
      if (changes === 0) {
        failedList.push({ id, reason: '记录不存在或数据未变化' });
      } else {
        resultList.push({ id, changes });
      }
    }
    // 确保返回的是数组，不是对象
    const result = {
      updated: Array.from(resultList),
      failed: Array.from(failedList),
      successCount: resultList.length,
      failedCount: failedList.length
    };
    logger.info('[updateBatch] 最终返回结果:', JSON.stringify(result));
    logger.info('[updateBatch] resultList 类型:', Array.isArray(resultList) ? 'Array' : typeof resultList);
    logger.info('[updateBatch] result.updated 类型:', Array.isArray(result.updated) ? 'Array' : typeof result.updated);
    return result;
  }

  static async delete(id) {
    const changes = await SystemLevelDesignTreeNode.destroy({ where: { id } });
    return { changes };
  }

  // 批量删除（级联删除子节点）
  static async deleteBatch(idList) {
    // 允许空数组（幂等删除）
    if (!idList || idList.length === 0) {
      return { deleted: [], changes: 0 };
    }
    // 递归收集所有需要删除的节点ID（包括子节点）
    const allIdsToDelete = await this._collectAllChildNodes(idList);
    logger.info('[deleteBatch] 级联删除节点:', allIdsToDelete);

    const changes = await SystemLevelDesignTreeNode.destroy({ where: { id: allIdsToDelete } });
    return { deleted: allIdsToDelete, changes };
  }

  // 递归收集所有子节点ID
  static async _collectAllChildNodes(idList) {
    const allIds = new Set(idList);
    const toProcess = [...idList];

    while (toProcess.length > 0) {
      const parentId = toProcess.pop();
      // 查找该节点的直接子节点
      const children = await SystemLevelDesignTreeNode.findAll({
        attributes: ['id'],
        where: { parent_id: parentId }
      });

      for (const child of children) {
        const childId = child.id;
        if (!allIds.has(childId)) {
          allIds.add(childId);
          toProcess.push(childId); // 继续处理该子节点的子节点
        }
      }
    }

    return Array.from(allIds);
  }
}

module.exports = SystemLevelDesignTreeModel;
