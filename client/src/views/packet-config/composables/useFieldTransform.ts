import type { PacketField } from '@/stores/packet-config';

/**
 * 根据JSON规范定义的字段白名单
 * 每种字段类型只保留规范中定义的字段
 * 字段名统一使用 snake_case（与后端保持一致）
 */
const fieldWhitelist: Record<string, string[]> = {
  SignedInt: ['field_name', 'description', 'byte_length', 'valid_when', 'default_value', 'value_range', 'unit'],
  UnsignedInt: ['field_name', 'description', 'byte_length', 'valid_when', 'default_value', 'value_range', 'unit'],
  MessageId: ['field_name', 'description', 'byte_length', 'value_type', 'message_id_value', 'value_range'],
  Float: ['field_name', 'description', 'valid_when', 'precision', 'default_value', 'value_range', 'unit'],
  Bcd: ['field_name', 'description', 'byte_length', 'valid_when', 'default_value', 'value_range'],
  Timestamp: ['field_name', 'description', 'byte_length', 'unit'],
  String: ['field_name', 'description', 'length', 'encoding', 'valid_when', 'default_value'],
  Bitfield: ['field_name', 'description', 'byte_length', 'valid_when', 'sub_fields'],
  Encode: ['field_name', 'description', 'base_type', 'byte_length', 'valid_when', 'maps'],
  Struct: ['field_name', 'description', 'valid_when', 'fields'],
  Array: ['field_name', 'description', 'valid_when', 'count', 'count_from_field', 'bytes_in_trailer', 'element'],
  Command: ['field_name', 'description', 'base_type', 'byte_length', 'valid_when', 'cases'],
  Padding: ['field_name', 'description', 'byte_length', 'bit_length', 'fill_value'],
  Reserved: ['field_name', 'description', 'byte_length', 'bit_length', 'fill_value'],
  Checksum: ['field_name', 'description', 'algorithm', 'byte_length', 'range_start_ref', 'range_end_ref', 'parameters']
};

/**
 * 字段过滤和转换工具
 * 1. 根据字段类型过滤掉废弃字段
 * 2. 将 max_value/min_value 转换为 value_range 格式
 * @param {any} field - 原始字段对象
 * @returns {any} 过滤和转换后的字段对象
 */
const filterAndTransformField = (field: any): any => {
  if (!field || typeof field !== 'object') {
    return field;
  }

  const fieldType = field.type;
  if (!fieldType || !fieldWhitelist[fieldType]) {
    return field;
  }

  const whitelist = fieldWhitelist[fieldType];
  const filteredField: any = {};

  filteredField.type = fieldType;

  if (field.id !== undefined) filteredField.id = field.id;
  if (field.level !== undefined) filteredField.level = field.level;
  if (field.parent_id !== undefined) filteredField.parent_id = field.parent_id;
  if (field.expanded !== undefined) filteredField.expanded = field.expanded;

  for (const key of whitelist) {
    if (key in field) {
      filteredField[key] = field[key];
    }
  }

  // 特殊处理: 将 max_value/min_value 转换为 value_range
  if ((fieldType === 'SignedInt' || fieldType === 'UnsignedInt' || fieldType === 'Float' || fieldType === 'Bcd') &&
      (field.max_value !== undefined || field.min_value !== undefined) &&
      !filteredField.value_range) {
    const hasValidRange = (field.min_value !== undefined && field.min_value !== null && field.min_value !== '') ||
                          (field.max_value !== undefined && field.max_value !== null && field.max_value !== '');
    if (hasValidRange) {
      filteredField.value_range = [{
        min: field.min_value ?? (fieldType === 'Float' ? -Infinity : Number.MIN_SAFE_INTEGER),
        max: field.max_value ?? (fieldType === 'Float' ? Infinity : Number.MAX_SAFE_INTEGER)
      }];
    }
  }

  // 特殊处理：数组类型需要将 fields 转换为 element
  if (fieldType === 'Array') {
    if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
      filteredField.element = filterAndTransformField(field.fields[0]);
    } else if (field.element) {
      filteredField.element = filterAndTransformField(field.element);
    }
    delete filteredField.fields;
  } else if (fieldType === 'Command') {
    if (filteredField.cases && typeof filteredField.cases === 'object') {
      const transformedCases: any = {};
      for (const [key, value] of Object.entries(filteredField.cases)) {
        transformedCases[key] = filterAndTransformField(value);
      }
      filteredField.cases = transformedCases;
    }
    delete filteredField.fields;
  } else {
    if (filteredField.fields && Array.isArray(filteredField.fields)) {
      filteredField.fields = filteredField.fields.map(filterAndTransformField);
    }

    if (filteredField.element) {
      filteredField.element = filterAndTransformField(filteredField.element);
    }
  }

  return filteredField;
};

