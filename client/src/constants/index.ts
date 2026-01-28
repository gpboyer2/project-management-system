/**
 * 全局常量库统一入口
 * 集中导出所有全局常量
 */

export * from './messages';
export * from './ui-labels';
export * from './empty-states';
export * from './tooltips';
export * from './field-types';

// IDE 特有常量（从 views/ide/constants 重新导出，方便全局使用）
export { UI_SIZE } from '@/views/ide/constants';
