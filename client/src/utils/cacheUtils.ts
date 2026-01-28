// 缓存加载配置接口
export interface CacheLoadOptions<T> {
  // 缓存键名
  cache_key: string;
  // 缓存对象（Ref 或普通对象）
  cache: Record<string, T>;
  // 数据加载函数
  loader: () => Promise<T | null>;
  // 最大重试次数（默认 2 次）
  max_retries?: number;
  // 成功回调（可选）
  on_success?: (data: T) => void;
  // 失败回调（可选）
  on_error?: (error: Error) => void;
}

/**
 * 确保缓存数据已加载
 *
 * 功能说明：
 * 1. 先检查缓存是否存在，存在则直接返回
 * 2. 缓存不存在时调用 loader 函数加载数据
 * 3. 支持重试机制（最多重试 max_retries 次）
 * 4. 支持指数退避（100ms, 200ms, 400ms...）
 * 5. 支持自定义成功/失败回调
 *
 * 使用示例：
 * ```ts
 * await ensureCachedLoad<PacketData>({
 *   cache_key: String(packet_id),
 *   cache: publishedPacketCache.value,
 *   loader: async () => {
 *     const res = await getMessagePublishedDetail(packet_id);
 *     return res?.status === 'success' ? res.datum : null;
 *   },
 *   max_retries: 2,
 *   on_success: (data) => console.log('加载成功', data),
 *   on_error: (error) => console.error('加载失败', error)
 * });
 * ```
 * @param {CacheLoadOptions<T>} options - 缓存加载配置选项
 * @returns {Promise<void>} 无返回值的 Promise
 */
export async function ensureCachedLoad<T>(options: CacheLoadOptions<T>): Promise<void> {
  const {
    cache_key,
    cache,
    loader,
    max_retries = 2,
    on_success,
    on_error
  } = options;

  // 检查缓存是否存在，存在则直接返回
  if (cache[cache_key]) {
    return;
  }

  let last_error: Error | null = null;

  // 重试循环
  for (let attempt = 0; attempt <= max_retries; attempt++) {
    try {
      // 调用加载函数获取数据
      const data = await loader();

      // 检查数据有效性
      if (data == null) {
        if (attempt === max_retries) {
          const error = new Error(`数据加载失败：返回 null（尝试 ${attempt + 1}/${max_retries + 1}）`);
          if (on_error) {
            on_error(error);
          }
          return;
        }
        continue;
      }

      // 缓存数据
      cache[cache_key] = data;

      // 触发成功回调
      if (on_success) {
        on_success(data);
      }

      // 加载成功，退出
      return;
    } catch (error) {
      last_error = error as Error;

      // 如果不是最后一次尝试，则等待后重试
      if (attempt < max_retries) {
        // 指数退避：100ms, 200ms, 400ms... 最大不超过 5000ms
        const delay = Math.min(100 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // 所有重试都失败，触发错误回调
  if (last_error && on_error) {
    on_error(last_error);
  }
}
