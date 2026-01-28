/**
 * TypeScript类型系统统一入口
 * 基于2025年现代TypeScript最佳实践
 * 提供完整的类型定义、类型守卫、泛型工具等
 */

// ========== 基础类型定义 ==========

// 可空类型，允许值为null
export type Nullable<T> = T | null

// 可选类型，指定字段变为可选
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 必填字段类型，指定字段变为必填
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 深度可选类型，递归将所有字段变为可选
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ========== HTTP相关类型 ==========

// 分页参数
export interface PaginationParams {
  current_page: number  // 当前页码
  page_size: number     // 每页条数
  total?: number       // 总条数
}

// 排序参数
export interface SortParams {
  field: string       // 排序字段
  order: 'asc' | 'desc'  // 排序方向：升序或降序
}

// 搜索参数
export interface SearchParams {
  keyword?: string           // 搜索关键词
  filters?: Record<string, any>  // 过滤条件
  sort?: SortParams          // 排序参数
  pagination?: PaginationParams  // 分页参数
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number        // 响应码
  data: T            // 响应数据
  message: string    // 响应消息
  success: boolean   // 是否成功
  timestamp: number  // 时间戳
}

// 分页响应格式
export type PaginatedResponse<T> = ApiResponse<{
  list: T[]          // 数据列表
  pagination: {
    current_page: number  // 当前页码
    page_size: number     // 每页条数
    total: number        // 总条数
  }
}>

// ========== 用户相关类型 ==========

// 用户基础信息
export interface User {
  id: string                    // 用户ID
  username: string              // 用户名
  nickname?: string             // 昵称
  email?: string                // 邮箱
  avatar?: string               // 头像URL
  phone?: string                // 手机号
  permissions: string[]         // 权限列表
  roles: string[]               // 角色列表
  status: 'active' | 'inactive' | 'banned'  // 用户状态
  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
  lastLoginAt?: string          // 最后登录时间
}

// 用户详细资料
export interface UserProfile extends User {
  bio?: string                  // 个人简介
  website?: string              // 个人网站
  location?: string             // 所在地
  company?: string              // 公司
  preferences: UserPreferences  // 用户偏好设置
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'  // 主题设置
  language: string             // 语言设置
  timezone: string             // 时区设置
  notifications: NotificationSettings  // 通知设置
}

// 通知设置
export interface NotificationSettings {
  email: boolean                // 邮件通知
  push: boolean                 // 推送通知
  desktop: boolean              // 桌面通知
  types: Record<string, boolean>  // 分类通知设置
}

// ========== 认证相关类型 ==========

// 登录凭证
export interface LoginCredentials {
  username: string      // 用户名
  password: string      // 密码
  captcha?: string      // 验证码
  remember?: boolean    // 记住登录
}

// 注册数据
export interface RegisterData {
  username: string        // 用户名
  email: string          // 邮箱
  password: string       // 密码
  confirmPassword: string  // 确认密码
  captcha?: string       // 验证码
}

// 认证令牌
export interface AuthTokens {
  accessToken: string    // 访问令牌
  refreshToken: string   // 刷新令牌
  expiresIn: number      // 过期时间
  tokenType: string      // 令牌类型
}

// JWT载荷
export interface JwtPayload {
  sub: string            // 用户ID
  username: string       // 用户名
  roles: string[]        // 用户角色
  permissions: string[]  // 用户权限
  iat: number           // 签发时间
  exp: number           // 过期时间
}

// ========== LogicFlow相关类型 ==========

// 流程图节点
export interface FlowNode {
  id: string                    // 节点ID
  type: string                  // 节点类型
  x: number                     // X坐标
  y: number                     // Y坐标
  width: number                 // 宽度
  height: number                // 高度
  text?: {                      // 节点文本
    x?: number
    y?: number
    value: string
  }
  properties?: Record<string, any>  // 节点属性
  zIndex?: number                // 层级
  rotate?: number                // 旋转角度
}

