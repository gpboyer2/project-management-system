/**
 * C++ 序列化实现生成器
 * 根据协议配置生成 C++ 序列化实现代码
 * 与 cpp-impl-generator.js 对称
 */

import { getFieldInfo } from './config-parser.js';
import { TemplateManager } from './template-manager.js';
import { getTimestampFunctions } from './timestamp-registry.js';
import { getChecksumAlgorithm } from './checksum_registry.js';
import { logger } from './logger.js';
import { CppTypeMapper } from './cpp-type-mapper.js';

/**
 * C++ 序列化实现生成器
 */
export class CppSerializerGenerator {
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
     * 生成完整的序列化实现代码
     *
     * @returns {string} 序列化实现代码
     */
    generate() {
        // 扫描所有被 Checksum 引用的字段
        const referencedFields = this._findReferencedFields();
        
        // 生成字段序列化调用代码（原有 Business 层）
        const fieldCalls = this._generateAllFieldCalls(referencedFields);

        // ================================================================
        // 两阶段重构：生成 Raw 序列化和转换上下文
        // ================================================================
        
        // 生成 Raw 层字段序列化代码
        const rawFieldCalls = this._generateRawFieldSerializeCalls();
        
        // 生成 to_raw() 转换代码
        const toRawConversions = this._generateToRawFieldConversions();

        // 准备模板上下文
        const context = {
            protocol_name: this.config.name,
            protocol_version: this.config.version,
            protocol_description: this.config.description,
            default_byte_order: this.config.defaultByteOrder,
            
            // 原有 Business 层字段序列化（兼容性保留）
            fields: fieldCalls,
            
            // 两阶段重构新增
            raw_field_calls: rawFieldCalls,
            to_raw_conversions: toRawConversions,
            has_two_phase: true  // 标记使用两阶段
        };

        // 渲染模板
        return this.templateManager.renderTemplate('main_parser/main_serializer.cpp.template', context);
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
     * 生成所有字段的序列化调用代码
     *
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Array} 字段调用信息列表
     */
    _generateAllFieldCalls(referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        const fieldCalls = [];
        let validityIndicatorName = null;

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

            // 生成字段序列化调用代码
            const callLines = this._generateFieldCallRecursive(field, 'data', referencedFields);
            let finalCode;

            // 处理有效性指示器（与解析对称）
            if (validityIndicatorName) {
                const wrappedLines = [];
                wrappedLines.push(`\n\n    if (${validityIndicatorName}) {\n`);

                callLines.forEach(line => {
                    if (line.trim()) {
                        wrappedLines.push('    ' + line);
                    } else {
                        wrappedLines.push('');
                    }
                });

                wrappedLines.push('    }\n');
                finalCode = wrappedLines.join('');
                validityIndicatorName = null;
            } else {
                finalCode = callLines.join('\n');
            }
            
            // 只在需要时生成结束偏移量捕获
            let endOffsetCaptureCode = '';
            if (isRangeEnd) {
                endOffsetCaptureCode = `\n    size_t offset_of_${field.fieldName}_end = ctx.offset;`;
            }

            fieldCalls.push({
                field_name: field.fieldName || '',
                type: field.type,
                description: field.description || '',
                field_serialize_code: offsetCaptureCode + finalCode + endOffsetCaptureCode
            });

            if (fieldInfo.isValidityIndicator) {
                validityIndicatorName = `data.${fieldInfo.fieldName}`;
            }
        }

