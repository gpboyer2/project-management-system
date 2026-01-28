/**
 * 通信节点/流程元数据表
 * 记录流程的业务属性和身份信息
 * 符合数据字典 communication_nodes 表设计
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const CommunicationNode = sequelize.define('communication_nodes', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    comment: '通信节点ID，对应一份可执行的流程定义元数据实体'
  },
  node_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '所属层级节点ID，关联 arch_tree_nodes'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '通信节点名称，业务可读名称'
  },
  endpoint_description: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '端点描述(JSON)，从Flow文件中提取的连接端点描述',
    get() {
      const raw = this.getDataValue('endpoint_description');
      // 统一语义：endpoint_description 必须是数组（每个元素代表一个接口配置）
      if (!raw) return [];
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === 'object') return [parsed];
          return [];
        } catch (e) {
          console.warn('endpoint_description JSON 解析失败，返回空数组:', raw);
          return [];
        }
      }
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'object' && raw !== null) return [raw];
      return [];
    },
    set(val) {
      if (typeof val === 'string') {
        this.setDataValue('endpoint_description', val);
      } else {
        // 统一语义：只允许数组写入；非数组时做降级包装
        if (Array.isArray(val)) {
          this.setDataValue('endpoint_description', val);
          return;
        }
        if (typeof val === 'object' && val !== null) {
          this.setDataValue('endpoint_description', [val]);
          return;
        }
        this.setDataValue('endpoint_description', []);
      }
    }
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'active',
    comment: '节点状态：active/inactive/error/deprecated'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: '配置(JSON)，可选的流程/节点配置快照',
    get() {
      const raw = this.getDataValue('config');
      if (!raw) return {};
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (e) {
          console.warn('config JSON 解析失败，返回空对象:', raw);
          return {};
        }
      }
      if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
      return {};
    },
    set(val) {
      if (typeof val === 'string') {
        this.setDataValue('config', val);
      } else {
        this.setDataValue('config', (typeof val === 'object' && val !== null) ? val : {});
      }
    }
  },
  flow_version: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '1.0.0',
    comment: '流程版本号，标识流程演进版本'
  },
  flow_digest_sha256: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '流程内容摘要(SHA-256)，用于完整性校验与内容寻址'
  },
  size_bytes: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0,
    comment: '文件大小(字节)'
  },
  created_at: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建时间戳'
  },
  updated_at: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '更新时间戳'
  }
}, {
  tableName: 'communication_nodes',
  timestamps: false
});

module.exports = CommunicationNode;
