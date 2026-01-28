/**
 * 报文相关类型定义
 */

/**
 * 报文字段接口
 * 定义报文中单个字段的结构和属性
 */
export interface PacketField {
  id?: string;
  level?: number;
  parent_id?: string;
  expanded?: boolean;
  field_name: string;
  type: string;
  description?: string;
  byte_length?: number;
  default_value?: string | number | boolean | null;
  display_format?: string;
  is_required?: boolean;
  valid_when: { field: string; value: any };
  unit?: string;
  value_range?: Array<{ min: number; max: number }>;
  length?: number | null;
  encoding?: string;
  count?: number | null;
  count_from_field?: string;
  bytes_in_trailer?: number | null;
  element?: PacketField;
  fields?: PacketField[];
  cases?: Record<string, any>;
  algorithm?: string;
  parameters?: Record<string, any>;
  value_type?: string;
  message_id_value?: string | number | null;
  [key: string]: any;
}

/**
 * 报文数据接口
 * 定义完整报文的结构和元数据
 */
export interface PacketData {
  id: number | string;
  name: string;
  version?: string;
  description?: string;
  hierarchy_node_id?: string;
  protocol?: string;
  status?: number;
  field_count?: number;
  default_byte_order?: string;
  struct_alignment?: number | null;
  fields: PacketField[];
}

/**
 * 编辑状态接口
 * 定义报文的不同编辑状态类型
 */
export interface EditStatus {
  HISTORY: 'history';
  READONLY: 'readonly';
  DRAFT: 'draft';
  EDITABLE: 'editable';
}