// 流程图连线
export interface FlowEdge {
  id: string                    // 连线ID
  sourceNodeId: string          // 源节点ID
  targetNodeId: string          // 目标节点ID
  startPoint?: {                // 起点坐标
    x: number
    y: number
  }
  endPoint?: {                  // 终点坐标
    x: number
    y: number
  }
  type?: string                 // 连线类型
  properties?: Record<string, any>  // 连线属性
  text?: {                      // 连线文本
    x?: number
    y?: number
    value: string
  }
  zIndex?: number                // 层级
}

// 流程图数据
export interface FlowData {
  nodes: FlowNode[]             // 节点列表
  edges: FlowEdge[]             // 连线列表
}

// 节点模板
export interface NodeTemplate {
  id: string                    // 模板ID
  name: string                  // 模板名称
  type: string                  // 节点类型
  category: string              // 节点分类
  icon?: string                 // 图标
  description?: string          // 描述
  properties: NodeProperty[]    // 属性配置
  defaultConfig: Partial<FlowNode>  // 默认配置
}

// 节点属性
export interface NodeProperty {
  key: string                   // 属性键
  label: string                 // 属性标签
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'file' | 'color' | 'date'  // 属性类型
  required?: boolean            // 是否必填
  default?: any                 // 默认值
  options?: Array<{             // 选项（用于select类型）
    label: string
    value: any
  }>
  validation?: {                // 验证规则
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  description?: string          // 属性描述
}

// ========== 菜单和路由类型 ==========

// 菜单项
export interface MenuItem {
  id: string                    // 菜单ID
  name: string                  // 菜单名称
  path?: string                 // 路由路径
  icon?: string                 // 菜单图标
  component?: string            // 组件路径
  redirect?: string             // 重定向路径
  children?: MenuItem[]         // 子菜单
  meta?: MenuMeta               // 元信息
  hidden?: boolean              // 是否隐藏
  alwaysShow?: boolean          // 总是显示
}

// 菜单元信息
export interface MenuMeta {
  title: string                 // 标题
  icon?: string                 // 图标
  cache?: boolean               // 是否缓存
  hidden?: boolean              // 是否隐藏
  breadcrumb?: boolean          // 是否显示面包屑
  activeMenu?: string           // 激活菜单
  noCache?: boolean             // 不缓存
}

// 面包屑项
export interface BreadcrumbItem {
  name: string                  // 名称
  path?: string                 // 路径
  icon?: string                 // 图标
}

// ========== 通知和消息类型 ==========

// 系统通知
export interface Notification {
  id: string                    // 通知ID
  type: 'success' | 'error' | 'warning' | 'info'  // 通知类型
  title: string                 // 通知标题
  message?: string              // 通知内容
  duration?: number             // 显示时长
  timestamp: number             // 时间戳
  read?: boolean                // 是否已读
  actions?: NotificationAction[]  // 操作按钮
}

// 通知操作
export interface NotificationAction {
  label: string                 // 按钮标签
  action: () => void            // 点击动作
  primary?: boolean             // 是否主要按钮
}

// 消息提示
export interface Toast {
  id: string                    // 提示ID
  type: 'success' | 'error' | 'warning' | 'info'  // 提示类型
  title: string                 // 提示标题
  message?: string              // 提示内容
  duration?: number             // 显示时长
  persistent?: boolean          // 是否持久显示
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left'  // 显示位置
}

// ========== 表单相关类型 ==========

// 表单字段
export interface FormField {
  name: string                   // 字段名称
  label: string                  // 字段标签
  type: 'input' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'datetime' | 'file' | 'number' | 'password'  // 字段类型
  placeholder?: string           // 占位符
  required?: boolean             // 是否必填
  disabled?: boolean             // 是否禁用
  readonly?: boolean             // 是否只读
  defaultValue?: any             // 默认值
  options?: Array<{              // 选项（用于select、radio等）
    label: string
    value: any
    disabled?: boolean
  }>
  validation?: FieldValidation   // 验证规则
  description?: string           // 字段描述
  dependencies?: string[]        // 依赖字段
}

// 字段验证
export interface FieldValidation {
  required?: boolean             // 必填验证
  min?: number                   // 最小值
  max?: number                   // 最大值
  minLength?: number             // 最小长度
  maxLength?: number             // 最大长度
  pattern?: RegExp               // 正则表达式
  custom?: (value: any) => boolean | string  // 自定义验证
  message?: string               // 错误消息
}

// 表单状态
export interface FormState {
  values: Record<string, any>    // 表单值
  errors: Record<string, string> // 错误信息
  touched: Record<string, boolean>  // 是否触摸过
  isValid: boolean               // 是否有效
  isSubmitting: boolean          // 是否提交中
  isDirty: boolean               // 是否修改过
}

// ========== 文件相关类型 ==========

// 文件信息
export interface FileInfo {
  id: string                    // 文件ID
  name: string                  // 文件名
  originalName: string          // 原始文件名
  size: number                  // 文件大小
  type: string                  // 文件类型
  url: string                   // 访问URL
  thumbnailUrl?: string         // 缩略图URL
  uploadedAt: string            // 上传时间
  uploadedBy: string            // 上传者
  metadata?: Record<string, any>  // 元数据
}

// 上传选项
export interface UploadOptions {
  accept?: string               // 接受的文件类型
  multiple?: boolean            // 是否支持多文件
  maxSize?: number              // 最大文件大小
  maxFiles?: number             // 最大文件数量
  autoUpload?: boolean          // 是否自动上传
  headers?: Record<string, string>  // 请求头
  data?: Record<string, any>    // 附加数据
  onProgress?: (progress: number) => void  // 进度回调
  onSuccess?: (file: FileInfo) => void     // 成功回调
  onError?: (error: Error) => void         // 错误回调
}

// ========== 主题和样式类型 ==========

// 主题类型
export type Theme = 'light' | 'dark' | 'auto'

// 主题配置
export interface ThemeConfig {
  primary: string               // 主色调
  secondary: string             // 次要色调
  success: string               // 成功色
  warning: string               // 警告色
  error: string                 // 错误色
  info: string                  // 信息色
  background: string            // 背景色
  surface: string               // 表面色
  text: {                       // 文本颜色
    primary: string             // 主要文本
    secondary: string           // 次要文本
    disabled: string            // 禁用文本
  }
  border: string                // 边框色
  shadow: string                // 阴影色
}

// 响应式断点
export interface Breakpoints {
  xs: number                    // 超小屏
  sm: number                    // 小屏
  md: number                    // 中屏
  lg: number                    // 大屏
  xl: number                    // 超大屏
  '2xl': number                 // 超超大屏
}

// ========== 插件系统类型 ==========

// 插件元信息
export interface Plugin {
  name: string                   // 插件名称
  version: string                // 插件版本
  description?: string           // 插件描述
  author?: string                // 作者
  homepage?: string              // 主页
  repository?: string            // 仓库地址
  license?: string               // 许可证
  keywords?: string[]            // 关键词
  dependencies?: Record<string, string>  // 依赖
  peerDependencies?: Record<string, string>  // 对等依赖
  main?: string                  // 入口文件
  module?: string                // ES模块入口
  types?: string                 // 类型定义
  files?: string[]               // 包含文件
}

// 插件实例
export interface PluginInstance {
  name: string                   // 插件名称
  version: string                // 插件版本
  description?: string           // 插件描述
  author?: string                // 作者
  dependencies?: string[]        // 依赖列表
  install?: (app: any, options?: any) => void | Promise<void>  // 安装方法
  uninstall?: (app: any) => void | Promise<void>  // 卸载方法
  config?: PluginConfig          // 插件配置
}

// 插件配置
export interface PluginConfig {
  enabled: boolean               // 是否启用
  options?: Record<string, any>  // 配置选项
  loadOrder?: number             // 加载顺序
}

// ========== 错误处理类型 ==========

// 应用错误
export interface AppError {
  code: string | number          // 错误码
  message: string                // 错误消息
  details?: any                  // 错误详情
  stack?: string                 // 错误堆栈
  timestamp: number              // 时间戳
  context?: Record<string, any>  // 错误上下文
}

// 错误边界状态
export interface ErrorBoundaryState {
  hasError: boolean              // 是否有错误
  error?: Error                  // 错误对象
  errorInfo?: any                // 错误信息
}

// ========== 事件系统类型 ==========

// 事件总线
export interface EventBus {
  on<T = unknown>(event: string, handler: (data: T) => void): () => void  // 监听事件
  emit<T = unknown>(event: string, data?: T): void                         // 触发事件
  off(event: string, handler?: (...args: unknown[]) => unknown): void     // 取消监听
  once<T = unknown>(event: string, handler: (data: T) => void): () => void  // 监听一次
}

// 事件处理器
export type EventHandler<T = unknown> = (data: T) => void

// 事件映射
export interface EventMap {
  [key: string]: unknown
}

// ========== 缓存类型 ==========

// 缓存项
export interface CacheItem<T = any> {
  data: T                       // 缓存数据
  timestamp: number             // 缓存时间戳
  ttl?: number                  // 生存时间
  key: string                   // 缓存键
}

// 缓存选项
export interface CacheOptions {
  ttl?: number                  // 默认生存时间
  maxSize?: number              // 最大缓存数量
  strategy?: 'lru' | 'fifo' | 'lfu'  // 缓存策略
}

// ========== 配置类型 ==========

// 应用配置
export interface AppConfig {
  api: {                        // API配置
    baseURL: string             // 基础URL
    timeout: number             // 超时时间
    retries: number             // 重试次数
  }
  auth: {                       // 认证配置
    tokenKey: string            // 令牌键名
    refreshTokenKey: string     // 刷新令牌键名
    autoRefresh: boolean        // 自动刷新
    refreshThreshold: number    // 刷新阈值
  }
  cache: {                      // 缓存配置
    enabled: boolean            // 是否启用缓存
    defaultTTL: number          // 默认生存时间
    maxSize: number             // 最大缓存数量
  }
  theme: {                      // 主题配置
    default: Theme              // 默认主题
    followSystem: boolean       // 跟随系统主题
  }
  i18n: {                       // 国际化配置
    default: string             // 默认语言
    fallback: string            // 回退语言
    supported: string[]         // 支持的语言列表
  }
  upload: {                     // 上传配置
    maxFileSize: number         // 最大文件大小
    allowedTypes: string[]      // 允许的文件类型
    chunkSize: number           // 分片大小
  }
  features: {                   // 功能开关
    enableAnalytics: boolean    // 启用分析
    enableErrorReporting: boolean  // 启用错误报告
    enablePWA: boolean          // 启用PWA
  }
}

// ========== 工具类型 ==========

// 深度只读类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 按值选择类型
export type PickByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>

// 按值排除类型
export type OmitByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? never : K }[keyof T]>

