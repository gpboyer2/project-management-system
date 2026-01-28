/**
 * C++ 头文件生成器
 * 根据协议配置生成 C++ 头文件，包括结构体定义和函数声明
 */

import { TemplateManager } from './template-manager.js';
import { FieldInfo } from './config-parser.js';
import { CppTypeMapper } from './cpp-type-mapper.js';

/**
 * C++ 头文件生成器
 */
export class CppHeaderGenerator {
    /**
     * @param {ProtocolConfig} config - 协议配置对象
     * @param {TemplateManager} templateManager - 模板管理器实例
     */
    constructor(config, templateManager = null) {
        this.config = config;
        this.protocolName = config.name;
        this.templateManager = templateManager || new TemplateManager(null, config.name);
        
        // 两阶段重构：Padding/Reserved 字段索引计数器
        this._paddingIndex = 0;
        this._reservedIndex = 0;
    }

    /**
     * 生成完整的头文件内容
     *
     * @returns {string} 头文件内容
     */
    generate() {
        // ================================================================
        // 两阶段重构：重置 Padding/Reserved 计数器
        // ================================================================
        this._paddingIndex = 0;
        this._reservedIndex = 0;

        // ================================================================
        // 1. 准备 Raw 层结构体（Phase 1: Protocol Layer）
        // ================================================================
        
        // 生成 Raw 嵌套结构体定义
        const rawStructs = this._generateRawSubStructs(this.config.name);
        
        // 重置计数器（用于顶层字段）
        this._paddingIndex = 0;
        this._reservedIndex = 0;
        
        // 生成 Raw 顶层字段上下文
        const rawFields = this._generateRawFieldContext(this.config.fields, this.config.name);

        // ================================================================
        // 2. 准备 Business 层结构体（Phase 2: Application Layer）
        // ================================================================
        
        // 准备子结构体定义（Business 版本）
        const structs = [];
        for (const structField of this.config.getAllStructs()) {
            const structDef = this.renderStructDefinition(this.config.name, structField);
            structs.push(structDef);
        }

        // 准备顶层字段列表（Business 版本）
        const preparedFields = [];
        let hasValidWhenFields = false;
        for (const field of this.config.fields) {
            const fieldInfo = new FieldInfo(field);
            const preparedField = this._prepareMainFieldContext(this.config.name, field, fieldInfo);
            preparedFields.push(preparedField);
            
            // 检测是否有 validWhen 字段
            if (preparedField.has_valid_when) {
                hasValidWhenFields = true;
            }
        }

        // 准备主结构体构造函数初始化列表
        const initializers = this._prepareMainConstructorInitializers(this.config.fields);

        // 生成压缩器成员变量
        const compressionMembers = this._generateCompressionMembers();

        // ================================================================
        // 3. 组装模板上下文
        // ================================================================
        const context = {
            protocol_name: this.config.name,
            PROTOCOL_NAME_UPPER: this.config.name.toUpperCase(),
            namespace: this.config.getNamespaceName(),
            
            // Business 层（原有）
            structs: structs,
            fields: preparedFields,
            constructor_initializers: initializers.join(', '),
            has_initializers: initializers.length > 0,
            default_byte_order: this.config.getByteOrderEnum(),

            // Raw 层（两阶段重构新增）
            raw_structs: rawStructs,
            raw_fields: rawFields,
            has_valid_when_fields: hasValidWhenFields,

            // 结构体对齐配置
            struct_alignment: this.config.structAlignment,

            // 框架头文件相对路径（用于多层级目录结构）
            framework_relative_path: this.templateManager.frameworkRelativePath || './',

            // 压缩相关上下文
            has_message_compression: !!this.config.messageCompression,
            message_compression_type: this.config.messageCompression?.type || null,
            compression_members: compressionMembers,
            has_compression_members: compressionMembers.length > 0,

            // 时间戳相关上下文
            has_timestamp_fields: this._hasTimestampFields(),

            // 校验和相关上下文
            has_checksum_fields: this._hasChecksumFields()
        };

        return this.templateManager.renderTemplate('main_parser/main_parser.h.template', context);
    }

