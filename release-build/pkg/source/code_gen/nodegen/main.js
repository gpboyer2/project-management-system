#!/usr/bin/env node

/**
 * 协议代码生成系统主程序
 * 用于从 JSON 配置文件生成 C++ 协议解析代码
 * 
 * 支持两种输入模式：
 * 1. 文件模式：传入配置文件路径，支持分发器配置中的路径引用（自动加载）
 * 2. JSON 模式：传入 JSON 字符串，要求配置已经是完整的内联格式
 * 
 * 职责：
 * - 读取配置（从文件或 JSON 字符串）
 * - 如果是分发器配置且子协议是路径引用，则加载子协议文件并转换为内联格式
 * - 将完整的配置对象传递给 Generator
 */

import { Command } from 'commander';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createInterface } from 'readline';
import { parseConfigObject } from './config-parser.js';
import { GeneratorFactory } from './generator-factory.js';
import { logger } from './logger.js';

// 获取当前文件的目录（ES Module 中需要手动实现 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 读取 package.json 中的版本号
 */
function getPackageVersion() {
    try {
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        return packageJson.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
}

/**
 * 读取并解析 JSON 文件
 * @param {string} filePath - JSON 文件路径
 * @returns {Object} 解析后的 JSON 对象
 */
function readJsonFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    try {
        return JSON.parse(content);
    } catch (err) {
        throw new Error(`JSON format error in ${filePath}: ${err.message}`);
    }
}

/**
 * 解析 JSON 字符串
 * @param {string} jsonString - JSON 字符串
 * @returns {Object} 解析后的 JSON 对象
 */
function parseJsonString(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        throw new Error(`JSON format error: ${err.message}`);
    }
}

/**
 * 从标准输入读取所有内容
 * @returns {Promise<string>} 读取到的内容
 */
function readFromStdin() {
    return new Promise((resolve, reject) => {
        let data = '';
        
        // 检查是否有管道输入
        if (process.stdin.isTTY) {
            reject(new Error('No data piped to stdin. Use: cat config.json | node main.js --json -'));
            return;
        }

        process.stdin.setEncoding('utf-8');
        
        process.stdin.on('data', (chunk) => {
            data += chunk;
        });

        process.stdin.on('end', () => {
            resolve(data);
        });

        process.stdin.on('error', (err) => {
            reject(new Error(`Error reading from stdin: ${err.message}`));
        });

        // 设置超时，防止无限等待
        const timeout = setTimeout(() => {
            reject(new Error('Timeout reading from stdin (10s). Make sure to pipe data to the command.'));
        }, 10000);

        process.stdin.on('end', () => {
            clearTimeout(timeout);
        });
    });
}

/**
 * 检测配置类型
 * @param {Object} configDict - 配置字典
 * @returns {'software' | 'dispatcher' | 'protocol'} 配置类型
 */
function detectConfigType(configDict) {
    // 如果存在 softwareName 和 commNodeList 字段，则为软件配置
    if (configDict.softwareName && configDict.commNodeList) {
        return 'software';
    }
    // 如果存在 dispatch 和 messages 字段，则为分发器配置
    if (configDict.dispatch && configDict.messages) {
        return 'dispatcher';
    }
    // 否则为单协议配置
    return 'protocol';
}

/**
 * 加载分发器配置，将路径引用的子协议转换为内联格式
 * 仅在文件模式下使用
 * @param {string} configFilePath - 主配置文件路径
 * @param {Object} rawConfig - 原始配置对象
 * @returns {Object} 转换后的配置对象（所有子协议都是内联格式）
 */
function loadDispatcherConfigFromFile(configFilePath, rawConfig) {
    const configDir = path.dirname(path.resolve(configFilePath));
    const normalizedConfig = { ...rawConfig };
    const normalizedMessages = {};

    for (const [id, value] of Object.entries(rawConfig.messages)) {
        if (typeof value === 'string') {
            // 路径引用，加载子协议文件
            const subConfigPath = path.resolve(configDir, value);
            
            if (!existsSync(subConfigPath)) {
                throw new Error(`Sub-protocol config file not found: ${subConfigPath} (referenced by message ID ${id})`);
            }
            
            logger.log(`  - Loading sub-protocol: ${id} -> ${subConfigPath}`);
            const subConfig = readJsonFile(subConfigPath);
            
            // 验证子协议配置
            if (!subConfig.name || !subConfig.fields) {
                throw new Error(`Invalid sub-protocol config ${subConfigPath}: missing "name" or "fields"`);
            }
            
            normalizedMessages[id] = subConfig;
        } else if (typeof value === 'object' && value !== null) {
            // 已经是内联格式
            normalizedMessages[id] = value;
        } else {
            throw new Error(`Invalid message config for ID "${id}": expected object or path string`);
        }
    }

    normalizedConfig.messages = normalizedMessages;
    return normalizedConfig;
}

