/**
 *
 * 类型定义
 *
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
  valid_when: {
    field: string;
    value: any;
  };
  unit?: string;
  value_range?: Array<{ min: number; max: number }>;
  length?: number;
  encoding?: string;
  count?: number;
  count_from_field?: string;
  bytes_in_trailer?: number;
  element?: PacketField;
  fields?: PacketField[];
  cases?: Record<string, any>;
  algorithm?: string;
  parameters?: Record<string, any>;
  value_type?: string;
  message_id_value?: string | number | null;
  message_id?: string;
  publish_status?: number;
  [key: string]: any;
}

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
  direction?: 'input' | 'output';
  fields: PacketField[];
}

export type EditStatus = 'history' | 'readonly' | 'draft' | 'editable';