    /**
     * 渲染子结构体定义（用于头文件生成）
     *
     * @param {string} protocolName - 协议名称
     * @param {Object} structField - 结构体字段配置
     * @returns {string} 渲染后的结构体定义代码
     */
    renderStructDefinition(protocolName, structField) {
        const fieldName = structField.fieldName || '';
        const description = structField.description || '';
        const fields = structField.fields || [];

        // 结构体名称：协议名_字段名（首字母大写）
        const structName = `${protocolName}_${this._capitalize(fieldName)}`;

        // 准备字段列表
        const preparedFields = [];
        for (const field of fields) {
            const fieldInfo = new FieldInfo(field);
            const preparedField = this._prepareStructFieldContext(protocolName, fieldInfo);
            preparedFields.push(preparedField);
        }

        // 准备构造函数初始化列表
        const initializers = this._prepareStructConstructorInitializers(fields);

        const context = {
            struct_name: structName,
            field_name_capitalized: this._capitalize(fieldName),
            description: description,
            fields: preparedFields,
            constructor_initializers: initializers.join(', '),
            has_initializers: initializers.length > 0
        };

        return this.templateManager.renderTemplate('composites/struct.h.template', context);
    }

    /**
     * 为结构体字段准备模板上下文
     *
     * @param {string} protocolName - 协议名称
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @returns {Object} 字段上下文字典
     */
    _prepareStructFieldContext(protocolName, fieldInfo) {
        let fieldType = CppTypeMapper.mapType(fieldInfo, protocolName);

        // 特殊处理 Struct 类型，生成正确的结构体名称
        if (fieldInfo.type === 'Struct') {
            fieldType = `${protocolName}_${this._capitalize(fieldInfo.fieldName)}`;
        }

        const context = {
            field_type: fieldType,
            field_name: fieldInfo.fieldName,
            description: fieldInfo.description,
            unit: fieldInfo.unit,
            is_bitfield: fieldInfo.type === 'Bitfield',
            is_encode: fieldInfo.type === 'Encode'
        };

        // 如果是 Bitfield，准备子字段信息
        if (fieldInfo.type === 'Bitfield') {
            const bitfieldSubFields = [];
            for (const subField of fieldInfo.subFields) {
                bitfieldSubFields.push({
                    name: subField.name || '',
                    description: subField.description || '',
                    has_maps: !!(subField.maps && subField.maps.length > 0)
                });
            }
            context.bitfield_sub_fields = bitfieldSubFields;
        }

        return context;
    }

    /**
     * 为主结构体字段准备模板上下文
     *
     * @param {string} protocolName - 协议名称
     * @param {Object} field - 原始字段配置
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @returns {Object} 字段上下文字典
     */
    _prepareMainFieldContext(protocolName, field, fieldInfo) {
        const fieldType = field.type;
        const fieldName = field.fieldName || '';
        const description = field.description || '';
        const unit = field.unit || '';

        // Command 类型特殊处理：生成命令字字段 + 所有分支字段
        if (fieldType === 'Command') {
            // 1. 确定命令字字段类型
            const commandTypeMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            const commandCppType = commandTypeMap[fieldInfo.byteLength] || 'uint64_t';

            // 2. 收集所有分支字段
            const caseFields = [];
            if (fieldInfo.cases && typeof fieldInfo.cases === 'object') {
                for (const caseKey in fieldInfo.cases) {
                    const caseConfig = fieldInfo.cases[caseKey];
                    const caseFieldInfo = new FieldInfo(caseConfig);
                    const caseCppType = CppTypeMapper.mapType(caseFieldInfo, protocolName);
                    
                    caseFields.push({
                        field_name: caseConfig.fieldName || `case_${caseKey}`,
                        field_cpp_type: caseCppType,
                        description: caseConfig.description || `Case ${caseKey}`,
                        is_struct: caseConfig.type === 'Struct',
                        is_bitfield: caseConfig.type === 'Bitfield',
                        is_encode: caseConfig.type === 'Encode',
                        struct_type: caseConfig.type === 'Struct' 
                            ? `${protocolName}_${this._capitalize(caseConfig.fieldName)}` 
                            : null,
                        // 如果是 Bitfield，也需要处理子字段
                        bitfield_sub_fields: caseConfig.type === 'Bitfield' 
                            ? (caseConfig.subFields || []).map(sf => ({
                                name: sf.name || '',
                                has_maps: !!(sf.maps && sf.maps.length > 0)
                            }))
                            : []
                    });
                }
            }

            return {
                field_name: fieldName,
                description: description,
                is_command: true,
                command_cpp_type: commandCppType,
                case_fields: caseFields  // 所有分支字段
            };
        }

        // Padding 和 Reserved 类型：跳过（不生成结构体成员）
        if (fieldType === 'Padding' || fieldType === 'Reserved') {
            return {
                field_name: fieldName,
                description: description,
                is_padding: true,
                field_cpp_type: 'PADDING_TYPE_SPECIAL'  // 标记，实际不使用
            };
        }

        const context = {
            field_name: fieldName,
            description: description,
            unit: unit,
            field_cpp_type: CppTypeMapper.mapType(fieldInfo, protocolName),
            is_struct: fieldType === 'Struct',
            is_bitfield: fieldType === 'Bitfield',
            is_checksum: fieldType === 'Checksum',
            is_encode: fieldType === 'Encode'
        };

        // 两阶段重构：检测 validWhen 配置
        if (fieldInfo.validWhen) {
            context.has_valid_when = true;
            context.valid_when_field = fieldInfo.validWhen.field;
            context.valid_when_value = fieldInfo.validWhen.value;
        } else {
            context.has_valid_when = false;
        }

        // Struct 类型字段
        if (fieldType === 'Struct') {
            context.struct_type = `${protocolName}_${this._capitalize(fieldName)}`;
        }

        // Bitfield 类型字段
        if (fieldType === 'Bitfield') {
            const bitfieldSubFields = [];
            for (const subField of fieldInfo.subFields) {
                bitfieldSubFields.push({
                    name: subField.name || '',
                    has_maps: !!(subField.maps && subField.maps.length > 0)
                });
            }
            context.bitfield_sub_fields = bitfieldSubFields;
        }

        return context;
    }

