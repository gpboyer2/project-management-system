/**
 * @file systemLevelDesignTree.js
 * @brief 系统层级设计树服务，处理系统层级设计节点的相关业务逻辑
 * @date 2025-11-28
 * @copyright Copyright (c) 2025
 */
const SystemLevelDesignTreeModel = require('../models/systemLevelDesignTree');
const HierarchyService = require('./hierarchy');
const logger = require('../../middleware/log4jsPlus').getLogger();

// 环境变量配置
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

// 加载种子数据（仅开发模式）
const seedData = isDev ? require('../../data/mock-system-level-design.json') : { node_types: [], nodes: [] };
const seedNodeList = seedData.nodes || [];
const seedNodeTypeList = seedData.node_types || [];

// 种子数据初始化状态
let seedInitialized = false;

class SystemLevelDesignTreeService {
  /**
   * 初始化种子数据（仅开发模式，数据库为空时注入）
   */
  static async initSeedData() {
    if (seedInitialized || !isDev) return;
    try {
      // 先确保层级类型已初始化（外键依赖）
      await HierarchyService.getAllNodeTypes();
      
      const dbNodeList = await SystemLevelDesignTreeModel.findAll();
      if (dbNodeList.length === 0 && seedNodeList.length > 0) {
        logger.info('[SystemLevelDesign] 数据库为空，开始注入种子数据...');
        // 移除 _mock 标记，批量插入
        const cleanedList = seedNodeList.map(({ _mock, ...node }) => node);
        await SystemLevelDesignTreeModel.createBatch(cleanedList);
        logger.info(`[SystemLevelDesign] 种子数据注入完成，共 ${seedNodeList.length} 条`);
      }
      seedInitialized = true;
    } catch (error) {
      logger.error('[SystemLevelDesign] 种子数据初始化失败:', error.message);
    }
  }

  /**
   * 获取所有节点
   */
  static async getAllNodes() {
    try {
      // 首次访问时初始化种子数据
      await this.initSeedData();
      const result = await SystemLevelDesignTreeModel.findAll();
      logger.info('[Service.getAllNodes] 返回节点数量:', result.length);

      // 清理每个节点的 properties 字段，移除可能干扰前端树构建的字段
      const cleanedResult = result.map(node => {
        if (node.properties) {
          const { children, expanded, ...cleanedProperties } = node.properties;
          return {
            ...node,
            properties: cleanedProperties
          };
        }
        return node;
      });

      return cleanedResult;
    } catch (error) {
      throw new Error('getAllNodes Failed: ' + error.message);
    }
  }

  /**
   * 获取单个节点
   * @param {string} id - 节点ID
   */
  static async getNodeById(id) {
    try {
      logger.info('[Service.getNodeById] 查询节点 id:', id);
      const result = await SystemLevelDesignTreeModel.findById(id);
      logger.info('[Service.getNodeById] 查询结果:', result ? JSON.stringify(result) : 'null');
      // 查询操作：节点不存在时返回 null，而不是抛出异常
      // 符合测试架构规范：查询类操作查不到数据 = success
      return result;
    } catch (error) {
      throw new Error('getNodeById Failed: ' + error.message);
    }
  }

  /**
   * 获取子节点
   * @param {string} parentId - 父节点ID
   */
  static async getChildNodes(parentId) {
    try {
      return await SystemLevelDesignTreeModel.findByParentId(parentId);
    } catch (error) {
      throw new Error('getChildNodes Failed: ' + error.message);
    }
  }

  /**
   * 创建节点
   * @param {Object} data - 节点数据
   */
  static async createNode(data) {
    try {
      return await SystemLevelDesignTreeModel.create(data);
    } catch (error) {
      throw new Error('createNode Failed: ' + error.message);
    }
  }

  /**
   * 批量创建节点
   * @param {Array<Object>} dataList - 节点数据列表
   */
  static async createNodeList(dataList) {
    try {
      // 校验空数组
      if (!dataList || dataList.length === 0) {
        throw new Error('创建节点失败: 参数不能为空数组');
      }

      // 获取有效的 node_type_id 列表
      const nodeTypeList = await HierarchyService.getAllNodeTypes();
      const validNodeTypeIds = new Set(nodeTypeList.map(nt => nt.id));

      // 校验每个节点的 node_type_id
      for (const item of dataList) {
        if (!item.node_type_id) {
          throw new Error('创建节点失败: 缺少参数 node_type_id');
        }
        if (!validNodeTypeIds.has(item.node_type_id)) {
          throw new Error('创建节点失败: 无效的 node_type_id');
        }
      }

      const now = Date.now();
      const preparedList = dataList.map(item => ({
        ...item,
        created_at: item.created_at || now,
        updated_at: item.updated_at || now
      }));
      return await SystemLevelDesignTreeModel.createBatch(preparedList);
    } catch (error) {
      throw new Error('createNodeList Failed: ' + error.message);
    }
  }

  /**
   * 更新节点
   * @param {string} id - 节点ID
   * @param {Object} data - 更新数据
   */
  static async updateNode(id, data) {
    try {
      data.updated_at = Date.now();
      await SystemLevelDesignTreeModel.update(id, data);
      return await this.getNodeById(id);
    } catch (error) {
      throw new Error('updateNode Failed: ' + error.message);
    }
  }

  /**
   * 批量更新节点
   * @param {Array<Object>} dataList - 节点数据列表
   */
  static async updateNodeList(dataList) {
    logger.info('[updateNodeList] Service 收到请求，dataList:', JSON.stringify(dataList));
    try {
      const now = Date.now();
      const preparedList = dataList.map(item => ({
        ...item,
        updated_at: now
      }));
      logger.info('[updateNodeList] 准备调用 Model.updateBatch');
      const result = await SystemLevelDesignTreeModel.updateBatch(preparedList);
      logger.info('[updateNodeList] Model 返回结果:', JSON.stringify(result));

      // 修正返回格式：updated 和 failed 应该是数组，不是对象
      const formattedResult = {
        updated: result.updated || [],
        failed: result.failed || [],
        successCount: result.successCount || 0,
        failedCount: result.failedCount || 0
      };
      logger.info('[updateNodeList] 格式化后的返回结果:', JSON.stringify(formattedResult));

      // 如果全部失败，抛出错误
      if (formattedResult.successCount === 0 && formattedResult.failedCount > 0) {
        const failedIdList = formattedResult.failed.map(f => f.id).join(', ');
        throw new Error(`更新失败: 记录不存在或数据未变化 (id: ${failedIdList})`);
      }
      return formattedResult;
    } catch (error) {
      logger.error('[updateNodeList] 发生错误:', error.message);
      throw new Error(error.message.startsWith('更新失败') ? error.message : 'updateNodeList Failed: ' + error.message);
    }
  }

  /**
   * 删除节点
   * @param {string} id - 节点ID
   */
  static async deleteNode(id) {
    try {
      return await SystemLevelDesignTreeModel.delete(id);
    } catch (error) {
      throw new Error('deleteNode Failed: ' + error.message);
    }
  }

  /**
   * 批量删除节点
   * @param {Array<string>} idList - 节点ID列表
   */
  static async deleteNodeList(idList) {
    try {
      return await SystemLevelDesignTreeModel.deleteBatch(idList);
    } catch (error) {
      throw new Error('deleteNodeList Failed: ' + error.message);
    }
  }
}

module.exports = SystemLevelDesignTreeService;
