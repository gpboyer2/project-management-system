/**
 *
 * 协议解析配置JSON文件字段选项定义
 * 严格遵循协议解析配置JSON文件规范
 * 字段名统一使用 snake_case（与后端保持一致）
 *
 */

export interface FieldOption {
  name: string
  type: string
  description: string
  attr: string
  required: boolean
  default_value?: any
  options?: Array<{ value: any; label: string }>
}

export interface FieldTypeConfig {
  field_name: string
  field_type: string
  field_list: FieldOption[]
  attr: string
  // 图标和颜色配置
  icon: string
  icon_bg_color: string
  icon_color: string
}

// 统一的科技蓝配色方案
const THEME_COLOR = {
  primary: '#2f54eb', // 主色（极客蓝）
  bg: '#f0f5ff',      // 浅色背景
  // 结构类字段稍微深一点，以示区分，但保持同色系
  struct: '#1d39c4',
  struct_bg: '#f0f5ff'
};

export const fieldOptions: Record<string, FieldTypeConfig> = {
  SignedInt: {
    field_name: '有符号整数',
    field_type: 'SignedInt',
    valid_when: {
      fields: "",
      value: null
    },
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义了数据字段在解析和生成代码时所使用的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '指定字段占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_message_id', type: 'boolean', description: '是否为报文标识', attr: '标记该字段是否用作识别不同报文类型的ID', required: false, default_value: false },
      { name: 'display_format', type: 'string', description: '显示格式', attr: '定义了数值在界面上展示时的格式', required: false, default_value: 'decimal', options: [{ value: 'decimal', label: '十进制' }, { value: 'hex', label: '十六进制' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组或字符串是否需要反向处理', required: false, default_value: false },
      { name: 'default_value', type: 'number', description: '默认值', attr: '当数据流中不存在该字段，或在生成数据时提供一个默认值', required: false },
      { name: 'max_value', type: 'number', description: '最大值', attr: '用于数据校验，确保解析出的值不超过此限制', required: false },
      { name: 'min_value', type: 'number', description: '最小值', attr: '用于数据校验，确保解析出的值不低于此限制', required: false },
      { name: 'lsb', type: 'number', description: '量纲', attr: '最小有效位的物理意义，即比例因子。最终值 = 原始值 * lsb', required: false },
      { name: 'unit', type: 'string', description: '单位', attr: '字段的物理单位', required: false },
      { name: 'validation_regex', type: 'string', description: '输入限制表达式', attr: '提供一个正则表达式，用于在用户输入时进行格式验证', required: false, default_value: '^[0-9]+$' },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩整数的可变长度编码算法', required: false, options: [{ value: 'varint', label: 'varint' }] }
    ],
    attr: '有符号整数类型，支持1/2/4/8字节长度',
    icon: 'Stamp',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  UnsignedInt: {
    field_name: '无符号整数',
    field_type: 'UnsignedInt',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义了数据字段在解析和生成代码时所使用的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '指定字段占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_message_id', type: 'boolean', description: '是否为报文标识', attr: '标记该字段是否用作识别不同报文类型的ID', required: false, default_value: false },
      { name: 'display_format', type: 'string', description: '显示格式', attr: '定义了数值在界面上展示时的格式', required: false, default_value: 'decimal', options: [{ value: 'decimal', label: '十进制' }, { value: 'hex', label: '十六进制' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组或字符串是否需要反向处理', required: false, default_value: false },
      { name: 'default_value', type: 'number', description: '默认值', attr: '当数据流中不存在该字段，或在生成数据时提供一个默认值', required: false },
      { name: 'max_value', type: 'number', description: '最大值', attr: '用于数据校验，确保解析出的值不超过此限制', required: false },
      { name: 'min_value', type: 'number', description: '最小值', attr: '用于数据校验，确保解析出的值不低于此限制', required: false },
      { name: 'lsb', type: 'number', description: '量纲', attr: '最小有效位的物理意义，即比例因子。最终值 = 原始值 * lsb', required: false },
      { name: 'unit', type: 'string', description: '单位', attr: '字段的物理单位', required: false },
      { name: 'validation_regex', type: 'string', description: '输入限制表达式', attr: '提供一个正则表达式，用于在用户输入时进行格式验证', required: false, default_value: '^[0-9]+$' },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩整数的可变长度编码算法', required: false, options: [{ value: 'varint', label: 'varint' }] }
    ],
    attr: '无符号整数类型，支持1/2/4/8字节长度',
    icon: 'Plus',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  MessageId: {
    field_name: '报文标识',
    field_type: 'MessageId',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义了数据字段在解析和生成代码时所使用的唯一标识符', required: true, default_value: 'MessageId' },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '指定字段占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'value_type', type: 'string', description: '标识字段的数据类型', attr: '指定报文标识在二进制中的基础表示类型', required: true, options: [{ value: 'UnsignedInt', label: '无符号整数' }, { value: 'SignedInt', label: '有符号整数' }, { value: 'String', label: '字符串' }] },
      { name: 'message_id_value', type: 'any', description: '报文标识值', attr: '该协议对应的唯一标识值，用于分发器识别和路由', required: true },
      { name: 'value_range', type: 'array', description: '取值范围', attr: '用于数据校验，确保解析出的值在指定范围内（仅当value_type为整数类型时有效）', required: false }
    ],
    attr: '报文标识类型，用于标识不同类型报文的专用字段，主要用于协议分发器根据报文类型路由到对应的解析器',
    icon: 'Key',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Float: {
    field_name: '浮点数',
    field_type: 'Float',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'precision', type: 'string', description: '数据精度', attr: '定义浮点数的精度，决定其字节长度', required: true, options: [{ value: 'float', label: 'float (4字节)' }, { value: 'double', label: 'double (8字节)' }] },
      { name: 'default_value', type: 'number', description: '默认值', attr: '在生成报文或解析时缺少字段时使用的默认值', required: false },
      { name: 'max_value', type: 'number', description: '最大值', attr: '用于数据校验，确保值不超过此上限', required: false },
      { name: 'min_value', type: 'number', description: '最小值', attr: '用于数据校验，确保值不低于此下限', required: false },
      { name: 'validation_regex', type: 'string', description: '输入验证', attr: '用于在用户输入时验证格式的正则表达式', required: false, default_value: '^[0-9]+\\.?[0-9]*$' }
    ],
    attr: '浮点数类型，支持float(4字节)和double(8字节)',
    icon: 'PieChart',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Bcd: {
    field_name: 'BCD码',
    field_type: 'Bcd',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '定义BCD码占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组是否需要反向处理', required: false, default_value: false },
      { name: 'default_value', type: 'string', description: '默认值', attr: '在生成报文或解析时缺少字段时使用的默认值', required: false },
      { name: 'max_value', type: 'string', description: '最大值', attr: '用于数据校验，确保值不超过此上限', required: false },
      { name: 'min_value', type: 'string', description: '最小值', attr: '用于数据校验，确保值不低于此下限', required: false },
      { name: 'validation_regex', type: 'string', description: '输入验证', attr: '用于在用户输入时验证格式的正则表达式', required: false, default_value: '^(0|[1-9][0-9]*)$' }
    ],
    attr: 'BCD码类型，用于表示压缩的十进制数',
    icon: 'Grid',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Timestamp: {
    field_name: '时间戳',
    field_type: 'Timestamp',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '定义时间戳占用的字节数，决定了其表示范围', required: true, options: [{ value: 4, label: '4 (32位)' }, { value: 8, label: '8 (64位)' }] },
      { name: 'unit', type: 'string', description: '时间单位', attr: '定义时间戳的单位，与byte_length结合确定时间戳的类型', required: true, options: [{ value: 'seconds', label: '秒' }, { value: 'milliseconds', label: '毫秒' }, { value: 'microseconds', label: '微秒' }, { value: 'nanoseconds', label: '纳秒' }, { value: 'day-milliseconds', label: '当天毫秒数' }, { value: 'day-0.1milliseconds', label: '当天毫秒数×10' }] },
      { name: 'display_format', type: 'string', description: '显示格式', attr: '定义了在解析之后展示的时间格式', required: false, default_value: 'YYYY-MM-DD HH:mm:ss.sss' },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩时间戳的可变长度编码算法', required: false, options: [{ value: 'varint', label: 'varint' }] }
    ],
    attr: '时间戳类型，支持多种时间单位和精度',
    icon: 'Clock',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  String: {
    field_name: '字符串',
    field_type: 'String',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'length', type: 'number', description: '字段长度', attr: '定义字符串占用的字节数。如果为0，表示这是一个变长字符串', required: true },
      { name: 'encoding', type: 'string', description: '编码格式', attr: '定义字符串的编码格式', required: false, options: [{ value: 'ASCII', label: 'ASCII' }, { value: 'UTF-8', label: 'UTF-8' }, { value: 'GBK', label: 'GBK' }] },
      { name: 'default_value', type: 'string', description: '默认值', attr: '当数据流中不存在该字段，或在生成数据时提供一个默认值', required: false },
      { name: 'validation_regex', type: 'string', description: '输入限制表达式', attr: '提供一个正则表达式，用于在用户输入时进行格式验证', required: false },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩字符串的算法', required: false, options: [{ value: 'gzip', label: 'gzip' }, { value: 'zlib', label: 'zlib' }] }
    ],
    attr: '字符串类型，支持定长和变长，多种编码格式',
    icon: 'Document',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Bitfield: {
    field_name: '位域',
    field_type: 'Bitfield',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '定义位域占用的总字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组是否需要反向处理', required: false, default_value: false },
      { name: 'sub_fields', type: 'array', description: '子字段', attr: '一个数组，定义位域中的每一个位段', required: true }
    ],
    attr: '位域类型，用于将字节拆分为多个位段',
    icon: 'Switch',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Encode: {
    field_name: '编码',
    field_type: 'Encode',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义了数据字段在解析和生成代码时所使用的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'base_type', type: 'string', description: '基础类型', attr: '定义命令字本身的基础整数类型', required: true, options: [{ value: 'signed', label: '有符号' }, { value: 'unsigned', label: '无符号' }] },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '指定字段占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组是否需要反向处理', required: false, default_value: false },
      { name: 'maps', type: 'array', description: '值映射表', attr: '一个数组，用于定义数值与其对应含义的映射关系', required: true }
    ],
    attr: '编码类型，用于定义数值对应特定含义的字段',
    icon: 'Coin',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Struct: {
    field_name: '结构体',
    field_type: 'Struct',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'fields', type: 'array', description: '子字段', attr: '定义结构体内部的字段集合', required: true },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩整个结构体序列化后字节流的算法', required: false, options: [{ value: 'gzip', label: 'gzip' }, { value: 'zlib', label: 'zlib' }] }
    ],
    attr: '结构体类型，用于组织多个字段的容器',
    icon: 'Tickets',
    icon_bg_color: THEME_COLOR.struct_bg,
    icon_color: THEME_COLOR.struct
  },

  Array: {
    field_name: '数组',
    field_type: 'Array',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'count', type: 'number', description: '固定元素个数', attr: '指定数组包含的固定数量的元素', required: false },
      { name: 'count_from_field', type: 'string', description: '从字段获取元素个数', attr: '指定数组的元素数量由报文中另一个字段的值决定', required: false },
      { name: 'bytes_in_trailer', type: 'number', description: '尾部数据长度', attr: '指定数组一直持续到报文末尾，并保留指定字节数作为尾部数据', required: false },
      { name: 'element', type: 'object', description: '元素定义', attr: '定义数组中单个元素的结构', required: true },
      { name: 'compression', type: 'string', description: '压缩算法', attr: '指定用于压缩整个数组序列化后字节流的算法', required: false, options: [{ value: 'gzip', label: 'gzip' }, { value: 'zlib', label: 'zlib' }] }
    ],
    attr: '数组类型，支持定长、变长和尾部填充三种模式',
    icon: 'Memo',
    icon_bg_color: THEME_COLOR.struct_bg,
    icon_color: THEME_COLOR.struct
  },

  Command: {
    field_name: '命令字',
    field_type: 'Command',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'base_type', type: 'string', description: '基础类型', attr: '定义命令字本身的基础整数类型', required: true, options: [{ value: 'signed', label: '有符号' }, { value: 'unsigned', label: '无符号' }] },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '定义命令字占用的字节数', required: true, options: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }] },
      { name: 'is_reversed', type: 'boolean', description: '是否逆序', attr: '指定字节数组是否需要反向处理', required: false, default_value: false },
      { name: 'children', type: 'array', description: '命令分支', attr: '命令字的分支列表，每个分支包含命令值和对应的字段定义', required: false }
    ],
    attr: '命令字类型，根据命令值决定后续数据结构',
    icon: 'Monitor',
    icon_bg_color: THEME_COLOR.struct_bg,
    icon_color: THEME_COLOR.struct
  },

  Padding: {
    field_name: '填充',
    field_type: 'Padding',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '为填充或保留字段提供一个名称，便于识别', required: false },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '按字节定义字段的长度', required: false },
      { name: 'bit_length', type: 'number', description: '位长度', attr: '按位定义字段的长度', required: false },
      { name: 'fill_value', type: 'string', description: '填充值', attr: '在生成报文时用于填充该字段的十六进制值', required: false }
    ],
    attr: '填充类型，用于字节对齐或占位',
    icon: 'Operation',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Reserved: {
    field_name: '保留字',
    field_type: 'Reserved',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '为填充或保留字段提供一个名称，便于识别', required: false },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '按字节定义字段的长度', required: false },
      { name: 'bit_length', type: 'number', description: '位长度', attr: '按位定义字段的长度', required: false },
      { name: 'fill_value', type: 'string', description: '填充值', attr: '在生成报文时用于填充该字段的十六进制值', required: false }
    ],
    attr: '保留字类型，用于预留未来扩展的字段',
    icon: 'Star',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  },

  Checksum: {
    field_name: '校验位',
    field_type: 'Checksum',
    field_list: [
      { name: 'field_name', type: 'string', description: '字段名称', attr: '定义数据字段的唯一标识符', required: true },
      { name: 'description', type: 'string', description: '描述', attr: '字段的详细说明，用于解释其作用和含义', required: false },
      { name: 'algorithm', type: 'string', description: '校验算法', attr: '指定校验和计算所使用的算法', required: true, options: [{ value: 'crc16-modbus', label: 'CRC16-MODBUS' }, { value: 'crc32', label: 'CRC32' }, { value: 'sum8', label: 'SUM8' }, { value: 'custom', label: '自定义' }] },
      { name: 'byte_length', type: 'number', description: '字节长度', attr: '定义校验和字段本身占用的字节数，为0时由算法自动推导', required: true, default_value: 0 },
      { name: 'range_start_ref', type: 'string', description: '校验范围起始引用', attr: '校验范围的起始字段路径，默认为当前结构体的起始位置', required: true, default_value: '' },
      { name: 'range_end_ref', type: 'string', description: '校验范围结束引用', attr: '校验范围的结束字段路径，默认为本字段之前的位置', required: true, default_value: '' },
      { name: 'parameters', type: 'object', description: '算法参数', attr: '包含特定算法所需的参数，如字节序、多项式等', required: false }
    ],
    attr: '校验位类型，用于数据完整性校验',
    icon: 'CircleCheck',
    icon_bg_color: THEME_COLOR.bg,
    icon_color: THEME_COLOR.primary
  }
};
