/**
 * 字节序相关工具函数
 */

export interface ByteOrderOption {
  value: string;
  label: string;
}

export const byteOrderOptionList: ByteOrderOption[] = [
  { value: 'big', label: '大端 (Big Endian)' },
  { value: 'little', label: '小端 (Little Endian)' }
];

/**
 * 根据字节序值获取对应的标签文本
 * @param value 字节序值（'big' 或 'little'）
 * @returns 对应的标签文本，找不到时返回 '-'
 */
export function getByteOrderLabel(value?: string): string {
  const item = byteOrderOptionList.find(o => o.value === value);
  return item?.label || '-';
}