/**
 * 规范化字段数据类型
 * 确保从后端加载的数据中，数字类型字段是正确的类型而不是字符串
 * @param {PacketField[]} fields - 字段列表
 * @returns {PacketField[]} 规范化后的字段列表
 */
const normalizeFieldTypes = (fields: PacketField[]): PacketField[] => {
  if (!Array.isArray(fields)) return fields;

  return fields.map((field) => {
    const normalized = { ...field };

    if (typeof (field as any).byte_length === 'string') {
      const parsed = parseInt((field as any).byte_length, 10);
      if (!Number.isNaN(parsed)) {
        (normalized as any).byte_length = parsed;
      }
    }

    if (field.type === 'Bitfield' && Array.isArray((field as any).sub_fields)) {
      (normalized as any).sub_fields = (field as any).sub_fields.map((subField: any) => {
        const normalizedSubField = {
          ...subField,
          start_bit: typeof subField.start_bit === 'string' ? parseInt(subField.start_bit) : subField.start_bit,
          end_bit: typeof subField.end_bit === 'string' ? parseInt(subField.end_bit) : subField.end_bit
        };
        if (Array.isArray(subField.maps)) {
          normalizedSubField.maps = subField.maps.map((m: any) => ({
            ...m,
            value: typeof m.value === 'string' ? parseInt(m.value) : m.value
          }));
        }
        return normalizedSubField;
      });
    }

    if (field.type === 'Array') {
      if (typeof (field as any).count === 'string') {
        (normalized as any).count = parseInt((field as any).count) || undefined;
      }
      if (typeof (field as any).bytes_in_trailer === 'string') {
        (normalized as any).bytes_in_trailer = parseInt((field as any).bytes_in_trailer) || undefined;
      }
      if ((field as any).element) {
        (normalized as any).element = normalizeFieldTypes([(field as any).element])[0];
      }
    }

    if (field.type === 'Encode' && Array.isArray((field as any).maps)) {
      (normalized as any).maps = (field as any).maps.map((m: any) => ({
        ...m,
        value: typeof m.value === 'string' ? parseInt(m.value) : m.value
      }));
    }

    if (field.type === 'String' && typeof (field as any).length === 'string') {
      (normalized as any).length = parseInt((field as any).length) || 0;
    }

    if (field.type === 'MessageId' && typeof (field as any).message_id_value === 'string') {
      (normalized as any).message_id_value = parseInt((field as any).message_id_value);
    }

    if ((field as any).valid_when && typeof (field as any).valid_when.value === 'string') {
      (normalized as any).valid_when = {
        ...(field as any).valid_when,
        value: parseInt((field as any).valid_when.value)
      };
    }

    if ((field as any).value_range && Array.isArray((field as any).value_range)) {
      (normalized as any).value_range = (field as any).value_range.map((range: any) => {
        const normalizedRange = { ...range };
        if (field.type === 'SignedInt' || field.type === 'UnsignedInt' || field.type === 'Float') {
          if (typeof range.min === 'string') {
            normalizedRange.min = parseFloat(range.min);
          }
          if (typeof range.max === 'string') {
            normalizedRange.max = parseFloat(range.max);
          }
        }
        return normalizedRange;
      });
    }

    if (field.fields && Array.isArray(field.fields)) {
      normalized.fields = normalizeFieldTypes(field.fields);
    }

    if (field.type === 'Command' && field.cases) {
      normalized.cases = {};
      Object.keys(field.cases).forEach(caseKey => {
        normalized.cases![caseKey] = normalizeFieldTypes([field.cases![caseKey]])[0];
      });
    }

    return normalized;
  });
};

