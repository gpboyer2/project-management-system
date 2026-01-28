import fs from 'fs';
import path from 'path';

// 日志级别定义
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.outputMode = 'console'; // 默认输出到控制台
    this.logFilePath = null;
    this.fileStream = null;
    this.logLevel = 'info'; // 默认日志级别
    this._initialized = false;
  }

  // 配置 logger（在环境变量设置后调用）
  configure() {
    // 关闭旧的文件流（如果有）
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }

    // 重新读取环境变量
    this.outputMode = process.env.LOG_OUTPUT || 'console';
    this.logFilePath = process.env.LOG_FILE || path.join(process.cwd(), 'nodegen.log');
    this.logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();

    // 验证日志级别
    if (!LOG_LEVELS.hasOwnProperty(this.logLevel)) {
      console.warn(`Invalid log level: ${this.logLevel}, using 'info' instead`);
      this.logLevel = 'info';
    }

    // 如果需要文件输出，创建文件流
    if (this.outputMode === 'file' || this.outputMode === 'both') {
      this.fileStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    }

    this._initialized = true;
  }

  // 检查是否应该输出该级别的日志
  _shouldLog(level) {
    const currentLevelValue = LOG_LEVELS[this.logLevel] || LOG_LEVELS.info;
    const messageLevelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
    return messageLevelValue <= currentLevelValue;
  }

  _write(level, ...args) {
    // 检查是否应该输出该级别的日志
    if (!this._shouldLog(level.toLowerCase())) {
      return;
    }

    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;

    if (this.outputMode === 'console' || this.outputMode === 'both') {
      console[level === 'ERROR' ? 'error' : 'log'](...args);
    }

    if (this.outputMode === 'file' || this.outputMode === 'both') {
      this.fileStream.write(logLine);
    }
  }

  log(...args) { this._write('INFO', ...args); }
  info(...args) { this._write('INFO', ...args); }
  warn(...args) { this._write('WARN', ...args); }
  error(...args) { this._write('ERROR', ...args); }
  debug(...args) { this._write('DEBUG', ...args); }

  close() {
    if (this.fileStream) {
      this.fileStream.end();
    }
  }
}

export const logger = new Logger();
