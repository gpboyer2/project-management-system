/**
 * 请求日志工具
 * 提供统一的请求日志记录和日志截断功能
 */
import dayjs from 'dayjs';

interface LogData {
  status?: string;
  message?: string;
  datum?: unknown;
}

class RequestLogger {
  private static requestId = 0;
  private static readonly ENABLED = true;

  /**
   * 记录请求开始
   * @param {string} method - HTTP 请求方法（GET、POST 等）
   * @param {string} url - 请求 URL
   * @param {Record<string, unknown>} params - URL 查询参数
   * @param {unknown} data - 请求体数据
   * @returns {number} 请求 ID，用于关联后续的响应日志
   */
  static logStart(method: string, url: string, params?: Record<string, unknown>, data?: unknown): number {
    if (!this.ENABLED) return 0;

    const requestId = ++this.requestId;
    const timestamp = dayjs().format('HH:mm:ss.SSS');

    console.log(`[${timestamp}] [请求 #${requestId}] ${method} ${url}`);

    if (params) {
      console.log(`#${requestId} Params:`, this.truncateLog(params));
    }

    if (data) {
      console.log(`#${requestId} Body:`, this.truncateLog(data));
    }

    return requestId;
  }

  /**
   * 记录请求成功
   * @param {number} requestId - 请求 ID（由 logStart 返回）
   * @param {unknown} response - 响应数据
   * @param {number} startTime - 请求开始时间戳（用于计算耗时）
   * @returns {void} 无返回值
   */
  static logSuccess(requestId: number, response: unknown, startTime: number): void {
    if (!this.ENABLED) return;

    const duration = Date.now() - startTime;
    const timestamp = dayjs().format('HH:mm:ss.SSS');

    console.log(`[${timestamp}] [响应 #${requestId}] 耗时: ${duration}ms`);

    if (response) {
      const logData: LogData = {};
      const responseObj = response as Record<string, unknown>;

      if (responseObj.status !== undefined) {
        logData.status = responseObj.status as string;
      }
      if (responseObj.message) {
        logData.message = responseObj.message as string;
      }
      if (responseObj.datum !== undefined) {
        logData.datum = responseObj.datum;
      }

      console.log(`#${requestId} 响应:`, this.truncateLog(logData));
    }
  }

  /**
   * 记录请求失败
   * @param {number} requestId - 请求 ID（由 logStart 返回）
   * @param {unknown} error - 错误对象
   * @param {number} startTime - 请求开始时间戳（用于计算耗时）
   * @returns {void} 无返回值
   */
  static logError(requestId: number, error: unknown, startTime: number): void {
    if (!this.ENABLED) return;

    const duration = Date.now() - startTime;
    const timestamp = dayjs().format('HH:mm:ss.SSS');

    console.error(`[${timestamp}] [错误 #${requestId}] 耗时: ${duration}ms`, error);
  }

  /**
   * 记录请求取消
   * @param {number} requestId - 请求 ID（由 logStart 返回）
   * @param {number} startTime - 请求开始时间戳（用于计算耗时）
   * @returns {void} 无返回值
   */
  static logCancel(requestId: number, startTime: number): void {
    if (!this.ENABLED) return;

    const duration = Date.now() - startTime;
    const timestamp = dayjs().format('HH:mm:ss.SSS');

    console.warn(`[${timestamp}] [取消 #${requestId}] 耗时: ${duration}ms`);
  }

  /**
   * 截断日志内容到指定长度
   * @param {unknown} data - 需要截断的数据
   * @param {number} maxLength - 最大长度限制，默认 1000 字符
   * @returns {string} 截断后的 JSON 字符串，超出部分会显示省略信息
   */
  private static truncateLog(data: unknown, maxLength: number = 1000): string {
    try {
      const logStr = JSON.stringify(data, null, 2);
      if (logStr.length <= maxLength) {
        return logStr;
      }
      return logStr.substring(0, maxLength) + `\n... (省略 ${logStr.length - maxLength} 字符)`;
    } catch {
      return String(data);
    }
  }
}

export default RequestLogger;
