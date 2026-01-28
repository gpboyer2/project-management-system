// 编辑器数据缓存工具
// 用于缓存已加载的数据，避免重复请求

// 缓存项接口
interface CacheItem {
  data: any;
  timestamp: number;
  version?: string;  // 数据版本，用于验证
}

// 缓存配置接口
interface CacheConfig {
  ttl: number;  // 缓存过期时间（毫秒）
}

// 各类型缓存配置（根据数据更新频率设置不同的 TTL）
const CACHE_CONFIG: Record<string, CacheConfig> = {
  // 列表数据：短缓存（2 分钟）
  list: { ttl: 2 * 60 * 1000 },
  // 节点数据：中等缓存（3 分钟）
  node: { ttl: 3 * 60 * 1000 },
  // 逻辑数据：中等缓存（3 分钟）
  logic: { ttl: 3 * 60 * 1000 },
  // 协议数据：较长缓存（5 分钟）
  protocol: { ttl: 5 * 60 * 1000 },
  // 仪表板数据：短缓存（1 分钟）
  dashboard: { ttl: 1 * 60 * 1000 },
};

class EditorCache {
  private cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 3 * 60 * 1000; // 默认 3 分钟

  /**
   * 获取类型的 TTL 配置
   * @param {string} type - 数据类型
   * @returns {number} 该类型的缓存过期时间（毫秒）
   */
  private getTTL(type: string): number {
    return CACHE_CONFIG[type]?.ttl || this.DEFAULT_TTL;
  }

  /**
   * 生成缓存 key
   * @param {string} type - 数据类型
   * @param {string} id - 数据 ID
   * @returns {string} 组合后的缓存键
   */
  private getKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  /**
   * 获取缓存数据
   * @param {string} type - 数据类型
   * @param {string} id - 数据 ID
   * @param {string} [version] - 可选的版本号，用于验证缓存是否仍然有效
   * @returns {any | null} 缓存的数据，如果不存在或已过期返回 null
   */
  get(type: string, id: string, version?: string): any | null {
    const key = this.getKey(type, id);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查版本是否匹配
    if (version !== undefined && item.version !== version) {
      console.log(`[editorCache] 缓存版本不匹配，删除: ${key}`);
      this.cache.delete(key);
      return null;
    }

    // 检查是否过期
    const ttl = this.getTTL(type);
    const age = Date.now() - item.timestamp;
    if (age > ttl) {
      console.log(`[editorCache] 缓存已过期（${Math.round(age / 1000)}s > ${ttl / 1000}s），删除: ${key}`);
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * 设置缓存数据
   * @param {string} type - 数据类型
   * @param {string} id - 数据 ID
   * @param {any} data - 要缓存的数据
   * @param {string} [version] - 可选的版本号
   * @returns {void}
   */
  set(type: string, id: string, data: any, version?: string): void {
    const key = this.getKey(type, id);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version,
    });
    console.log(`[editorCache] 缓存已保存: ${key} (TTL: ${this.getTTL(type) / 1000}s)`);
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} type - 数据类型
   * @param {string} id - 数据 ID
   * @returns {boolean} 缓存是否存在且未过期
   */
  has(type: string, id: string): boolean {
    return this.get(type, id) !== null;
  }

  /**
   * 删除指定缓存
   * @param {string} type - 数据类型
   * @param {string} id - 数据 ID
   * @returns {void}
   */
  delete(type: string, id: string): void {
    const key = this.getKey(type, id);
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   * @returns {void}
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[editorCache] 清空所有缓存 (共 ${size} 项)`);
  }

  /**
   * 清除指定类型的所有缓存
   * @param {string} type - 要清除的数据类型
   * @returns {void}
   */
  clearType(type: string): void {
    const prefix = `${type}:`;
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`[editorCache] 清除类型 "${type}" 的缓存 (共 ${count} 项)`);
  }

  /**
   * 清除所有过期的缓存项
   * @returns {number} 清除的缓存项数量
   */
  clearExpired(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      // 从 key 中提取类型
      const type = key.split(':')[0] as string;
      const ttl = this.getTTL(type);

      if (now - item.timestamp > ttl) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      console.log(`[editorCache] 清除过期缓存 (共 ${count} 项)`);
    }

    return count;
  }

  /**
   * 获取缓存统计信息（用于调试）
   * @returns {{ total: number; byType: Record<string, number> }} 统计信息对象，包含总数量和按类型分组的数量
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      const type = key.split(':')[0] as string;
      const ttl = this.getTTL(type);
      const isExpired = now - item.timestamp > ttl;

      if (!byType[type]) {
        byType[type] = 0;
      }
      if (!isExpired) {
        byType[type]++;
      }
    }

    return {
      total: this.cache.size,
      byType,
    };
  }

  /**
   * 获取所有缓存的键（用于调试）
   * @returns {string[]} 所有缓存键的数组
   */
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const editorCache = new EditorCache();

// 定期清理过期缓存（每 5 分钟）
if (typeof window !== 'undefined') {
  setInterval(() => {
    editorCache.clearExpired();
  }, 5 * 60 * 1000);
}
