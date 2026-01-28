/**
 * 软件配置处理器
 * 用于处理多层级软件配置，遍历通信节点和图元，调用相应的代码生成器
 */

import { mkdir, writeFile, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { SoftwareConfig, ProtocolConfig, DispatcherConfig } from './config-parser.js';
import { CodeGenerator } from './code-generator.js';
import { DispatcherGenerator } from './dispatcher-generator.js';
import { TemplateManager } from './template-manager.js';
import { logger } from './logger.js';

// 获取当前文件的目录（ES Module 中需要手动实现 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 软件配置处理器类
 */
export class SoftwareProcessor {
    /**
     * 初始化软件处理器
     *
     * @param {SoftwareConfig} softwareConfig - 已解析的软件配置对象
     * @param {Object} options - 可选配置
     * @param {string} options.frameworkSrc - 公共头文件源路径
     * @param {string} options.templateDir - 模板目录路径
     */
    constructor(softwareConfig, options = {}) {
        this.softwareConfig = softwareConfig;
        this.frameworkSrc = options.frameworkSrc ||
            path.normalize(path.join(__dirname, '../protocol_parser_framework/protocol_common.h'));
        this.templateDir = options.templateDir;
        this.templateManager = new TemplateManager(options.templateDir);

        // 存储生成的文件信息（用于生成接口文件）
        this.generatedFiles = [];
    }

    /**
     * 生成所有文件（主入口）
     *
     * @param {string} outputDir - 输出目录路径
     */
    async generateFiles(outputDir) {
        const softwareName = this.softwareConfig.softwareName;
        const softwareDir = path.join(outputDir, softwareName);

        // 确保软件根目录存在
        await mkdir(softwareDir, { recursive: true });

        logger.log('='.repeat(60));
        logger.log('Software Code Generation');
        logger.log('='.repeat(60));
        logger.log(`Software Name: ${softwareName}`);
        logger.log(`Output Directory: ${softwareDir}`);
        logger.log(`Total Communication Nodes: ${this.softwareConfig.commNodeList.length}`);
        logger.log(`Total Nodes: ${this.softwareConfig.getTotalNodeCount()}`);
        logger.log('='.repeat(60) + '\n');

        // 1. 复制框架文件到软件根目录
        logger.log('Step 1: Copying framework files...');
        await this._copyFrameworkFiles(softwareDir);
        logger.log('[OK] Framework files copied\n');

        // 2. 遍历通信节点，生成代码
        logger.log('Step 2: Processing communication nodes...');
        for (const commNode of this.softwareConfig.commNodeList) {
            await this._processCommNode(commNode, softwareDir);
        }
        logger.log('[OK] All nodes processed\n');

        // 3. 生成软件级接口头文件
        logger.log('Step 3: Generating interface header...');
        await this._generateInterfaceHeader(softwareDir);
        logger.log('[OK] Interface header generated\n');

        logger.log('='.repeat(60));
        logger.log('Software code generation completed!');
        logger.log('='.repeat(60));
    }

    /**
     * 处理单个通信节点
     *
     * @param {Object} commNode - 通信节点配置
     * @param {string} softwareDir - 软件根目录
     * @private
     */
    async _processCommNode(commNode, softwareDir) {
        const commNodeId = commNode.id;
        const commNodeName = commNode.name || commNodeId;
        const commNodeDir = path.join(softwareDir, commNodeId);

        logger.log(`\n  Processing CommNode: ${commNodeId} (${commNodeName})`);

        // 确保通信节点目录存在
        await mkdir(commNodeDir, { recursive: true });

        // 遍历该通信节点下的所有图元
        for (const node of commNode.nodeList) {
            await this._processNode(node, commNodeDir, commNodeId);
        }
    }

    /**
     * 处理单个图元
     *
     * @param {Object} node - 图元配置
     * @param {string} commNodeDir - 通信节点目录
     * @param {string} commNodeId - 通信节点 ID
     * @private
     */
    async _processNode(node, commNodeDir, commNodeId) {
        const nodeId = node.id;
        const protocolName = node.protocolName;
        const nodeDir = path.join(commNodeDir, nodeId);
        const mode = node.dispatch.mode || 'multiple';  // 默认为 multiple

        logger.log(`    Processing Node: ${nodeId} (${protocolName}) - mode: ${mode}`);

        // 确保图元目录存在
        await mkdir(nodeDir, { recursive: true });

        // 计算框架头文件的相对路径（从图元目录到软件根目录）
        // 图元路径: softwareDir/commNodeId/nodeId/
        // 框架路径: softwareDir/protocol_parser_framework/
        // 相对路径: ../../
        const frameworkRelativePath = '../../';

        if (mode === 'single') {
            // 单协议模式：从 messages 中取出唯一的协议配置
            await this._processSingleProtocol(node, nodeDir, frameworkRelativePath, commNodeId, nodeId);
        } else {
            // 多协议模式（分发器）
            await this._processDispatcher(node, nodeDir, frameworkRelativePath, commNodeId, nodeId);
        }
    }

    /**
     * 处理单协议模式
     *
     * @param {Object} node - 图元配置
     * @param {string} nodeDir - 图元目录
     * @param {string} frameworkRelativePath - 框架头文件相对路径
     * @param {string} commNodeId - 通信节点 ID
     * @param {string} nodeId - 图元 ID
     * @private
     */
    async _processSingleProtocol(node, nodeDir, frameworkRelativePath, commNodeId, nodeId) {
        // 从 messages 中取出唯一的协议配置
        const messageIds = Object.keys(node.messages);
        if (messageIds.length === 0) {
            throw new Error(`Node "${node.id}" has no messages in single mode`);
        }

        // 取第一个协议配置
        const protocolConfig = node.messages[messageIds[0]];
        const config = new ProtocolConfig(protocolConfig);

        // 创建代码生成器
        const generator = new CodeGenerator(config, {
            frameworkSrc: this.frameworkSrc,
            templateDir: this.templateDir,
            frameworkRelativePath: frameworkRelativePath,
            skipCopyFramework: true  // 框架文件已在软件根目录复制
        });

        // 生成代码
        await generator.generateFiles(nodeDir);

        // 记录生成的文件
        const headerFile = `${config.name.toLowerCase()}_parser.h`;
        this.generatedFiles.push({
            commNodeId,
            nodeId,
            protocolName: node.protocolName,
            mode: 'single',
            headerFile: path.join(commNodeId, nodeId, headerFile),
            isDispatcher: false
        });
    }

    /**
     * 处理分发器模式
     *
     * @param {Object} node - 图元配置
     * @param {string} nodeDir - 图元目录
     * @param {string} frameworkRelativePath - 框架头文件相对路径
     * @param {string} commNodeId - 通信节点 ID
     * @param {string} nodeId - 图元 ID
     * @private
     */
    async _processDispatcher(node, nodeDir, frameworkRelativePath, commNodeId, nodeId) {
        // 构建分发器配置对象
        const dispatcherConfigDict = {
            protocolName: node.protocolName,
            description: node.description || '',
            dispatch: {
                field: node.dispatch.field,
                type: node.dispatch.type,
                byteOrder: node.dispatch.byteOrder,
                offset: node.dispatch.offset,
                size: node.dispatch.size
            },
            messages: node.messages
        };

        const config = new DispatcherConfig(dispatcherConfigDict);
        config.validate();

        // 创建分发器生成器
        const generator = new DispatcherGenerator(config, {
            frameworkSrc: this.frameworkSrc,
            templateDir: this.templateDir,
            frameworkRelativePath: frameworkRelativePath,
            skipCopyFramework: true  // 框架文件已在软件根目录复制
        });

        // 生成代码
        await generator.generateFiles(nodeDir);

        // 记录生成的文件
        const headerFile = `${node.protocolName.toLowerCase()}_dispatcher.h`;
        this.generatedFiles.push({
            commNodeId,
            nodeId,
            protocolName: node.protocolName,
            mode: 'multiple',
            headerFile: path.join(commNodeId, nodeId, headerFile),
            isDispatcher: true
        });
    }

    /**
     * 复制框架文件到软件根目录
     *
     * @param {string} softwareDir - 软件根目录
     * @private
     */
    async _copyFrameworkFiles(softwareDir) {
        const frameworkDir = path.join(softwareDir, 'protocol_parser_framework');
        await mkdir(frameworkDir, { recursive: true });

        // 复制 protocol_common.h
        const commonHeaderSrc = this.frameworkSrc;
        const commonHeaderDst = path.join(frameworkDir, 'protocol_common.h');
        logger.log(`  - Copying: protocol_common.h`);
        await copyFile(commonHeaderSrc, commonHeaderDst);

        // 检查并复制其他可能需要的头文件
        const frameworkSrcDir = path.dirname(this.frameworkSrc);

        // protocol_timestamp.h
        const timestampSrc = path.join(frameworkSrcDir, 'protocol_timestamp.h');
        if (existsSync(timestampSrc)) {
            const timestampDst = path.join(frameworkDir, 'protocol_timestamp.h');
            logger.log(`  - Copying: protocol_timestamp.h`);
            await copyFile(timestampSrc, timestampDst);
        }

        // protocol_checksum.h
        const checksumSrc = path.join(frameworkSrcDir, 'protocol_checksum.h');
        if (existsSync(checksumSrc)) {
            const checksumDst = path.join(frameworkDir, 'protocol_checksum.h');
            logger.log(`  - Copying: protocol_checksum.h`);
            await copyFile(checksumSrc, checksumDst);
        }
    }

    /**
     * 生成软件级接口头文件
     *
     * @param {string} softwareDir - 软件根目录
     * @private
     */
    async _generateInterfaceHeader(softwareDir) {
        const softwareName = this.softwareConfig.softwareName;
        const headerFilename = `${softwareName}_interface.h`;
        const headerPath = path.join(softwareDir, headerFilename);

        // 生成头文件守卫
        const guardName = `${softwareName.toUpperCase()}_INTERFACE_H`;

        // 生成 include 列表
        const includes = this.generatedFiles.map(file => {
            return `#include "./${file.headerFile.replace(/\\/g, '/')}"`;
        });

        // 按通信节点分组注释
        const commNodeGroups = {};
        for (const file of this.generatedFiles) {
            if (!commNodeGroups[file.commNodeId]) {
                commNodeGroups[file.commNodeId] = [];
            }
            commNodeGroups[file.commNodeId].push(file);
        }

        // 生成带注释的 include 列表
        let includeBlock = '';
        for (const [commNodeId, files] of Object.entries(commNodeGroups)) {
            const commNode = this.softwareConfig.commNodeList.find(cn => cn.id === commNodeId);
            const commNodeName = commNode ? (commNode.name || commNodeId) : commNodeId;
            const commNodeType = commNode ? (commNode.type || 'Unknown') : 'Unknown';

            includeBlock += `// Communication Node: ${commNodeId} (${commNodeName}, ${commNodeType})\n`;
            for (const file of files) {
                const modeComment = file.isDispatcher ? 'dispatcher' : 'parser';
                includeBlock += `#include "./${file.headerFile.replace(/\\/g, '/')}"  // ${file.protocolName} (${modeComment})\n`;
            }
            includeBlock += '\n';
        }

        // 生成头文件内容
        const content = `/**
 * ${softwareName} Interface Header
 * Auto-generated software-level interface header
 * 
 * This file aggregates all protocol headers for the software.
 * Include this single file to access all protocol parsers and dispatchers.
 * 
 * Software: ${softwareName}
 * Description: ${this.softwareConfig.description || 'N/A'}
 * Total Communication Nodes: ${this.softwareConfig.commNodeList.length}
 * Total Nodes: ${this.softwareConfig.getTotalNodeCount()}
 */

#ifndef ${guardName}
#define ${guardName}

// ============================================================================
// Framework Headers
// ============================================================================
#include "./protocol_parser_framework/protocol_common.h"

// ============================================================================
// Protocol Headers
// ============================================================================
${includeBlock.trim()}

#endif // ${guardName}
`;

        logger.log(`  - Writing: ${headerPath}`);
        await writeFile(headerPath, content, 'utf-8');
    }

    /**
     * 打印软件配置摘要
     */
    printSummary() {
        logger.log('\n' + '='.repeat(60));
        logger.log('Software Configuration Summary');
        logger.log('='.repeat(60));
        logger.log(`Software Name: ${this.softwareConfig.softwareName}`);
        logger.log(`Description: ${this.softwareConfig.description || 'N/A'}`);
        logger.log(`\nCommunication Nodes: ${this.softwareConfig.commNodeList.length}`);

        for (const commNode of this.softwareConfig.commNodeList) {
            logger.log(`\n  - ${commNode.id} (${commNode.name || 'N/A'}, ${commNode.type || 'Unknown'})`);
            logger.log(`    Nodes: ${commNode.nodeList.length}`);
            for (const node of commNode.nodeList) {
                const mode = node.dispatch.mode || 'multiple';
                const messageCount = Object.keys(node.messages).length;
                logger.log(`      - ${node.id}: ${node.protocolName} (${mode}, ${messageCount} message(s))`);
            }
        }

        logger.log('\n' + '='.repeat(60));
    }
}