/**
 * 验证 JSON 模式下的分发器配置（所有子协议必须是内联格式）
 * @param {Object} rawConfig - 原始配置对象
 * @throws {Error} 如果存在路径引用
 */
function validateInlineDispatcherConfig(rawConfig) {
    for (const [id, value] of Object.entries(rawConfig.messages)) {
        if (typeof value === 'string') {
            throw new Error(
                `JSON mode does not support path references. ` +
                `Message ID "${id}" contains a path reference "${value}". ` +
                `Please provide inline protocol configuration.`
            );
        }
        if (typeof value !== 'object' || value === null) {
            throw new Error(`Invalid message config for ID "${id}": expected inline protocol object`);
        }
        if (!value.name || !value.fields) {
            throw new Error(`Invalid inline protocol config for message ID "${id}": missing "name" or "fields"`);
        }
    }
}

/**
 * 执行代码生成的核心逻辑
 * @param {Object} rawConfig - 原始配置对象
 * @param {Object} options - 命令行选项
 * @param {string} outputDir - 输出目录
 * @param {string|null} configFilePath - 配置文件路径（JSON 模式下为 null）
 * @param {string} inputMode - 输入模式 ('file' | 'json')
 */
async function executeGeneration(rawConfig, options, outputDir, configFilePath, inputMode) {
    const configType = detectConfigType(rawConfig);

    // ============================================================
    // 第一步：根据类型和模式进行预处理
    // ============================================================
    let normalizedConfig;
    
    if (configType === 'software') {
        // 软件配置：直接使用（子协议已内联）
        logger.log('Detected software configuration...');
        normalizedConfig = rawConfig;
    } else if (configType === 'dispatcher') {
        if (inputMode === 'file') {
            // 文件模式：加载所有子协议文件，转换为内联格式
            logger.log('Detected dispatcher configuration, loading sub-protocols...');
            normalizedConfig = loadDispatcherConfigFromFile(configFilePath, rawConfig);
        } else {
            // JSON 模式：验证所有子协议都是内联格式
            logger.log('Detected dispatcher configuration (JSON mode)...');
            validateInlineDispatcherConfig(rawConfig);
            normalizedConfig = rawConfig;
        }
    } else {
        // 单协议配置：直接使用
        normalizedConfig = rawConfig;
    }

    // ============================================================
    // 第二步：使用 parseConfigObject 进行验证和转换
    // ============================================================
    const { kind, config } = parseConfigObject(normalizedConfig);

    logger.log('Configuration loaded successfully\n');

    // 准备生成器选项
    const generatorOptions = {
        language: options.language,
        platform: options.platform,
        cppSdk: options.cppSdk
    };
    if (options.templateDir) generatorOptions.templateDir = options.templateDir;
    if (options.frameworkSrc) generatorOptions.frameworkSrc = options.frameworkSrc;

    // ============================================================
    // 第三步：使用工厂模式创建生成器并生成代码
    // ============================================================
    const generator = GeneratorFactory.create(
        options.language,
        kind,
        config,
        generatorOptions
    );

    // 打印配置摘要
    generator.printSummary();

    // 如果只显示摘要，则退出
    if (options.summaryOnly) {
        logger.log('(Summary-only mode, no files generated)');
        return;
    }

    // 生成文件
    logger.log(`Starting ${kind} generation process...\n`);
    await generator.generateFiles(outputDir);

    logger.log('\n' + '='.repeat(60));
    logger.log('Code generation completed!');
    logger.log('='.repeat(60));
}

/**
 * 主函数
 */
