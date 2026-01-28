/**
 * 校验算法参数配置
 * 集中管理所有校验算法的参数定义，方便增删查改
 */

// 参数类型定义
export interface AlgorithmParamDef {
  name: string;           // 参数名（用于存储，如 polynomial）
  label: string;          // 显示名称（如 "多项式"）
  type: 'string' | 'number' | 'boolean' | 'select';  // 参数类型
  defaultValue: string | number | boolean;  // 默认值
  description?: string;   // 参数说明
  options?: { label: string; value: string | number }[];  // select 类型的选项
  placeholder?: string;   // 输入框占位符
}

// 算法参数配置
export interface AlgorithmConfig {
  name: string;           // 算法名称（用于存储）
  label: string;          // 显示名称
  params: AlgorithmParamDef[];  // 参数列表
}

/**
 * 校验算法参数配置表
 * 新增或修改算法参数只需在此处调整
 */
export const checksumAlgorithmParamsConfig: Record<string, AlgorithmConfig> = {
  'crc16-modbus': {
    name: 'crc16-modbus',
    label: 'CRC16-MODBUS',
    params: [
      {
        name: 'polynomial',
        label: '多项式',
        type: 'string',
        defaultValue: '0x8005',
        description: 'CRC多项式值',
        placeholder: '如：0x8005'
      },
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0xFFFF',
        description: 'CRC初始值',
        placeholder: '如：0xFFFF'
      },
      {
        name: 'finalXorValue',
        label: '最终异或值',
        type: 'string',
        defaultValue: '0x0000',
        description: '计算结果的异或值',
        placeholder: '如：0x0000'
      },
      {
        name: 'inputReflected',
        label: '输入反转',
        type: 'boolean',
        defaultValue: true,
        description: '输入字节是否按位反转'
      },
      {
        name: 'outputReflected',
        label: '输出反转',
        type: 'boolean',
        defaultValue: true,
        description: '输出结果是否按位反转'
      }
    ]
  },

  'crc32': {
    name: 'crc32',
    label: 'CRC32',
    params: [
      {
        name: 'polynomial',
        label: '多项式',
        type: 'string',
        defaultValue: '0x04C11DB7',
        description: 'CRC多项式值',
        placeholder: '如：0x04C11DB7'
      },
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0xFFFFFFFF',
        description: 'CRC初始值',
        placeholder: '如：0xFFFFFFFF'
      },
      {
        name: 'finalXorValue',
        label: '最终异或值',
        type: 'string',
        defaultValue: '0xFFFFFFFF',
        description: '计算结果的异或值',
        placeholder: '如：0xFFFFFFFF'
      },
      {
        name: 'inputReflected',
        label: '输入反转',
        type: 'boolean',
        defaultValue: true,
        description: '输入字节是否按位反转'
      },
      {
        name: 'outputReflected',
        label: '输出反转',
        type: 'boolean',
        defaultValue: true,
        description: '输出结果是否按位反转'
      }
    ]
  },

  'crc16-ccitt': {
    name: 'crc16-ccitt',
    label: 'CRC16-CCITT',
    params: [
      {
        name: 'polynomial',
        label: '多项式',
        type: 'string',
        defaultValue: '0x1021',
        description: 'CRC多项式值',
        placeholder: '如：0x1021'
      },
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0xFFFF',
        description: 'CRC初始值',
        placeholder: '如：0xFFFF'
      },
      {
        name: 'finalXorValue',
        label: '最终异或值',
        type: 'string',
        defaultValue: '0x0000',
        description: '计算结果的异或值',
        placeholder: '如：0x0000'
      },
      {
        name: 'inputReflected',
        label: '输入反转',
        type: 'boolean',
        defaultValue: false,
        description: '输入字节是否按位反转'
      },
      {
        name: 'outputReflected',
        label: '输出反转',
        type: 'boolean',
        defaultValue: false,
        description: '输出结果是否按位反转'
      }
    ]
  },

  'crc16-xmodem': {
    name: 'crc16-xmodem',
    label: 'CRC16-XMODEM',
    params: [
      {
        name: 'polynomial',
        label: '多项式',
        type: 'string',
        defaultValue: '0x1021',
        description: 'CRC多项式值',
        placeholder: '如：0x1021'
      },
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0x0000',
        description: 'CRC初始值',
        placeholder: '如：0x0000'
      },
      {
        name: 'finalXorValue',
        label: '最终异或值',
        type: 'string',
        defaultValue: '0x0000',
        description: '计算结果的异或值',
        placeholder: '如：0x0000'
      },
      {
        name: 'inputReflected',
        label: '输入反转',
        type: 'boolean',
        defaultValue: false,
        description: '输入字节是否按位反转'
      },
      {
        name: 'outputReflected',
        label: '输出反转',
        type: 'boolean',
        defaultValue: false,
        description: '输出结果是否按位反转'
      }
    ]
  },

  'sum8': {
    name: 'sum8',
    label: 'SUM8 (8位累加和)',
    params: [
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0x00',
        description: '累加初始值',
        placeholder: '如：0x00'
      },
      {
        name: 'complement',
        label: '取补码',
        type: 'select',
        defaultValue: 'none',
        description: '是否对结果取补码',
        options: [
          { label: '不取补码', value: 'none' },
          { label: '取反 (一补)', value: 'ones' },
          { label: '取补 (二补)', value: 'twos' }
        ]
      }
    ]
  },

  'sum16': {
    name: 'sum16',
    label: 'SUM16 (16位累加和)',
    params: [
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0x0000',
        description: '累加初始值',
        placeholder: '如：0x0000'
      },
      {
        name: 'complement',
        label: '取补码',
        type: 'select',
        defaultValue: 'none',
        description: '是否对结果取补码',
        options: [
          { label: '不取补码', value: 'none' },
          { label: '取反 (一补)', value: 'ones' },
          { label: '取补 (二补)', value: 'twos' }
        ]
      },
      {
        name: 'byteOrder',
        label: '字节序',
        type: 'select',
        defaultValue: 'big',
        description: '多字节数据的字节序',
        options: [
          { label: '大端序 (Big Endian)', value: 'big' },
          { label: '小端序 (Little Endian)', value: 'little' }
        ]
      }
    ]
  },

  'xor': {
    name: 'xor',
    label: 'XOR (异或校验)',
    params: [
      {
        name: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0x00',
        description: '异或初始值',
        placeholder: '如：0x00'
      }
    ]
  },

  'custom': {
    name: 'custom',
    label: '自定义',
    params: [
      {
        name: 'customExpression',
        label: '自定义表达式',
        type: 'string',
        defaultValue: '',
        description: '自定义校验算法表达式',
        placeholder: '输入自定义算法表达式'
      },
      {
        name: 'customDescription',
        label: '算法说明',
        type: 'string',
        defaultValue: '',
        description: '对自定义算法的描述',
        placeholder: '描述您的自定义算法'
      }
    ]
  }
};

/**
 * 根据算法名称获取参数配置
 * @param {string} algorithm - 算法名称
 * @returns {AlgorithmParamDef[]} 参数配置列表，算法不存在时返回空数组
 */
export function getAlgorithmParams(algorithm: string): AlgorithmParamDef[] {
  return checksumAlgorithmParamsConfig[algorithm]?.params || [];
}

/**
 * 根据算法名称获取默认参数值
 * @param {string} algorithm - 算法名称
 * @returns {Record<string, string | number | boolean>} 默认参数值对象，算法不存在时返回空对象
 */
export function getDefaultParams(algorithm: string): Record<string, string | number | boolean> {
  const config = checksumAlgorithmParamsConfig[algorithm];
  if (!config) return {};
  
  const defaults: Record<string, string | number | boolean> = {};
  for (const param of config.params) {
    defaults[param.name] = param.defaultValue;
  }
  return defaults;
}

/**
 * 获取所有算法选项（用于下拉选择）
 * @returns {{ label: string; value: string }[]} 算法选项列表，包含显示标签和值
 */
export function getAlgorithmOptions(): { label: string; value: string }[] {
  return Object.values(checksumAlgorithmParamsConfig).map(config => ({
    label: config.label,
    value: config.name
  }));
}

