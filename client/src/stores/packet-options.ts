/**
 * 报文配置选项定义
 * 严格遵循协议解析配置JSON文件规范
 */

export interface PacketOption {
  name: string
  type: string
  description: string
  attr: string
  required: boolean
  defaultValue?: any
  options?: Array<{ value: any; label: string }>
}

/**
 * 获取报文配置选项列表
 * @returns {PacketOption[]} 返回报文配置选项数组，包含名称、类型、描述等配置信息
 */
export const packetOptionList: PacketOption[] = [
  { name: 'name', type: 'string', description: '协议名称', attr: '定义协议的唯一名称，用于识别和管理', required: true },
  { name: 'description', type: 'string', description: '描述', attr: '协议的详细说明，用于理解协议的功能和作用', required: false },
  { name: 'version', type: 'string', description: '协议版本', attr: '指定协议的版本号，用于版本控制', required: false, defaultValue: '1.0' },
  { name: 'defaultByteOrder', type: 'string', description: '默认字节序', attr: '指定协议中所有字段的默认字节序。单个字段可以覆写此设置', required: false, defaultValue: 'big', options: [{ value: 'big', label: '大端' }, { value: 'little', label: '小端' }] },
  { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩字符串的算法', required: false, options: [{ value: 'gzip', label: 'gzip' }, { value: 'zlib', label: 'zlib' }] },
  { name: 'fields', type: 'array', description: '字段定义', attr: '一个数组，包含协议中所有顶层字段的详细定义', required: true }
];