async function main() {
    // 创建命令行程序
    const program = new Command();

    program
        .name('protocol-code-generator')
        .description('协议代码生成系统 - 从 JSON 配置生成 C++ 解析代码')
        .version(getPackageVersion())
        .argument('[config-file]', 'JSON 配置文件路径（与 --json 选项互斥）')
        .option('-j, --json <json-string>', 'JSON 配置字符串，使用 "-" 从标准输入读取（与文件路径参数互斥，要求内联格式）')
        .option('-o, --output <dir>', '输出目录路径（相对于当前工作目录）', './generated_code')
        .option('-s, --summary-only', '仅显示配置摘要，不生成文件', false)
        .option('-v, --verbose', '显示详细信息', false)
        .option('--log-level <level>', '日志级别 (error/warn/info/debug)', 'info')
        .option('--log-output <mode>', '日志输出模式: console（控制台）, file（文件）, both（两者）', 'console')
        .option('--log-file <path>', '日志文件路径（当 log-output=file 或 both 时生效）', 'nodegen.log')
        .option('--template-dir <dir>', '模板目录路径（覆盖默认值）')
        .option('--framework-src <path>', '公共头文件源路径（覆盖默认值）')
        .option('--language <lang>', '目标语言标准 (cpp11, python)', 'cpp11')
        .option('--platform <platform>', '目标平台 (目前仅支持 linux-x86_64)', 'linux-x86_64')
        .option('--cpp-sdk', '生成 C++ SDK (默认启用)', true)
        .option('--no-cpp-sdk', '禁用 C++ SDK 生成')
        .addHelpText('after', `
示例用法:
  # 单协议配置：从配置文件生成代码
  node main.js protocol.json -o ./my_output

  # 单协议配置：从 JSON 字符串生成代码
  node main.js --json '{"name": "Test", "fields": [...]}' -o ./my_output

  # 单协议配置：从标准输入读取 JSON
  cat config.json | node main.js --json - -o ./my_output
  # PowerShell 用户:
  Get-Content config.json -Raw | node main.js --json - -o ./my_output

  # 分发器配置：生成多协议分发器
  node main.js dispatcher.json -o ./output

  # 软件配置：生成完整的软件代码（多层级）
  # 输出结构: output/{softwareName}/{commNodeId}/{nodeId}/*.h, *.cpp
  node main.js software.json -o ./output

  # 软件配置示例 JSON 结构:
  # {
  #   "softwareName": "MySoftware",
  #   "commNodeList": [{
  #     "id": "comm-node-001",
  #     "nodeList": [{
  #       "id": "node-001",
  #       "protocolName": "MyProtocol",
  #       "dispatch": { "mode": "single|multiple", ... },
  #       "messages": { ... }
  #     }]
  #   }]
  # }

  # 只显示配置摘要，不生成文件
  node main.js config.json --summary-only

  # 启用详细日志
  node main.js config.json -v --log-level debug

  # 显式指定目标语言和平台（当前默认值）
  node main.js config.json -o ./output --language cpp11 --platform linux-x86_64

  # 查看支持的选项
  node main.js --help
        `)
        .action(async (configFile, options) => {
            // ============================================================
            // 配置日志输出
            // ============================================================
            if (options.logOutput) {
                process.env.LOG_OUTPUT = options.logOutput;
            }
            if (options.logFile) {
                process.env.LOG_FILE = path.resolve(process.cwd(), options.logFile);
            }
            if (options.logLevel) {
                process.env.LOG_LEVEL = options.logLevel;
            }
            // 重新配置 logger 以应用新的环境变量
            logger.configure();

            // ============================================================
            // 验证 language/platform/cpp-sdk 参数
            // ============================================================
            const supportedLanguages = ['cpp11', 'python'];
            const supportedPlatforms = ['linux-x86_64'];

            if (!supportedLanguages.includes(options.language)) {
                logger.error(`Error: Unsupported language '${options.language}'.`);
                logger.error(`Currently supported languages: ${supportedLanguages.join(', ')}`);
                process.exit(1);
            }

            if (!supportedPlatforms.includes(options.platform)) {
                logger.error(`Error: Unsupported platform '${options.platform}'.`);
                logger.error(`Currently supported platforms: ${supportedPlatforms.join(', ')}`);
                process.exit(1);
            }

            if (!options.cppSdk) {
                logger.error('Error: --no-cpp-sdk is not yet supported.');
                logger.error('Currently only C++ SDK generation is available.');
                process.exit(1);
            }

            // ============================================================
            // 验证输入参数：文件路径和 --json 选项互斥
            // ============================================================
            const hasConfigFile = configFile && configFile.trim() !== '';
            const hasJsonOption = options.json && options.json.trim() !== '';

            if (hasConfigFile && hasJsonOption) {
                logger.error('Error: Cannot use both config file path and --json option at the same time.');
                logger.error('Please use either:');
                logger.error('  node main.js <config-file> -o <output>');
                logger.error('  node main.js --json <json-string> -o <output>');
                process.exit(1);
            }

            if (!hasConfigFile && !hasJsonOption) {
                logger.error('Error: No configuration provided.');
                logger.error('Please provide either a config file path or use --json option.');
                logger.error('Use --help for more information.');
                process.exit(1);
            }

            // 将输出目录转换为绝对路径（相对于 cwd）
            const outputDir = path.resolve(process.cwd(), options.output);

            logger.log('='.repeat(60));
            logger.log('Protocol Code Generation System');
            logger.log('='.repeat(60));

            let rawConfig;
            let inputMode;

            if (hasJsonOption) {
                // ============================================================
                // JSON 模式：从命令行参数或标准输入读取 JSON 字符串
                // ============================================================
                inputMode = 'json';
                
                let jsonContent;
                
                if (options.json === '-') {
                    // 从标准输入读取
                    logger.log('Input Mode: STDIN (reading from pipe...)');
                    logger.log(`Output Directory: ${outputDir}`);
                    if (options.templateDir) logger.log(`Template Directory: ${options.templateDir}`);
                    if (options.frameworkSrc) logger.log(`Framework Header: ${options.frameworkSrc}`);
                    logger.log('='.repeat(60) + '\n');

                    logger.log('Reading JSON from stdin...');
                    jsonContent = await readFromStdin();
                    logger.log(`Read ${jsonContent.length} bytes from stdin.`);
                } else {
                    // 直接使用命令行参数中的 JSON 字符串
                    logger.log('Input Mode: JSON string');
                    logger.log(`Output Directory: ${outputDir}`);
                    if (options.templateDir) logger.log(`Template Directory: ${options.templateDir}`);
                    if (options.frameworkSrc) logger.log(`Framework Header: ${options.frameworkSrc}`);
                    logger.log('='.repeat(60) + '\n');
                    
                    jsonContent = options.json;
                }

                logger.log('Parsing JSON configuration...');
                rawConfig = parseJsonString(jsonContent);

                // Debug 模式：输出接收到的完整 JSON 配置
                logger.debug('Received JSON configuration:');
                logger.debug(JSON.stringify(rawConfig, null, 2));

                await executeGeneration(rawConfig, options, outputDir, null, inputMode);
            } else {
                // ============================================================
                // 文件模式：从文件读取配置
                // ============================================================
                inputMode = 'file';
                
                // 检查配置文件是否存在
                if (!existsSync(configFile)) {
                    logger.error(`Error: Config file not found: ${configFile}`);
                    process.exit(1);
                }

                logger.log('Input Mode: File');
                logger.log(`Config File: ${configFile}`);
                logger.log(`Output Directory: ${outputDir}`);
                if (options.templateDir) logger.log(`Template Directory: ${options.templateDir}`);
                if (options.frameworkSrc) logger.log(`Framework Header: ${options.frameworkSrc}`);
                logger.log('='.repeat(60) + '\n');

                logger.log('Loading configuration file...');
                rawConfig = readJsonFile(configFile);

                // Debug 模式：输出接收到的完整 JSON 配置
                logger.debug('Received JSON configuration:');
                logger.debug(JSON.stringify(rawConfig, null, 2));

                await executeGeneration(rawConfig, options, outputDir, configFile, inputMode);
            }
        });

    // 解析命令行参数
    await program.parseAsync(process.argv);

    // 关闭日志文件流
    logger.close();
}

// 执行主函数
main().catch((error) => {
    logger.error('\nError occurred:');
    logger.error(error.stack || error);
    logger.close();
    process.exit(1);
});
