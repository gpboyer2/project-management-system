/**
 * 工具函数库统一入口
 * 基于2025年现代JavaScript/TypeScript最佳实践
 * 提供常用工具函数、日期处理、字符串操作、数据验证等功能
 */

import type { AppError } from '@/types';

// ========== 剪贴板工具 ==========
import { copyToClipboard, copyJsonToClipboard } from './clipboard';
export { copyToClipboard, copyJsonToClipboard };

// ========== 树形数据工具 ==========
export * from './treeUtils';

// ========== 树节点类型判断工具 ==========
export * from './treeNodeUtils';

// ========== ID 解析与生成工具 ==========
export * from './idUtils';

// ========== 数据对比工具 ==========
export * from './dataUtils';

// ========== 数组扩展工具 ==========
export * from './arrayUtils';

// ========== 缓存工具 ==========
export * from './cacheUtils';

// ========== 版本工具 ==========
export * from './versionUtils';

// ========== 对话框工具 ==========
export * from './dialogUtils';

// ========== 验证工具 ==========
export * from './validationUtils';

// ========== 表单工具 ==========
export * from './formUtils';

// ========== 字段工具 ==========
export * from './fieldUtils';

// ========== 连接配置工具 ==========
export * from './connectionUtils';

// ========== 图标工具 ==========
export * from './iconUtils';

// ========== 格式化工具 ==========
export * from './formatUtils';

// ========== 数据适配器 ==========
export * from './dataAdapter';

// ========== 字节序工具 ==========
export * from './byteOrder';

// ========== 字段类型工具 ==========
export * from './fieldTypeUtils';

// ========== 层级配置工具 ==========
export * from './hierarchyUtils';

/**
 * 字段名称展示统一处理：
 * - field_name 缺失（undefined/null/空字符串/仅空格/非字符串）时统一返回 'Unknown'
 * - field_name 有效时：优先展示 display_name（如果提供且非空），否则展示 field_name
 */
export function format_field_name(field_name: unknown, display_name?: unknown): string {
  if (typeof field_name !== 'string') return 'Unknown';
  const normalized_field_name = field_name.trim();
  if (!normalized_field_name) return 'Unknown';

  if (typeof display_name === 'string') {
    const normalized_display_name = display_name.trim();
    if (normalized_display_name) return normalized_display_name;
  }

  return normalized_field_name;
}

// ========== 日期时间工具 ==========
export const dateUtils = {
  /**
   * 格式化日期
   */
  format(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 相对时间格式化
   */
  fromNow(date: Date | string | number): string {
    const now = new Date();
    const target = new Date(date);
    const diff = now.getTime() - target.getTime();

    if (diff < 0) return '未来';
    if (diff < 1000 * 60) return '刚刚';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}分钟前`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}小时前`;
    if (diff < 1000 * 60 * 60 * 24 * 30) return `${Math.floor(diff / (1000 * 60 * 60 * 24))}天前`;
    if (diff < 1000 * 60 * 60 * 24 * 365) return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 30))}个月前`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))}年前`;
  },

  /**
   * 获取日期范围
   */
  getDateRange(type: 'today' | 'yesterday' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (type) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  },

  /**
   * 计算两个日期之间的差值
   */
  diff(date1: Date | string | number, date2: Date | string | number, unit = 'days'): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d1.getTime() - d2.getTime();

    switch (unit) {
      case 'milliseconds': return diff;
      case 'seconds': return Math.floor(diff / 1000);
      case 'minutes': return Math.floor(diff / (1000 * 60));
      case 'hours': return Math.floor(diff / (1000 * 60 * 60));
      case 'days': return Math.floor(diff / (1000 * 60 * 60 * 24));
      case 'weeks': return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      case 'months': return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      case 'years': return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      default: return diff;
    }
  }
};

// ========== 字符串工具 ==========
export const stringUtils = {
  /**
   * 驼峰转下划线
   */
  camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  /**
   * 下划线转驼峰
   */
  snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },

  /**
   * 首字母大写
   */
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * 生成随机字符串
   */
  random(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 截断字符串
   */
  truncate(str: string, length: number, suffix = '...'): string {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  },

  /**
   * 移除HTML标签
   */
  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  },

  /**
   * 转义HTML
   */
  escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * 模板字符串替换
   */
  template(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
  }
};

