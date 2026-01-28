/**
 *
 * 系统级设计页面状态管理
 * 基于Vue3 + Pinia架构
 * 管理动态层级节点的树形结构数据
 *
 */

import { defineStore } from 'pinia';
import { systemLevelDesignTreeApi } from '@/api';

// 通用节点接口（支持动态层级）
export interface HierarchyNode {
  id: string
  node_type_id: string  // 对应层级配置的 id（从层级设置页面动态配置）
  description?: string
  expanded?: boolean
  children?: HierarchyNode[]
  properties?: Record<string, any>
  [key: string]: any  // 支持动态字段（包含"名称"字段）
}

export const useSystemLevelDesignStore = defineStore('systemLevelDesign', {
  state: () => ({
    // 动态层级节点列表
    hierarchyNodes: [] as HierarchyNode[],
    // 搜索关键词
    searchKeyword: '',
    // P1-5: 缓存上次搜索结果（避免重复计算）
    cachedFilterKeyword: '',
    cachedFilteredNodes: [] as HierarchyNode[],
    // P1-5: 显示字段名缓存（避免每次查找）
    displayFieldCache: new Map<string, string>(),
    // P1-5: 防抖定时器
    searchDebounceTimer: null as ReturnType<typeof setTimeout> | null
  }),

  getters: {
    // P1-5: 优化后的搜索过滤（带缓存）
    filteredHierarchyNodes(): HierarchyNode[] {
      const keyword = this.searchKeyword.trim().toLowerCase();

      // 空关键词直接返回原始数据
      if (!keyword) {
        return this.hierarchyNodes;
      }

      // 命中缓存：关键词和节点版本都未变化
      if (this.cachedFilterKeyword === keyword && this.cachedFilteredNodes.length > 0) {
        return this.cachedFilteredNodes;
      }

      // 缓存失效：重新计算
      const result = this.performFilter(keyword);
      this.cachedFilterKeyword = keyword;
      this.cachedFilteredNodes = result;
      return result;
    }
  },

  actions: {
    // P1-5: 执行过滤的核心逻辑（提取为独立方法便于缓存管理）
    performFilter(keyword: string): HierarchyNode[] {
      // 获取显示字段名（使用缓存）
      const getDisplayFieldName = (node: HierarchyNode): string => {
        // 确保 displayFieldCache 是 Map 对象（持久化后可能变成普通对象）
        if (!(this.displayFieldCache instanceof Map)) {
          console.warn('[system-level-design] displayFieldCache 不是 Map 对象，重新初始化');
          this.displayFieldCache = new Map<string, string>();
        }
        if (this.displayFieldCache.has(node.node_type_id)) {
          return this.displayFieldCache.get(node.node_type_id)!;
        }
        // 从层级配置 store 中获取
        const { useHierarchyConfigStore } = require('./hierarchy-config');
        const hierarchyConfigStore = useHierarchyConfigStore();
        const level = hierarchyConfigStore.hierarchyLevels.find(l => l.id === node.node_type_id);
        let fieldName = 'id';
        if (level?.fields && level.fields.length > 0) {
          const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
          fieldName = sortedFields[0].name;
        }
        this.displayFieldCache.set(node.node_type_id, fieldName);
        return fieldName;
      };

      const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
        return nodes.filter(node => {
          const displayField = getDisplayFieldName(node);
          const displayValue = (node[displayField] || node.id).toLowerCase();
          const match = displayValue.includes(keyword);
          if (node.children && node.children.length > 0) {
            const filteredChildren = filterNodes(node.children);
            return match || filteredChildren.length > 0;
          }
          return match;
        });
      };
      return filterNodes(this.hierarchyNodes);
    },

    /**
     * 从 API 获取节点详情
     */
    async getNodeById(nodeId: string) {
      const response = await systemLevelDesignTreeApi.getNodeById(nodeId);
      if (response.status === 'success') {
        // 后端已自动解析 properties 为对象，直接使用
        if (response.datum.properties) {
          const result = { ...response.datum, ...response.datum.properties };
          return result;
        }
        return response.datum;
      } else {
        throw new Error(response.message || '获取节点详情失败');
      }
    },

    /**
     * 生成唯一ID
     */
    generateId(type: string): string {
      return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 从 API 加载层级节点数据
     */
    async loadHierarchyNodes() {
      const response = await systemLevelDesignTreeApi.getAllNodes();
      if (response.status === 'success') {
        if (Array.isArray(response.datum)) {
          // 构建树形结构
          const nodeMap = new Map<string, HierarchyNode>();
          const rootNodes: HierarchyNode[] = [];

          // 第一遍：创建所有节点
          response.datum.forEach((item: any) => {
            // 后端已自动解析 properties 为对象
            const properties = item.properties || {};

            const node: HierarchyNode = {
              id: item.id,
              node_type_id: item.node_type_id,
              parent_id: item.parent_id, // 添加 parent_id 字段
              description: item.description,
              expanded: true,
              children: [],
              properties,
              // 展开动态字段到节点上
              ...properties
            };
            nodeMap.set(item.id, node);
          });

          // 第二遍：构建父子关系
          response.datum.forEach((item: any) => {
            const node = nodeMap.get(item.id)!;
            if (item.parent_id && nodeMap.has(item.parent_id)) {
              const parent = nodeMap.get(item.parent_id)!;
              parent.children!.push(node);
            } else {
              rootNodes.push(node);
            }
          });

          this.hierarchyNodes = rootNodes;
          // P1-5: 数据加载后清除搜索缓存
          this.clearSearchCache();
        }
      } else {
        console.error('加载层级节点失败:', response.message);
      }
    },

    /**
     * 添加动态层级节点（调用 API）
     */
    async addHierarchyNode(parentId: string | null, nodeTypeId: string, nodeData: Partial<HierarchyNode> = {}) {
      const id = this.generateId('node');
      const now = Date.now();
      // 后端会自动处理 properties 为 JSON，直接传对象
      const apiData = {
        id,
        node_type_id: nodeTypeId,
        parent_id: parentId,
        description: nodeData.description || '',
        properties: {
          '名称': nodeData['名称'] || nodeData.name || '新节点',
          ...nodeData
        },
        created_at: now,
        updated_at: now
      };

      const response = await systemLevelDesignTreeApi.createNodeList([apiData]);
      if (response.status === 'success') {
        // 更新本地状态
        const newNode: HierarchyNode = {
          id,
          node_type_id: nodeTypeId,
          description: nodeData.description,
          expanded: false,
          children: [],
          properties: apiData.properties,
          ...apiData.properties
        };

        if (!parentId) {
          this.hierarchyNodes.push(newNode);
        } else {
          const parent = this.findNodeById(this.hierarchyNodes, parentId);
          if (parent) {
            if (!parent.children) parent.children = [];
            parent.children.push(newNode);
          }
        }
        // P1-5: 添加节点后清除搜索缓存
        this.clearSearchCache();
        return newNode;
      } else {
        // P1-6: 操作失败时确保一致性
        await this.ensureConsistency('添加节点');
        throw new Error(response.message || '添加节点失败');
      }
    },

    /**
     * 查找节点
     */
    findNodeById(nodes: HierarchyNode[], id: string): HierarchyNode | null {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = this.findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },

    /**
     * 更新动态层级节点（调用 API）
     * 字段由用户在 hierarchy-settings 页面动态配置
     */
    async updateHierarchyNode(nodeId: string, nodeData: Partial<HierarchyNode>) {
      // 过滤出需要存储到 properties 的字段
      // 排除数据库表字段，只保留用户配置的动态字段
      const propertiesData: Record<string, any> = {};
      const excludeKeys = ['id', 'node_type_id', 'parent_id', 'name', 'description', 'version', 'properties', 'expanded', 'children', 'hasCommNodeList', 'created_at', 'updated_at'];

      for (const key in nodeData) {
        if (!excludeKeys.includes(key)) {
          propertiesData[key] = nodeData[key];
        }
      }

      const apiData = {
        id: nodeId,
        description: nodeData.description || nodeData['描述'] || '',
        properties: propertiesData,
        updated_at: Date.now()
      };
      const response = await systemLevelDesignTreeApi.updateNodeList([apiData]);
      if (response.status === 'success') {
        // 更新本地状态
        const node = this.findNodeById(this.hierarchyNodes, nodeId);
        if (node) {
          // 完全替换 properties，并同步更新 node 上展开的字段
          node.properties = { ...propertiesData };
          // 同步更新 node 上展开的字段（删除旧字段，添加新字段）
          const allowedKeys = ['id', 'node_type_id', 'parent_id', 'expanded', 'children', 'properties', 'description', 'created_at', 'updated_at'];
          Object.keys(node).forEach(key => {
            if (!allowedKeys.includes(key)) {
              delete node[key];
            }
          });
          Object.assign(node, propertiesData);
        }
        // P1-5: 更新节点后清除搜索缓存
        this.clearSearchCache();
        return node;
      } else {
        // P1-6: 操作失败时确保一致性
        await this.ensureConsistency('更新节点');
        throw new Error(response.message || '更新节点失败');
      }
    },

    /**
     * 删除动态层级节点（调用 API）
     */
    async deleteHierarchyNode(nodeId: string) {
      const response = await systemLevelDesignTreeApi.deleteNodeList([nodeId]);
      if (response.status === 'success') {
        // 更新本地状态
        const deleteFromArray = (nodes: HierarchyNode[]): boolean => {
          const index = nodes.findIndex(n => n.id === nodeId);
          if (index > -1) {
            nodes.splice(index, 1);
            return true;
          }
          for (const node of nodes) {
            if (node.children && deleteFromArray(node.children)) {
              return true;
            }
          }
          return false;
        };
        const deleted = deleteFromArray(this.hierarchyNodes);
        // P1-5: 删除节点后清除搜索缓存
        if (deleted) {
          this.clearSearchCache();
        }
        return deleted;
      } else {
        // P1-6: 操作失败时确保一致性
        await this.ensureConsistency('删除节点');
        throw new Error(response.message || '删除节点失败');
      }
    },

    /**
     * 切换节点展开状态
     */
    toggleHierarchyNode(nodeId: string) {
      const node = this.findNodeById(this.hierarchyNodes, nodeId);
      if (node) {
        node.expanded = !node.expanded;
      }
    },

    /**
     * P1-5: 搜索处理（带防抖）
     * 防抖延迟 300ms，避免频繁计算
     */
    handleSearch(keyword: string) {
      // 清除之前的定时器
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      // 设置新的防抖定时器
      this.searchDebounceTimer = setTimeout(() => {
        this.searchKeyword = keyword;
      }, 300);
    },

    /**
     * P1-5: 清除搜索缓存（数据变更时调用）
     */
    clearSearchCache() {
      this.cachedFilterKeyword = '';
      this.cachedFilteredNodes = [];
      // 修复：确保 displayFieldCache 是 Map 对象（持久化后可能变成普通对象）
      if (typeof this.displayFieldCache.clear === 'function') {
        this.displayFieldCache.clear();
      } else {
        this.displayFieldCache = new Map<string, string>();
      }
    },

    /**
     * P1-6: 确保本地与服务器数据一致性
     * 当操作失败时重新加载数据，防止本地状态与服务器不一致
     */
    async ensureConsistency(operation: string): Promise<void> {
      console.log(`[system-level-design] ${operation} 失败，重新加载数据确保一致性`);
      try {
        await this.loadHierarchyNodes();
      } catch (reloadError) {
        console.error('[system-level-design] 一致性重载也失败了:', reloadError);
      }
    }
  },

  persist: {
    key: 'system-level-design-store'
  }
});
