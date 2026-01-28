/**
 * 模板管理器
 * 负责加载、缓存和渲染 Nunjucks 模板文件
 */

import nunjucks from 'nunjucks';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FieldInfo, getFieldInfo } from './config-parser.js';
import { getTimestampFunctions } from './timestamp-registry.js';
import { CppTypeMapper } from './cpp-type-mapper.js';

// 获取当前文件的目录（ES Module 中需要手动实现 __dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 模板管理器类
 */
export class TemplateManager {
    // 类型到模板文件的映射（用于生成内联代码）
    static TYPE_TEMPLATE_MAP = {
        'UnsignedInt': 'primitives/unsigned_int.cpp.template',
        'SignedInt': 'primitives/signed_int.cpp.template',
        'MessageId': 'primitives/message_id.cpp.template',
        'Float': 'primitives/float.cpp.template',
        'Timestamp': 'primitives/timestamp.cpp.template',
        'String': 'primitives/string.cpp.template',
        'Bcd': 'primitives/bcd.cpp.template',
        'Padding': 'primitives/padding.cpp.template',
        'Reserved': 'primitives/padding.cpp.template',
        'Bitfield': 'composites/bitfield.cpp.template',
        'Encode': 'composites/encode.cpp.template',
        'Checksum': 'primitives/checksum.cpp.template'
    };

    // 类型到序列化模板的映射
    static TYPE_SERIALIZE_TEMPLATE_MAP = {
        'UnsignedInt': 'primitives/unsigned_int_serialize.cpp.template',
        'SignedInt': 'primitives/signed_int_serialize.cpp.template',
        'MessageId': 'primitives/message_id_serialize.cpp.template',
        'Float': 'primitives/float_serialize.cpp.template',
        'String': 'primitives/string_serialize.cpp.template',
        'Bcd': 'primitives/bcd_serialize.cpp.template',
        'Timestamp': 'primitives/timestamp_serialize.cpp.template',
        'Bitfield': 'composites/bitfield_serialize.cpp.template',
        // Bytes 与 Encode 共享同一套"编码映射"序列化模板，向后兼容旧配置
        'Bytes': 'composites/encode_serialize.cpp.template',
        'Encode': 'composites/encode_serialize.cpp.template',
        'Padding': 'primitives/padding_serialize.cpp.template',
        'Reserved': 'primitives/padding_serialize.cpp.template',
        'Checksum': 'primitives/checksum_serialize.cpp.template',
        'Struct': 'composites/struct_call_serialize.cpp.template',
        // Array 和 Command 使用内联模板（不生成辅助函数）
        'Array': 'composites/array_serialize_inline.cpp.template',
        'Command': 'composites/command_serialize_inline.cpp.template'
    };

    // 类型到调用模板的映射（用于生成字段调用代码）
    static TYPE_CALL_TEMPLATE_MAP = {
        // 基础类型（含 Bitfield/Encode）都使用通用的 field_call 模板
        // 它们通过 renderField 生成内联代码，嵌入到 field_call 中
        'UnsignedInt': 'main_parser/field_call.cpp.template',
        'SignedInt': 'main_parser/field_call.cpp.template',
        'MessageId': 'main_parser/field_call.cpp.template',
        'Float': 'main_parser/field_call.cpp.template',
        'Timestamp': 'main_parser/field_call.cpp.template',
        'String': 'main_parser/field_call.cpp.template',
        'Bcd': 'main_parser/field_call.cpp.template',
        'Padding': 'main_parser/field_call.cpp.template',
        'Reserved': 'main_parser/field_call.cpp.template',
        'Bitfield': 'main_parser/field_call.cpp.template',
        'Encode': 'main_parser/field_call.cpp.template',
        'Bytes': 'main_parser/field_call.cpp.template',
        
        // 真正的复合类型使用各自的调用模板
        'Struct': 'composites/struct_call.cpp.template',
        'Array': 'composites/array_inline.cpp.template',
        'Command': 'composites/command_inline.cpp.template',
        'Checksum': 'primitives/checksum.cpp.template'
    };

