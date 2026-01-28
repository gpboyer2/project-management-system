/**
 * C++ 实现文件生成器
 * 根据协议配置生成 C++ 实现文件，包括解析逻辑
 */

import { getFieldInfo } from './config-parser.js';
import { TemplateManager } from './template-manager.js';
import { getChecksumAlgorithm } from './checksum_registry.js';
import { logger } from './logger.js';

/**
 * C++ 实现文件生成器
 */
export class CppImplGenerator {
    /**
     * @param {ProtocolConfig} config - 协议配置对象
     * @param {TemplateManager} templateManager - 模板管理器实例
     */
    constructor(config, templateManager = null) {
        this.config = config;
        this.protocolName = config.name;
        this.templateManager = templateManager || new TemplateManager(null, config.name);
    }

    /**
     * 生成完整的实现文件内容
     *
     * @returns {string} 实现文件内容
     */
    generate() {
        // 扫描所有被 Checksum 引用的字段
        const referencedFields = this._findReferencedFields();
        
        // 生成字段调用代码（原有 Business 层）
        const fieldCalls = this._generateAllFieldCalls(referencedFields);

        // ================================================================
        // 两阶段重构：生成 Raw 解析和转换上下文
        // ================================================================
        
        // 生成 Raw 层字段解析代码（无 validWhen）
        const rawFieldCalls = this._generateRawFieldParseCalls();
        
        // 生成 from_raw() 转换代码
        const fromRawConversions = this._generateFromRawFieldConversions();

        // 准备模板上下文
        const context = {
            protocol_name: this.config.name,
            protocol_version: this.config.version,
            protocol_description: this.config.description,
            default_byte_order: this.config.defaultByteOrder,
            
            // 原有 Business 层字段解析（兼容性保留）
            fields: fieldCalls,
            
            // 两阶段重构新增
            raw_field_calls: rawFieldCalls,
            from_raw_conversions: fromRawConversions,
            has_two_phase: true  // 标记使用两阶段
        };

        // 渲染模板
        return this.templateManager.renderTemplate('main_parser/main_parser.cpp.template', context);
    }


    /**
     * 扫描所有 Checksum 字段引用的字段名称
     * @returns {Object} 返回 { asStart: Set<string>, asEnd: Set<string> }
     * @private
     */
    _findReferencedFields() {
        const asStart = new Set();  // 作为范围起始的字段
        const asEnd = new Set();    // 作为范围结束的字段
        
        const scanFields = (fields) => {
            for (const field of fields) {
                if (field.type === 'Checksum') {
                    if (field.rangeStartRef) {
                        asStart.add(field.rangeStartRef);
                    }
                    if (field.rangeEndRef) {
                        asEnd.add(field.rangeEndRef);
                    }
                }
                
                // 递归检查嵌套字段
                if (field.fields) {
                    scanFields(field.fields);
                }
                if (field.elements) {
                    scanFields(field.elements);
                }
                if (field.cases) {
                    for (const caseKey in field.cases) {
                        const caseConfig = field.cases[caseKey];
                        if (caseConfig.fields) {
                            scanFields(caseConfig.fields);
                        }
                    }
                }
            }
        };
        
        scanFields(this.config.fields);
        return { asStart, asEnd };
    }

    /**
     * 生成所有字段的调用代码（用于主解析函数中）
     *
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Array} 字段调用信息列表
     */
    _generateAllFieldCalls(referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        const fieldCalls = [];

        for (const field of this.config.fields) {
            const fieldInfo = getFieldInfo(field);
            
            // 检查当前字段是否作为范围起始或结束
            const isRangeStart = referencedFields.asStart.has(field.fieldName);
            const isRangeEnd = referencedFields.asEnd.has(field.fieldName);
            
            // 只在需要时生成起始偏移量捕获
            let offsetCaptureCode = '';
            if (isRangeStart) {
                offsetCaptureCode = `    size_t offset_of_${field.fieldName}_start = ctx.offset;\n`;
            }

            // 生成字段解析代码
            // 注意：validWhen 的逻辑已下沉到 _generateFieldCallRecursive 中处理
            // 这样无论是顶层字段还是嵌套字段，都能自动支持有效性条件判断
            const callLines = this._generateFieldCallRecursive(field, 'result', referencedFields);
            
            const finalCode = callLines.join('\n');
            
            // 只在需要时生成结束偏移量捕获
            let endOffsetCaptureCode = '';
            if (isRangeEnd) {
                endOffsetCaptureCode = `\n    size_t offset_of_${field.fieldName}_end = ctx.offset;`;
            }

            fieldCalls.push({
                field_name: field.fieldName || '',
                type: field.type,
                description: field.description || '',
                field_parse_code: offsetCaptureCode + finalCode + endOffsetCaptureCode
            });
        }

        return fieldCalls;
    }

