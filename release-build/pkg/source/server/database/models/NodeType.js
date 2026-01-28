/**
 * 节点类型数据模型
 * 存储层级类型的配置信息
 * 对应数据表 node_types
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const NodeType = sequelize.define('node_types', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type_name: {
    type: DataTypes.STRING
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon_class: {
    type: DataTypes.STRING
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  parent_id: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  enable_comm_node_list: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // 字段配置 JSON（合并自 node_type_fields 表）
  fields: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('fields');
      if (!raw) return [];
      // 兼容处理：如果是字符串则解析，如果是对象则直接返回
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('fields JSON 解析失败，返回空数组:', raw);
          return [];
        }
      }
      if (Array.isArray(raw)) return raw;
      return [];
    },
    set(val) {
      // 兼容处理：自动转换为数组
      if (typeof val === 'string') {
        this.setDataValue('fields', val);
      } else {
        this.setDataValue('fields', Array.isArray(val) ? val : []);
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

module.exports = NodeType;
