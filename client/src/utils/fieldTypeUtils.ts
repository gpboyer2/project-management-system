/**
 * 字段类型工具函数
 * 提供字段类型的判断、选项获取、过滤转换等功能
 */

// ==================== 字段类型判断 ====================

/**
 * 判断字段类型是否在表格中显示字节长度
 */
export function showByteLengthInTable(type?: string): boolean {
  return !['Command'].includes(type || '');
}

/**
 * 判断字段类型是否需要长度字段
 */
export function needsLengthField(type?: string): boolean {
  return type === 'String';
}

/**
 * 获取字段类型的字节长度选项
 */
export function getByteLengthOptions(type?: string): number[] | null {
  switch (type) {
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
 * 获取字段的显示字节长度
 */
export function getDisplayByteLength(field: any): string {
  if (!showByteLengthInTable(field.type)) return '-';
  if (needsLengthField(field.type)) {
    return field.length ? `${field.length}` : '变长';
  }
  return field.byte_length ? `${field.byte_length}` : '-';
}

// ==================== 字段白名单配置 ====================

export const fieldWhitelist: Record<string, string[]> = {
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

// ==================== 字段过滤和转换 ====================

/**
 * 根据字段类型白名单过滤和转换字段
 */
export function filterAndTransformField(field: any): any {
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
}

/**
 * 过滤报文的字段列表
 */
export function filterPacketFields(packetData: any): any {
  if (!packetData || typeof packetData !== 'object') {
    return packetData;
  }

  const result: any = { ...packetData };

  if (result.fields && Array.isArray(result.fields)) {
    result.fields = result.fields.map(filterAndTransformField);
  }

  return result;
}

// ==================== 数据规范化 ====================

/**
 * 规范化字段类型数据（确保数值类型正确）
 */
export function normalizeFieldTypes(field: any): any {
  if (!field || typeof field !== 'object') {
    return field;
  }

  const result = { ...field };

  if (field.byte_length !== undefined && field.byte_length !== null) {
    result.byte_length = Number(field.byte_length);
  }
  if (field.length !== undefined && field.length !== null) {
    result.length = Number(field.length);
  }
  if (field.count !== undefined && field.count !== null) {
    result.count = Number(field.count);
  }

  if (field.fields && Array.isArray(field.fields)) {
    result.fields = field.fields.map(normalizeFieldTypes);
  }
  if (field.element) {
    result.element = normalizeFieldTypes(field.element);
  }
  if (field.cases && typeof field.cases === 'object') {
    const normalizedCases: any = {};
    for (const [key, value] of Object.entries(field.cases)) {
      normalizedCases[key] = normalizeFieldTypes(value);
    }
    result.cases = normalizedCases;
  }

  return result;
}

// ==================== UI 格式转换 ====================

/**
 * 将加载的数据转换为 UI 格式（element 转为 fields）
 */
export function convertLoadedDataToUIFormat(fieldList: any[]): any[] {
  if (!Array.isArray(fieldList)) return fieldList;

  return fieldList.map((field) => {
    const convertedField = { ...field };

    if (convertedField.type === 'Array' && convertedField.element) {
      convertedField.fields = [convertLoadedDataToUIFormat([convertedField.element])[0]];
      delete convertedField.element;
    }

    if (convertedField.type === 'Command' && convertedField.cases && typeof convertedField.cases === 'object') {
      const caseList = Object.values(convertedField.cases).map((v: any) =>
        convertLoadedDataToUIFormat([v])[0]
      );
      convertedField.fields = caseList;
    }

    if (convertedField.type === 'Struct' && Array.isArray(convertedField.fields)) {
      convertedField.fields = convertLoadedDataToUIFormat(convertedField.fields);
    }

    return convertedField;
  });
}
