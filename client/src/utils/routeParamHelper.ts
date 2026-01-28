/**
 * 路由参数辅助工具
 */

import type { LocationQuery } from 'vue-router';

// 有效编辑器类型
export const VALID_EDITOR_TYPES = ['logic', 'protocol', 'flow', 'hierarchy'] as const;
export type EditorType = typeof VALID_EDITOR_TYPES[number];

// 路由参数映射：每种编辑器类型对应的 ID 参数名
const PARAM_MAP: Record<string, string> = {
  logic: 'systemNodeId',
  protocol: 'protocolAlgorithmId',
  flow: 'logicId',
  hierarchy: 'systemNodeId',
};

/**
 * 从路径获取编辑器类型：/editor/ide/logic -> 'logic'
 */
export function inferEditorTypeFromPath(path: string): string | undefined {
  const match = path.match(/\/editor\/ide\/([^/?]+)/);
  if (match) {
    const type = match[1];
    if (VALID_EDITOR_TYPES.includes(type as EditorType)) {
      return type;
    }
  }
  return undefined;
}

// 从 query 获取编辑器 ID
function getIdFromQuery(type: string, query: LocationQuery): string | undefined {
  const param_name = PARAM_MAP[type];
  if (param_name) {
    return query[param_name] as string | undefined;
  }
  return undefined;
}

/**
 * 解析路由参数
 */
export function parseEditorParams(
  query: LocationQuery,
  path?: string
): { type: string; id: string } | null {
  const type = inferEditorTypeFromPath(path || '');
  if (!type) return null;

  const id = getIdFromQuery(type, query);
  if (!id) return null;

  return { type, id };
}

/**
 * 构建编辑器路径
 */
export function buildEditorPath(type: string): string {
  return `/editor/ide/${type}`;
}

/**
 * 构建 query 参数
 */
export function buildEditorQuery(
  type: string,
  id: string,
  extra_params?: Record<string, any>
): Record<string, string> {
  const param_name = PARAM_MAP[type] || 'id';
  return {
    [param_name]: id,
    ...extra_params,
  };
}

/**
 * 生成 Tab key（用于唯一标识 Tab）
 */
export function buildEditorTabKey(
  path: string,
  query: Record<string, any>
): string {
  if (!query || Object.keys(query).length === 0) {
    return path;
  }

  // 对于逻辑编辑器（通信接口/报文查看），protocolAlgorithmId 仅表示“当前选中报文”的 UI 状态
  // 不应参与 Tab 身份计算，否则会导致：
  // - 初次进入后自动补齐 protocolAlgorithmId 时生成第二个 Tab
  // - 切换选中报文时不断生成新 Tab
  const ignoredKeys = new Set<string>(['tab']);
  if (path.startsWith('/editor/ide/logic')) {
    ignoredKeys.add('protocolAlgorithmId');
  }
  if (path.startsWith('/editor/ide/protocol')) {
    // 协议编辑器内部的 view/rightTab/fieldId/mode 属于 UI 子视图状态
    // 切换这些状态不应产生新 Tab
    ignoredKeys.add('view');
    ignoredKeys.add('rightTab');
    ignoredKeys.add('fieldId');
    ignoredKeys.add('mode');
  }

  const sortedKeys = Object.keys(query).sort();
  const queryParts = sortedKeys
    .filter(key => !ignoredKeys.has(key) && query[key] !== undefined && query[key] !== null)
    .map(key => `${key}=${encodeURIComponent(String(query[key]))}`);

  if (queryParts.length === 0) {
    return path;
  }

  return `${path}?${queryParts.join('&')}`;
}
