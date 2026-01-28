/**
 * 分发器代码生成器
 * 用于生成协议分发器的 C++ 头文件和实现文件
 */

import { mkdir, writeFile, copyFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { DispatcherConfig } from './config-parser.js';
import { CodeGenerator } from './code-generator.js';
import { TemplateManager } from './template-manager.js';
import { logger } from './logger.js';

// 获取当前文件的目录（ES Module 中需要手动实现 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 分发器代码生成器类
 */
export class DispatcherGenerator {
    /**
     * 初始化分发器生成器
     *
     * @param {DispatcherConfig} dispatcherConfig - 已解析的分发器配置对象
     *        要求 dispatcherConfig.isFullyResolved() 返回 true（所有子协议已内联）
     * @param {Object} options - 可选配置
     * @param {string} options.frameworkSrc - 公共头文件源路径
     * @param {string} options.templateDir - 模板目录路径
     * @param {string} options.frameworkRelativePath - 框架头文件相对路径（默认：'./'，用于多层级目录结构）
     * @param {boolean} options.skipCopyFramework - 是否跳过复制框架文件（默认：false）
     */
    constructor(dispatcherConfig, options = {}) {
        this.dispatcherConfig = dispatcherConfig;
        this.frameworkSrc = options.frameworkSrc ||
            path.normalize(path.join(__dirname, '../protocol_parser_framework/protocol_common.h'));
        this.frameworkRelativePath = options.frameworkRelativePath || './';
        this.skipCopyFramework = options.skipCopyFramework || false;
        this.templateDir = options.templateDir;
        this.templateManager = options.templateManager ||
            new TemplateManager(options.templateDir);

        // 设置模板管理器的框架相对路径
        this.templateManager.frameworkRelativePath = this.frameworkRelativePath;

        // 存储子协议信息（用于模板渲染）
        this.subProtocolInfos = [];
        this._prepareSubProtocolInfos();
    }

    /**
     * 准备子协议信息（从 DispatcherConfig 中提取）
     * @private
     */
    _prepareSubProtocolInfos() {
        const messageList = this.dispatcherConfig.getMessageList();

        for (const msg of messageList) {
            // 从 DispatcherConfig 获取已解析的子协议配置
            const config = msg.config;

            if (!config) {
                console.warn(`Warning: No configuration found for message ID ${msg.id}`);
                continue;
            }

            const protocolName = config.name;

            // 估算协议大小（字节）
            const estimatedSize = this._estimateProtocolSize(config);

            // 大协议阈值：1024 字节 (1KB)
            // 超过此阈值的协议在 union 中使用 std::unique_ptr 存储
            const LARGE_PROTOCOL_THRESHOLD = 1024;
            const isLarge = estimatedSize > LARGE_PROTOCOL_THRESHOLD;

            if (isLarge) {
                logger.log(`  - Protocol "${protocolName}" is large (${estimatedSize} bytes), will use pointer storage`);
            }

            const subProtocolInfo = {
                id_value: msg.idValue,
                id_hex: msg.id.toLowerCase().startsWith('0x') ? msg.id : `0x${msg.idValue.toString(16).toUpperCase()}`,
                enum_name: DispatcherConfig.generateEnumName(protocolName),
                protocol_name: protocolName,
                result_type: `${protocolName}Result`,
                member_name: DispatcherConfig.generateMemberName(protocolName),
                header_file: `${protocolName.toLowerCase()}_parser.h`,
                is_large: isLarge,
                estimated_size: estimatedSize
            };

            this.subProtocolInfos.push(subProtocolInfo);
        }
    }

    /**
     * 估算协议结构体大小（字节）
     *
     * 这是一个保守估算，用于判断是否需要使用指针存储
     * 对于无法准确估算的情况，返回一个保守值
     *
     * @param {ProtocolConfig} config - 协议配置对象
     * @returns {number} 估算的字节数
     * @private
     */
    _estimateProtocolSize(config) {
        if (!config.fields || config.fields.length === 0) {
            return 0;
        }

        let totalSize = 0;

        for (const field of config.fields) {
            totalSize += this._estimateFieldSize(field);
        }

        return totalSize;
    }

    /**
     * 估算单个字段大小（字节）
     *
     * @param {Object} field - 字段定义
     * @returns {number} 估算的字节数
     * @private
     */
    _estimateFieldSize(field) {
        const type = field.type;

        switch (type) {
            case 'UnsignedInt':
            case 'SignedInt':
            case 'MessageId':
                return field.byteLength || 0;

            case 'Float':
                return field.byteLength || 4;

            case 'Bcd':
                return field.byteLength || 0;

            case 'Timestamp':
                return field.byteLength || 8;

            case 'String':
                // 固定长度字符串
                if (field.length && field.length > 0) {
                    return field.length;
                }
                // 变长字符串：保守估计 256 字节
                return 256;

            case 'Padding':
            case 'Reserved':
                return field.byteLength || 0;

            case 'Bitfield':
                return field.byteLength || 0;

            case 'Encode':
            case 'Bytes':
                return field.byteLength || 0;

            case 'Checksum':
                return field.byteLength || 0;

            case 'Struct':
                // 递归估算结构体大小
                if (field.fields && field.fields.length > 0) {
                    let structSize = 0;
                    for (const subField of field.fields) {
                        structSize += this._estimateFieldSize(subField);
                    }
                    return structSize;
                }
                return 0;

            case 'Array':
                // 数组大小 = 元素大小 × 数组长度
                const elementSize = field.elementType ?
                    this._estimateFieldSize({ type: field.elementType, ...field.element }) : 8;
                const arrayLength = field.fixedLength || field.maxLength || 10; // 默认估算 10 个元素
                return elementSize * arrayLength;

            case 'Command':
                // Command 字段：取所有分支中最大的
                if (field.cases) {
                    let maxCaseSize = 0;
                    for (const caseKey in field.cases) {
                        const caseFields = field.cases[caseKey].fields || [];
                        let caseSize = 0;
                        for (const caseField of caseFields) {
                            caseSize += this._estimateFieldSize(caseField);
                        }
                        maxCaseSize = Math.max(maxCaseSize, caseSize);
                    }
                    return (field.byteLength || 0) + maxCaseSize;
                }
                return field.byteLength || 0;

            default:
                // 未知类型：保守估计 8 字节
                return 8;
        }
    }

    /**
     * 生成所有文件（主入口）
     *
     * @param {string} outputDir - 输出目录路径
     */
    async generateFiles(outputDir) {
        // 确保输出目录存在
        await mkdir(outputDir, { recursive: true });

        logger.log('='.repeat(60));
        logger.log('Dispatcher Code Generation');
        logger.log('='.repeat(60));
        logger.log(`Dispatcher Name: ${this.dispatcherConfig.protocolName}`);
        logger.log(`Output Directory: ${outputDir}`);
        logger.log('='.repeat(60) + '\n');

        // 打印config配置，进行调试
        console.debug('Dispatcher Config:', JSON.stringify(this.dispatcherConfig, null, 2));

        // 1. 生成所有子协议代码
        logger.log('Step 1: Generating sub-protocol code...');
        await this.generateSubProtocols(outputDir);
        logger.log('[OK] Sub-protocol code generation completed\n');

        // 2. 生成分发器头文件
        logger.log('Step 2: Generating dispatcher header...');
        await this.generateDispatcherHeader(outputDir);
        logger.log('[OK] Dispatcher header generation completed\n');

        // 3. 生成分发器实现文件
        logger.log('Step 3: Generating dispatcher implementation...');
        await this.generateDispatcherImpl(outputDir);
        logger.log('[OK] Dispatcher implementation generation completed\n');

        // 4. 复制公共头文件（如果未跳过）
        if (!this.skipCopyFramework) {
            logger.log('Step 4: Copying common headers...');
            await this._copyCommonFiles(outputDir);
            logger.log('[OK] Common headers copied successfully\n');
        } else {
            logger.log('Step 4: Skipping framework file copy (handled by parent processor)\n');
        }

        logger.log('='.repeat(60));
        logger.log('Dispatcher code generation completed!');
        logger.log('='.repeat(60));
    }

    /**
     * 生成所有子协议代码
     *
     * @param {string} outputDir - 输出目录路径
     */
    async generateSubProtocols(outputDir) {
        const messageList = this.dispatcherConfig.getMessageList();

        for (const msg of messageList) {
            // 从 DispatcherConfig 获取已解析的子协议配置
            const config = msg.config;

            console.debug('Sub Protocol Config:', JSON.stringify(config, null, 2));
            
            if (!config) {
                // Warning 已经在构造函数中输出过了，这里跳过
                continue;
            }

            logger.log(`  - Processing sub-protocol: ${msg.id} -> ${config.name}`);

            // 创建子协议代码生成器
            // 传递 frameworkRelativePath 和 skipCopyFramework 参数
            const generator = new CodeGenerator(config, {
                frameworkSrc: this.frameworkSrc,
                templateDir: this.templateDir,
                frameworkRelativePath: this.frameworkRelativePath,
                skipCopyFramework: true  // 子协议不需要复制框架文件，由分发器统一复制
            });

            // 生成子协议代码（头文件和实现文件）
            await generator.generateFiles(outputDir);
        }
    }

    /**
     * 生成分发器头文件
     *
     * @param {string} outputDir - 输出目录路径
     */
    async generateDispatcherHeader(outputDir) {
        const headerContent = this.templateManager.renderDispatcherHeader(
            this.dispatcherConfig,
            this.subProtocolInfos
        );

        const headerFilename = `${this.dispatcherConfig.protocolName.toLowerCase()}_dispatcher.h`;
        const headerPath = path.join(outputDir, headerFilename);

        logger.log(`  - Writing file: ${headerPath}`);
        await writeFile(headerPath, headerContent, 'utf-8');
    }

    /**
     * 生成分发器实现文件
     *
     * @param {string} outputDir - 输出目录路径
     */
    async generateDispatcherImpl(outputDir) {
        const implContent = this.templateManager.renderDispatcherImpl(
            this.dispatcherConfig,
            this.subProtocolInfos
        );

        const implFilename = `${this.dispatcherConfig.protocolName.toLowerCase()}_dispatcher.cpp`;
        const implPath = path.join(outputDir, implFilename);

        logger.log(`  - Writing file: ${implPath}`);
        await writeFile(implPath, implContent, 'utf-8');
    }

    /**
     * 复制公共头文件到输出目录
     *
     * @param {string} outputDir - 输出目录路径
     */
    async _copyCommonFiles(outputDir) {
        try {
            // 确定目标目录和文件路径
            const frameworkDir = path.join(outputDir, 'protocol_parser_framework');
            await mkdir(frameworkDir, { recursive: true });

            const commonHeaderDst = path.join(frameworkDir, 'protocol_common.h');

            // 复制 protocol_common.h
            logger.log(`  - Copying: ${this.frameworkSrc} -> ${commonHeaderDst}`);
            await copyFile(this.frameworkSrc, commonHeaderDst);
        } catch (e) {
            logger.error(`Warning: Failed to copy common headers - ${e.message}`);
            logger.error(`Please manually copy ${this.frameworkSrc} to ${path.join(outputDir, 'protocol_parser_framework/protocol_common.h')}`);
        }
    }

    /**
     * 打印分发器配置摘要
     */
    printSummary() {
        logger.log('\n' + '='.repeat(60));
        logger.log('Dispatcher Configuration Summary');
        logger.log('='.repeat(60));
        logger.log(`Dispatcher Name: ${this.dispatcherConfig.protocolName}`);
        logger.log(`Dispatch Field: ${this.dispatcherConfig.getDispatchFieldName()}`);
        logger.log(`Dispatch Field Type: ${this.dispatcherConfig.getDispatchFieldType()}`);
        logger.log(`Dispatch Field Offset: ${this.dispatcherConfig.getDispatchOffset()} bytes`);
        logger.log(`Dispatch Field Size: ${this.dispatcherConfig.getDispatchSize()} bytes`);
        logger.log(`Dispatch Field Byte Order: ${this.dispatcherConfig.getDispatchByteOrder()}`);
        logger.log(`\nMessage Mapping Count: ${Object.keys(this.dispatcherConfig.messages).length}`);

        const messageList = this.dispatcherConfig.getMessageList();
        for (const msg of messageList) {
            // 显示协议名称（如果已解析）或路径
            const displayName = msg.config ? msg.config.name : (msg.path || 'Unknown');
            logger.log(`  - ${msg.id} (${msg.idValue}) -> ${displayName}`);
        }

        logger.log('='.repeat(60) + '\n');
    }
}

