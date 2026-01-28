/**
 * 版本管理工具函数
 * 提供版本比较、过期检测等通用版本管理功能
 */

// ========== 版本信息类型定义 ==========
export interface VersionInfo {
  id: number;
  version: string;
}

/**
 * 版本列表项类型定义（来自API响应）
 */
export type VersionListItem = {
  id: number;
  version: string;
  publish_status: number;
  [key: string]: any;
};

/**
 * 解析版本号对象
 */
export interface ParsedVersion {
  major: number;
  minor: number;
}

/**
 * 解析版本号 (格式: "major.minor", 如 "1.0")
 * @param versionText - 版本号字符串
 * @returns 包含 major 和 minor 的对象，无效格式返回 { major: 0, minor: 0 }
 */
export function parseVersion(versionText: string | number | undefined | null): ParsedVersion {
  const v = String(versionText || '').trim();
  const versionRegex = /^(\d+)\.(\d+)$/;
  const match = v.match(versionRegex);

  if (!match) {
    console.warn(`[parseVersion] 无效的版本号格式: ${v}, 默认返回 0.0`);
    return { major: 0, minor: 0 };
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);

  return {
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0
  };
}

/**
 * 比较两个版本号
 * @param version1 - 版本号1
 * @param version2 - 版本号2
 * @returns 负数表示 version1 < version2，0 表示相等，正数表示 version1 > version2
 */
export function compareVersions(version1: string, version2: string): number {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }
  return v1.minor - v2.minor;
}

/**
 * 确保获取最新已发布版本信息
 *
 * @param key - 唯一键（通常为 message_id）
 * @param getVersionList - 获取版本列表的异步函数
 * @param cache - 版本信息缓存对象（按 key 存储最新版本）
 *
 * @returns Promise<void>
 *
 * 功能说明：
 * - 如果缓存中已存在对应 key 的最新版本信息，直接返回
 * - 调用 getVersionList 获取版本列表
 * - 从已发布版本（publish_status === 1）中找到最高版本号
 * - 将最高版本信息存入缓存
 *
 * 版本比较规则：
 * - 使用 major.minor 格式（如 "1.0"）
 * - 先比较 major，再比较 minor
 * - 更高版本号的会被选中
 */
export async function ensureLatestPublishedInfo(
  key: string,
  getVersionList: (key: string) => Promise<any>,
  cache: Record<string, VersionInfo>
): Promise<void> {
  const normalized_key = String(key || '').trim();
  if (!normalized_key) return;
  if (cache[normalized_key]) return;

  try {
    const res = await getVersionList(normalized_key);
    if (res?.status !== 'success') return;

    const version_list = Array.isArray(res.datum) ? res.datum : (res.datum?.list || []);
    if (!Array.isArray(version_list) || version_list.length === 0) return;

    let best: VersionListItem | null = null;
    for (const v of version_list) {
      if (!v || v.publish_status !== 1) continue;

      const cur = best ? parseVersion(best.version) : { major: -1, minor: -1 };
      const next = parseVersion(v.version);

      if (
        !best ||
        next.major > cur.major ||
        (next.major === cur.major && next.minor > cur.minor)
      ) {
        best = v;
      }
    }

    if (best && best.id) {
      cache[normalized_key] = {
        id: Number(best.id),
        version: String(best.version || '')
      };
    }
  } catch (e) {
    // 保持静默，避免抛出异常
  }
}

/**
 * 判断资源是否过期
 *
 * @param resource - 资源对象（需要包含 id 和 message_id）
 * @param cache - 版本信息缓存对象
 * @param shouldCheck - 是否需要检查过期（条件判断）
 * @returns 是否过期
 *
 * 功能说明：
 * - 如果 shouldCheck 为 false，直接返回 false（未过期）
 * - 如果 resource 为空，返回 false（未过期）
 * - 从 cache 中获取对应 message_id 的最新版本信息
 * - 比较 resource.id 与最新版本 id，不相等则表示过期
 *
 * 使用场景：
 * - 检测报文定义是否有新版本发布
 * - 检测协议接口是否有更新版本
 * - 通用的基于 ID 比对的过期检测
 */
export function isResourceOutdated<T extends { id?: number | string; message_id?: any }>(
  resource: T | null,
  cache: Record<string, VersionInfo>,
  shouldCheck: boolean
): boolean {
  if (!shouldCheck) return false;
  if (!resource) return false;

  const message_id = String((resource as any)?.message_id || '').trim();
  if (!message_id) return false;

  const latest = cache[message_id];
  if (!latest || !latest.id) return false;

  const current_id = typeof resource.id === 'number' ? resource.id : Number(resource.id);
  return Number.isFinite(current_id) && current_id > 0 ? latest.id !== current_id : false;
}