/**
 * 将加载的数据转换为UI格式
 * 主要处理：
 * 1. 将数组的 element 转换为 fields 数组以便UI显示
 * 2. 将命令字的 cases 对象转换为 fields 数组以便UI显示
 * @param {PacketField[]} fields - 字段列表
 * @returns {PacketField[]} 转换后的字段列表
 */
const convertLoadedDataToUIFormat = (fields: PacketField[]): PacketField[] => {
  if (!Array.isArray(fields)) return fields;

  const normalizedFields = normalizeFieldTypes(fields);

  return normalizedFields.map((field) => {
    const convertedField = { ...field };

    if (!convertedField.id) {
      convertedField.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (field.type === 'Array' && (field as any).element) {
      convertedField.fields = [convertLoadedDataToUIFormat([(field as any).element])[0]];
    }

    if (field.type === 'Command' && field.cases && typeof field.cases === 'object') {
      convertedField.fields = Object.entries(field.cases).map(([key, value]) => {
        const caseField = convertLoadedDataToUIFormat([value as PacketField])[0];
        return {
          ...caseField,
          field_name: (caseField as any).field_name || `case_${key.replace(/[^a-zA-Z0-9]/g, '_')}`
        };
      });
    }

    if (field.type === 'Struct' && field.fields && Array.isArray(field.fields)) {
      convertedField.fields = convertLoadedDataToUIFormat(field.fields);
    }

    return convertedField;
  });
};

/**
 * 过滤整个报文数据
 * @param {any} packet - 报文数据对象
 * @returns {any} 过滤后的报文数据
 */
const filterPacketFields = (packet: any): any => {
  if (!packet) return packet;

  const filteredPacket = { ...packet };

  if (filteredPacket.fields && Array.isArray(filteredPacket.fields)) {
    filteredPacket.fields = filteredPacket.fields.map(filterAndTransformField);
  }

  return filteredPacket;
};

/**
 * 根据字段类型获取可选的字节长度列表
 * @param {string} fieldType - 字段类型
 * @returns {number[] | null} 可选字节长度数组，null表示不限制
 */
function getByteLengthOptions(fieldType: string): number[] | null {
  switch (fieldType) {
    case 'SignedInt':
    case 'UnsignedInt':
    case 'MessageId':
    case 'Bcd':
    case 'Encode':
    case 'Command':
      return [1, 2, 4, 8];
    case 'Timestamp':
      return [4, 8];
    case 'Bitfield':
    case 'Checksum':
    case 'Padding':
    case 'Reserved':
      return null;
    case 'String':
      return [];
    default:
      return [];
  }
}

/**
 * 判断字段类型是否需要显示 length 字段（字符串长度）
 * @param {string} fieldType - 字段类型
 * @returns {boolean} 是否需要显示 length 字段
 */
function needsLengthField(fieldType: string): boolean {
  return fieldType === 'String';
}

/**
 * 判断字段类型是否需要在中间表格显示字节长度
 * @param {string} fieldType - 字段类型
 * @returns {boolean} 是否需要在表格中显示字节长度
 */
function showByteLengthInTable(fieldType: string): boolean {
  return fieldType !== 'Command';
}

/**
 * 字段转换组合函数
 * 提供字段数据的过滤、转换、规范化等功能
 * @returns {Object} 包含字段转换工具函数的对象
 */
export function useFieldTransform() {
  return {
    filterAndTransformField,
    normalizeFieldTypes,
    convertLoadedDataToUIFormat,
    filterPacketFields,
    getByteLengthOptions,
    needsLengthField,
    showByteLengthInTable,
  };
}
