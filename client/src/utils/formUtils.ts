/**
 * 表单工具函数集
 * 用于动态表单数据的初始化、构建和重置
 */

/**
 * 字段配置类型定义
 */
interface FieldConfig {
  name: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
}

/**
 * 初始化动态表单数据
 *
 * @param field_list - 字段配置列表
 * @param data_source - 数据源对象
 * @param properties_fallback - 是否使用 properties 作为回退数据源，默认 false
 * @returns 初始化后的表单数据对象
 *
 * @example
 * const fields = [
 *   { name: 'username', type: 'string', required: true },
 *   { name: 'age', type: 'number', required: false }
 * ];
 * const source = { username: 'admin', age: 25 };
 * const form_data = init_dynamic_form_data(fields, source);
 * // 返回值: { username: 'admin', age: 25 }
 */
export function init_dynamic_form_data(
  field_list: Array<FieldConfig>,
  data_source: Record<string, any>,
  properties_fallback?: boolean
): Record<string, any> {
  const form_data: Record<string, any> = {};

  // 处理 properties 回退逻辑
  const source = properties_fallback && data_source.properties
    ? { ...data_source, ...data_source.properties }
    : data_source;

  for (const field of field_list) {
    const { name, type } = field;

    // 从数据源获取值，如果不存在则根据类型提供默认值
    if (source[name] !== undefined) {
      form_data[name] = source[name];
    } else {
      // 根据字段类型设置默认值
      switch (type) {
        case 'string':
        case 'text':
          form_data[name] = '';
          break;
        case 'number':
        case 'integer':
        case 'float':
          form_data[name] = 0;
          break;
        case 'boolean':
          form_data[name] = false;
          break;
        case 'array':
          form_data[name] = [];
          break;
        case 'object':
          form_data[name] = {};
          break;
        default:
          form_data[name] = undefined;
      }
    }
  }

  return form_data;
}

/**
 * 从数据源构建表单数据
 *
 * @param source - 数据源对象
 * @param field_names - 需要提取的字段名列表
 * @returns 包含指定字段的表单数据对象
 *
 * @example
 * const source = { username: 'admin', age: 25, email: 'admin@example.com' };
 * const fields = ['username', 'email'];
 * const form_data = build_form_data_from_source(source, fields);
 * // 返回值: { username: 'admin', email: 'admin@example.com' }
 */
export function build_form_data_from_source(
  source: Record<string, any>,
  field_names: string[]
): Record<string, any> {
  const form_data: Record<string, any> = {};

  for (const field_name of field_names) {
    if (source[field_name] !== undefined) {
      form_data[field_name] = source[field_name];
    }
  }

  return form_data;
}

/**
 * 重置表单数据到初始状态
 *
 * @param initial_data - 初始数据对象
 * @returns 重置后的表单数据对象（深拷贝）
 *
 * @example
 * const initial = { username: 'admin', age: 25 };
 * const modified = { username: 'admin', age: 30 };
 * const reset = reset_form_data(initial);
 * // 返回值: { username: 'admin', age: 25 }
 */
export function reset_form_data(initial_data: Record<string, any>): Record<string, any> {
  return JSON.parse(JSON.stringify(initial_data));
}
