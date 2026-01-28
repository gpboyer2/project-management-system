/**
 * 插件系统统一入口
 * 基于2025年现代化插件架构设计
 * 支持动态加载、依赖管理、生命周期钩子
 */

import { App, Plugin } from 'vue';
import { LogicFlow } from '@logicflow/core';

// 插件类型定义
export interface PluginInstance {
  name: string
  version: string
  description?: string
  author?: string
  dependencies?: string[]
  install?: (app: App, options?: any) => void
  uninstall?: (app: App) => void
  config?: PluginConfig
}

// 插件配置类型
export interface PluginConfig {
  enabled: boolean
  options?: Record<string, any>
  loadOrder?: number
}

// 插件元数据
export interface PluginMeta {
  name: string
  version: string
  description?: string
  author?: string
  homepage?: string
  repository?: string
  license?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  engines?: Record<string, string>
}

// 插件生命周期钩子
export interface PluginHooks {
  beforeInstall?: (plugin: PluginInstance) => void | Promise<void>
  afterInstall?: (plugin: PluginInstance) => void | Promise<void>
  beforeUninstall?: (plugin: PluginInstance) => void | Promise<void>
  afterUninstall?: (plugin: PluginInstance) => void | Promise<void>
  onError?: (error: Error, plugin: PluginInstance) => void
}

// 插件管理器类
class PluginManager {
  private plugins = new Map<string, PluginInstance>();
  private configs = new Map<string, PluginConfig>();
  private hooks: PluginHooks = {};
  private app: App | null = null;
  private logicFlow: LogicFlow | null = null;

  /**
   * 初始化插件管理器
   * @param {App} app - Vue应用实例
   * @param {LogicFlow} logicFlow - LogicFlow实例
   */
  init(app: App, logicFlow?: LogicFlow): void {
    this.app = app;
    this.logicFlow = logicFlow || null;
    console.log('[插件系统] 插件管理器已初始化');
  }

  /**
   * 注册插件
   * @param {PluginInstance} plugin - 插件实例
   * @param {PluginConfig} config - 插件配置
   * @returns {Promise<void>}
   */
  async register(plugin: PluginInstance, config: PluginConfig = { enabled: true }): Promise<void> {
    try {
      // 检查插件是否已注册
      if (this.plugins.has(plugin.name)) {
        throw new Error(`插件 ${plugin.name} 已存在`);
      }

      // 检查依赖
      await this.checkDependencies(plugin);

      // 执行安装前钩子
      await this.executeHook('beforeInstall', plugin);

      // 安装插件
      if (plugin.install && this.app) {
        await plugin.install(this.app, config.options);
      }

      // 注册到LogicFlow
      if (this.logicFlow && (plugin as any).registerToLogicFlow) {
        (plugin as any).registerToLogicFlow(this.logicFlow);
      }

      // 保存插件和配置
      this.plugins.set(plugin.name, plugin);
      this.configs.set(plugin.name, config);

      // 执行安装后钩子
      await this.executeHook('afterInstall', plugin);

      console.log(`[插件系统] 插件 ${plugin.name} 注册成功`);
    } catch (error) {
      await this.executeHook('onError', error as Error, plugin);
      console.error(`[插件系统] 插件 ${plugin.name} 注册失败:`, error);
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param {string} name - 插件名称
   * @returns {Promise<void>}
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`插件 ${name} 不存在`);
    }