    /**
     * 递归生成字段调用代码（类型无关的通用方法）
     * 通过模板驱动，支持所有类型的扩展
     *
     * @param {Object} field - 字段配置
     * @param {string} resultPrefix - 结果变量前缀
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Array} 代码行数组
     */
    _generateFieldCallRecursive(field, resultPrefix, referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        const fieldInfo = getFieldInfo(field);
        const fieldType = fieldInfo.type;

        // 通过模板管理器获取对应类型的调用模板
        let templatePath = this.templateManager.getCallTemplatePathForType(fieldType);
        if (!templatePath) {
            // 降级：使用默认的字段调用模板
            templatePath = 'main_parser/field_call.cpp.template';
        }

        // 准备模板上下文（根据类型的不同，准备不同的上下文）
        const context = this._prepareCallContext(fieldInfo, resultPrefix, referencedFields);

        // 渲染模板
        const code = this.templateManager.renderTemplate(templatePath, context);

        // 预处理：去掉首尾空行，避免生成过多空白
        let rawLines = code.split('\n');
        
        // 去掉开头的空行
        while (rawLines.length > 0 && rawLines[0].trim() === '') {
            rawLines.shift();
        }
        // 去掉结尾的空行
        while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
            rawLines.pop();
        }

        // 添加缩进并返回代码行
        const lines = [];
        for (const line of rawLines) {
            if (line.trim()) {
                lines.push('    ' + line);
            } else {
                lines.push('');
            }
        }

        // 处理 validWhen 有效性条件
        if (fieldInfo.validWhen) {
            const conditionField = fieldInfo.validWhen.field;
            const conditionValue = fieldInfo.validWhen.value;

            if (conditionField && conditionValue !== undefined) {
                const wrappedLines = [];
                // 构造条件路径：假设引用的是相对于当前结构体的同级字段
                const fullConditionPath = `${resultPrefix}.${conditionField}`;
                
                wrappedLines.push(`    if (${fullConditionPath} == ${conditionValue}) {`);
                
                // 为原始代码增加一级缩进
                // 注意：原始 lines 已经有一级缩进（为了放入函数体或父级块），这里再加一级
                for (const line of lines) {
                    // 此时 line 已经包含 4 个空格
                    // 我们再加 4 个空格，使其变为 8 个空格（相对于最外层）
                    // 或者简单地，我们在 if 块内部，再次缩进
                    if (line.trim()) {
                        wrappedLines.push('    ' + line);
                    } else {
                        wrappedLines.push('');
                    }
                }
                
                wrappedLines.push('    }');
                return wrappedLines;
            }
        }