    /**
     * 为结构体准备构造函数初始化列表
     *
     * @param {Array} fields - 字段列表
     * @returns {Array} 初始化语句列表
     */
    _prepareStructConstructorInitializers(fields) {
        const initializers = [];

        for (const field of fields) {
            const fieldInfo = new FieldInfo(field);
            const fieldName = fieldInfo.fieldName;

            if (fieldInfo.type === 'Bitfield') {
                // Bitfield 字段现在是嵌套结构体，成员在定义时已初始化
            } else if (fieldInfo.type === 'Struct') {
                // Struct 类型由其自己的构造函数处理
            } else if (fieldInfo.type === 'String' || fieldInfo.type === 'Bcd') {
                // String/Bcd 类型：只有配置了 defaultValue 时才初始化
                const defaultVal = fieldInfo.defaultValue;
                if (defaultVal !== null && defaultVal !== undefined) {
                    // 字符串默认值需要用引号包裹，并转义内部引号
                    const escapedVal = defaultVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    initializers.push(`${fieldName}("${escapedVal}")`);
                }
            } else if (fieldInfo.type === 'Bytes') {
                // Bytes 类型（std::vector）暂不处理 defaultValue
            } else if (fieldInfo.type === 'MessageId') {
                // MessageId 使用 messageIdValue 作为默认值（序列化时使用）
                const msgIdVal = fieldInfo.messageIdValue;
                if (msgIdVal !== null && msgIdVal !== undefined) {
                    initializers.push(`${fieldName}(${msgIdVal})`);
                }
            } else if (fieldInfo.type === 'Array') {
                // 固定长度数组：如果有 count，生成初始化
                if (fieldInfo.count !== null && fieldInfo.count !== undefined) {
                    const element = fieldInfo.element;
                    if (element && element.defaultValue !== null && element.defaultValue !== undefined) {
                        // 生成: fieldName(count, defaultValue)
                        initializers.push(`${fieldName}(${fieldInfo.count}, ${element.defaultValue})`);
                    } else {
                        // 没有 defaultValue，初始化为指定大小的默认值数组
                        initializers.push(`${fieldName}(${fieldInfo.count})`);
                    }
                }
            } else {
                // 只处理用户明确配置的默认值
                const defaultVal = fieldInfo.defaultValue;
                if (defaultVal !== null && defaultVal !== undefined) {
                    initializers.push(`${fieldName}(${defaultVal})`);
                }
            }
        }

        return initializers;
    }

