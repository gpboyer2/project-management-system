/**
 * 生成器工厂
 * 根据目标语言和配置类型创建对应的生成器实例
 *
 * 消除 main.js 中的 language × kind 双重分发逻辑
 */

import { CodeGenerator } from './code-generator.js';
import { DispatcherGenerator } from './dispatcher-generator.js';
import { SoftwareProcessor } from './software-processor.js';
import { PythonCodeGenerator, PythonDispatcherGenerator, PythonSoftwareProcessor } from './python-code-generator.js';

/**
 * 生成器工厂类
 */
export class GeneratorFactory {
    /**
     * 生成器注册表：language → kind → GeneratorClass
     * @type {Object.<string, Object.<string, Function>>}
     */
    static registry = {
        'cpp11': {
            'software': SoftwareProcessor,
            'dispatcher': DispatcherGenerator,
            'protocol': CodeGenerator
        },
        'python': {
            'software': PythonSoftwareProcessor,
            'dispatcher': PythonDispatcherGenerator,
            'protocol': PythonCodeGenerator
        }
    };

    /**
     * 创建生成器实例
     * @param {string} language - 目标语言 ('cpp11' | 'python')
     * @param {string} kind - 配置类型 ('software' | 'dispatcher' | 'protocol')
     * @param {Object} config - 配置对象
     * @param {Object} options - 生成器选项
     * @returns {Object} 生成器实例
     * @throws {Error} 不支持的语言或配置类型
     */
    static create(language, kind, config, options) {
        const langRegistry = this.registry[language];
        if (!langRegistry) {
            const supported = Object.keys(this.registry).join(', ');
            throw new Error(`Unsupported language: "${language}". Supported: ${supported}`);
        }

        const GeneratorClass = langRegistry[kind];
        if (!GeneratorClass) {
            const supported = Object.keys(langRegistry).join(', ');
            throw new Error(`Unknown config kind: "${kind}" for language "${language}". Supported: ${supported}`);
        }

        return new GeneratorClass(config, options);
    }

    /**
     * 注册新的生成器（用于扩展）
     * @param {string} language - 语言标识
     * @param {string} kind - 配置类型
     * @param {Function} GeneratorClass - 生成器类
     */
    static register(language, kind, GeneratorClass) {
        if (!this.registry[language]) {
            this.registry[language] = {};
        }
        this.registry[language][kind] = GeneratorClass;
    }

    /**
     * 获取支持的语言列表
     * @returns {string[]} 语言列表
     */
    static getSupportedLanguages() {
        return Object.keys(this.registry);
    }

    /**
     * 获取指定语言支持的配置类型
     * @param {string} language - 语言标识
     * @returns {string[]} 配置类型列表
     */
    static getSupportedKinds(language) {
        const langRegistry = this.registry[language];
        return langRegistry ? Object.keys(langRegistry) : [];
    }
}