    try {
      // 执行卸载前钩子
      await this.executeHook('beforeUninstall', plugin);

      // 卸载插件
      if (plugin.uninstall && this.app) {
        await plugin.uninstall(this.app);
      }

      // 从LogicFlow注销
      if (this.logicFlow && (plugin as any).unregisterFromLogicFlow) {
        (plugin as any).unregisterFromLogicFlow(this.logicFlow);
      }

      // 移除插件和配置
      this.plugins.delete(name);
      this.configs.delete(name);

      // 执行卸载后钩子
      await this.executeHook('afterUninstall', plugin);

      console.log(`[插件系统] 插件 ${name} 卸载成功`);
    } catch (error) {
      await this.executeHook('onError', error as Error, plugin);
      console.error(`[插件系统] 插件 ${name} 卸载失败:`, error);
      throw error;
    }
  }

  /**
   * 启用插件
   * @param {string} name - 插件名称
   * @returns {Promise<void>}
   */
  async enable(name: string): Promise<void> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`插件 ${name} 不存在`);
    }

    config.enabled = true;
    console.log(`[插件系统] 插件 ${name} 已启用`);
  }

  /**
   * 禁用插件
   * @param {string} name - 插件名称
   * @returns {Promise<void>}
   */
  async disable(name: string): Promise<void> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`插件 ${name} 不存在`);
    }

    config.enabled = false;
    console.log(`[插件系统] 插件 ${name} 已禁用`);
  }

  /**
   * 检查插件依赖
   * @param {PluginInstance} plugin - 插件实例
   * @returns {Promise<void>}
   */
  private async checkDependencies(plugin: PluginInstance): Promise<void> {
    if (!plugin.dependencies) return;

    for (const dependency of plugin.dependencies) {
      if (!this.plugins.has(dependency)) {
        throw new Error(`插件 ${plugin.name} 依赖的插件 ${dependency} 未安装`);
      }
    }
  }

  /**
   * 执行生命周期钩子
   * @param {keyof PluginHooks} hookName - 钩子名称
   * @param {any[]} args - 参数列表
   * @returns {Promise<void>}
   */
  private async executeHook(hookName: keyof PluginHooks, ...args: any[]): Promise<void> {
    const hook = this.hooks[hookName];
    if (hook) {
      await hook(...args);
    }
  }

  /**
   * 添加生命周期钩子
   * @param {keyof PluginHooks} name - 钩子名称
   * @param {(...args: unknown[]) => unknown} callback - 回调函数
   */
  addHook(name: keyof PluginHooks, callback: (...args: unknown[]) => unknown): void {
    this.hooks[name] = callback as any;
  }

  /**
   * 获取插件列表
   * @returns {PluginInstance[]} 插件列表
   */
  getPluginList(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已启用的插件列表
   * @returns {PluginInstance[]} 已启用的插件列表
   */
  getEnabledPlugins(): PluginInstance[] {
    return this.getPluginList().filter(plugin => {
      const config = this.configs.get(plugin.name);
      return config?.enabled;
    });
  }

  /**
   * 获取插件配置
   * @param {string} name - 插件名称
   * @returns {PluginConfig | undefined} 插件配置
   */
  getPluginConfig(name: string): PluginConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 更新插件配置
   * @param {string} name - 插件名称
   * @param {Partial<PluginConfig>} config - 插件配置
   */
  updatePluginConfig(name: string, config: Partial<PluginConfig>): void {
    const existingConfig = this.configs.get(name);
    if (!existingConfig) {
      throw new Error(`插件 ${name} 不存在`);
    }

    this.configs.set(name, { ...existingConfig, ...config });
    console.log(`[插件系统] 插件 ${name} 配置已更新`);
  }

  /**
   * 动态加载插件
   * @param {string} url - 插件URL
   * @returns {Promise<void>}
   */
  async loadPlugin(url: string): Promise<void> {
    try {
      // 动态导入插件
      const module = await import(url);
      const plugin: PluginInstance = module.default || module;

      // 验证插件格式
      if (!plugin.name || !plugin.version) {
        throw new Error('插件格式不正确，缺少name或version字段');
      }

      // 注册插件
      await this.register(plugin);
      console.log(`[插件系统] 动态加载插件 ${plugin.name} 成功`);
    } catch (error) {
      console.error(`[插件系统] 动态加载插件失败:`, error);
      throw error;
    }
  }

  /**
   * 批量加载插件
   * @param {Array<{ url: string; config?: PluginConfig }>} plugins - 插件列表
   * @returns {Promise<void>}
   */
  async loadPlugins(plugins: Array<{ url: string; config?: PluginConfig }>): Promise<void> {
    const results = await Promise.allSettled(
      plugins.map(async ({ url, config }) => {
        const module = await import(url);
        const plugin: PluginInstance = module.default || module;
        await this.register(plugin, config);
      })
    );

    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.error(`[插件系统] ${failed.length} 个插件加载失败`);
      failed.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`插件 ${plugins[index].url} 加载失败:`, result.reason);
        }
      });
    }
  }

  /**
   * 清理所有插件
   * @returns {Promise<void>}
   */
  async clear(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    await Promise.all(pluginNames.map(name => this.unregister(name)));
    console.log('[插件系统] 所有插件已清理');
  }
}

// 创建插件管理器实例
export const pluginManager = new PluginManager();

// 内置插件基类
export abstract class BasePlugin implements PluginInstance {
  abstract name: string
  abstract version: string
  description?: string;
  author?: string;
  dependencies?: string[];
  config?: PluginConfig;

  abstract install(app: App, options?: any): void | Promise<void>
  abstract uninstall(app: App): void | Promise<void>

  /**
   * 注册到LogicFlow
   * @param {LogicFlow} lf - LogicFlow实例
   */
  registerToLogicFlow?(lf: LogicFlow): void

  /**
   * 从LogicFlow注销
   * @param {LogicFlow} lf - LogicFlow实例
   */
  unregisterFromLogicFlow?(lf: LogicFlow): void
}

// Vue插件安装器
export const installPluginSystem = {
  install(app: App, options?: { logicFlow?: LogicFlow }) {
    pluginManager.init(app, options?.logicFlow);

    // 全局属性
    app.config.globalProperties.$pluginManager = pluginManager;
    app.provide('pluginManager', pluginManager);

    console.log('[插件系统] 已安装到Vue应用');
  }
};

// 导出类型和实例
export type { Plugin, Plugin as VuePlugin };
export { pluginManager };
export default installPluginSystem;