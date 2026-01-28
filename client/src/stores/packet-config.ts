/**
 *
 * 报文配置状态管理
 * 基于Pinia的报文数据管理和持久化
 *
 */

import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';

// 报文字段接口（字段名统一使用 snake_case，与后端保持一致）
export interface PacketField {
  // 内部管理字段
  id?: string
  level?: number
  parent_id?: string
  expanded?: boolean

  // 标准JSON字段（与代码生成器规范保持一致）
  field_name: string
  type: string
  description?: string
  byte_length?: number
  default_value?: string | number | boolean | null
  display_format?: string
  is_required?: boolean
  valid_when: {
    field: string
    value: number
  }

  // 通用字段
  is_message_id?: boolean
  is_reversed?: boolean
  unit?: string
  lsb?: number
  max_value?: number | string
  min_value?: number | string
  validation_regex?: string
  compression?: string

  // 编码/位域字段
  base_type?: string
  maps?: Array<{ value: number | string; meaning: string }>
  sub_fields?: Array<{
    name: string
    start_bit: number
    end_bit: number
    maps?: Array<{ value: number | string; meaning: string }>
  }>

  // 字符串字段
  length?: number
  encoding?: string

  // 数组字段
  count?: number
  count_from_field?: string
  bytes_in_trailer?: number
  element?: PacketField

  // 结构体字段
  fields?: PacketField[]

  // 时间戳字段
  precision?: string

  // 命令字字段
  cases?: Record<string, unknown>
  command_type?: string

  // 填充/保留字段
  bit_length?: number
  fill_value?: string

  // 校验字段
  algorithm?: string
  range_start_ref?: string
  range_end_ref?: string
  parameters?: Record<string, unknown>

  // MessageId专用
  value_type?: string
  message_id_value?: string | number | null
  value_range?: Array<{ min: number; max: number }>
}

// 报文接口（字段名与后端数据库一致，使用小写加下划线）
export interface Packet {
  id: number  // 数据库主键ID（自增）
  // 协议逻辑ID：UUID，同一协议的所有版本/草稿保持一致
  message_id?: string
  name: string
  description: string
  hierarchy_node_id: string  // 层级节点ID
  protocol: string
  status: number
  field_count: number
  created_at?: number
  updated_at?: number
  fields: PacketField[]
  version?: string
  default_byte_order?: string
  struct_alignment?: number | null
}