    /**
     * 为主结构体准备构造函数初始化列表
     *
     * @param {Array} fields - 字段列表
     * @returns {Array} 初始化语句列表
     */
    _prepareMainConstructorInitializers(fields) {
        const initializers = [];

        for (const field of fields) {
            const fieldInfo = new FieldInfo(field);
            const fieldName = fieldInfo.fieldName;
            const fieldType = fieldInfo.type;

            if (fieldType === 'Bitfield') {
                // Bitfield 字段现在是嵌套结构体，成员在定义时已初始化，不需要在初始化列表中处理
            } else if (fieldType === 'Struct') {
                // Struct 类型由其自己的构造函数处理，不添加初始化
            } else if (fieldType === 'String' || fieldType === 'Bcd') {
                // String/Bcd 类型：只有配置了 defaultValue 时才初始化
                const defaultVal = fieldInfo.defaultValue;
                if (defaultVal !== null && defaultVal !== undefined) {
                    // 字符串默认值需要用引号包裹，并转义内部引号
                    const escapedVal = defaultVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                    initializers.push(`${fieldName}("${escapedVal}")`);
                }
            } else if (fieldType === 'Bytes') {
                // Bytes 类型（std::vector）暂不处理 defaultValue
            } else if (fieldType === 'MessageId') {
                // MessageId 使用 messageIdValue 作为默认值（序列化时使用）
                const msgIdVal = fieldInfo.messageIdValue;
                if (msgIdVal !== null && msgIdVal !== undefined) {
                    initializers.push(`${fieldName}(${msgIdVal})`);
                }
            } else if (fieldType === 'Array') {
                // 固定长度数组：如果有 count，生成初始化
                if (fieldInfo.count !== null && fieldInfo.count !== undefined) {
                    const element = fieldInfo.element;
                    if (element && element.defaultValue !== null && element.defaultValue !== undefined) {
                        // 生成: fieldName(count, defaultValue)
                        initializers.push(`${fieldName}(${fieldInfo.count}, ${element.defaultValue})`);
                    } else {
                        // 没有 defaultValue，初始化为指定大小的默认值数组
                        initializers.push(`${fieldName}(${fieldInfo.count})`);
                    }
                }
            } else {
                // 只处理用户明确配置的默认值
                const defaultVal = fieldInfo.defaultValue;
                if (defaultVal !== null && defaultVal !== undefined) {
                    initializers.push(`${fieldName}(${defaultVal})`);
                }
            }
        }

        return initializers;
    }

    // ========================================================================
    // 两阶段重构：Raw 结构体生成方法
    // ========================================================================

