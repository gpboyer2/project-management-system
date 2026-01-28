// 报文层级分类模型，处理报文分类的 CRUD 操作
const { PacketMessageCategory } = require('../../database/models');
const log4js = require("../../middleware/log4jsPlus");
const logger = log4js.getLogger();

class PacketMessageCategoryModel {
  static async findAll() {
    return await PacketMessageCategory.findAll({ raw: true, order: [['sort_order', 'ASC']] });
  }

  static async findById(id) {
    return await PacketMessageCategory.findByPk(id, { raw: true });
  }

  static async findByParentId(parent_id) {
    const where = parent_id ? { parent_id } : { parent_id: null };
    return await PacketMessageCategory.findAll({ where, raw: true, order: [['sort_order', 'ASC']] });
  }

  static async findByIds(idList) {
    if (!idList || idList.length === 0) return [];
    return await PacketMessageCategory.findAll({
      where: { id: idList },
      raw: true,
      order: [['sort_order', 'ASC']]
    });
  }

  static async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const node = await PacketMessageCategory.create({
      ...data,
      created_at: now,
      updated_at: now
    });
    return { last_id: node.id, changes: 1 };
  }

  static async createBatch(data_list) {
    const now = Math.floor(Date.now() / 1000);
    const node_list = await PacketMessageCategory.bulkCreate(
      data_list.map(item => ({
        ...item,
        created_at: now,
        updated_at: now
      }))
    );
    return { created: node_list.map(n => n.id), changes: node_list.length };
  }

  static async update(id, data) {
    const now = Math.floor(Date.now() / 1000);
    const [changes] = await PacketMessageCategory.update(
      { ...data, updated_at: now },
      { where: { id } }
    );
    return { changes };
  }

  static async updateBatch(data_list) {
    const now = Math.floor(Date.now() / 1000);
    const result_list = [];
    const failed_list = [];
    for (const item of data_list) {
      const { id, ...data } = item;
      const [changes] = await PacketMessageCategory.update(
        { ...data, updated_at: now },
        { where: { id } }
      );
      if (changes === 0) {
        failed_list.push({ id, reason: '记录不存在或数据未变化' });
      } else {
        result_list.push({ id, changes });
      }
    }
    return {
      updated: result_list,
      failed: failed_list,
      success_count: result_list.length,
      failed_count: failed_list.length
    };
  }

  static async delete(id) {
    const changes = await PacketMessageCategory.destroy({ where: { id } });
    return { changes };
  }

  static async deleteBatch(id_list) {
    const changes = await PacketMessageCategory.destroy({ where: { id: id_list } });
    return { deleted: id_list, changes };
  }
}

module.exports = PacketMessageCategoryModel;