// 非空类型
export type NonNullable<T> = T extends null | undefined ? never : T

// 可等待类型
export type Awaitable<T> = T | Promise<T>

// 异步函数类型
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>

// 同步函数类型
export type SyncFunction<T = any> = (...args: any[]) => T

// 任意函数类型
export type AnyFunction<T = any> = SyncFunction<T> | AsyncFunction<T>

// ========== 类型守卫 ==========

/**
 * 判断是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 判断是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 判断是否为布尔值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 判断是否为对象
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 判断是否为数组
 */
export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

/**
 * 判断是否为函数
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * 判断是否为日期
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 判断是否为null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * 判断是否为undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * 判断是否为null或undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

/**
 * 判断是否为空值
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// ========== 类型断言 ==========

/**
 * 断言为字符串
 */
export function assertString(value: unknown, message = 'Expected string'): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(message);
  }
}

/**
 * 断言为数字
 */
export function assertNumber(value: unknown, message = 'Expected number'): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(message);
  }
}

/**
 * 断言为对象
 */
export function assertObject(value: unknown, message = 'Expected object'): asserts value is Record<string, any> {
  if (!isObject(value)) {
    throw new TypeError(message);
  }
}

/**
 * 断言为数组
 */
export function assertArray(value: unknown, message = 'Expected array'): asserts value is any[] {
  if (!isArray(value)) {
    throw new TypeError(message);
  }
}