        return lines;
    }

    /**
     * 为字段调用准备模板上下文（完全类型无关的通用方法）
     *
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} resultPrefix - 结果变量前缀
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Object} 模板上下文
     */
    _prepareCallContext(fieldInfo, resultPrefix, referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        // 基础上下文（所有类型通用）
        const context = {
            field_name: fieldInfo.fieldName,
            field_type: fieldInfo.type,
            field_name_capitalized: this._capitalize(fieldInfo.fieldName),
            result_prefix: resultPrefix,
            description: fieldInfo.description,
            has_description: !!fieldInfo.description
        };

        // 对于简单类型，生成 field_inline_code（用于 field_call.cpp.template）
        // 对于复合类型（Array、Command、Struct、Checksum），它们有自己的完整模板，不需要 field_inline_code
        const complexTypes = ['Array', 'Command', 'Struct', 'Checksum'];
        if (!complexTypes.includes(fieldInfo.type)) {
            // 生成字段内联代码（从基础类型模板获取）
            const fieldInlineCode = this.templateManager.renderField(fieldInfo, resultPrefix);
            context.field_inline_code = fieldInlineCode;
        }

        // 对于复合类型，使用 prepareFieldContext 准备完整上下文
        if (complexTypes.includes(fieldInfo.type)) {
            const fullContext = this.templateManager.prepareFieldContext(fieldInfo, resultPrefix);
            // 合并完整上下文到基础上下文
            Object.assign(context, fullContext);
            
            // 特殊处理：Array 的 trailer 模式，自动计算后续字段的总大小
            if (fieldInfo.type === 'Array' && fieldInfo.bytesInTrailer !== undefined) {
                const autoCalculatedTrailer = this._calculateFollowingFieldsSize(fieldInfo.fieldName);
                
                // 使用自动计算的值（如果配置的 bytesInTrailer 与计算值不同，发出警告）
                if (autoCalculatedTrailer !== fieldInfo.bytesInTrailer) {
                    logger.warn(
                        `Warning: Field "${fieldInfo.fieldName}" has bytesInTrailer configured as ${fieldInfo.bytesInTrailer} bytes, ` +
                        `but auto-calculated following fields size is ${autoCalculatedTrailer} bytes. Using auto-calculated value.`
                    );
                }
                
                // 覆盖 trailer_bytes
                context.trailer_bytes = autoCalculatedTrailer;
            }
        }
        
        // Checksum 特殊处理：生成校验验证代码
        if (fieldInfo.type === 'Checksum') {
            const checksumContext = this._prepareChecksumParseContext(fieldInfo);
            Object.assign(context, checksumContext);
        }

        // 通用递归处理：对任何包含子元素的复合类型都适用
        // 检查是否有需要递归处理的子元素（统一命名为 fields）
        const nestedFields = fieldInfo.fields || [];

        if (nestedFields.length > 0) {
            // 计算嵌套的 result_prefix（适用于所有复合类型）
            const nestedResultPath = `${resultPrefix}.${fieldInfo.fieldName}`;

            // 递归处理所有子元素
            const subFieldCalls = [];
            for (const subFieldDict of nestedFields) {
                const callLines = this._generateFieldCallRecursive(subFieldDict, nestedResultPath, referencedFields);
                // 移除每行开头的缩进（因为这些行会被嵌入到 struct_call 模板中，稍后整个模板会被添加缩进）
                const unindentedLines = callLines.map(line => {
                    // 如果行以4个空格开头，移除这4个空格
                    if (line.startsWith('    ')) {
                        return line.substring(4);
                    }
                    return line;
                });
                let callCode = unindentedLines.join('\n');
                // 清理代码块的首尾空行
                callCode = callCode.trim();
                subFieldCalls.push({
                    call_code: callCode
                });
            }

            // 将递归结果添加到上下文
            context.sub_field_calls = subFieldCalls;
            context.has_nested_fields = true;
        } else {
            context.has_nested_fields = false;
        }

        // 未来扩展：自动提取其他可能的嵌套结构
        // 对于 Array 类型：elements
        const nestedElements = fieldInfo.elements || [];
        if (nestedElements.length > 0) {
            const elementCalls = [];
            for (const elementDict of nestedElements) {
                const callLines = this._generateFieldCallRecursive(elementDict, resultPrefix, referencedFields);
                elementCalls.push({ call_code: callLines.join('\n') });
            }
            context.element_calls = elementCalls;
            context.has_elements = true;
        }

        // 对于 Command 类型：cases
        const nestedCases = fieldInfo.cases || {};
        if (Object.keys(nestedCases).length > 0) {
            const caseCalls = [];
            for (const caseKey in nestedCases) {
                const caseConfig = nestedCases[caseKey];
                const callLines = this._generateFieldCallRecursive(caseConfig, resultPrefix, referencedFields);
                caseCalls.push({ 
                    value: caseKey,
                    call_code: callLines.join('\n') 
                });
            }
            context.case_calls = caseCalls;
            context.has_cases = true;
        }

        return context;
    }
    
    /**
     * 准备 Checksum 解析上下文
     * @param {FieldInfo} fieldInfo - 字段信息
     * @returns {Object} Checksum 上下文
     * @private
     */
    _prepareChecksumParseContext(fieldInfo) {
        const algorithm = fieldInfo.algorithm || '';
        const algorithmConfig = getChecksumAlgorithm(algorithm);
        
        if (!algorithmConfig) {
            throw new Error(`Unsupported checksum algorithm: "${algorithm}" in field "${fieldInfo.fieldName}"`);
        }
        
        const context = {
            algorithm_name: algorithm,
            cpp_class: algorithmConfig.cppClass,
            return_type: algorithmConfig.returnType,
            byte_length: fieldInfo.byteLength || algorithmConfig.byteLength,
            range_start_ref: fieldInfo.rangeStartRef || '',
            range_end_ref: fieldInfo.rangeEndRef || ''
        };
        
        // 处理构造函数参数（必填参数）
        const constructorArgs = [];
        if (algorithmConfig.required && algorithmConfig.required.length > 0) {
            for (const reqParam of algorithmConfig.required) {
                const paramName = reqParam.name;
                let paramValue;
                
                // 优先使用 fixedParams
                if (algorithmConfig.fixedParams && algorithmConfig.fixedParams[paramName] !== undefined) {
                    paramValue = algorithmConfig.fixedParams[paramName];
                }
                // 其次从 JSON parameters 中读取
                else if (fieldInfo.parameters && fieldInfo.parameters[paramName] !== undefined) {
                    paramValue = fieldInfo.parameters[paramName];
                } else {
                    throw new Error(
                        `Required parameter "${paramName}" not provided for checksum field "${fieldInfo.fieldName}" ` +
                        `(algorithm: "${algorithm}")`
                    );
                }
                
                constructorArgs.push(paramValue);
            }
        }
        context.constructor_args = constructorArgs.join(', ');
        
        // 处理 Setter 参数（可选参数）
        const setterCalls = [];
        if (algorithmConfig.optional) {
            for (const [paramName, paramConfig] of Object.entries(algorithmConfig.optional)) {
                let paramValue;
                
                // 优先使用 fixedParams
                if (algorithmConfig.fixedParams && algorithmConfig.fixedParams[paramName] !== undefined) {
                    paramValue = algorithmConfig.fixedParams[paramName];
                }
                // 其次从 JSON parameters 中读取
                else if (fieldInfo.parameters && fieldInfo.parameters[paramName] !== undefined) {
                    paramValue = fieldInfo.parameters[paramName];
                } else {
                    // 使用默认值
                    paramValue = paramConfig.default;
                }
                
                // 生成 setter 调用
                if (paramValue !== undefined && paramValue !== null) {
                    const setterName = paramConfig.setter;
                    setterCalls.push(`checker.${setterName}(${paramValue});`);
                }
            }
        }
        context.setter_calls = setterCalls.join('\n');
        
        return context;
    }

    /**
     * 计算指定字段之后的所有字段的总大小（用于 Array trailer 模式）
     *
     * @param {string} currentFieldName - 当前字段名称
     * @returns {number} 后续字段的总字节数
     */
    _calculateFollowingFieldsSize(currentFieldName) {
        let foundCurrent = false;
        let totalSize = 0;

        for (const field of this.config.fields) {
            // 找到当前字段后，开始累加后续字段的大小
            if (foundCurrent) {
                const fieldInfo = getFieldInfo(field);
                const fieldSize = this._calculateSingleFieldSize(fieldInfo);
                totalSize += fieldSize;
            }

            // 标记已找到当前字段
            if (field.fieldName === currentFieldName) {
                foundCurrent = true;
            }
        }

        return totalSize;
    }

    /**
     * 计算单个字段的大小（只支持简单固定大小类型）
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @returns {number} 字段大小（字节数）
     */
    _calculateSingleFieldSize(fieldInfo) {
        // 简单类型：直接返回 byteLength
        if (fieldInfo.byteLength) {
            return fieldInfo.byteLength;
        }

        // Float 类型：根据 precision 或 byteLength 确定大小
        if (fieldInfo.type === 'Float') {
            if (fieldInfo.precision === 'float' || fieldInfo.byteLength === 4) {
                return 4;
            }
            return 8; // double
        }

        // Struct 类型：递归计算子字段大小之和
        if (fieldInfo.type === 'Struct') {
            if (!fieldInfo.fields || fieldInfo.fields.length === 0) {
                logger.warn(`Warning: Struct field "${fieldInfo.fieldName}" has no sub-fields, cannot calculate size`);
                return 0;
            }

            let totalSize = 0;
            for (const subField of fieldInfo.fields) {
                const subFieldInfo = getFieldInfo(subField);
                totalSize += this._calculateSingleFieldSize(subFieldInfo);
            }
            return totalSize;
        }

        // 不支持的类型（Array、Command、动态长度类型等）
        logger.warn(
            `Warning: Field "${fieldInfo.fieldName}" of type "${fieldInfo.type}" cannot determine fixed size, ` +
            `skipping calculation (assuming 0 bytes)`
        );
        return 0;
    }


    // ========================================================================
    // 两阶段重构：Raw 解析和转换方法
    // ========================================================================

    /**
     * 生成 Raw 层字段解析调用代码（无 validWhen 条件判断）
     * 用于 parse_from() 方法
     *
     * @returns {Array} Raw 字段解析代码数组
     */
    _generateRawFieldParseCalls() {
        const rawFieldCalls = [];
        let paddingIndex = 0;
        let reservedIndex = 0;

        for (const field of this.config.fields) {
            const fieldInfo = getFieldInfo(field);
            const fieldType = fieldInfo.type;
            const fieldName = fieldInfo.fieldName || '';

            // Padding 类型：生成读取代码
            if (fieldType === 'Padding') {
                const indexedName = fieldName || `padding_${paddingIndex++}`;
                const byteLength = fieldInfo.byteLength || 1;
                
                rawFieldCalls.push({
                    field_name: indexedName,
                    type: 'Padding',
                    description: fieldInfo.description || 'Padding bytes',
                    raw_parse_code: byteLength === 1 
                        ? `    ctx.read_uint8(raw.${indexedName});`
                        : `    ctx.read_bytes(raw.${indexedName}, ${byteLength});`,
                    byte_length: byteLength
                });
                continue;
            }

            // Reserved 类型：生成读取代码
            if (fieldType === 'Reserved') {
                const indexedName = fieldName || `reserved_${reservedIndex++}`;
                const byteLength = fieldInfo.byteLength || Math.ceil((fieldInfo.bitLength || 8) / 8);
                
                rawFieldCalls.push({
                    field_name: indexedName,
                    type: 'Reserved',
                    description: fieldInfo.description || 'Reserved bytes',
                    raw_parse_code: byteLength === 1 
                        ? `    ctx.read_uint8(raw.${indexedName});`
                        : `    ctx.read_bytes(raw.${indexedName}, ${byteLength});`,
                    byte_length: byteLength
                });
                continue;
            }

            // Bitfield 类型：Raw 层读取原始整数
            if (fieldType === 'Bitfield') {
                const byteLength = fieldInfo.byteLength || 1;
                const intTypeMap = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
                const cppType = intTypeMap[byteLength] || 'uint32_t';
                const readFunc = `deserialize_unsigned_int_generic<${cppType}>`;
                
                rawFieldCalls.push({
                    field_name: `${fieldName}_raw`,
                    type: 'Bitfield',
                    description: fieldInfo.description || '',
                    raw_parse_code: `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = ${readFunc}(ctx, temp);\n        if (!res.is_success()) return false;\n        raw.${fieldName}_raw = temp;\n    }`,
                    original_field_name: fieldName
                });
                continue;
            }

            // 其他类型：生成标准解析代码（无 validWhen 判断）
            const parseCode = this._generateRawParseCodeForField(fieldInfo, 'raw');
            rawFieldCalls.push({
                field_name: fieldName,
                type: fieldType,
                description: fieldInfo.description || '',
                raw_parse_code: parseCode
            });
        }

        return rawFieldCalls;
    }

    /**
     * 为单个字段生成 Raw 解析代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {string} resultPrefix - 结果变量前缀
     * @returns {string} 解析代码
     */
    _generateRawParseCodeForField(fieldInfo, resultPrefix) {
        const fieldType = fieldInfo.type;
        const fieldName = fieldInfo.fieldName;

        // 简单整数类型
        if (fieldType === 'SignedInt' || fieldType === 'UnsignedInt') {
            const byteLength = fieldInfo.byteLength || 4;
            const typeMap = {
                'SignedInt': { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' },
                'UnsignedInt': { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' }
            };
            const cppType = typeMap[fieldType][byteLength] || 'int32_t';
            const funcPrefix = fieldType === 'SignedInt' ? 'signed' : 'unsigned';
            
            return `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = deserialize_${funcPrefix}_int_generic<${cppType}>(ctx, temp);\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // Float 类型
        if (fieldType === 'Float') {
            const precision = fieldInfo.precision || 'float';
            const cppType = precision === 'double' ? 'double' : 'float';
            
            return `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = deserialize_float_generic<${cppType}>(ctx, temp);\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // String 类型
        if (fieldType === 'String') {
            const length = fieldInfo.length || 0;
            return `    {\n        std::string temp;\n        DeserializeResult res = deserialize_string(ctx, temp, ${length});\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // Timestamp 类型：Raw 层读取原始整数（不转换）
        if (fieldType === 'Timestamp') {
            const byteLength = fieldInfo.byteLength || 4;
            const cppType = byteLength === 8 ? 'uint64_t' : 'uint32_t';
            
            return `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = deserialize_unsigned_int_generic<${cppType}>(ctx, temp);\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // MessageId 类型
        if (fieldType === 'MessageId') {
            const byteLength = fieldInfo.byteLength || 2;
            const valueType = fieldInfo.valueType || 'UnsignedInt';
            const typeMap = valueType === 'SignedInt' 
                ? { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' }
                : { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            const cppType = typeMap[byteLength] || 'uint16_t';
            const funcPrefix = valueType === 'SignedInt' ? 'signed' : 'unsigned';
            
            return `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = deserialize_${funcPrefix}_int_generic<${cppType}>(ctx, temp);\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // Encode 类型：Raw 层只读取整数值
        if (fieldType === 'Encode') {
            const byteLength = fieldInfo.byteLength || 1;
            const baseType = fieldInfo.baseType || 'unsigned';
            const typeMap = baseType === 'signed' 
                ? { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' }
                : { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            const cppType = typeMap[byteLength] || 'uint8_t';
            const funcPrefix = baseType === 'signed' ? 'signed' : 'unsigned';
            
            return `    {\n        ${cppType} temp = 0;\n        DeserializeResult res = deserialize_${funcPrefix}_int_generic<${cppType}>(ctx, temp);\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // Bcd 类型
        if (fieldType === 'Bcd') {
            const byteLength = fieldInfo.byteLength || 1;
            return `    {\n        std::string temp;\n        DeserializeResult res = deserialize_bcd(ctx, temp, ${byteLength});\n        if (!res.is_success()) return false;\n        ${resultPrefix}.${fieldName} = temp;\n    }`;
        }

        // Struct、Array、Command 等复杂类型：使用原有递归逻辑
        return `    // TODO: Raw parse for ${fieldType} type ${fieldName}`;
    }

    /**
     * 生成 from_raw() 方法中的字段转换代码
     * 处理 validWhen、valueRange、单位转换、Bitfield 解包
     *
     * @returns {Array} 转换代码数组
     */
    _generateFromRawFieldConversions() {
        const conversions = [];

        for (const field of this.config.fields) {
            const fieldInfo = getFieldInfo(field);
            const fieldType = fieldInfo.type;
            const fieldName = fieldInfo.fieldName || '';

            // Padding/Reserved 类型：跳过（Business 层不需要）
            if (fieldType === 'Padding' || fieldType === 'Reserved') {
                continue;
            }

            // 准备转换代码
            const conversion = {
                field_name: fieldName,
                type: fieldType,
                description: fieldInfo.description || '',
                has_valid_when: !!fieldInfo.validWhen,
                has_value_range: !!(fieldInfo.valueRange && fieldInfo.valueRange.length > 0),
                conversion_code: ''
            };

            // 根据类型生成转换代码
            conversion.conversion_code = this._generateConversionCodeForField(fieldInfo);
            conversions.push(conversion);
        }

        return conversions;
    }

    /**
     * 为单个字段生成 Raw → Business 转换代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @returns {string} 转换代码
     */
    _generateConversionCodeForField(fieldInfo) {
        const fieldType = fieldInfo.type;
        const fieldName = fieldInfo.fieldName;
        const lines = [];

        // validWhen 条件处理
        if (fieldInfo.validWhen) {
            const condField = fieldInfo.validWhen.field;
            const condValue = fieldInfo.validWhen.value;
            lines.push(`    // validWhen: ${condField} == ${condValue}`);
            lines.push(`    if (raw.${condField} == ${condValue}) {`);
        }

        const indent = fieldInfo.validWhen ? '        ' : '    ';

        // valueRange 校验
        if (fieldInfo.valueRange && fieldInfo.valueRange.length > 0) {
            const ranges = fieldInfo.valueRange;
            const rawFieldRef = fieldType === 'Bitfield' ? `raw.${fieldName}_raw` : `raw.${fieldName}`;
            
            const rangeConditions = ranges.map(r => 
                `(${rawFieldRef} >= ${r.min} && ${rawFieldRef} <= ${r.max})`
            ).join(' || ');
            
            lines.push(`${indent}// valueRange 校验`);
            lines.push(`${indent}if (!(${rangeConditions})) {`);
            lines.push(`${indent}    return false;  // 校验失败`);
            lines.push(`${indent}}`);
        }

        // 根据类型生成具体转换
        switch (fieldType) {
            case 'Bitfield':
                // Bitfield 解包
                lines.push(`${indent}// Bitfield 解包`);
                if (fieldInfo.subFields) {
                    for (const subField of fieldInfo.subFields) {
                        const mask = ((1 << (subField.endBit - subField.startBit + 1)) - 1) << subField.startBit;
                        lines.push(`${indent}result.${fieldName}.${subField.name} = (raw.${fieldName}_raw >> ${subField.startBit}) & 0x${((1 << (subField.endBit - subField.startBit + 1)) - 1).toString(16)};`);
                        
                        // 如果有 maps，生成 meaning 映射
                        if (subField.maps && subField.maps.length > 0) {
                            lines.push(`${indent}switch (result.${fieldName}.${subField.name}) {`);
                            for (const map of subField.maps) {
                                lines.push(`${indent}    case ${map.value}: result.${fieldName}.${subField.name}_meaning = "${map.meaning}"; break;`);
                            }
                            lines.push(`${indent}    default: result.${fieldName}.${subField.name}_meaning = "Unknown"; break;`);
                            lines.push(`${indent}}`);
                        }
                    }
                }
                break;

            case 'Encode':
                // Encode 映射
                lines.push(`${indent}result.${fieldName}_value = raw.${fieldName};`);
                if (fieldInfo.maps && fieldInfo.maps.length > 0) {
                    lines.push(`${indent}switch (raw.${fieldName}) {`);
                    for (const map of fieldInfo.maps) {
                        lines.push(`${indent}    case ${map.value}: result.${fieldName}_meaning = "${map.meaning}"; break;`);
                    }
                    lines.push(`${indent}    default: result.${fieldName}_meaning = "Unknown"; break;`);
                    lines.push(`${indent}}`);
                }
                break;

            case 'Timestamp':
                // Timestamp 单位转换（如果需要）
                lines.push(`${indent}result.${fieldName} = raw.${fieldName};  // TODO: 单位转换`);
                break;

            default:
                // 简单复制
                lines.push(`${indent}result.${fieldName} = raw.${fieldName};`);
        }

        // validWhen 条件结束
        if (fieldInfo.validWhen) {
            lines.push(`        result.${fieldName}_valid = true;`);
            lines.push(`    } else {`);
            lines.push(`        result.${fieldName}_valid = false;`);
            lines.push(`    }`);
        }

        return lines.join('\n');
    }

    /**
     * 首字母大写辅助函数
     *
     * @param {string} str - 输入字符串
     * @returns {string} 首字母大写的字符串
     */
    _capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
