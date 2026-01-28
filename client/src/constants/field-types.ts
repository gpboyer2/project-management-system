/**
 * 字段类型常量定义
 */

/**
 * 字段类型显示顺序（用于界面展示时的排序）
 */
export const FIELD_TYPE_ORDER = [
  'UnsignedInt',
  'SignedInt',
  'Float',
  'String',
  'Bcd',
  'Timestamp',
  'Bitfield',
  'Encode',
  'Array',
  'Struct',
  'MessageId',
  'Command',
  'Checksum',
  'Padding',
  'Reserved',
] as const;

/**
 * 字段类型到英文字段名的映射（用于API请求/响应）
 */
export const FIELD_TYPE_TO_ENGLISH = {
  SignedInt: 'signedInt',
  UnsignedInt: 'unsignedInt',
  Float: 'float',
  String: 'string',
  Bcd: 'bcd',
  Timestamp: 'timestamp',
  Bitfield: 'bitfield',
  Encode: 'encode',
  Array: 'array',
  Struct: 'struct',
  MessageId: 'messageId',
  Command: 'command',
  Checksum: 'checksum',
  Padding: 'padding',
  Reserved: 'reserved',
} as const;

/**
 * 英文字段名到字段类型的反向映射（用于解析API响应）
 */
export const ENGLISH_TO_FIELD_TYPE = {
  signedInt: 'SignedInt',
  unsignedInt: 'UnsignedInt',
  float: 'Float',
  string: 'String',
  bcd: 'Bcd',
  timestamp: 'Timestamp',
  bitfield: 'Bitfield',
  encode: 'Encode',
  array: 'Array',
  struct: 'Struct',
  messageId: 'MessageId',
  command: 'Command',
  checksum: 'Checksum',
  padding: 'Padding',
  reserved: 'Reserved',
} as const;

/**
 * 字段类型定义
 */
export type FieldType = (typeof FIELD_TYPE_ORDER)[number];

/**
 * 英文字段类型定义
 */
export type EnglishFieldType = keyof typeof ENGLISH_TO_FIELD_TYPE;
