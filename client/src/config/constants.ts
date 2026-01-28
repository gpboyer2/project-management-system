/**
 * 路由配置常量
 */
export const ROUTER_CONFIG = {
  // 导航重置延迟（毫秒）
  NAVIGATION_RESET_DELAY: 100,
  // 模块加载重试延迟（毫秒）
  MODULE_LOAD_RETRY_DELAY: 2000,
} as const;

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  INVALID_ROUTE: '无效的路由',
  MODULE_LOAD_FAILED: '模块加载失败',
} as const;

/**
 * 日志配置常量
 */
export const LOG_CONFIG = {
  // 时间戳格式
  TIMESTAMP_FORMAT: 'HH:mm:ss',
} as const;
