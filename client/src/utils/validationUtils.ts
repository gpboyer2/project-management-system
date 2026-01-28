/**
 * 验证工具函数集合
 * 用于各类数据验证和格式校验
 */

/**
 * 解析数字ID，仅接受纯数字字符串
 * @param rawValue 原始值
 * @param fieldName 字段名称（用于错误提示）
 * @returns 有效的数字ID字符串，验证失败返回 undefined
 */
export function resolve_numeric_id(rawValue: any): string | undefined {
  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  const str_value = String(rawValue).trim();

  // 验证是否为纯数字（不允许前导零，除非是 "0" 本身）
  if (!/^\d+$/.test(str_value)) {
    return undefined;
  }

  // 排除前导零的情况（如 "00123"）
  if (str_value.length > 1 && str_value.startsWith('0')) {
    return undefined;
  }

  return str_value;
}

/**
 * 验证字段名称
 * @param name 字段名称
 * @returns 验证结果对象
 */
export function validate_field_name(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '字段名称不能为空' };
  }

  const trimmed_name = name.trim();

  // 验证长度（1-128字符）
  if (trimmed_name.length > 128) {
    return { valid: false, error: '字段名称长度不能超过128个字符' };
  }

  // 验证格式（只允许字母、数字、下划线、中划线、中文）
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(trimmed_name)) {
    return { valid: false, error: '字段名称只能包含字母、数字、下划线、中划线和中文' };
  }

  // 验证首字符（不能以数字或特殊字符开头）
  if (!/^[\u4e00-\u9fa5a-zA-Z_]/.test(trimmed_name)) {
    return { valid: false, error: '字段名称必须以字母、下划线或中文开头' };
  }

  return { valid: true };
}

/**
 * 验证必填项
 * @param value 待验证值
 * @param fieldName 字段名称（用于错误提示）
 * @returns 是否通过验证
 */
export function validate_required(value: any): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return false;
  }

  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  return true;
}

/**
 * 验证数值范围
 * @param value 待验证数值
 * @param min 最小值（可选）
 * @param max 最大值（可选）
 * @returns 是否通过验证
 */
export function validate_numeric_range(value: number, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }

  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined && value > max) {
    return false;
  }

  return true;
}
