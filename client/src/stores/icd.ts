/**
 *
 * ICD 协议集状态管理
 * 作为报文定义的单一事实来源 (Single Source of Truth)
 * 所有接口仅存储 packetId 引用，实际数据从此 Store 获取
 *
 */

import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';

// 报文字段接口（复用 packet-config 的定义）
export interface IcdPacketField {
  id?: string
  // 内部管理字段（与 packet-config 保持一致）
  level?: number
  parent_id?: string
  expanded?: boolean

  // 标准字段（snake_case）
  field_name: string
  type: string
  description?: string
  byte_length?: number
  length?: number | null
  valid_when: {
    field: string
    value: any
  }

  // 结构化字段
  fields?: IcdPacketField[]
  element?: IcdPacketField
  cases?: Record<string, any>
  // 其他字段属性
  [key: string]: any
}

// 报文定义接口
export interface IcdPacket {
  id: string
  name: string
  msgId?: string
  version?: string
  default_byte_order?: string
  hierarchy_node_id?: string  // 层级节点ID
  description?: string
  fields: IcdPacketField[]
  // 元数据
  createdAt?: number
  updatedAt?: number
}

// 协议集（ICD Bundle）接口
export interface IcdBundle {
  id: string
  name: string
  version: string
  description?: string
  packetList: IcdPacket[]
  // 元数据
  createdAt?: number
  updatedAt?: number
}

// 接口引用（仅存储 ID，不存储完整数据）
export interface InterfaceRef {
  packetId: string      // 引用的报文 ID
  bundleId: string      // 所属协议集 ID
  role: 'Pub' | 'Sub'   // 发布者/订阅者角色
  localVersion?: string // 本地缓存的版本号（用于检测过期）
}

// 初始化状态标记
const INITIALIZATION_KEY = 'icd-store-initialized';