    /**
     * 为 Raw 结构体准备字段上下文
     * 遍历所有字段（包括 Padding/Reserved），生成 Raw 层字段信息
     *
     * @param {Array} fields - 字段配置数组
     * @param {string} protocolName - 协议名称
     * @returns {Array} Raw 层字段上下文数组
     */
    _generateRawFieldContext(fields, protocolName) {
        const rawFields = [];

        for (const field of fields) {
            const fieldInfo = new FieldInfo(field);
            const fieldType = fieldInfo.type;
            const fieldName = fieldInfo.fieldName || '';
            const description = fieldInfo.description || '';

            // Padding 类型：使用索引命名
            if (fieldType === 'Padding') {
                const indexedName = fieldName || `padding_${this._paddingIndex++}`;
                const byteLength = fieldInfo.byteLength || 1;
                
                rawFields.push({
                    field_name: indexedName,
                    field_cpp_type: byteLength === 1 ? 'uint8_t' : `uint8_t[${byteLength}]`,
                    description: description || 'Padding bytes',
                    is_padding: true,
                    is_array_padding: byteLength > 1,
                    byte_length: byteLength
                });
                continue;
            }

            // Reserved 类型：使用索引命名
            if (fieldType === 'Reserved') {
                const indexedName = fieldName || `reserved_${this._reservedIndex++}`;
                const byteLength = fieldInfo.byteLength || Math.ceil((fieldInfo.bitLength || 8) / 8);
                
                rawFields.push({
                    field_name: indexedName,
                    field_cpp_type: byteLength === 1 ? 'uint8_t' : `uint8_t[${byteLength}]`,
                    description: description || 'Reserved bytes',
                    is_reserved: true,
                    is_array_reserved: byteLength > 1,
                    byte_length: byteLength
                });
                continue;
            }

            // Bitfield 类型：Raw 层保持原始整数
            if (fieldType === 'Bitfield') {
                const byteLength = fieldInfo.byteLength || 1;
                const intTypeMap = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
                const cppType = intTypeMap[byteLength] || 'uint32_t';
                
                rawFields.push({
                    field_name: `${fieldName}_raw`,
                    field_cpp_type: cppType,
                    description: `${description} (raw bitfield)`,
                    is_bitfield_raw: true,
                    original_field_name: fieldName
                });
                continue;
            }

            // Struct 类型：使用 _Raw 后缀的结构体
            if (fieldType === 'Struct') {
                const structType = `${protocolName}_${this._capitalize(fieldName)}_Raw`;
                rawFields.push({
                    field_name: fieldName,
                    field_cpp_type: structType,
                    description: description,
                    is_struct_raw: true
                });
                continue;
            }

            // Command 类型：Raw 层只保留命令字和所有分支的 Raw 版本
            if (fieldType === 'Command') {
                const commandTypeMap = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
                const commandCppType = commandTypeMap[fieldInfo.byteLength] || 'uint64_t';
                
                rawFields.push({
                    field_name: `${fieldName}_command`,
                    field_cpp_type: commandCppType,
                    description: `${description} (command value)`,
                    is_command_raw: true
                });

                // 为每个分支生成 Raw 字段
                if (fieldInfo.cases && typeof fieldInfo.cases === 'object') {
                    for (const caseKey in fieldInfo.cases) {
                        const caseConfig = fieldInfo.cases[caseKey];
                        const caseFieldInfo = new FieldInfo(caseConfig);
                        
                        if (caseConfig.type === 'Struct') {
                            const caseStructType = `${protocolName}_${this._capitalize(caseConfig.fieldName)}_Raw`;
                            rawFields.push({
                                field_name: caseConfig.fieldName,
                                field_cpp_type: caseStructType,
                                description: caseConfig.description || `Case ${caseKey}`,
                                is_struct_raw: true
                            });
                        } else {
                            const caseCppType = CppTypeMapper.mapType(caseFieldInfo, protocolName);
                            rawFields.push({
                                field_name: caseConfig.fieldName || `case_${caseKey}`,
                                field_cpp_type: caseCppType,
                                description: caseConfig.description || `Case ${caseKey}`
                            });
                        }
                    }
                }
                continue;
            }

            // Array 类型：保持数组，但元素类型可能需要 _Raw 后缀
            if (fieldType === 'Array') {
                let elementType = CppTypeMapper.mapType(fieldInfo, protocolName);
                
                // 如果元素是 Struct，使用 _Raw 后缀
                if (fieldInfo.element && fieldInfo.element.type === 'Struct') {
                    const elementName = fieldInfo.element.fieldName || 'Element';
                    elementType = `std::vector<${protocolName}_${this._capitalize(elementName)}_Raw>`;
                }
                
                rawFields.push({
                    field_name: fieldName,
                    field_cpp_type: elementType,
                    description: description,
                    is_array_raw: true
                });
                continue;
            }

            // 其他类型：直接使用 CppTypeMapper
            const cppType = CppTypeMapper.mapType(fieldInfo, protocolName);
            rawFields.push({
                field_name: fieldName,
                field_cpp_type: cppType,
                description: description
            });
        }

        return rawFields;
    }

    /**
     * 递归为嵌套 Struct 生成 _Raw 版本的定义
     *
     * @param {string} protocolName - 协议名称
     * @returns {Array} Raw 层嵌套结构体定义数组（预渲染的字符串）
     */
    _generateRawSubStructs(protocolName) {
        const rawStructs = [];

        // 遍历所有 Struct 类型的字段
        for (const structField of this.config.getAllStructs()) {
            const rawStructDef = this._renderRawStructDefinition(protocolName, structField);
            rawStructs.push(rawStructDef);
        }

        return rawStructs;
    }