    // 分发器模板映射 (Tagged Union 版本)
    static DISPATCHER_TEMPLATE_MAP = {
        'header': 'dispatcher/dispatcher_tagged_union.h.template',
        'impl': 'dispatcher/dispatcher_tagged_union.cpp.template'
    };

    /**
     * 初始化模板管理器
     *
     * @param {string} templateBaseDir - 模板文件的基础目录，默认为相对于当前文件的 ../templates
     * @param {string} protocolName - 协议名称（用于生成 Struct 类型名称）
     */
    constructor(templateBaseDir = null, protocolName = null) {
        if (templateBaseDir === null) {
            // 默认模板目录：相对于此文件的位置
            templateBaseDir = path.join(__dirname, '../templates');
        }

        this.templateBaseDir = path.normalize(templateBaseDir);
        this.protocolName = protocolName;
        
        // 框架头文件相对路径（用于多层级目录结构）
        // 默认为 './'，表示框架文件在当前目录的 protocol_parser_framework 子目录下
        // 对于软件配置，可能是 '../../' 等，表示框架文件在上级目录
        this.frameworkRelativePath = './';

        // 创建 Nunjucks 环境，禁用自动转义（因为我们生成的是C++代码，不是HTML）
        this.env = nunjucks.configure(this.templateBaseDir, {
            autoescape: false,  // 禁用 HTML 自动转义
            trimBlocks: true,   // 移除块标签后的第一个换行符
            lstripBlocks: true  // 去除块标签前的空白
        });

        // 注册自定义过滤器
        this._registerCustomFilters();

        this.templateCache = new Map();
    }