        return fieldCalls;
    }

    /**
     * 递归生成字段序列化调用代码
     *
     * @param {Object} field - 字段配置
     * @param {string} dataPrefix - 数据变量前缀
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Array} 代码行数组
     */
    _generateFieldCallRecursive(field, dataPrefix, referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        const fieldInfo = getFieldInfo(field);
        const fieldType = fieldInfo.type;

        // 获取序列化模板路径
        const templatePath = this._getSerializeTemplateForType(fieldType);
        if (!templatePath) {
            logger.warn(`No serialize template found for type: ${fieldType}`);
            return [];
        }

        // 准备模板上下文
        const context = this._prepareCallContext(fieldInfo, dataPrefix, referencedFields);

        // 渲染模板
        const code = this.templateManager.renderTemplate(templatePath, context);

        // 预处理：去掉首尾空行
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

        return lines;
    }

    /**
     * 准备序列化模板上下文
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {string} dataPrefix - 数据变量前缀
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {Object} 模板上下文
     */
    _prepareCallContext(fieldInfo, dataPrefix, referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        // 基础上下文（所有类型通用）
        const context = {
            field_name: fieldInfo.fieldName,
            field_type: fieldInfo.type,
            field_name_capitalized: this._capitalize(fieldInfo.fieldName),
            data_prefix: dataPrefix,
            description: fieldInfo.description,
            has_description: !!fieldInfo.description
        };

        // 通用递归处理：对任何包含子元素的复合类型都适用 (Struct)
        const nestedFields = fieldInfo.fields || [];
        if (nestedFields.length > 0) {
            // 计算嵌套的 data_prefix
            const nestedDataPath = `${dataPrefix}.${fieldInfo.fieldName}`;
            
            // 递归处理所有子元素
            const subFieldCalls = [];
            for (const subFieldDict of nestedFields) {
                const callLines = this._generateFieldCallRecursive(subFieldDict, nestedDataPath, referencedFields);
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
            context.sub_field_calls = subFieldCalls;
        }

        // 添加类型特定的属性
        if (fieldInfo.byteLength) context.byte_length = fieldInfo.byteLength;
        if (fieldInfo.bitLength) context.bit_length = fieldInfo.bitLength;
        if (fieldInfo.fillValue) context.fill_value = fieldInfo.fillValue;
        if (fieldInfo.byteOrder) context.byte_order = fieldInfo.byteOrder;
        if (fieldInfo.isReversed !== undefined) context.is_reversed = fieldInfo.isReversed;
        if (fieldInfo.hasLsb) {
            context.has_lsb = true;
            context.lsb = fieldInfo.lsb;
        }
        if (fieldInfo.type === 'Float') {
            context.precision = fieldInfo.precision || (fieldInfo.byteLength === 8 ? 'double' : 'float');
        } else if (fieldInfo.precision) {
            context.precision = fieldInfo.precision;
        }
        if (fieldInfo.length !== undefined) context.length = fieldInfo.length;
        if (fieldInfo.encoding) context.encoding = fieldInfo.encoding;
        if (fieldInfo.subFields) context.sub_fields = fieldInfo.subFields;
        if (fieldInfo.baseType) context.base_type = fieldInfo.baseType;
        if (fieldInfo.valueType) context.value_type = fieldInfo.valueType;  // 用于 MessageId
        if (fieldInfo.messageIdValue !== undefined) context.message_id_value = fieldInfo.messageIdValue;  // 用于 MessageId

        // Timestamp 特殊处理：添加单位转换函数名
        if (fieldInfo.type === 'Timestamp' && fieldInfo.unit) {
            try {
                const timestampFuncs = getTimestampFunctions(fieldInfo.unit);
                context.parse_function = timestampFuncs.parse;
                context.serialize_function = timestampFuncs.serialize;
                context.unit = fieldInfo.unit;  // 也保留原始 unit，以防模板需要
            } catch (e) {
                // 如果单位不支持，抛出更详细的错误
                throw new Error(`Timestamp field '${fieldInfo.fieldName}' has unsupported unit: ${fieldInfo.unit}. ${e.message}`);
            }
        }

        // Array 特殊处理：生成元素序列化代码
        if (fieldInfo.type === 'Array') {
            // 1. 确定元素类型
            if (fieldInfo.element) {
                const elementInfo = getFieldInfo(fieldInfo.element);
                
                // 如果元素是 Struct，需要显式生成正确的结构体名称
                if (elementInfo.type === 'Struct') {
                    if (this.protocolName && this.protocolName !== 'null' && elementInfo.fieldName) {
                        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
                        context.element_type = `${this.protocolName}_${capitalize(elementInfo.fieldName)}`;
                    } else {
                         // 如果无法确定 struct 名称，回退到 CppTypeMapper
                         context.element_type = CppTypeMapper.mapType(elementInfo, this.protocolName);
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
                context.trailer_bytes = fieldInfo.bytesInTrailer;
                // 计算元素大小（用于 trailer 模式）
                context.element_size = this._calculateElementSize(fieldInfo.element);
            } else {
                context.count_type = 'fixed'; // 默认为 fixed
                context.count = 0;
            }
            
            context.element_serialize_code = this._generateElementSerializeCode(fieldInfo, referencedFields);
        }

        // Command 特殊处理：生成分支序列化代码
        if (fieldInfo.type === 'Command') {
            context.cases = this._prepareCasesSerializeCode(fieldInfo, dataPrefix);
        }
        
        // Checksum 特殊处理：生成校验计算和写入代码
        if (fieldInfo.type === 'Checksum') {
            const checksumContext = this._prepareChecksumSerializeContext(fieldInfo);
            Object.assign(context, checksumContext);
        }

        return context;
    }

    /**
     * 生成数组元素序列化代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {Object} referencedFields - { asStart: Set, asEnd: Set }
     * @returns {string} 元素序列化代码
     */
    _generateElementSerializeCode(fieldInfo, referencedFields = { asStart: new Set(), asEnd: new Set() }) {
        if (!fieldInfo.element) {
             return '// ERROR: Array 缺少 element 定义\n';
        }

        // 获取元素字段信息
        const elementInfo = getFieldInfo(fieldInfo.element);
        
        // 对于标量类型的元素
        const isScalarType = !['Struct', 'Array', 'Command'].includes(elementInfo.type);
        if (isScalarType) {
             // 保存原始 fieldName 用于变量命名
            const originalFieldName = elementInfo.fieldName || 'item';
            
            // 生成上下文，注意 dataPrefix 设为 'element'
            // 但是对于标量，通常模板期望的是 data_prefix.field_name
            // 为了适应模板，我们需要让 data_prefix + field_name 指向我们的 element 变量
            // 我们使用一个技巧：dataPrefix='element'，field_name='' (或者被覆盖)
            
            // 更好的方法：我们创建一个上下文，但手动覆盖一些字段
            const context = this._prepareCallContext(elementInfo, 'element'); // data_prefix='element'
            
            // 大多数序列化模板（如 unsigned_int_serialize）使用：
            // const {{ type_name }} {{ field_name }}_raw = static_cast<{{ type_name }}>({{ data_prefix }}.{{ field_name }});
            // 如果是标量数组元素，我们只有 'element' 变量，没有 'element.value'
            
            // 我们需要修改模板渲染后的代码，或者使用一个特殊的上下文
            // 这里我们假设 element 变量已经是我们要序列化的值
            // 我们将 field_name 设置为空字符串，这样 {{data_prefix}}.{{field_name}} 变成 "element."
            // 但这有语法错误。
            
            // 让我们看看 TemplateManager._generateElementParseCode 是怎么做的：
            // 它替换了赋值语句。
            
            // 对于序列化，我们可以让 field_name 为空，然后 data_prefix 为 element
            // 但是模板中有 {{field_name}}_raw 这样的变量名生成，如果 field_name 为空，变量名会很难看
            
            // 让我们用 fieldName 作为变量名后缀，但源数据是 element
            // 我们可以在 context 中设置 field_name 为 originalFieldName
            // 但是 data_prefix 设置为一个特殊值，或者我们后处理代码
            
            // 另一种方法：如果 fieldInfo.type 是标量，我们在模板中使用特殊逻辑？
            // 不，模板是通用的。
            
            // 让我们尝试这种方法：
            // 渲染模板，然后替换 `element.someField` 为 `element`
            
            const templatePath = this._getSerializeTemplateForType(elementInfo.type);
            if (!templatePath) {
                return `// TODO: 未实现元素类型 ${elementInfo.type} 的序列化\n`;
            }
            
            // 重新准备上下文，确保 field_name 正确
            context.field_name = originalFieldName;
            
            let code = this.templateManager.renderTemplate(templatePath, context);
            
            // 替换取值语句：element.<fieldName> -> element
            // 例如：element.val -> element
            // 正则表达式：element\.(\w+) -> element
            // 但是要小心不要替换 element_prefix 这种变量名
            
            // 实际上，生成的代码通常是：
            // ... = data.field;
            // 这里 data_prefix 是 'element'，field_name 是 originalFieldName
            // 所以生成的是 element.originalFieldName
            // 我们需要把它变成 element
            
            const pattern = new RegExp(`element\\.${originalFieldName}\\b`, 'g');
            code = code.replace(pattern, 'element');
            
            // 清理代码块的首尾空行
            code = code.trim();
            
            return code;
        }

        // 对于 Struct 类型：递归生成子字段序列化代码
        if (elementInfo.type === 'Struct') {
            if (!elementInfo.fields || elementInfo.fields.length === 0) {
                 return '// ERROR: Struct 元素缺少 fields 定义\n';
            }

            // dataPrefix 为 'element'，这样子字段访问就是 element.subField
            const lines = [];
            for (const subField of elementInfo.fields) {
                const subFieldInfo = getFieldInfo(subField);
                const templatePath = this._getSerializeTemplateForType(subFieldInfo.type);
                if (templatePath) {
                    const context = this._prepareCallContext(subFieldInfo, 'element');
                    let code = this.templateManager.renderTemplate(templatePath, context);
                    // 清理代码块的首尾空行
                    code = code.trim();
                    lines.push(code);
                }
            }
            // 使用单换行符连接，代码块之间紧凑排列
            return lines.join('\n');
        }
        
        // 其他复合类型（如嵌套 Array），暂时不支持或使用递归
        return '// TODO: 暂不支持嵌套复杂类型（如 Array）的序列化\n';
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
                return 0;
            }

            let totalSize = 0;
            for (const subField of elementInfo.fields) {
                const subFieldInfo = getFieldInfo(subField);
                if (subFieldInfo.byteLength) {
                    totalSize += subFieldInfo.byteLength;
                } else if (subFieldInfo.type === 'Float') {
                     if (subFieldInfo.precision === 'float' || subFieldInfo.byteLength === 4) {
                        totalSize += 4;
                    } else {
                        totalSize += 8; // double
                    }
                } else {
                     // 忽略复杂嵌套，只支持简单类型
                }
            }
            return totalSize;
        }
        
         // Float 类型
        if (elementInfo.type === 'Float') {
             if (elementInfo.precision === 'float' || elementInfo.byteLength === 4) {
                return 4;
            }
            return 8; // double
        }

        return 1;
    }

    /**
     * 准备 Command 分支序列化代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {string} dataPrefix - 数据变量前缀
     * @returns {Array} 分支信息数组
     */
    _prepareCasesSerializeCode(fieldInfo, dataPrefix) {
        if (!fieldInfo.cases) {
            return [];
        }

        const cases = [];
        for (const caseKey in fieldInfo.cases) {
            const caseConfig = fieldInfo.cases[caseKey];
            
            // 根据分支类型决定如何生成序列化代码
            let caseSerializeCode = '';
            if (caseConfig.type === 'Struct' && caseConfig.fields) {
                // 如果分支是 Struct，需要使用正确的前缀路径
                const casePath = `${dataPrefix}.${caseConfig.fieldName}`;
                caseSerializeCode = this._generateCaseFieldsSerializeCode(caseConfig.fields, casePath);
            } else if (caseConfig.type === 'Array') {
                // 如果分支是 Array，使用 Array 内联序列化模板
                const caseFieldInfo = getFieldInfo(caseConfig);
                const context = this._prepareCallContext(caseFieldInfo, dataPrefix);
                caseSerializeCode = this.templateManager.renderTemplate('composites/array_serialize_inline.cpp.template', context);
            } else if (caseConfig.fields) {
                // 如果分支有 fields 但不是 Struct（罕见情况）
                caseSerializeCode = this._generateCaseFieldsSerializeCode(caseConfig.fields, dataPrefix);
            } else {
                // 如果分支本身就是基础类型（如 UnsignedInt）
                const caseFieldInfo = getFieldInfo(caseConfig);
                const templatePath = this._getSerializeTemplateForType(caseFieldInfo.type);
                if (templatePath) {
                    const context = this._prepareCallContext(caseFieldInfo, dataPrefix);
                    caseSerializeCode = this.templateManager.renderTemplate(templatePath, context);
                }
            }
            
            // 清理所有 case 代码的首尾空行
            caseSerializeCode = caseSerializeCode.trim();
            
            cases.push({
                value: caseKey,
                case_name: caseConfig.fieldName || `case_${caseKey}`,
                case_serialize_code: caseSerializeCode
            });
        }

        return cases;
    }

    /**
     * 生成分支字段序列化代码
     *
     * @param {Array} fields - 字段数组
     * @param {string} dataPrefix - 数据变量前缀
     * @returns {string} 序列化代码
     */
    _generateCaseFieldsSerializeCode(fields, dataPrefix) {
        if (!fields || fields.length === 0) {
            return '';
        }

        const lines = [];
        for (const field of fields) {
            const fieldInfo = getFieldInfo(field);
            const templatePath = this._getSerializeTemplateForType(fieldInfo.type);
            if (templatePath) {
                const context = this._prepareCallContext(fieldInfo, dataPrefix);
                let code = this.templateManager.renderTemplate(templatePath, context);
                // 清理代码块的首尾空行
                code = code.trim();
                lines.push(code);
            }
        }

        // 使用单换行符连接，代码块之间紧凑排列
        return lines.join('\n');
    }

    /**
     * 准备 Checksum 序列化上下文
     * @param {FieldInfo} fieldInfo - 字段信息
     * @returns {Object} Checksum 上下文
     * @private
     */
    _prepareChecksumSerializeContext(fieldInfo) {
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
                    setterCalls.push(`        checker.${setterName}(${paramValue});`);
                }
            }
        }
        context.setter_calls = setterCalls.join('\n');
        
        return context;
    }

    // ========================================================================
    // 两阶段重构：Raw 序列化和转换方法
    // ========================================================================

    /**
     * 生成 Raw 层字段序列化调用代码
     * 用于 serialize_to() 方法
     *
     * @returns {Array} Raw 字段序列化代码数组
     */
    _generateRawFieldSerializeCalls() {
        const rawFieldCalls = [];
        let paddingIndex = 0;
        let reservedIndex = 0;

        for (const field of this.config.fields) {
            const fieldInfo = getFieldInfo(field);
            const fieldType = fieldInfo.type;
            const fieldName = fieldInfo.fieldName || '';

            // Padding 类型：生成写入代码
            if (fieldType === 'Padding') {
                const indexedName = fieldName || `padding_${paddingIndex++}`;
                const byteLength = fieldInfo.byteLength || 1;
                const fillValue = fieldInfo.fillValue || '0x00';
                
                rawFieldCalls.push({
                    field_name: indexedName,
                    type: 'Padding',
                    description: fieldInfo.description || 'Padding bytes',
                    raw_serialize_code: byteLength === 1 
                        ? `    ctx.write_uint8(raw.${indexedName});`
                        : `    ctx.write_bytes(raw.${indexedName}, ${byteLength});`,
                    byte_length: byteLength
                });
                continue;
            }

            // Reserved 类型：生成写入代码
            if (fieldType === 'Reserved') {
                const indexedName = fieldName || `reserved_${reservedIndex++}`;
                const byteLength = fieldInfo.byteLength || Math.ceil((fieldInfo.bitLength || 8) / 8);
                
                rawFieldCalls.push({
                    field_name: indexedName,
                    type: 'Reserved',
                    description: fieldInfo.description || 'Reserved bytes',
                    raw_serialize_code: byteLength === 1 
                        ? `    ctx.write_uint8(raw.${indexedName});`
                        : `    ctx.write_bytes(raw.${indexedName}, ${byteLength});`,
                    byte_length: byteLength
                });
                continue;
            }

            // Bitfield 类型：Raw 层写入原始整数
            if (fieldType === 'Bitfield') {
                const byteLength = fieldInfo.byteLength || 1;
                const intTypeMap = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
                const cppType = intTypeMap[byteLength] || 'uint32_t';
                const writeFunc = `serialize_unsigned_int_generic<${cppType}>`;
                
                rawFieldCalls.push({
                    field_name: `${fieldName}_raw`,
                    type: 'Bitfield',
                    description: fieldInfo.description || '',
                    raw_serialize_code: `    {\n        SerializeResult res = ${writeFunc}(ctx, raw.${fieldName}_raw);\n        if (!res.is_success()) return false;\n    }`,
                    original_field_name: fieldName
                });
                continue;
            }

            // 其他类型：生成标准序列化代码
            const serializeCode = this._generateRawSerializeCodeForField(fieldInfo, 'raw');
            rawFieldCalls.push({
                field_name: fieldName,
                type: fieldType,
                description: fieldInfo.description || '',
                raw_serialize_code: serializeCode
            });
        }

        return rawFieldCalls;
    }

    /**
     * 为单个字段生成 Raw 序列化代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @param {string} dataPrefix - 数据变量前缀
     * @returns {string} 序列化代码
     */
    _generateRawSerializeCodeForField(fieldInfo, dataPrefix) {
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
            
            return `    {\n        SerializeResult res = serialize_${funcPrefix}_int_generic<${cppType}>(ctx, ${dataPrefix}.${fieldName});\n        if (!res.is_success()) return false;\n    }`;
        }

        // Float 类型
        if (fieldType === 'Float') {
            const precision = fieldInfo.precision || 'float';
            const cppType = precision === 'double' ? 'double' : 'float';
            
            return `    {\n        SerializeResult res = serialize_float_generic<${cppType}>(ctx, ${dataPrefix}.${fieldName});\n        if (!res.is_success()) return false;\n    }`;
        }

        // String 类型
        if (fieldType === 'String') {
            const length = fieldInfo.length || 0;
            return `    {\n        SerializeResult res = serialize_string(ctx, ${dataPrefix}.${fieldName}, ${length});\n        if (!res.is_success()) return false;\n    }`;
        }

        // Timestamp 类型：Raw 层直接写入整数（不转换）
        if (fieldType === 'Timestamp') {
            const byteLength = fieldInfo.byteLength || 4;
            const cppType = byteLength === 8 ? 'uint64_t' : 'uint32_t';
            
            return `    {\n        SerializeResult res = serialize_unsigned_int_generic<${cppType}>(ctx, ${dataPrefix}.${fieldName});\n        if (!res.is_success()) return false;\n    }`;
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
            
            return `    {\n        SerializeResult res = serialize_${funcPrefix}_int_generic<${cppType}>(ctx, ${dataPrefix}.${fieldName});\n        if (!res.is_success()) return false;\n    }`;
        }

        // Encode 类型：Raw 层只写入整数值
        if (fieldType === 'Encode') {
            const byteLength = fieldInfo.byteLength || 1;
            const baseType = fieldInfo.baseType || 'unsigned';
            const typeMap = baseType === 'signed' 
                ? { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' }
                : { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            const cppType = typeMap[byteLength] || 'uint8_t';
            const funcPrefix = baseType === 'signed' ? 'signed' : 'unsigned';
            
            return `    {\n        SerializeResult res = serialize_${funcPrefix}_int_generic<${cppType}>(ctx, ${dataPrefix}.${fieldName});\n        if (!res.is_success()) return false;\n    }`;
        }

        // Bcd 类型
        if (fieldType === 'Bcd') {
            const byteLength = fieldInfo.byteLength || 1;
            return `    {\n        SerializeResult res = serialize_bcd(ctx, ${dataPrefix}.${fieldName}, ${byteLength});\n        if (!res.is_success()) return false;\n    }`;
        }

        // Struct、Array、Command 等复杂类型
        return `    // TODO: Raw serialize for ${fieldType} type ${fieldName}`;
    }

    /**
     * 生成 to_raw() 方法中的字段转换代码
     * 执行逆向单位转换、Bitfield 打包、Padding 填充
     *
     * @returns {Array} 转换代码数组
     */
    _generateToRawFieldConversions() {
        const conversions = [];
        let paddingIndex = 0;
        let reservedIndex = 0;

        for (const field of this.config.fields) {
            const fieldInfo = getFieldInfo(field);
            const fieldType = fieldInfo.type;
            const fieldName = fieldInfo.fieldName || '';

            // Padding 类型：填充默认值
            if (fieldType === 'Padding') {
                const indexedName = fieldName || `padding_${paddingIndex++}`;
                const byteLength = fieldInfo.byteLength || 1;
                const fillValue = fieldInfo.fillValue ? `0x${fieldInfo.fillValue}` : '0';
                
                conversions.push({
                    field_name: indexedName,
                    type: 'Padding',
                    description: fieldInfo.description || 'Padding bytes',
                    to_raw_code: byteLength === 1 
                        ? `    raw.${indexedName} = ${fillValue};`
                        : `    std::memset(raw.${indexedName}, ${fillValue}, ${byteLength});`
                });
                continue;
            }

            // Reserved 类型：填充默认值
            if (fieldType === 'Reserved') {
                const indexedName = fieldName || `reserved_${reservedIndex++}`;
                const byteLength = fieldInfo.byteLength || Math.ceil((fieldInfo.bitLength || 8) / 8);
                const fillValue = fieldInfo.fillValue ? `0x${fieldInfo.fillValue}` : '0';
                
                conversions.push({
                    field_name: indexedName,
                    type: 'Reserved',
                    description: fieldInfo.description || 'Reserved bytes',
                    to_raw_code: byteLength === 1 
                        ? `    raw.${indexedName} = ${fillValue};`
                        : `    std::memset(raw.${indexedName}, ${fillValue}, ${byteLength});`
                });
                continue;
            }

            // 准备转换代码
            const conversion = {
                field_name: fieldName,
                type: fieldType,
                description: fieldInfo.description || '',
                has_valid_when: !!fieldInfo.validWhen,
                to_raw_code: ''
            };

            // 根据类型生成转换代码
            conversion.to_raw_code = this._generateToRawCodeForField(fieldInfo);
            conversions.push(conversion);
        }

        return conversions;
    }

    /**
     * 为单个字段生成 Business → Raw 转换代码
     *
     * @param {FieldInfo} fieldInfo - 字段信息
     * @returns {string} 转换代码
     */
    _generateToRawCodeForField(fieldInfo) {
        const fieldType = fieldInfo.type;
        const fieldName = fieldInfo.fieldName;
        const lines = [];

        // validWhen 条件处理
        if (fieldInfo.validWhen) {
            lines.push(`    if (data.${fieldName}_valid) {`);
        }

        const indent = fieldInfo.validWhen ? '        ' : '    ';

        // 根据类型生成具体转换
        switch (fieldType) {
            case 'Bitfield':
                // Bitfield 打包
                lines.push(`${indent}// Bitfield 打包`);
                lines.push(`${indent}raw.${fieldName}_raw = 0;`);
                if (fieldInfo.subFields) {
                    for (const subField of fieldInfo.subFields) {
                        lines.push(`${indent}raw.${fieldName}_raw |= (data.${fieldName}.${subField.name} & 0x${((1 << (subField.endBit - subField.startBit + 1)) - 1).toString(16)}) << ${subField.startBit};`);
                    }
                }
                break;

            case 'Encode':
                // Encode 类型：只使用值
                lines.push(`${indent}raw.${fieldName} = data.${fieldName}_value;`);
                break;

            case 'Timestamp':
                // Timestamp 逆向转换（如果需要）
                lines.push(`${indent}raw.${fieldName} = data.${fieldName};  // TODO: 逆向单位转换`);
                break;

            default:
                // 简单复制
                lines.push(`${indent}raw.${fieldName} = data.${fieldName};`);
        }

        // validWhen 条件结束
        if (fieldInfo.validWhen) {
            lines.push(`    } else {`);
            if (fieldType === 'Bitfield') {
                lines.push(`        raw.${fieldName}_raw = 0;`);
            } else {
                lines.push(`        raw.${fieldName} = 0;  // 无效时填充默认值`);
            }
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

    /**
     * 根据类型获取序列化模板路径
     *
     * @param {string} type - 字段类型
     * @returns {string} 模板路径
     */
    _getSerializeTemplateForType(type) {
        return this.templateManager.getSerializeTemplatePathForType(type);
    }
}
