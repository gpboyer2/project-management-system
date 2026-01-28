/**
 * 代码生成器主类
 * 整合配置解析、头文件生成和实现文件生成
 */

import { mkdir, writeFile, copyFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseConfigFile } from './config-parser.js';
import { CppHeaderGenerator } from './cpp-header-generator.js';
import { CppImplGenerator } from './cpp-impl-generator.js';
import { CppSerializerGenerator } from './cpp-serializer-generator.js';
import { TemplateManager } from './template-manager.js';
import { logger } from './logger.js';

// 获取当前文件的目录（ES Module 中需要手动实现 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 代码生成器主类
 */
export class CodeGenerator {
    /**
     * 初始化代码生成器
     *
     * @param {Object} config - 协议配置对象 (ProtocolConfig 实例)
     * @param {Object} options - 可选配置
     * @param {string} options.frameworkSrc - 公共头文件源路径（默认：../protocol_parser_framework/protocol_common.h）
     * @param {string} options.templateDir - 模板目录路径（默认：../templates）
     * @param {string} options.frameworkRelativePath - 框架头文件相对路径（默认：'./'，用于多层级目录结构）
     * @param {boolean} options.skipCopyFramework - 是否跳过复制框架文件（默认：false）
     */
    constructor(config, options = {}) {
        this.config = config;
        this.frameworkSrc = options.frameworkSrc || 
            path.normalize(path.join(__dirname, '../protocol_parser_framework/protocol_common.h'));
        this.frameworkRelativePath = options.frameworkRelativePath || './';
        this.skipCopyFramework = options.skipCopyFramework || false;
        this.templateManager = options.templateManager || 
            new TemplateManager(options.templateDir);

        // 如果配置已提供，更新 TemplateManager 的 protocolName 和 frameworkRelativePath
        if (this.config && this.templateManager) {
            this.templateManager.protocolName = this.config.name;
            this.templateManager.frameworkRelativePath = this.frameworkRelativePath;
        }
    }

    /**
     * 生成 C++ 头文件内容
     *
     * @returns {string} 头文件内容字符串
     */
    generateHeader() {
        if (!this.config) {
            throw new Error('Configuration not provided to constructor');
        }

        const generator = new CppHeaderGenerator(this.config, this.templateManager);
        return generator.generate();
    }

    /**
     * 生成 C++ 实现文件内容（包含解析和序列化）
     *
     * @returns {string} 实现文件内容字符串
     */
    generateImplementation() {
        if (!this.config) {
            throw new Error('Configuration not provided to constructor');
        }

        // 生成解析实现
        const parseGenerator = new CppImplGenerator(this.config, this.templateManager);
        const parseImpl = parseGenerator.generate();

        // 生成序列化实现
        const serializeGenerator = new CppSerializerGenerator(this.config, this.templateManager);
        const serializeImpl = serializeGenerator.generate();

        // 合并解析和序列化代码到一个文件
        // 移除解析代码末尾的命名空间结束标记
        const parseImplWithoutClosing = parseImpl.replace(/}\s*\/\/\s*namespace\s+protocol_parser\s*$/, '');