export const usePacketConfigStore = defineStore('packet-config', {

  state: () => ({

    // 报文列表
    packetList: [] as Packet[],

    // 层级节点列表
    hierarchyNodeList: [
      '卫星平台',
      '电机驱动器',
      '环境监测站',
      '测试节点'
    ] as string[],

    // 加载状态
    loading: false,

  }),

  getters: {
    // 报文总数
    packetCount: (state) => state.packetList.length,

    // 启用的报文数
    enabledPacketCount: (state) =>
      state.packetList.filter(p => p.status === 1).length,

    // 禁用的报文数
    disabledPacketCount: (state) =>
      state.packetList.filter(p => p.status === 0).length,
  },

  actions: {
    /**
     * 获取报文列表
     */
    getPacketList() {
      return this.packetList;
    },

    /**
     * 根据ID获取报文
     */
    getPacketById(id: number): Packet | undefined {
      return this.packetList.find(p => p.id === id);
    },

    /**
     * 添加报文
     */
    addPacket(packet: Packet) {
      // 检查ID是否重复
      const exists = this.packetList.some(p => p.id === packet.id);
      if (exists) {
        console.warn('报文ID已存在:', packet.id);
        return false;
      }

      this.packetList.unshift(packet);
      ElMessage.success(`报文已添加: ${packet.name}`);
      return true;
    },

    /**
     * 更新报文
     */
    updatePacket(id: number, updatedPacket: Packet) {
      const index = this.packetList.findIndex(p => p.id === id);
      if (index === -1) {
        ElMessage.warning(`未找到要更新的报文: ${id}`);
        return false;
      }

      this.packetList[index] = {
        ...updatedPacket,
        updated_at: Date.now()
      };
      ElMessage.success(`报文已更新: ${updatedPacket.name}`);
      return true;
    },

    /**
     * 删除报文
     */
    deletePacket(id: number) {
      const index = this.packetList.findIndex(p => p.id === id);
      if (index === -1) {
        ElMessage.warning(`未找到要删除的报文: ${id}`);
        return false;
      }

      const packet = this.packetList[index];
      this.packetList.splice(index, 1);
      ElMessage.success(`报文已删除: ${packet.name}`);
      return true;
    },

    /**
     * 批量删除报文
     */
    deleteMultiplePackets(ids: number[]) {
      ids.forEach(id => {
        const index = this.packetList.findIndex(p => p.id === id);
        if (index > -1) {
          this.packetList.splice(index, 1);
        }
      });
      ElMessage.success(`批量删除报文完成，共删除: ${ids.length}`);
    },

    /**
     * 复制报文
     */
    duplicatePacket(id: number): Packet | null {
      const originalPacket = this.packetList.find(p => p.id === id);
      if (!originalPacket) {
        ElMessage.warning(`未找到要复制的报文: ${id}`);
        return null;
      }

      const newPacket: Packet = {
        ...originalPacket,
        id: 0,  // 新增时由后端生成
        name: `${originalPacket.name} (副本)`,
        updated_at: Date.now()
      };

      this.packetList.unshift(newPacket);
      ElMessage.success(`报文已复制: ${newPacket.name}`);
      return newPacket;
    },

    /**
     * 批量启用报文
     */
    enableMultiplePackets(ids: number[]) {
      ids.forEach(id => {
        const packet = this.packetList.find(p => p.id === id);
        if (packet) {
          packet.status = 1;
        }
      });
      ElMessage.success(`批量启用报文完成，共启用: ${ids.length}`);
    },

    /**
     * 批量禁用报文
     */
    disableMultiplePackets(ids: number[]) {
      ids.forEach(id => {
        const packet = this.packetList.find(p => p.id === id);
        if (packet) {
          packet.status = 0;
        }
      });
      ElMessage.success(`批量禁用报文完成，共禁用: ${ids.length}`);
    },

    /**
     * 保存报文（新增或更新）
     */
    savePacket(packet: Packet): boolean {
      const index = this.packetList.findIndex(p => p.id === packet.id);

      const savedPacket: Packet = {
        ...packet,
        field_count: packet.fields.length,
        updated_at: Date.now()
      };

      if (index > -1) {
        // 更新已有报文
        this.packetList[index] = savedPacket;
        ElMessage.success(`报文已更新: ${savedPacket.name}`);
      } else {
        // 新增报文
        this.packetList.unshift(savedPacket);
        ElMessage.success(`报文已新增: ${savedPacket.name}`);
      }

      return true;
    },

    /**
     * 添加层级节点
     */
    addHierarchyNode(nodeName: string) {
      if (!this.hierarchyNodeList.includes(nodeName)) {
        this.hierarchyNodeList.push(nodeName);
        ElMessage.success(`节点已添加: ${nodeName}`);
      }
    },

    /**
     * 添加嵌套字段到父字段
     */
    addNestedField(packetId: number, parentFieldId: string, fieldType: string): PacketField | null {
      const packet = this.getPacketById(packetId);
      if (!packet) return null;

      const parentField = this.findFieldById(packet.fields, parentFieldId);
      if (!parentField || (parentField.type !== 'Struct' && parentField.type !== 'Array')) {
        ElMessage.warning('只有结构体和数组类型可以添加嵌套字段');
        return null;
      }

      const newField: PacketField = {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        field_name: '',
        type: fieldType,
        description: '',
        level: (parentField.level || 0) + 1,
        parent_id: parentFieldId,
        valid_when: {
          field: '',
          value: null
        }
      };

      if (!parentField.fields) {
        parentField.fields = [];
      }
      parentField.fields.push(newField);

      ElMessage.success(`嵌套字段已添加: ${newField.id}`);
      return newField;
    },

    /**
     * 根据ID查找字段（递归搜索）
     */
    findFieldById(fields: PacketField[], fieldId: string): PacketField | null {
      for (const field of fields) {
        if (field.id === fieldId) return field;
        if (field.fields) {
          const found = this.findFieldById(field.fields, fieldId);
          if (found) return found;
        }
        if (field.element) {
          const found = this.findFieldById([field.element], fieldId);
          if (found) return found;
        }
      }
      return null;
    },

    /**
     * 删除嵌套字段
     */
    removeNestedField(packetId: number, fieldId: string): boolean {
      const packet = this.getPacketById(packetId);
      if (!packet) return false;

      return this.removeFieldFromArray(packet.fields, fieldId);
    },

    /**
     * 从字段数组中递归删除字段
     */
    removeFieldFromArray(fields: PacketField[], fieldId: string): boolean {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].id === fieldId) {
          fields.splice(i, 1);
          return true;
        }
        if (fields[i].fields && this.removeFieldFromArray(fields[i].fields!, fieldId)) return true;
        if (fields[i].element && this.removeFieldFromArray([fields[i].element!], fieldId)) return true;
      }
      return false;
    },

    /**
     * 切换字段展开状态
     */
    toggleFieldExpanded(packetId: number, fieldId: string): boolean {
      const packet = this.getPacketById(packetId);
      if (!packet) return false;

      const field = this.findFieldById(packet.fields, fieldId);
      if (!field) return false;

      field.expanded = !field.expanded;
      ElMessage.info(`字段展开状态已切换: ${fieldId}, 展开状态: ${field.expanded}`);
      return true;
    },

    /**
     * 获取扁平化的字段列表（用于显示）
     */
    getFlattenedFields(fields: PacketField[]): PacketField[] {
      const result: PacketField[] = [];

      function flatten(fieldList: PacketField[], level: number = 0) {
        for (const field of fieldList) {
          field.level = level;
          result.push(field);

          if (field.expanded && field.fields && field.fields.length > 0) {
            flatten(field.fields, level + 1);
          }
          if (field.expanded && field.element) {
            flatten([field.element], level + 1);
          }
        }
      }

      flatten(fields);
      return result;
    },

    /**
     * 重置所有数据
     */
    reset() {
      this.packetList = [];
      this.hierarchyNodeList = ['节点A', '节点B', 'PLC节点'];
      this.loading = false;
      ElMessage.success('报文配置状态已重置');
    },
  },

  persist: {
    key: 'packet-config-store',
  }
});