    /**
     * 渲染单个 Raw 子结构体定义
     *
     * @param {string} protocolName - 协议名称
     * @param {Object} structField - 结构体字段配置
     * @returns {string} 渲染后的 Raw 结构体定义代码
     */
    _renderRawStructDefinition(protocolName, structField) {
        const fieldName = structField.fieldName || '';
        const description = structField.description || '';
        const fields = structField.fields || [];

        // Raw 结构体名称：协议名_字段名_Raw
        const rawStructName = `${protocolName}_${this._capitalize(fieldName)}_Raw`;

        // 重置计数器（每个结构体独立计数）
        const savedPaddingIndex = this._paddingIndex;
        const savedReservedIndex = this._reservedIndex;
        this._paddingIndex = 0;
        this._reservedIndex = 0;

        // 为 Raw 结构体准备字段
        const rawFields = this._generateRawFieldContext(fields, protocolName);

        // 恢复计数器
        this._paddingIndex = savedPaddingIndex;
        this._reservedIndex = savedReservedIndex;

        const context = {
            struct_name: rawStructName,
            field_name_capitalized: this._capitalize(fieldName),
            description: `${description} (Raw)`,
            fields: rawFields,
            is_raw_struct: true,
            has_initializers: false,
            constructor_initializers: ''
        };

        return this.templateManager.renderTemplate('composites/struct_raw.h.template', context);
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
     * 生成压缩器成员变量声明
     * 区分报文级压缩和字段级压缩
     *
     * @returns {Array<Object>} 压缩器成员变量列表
     */
    _generateCompressionMembers() {
        const members = [];

        // 报文级压缩：单个成员变量
        if (this.config.messageCompression) {
            const type = this.config.messageCompression.type;
            const algo = getCompressionAlgorithm(type);
            if (algo) {
                members.push({
                    class_name: algo.className,
                    member_name: 'm_messageCompressor',
                    description: `Message-level ${type} compressor`
                });
            }
            return members;  // 报文级压缩时，不再生成字段级压缩器
        }

        // 字段级压缩：为每个有压缩配置的字段生成压缩器
        for (const field of this.config.fields) {
            const fieldInfo = new FieldInfo(field);
            if (fieldInfo.compression) {
                const algo = getCompressionAlgorithm(fieldInfo.compressionType);
                if (algo) {
                    members.push({
                        class_name: algo.className,
                        member_name: `m_${fieldInfo.fieldName}Compressor`,
                        description: `${fieldInfo.fieldName} field ${fieldInfo.compressionType} compressor`
                    });
                }
            }
        }

        return members;
    }

    /**
     * 检测协议中是否有 Timestamp 类型的字段（递归检测所有字段）
     *
     * @returns {boolean} 是否包含 Timestamp 字段
     */
    _hasTimestampFields() {
        return this._hasTimestampFieldsRecursive(this.config.fields);
    }

    /**
     * 递归检测字段列表中是否有 Timestamp 类型
     *
     * @param {Array} fields - 字段列表
     * @returns {boolean} 是否包含 Timestamp 字段
     */
    _hasTimestampFieldsRecursive(fields) {
        for (const field of fields) {
            if (field.type === 'Timestamp') {
                return true;
            }
            // 递归检查 Struct 和 Command 中的嵌套字段
            if (field.type === 'Struct' && field.fields) {
                if (this._hasTimestampFieldsRecursive(field.fields)) {
                    return true;
                }
            }
            if (field.type === 'Command' && field.cases) {
                for (const caseKey in field.cases) {
                    const caseConfig = field.cases[caseKey];
                    if (caseConfig.fields && this._hasTimestampFieldsRecursive(caseConfig.fields)) {
                        return true;
                    }
                }
            }
            // 递归检查 Array 中的元素
            if (field.type === 'Array' && field.elementType === 'Struct' && field.elementConfig) {
                if (this._hasTimestampFieldsRecursive([field.elementConfig])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检测协议中是否有 Checksum 类型的字段（递归检测所有字段）
     *
     * @returns {boolean} 是否包含 Checksum 字段
     */
    _hasChecksumFields() {
        return this._hasChecksumFieldsRecursive(this.config.fields);
    }

    /**
     * 递归检测字段列表中是否有 Checksum 类型
     *
     * @param {Array} fields - 字段列表
     * @returns {boolean} 是否包含 Checksum 字段
     */
    _hasChecksumFieldsRecursive(fields) {
        for (const field of fields) {
            if (field.type === 'Checksum') {
                return true;
            }
            // 递归检查 Struct 中的嵌套字段
            if (field.type === 'Struct' && field.fields) {
                if (this._hasChecksumFieldsRecursive(field.fields)) {
                    return true;
                }
            }
            // 递归检查 Command 的 cases
            if (field.type === 'Command' && field.cases) {
                for (const caseKey in field.cases) {
                    const caseConfig = field.cases[caseKey];
                    if (caseConfig.fields && this._hasChecksumFieldsRecursive(caseConfig.fields)) {
                        return true;
                    }
                }
            }
            // 递归检查 Array 中的元素
            if (field.type === 'Array' && field.elementType === 'Struct' && field.elementConfig) {
                if (this._hasChecksumFieldsRecursive([field.elementConfig])) {
                    return true;
                }
            }
        }
        return false;
    }
}
