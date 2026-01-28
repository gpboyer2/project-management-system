/**
 * 报文配置数据模型
 * 存储报文的基本信息
 * 对应数据表 packet_messages
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const PacketMessage = sequelize.define('packet_messages', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 是否已发布：0=未发布（草稿态，不对公共视角可见），1=已发布
  publish_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  /**
   * 草稿唯一键：仅草稿行写入 draft_key=message_id，用 UNIQUE(draft_key) 保证每个协议最多1条草稿
   * 已发布行 draft_key 为 NULL
   */
  draft_key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  /**
   * 最新发布唯一键：仅最新已发布行写入 latest_key=message_id，用 UNIQUE(latest_key) 保证每个协议最多1条最新发布
   * 历史已发布行 latest_key 为 NULL
   */
  latest_key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 发布时间（毫秒时间戳），仅发布行填写
  published_at: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  field_count: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.STRING
  },
  hierarchy_node_id: {
    type: DataTypes.STRING,
    comment: '层级节点ID'
  },
  protocol: {
    type: DataTypes.STRING
  },
  version: {
    type: DataTypes.STRING
  },
  default_byte_order: {
    type: DataTypes.STRING
  },
  struct_alignment: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.INTEGER
  },
  updated_at: {
    type: DataTypes.INTEGER
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const raw = this.getDataValue('fields');
      if (!raw) return [];
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
      if (typeof val === 'string') {
        this.setDataValue('fields', val);
      } else {
        this.setDataValue('fields', Array.isArray(val) ? val : []);
      }
    }
  }
}, {
  tableName: 'packet_messages',
  timestamps: false
});

module.exports = PacketMessage;
