/**
 * 前端日志服务
 * 拦截 console 所有方法，通过 WebSocket 将日志发送到后端
 */
import { io, Socket } from 'socket.io-client';
import { envUtils } from './index';

class FrontendLogger {
  private static socket: Socket | null = null;
  private static logBuffer: string[] = [];
  private static flushTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly FLUSH_INTERVAL = 2000;
  private static readonly BUFFER_SIZE = 50;

  // 解析 WebSocket URL：优先使用运行时配置，否则使用构建时配置
  private static readonly WS_URL = (() => {
    return envUtils.getRuntimeEnv('VITE_WS_URL');
  })();

  // 保存所有 console 原始方法
  private static originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
    trace: console.trace.bind(console),
    table: console.table.bind(console),
    dir: console.dir.bind(console),
    dirxml: console.dirxml.bind(console),
    group: console.group.bind(console),
    groupCollapsed: console.groupCollapsed.bind(console),
    groupEnd: console.groupEnd.bind(console),
    time: console.time.bind(console),
    timeLog: console.timeLog.bind(console),
    timeEnd: console.timeEnd.bind(console),
    count: console.count.bind(console),
    countReset: console.countReset.bind(console),
    assert: console.assert.bind(console),
    clear: console.clear.bind(console),
  };

  /**
   * 初始化前端日志服务
   * 建立 WebSocket 连接并拦截 console 所有方法
   */
  static init() {
    this.connectWebSocket();
    this.interceptConsole();
    this.setupUnloadHandler();
  }

  /**
   * 建立 WebSocket 连接
   * 连接成功后自动发送缓冲中的日志
   */
  private static connectWebSocket() {
    if (this.socket?.connected) return;

    this.socket = io(this.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      // 使用原始 console 输出日志，避免循环
      this.originalConsole.log(`[FrontendLogger] WebSocket 已连接: ${this.WS_URL}`);
      // 连接成功，发送缓冲中的日志
      if (this.logBuffer.length > 0) {
        this.originalConsole.log(`[FrontendLogger] 发送缓冲中的 ${this.logBuffer.length} 条日志`);
        this.flush();
      }
    });

    this.socket.on('disconnect', () => {
      this.originalConsole.warn('[FrontendLogger] WebSocket 已断开');
    });

    this.socket.on('connect_error', (error) => {
      this.originalConsole.error('[FrontendLogger] WebSocket 连接错误:', error.message);
    });
  }

  /**
   * 拦截 console 所有方法
   * 将所有 console 输出同时发送到后端
   */
  private static interceptConsole() {
    const self = this;

    // 基础日志方法
    console.log = function (...args: unknown[]) {
      self.originalConsole.log(...args);
      self.addToBuffer('[LOG]', ...args);
    };

    console.warn = function (...args: unknown[]) {
      self.originalConsole.warn(...args);
      self.addToBuffer('[WARN]', ...args);
    };

    console.error = function (...args: unknown[]) {
      self.originalConsole.error(...args);
      self.addToBuffer('[ERROR]', ...args);
    };

    console.info = function (...args: unknown[]) {
      self.originalConsole.info(...args);
      self.addToBuffer('[INFO]', ...args);
    };

    console.debug = function (...args: unknown[]) {
      self.originalConsole.debug(...args);
      self.addToBuffer('[DEBUG]', ...args);
    };

    // 堆栈跟踪
    console.trace = function (...args: unknown[]) {
      self.originalConsole.trace(...args);
      self.addToBuffer('[TRACE]', ...args);
    };

    // 表格输出
    console.table = function (...args: unknown[]) {
      self.originalConsole.table(...args);
      self.addToBuffer('[TABLE]', ...args);
    };

    // 对象目录
    console.dir = function (...args: unknown[]) {
      self.originalConsole.dir(...args);
      self.addToBuffer('[DIR]', ...args);
    };

    console.dirxml = function (...args: unknown[]) {
      self.originalConsole.dirxml(...args);
      self.addToBuffer('[DIRXML]', ...args);
    };

    // 分组
    console.group = function (...args: unknown[]) {
      self.originalConsole.group(...args);
      self.addToBuffer('[GROUP]', ...args);
    };

    console.groupCollapsed = function (...args: unknown[]) {
      self.originalConsole.groupCollapsed(...args);
      self.addToBuffer('[GROUP-COLLAPSED]', ...args);
    };

    console.groupEnd = function () {
      self.originalConsole.groupEnd();
      self.addToBuffer('[GROUP-END]');
    };

    // 计时
    console.time = function (label?: string) {
      self.originalConsole.time(label);
      self.addToBuffer('[TIME]', label || 'default');
    };

    console.timeLog = function (label?: string) {
      self.originalConsole.timeLog(label);
      self.addToBuffer('[TIMELOG]', label || 'default');
    };

    console.timeEnd = function (label?: string) {
      self.originalConsole.timeEnd(label);
      self.addToBuffer('[TIMEEND]', label || 'default');
    };

    // 计数
    console.count = function (label?: string) {
      self.originalConsole.count(label);
      self.addToBuffer('[COUNT]', label || 'default');
    };

    console.countReset = function (label?: string) {
      self.originalConsole.countReset(label);
      self.addToBuffer('[COUNTRESET]', label || 'default');
    };

    // 断言
    console.assert = function (condition?: boolean, ...args: unknown[]) {
      self.originalConsole.assert(condition, ...args);
      if (!condition) {
        self.addToBuffer('[ASSERT]', ...args);
      }
    };

    // 清空
    console.clear = function () {
      self.originalConsole.clear();
      self.addToBuffer('[CLEAR]');
    };
  }

  /**
   * 添加日志到缓冲区
   * @param {string} _level - 日志级别
   * @param {unknown[]} args - 日志参数列表
   */
  private static addToBuffer(_level: string, ...args: unknown[]) {
    const message = args.map(arg => this.formatArg(arg)).join(' ');
    this.logBuffer.push(message);

    if (this.logBuffer.length >= this.BUFFER_SIZE) {
      this.flush();
      return;
    }

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  /**
   * 格式化日志参数为字符串
   * @param {unknown} arg - 待格式化的参数
   * @returns {string} 格式化后的字符串
   */
  private static formatArg(arg: unknown): string {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`;
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  /**
   * 发送缓冲区中的所有日志到后端
   * 如果 WebSocket 未连接则尝试重新连接
   */
  private static flush() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = this.logBuffer.splice(0);

    // 通过 WebSocket 发送
    if (this.socket?.connected) {
      this.socket.emit('frontend-log', { logs: logsToSend });
    } else {
      // WebSocket 未连接，尝试重新连接
      this.connectWebSocket();
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * 设置页面卸载前的日志刷新处理
   * 在页面关闭前确保所有缓冲日志都已发送
   */
  private static setupUnloadHandler() {
    const flushOnUnload = () => {
      if (this.logBuffer.length > 0 && this.socket?.connected) {
        this.socket.emit('frontend-log', { logs: this.logBuffer });
      }
    };
    window.addEventListener('beforeunload', flushOnUnload);
    window.addEventListener('pagehide', flushOnUnload);
  }
}

export default FrontendLogger;
