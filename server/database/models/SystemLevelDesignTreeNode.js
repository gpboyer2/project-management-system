/**
 * 体系设计树节点数据模型
 * 存储体系配置页面的树形节点数据
 * 对应数据表 system_level_design_tree_nodes
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const SystemLevelDesignTreeNode = sequelize.define('system_level_design_tree_nodes', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  node_type_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_id: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  },
  properties: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    get() {
      const raw = this.getDataValue('properties');
      if (!raw) return {};
      // 兼容处理：如果是字符串则解析，如果是对象则直接返回
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('properties JSON 解析失败，返回空对象:', raw);
          return {};
        }
      }
      if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
      return {};
    },
    set(val) {
      // 兼容处理：自动转换为对象
      if (typeof val === 'string') {
        this.setDataValue('properties', val);
      } else {
        this.setDataValue('properties', (typeof val === 'object' && val !== null) ? val : {});
      }
    }
  },
  created_at: {
    type: DataTypes.INTEGER
  },
  updated_at: {
    type: DataTypes.INTEGER
  }
});

module.exports = SystemLevelDesignTreeNode;
