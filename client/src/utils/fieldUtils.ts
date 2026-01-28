/**
 * 字段处理工具函数
 * 提供字段数据的构建、转换等功能
 */
import type { PacketData, PacketField } from '@/views/ide/components/protocol-interface/types';

/**
 * 递归构建保存时的字段数据
 * 删除UI专用字段（isPlaceholder、parentId），处理不同类型的字段结构
 *
 * @param field - 字段数据
 * @returns 保存用的字段数据
 */
export function build_field_for_save(field: PacketField): any {
  const result: any = Object.assign({}, field);

  // 删除UI专用字段
  delete result.isPlaceholder;
  delete result.parentId;

  // Struct 类型：递归处理所有子字段
  if (result.type === 'Struct') {
    if (Array.isArray(result.fields)) {
      result.fields = result.fields.map((f: PacketField) => build_field_for_save(f));
    }
    return result;
  }

  // Array 类型：将 fields[0] 转换为 element
  if (result.type === 'Array') {
    const element_field = Array.isArray(result.fields) && result.fields.length > 0 ? result.fields[0] : result.element;
    if (element_field) {
      result.element = build_field_for_save(element_field);
    }
    delete result.fields;
    return result;
  }

  // Command 类型：处理 cases 分支
  if (result.type === 'Command') {
    const cases_obj = result.cases && typeof result.cases === 'object' ? result.cases : {};
    const current_child_list: PacketField[] = Array.isArray(result.fields) ? result.fields : [];
    const child_by_id = new Map<string, PacketField>();
    for (const c of current_child_list) {
      if (c && c.id) child_by_id.set(String(c.id), c);
    }

    const new_cases: any = {};
    for (const [k, v] of Object.entries(cases_obj)) {
      const vv: any = v;
      const v_id = vv && vv.id ? String(vv.id) : '';
      const merged_field = v_id && child_by_id.has(v_id) ? child_by_id.get(v_id) : (vv as PacketField);
      if (merged_field) {
        new_cases[k] = build_field_for_save(merged_field);
      }
    }
    result.cases = new_cases;
    delete result.fields;
    return result;
  }

  // 通用处理：递归处理嵌套字段
  if (result.element) {
    result.element = build_field_for_save(result.element);
  }
  if (result.cases && typeof result.cases === 'object') {
    const new_cases: any = {};
    for (const [k, v] of Object.entries(result.cases)) {
      new_cases[k] = build_field_for_save(v as any);
    }
    result.cases = new_cases;
  }
  if (Array.isArray(result.fields)) {
    result.fields = result.fields.map((f: PacketField) => build_field_for_save(f));
  }
  return result;
}

/**
 * 构建保存时的报文数据
 * 统计字段数量并递归处理所有字段
 *
 * @param packet - 报文数据
 * @returns 保存用的报文数据
 */
export function build_packet_for_save(packet: PacketData): any {
  const result: any = Object.assign({}, packet);
  const root_field_list = Array.isArray(packet.fields) ? packet.fields : [];
  result.field_count = root_field_list.length;
  result.fields = root_field_list.map((f: PacketField) => build_field_for_save(f));
  return result;
}

/**
 * 转换后端数据到UI格式
 * 为字段生成唯一ID，将后端数据结构转换为UI组件使用的格式
 *
 * @param field_list - 字段列表
 * @returns UI格式的字段列表
 */
export function convert_loaded_data_to_ui_format(field_list: PacketField[]): PacketField[] {
  if (!Array.isArray(field_list)) return field_list;
  return field_list.map((field) => {
    const converted_field: any = Object.assign({}, field);

    // 确保每个字段都有唯一ID
    if (!converted_field.id) {
      converted_field.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Array 类型：将 element 转换为 fields[0]
    if (converted_field.type === 'Array' && converted_field.element) {
      converted_field.fields = [convert_loaded_data_to_ui_format([converted_field.element])[0]];
    }

    // Command 类型：将 cases 转换为 fields 数组
    if (converted_field.type === 'Command' && converted_field.cases && typeof converted_field.cases === 'object') {
      const case_list = Object.values(converted_field.cases).map((v: any) => convert_loaded_data_to_ui_format([v])[0]);
      converted_field.fields = case_list;
    }

    // Struct 类型：递归处理所有子字段
    if (converted_field.type === 'Struct' && Array.isArray(converted_field.fields)) {
      converted_field.fields = convert_loaded_data_to_ui_format(converted_field.fields);
    }

    return converted_field as PacketField;
  });
}
