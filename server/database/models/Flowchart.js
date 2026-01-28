/**
 * 流程图数据模型
 * 存储流程图的节点和连线数据
 * 对应数据表 flowcharts
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const Flowchart = sequelize.define('flowcharts', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  arch_node_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  communication_node_id: {
    type: DataTypes.STRING
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nodes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    /**
     * 获取节点数组
     * @returns {Array} 节点数组
     */
    get() {
      const raw = this.getDataValue('nodes');
      if (!raw) return [];
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('nodes JSON 解析失败，返回空数组:', raw);
          return [];
        }
      }
      if (Array.isArray(raw)) return raw;
      return [];
    },
    /**
     * 设置节点值
     * @param {string|Array} val - 节点值，支持字符串或数组
     */
    set(val) {
      if (typeof val === 'string') {
        this.setDataValue('nodes', val);
      } else {
        this.setDataValue('nodes', Array.isArray(val) ? val : []);
      }
    }
  },
  edges: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    /**
     * 获取连线数组
     * @returns {Array} 连线数组
     */
    get() {
      const raw = this.getDataValue('edges');
      if (!raw) return [];
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('edges JSON 解析失败，返回空数组:', raw);
          return [];
        }
      }
      if (Array.isArray(raw)) return raw;
      return [];
    },
    /**
     * 设置连线值
     * @param {string|Array} val - 连线值，支持字符串或数组
     */
    set(val) {
      if (typeof val === 'string') {
        this.setDataValue('edges', val);
      } else {
        this.setDataValue('edges', Array.isArray(val) ? val : []);
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

module.exports = Flowchart;
