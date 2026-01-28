import type { PacketField } from '@/stores/packet-config';

export interface ValidationError {
  field_name: string;
  fieldType: string;
  missingFields: string[];
  path: string;
}

/**
 * 校验字段必填项
 * 根据协议规范检查每个字段的必填属性是否已填写
 * @param {PacketField[]} fields - 字段列表
 * @param {string} parentPath - 父字段路径
 * @returns {ValidationError[]} 校验错误列表
 */
const validateFields = (fields: PacketField[], parentPath: string = ''): ValidationError[] => {
  const errorList: ValidationError[] = [];

  if (!Array.isArray(fields)) return errorList;

  fields.forEach((field, index) => {
    const field_name = (field as any).field_name;
    const currentPath = parentPath ? `${parentPath}.${field_name || `[${index}]`}` : (field_name || `[${index}]`);
    const missingFields: string[] = [];

    // 通用必填项：field_name（除了 Padding/Reserved）
    if (!['Padding', 'Reserved'].includes(field.type) && !field_name) {
      missingFields.push('字段名称(field_name)');
    }

    // 根据字段类型检查特定必填项
    switch (field.type) {
      case 'SignedInt':
      case 'UnsignedInt':
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if ((field as any).default_value !== undefined && (field as any).default_value !== null && (field as any).default_value !== '' && typeof (field as any).default_value !== 'number') {
          missingFields.push('默认值必须为数字');
        }
        break;

      case 'MessageId':
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if (!(field as any).value_type) {
          missingFields.push('数据类型(value_type)');
        }
        if ((field as any).message_id_value === undefined || (field as any).message_id_value === null) {
          missingFields.push('报文标识值(message_id_value)');
        }
        break;

      case 'Float':
        if (!(field as any).precision) {
          missingFields.push('数据精度(precision)');
        }
        if ((field as any).default_value !== undefined && (field as any).default_value !== null && (field as any).default_value !== '' && typeof (field as any).default_value !== 'number') {
          missingFields.push('默认值必须为数字');
        }
        break;

      case 'Bcd':
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if ((field as any).default_value !== undefined && (field as any).default_value !== null && typeof (field as any).default_value !== 'string') {
          missingFields.push('默认值必须为字符串');
        }
        break;

      case 'Timestamp':
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if (!(field as any).unit) {
          missingFields.push('时间单位(unit)');
        }
        break;

      case 'String':
        if ((field as any).length === undefined || (field as any).length === null) {
          missingFields.push('字段长度(length)');
        }
        break;

      case 'Bitfield':
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if (!(field as any).sub_fields || !Array.isArray((field as any).sub_fields) || (field as any).sub_fields.length === 0) {
          missingFields.push('子字段(sub_fields)');
        } else {
          (field as any).sub_fields.forEach((subField: any, subIdx: number) => {
            const subMissing: string[] = [];
            if (!subField.name) subMissing.push('name');
            if (subField.start_bit === undefined || subField.start_bit === null) subMissing.push('start_bit');
            if (subField.end_bit === undefined || subField.end_bit === null) subMissing.push('end_bit');
            if (subMissing.length > 0) {
              errorList.push({
                field_name: subField.name || `sub_fields[${subIdx}]`,
                fieldType: 'Bitfield.subField',
                missingFields: subMissing,
                path: `${currentPath}.sub_fields[${subIdx}]`
              });
            }
          });
        }
        break;

      case 'Encode':
        if (!(field as any).base_type) {
          missingFields.push('基础类型(base_type)');
        }
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if (!(field as any).maps || !Array.isArray((field as any).maps) || (field as any).maps.length === 0) {
          missingFields.push('值映射表(maps)');
        }
        break;

      case 'Struct':
        if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
          missingFields.push('子字段(fields)');
        } else {
          const childErrors = validateFields(field.fields, currentPath);
          errorList.push(...childErrors);
        }
        break;

      case 'Array': {
        const hasCount = (field as any).count !== undefined && (field as any).count !== null;
        const hasCountFromField = !!(field as any).count_from_field;
        const hasBytesInTrailer = (field as any).bytes_in_trailer !== undefined && (field as any).bytes_in_trailer !== null;
        const selectedCount = [hasCount, hasCountFromField, hasBytesInTrailer].filter(Boolean).length;
        if (selectedCount === 0) {
          missingFields.push('长度定义(count/count_from_field/bytes_in_trailer 必须选择一个)');
        } else if (selectedCount > 1) {
          missingFields.push('长度定义冲突(count/count_from_field/bytes_in_trailer 只能选择一个)');
        }
        if (!(field as any).element && (!field.fields || field.fields.length === 0)) {
          missingFields.push('元素定义(element)');
        }
        if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
          const childErrors = validateFields(field.fields, `${currentPath}.element`);
          errorList.push(...childErrors);
        }
        break;
      }

      case 'Command':
        if (!(field as any).base_type) {
          missingFields.push('基础类型(base_type)');
        }
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        if (!field.cases || Object.keys(field.cases).length === 0) {
          missingFields.push('分支定义(cases)');
        } else {
          Object.entries(field.cases).forEach(([caseKey, caseValue]: [string, any]) => {
            if (caseValue && caseValue.fields) {
              const childErrors = validateFields(caseValue.fields, `${currentPath}.cases[${caseKey}]`);
              errorList.push(...childErrors);
            }
          });
        }
        break;

      case 'Padding':
      case 'Reserved': {
        const hasByteLength = (field as any).byte_length !== undefined && (field as any).byte_length !== null;
        const hasBitLength = (field as any).bit_length !== undefined && (field as any).bit_length !== null;
        if (!hasByteLength && !hasBitLength) {
          missingFields.push('长度定义(byte_length/bit_length 二选一)');
        }
        break;
      }

      case 'Checksum':
        if (!(field as any).algorithm) {
          missingFields.push('校验算法(algorithm)');
        }
        if ((field as any).byte_length === undefined || (field as any).byte_length === null) {
          missingFields.push('字节长度(byte_length)');
        }
        break;
    }

    // 验证有效性条件
    if ((field as any).valid_when) {
      const fieldRef = (field as any).valid_when.field;
      const valueRef = (field as any).valid_when.value;
      const hasField = typeof fieldRef === 'string' && fieldRef.trim() !== '';
      const hasValue = valueRef !== undefined && valueRef !== null && valueRef !== '' &&
        !(typeof valueRef === 'number' && Number.isNaN(valueRef));

      if (hasField && !hasValue) {
        missingFields.push('有效性条件的引用字段值(valid_when.value)');
      }
      if (hasValue && !hasField) {
        missingFields.push('有效性条件的引用字段名称(valid_when.field)');
      }
    }

    if (missingFields.length > 0) {
      errorList.push({
        field_name: field_name || `[${index}]`,
        fieldType: field.type,
        missingFields,
        path: currentPath
      });
    }
  });

  return errorList;
};

/**
 * 格式化校验错误信息
 * @param {ValidationError[]} errors - 校验错误列表
 * @returns {string} 格式化后的错误信息字符串
 */
const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';

  const lines = errors.map(err => {
    const location = err.path || err.field_name;
    return `• ${location} (${err.fieldType}): 缺少 ${err.missingFields.join(', ')}`;
  });

  return lines.join('\n');
};

/**
 * 字段校验组合函数
 * 提供字段必填项校验和错误格式化功能
 * @returns {Object} 包含校验函数和类型定义的对象
 */
export function useFieldValidation() {
  return {
    validateFields,
    formatValidationErrors,
    ValidationError,
  };
}