/**
 * 断言为函数
 */
export function assertFunction(value: unknown, message = 'Expected function'): asserts value is (...args: unknown[]) => unknown {
  if (!isFunction(value)) {
    throw new TypeError(message);
  }
}

// ========== 导出所有类型 ==========

// 重新导出Vue常用类型
export type {
  Component,                  // 组件类型
  ComponentPublicInstance,    // 组件实例类型
  PropType,                   // 属性类型
  Ref,                        // 响应式引用类型
  ComputedRef,                // 计算属性类型
  App,                        // 应用实例类型
  Plugin as VuePlugin,        // Vue插件类型
} from 'vue';

// 重新导出Vue Router类型
export type {
  Router,                     // 路由器类型
  RouteLocationNormalized,    // 规范化路由位置类型
  RouteRecordNormalized,      // 规范化路由记录类型
} from 'vue-router';

// 重新导出LogicFlow类型
export type {
  LogicFlow,                  // LogicFlow核心类型
  BaseNode,                   // 基础节点类型
  BaseEdge,                   // 基础连线类型
  GraphConfigData,            // 图形配置数据类型
  NodeConfig,                 // 节点配置类型
  EdgeConfig,                 // 连线配置类型
  Point,                      // 点坐标类型
} from '@logicflow/core';

// ========== 资源管理器树节点类型 ==========

