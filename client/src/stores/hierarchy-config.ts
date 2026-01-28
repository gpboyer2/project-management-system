/**
 * 层级配置状态管理
 * 职责：数据存储和同步，所有增删改查操作直接调用后端 API
 */

import { defineStore } from 'pinia';
import { hierarchyApi } from '@/api';
import { ElMessage } from 'element-plus';

// 字段配置接口
export interface HierarchyField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'select' | 'textarea'
  required: boolean
  defaultValue?: any
  options?: string[]
  placeholder?: string
  order?: number
}

// 层级配置接口（对应 node_types 表）
export interface HierarchyLevel {
  id: string
  type_name: string
  display_name: string
  icon_class: string
  description?: string
  order: number
  parent_id?: string  // 父层级 ID
  fields: HierarchyField[]
  enable_comm_node_list?: boolean
  created_at: number
  updated_at: number
}

// 默认层级配置
// 注意：默认为空，实际层级配置由后端 API 动态提供
// 用户可在层级设置页面 (#/hierarchy-settings) 自定义节点类型和层级结构
const defaultLevelList: never[] = [];

export const useHierarchyConfigStore = defineStore('hierarchyConfig', {
  state: () => ({
    hierarchyLevels: [] as HierarchyLevel[],
    isLoading: false,
  }),

  getters: {
    /**
     * 获取按 order 字段排序后的层级列表
     * @param {object} state - Pinia state 对象
     * @returns {HierarchyLevel[]} 排序后的层级列表
     */
    sortedLevels: (state) =>
      [...state.hierarchyLevels].sort((a, b) => a.order - b.order),

    /**
     * 获取所有根层级（没有父层级的节点）
     * @param {object} state - Pinia state 对象
     * @returns {HierarchyLevel[]} 根层级列表，按 order 字段排序
     */
    rootLevels: (state) =>
      state.hierarchyLevels.filter(l => !l.parent_id).sort((a, b) => a.order - b.order),

    /**
     * 根据 node_type_id 获取显示字段名
     * @param {object} state - Pinia state 对象
     * @returns {(nodeTypeId: string) => string} 返回一个函数，该函数接收节点类型 ID 并返回对应的显示字段名
     */
    getDisplayFieldName: (state) => (nodeTypeId: string): string => {
      const level = state.hierarchyLevels.find(l => l.id === nodeTypeId);
      if (level?.fields && level.fields.length > 0) {
        // 按 order 排序，取第一个作为显示字段
        const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
        return sortedFields[0].name;
      }
      return 'id';  // 默认 fallback
    }
  },

  actions: {
    /**
     * 从后端 API 加载所有层级配置
     * @returns {Promise<void>} 无返回值，加载成功后更新 state.hierarchyLevels
     */
    async loadLevels() {
      // 防止重复请求
      if (this.isLoading) {
        console.log('[HierarchyConfig] Already loading, skip');
        return;
      }
      this.isLoading = true;
      console.log('[HierarchyConfig] Start loading levels...');
      try {
        const response = await hierarchyApi.getAllNodeTypes();
        console.log('[HierarchyConfig] API response:', response);
        if (response.status !== 'success') {
          console.error('[HierarchyConfig] Load failed:', response.message);
          ElMessage.error(response.message || '加载层级配置失败');
          return;
        }
        if (Array.isArray(response.datum)) {
          // 按 order 排序
          const sorted = [...response.datum].sort((a: any, b: any) => a.order - b.order);
          
          this.hierarchyLevels = sorted.map((level: any, index: number) => {
            // 修复自引用问题：如果 parent_id 等于自己的 id，则使用前一个层级的 id
            let parentId = level.parent_id;
            if (parentId === level.id && index > 0) {
              parentId = sorted[index - 1].id;
            } else if (parentId === level.id) {
              parentId = undefined;
            }
            
            const result = {
              id: level.id,
              type_name: level.type_name || 'CUSTOM',
              display_name: level.display_name,
              icon_class: level.icon_class,
              description: level.description,
              order: level.order,
              parent_id: parentId || undefined,
              enable_comm_node_list: !!level.enable_comm_node_list,
              created_at: level.created_at,
              updated_at: level.updated_at,
              fields: (() => {
                // fields 可能是 JSON 字符串、数组或对象（带数字键）
                let fieldList = level.fields;
                if (typeof fieldList === 'string') {
                  try {
                    fieldList = JSON.parse(fieldList);
                  } catch (e) {
                    console.error('解析 fields 失败:', e);
                    fieldList = [];
                  }
                }
                // 如果是对象（如 {0: {...}, 1: {...}}），转换为数组
                if (fieldList && !Array.isArray(fieldList)) {
                  fieldList = Object.values(fieldList);
                }
                return (fieldList || []).map((field: any) => ({
                  id: field.id,
                  name: field.name ?? field.field_name,
                  type: field.type ?? field.field_type,
                  required: field.required === true || field.required === 1,
                  defaultValue: field.defaultValue ?? field.default_value,
                  options: field.options ?? [],
                  placeholder: field.placeholder,
                  order: field.order ?? 0
                }));
              })()
            };
            
            console.log('[HierarchyConfig] 🔍 Processed level detail:', {
              id: result.id,
              type_name: result.type_name,
              display_name: result.display_name,
              icon_class: result.icon_class,
              icon_class_type: typeof result.icon_class,
              order: result.order
            });
            
            return result;
          });
          
          console.log('[HierarchyConfig] Loaded levels:', this.hierarchyLevels.length, this.hierarchyLevels);
        }
      } catch (error) {
        // 请求被取消时不显示错误（可能是重复请求被取消）
        if (error?.code !== 'ERR_CANCELED') {
          console.error('[HierarchyConfig] Load error:', error);
          ElMessage.error('加载层级配置失败');
        }
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 添加新的层级配置
     * @param {Partial<HierarchyLevel>} levelData - 层级数据，包含 type_name、display_name、icon_class 等字段
     * @returns {Promise<HierarchyLevel|null>} 成功返回新创建的层级对象，失败返回 null
     */
    async addLevel(levelData: Partial<HierarchyLevel>) {
      try {
        const response = await hierarchyApi.createNodeType({
          type_name: levelData.type_name || 'CUSTOM',
          display_name: levelData.display_name || '新层级',
          icon_class: levelData.icon_class || 'Document',
          description: levelData.description,
          order: levelData.order || this.hierarchyLevels.length + 1,
          parent_id: levelData.parent_id
        });
        if (response.status === 'success') {
          await this.loadLevels();
          return response.datum?.lastID ? this.hierarchyLevels.find(l => l.id === response.datum.lastID) : null;
        } else {
          ElMessage.error(response.message || '添加层级失败');
          return null;
        }
      } catch (error) {
        console.error('添加层级失败', error);
        ElMessage.error('添加层级失败');
        return null;
      }
    },

    /**
     * 更新层级配置
     * @param {string} levelId - 层级 ID
     * @param {Partial<HierarchyLevel>} updates - 要更新的字段数据
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async updateLevel(levelId: string, updates: Partial<HierarchyLevel>) {
      try {
        const response = await hierarchyApi.updateNodeType(levelId, updates);
        if (response.status === 'success') {
          await this.loadLevels();
          return true;
        } else {
          ElMessage.error(response.message || '更新层级失败');
          return false;
        }
      } catch (error) {
        console.error('更新层级失败', error);
        ElMessage.error('更新层级失败');
        return false;
      }
    },

    /**
     * 删除层级配置
     * @param {string} levelId - 层级 ID
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async deleteLevel(levelId: string) {
      try {
        const response = await hierarchyApi.deleteNodeType(levelId);
        if (response.status === 'success') {
          await this.loadLevels();
          return true;
        } else {
          ElMessage.error(response.message || '删除层级失败');
          return false;
        }
      } catch (error) {
        console.error('删除层级失败', error);
        ElMessage.error('删除层级失败');
        return false;
      }
    },

    /**
     * 为指定层级添加字段
     * @param {string} levelId - 层级 ID
     * @param {Partial<HierarchyField>} fieldData - 字段数据，包含 name、type、required 等字段
     * @returns {Promise<HierarchyField|null>} 成功返回新创建的字段对象，失败返回 null
     */
    async addFieldToLevel(levelId: string, fieldData: Partial<HierarchyField>) {
      try {
        const response = await hierarchyApi.createNodeTypeField(levelId, {
          name: fieldData.name || '新字段',
          type: fieldData.type || 'string',
          required: fieldData.required || false,
          defaultValue: fieldData.defaultValue,
          options: fieldData.options,
          placeholder: fieldData.placeholder,
          order: 0
        });
        if (response.status === 'success') {
          await this.loadLevels();
          if (response.datum?.lastID) {
            const level = this.hierarchyLevels.find(l => l.id === levelId);
            return level?.fields.find(f => f.id === response.datum.lastID) || null;
          }
          return null;
        } else {
          ElMessage.error(response.message || '添加字段失败');
          return null;
        }
      } catch (error) {
        console.error('添加字段失败', error);
        ElMessage.error('添加字段失败');
        return null;
      }
    },

    /**
     * 更新层级字段配置
     * @param {string} levelId - 层级 ID
     * @param {string} fieldId - 字段 ID
     * @param {Partial<HierarchyField>} updates - 要更新的字段数据
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async updateField(levelId: string, fieldId: string, updates: Partial<HierarchyField>) {
      try {
        const response = await hierarchyApi.updateNodeTypeField(levelId, fieldId, updates);
        if (response.status === 'success') {
          await this.loadLevels();
          return true;
        } else {
          ElMessage.error(response.message || '更新字段失败');
          return false;
        }
      } catch (error) {
        console.error('更新字段失败', error);
        ElMessage.error('更新字段失败');
        return false;
      }
    },

    /**
     * 删除层级字段
     * @param {string} levelId - 层级 ID
     * @param {string} fieldId - 字段 ID
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async deleteField(levelId: string, fieldId: string) {
      try {
        const response = await hierarchyApi.deleteNodeTypeField(levelId, fieldId);
        if (response.status === 'success') {
          await this.loadLevels();
          return true;
        } else {
          ElMessage.error(response.message || '删除字段失败');
          return false;
        }
      } catch (error) {
        console.error('删除字段失败', error);
        ElMessage.error('删除字段失败');
        return false;
      }
    },

    /**
     * 获取指定父层级的所有子层级
     * @param {string} parentId - 父层级 ID
     * @returns {HierarchyLevel[]} 子层级列表，按 order 字段排序
     */
    getChildLevels(parentId: string) {
      return this.hierarchyLevels
        .filter(l => l.parent_id === parentId)
        .sort((a, b) => a.order - b.order);
    },

    /**
     * 重建线性层级链（按顺序设置 order 和 parent_id）
     * @param {string[]} levelIds - 层级 ID 数组，按顺序排列
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async rebuildLinearHierarchy(levelIds: string[]) {
      const updatePromises = levelIds.map((id, index) => {
        const parentId = index === 0 ? undefined : levelIds[index - 1];
        return hierarchyApi.updateNodeType(id, {
          order: index + 1,
          parent_id: parentId
        });
      });

      try {
        const results = await Promise.all(updatePromises);
        // 检查是否有失败的请求
        const hasError = results.some(r => r.status !== 'success');
        if (hasError) {
          const errorResponse = results.find(r => r.status !== 'success');
          ElMessage.error(errorResponse?.message || '重建层级链失败');
          return false;
        }
        await this.loadLevels();
        return true;
      } catch (error) {
        console.error('重建层级链失败', error);
        ElMessage.error('重建层级链失败');
        return false;
      }
    },

    /**
     * 重置层级配置为默认值（删除所有现有层级并创建默认层级）
     * @returns {Promise<boolean>} 成功返回 true，失败返回 false
     */
    async resetToDefault() {
      try {
        // 删除所有现有层级
        const deletePromises = this.hierarchyLevels.map(l =>
          hierarchyApi.deleteNodeType(l.id)
        );
        const deleteResults = await Promise.all(deletePromises);
        // 检查是否有失败的删除请求
        const hasDeleteError = deleteResults.some(r => r.status !== 'success');
        if (hasDeleteError) {
          const errorResponse = deleteResults.find(r => r.status !== 'success');
          ElMessage.error(errorResponse?.message || '删除现有层级失败');
          return false;
        }

        // 创建默认层级
        const createPromises = defaultLevelList.map(level =>
          hierarchyApi.createNodeType(level)
        );
        const results = await Promise.all(createPromises);
        // 检查是否有失败的创建请求
        const hasCreateError = results.some(r => r.status !== 'success');
        if (hasCreateError) {
          const errorResponse = results.find(r => r.status !== 'success');
          ElMessage.error(errorResponse?.message || '创建默认层级失败');
          return false;
        }

        // 重建线性链
        const newIds = results.map(r => r.datum?.lastID).filter(Boolean) as string[];
        if (newIds.length > 0) {
          await this.rebuildLinearHierarchy(newIds);
        } else {
          await this.loadLevels();
        }
        return true;
      } catch (error) {
        console.error('重置层级失败', error);
        ElMessage.error('重置层级失败');
        return false;
      }
    }
  }
});