// ========== 数字工具 ==========
export const numberUtils = {
  /**
   * 格式化数字（千分位）
   */
  format(num: number, decimals = 2): string {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /**
   * 文件大小格式化
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 生成范围内的随机数
   */
  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 数字精度修正
   */
  round(num: number, precision = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  },

  /**
   * 判断是否为数字
   */
  isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
  }
};

// ========== 对象工具 ==========
export const objectUtils = {
  /**
   * 深拷贝
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T;
    if (typeof obj === 'object') {
      const clonedObj: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          clonedObj[key] = this.deepClone((obj as any)[key]);
        }
      }
      return clonedObj as T;
    }
    return obj;
  },

  /**
   * 深度合并
   */
  deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key] as any, source[key] as any);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  },

  /**
   * 获取嵌套属性值
   */
  get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    return result === undefined ? defaultValue : result;
  },

  /**
   * 设置嵌套属性值
   */
  set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    let current = obj;
    for (const key of keys) {
      if (!(key in current) || !this.isObject(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    current[lastKey] = value;
  },

  /**
   * 判断是否为对象
   */
  isObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  /**
   * 对象键值对转换为数组
   */
  entries<T>(obj: Record<string, T>): Array<[string, T]> {
    return Object.entries(obj);
  },

  /**
   * 数组转换为对象
   */
  fromEntries<T>(entries: Array<[string, T]>): Record<string, T> {
    return Object.fromEntries(entries);
  },

  /**
   * 过滤对象键值对
   */
  filter<T>(obj: Record<string, T>, predicate: (key: string, value: T) => boolean): Record<string, T> {
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (predicate(key, value)) {
        result[key] = value;
      }
    }
    return result;
  }
};

// ========== 数组工具 ==========
export const arrayUtils = {
  /**
   * 数组去重
   */
  unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  },

  /**
   * 根据属性去重
   */
  uniqueBy<T>(arr: T[], key: keyof T): T[] {
    const seen = new Set();
    return arr.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  /**
   * 数组分组
   */
  groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of arr) {
      const groupKey = typeof key === 'function' ? key(item) : String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    return groups;
  },

  /**
   * 数组分块
   */
  chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * 数组扁平化
   */
  flatten<T>(arr: (T | T[])[]): T[] {
    return arr.reduce<T[]>((acc, val) => {
      return acc.concat(Array.isArray(val) ? this.flatten(val) : val);
    }, []);
  },

  /**
   * 数组随机排序
   */
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * 数组求和
   */
  sum(arr: number[]): number {
    return arr.reduce((total, num) => total + num, 0);
  },

  /**
   * 数组求平均值
   */
  average(arr: number[]): number {
    return arr.length === 0 ? 0 : this.sum(arr) / arr.length;
  }
};

// ========== 存储工具 ==========
export const storageUtils = {
  /**
   * 设置localStorage
   */
  setLocal(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('localStorage设置失败:', error);
    }
  },

  /**
   * 获取localStorage
   */
  getLocal<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('localStorage获取失败:', error);
      return defaultValue || null;
    }
  },

  /**
   * 删除localStorage
   */
  removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage删除失败:', error);
    }
  },

  /**
   * 设置sessionStorage
   */
  setSession(key: string, value: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('sessionStorage设置失败:', error);
    }
  },

  /**
   * 获取sessionStorage
   */
  getSession<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('sessionStorage获取失败:', error);
      return defaultValue || null;
    }
  },

  /**
   * 删除sessionStorage
   */
  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('sessionStorage删除失败:', error);
    }
  },

  /**
   * 清除所有存储
   */
  clear(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('清除存储失败:', error);
    }
  }
};

// ========== URL工具 ==========
export const urlUtils = {
  /**
   * 构建URL查询参数
   */
  buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  },

  /**
   * 解析URL查询参数
   */
  parseQuery(url?: string): Record<string, string> {
    const searchParams = new URLSearchParams(url ? new URL(url).search : window.location.search);
    const params: Record<string, string> = {};
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
    return params;
  },

  /**
   * 构建完整URL
   */
  buildUrl(base: string, path?: string, params?: Record<string, any>): string {
    const url = new URL(base + (path || ''), window.location.origin);
    if (params) {
      url.search = this.buildQuery(params);
    }
    return url.toString();
  }
};