    /**
     * 注册自定义 Nunjucks 过滤器
     * @private
     */
    _registerCustomFilters() {
        // 注册 date 过滤器，用于格式化日期
        this.env.addFilter('date', function(str, format) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            // 简单的格式化实现
            if (!format) format = 'YYYY-MM-DD HH:mm:ss';
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        });
    }

    /**
     * 加载并编译模板文件
     *
     * @param {string} templatePath - 相对于 templateBaseDir 的模板文件路径
     * @returns {nunjucks.Template} 编译后的模板对象
     */
    loadTemplate(templatePath) {
        // 检查缓存
        if (this.templateCache.has(templatePath)) {
            return this.templateCache.get(templatePath);
        }

        // 使用 Nunjucks 加载模板
        try {
            const template = this.env.getTemplate(templatePath);
            // 缓存编译后的模板
            this.templateCache.set(templatePath, template);
            return template;
        } catch (e) {
            const fullPath = path.join(this.templateBaseDir, templatePath);
            throw new Error(`Template file does not exist or cannot be loaded: ${fullPath} - ${e.message}`);
        }
    }

    /**
     * 渲染模板
     *
     * @param {string} templatePath - 模板文件路径
     * @param {Object} context - 模板变量上下文
     * @returns {string} 渲染后的字符串
     */
    renderTemplate(templatePath, context) {
        const template = this.loadTemplate(templatePath);
        return template.render(context);
    }

    /**
     * 根据字段类型获取模板文件路径（用于辅助函数生成）
     *
     * @param {string} fieldType - 字段类型（如 UnsignedInt, SignedInt 等）
     * @returns {string|null} 模板文件路径，如果类型不存在则返回 null
     */
    getTemplatePathForType(fieldType) {
        return TemplateManager.TYPE_TEMPLATE_MAP[fieldType] || null;
    }

    /**
     * 根据字段类型获取调用模板文件路径（用于字段调用代码生成）
     *
     * @param {string} fieldType - 字段类型（如 UnsignedInt, Struct 等）
     * @returns {string|null} 调用模板文件路径，如果类型不存在则返回 null
     */
    getCallTemplatePathForType(fieldType) {
        return TemplateManager.TYPE_CALL_TEMPLATE_MAP[fieldType] || null;
    }

    /**
     * 根据字段类型获取序列化模板文件路径
     *
     * @param {string} fieldType - 字段类型
     * @returns {string|null} 模板文件路径
     */
    getSerializeTemplatePathForType(fieldType) {
        return TemplateManager.TYPE_SERIALIZE_TEMPLATE_MAP[fieldType] || null;
    }

    /**
     * 为字段准备模板上下文
     * 这是将数据模型转换为模板需要的格式的职责所在
     *
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} resultStructType - 结果结构体类型（如 "result"）
     * @returns {Object} 模板上下文对象
     */
    prepareFieldContext(fieldInfo, resultStructType = 'result') {
        // 准备范围验证数组
        const ranges = [];
        for (const [minVal, maxVal] of fieldInfo.getRangePairs()) {
            ranges.push({ min: minVal, max: maxVal });
        }

        // 构建上下文对象
        const context = {
            field_name: fieldInfo.fieldName,
            byte_length: fieldInfo.byteLength,
            bit_length: fieldInfo.bitLength,
            fill_value: fieldInfo.fillValue,
            length: fieldInfo.length,
            encoding: fieldInfo.encoding,
            has_range: fieldInfo.hasRangeValidation(),
            is_single_range: ranges && ranges.length === 1,
            ranges: ranges,
            precision: fieldInfo.precision || (fieldInfo.byteLength === 8 ? 'double' : 'float'),
            unit: fieldInfo.unit,
            description: fieldInfo.description,
            result_prefix: resultStructType,
            result_struct_type: resultStructType,
            sub_fields: fieldInfo.subFields,
            fields: fieldInfo.fields,
            message_id_value: fieldInfo.messageIdValue,  // 用于 MessageId 类型
            value_type: fieldInfo.valueType,  // 用于 MessageId 类型，"UnsignedInt" / "SignedInt"
            base_type: fieldInfo.baseType,
            maps: fieldInfo.maps  // 用于 Encode 类型的值映射
        };

        // Timestamp 特殊处理：添加单位转换函数名
        if (fieldInfo.type === 'Timestamp' && fieldInfo.unit) {
            try {
                const timestampFuncs = getTimestampFunctions(fieldInfo.unit);
                context.parse_function = timestampFuncs.parse;
                context.serialize_function = timestampFuncs.serialize;
            } catch (e) {
                // 如果单位不支持，抛出更详细的错误
                throw new Error(`Timestamp field '${fieldInfo.fieldName}' has unsupported unit: ${fieldInfo.unit}. ${e.message}`);
            }
        }

        // Array 特殊处理：生成元素解析代码
        if (fieldInfo.type === 'Array') {
            // 1. 确定元素类型（用于 C++ 声明）
            if (fieldInfo.element) {
                const elementInfo = getFieldInfo(fieldInfo.element);
                
                // 如果元素是 Struct，需要显式生成正确的结构体名称
                if (elementInfo.type === 'Struct') {
                    if (this.protocolName && this.protocolName !== 'null' && elementInfo.fieldName) {
                        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
                        context.element_type = `${this.protocolName}_${capitalize(elementInfo.fieldName)}`;
                    } else {
                        // 缺少信息，抛出错误
                        throw new Error(
                            `Cannot generate Struct type for Array element: ` +
                            `protocolName="${this.protocolName}", fieldName="${elementInfo.fieldName}"`
                        );
                    }
                } else {
                    // 其他类型通过 CppTypeMapper 获取
                    context.element_type = CppTypeMapper.mapType(elementInfo, this.protocolName);
                }
            } else {
                context.element_type = 'unknown';
            }

            // 2. 确定计数类型
            if (fieldInfo.count !== undefined && fieldInfo.count !== null) {
                context.count_type = 'fixed';
                context.count = fieldInfo.count;
            } else if (fieldInfo.countFromField) {
                context.count_type = 'from_field';
                context.count_field = fieldInfo.countFromField;
            } else if (fieldInfo.bytesInTrailer !== undefined && fieldInfo.bytesInTrailer !== null) {
                context.count_type = 'trailer';
                // bytesInTrailer 将在调用者（CppImplGenerator）中自动计算并覆盖
                context.trailer_bytes = fieldInfo.bytesInTrailer;
                // 计算元素大小（用于 trailer 模式）
                context.element_size = this._calculateElementSize(fieldInfo.element);
            }

            // 3. 生成元素解析代码
            context.element_parse_code = this._generateElementParseCode(fieldInfo, resultStructType);
        }

        // Command 特殊处理：生成分支解析代码
        if (fieldInfo.type === 'Command') {
            context.is_reversed = fieldInfo.isReversed;
            context.cases = this._prepareCasesParseCode(fieldInfo, resultStructType);
        }

        return context;
    }

    /**
     * 生成数组元素解析代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息（Array 类型）
     * @param {string} resultStructType - 结果结构体类型
     * @returns {string} 元素解析代码
     */
    _generateElementParseCode(fieldInfo, resultStructType) {
        if (!fieldInfo.element) {
            return '// ERROR: Array 缺少 element 定义\n';
        }

        // 获取元素字段信息
        const elementInfo = getFieldInfo(fieldInfo.element);

        // 对于标量类型的元素，清空 fieldName，这样赋值时就是 element = value 而不是 element.fieldName = value
        const isScalarType = !['Struct', 'Array', 'Command'].includes(elementInfo.type);
        if (isScalarType) {
            // 保存原始 fieldName 用于变量命名
            const originalFieldName = elementInfo.fieldName || 'item';
            
            // 生成上下文
            const context = this.prepareFieldContext(elementInfo, 'element');
            // 手动设置变量名（用于 value 变量命名）
            context.field_name = originalFieldName;
            context.is_array_element = true;  // 标记为数组元素
            
            const templatePath = this.getTemplatePathForType(elementInfo.type);
            if (!templatePath) {
                return `// TODO: 未实现元素类型 ${elementInfo.type} 的解析\n`;
            }
            
            let code = this.renderTemplate(templatePath, context);
            // 替换赋值语句：element.<任何字段名> = xxx → element = xxx
            // 使用更精确的正则表达式，匹配 element. 后跟任意标识符和可选空白
            code = code.replace(/element\.\s*\w+\s*=/g, 'element =');
            // 清理代码块的首尾空行
            code = code.trim();
            return code;
        }

        // 对于 Struct 类型：递归展开子字段解析
        if (elementInfo.type === 'Struct') {
            if (!elementInfo.fields || elementInfo.fields.length === 0) {
                return '// ERROR: Struct 元素缺少 fields 定义\n';
            }

            const lines = [];
            for (const subField of elementInfo.fields) {
                const subFieldInfo = getFieldInfo(subField);
                const context = this.prepareFieldContext(subFieldInfo, 'element');
                const templatePath = this.getTemplatePathForType(subFieldInfo.type);

                if (!templatePath) {
                    lines.push(`// TODO: 未实现类型 ${subFieldInfo.type} 的解析`);
                    continue;
                }

                let code = this.renderTemplate(templatePath, context);
                
                // 清理代码块的首尾空行
                code = code.trim();
                
                lines.push(code);
            }

            // 使用单换行符连接，代码块之间紧凑排列
            return lines.join('\n');
        }

        // 对于其他复合类型（Array、Command），使用标准流程
        const context = this.prepareFieldContext(elementInfo, 'element');
        const templatePath = this.getTemplatePathForType(elementInfo.type);

        if (!templatePath) {
            return `// TODO: 未实现元素类型 ${elementInfo.type} 的解析\n`;
        }

        return this.renderTemplate(templatePath, context);
    }

    /**
     * 计算元素大小（用于 trailer 模式的数组长度计算）
     *
     * @param {Object} elementField - 元素字段配置
     * @returns {number} 元素大小（字节数）
     */
    _calculateElementSize(elementField) {
        if (!elementField) {
            return 1; // 默认 1 字节
        }

        const elementInfo = getFieldInfo(elementField);

        // 简单类型：直接返回 byteLength
        if (elementInfo.byteLength) {
            return elementInfo.byteLength;
        }

        // Struct 类型：递归计算所有子字段大小之和
        if (elementInfo.type === 'Struct') {
            if (!elementInfo.fields || elementInfo.fields.length === 0) {
                throw new Error(`Struct element has no fields (field: ${elementInfo.fieldName})`);
            }

            let totalSize = 0;
            for (const subField of elementInfo.fields) {
                const subFieldInfo = getFieldInfo(subField);
                
                // 只支持简单类型的子字段（避免复杂度爆炸）
                if (subFieldInfo.byteLength) {
                    totalSize += subFieldInfo.byteLength;
                } else if (subFieldInfo.type === 'Float') {
                    // Float 类型：根据 precision 或 byteLength 确定大小
                    if (subFieldInfo.precision === 'float' || subFieldInfo.byteLength === 4) {
                        totalSize += 4;
                    } else {
                        totalSize += 8; // double
                    }
                } else {
                    throw new Error(
                        `Struct element contains unsupported field type "${subFieldInfo.type}" ` +
                        `for trailer mode (field: ${elementInfo.fieldName}.${subFieldInfo.fieldName}). ` +
                        `Only fixed-size simple types are supported.`
                    );
                }
            }

            return totalSize;
        }

        // Float 类型：根据 precision 或 byteLength 确定大小
        if (elementInfo.type === 'Float') {
            if (elementInfo.precision === 'float' || elementInfo.byteLength === 4) {
                return 4;
            }
            return 8; // double
        }

        // 默认假设 1 字节
        return 1;
    }

    /**
     * 准备 Command 分支解析代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {string} resultStructType - 结果结构体类型
     * @returns {Array} 分支信息数组
     */
    _prepareCasesParseCode(fieldInfo, resultStructType) {
        if (!fieldInfo.cases) {
            return [];
        }

        const cases = [];
        for (const caseKey in fieldInfo.cases) {
            const caseConfig = fieldInfo.cases[caseKey];
            
            // 根据分支类型决定如何生成解析代码
            let caseParseCode = '';
            if (caseConfig.type === 'Struct' && caseConfig.fields) {
                // 如果分支是 Struct，需要使用正确的前缀路径
                const casePath = `${resultStructType}.${caseConfig.fieldName}`;
                caseParseCode = this._generateCaseFieldsParseCode(caseConfig.fields, casePath);
            } else if (caseConfig.type === 'Array') {
                // 如果分支是 Array，使用 Array 内联模板
                const caseFieldInfo = getFieldInfo(caseConfig);
                const context = this.prepareFieldContext(caseFieldInfo, resultStructType);
                caseParseCode = this.renderTemplate('composites/array_inline.cpp.template', context);
            } else if (caseConfig.fields) {
                // 如果分支有 fields 但不是 Struct（罕见情况）
                caseParseCode = this._generateCaseFieldsParseCode(caseConfig.fields, resultStructType);
            } else {
                // 如果分支本身就是基础类型（如 UnsignedInt）
                const caseFieldInfo = getFieldInfo(caseConfig);
                const templatePath = this.getTemplatePathForType(caseFieldInfo.type);
                if (templatePath) {
                    const context = this.prepareFieldContext(caseFieldInfo, resultStructType);
                    caseParseCode = this.renderTemplate(templatePath, context);
                }
            }
            
            // 清理所有 case 代码的首尾空行
            caseParseCode = caseParseCode.trim();
            
            cases.push({
                value: caseKey,
                case_name: caseConfig.fieldName || `case_${caseKey}`,
                case_parse_code: caseParseCode
            });
        }

        return cases;
    }

    /**
     * 生成分支字段解析代码
     *
     * @param {Array} fields - 字段数组
     * @param {string} resultStructType - 结果结构体类型
     * @returns {string} 解析代码
     */
    _generateCaseFieldsParseCode(fields, resultStructType) {
        if (!fields || fields.length === 0) {
            return '';
        }

        const lines = [];
        for (const field of fields) {
            const fieldInfo = getFieldInfo(field);
            
            // 首先尝试基础类型模板
            let templatePath = this.getTemplatePathForType(fieldInfo.type);
            
            // 如果基础类型模板不存在，尝试复合类型模板（Array、Struct、Command 等）
            if (!templatePath) {
                templatePath = this.getCallTemplatePathForType(fieldInfo.type);
            }
            
            if (templatePath) {
                const context = this.prepareFieldContext(fieldInfo, resultStructType);
                let code = this.renderTemplate(templatePath, context);
                // 清理代码块的首尾空行
                code = code.trim();
                lines.push(code);
            }
        }

        // 使用单换行符连接，代码块之间紧凑排列
        return lines.join('\n');
    }

    /**
     * 便捷方法：根据字段信息渲染字段解析代码
     *
     * 这是一个包装方法，简化常见的使用场景：
     * 1. 准备字段的模板上下文
     * 2. 渲染对应的模板
     *
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} resultStructType - 结果结构体类型（如 "result"）
     * @returns {string} 渲染后的字段解析代码
     */
    renderField(fieldInfo, resultStructType = 'result') {
        const templatePath = this.getTemplatePathForType(fieldInfo.type);
        if (!templatePath) {
            return `// TODO: 未实现类型 ${fieldInfo.type} 的解析\n`;
        }

        // 由 TemplateManager 负责准备模板上下文（职责归位）
        const context = this.prepareFieldContext(fieldInfo, resultStructType);

        // 模板管理器负责渲染
        return this.renderTemplate(templatePath, context);
    }

    // ========================================================================
    // 分发器相关方法
    // ========================================================================

    /**
     * 获取分发器模板路径
     *
     * @param {string} templateType - 模板类型（'header' 或 'impl'）
     * @returns {string|null} 模板文件路径
     */
    getDispatcherTemplatePath(templateType) {
        return TemplateManager.DISPATCHER_TEMPLATE_MAP[templateType] || null;
    }

    /**
     * 准备分发器模板上下文
     *
     * @param {DispatcherConfig} dispatcherConfig - 分发器配置对象
     * @param {Array} subProtocolInfos - 子协议信息数组，每个元素包含：
     *   - id_value: MessageID 数值
     *   - id_hex: MessageID 十六进制字符串
     *   - enum_name: 枚举成员名
     *   - protocol_name: 子协议名称
     *   - result_type: 结果结构体类型名
     *   - member_name: union 成员名
     *   - header_file: 头文件名
     * @returns {Object} 模板上下文
     */
    prepareDispatcherContext(dispatcherConfig, subProtocolInfos) {
        return {
            // 分发器基本信息
            protocol_name: dispatcherConfig.protocolName,
            PROTOCOL_NAME_UPPER: dispatcherConfig.protocolName.toUpperCase(),
            namespace: dispatcherConfig.getNamespaceName(),

            // 分发字段信息
            dispatch_field: dispatcherConfig.getDispatchFieldName(),
            dispatch_cpp_type: dispatcherConfig.getDispatchCppType(),
            dispatch_offset: dispatcherConfig.getDispatchOffset(),
            dispatch_size: dispatcherConfig.getDispatchSize(),
            dispatch_byte_order: dispatcherConfig.getDispatchByteOrder(),

            // 默认字节序
            default_byte_order: dispatcherConfig.getByteOrderEnum(),

            // 框架头文件相对路径
            framework_relative_path: this.frameworkRelativePath,

            // 子协议列表
            messages: subProtocolInfos,
            has_messages: subProtocolInfos.length > 0
        };
    }

    /**
     * 渲染分发器头文件
     *
     * @param {DispatcherConfig} dispatcherConfig - 分发器配置
     * @param {Array} subProtocolInfos - 子协议信息数组
     * @returns {string} 渲染后的头文件内容
     */
    renderDispatcherHeader(dispatcherConfig, subProtocolInfos) {
        const templatePath = this.getDispatcherTemplatePath('header');
        if (!templatePath) {
            throw new Error('Dispatcher header template not found');
        }

        const context = this.prepareDispatcherContext(dispatcherConfig, subProtocolInfos);
        return this.renderTemplate(templatePath, context);
    }

    /**
     * 渲染分发器实现文件
     *
     * @param {DispatcherConfig} dispatcherConfig - 分发器配置
     * @param {Array} subProtocolInfos - 子协议信息数组
     * @returns {string} 渲染后的实现文件内容
     */
    renderDispatcherImpl(dispatcherConfig, subProtocolInfos) {
        const templatePath = this.getDispatcherTemplatePath('impl');
        if (!templatePath) {
            throw new Error('Dispatcher implementation template not found');
        }

        const context = this.prepareDispatcherContext(dispatcherConfig, subProtocolInfos);
        return this.renderTemplate(templatePath, context);
    }
}