export const useIcdStore = defineStore('icd', {
  state: () => ({
    // 协议集列表
    bundleList: [] as IcdBundle[],

    // 加载状态
    loading: false,

    // 当前选中的协议集 ID
    activeBundleId: null as string | null,

    // 当前选中的报文 ID
    activePacketId: null as string | null,

    // 初始化完成标记
    initialized: false as boolean,
  }),

  getters: {
    /**
     * 获取当前选中的协议集
     */
    activeBundle: (state): IcdBundle | null => {
      if (!state.activeBundleId) return null;
      return state.bundleList.find(b => b.id === state.activeBundleId) || null;
    },

    /**
     * 获取当前选中的报文
     */
    activePacket(): IcdPacket | null {
      const bundle = this.activeBundle;
      if (!bundle || !this.activePacketId) return null;
      return bundle.packetList.find(p => p.id === this.activePacketId) || null;
    },

    /**
     * 获取所有报文的扁平列表（跨协议集）
     */
    allPacketList: (state): Array<IcdPacket & { bundleId: string; bundleName: string }> => {
      const result: Array<IcdPacket & { bundleId: string; bundleName: string }> = [];
      for (const bundle of state.bundleList) {
        for (const packet of bundle.packetList) {
          result.push({
            ...packet,
            bundleId: bundle.id,
            bundleName: bundle.name,
          });
        }
      }
      return result;
    },

    /**
     * 协议集总数
     */
    bundleCount: (state) => state.bundleList.length,

    /**
     * 报文总数
     */
    packetCount: (state) => {
      return state.bundleList.reduce((sum, b) => sum + b.packetList.length, 0);
    },
  },

  actions: {
    /**
     * 初始化示例数据（开发阶段使用）
     * 修复 P0-3: 添加初始化标记，避免重复初始化和数据污染
     */
    initSampleData() {
      // 检查是否已经初始化过
      const wasInitialized = sessionStorage.getItem(INITIALIZATION_KEY);
      if (wasInitialized === 'true' && this.bundleList.length > 0) {
        console.log('[ICD Store] 已初始化，跳过示例数据初始化');
        return;
      }

      const sampleBundleList: IcdBundle[] = [
        {
          id: 'icd-inter-station',
          name: '站间通信协议 (Inter-Station ICD)',
          version: 'v1.2',
          description: '用于站间节点通信的标准协议集',
          packetList: [
            {
              id: 'msg-heartbeat',
              name: 'Heartbeat',
              msgId: '0x01',
              version: '1.0',
              default_byte_order: 'big',
              hierarchy_node_id: '通用',
              description: '心跳报文，用于连接保活',
              fields: [
                { id: 'hb-field-1', field_name: 'messageId1', type: 'MessageId', byte_length: 2, valid_when: { field: '', value: null } },
                { id: 'hb-field-2', field_name: 'timestamp1', type: 'Timestamp', byte_length: 8, valid_when: { field: '', value: null } },
                { id: 'hb-field-3', field_name: 'sequenceNo1', type: 'UnsignedInt', byte_length: 4, valid_when: { field: '', value: null } },
              ],
            },
            {
              id: 'msg-track-data',
              name: 'Track_Data',
              msgId: '0x02',
              version: '1.1',
              default_byte_order: 'big',
              hierarchy_node_id: '节点1',
              description: '节点1数据报文',
              fields: [
                { id: 'td-field-1', field_name: 'messageId1', type: 'MessageId', byte_length: 2, valid_when: { field: '', value: null } },
                { id: 'td-field-2', field_name: 'trackId1', type: 'UnsignedInt', byte_length: 4, valid_when: { field: '', value: null } },
                { id: 'td-field-3', field_name: 'latitude1', type: 'Float', byte_length: 8, valid_when: { field: '', value: null } },
                { id: 'td-field-4', field_name: 'longitude1', type: 'Float', byte_length: 8, valid_when: { field: '', value: null } },
                { id: 'td-field-5', field_name: 'altitude1', type: 'Float', byte_length: 4, valid_when: { field: '', value: null } },
                { id: 'td-field-6', field_name: 'speed1', type: 'Float', byte_length: 4, valid_when: { field: '', value: null } },
              ],
            },
            {
              id: 'msg-control-cmd',
              name: 'Control_Cmd',
              msgId: '0x03',
              version: '1.0',
              default_byte_order: 'big',
              hierarchy_node_id: '控制台',
              description: '控制指令报文',
              fields: [
                { id: 'cc-field-1', field_name: 'messageId1', type: 'MessageId', byte_length: 2, valid_when: { field: '', value: null } },
                { id: 'cc-field-2', field_name: 'commandType1', type: 'Encode', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'cc-field-3', field_name: 'targetId1', type: 'UnsignedInt', byte_length: 4, valid_when: { field: '', value: null } },
                { id: 'cc-field-4', field_name: 'parameters1', type: 'Array', valid_when: { field: '', value: null }, expanded: true, fields: [] },
              ],
            },
          ],
        },
        {
          id: 'icd-intra-board',
          name: '板内通信协议 (Intra-Board ICD)',
          version: 'v1.0',
          description: '用于板内模块间通信的协议集',
          packetList: [
            {
              id: 'msg-motor-cmd',
              name: 'Motor_Cmd',
              msgId: '0x10',
              version: '1.0',
              default_byte_order: 'little',
              hierarchy_node_id: '电机控制器',
              description: '电机控制指令',
              fields: [
                { id: 'mc-field-1', field_name: 'messageId1', type: 'MessageId', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'mc-field-2', field_name: 'motorId1', type: 'UnsignedInt', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'mc-field-3', field_name: 'torqueValue1', type: 'Float', byte_length: 4, valid_when: { field: '', value: null } },
                { id: 'mc-field-4', field_name: 'speedLimit1', type: 'UnsignedInt', byte_length: 2, valid_when: { field: '', value: null } },
              ],
            },
            {
              id: 'msg-motor-status',
              name: 'Motor_Status',
              msgId: '0x11',
              version: '1.0',
              default_byte_order: 'little',
              hierarchy_node_id: '电机控制器',
              description: '电机状态反馈',
              fields: [
                { id: 'ms-field-1', field_name: 'messageId1', type: 'MessageId', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'ms-field-2', field_name: 'motorId1', type: 'UnsignedInt', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'ms-field-3', field_name: 'status_code', type: 'Encode', byte_length: 1, valid_when: { field: '', value: null } },
                { id: 'ms-field-4', field_name: 'temperature1', type: 'SignedInt', byte_length: 2, valid_when: { field: '', value: null } },
                { id: 'ms-field-5', field_name: 'currentSpeed1', type: 'Float', byte_length: 4, valid_when: { field: '', value: null } },
              ],
            },
          ],
        },
      ];

      // 只在完全未初始化时写入示例数据
      if (!this.initialized || this.bundleList.length === 0) {
        this.bundleList = sampleBundleList;
        this.initialized = true;
        sessionStorage.setItem(INITIALIZATION_KEY, 'true');
        console.log('[ICD Store] 初始化示例数据完成');
      }
    },

    /**
     * 重置初始化状态（用于开发调试或清除数据）
     */
    resetInitialization() {
      this.initialized = false;
      sessionStorage.removeItem(INITIALIZATION_KEY);
      console.log('[ICD Store] 重置初始化状态');
    },

    /**
     * 根据 ID 获取协议集
     */
    getBundleById(bundleId: string): IcdBundle | undefined {
      return this.bundleList.find(b => b.id === bundleId);
    },

    /**
     * 根据 ID 获取报文（跨协议集查找）
     */
    getPacketById(packetId: string): IcdPacket | undefined {
      for (const bundle of this.bundleList) {
        const packet = bundle.packetList.find(p => p.id === packetId);
        if (packet) return packet;
      }
      return undefined;
    },

    /**
     * 根据 ID 获取报文及其所属协议集
     */
    getPacketWithBundle(packetId: string): { packet: IcdPacket; bundle: IcdBundle } | undefined {
      for (const bundle of this.bundleList) {
        const packet = bundle.packetList.find(p => p.id === packetId);
        if (packet) {
          return { packet, bundle };
        }
      }
      return undefined;
    },

    /**
     * 设置当前选中的协议集
     */
    setActiveBundle(bundleId: string | null) {
      this.activeBundleId = bundleId;
      // 自动选中第一个报文
      if (bundleId) {
        const bundle = this.getBundleById(bundleId);
        if (bundle && bundle.packetList.length > 0) {
          this.activePacketId = bundle.packetList[0].id;
        } else {
          this.activePacketId = null;
        }
      } else {
        this.activePacketId = null;
      }
    },

    /**
     * 设置当前选中的报文
     */
    setActivePacket(packetId: string | null) {
      this.activePacketId = packetId;
    },

    /**
     * 添加新协议集
     */
    addBundle(bundle: Omit<IcdBundle, 'id' | 'createdAt' | 'updatedAt'>): IcdBundle {
      const newBundle: IcdBundle = {
        ...bundle,
        id: `icd-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.bundleList.push(newBundle);
      ElMessage.success(`协议集 "${bundle.name}" 已创建`);
      return newBundle;
    },

    /**
     * 更新协议集
     */
    updateBundle(bundleId: string, updates: Partial<IcdBundle>) {
      const index = this.bundleList.findIndex(b => b.id === bundleId);
      if (index > -1) {
        this.bundleList[index] = {
          ...this.bundleList[index],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },

    /**
     * 删除协议集
     */
    deleteBundle(bundleId: string) {
      const index = this.bundleList.findIndex(b => b.id === bundleId);
      if (index > -1) {
        const bundle = this.bundleList[index];
        this.bundleList.splice(index, 1);
        ElMessage.success(`协议集 "${bundle.name}" 已删除`);
        
        // 如果删除的是当前选中的，清空选中状态
        if (this.activeBundleId === bundleId) {
          this.activeBundleId = null;
          this.activePacketId = null;
        }
      }
    },

    /**
     * 在指定协议集中添加报文
     */
    addPacket(bundleId: string, packet: Omit<IcdPacket, 'id' | 'createdAt' | 'updatedAt'>): IcdPacket | undefined {
      const bundle = this.getBundleById(bundleId);
      if (!bundle) {
        ElMessage.error('协议集不存在');
        return undefined;
      }

      const newPacket: IcdPacket = {
        ...packet,
        id: `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      bundle.packetList.push(newPacket);
      bundle.updatedAt = Date.now();
      
      ElMessage.success(`报文 "${packet.name}" 已添加`);
      return newPacket;
    },

    /**
     * 更新报文
     */
    updatePacket(packetId: string, updates: Partial<IcdPacket>) {
      for (const bundle of this.bundleList) {
        const index = bundle.packetList.findIndex(p => p.id === packetId);
        if (index > -1) {
          bundle.packetList[index] = {
            ...bundle.packetList[index],
            ...updates,
            updatedAt: Date.now(),
          };
          bundle.updatedAt = Date.now();
          return;
        }
      }
    },

    /**
     * 删除报文
     */
    deletePacket(packetId: string) {
      for (const bundle of this.bundleList) {
        const index = bundle.packetList.findIndex(p => p.id === packetId);
        if (index > -1) {
          const packet = bundle.packetList[index];
          bundle.packetList.splice(index, 1);
          bundle.updatedAt = Date.now();
          ElMessage.success(`报文 "${packet.name}" 已删除`);
          
          // 如果删除的是当前选中的，清空选中状态
          if (this.activePacketId === packetId) {
            this.activePacketId = null;
          }
          return;
        }
      }
    },

    /**
     * 保存协议集的所有报文（批量更新）
     */
    savePacketList(bundleId: string, packetList: IcdPacket[]) {
      const bundle = this.getBundleById(bundleId);
      if (!bundle) {
        ElMessage.error('协议集不存在');
        return;
      }

      bundle.packetList = packetList.map(p => ({
        ...p,
        updatedAt: Date.now(),
      }));
      bundle.updatedAt = Date.now();

      // 调用后端 API 持久化，待实现
      ElMessage.success('协议集报文定义已保存');
    },

    /**
     * 检查接口引用是否过期
     */
    checkRefOutdated(ref: InterfaceRef): boolean {
      const result = this.getPacketWithBundle(ref.packetId);
      if (!result) return true; // 报文不存在，视为过期
      
      return ref.localVersion !== result.packet.version;
    },

    /**
     * 获取接口引用的最新报文数据
     */
    resolveRef(ref: InterfaceRef): IcdPacket | undefined {
      return this.getPacketById(ref.packetId);
    },
  },

  // 持久化配置（P1-4: 修复状态持久化不一致）
  persist: {
    key: 'icd-store',
    storage: localStorage,
    paths: ['bundleList', 'activeBundleId', 'activePacketId'],
  },
});