// ========== 验证工具 ==========
export const validateUtils = {
  /**
   * 邮箱验证
   */
  isEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  },

  /**
   * 手机号验证（中国大陆）
   */
  isPhone(phone: string): boolean {
    const pattern = /^1[3-9]\d{9}$/;
    return pattern.test(phone);
  },

  /**
   * 身份证验证（中国大陆）
   */
  isIdCard(idCard: string): boolean {
    const pattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return pattern.test(idCard);
  },

  /**
   * URL验证
   */
  isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * IP地址验证
   */
  isIP(ip: string): boolean {
    const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return pattern.test(ip);
  },

  /**
   * 密码强度验证
   */
  isStrongPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字和特殊字符
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
  }
};

// ========== 文件工具 ==========
export const fileUtils = {
  /**
   * 文件大小格式化
   */
  formatFileSize(bytes: number): string {
    return numberUtils.formatFileSize(bytes);
  },

  /**
   * 获取文件扩展名
   */
  getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },

  /**
   * 获取文件类型
   */
  getFileType(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();
    const types: Record<string, string> = {
      // 图片
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
      // 文档
      pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document', ppt: 'document', pptx: 'document',
      // 视频
      mp4: 'video', avi: 'video', mov: 'video', wmv: 'video',
      // 音频
      mp3: 'audio', wav: 'audio', flac: 'audio',
      // 压缩包
      zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
      // 代码
      js: 'code', ts: 'code', html: 'code', css: 'code', json: 'code', xml: 'code',
    };
    return types[ext] || 'unknown';
  },

  /**
   * 读取文件为DataURL
   */
  readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * 下载文件
   */
  downloadFile(url: string, filename?: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * 下载 Blob 数据为文件
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// ========== 防抖节流 ==========
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  const { leading = true, trailing = true } = options;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (!previous && !leading) previous = now;
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
};

// ========== 通知系统 ==========
let notificationId = 0;
const notifications = new Map<string, HTMLElement>();