// 节点类型常量
export const NodeType = {
  // 文件夹类型
  FOLDER: 'folder',
  // 公共数据字典
  DICTIONARY: 'dictionary',
  // ICD 协议集
  ICD_BUNDLE: 'icd_bundle',
  // 报文分类
  PACKET_CATEGORY: 'packet_category',
  // ICD 报文
  ICD_MESSAGE: 'icd_message',
  // 普通文件
  FILE: 'file',
  // 通用层级节点（动态类型，由层级配置决定，通过 node_type_id 区分具体类型）
  HIERARCHY_NODE: 'hierarchy_node',
} as const;

export type NodeTypeValue = typeof NodeType[keyof typeof NodeType];

// 基础树节点接口
interface BaseTreeNodeData {
  id: string                       // 节点ID
  name: string                     // 节点名称
  type: string                     // 节点类型
  expanded?: boolean               // 是否展开
  children?: TreeNodeData[]        // 子节点
  selectable?: boolean             // 是否可选择
  [key: string]: any               // 其他动态字段
}

// 体系层级树节点接口
export interface HierarchyTreeNodeData extends BaseTreeNodeData {
  node_type_id?: string            // 关联的层级配置ID
  description?: string             // 描述
  properties?: Record<string, any> // 属性对象
}

// 协议算法树节点接口
export interface ProtocolTreeNodeData extends BaseTreeNodeData {
  packet_id?: string               // 报文ID
  description?: string             // 描述
  version?: string                 // 版本
  field_count?: number             // 字段数量
  is_draft?: boolean               // 是否为草稿
}

// 树节点联合类型
export type TreeNodeData =
  | HierarchyTreeNodeData
  | ProtocolTreeNodeData
  | BaseTreeNodeData;