        // 拼接序列化代码和命名空间结束标记
        return parseImplWithoutClosing + '\n' + serializeImpl + '\n} // namespace protocol_parser\n';
    }

    /**
     * 生成 C++ 头文件和实现文件，并保存到指定目录
     *
     * @param {string} outputDir - 输出目录路径
     * @throws {Error} 生成文件失败
     */
    async generateFiles(outputDir) {
        if (!this.config) {
            throw new Error('Configuration not provided to constructor');
        }

        // 确保输出目录存在
        await mkdir(outputDir, { recursive: true });

        // 生成文件名
        const protocolName = this.config.name.toLowerCase();
        const headerFilename = `${protocolName}_parser.h`;
        const implFilename = `${protocolName}_parser.cpp`;

        const headerPath = path.join(outputDir, headerFilename);
        const implPath = path.join(outputDir, implFilename);

        // 生成头文件
        logger.log(`Generating header file: ${headerPath}`);
        const headerContent = this.generateHeader();
        await writeFile(headerPath, headerContent, 'utf-8');
        logger.log('[OK] Header file generation successful');

        // 生成实现文件
        logger.log(`Generating implementation file: ${implPath}`);
        const implContent = this.generateImplementation();
        await writeFile(implPath, implContent, 'utf-8');
        logger.log('[OK] Implementation file generation successful');

        // 复制公共头文件（如果未跳过）
        if (!this.skipCopyFramework) {
            await this._copyCommonFiles(outputDir);
        }
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
            logger.log(`Copying common header: ${this.frameworkSrc} -> ${commonHeaderDst}`);
            await copyFile(this.frameworkSrc, commonHeaderDst);
            logger.log('[OK] Common header copied successfully');

            // 检查是否需要复制 protocol_compression.h
            const needsCompression = this._checkIfCompressionNeeded();
            if (needsCompression) {
                const compressionHeaderSrc = path.join(path.dirname(this.frameworkSrc), 'protocol_compression.h');
                const compressionHeaderDst = path.join(frameworkDir, 'protocol_compression.h');

                logger.log(`Copying compression header: ${compressionHeaderSrc} -> ${compressionHeaderDst}`);
                await copyFile(compressionHeaderSrc, compressionHeaderDst);
                logger.log('[OK] Compression header copied successfully');
            }

            // 检查是否需要复制 protocol_timestamp.h
            const needsTimestamp = this._checkIfTimestampNeeded();
            if (needsTimestamp) {
                const timestampHeaderSrc = path.join(path.dirname(this.frameworkSrc), 'protocol_timestamp.h');
                const timestampHeaderDst = path.join(frameworkDir, 'protocol_timestamp.h');

                logger.log(`Copying timestamp header: ${timestampHeaderSrc} -> ${timestampHeaderDst}`);
                await copyFile(timestampHeaderSrc, timestampHeaderDst);
                logger.log('[OK] Timestamp header copied successfully');
            }

            // 检查是否需要复制 protocol_checksum.h
            const needsChecksum = this._checkIfChecksumNeeded();
            if (needsChecksum) {
                const checksumHeaderSrc = path.join(path.dirname(this.frameworkSrc), 'protocol_checksum.h');
                const checksumHeaderDst = path.join(frameworkDir, 'protocol_checksum.h');

                logger.log(`Copying checksum header: ${checksumHeaderSrc} -> ${checksumHeaderDst}`);
                await copyFile(checksumHeaderSrc, checksumHeaderDst);
                logger.log('[OK] Checksum header copied successfully');
            }
        } catch (e) {
            logger.error(`Warning: Failed to copy common headers - ${e.message}`);
            logger.error(`Please manually copy ${this.frameworkSrc} to ${path.join(outputDir, 'protocol_parser_framework/protocol_common.h')}`);
        }
    }

    /**
     * 检查协议是否需要压缩功能
     * @returns {boolean} 如果协议使用了压缩则返回 true
     * @private
     */
    _checkIfCompressionNeeded() {
        // 检查是否有报文级压缩
        if (this.config.messageCompression) {
            return true;
        }

        // 检查是否有字段级压缩（递归检查所有字段）
        const checkFieldCompression = (fields) => {
            for (const field of fields) {
                if (field.compression) {
                    return true;
                }
                // 递归检查嵌套字段
                if (field.fields && checkFieldCompression(field.fields)) {
                    return true;
                }
                if (field.elements && checkFieldCompression(field.elements)) {
                    return true;
                }
                if (field.cases) {
                    for (const caseKey in field.cases) {
                        const caseConfig = field.cases[caseKey];
                        if (caseConfig.fields && checkFieldCompression(caseConfig.fields)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        return checkFieldCompression(this.config.fields);
    }

    /**
     * 检查协议是否需要时间戳功能
     * @returns {boolean} 如果协议使用了 Timestamp 类型则返回 true
     * @private
     */
    _checkIfTimestampNeeded() {
        // 递归检查所有字段
        const checkFieldTimestamp = (fields) => {
            for (const field of fields) {
                if (field.type === 'Timestamp') {
                    return true;
                }
                // 递归检查嵌套字段
                if (field.fields && checkFieldTimestamp(field.fields)) {
                    return true;
                }
                if (field.elements && checkFieldTimestamp(field.elements)) {
                    return true;
                }
                if (field.cases) {
                    for (const caseKey in field.cases) {
                        const caseConfig = field.cases[caseKey];
                        if (caseConfig.fields && checkFieldTimestamp(caseConfig.fields)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        return checkFieldTimestamp(this.config.fields);
    }

    /**
     * 检查协议是否需要校验功能
     * @returns {boolean} 如果协议使用了 Checksum 类型则返回 true
     * @private
     */
    _checkIfChecksumNeeded() {
        // 递归检查所有字段
        const checkFieldChecksum = (fields) => {
            for (const field of fields) {
                if (field.type === 'Checksum') {
                    return true;
                }
                // 递归检查嵌套字段
                if (field.fields && checkFieldChecksum(field.fields)) {
                    return true;
                }
                if (field.elements && checkFieldChecksum(field.elements)) {
                    return true;
                }
                if (field.cases) {
                    for (const caseKey in field.cases) {
                        const caseConfig = field.cases[caseKey];
                        if (caseConfig.fields && checkFieldChecksum(caseConfig.fields)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        return checkFieldChecksum(this.config.fields);
    }

    /**
     * 打印协议配置摘要
     */
    printSummary() {
        if (this.config === null) {
            logger.error('Error: Configuration not loaded');
            return;
        }

        logger.log('\n' + '='.repeat(60));
        logger.log('Protocol Configuration Summary');
        logger.log('='.repeat(60));
        logger.log(`Protocol Name: ${this.config.name}`);
        logger.log(`Protocol Version: ${this.config.version}`);
        logger.log(`Description: ${this.config.description}`);
        logger.log(`Default Byte Order: ${this.config.defaultByteOrder}`);
        logger.log(`\nField Count: ${this.config.fields.length}`);

        // 打印结构体信息
        const structs = this.config.getAllStructs();
        if (structs.length > 0) {
            logger.log(`Struct Count: ${structs.length}`);
            for (const struct of structs) {
                const fieldName = struct.fieldName || '';
                const fieldCount = (struct.fields || []).length;
                logger.log(`  - ${fieldName}: ${fieldCount} sub-fields`);
            }
        }

        // 打印校验和信息
        const checksums = this.config.getChecksumFields();
        if (checksums.length > 0) {
            logger.log(`Checksum Fields: ${checksums.length}`);
            for (const checksum of checksums) {
                const fieldName = checksum.fieldName || '';
                const algorithm = checksum.algorithm || '';
                logger.log(`  - ${fieldName}: ${algorithm}`);
            }
        }

        logger.log('='.repeat(60) + '\n');
    }
}