export function showToast(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 3000
): string {
  const id = `toast-${++notificationId}`;

  // 创建通知元素
  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast--${type} animate-fadeIn`;
  toast.innerHTML = `
    <div class="toast__content">
      <span class="toast__message">${message}</span>
      <button class="toast__close" onclick="hideToast('${id}')">&times;</button>
    </div>
  `;

  // 添加到页面
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  container.appendChild(toast);

  // 保存到Map
  notifications.set(id, toast);

  // 自动隐藏
  if (duration > 0) {
    setTimeout(() => hideToast(id), duration);
  }

  return id;
}

export function hideToast(id: string): void {
  const toast = notifications.get(id);
  if (toast) {
    toast.classList.add('animate-fadeOut');
    setTimeout(() => {
      toast.remove();
      notifications.delete(id);
    }, 300);
  }
}

export function showLoading(message = '加载中...'): string {
  return showToast(message, 'info', 0);
}

export function hideLoading(id: string): void {
  hideToast(id);
}

// ========== 错误处理 ==========

export function createError(message: string, code?: string | number, details?: any): AppError {
  return {
    code: code || 'UNKNOWN_ERROR',
    message,
    details,
    timestamp: Date.now(),
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
    }
  };
}

export function handleError(error: unknown, context?: Record<string, any>): AppError {
  console.error('错误发生:', error);

  if (error instanceof Error) {
    return createError(error.message, 'APP_ERROR', {
      stack: error.stack,
      context,
    });
  }

  if (typeof error === 'string') {
    return createError(error, 'STRING_ERROR', { context });
  }

  return createError('未知错误', 'UNKNOWN_ERROR', { error, context });
}

// ========== 环境检测 ==========
export const envUtils = {
  /**
   * 获取运行时环境变量
   * 优先级：
   * 1. window.__RUNTIME_CONFIG__（打包后由后端注入的运行时配置,用户可以通过修改打包后的 .env.prod 文件进行动态变更配置）
   * 2. import.meta.env（Vite 构建时注入的配置）
   */
  getRuntimeEnv(key: string): string {
    if (window.__RUNTIME_CONFIG__?.[key]) {
      return window.__RUNTIME_CONFIG__[key];
    }
    if (import.meta.env[key]) {
      return import.meta.env[key];
    }
    throw new Error(`环境变量 ${key} 未配置`);
  },

  /**
   * 是否为开发环境
   */
  isDev(): boolean {
    return import.meta.env.DEV;
  },

  /**
   * 是否为生产环境
   */
  isProd(): boolean {
    return import.meta.env.PROD;
  },

  /**
   * 是否为移动设备
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * 是否为微信浏览器
   */
  isWechat(): boolean {
    return /MicroMessenger/i.test(navigator.userAgent);
  },

  /**
   * 获取浏览器信息
   */
  getBrowser(): { name: string; version: string } {
    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
      name = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      name = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      name = 'Safari';
      version = ua.match(/Safari\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
      name = 'Edge';
      version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    return { name, version };
  }
};

// ========== 性能工具 ==========
export const performanceUtils = {
  /**
   * 性能计时开始
   */
  start(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  },

  /**
   * 性能计时结束
   */
  end(name: string): number {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measures = performance.getEntriesByName(name);
      if (measures.length > 0) {
        return measures[measures.length - 1].duration;
      }
    }
    return 0;
  },

  /**
   * 函数执行时间测量
   */
  measure<T extends (...args: any[]) => any>(fn: T, name?: string): T {
    return (function (this: any, ...args: any[]) {
      const timer = name || fn.name || 'anonymous';
      performanceUtils.start(timer);
      const result = fn.apply(this, args);
      const duration = performanceUtils.end(timer);
      console.log(`[性能] ${timer} 执行时间: ${duration.toFixed(2)}ms`);
      return result;
    }) as T;
  }
};

// ========== 状态映射工具 ==========
export const statusUtils = {
  /**
   * 状态标签类型映射
   */
  statusTypeMap: {
    pending: 'warning',
    running: 'primary',
    success: 'success',
    failed: 'danger',
    cancelled: 'info',
    unknown: 'info'
  } as const,

  /**
   * 获取状态标签类型
   * @param status 状态值
   * @returns Element Plus 标签类型
   */
  getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
    return (this.statusTypeMap as any)[status] || 'info';
  },

  /**
   * 获取状态标签文本
   * @param status 状态值
   * @param custom_labels 自定义标签映射
   * @returns 状态文本
   */
  getStatusLabel(
    status: string,
    custom_labels?: Record<string, string>
  ): string {
    const defaultLabels: Record<string, string> = {
      pending: '等待中',
      running: '运行中',
      success: '成功',
      failed: '失败',
      cancelled: '已取消',
      unknown: '未知'
    };
    const labels = custom_labels || defaultLabels;
    return labels[status] || status;
  },

  /**
   * 创建自定义状态映射
   * @param status_map 状态到标签的映射
   * @returns 状态映射对象
   */
  createStatusMap<T extends string>(
    status_map: Record<T, { label: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }>
  ) {
    return {
      getLabel(status: T): string {
        return status_map[status]?.label || status;
      },
      getType(status: T): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
        return status_map[status]?.type || 'info';
      }
    };
  }
};

// ========== 导航锁工具 ==========
const navigationLocks = new Set<string>();

export const navigationUtils = {
  /**
   * 检查导航是否被锁定
   * @param lock_id 锁ID，默认为 'default'
   * @returns 是否被锁定
   */
  isNavigating(lock_id = 'default'): boolean {
    return navigationLocks.has(lock_id);
  },

  /**
   * 开始导航（加锁）
   * @param lock_id 锁ID，默认为 'default'
   */
  startNavigate(lock_id = 'default'): void {
    navigationLocks.add(lock_id);
  },

  /**
   * 结束导航（解锁）
   * @param lock_id 锁ID，默认为 'default'
   */
  endNavigate(lock_id = 'default'): void {
    navigationLocks.delete(lock_id);
  },

  /**
   * 清除所有导航锁
   */
  clearAllLocks(): void {
    navigationLocks.clear();
  },

  /**
   * 带锁的导航操作
   * @param lock_id 锁ID
   * @param action 要执行的异步操作
   * @returns 操作结果
   */
  async withNavigationLock<T>(
    lock_id: string,
    action: () => Promise<T>
  ): Promise<T> {
    if (this.isNavigating(lock_id)) {
      throw new Error('导航操作正在进行中，请稍后再试');
    }

    this.startNavigate(lock_id);
    try {
      return await action();
    } finally {
      this.endNavigate(lock_id);
    }
  }
};

// ========== 导出所有工具 ==========
export const utils = {
  date: dateUtils,
  string: stringUtils,
  number: numberUtils,
  object: objectUtils,
  array: arrayUtils,
  storage: storageUtils,
  url: urlUtils,
  validate: validateUtils,
  file: fileUtils,
  env: envUtils,
  performance: performanceUtils,
  status: statusUtils,
  navigation: navigationUtils,
  clipboard: {
    copy: copyToClipboard,
    copyJson: copyJsonToClipboard,
  },
};

export default utils;