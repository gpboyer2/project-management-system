/**
 * JSON 配置解析模块
 * 用于解析协议配置文件，提取字段信息和协议元数据
 */

import { readFile } from 'fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * 协议配置类，用于存储解析后的协议信息
 */
export class ProtocolConfig {
    constructor(configDict) {
        this.name = configDict.name || 'UnknownProtocol';
        this.description = configDict.description || '';
        this.version = configDict.version || '1.0';
        this.defaultByteOrder = configDict.defaultByteOrder || 'big';
        this.fields = configDict.fields || [];

        // 结构体字节对齐配置
        this.structAlignment = configDict.structAlignment || null;

        // 验证结构体对齐配置
        if (this.structAlignment !== null) {
            this._validateStructAlignment(this.structAlignment);
        }
    }

    /**
     * 获取命名空间名称
     */
    getNamespaceName() {
        return 'protocol_parser';
    }

    /**
     * 获取结构体名称前缀
     */
    getStructNamePrefix() {
        return this.name;
    }

    /**
     * 获取字节序枚举值
     */
    getByteOrderEnum() {
        const order = this.defaultByteOrder.toLowerCase();
        if (order === 'big') {
            return 'BIG_ENDIAN';
        } else if (order === 'little') {
            return 'LITTLE_ENDIAN';
        } else {
            return 'BIG_ENDIAN';
        }
    }

    /**
     * 获取所有结构体字段（递归，后序遍历以确保依赖顺序）
     * 自动去重：同名的 Struct 只保留一次
     */
    getAllStructs() {
        const structs = [];
        const structNames = new Set();  // 用于去重

        const collectStructs = (fieldList) => {
            if (!fieldList) return;

            for (const field of fieldList) {
                // 检查 Array 中的 Struct 元素
                if (field.type === 'Array' && field.element) {
                    const element = field.element;
                    if (element.type === 'Struct') {
                        // 递归收集嵌套结构体的子字段
                        if (element.fields) {
                            collectStructs(element.fields);
                        }
                        
                        // 去重：只添加未见过的 Struct
                        const structName = element.fieldName;
                        if (structName && !structNames.has(structName)) {
                            structNames.add(structName);
                            structs.push(element);
                        }
                    } else if (element.type === 'Array') {
                        // 递归处理嵌套数组
                        collectStructs([element]);
                    }
                }

                // 检查 Command 中的分支
                if (field.type === 'Command' && field.cases) {
                    for (const caseKey in field.cases) {
                        const caseConfig = field.cases[caseKey];
                        
                        // 如果分支本身是 Struct，需要收集它
                        if (caseConfig.type === 'Struct') {
                            // 先递归收集子字段
                            if (caseConfig.fields) {
                                collectStructs(caseConfig.fields);
                            }
                            
                            // 然后收集这个 Struct 本身
                            const structName = caseConfig.fieldName;
                            if (structName && !structNames.has(structName)) {
                                structNames.add(structName);
                                structs.push(caseConfig);
                            }
                        } else if (caseConfig.fields) {
                            // 如果不是 Struct 但有 fields，仍然递归收集
                            collectStructs(caseConfig.fields);
                        }
                    }
                }

                if (field.type === 'Struct') {
                    // 先递归收集子字段中的结构体（依赖优先）
                    if (field.fields) {
                        collectStructs(field.fields);
                    }
                    
                    // 去重：只添加未见过的 Struct
                    const structName = field.fieldName;
                    if (structName && !structNames.has(structName)) {
                        structNames.add(structName);
                        structs.push(field);
                    }
                }
            }
        };

        collectStructs(this.fields);
        return structs;
    }

    /**
     * 获取所有校验和字段
     */
    getChecksumFields() {
        const checksums = [];
        for (const field of this.fields) {
            if (field.type === 'Checksum') {
                checksums.push(field);
            }
        }
        return checksums;
    }

    /**
     * 验证结构体对齐配置（私有方法）
     */
    _validateStructAlignment(alignment) {
        const validAlignments = [1, 2, 4, 8, 16];
        if (!validAlignments.includes(alignment)) {
            throw new Error(
                `Invalid structAlignment value: ${alignment}. ` +
                `Must be one of: ${validAlignments.join(', ')}`
            );
        }
    }
}

/**
 * 软件配置类，用于存储多层级软件配置信息
 * 
 * 层级结构：软件 -> 通信节点列表 -> 图元列表 -> 协议
 */
export class SoftwareConfig {
    constructor(configDict) {
        this.softwareName = configDict.softwareName || 'UnknownSoftware';
        this.description = configDict.description || '';
        this.commNodeList = configDict.commNodeList || [];
        
        // 验证配置
        this._validate();
    }

    /**
     * 验证软件配置（私有方法）
     * @private
     */
    _validate() {
        // 验证软件名称是否为有效的 C++ 标识符
        const cppIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!cppIdentifierPattern.test(this.softwareName)) {
            throw new Error(
                `Invalid software name: "${this.softwareName}" ` +
                `(must be a valid C++ identifier)`
            );
        }

        // 验证通信节点列表
        if (this.commNodeList.length === 0) {
            throw new Error('Software configuration must include at least one communication node');
        }

        for (const commNode of this.commNodeList) {
            if (!commNode.id) {
                throw new Error('Communication node must have an "id" field');
            }
            if (!commNode.nodeList || commNode.nodeList.length === 0) {
                throw new Error(`Communication node "${commNode.id}" must have at least one node`);
            }

            for (const node of commNode.nodeList) {
                if (!node.id) {
                    throw new Error(`Node in communication node "${commNode.id}" must have an "id" field`);
                }
                if (!node.protocolName) {
                    throw new Error(`Node "${node.id}" must have a "protocolName" field`);
                }
                if (!node.dispatch) {
                    throw new Error(`Node "${node.id}" must have a "dispatch" field`);
                }
                if (!node.messages || Object.keys(node.messages).length === 0) {
                    throw new Error(`Node "${node.id}" must have at least one message`);
                }
            }
        }
    }

    /**
     * 获取所有通信节点
     * @returns {Array} 通信节点列表
     */
    getCommNodes() {
        return this.commNodeList;
    }

    /**
     * 获取指定通信节点下的所有图元
     * @param {string} commNodeId - 通信节点 ID
     * @returns {Array} 图元列表
     */
    getNodes(commNodeId) {
        const commNode = this.commNodeList.find(cn => cn.id === commNodeId);
        return commNode ? commNode.nodeList : [];
    }

    /**
     * 获取所有图元（扁平化）
     * @returns {Array<{commNodeId: string, commNodeName: string, node: Object}>}
     */
    getAllNodes() {
        const allNodes = [];
        for (const commNode of this.commNodeList) {
            for (const node of commNode.nodeList) {
                allNodes.push({
                    commNodeId: commNode.id,
                    commNodeName: commNode.name || commNode.id,
                    commNodeType: commNode.type || 'Unknown',
                    node
                });
            }
        }
        return allNodes;
    }

    /**
     * 获取图元总数
     * @returns {number}
     */
    getTotalNodeCount() {
        return this.commNodeList.reduce((sum, cn) => sum + cn.nodeList.length, 0);
    }

    /**
     * 获取命名空间名称
     */
    getNamespaceName() {
        return this.softwareName;
    }
}

/**
 * 分发器配置类，用于存储分发器信息
 * 
 * messages 格式：内联子协议配置
 * { "0x01": { name: "LoginRequest", fields: [...] } }
 */
export class DispatcherConfig {
    constructor(configDict) {
        this.protocolName = configDict.protocolName || 'UnknownDispatcher';
        this.description = configDict.description || '';
        this.dispatch = configDict.dispatch || {};
        this.messages = configDict.messages || {};
        
        // 内部缓存：存储已解析的子协议配置 (ProtocolConfig 实例)
        // 格式: { [messageId]: ProtocolConfig }
        this._resolvedMessages = {};
        
        // 解析内联的子协议配置
        this._resolveInlineMessages();
    }

    /**
     * 解析内联的子协议配置（私有方法）
     * 将 messages 中的内联对象转换为 ProtocolConfig 实例
     * @private
     */
    _resolveInlineMessages() {
        for (const [id, value] of Object.entries(this.messages)) {
            // 内联配置必须是对象
            if (typeof value === 'object' && value !== null) {
                // 检查是否是有效的协议配置（必须有 name 和 fields）
                if (value.name && value.fields) {
                    this._resolvedMessages[id] = new ProtocolConfig(value);
                } else {
                    throw new Error(`Invalid inline protocol config for message ID "${id}": missing "name" or "fields"`);
                }
            } else {
                throw new Error(`Invalid message config for ID "${id}": expected inline protocol object, got ${typeof value}`);
            }
        }
    }

    /**
     * 获取已解析的子协议配置
     * @param {string} messageId - 消息 ID
     * @returns {ProtocolConfig} 子协议配置
     */
    getResolvedMessage(messageId) {
        return this._resolvedMessages[messageId];
    }

    /**
     * 获取所有已解析的子协议配置
     * @returns {Object} { [messageId]: ProtocolConfig }
     */
    getAllResolvedMessages() {
        return this._resolvedMessages;
    }

    /**
     * 获取命名空间名称
     */
    getNamespaceName() {
        return 'protocol_parser';
    }

    /**
     * 获取分发字段名称
     */
    getDispatchFieldName() {
        return this.dispatch.field || 'messageId';
    }

    /**
     * 获取分发字段类型
     */
    getDispatchFieldType() {
        return this.dispatch.type || 'UnsignedInt';
    }

    /**
     * 获取分发字段字节序
     */
    getDispatchByteOrder() {
        const order = (this.dispatch.byteOrder || 'big').toLowerCase();
        return order === 'big' ? 'BIG_ENDIAN' : 'LITTLE_ENDIAN';
    }

    /**
     * 获取分发字段偏移量
     */
    getDispatchOffset() {
        return this.dispatch.offset || 0;
    }

    /**
     * 获取分发字段大小
     */
    getDispatchSize() {
        return this.dispatch.size || 2;
    }

    /**
     * 获取 C++ 类型（用于读取 MessageID）
     */
    getDispatchCppType() {
        const size = this.getDispatchSize();
        const isSigned = this.getDispatchFieldType() === 'SignedInt';

        const typeMap = {
            1: isSigned ? 'int8_t' : 'uint8_t',
            2: isSigned ? 'int16_t' : 'uint16_t',
            4: isSigned ? 'int32_t' : 'uint32_t',
            8: isSigned ? 'int64_t' : 'uint64_t'
        };

        return typeMap[size] || 'uint16_t';
    }

    /**
     * 获取报文映射列表
     * @returns {Array<{id: string, idValue: number, config: ProtocolConfig}>}
     */
    getMessageList() {
        const messageList = [];
        for (const id of Object.keys(this.messages)) {
            // 解析 MessageID（支持十六进制和十进制）
            let idValue;
            if (id.toLowerCase().startsWith('0x')) {
                idValue = parseInt(id, 16);
            } else {
                idValue = parseInt(id, 10);
            }
            
            messageList.push({
                id,
                idValue,
                config: this._resolvedMessages[id]
            });
        }
        return messageList;
    }

    /**
     * 验证分发器配置
     * @throws {Error} 如果配置不合法
     */
    validate() {
        // 验证 protocolName
        const cppIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!cppIdentifierPattern.test(this.protocolName)) {
            throw new Error(
                `Invalid dispatcher name: "${this.protocolName}" ` +
                `(must start with a letter or underscore, contain only letters, numbers, and underscores)`
            );
        }

        // 验证 dispatch 字段
        if (!this.dispatch.field || !this.dispatch.type) {
            throw new Error('Dispatcher configuration must include dispatch.field and dispatch.type');
        }

        if (!['UnsignedInt', 'SignedInt', 'MessageId'].includes(this.dispatch.type)) {
            throw new Error(`Unsupported dispatch field type: ${this.dispatch.type}`);
        }

        if (![1, 2, 4, 8].includes(this.dispatch.size)) {
            throw new Error(`Unsupported dispatch field size: ${this.dispatch.size}`);
        }

        // 验证 messages
        if (Object.keys(this.messages).length === 0) {
            throw new Error('Dispatcher configuration must include at least one message mapping');
        }

        // 验证 MessageID 格式
        for (const id of Object.keys(this.messages)) {
            let idValue;
            try {
                if (id.toLowerCase().startsWith('0x')) {
                    idValue = parseInt(id, 16);
                } else {
                    idValue = parseInt(id, 10);
                }
                if (isNaN(idValue)) {
                    throw new Error();
                }
            } catch (err) {
                throw new Error(`Invalid MessageID format: "${id}"`);
            }
        }
    }

    /**
     * 获取默认字节序（字符串形式）
     * @returns {string} 'big' 或 'little'
     */
    getDefaultByteOrder() {
        return this.dispatch.byteOrder || 'big';
    }

    /**
     * 获取默认字节序枚举值（用于生成代码时的默认参数）
     * @returns {string} 'BIG_ENDIAN' 或 'LITTLE_ENDIAN'
     */
    getByteOrderEnum() {
        const order = this.getDefaultByteOrder().toLowerCase();
        return order === 'big' ? 'BIG_ENDIAN' : 'LITTLE_ENDIAN';
    }

    /**
     * 根据协议名称生成枚举成员名
     * 例如: "LoginRequest" -> "MSG_LOGIN_REQUEST"
     * 
     * @param {string} protocolName - 协议名称（PascalCase）
     * @returns {string} 枚举成员名（SCREAMING_SNAKE_CASE）
     */
    static generateEnumName(protocolName) {
        // 将 PascalCase 转换为 SCREAMING_SNAKE_CASE
        // 例如: "LoginRequest" -> "LOGIN_REQUEST"
        const snakeCase = protocolName
            .replace(/([A-Z])/g, '_$1')  // 在大写字母前插入下划线
            .toUpperCase()               // 转为大写
            .replace(/^_/, '');          // 移除开头可能的下划线
        
        return 'MSG_' + snakeCase;
    }

    /**
     * 根据协议名称生成 union 成员名
     * 例如: "LoginRequest" -> "loginRequest"
     * 
     * @param {string} protocolName - 协议名称（PascalCase）
     * @returns {string} union 成员名（camelCase）
     */
    static generateMemberName(protocolName) {
        // 将首字母转为小写
        return protocolName.charAt(0).toLowerCase() + protocolName.slice(1);
    }
}

/**
 * 字段信息类，用于存储单个字段的详细信息
 */
export class FieldInfo {
    constructor(fieldDict) {
        this.type = fieldDict.type || '';
        this.fieldName = fieldDict.fieldName || '';
        this.description = fieldDict.description || '';
        this.byteLength = fieldDict.byteLength || 0;
        this.defaultValue = fieldDict.defaultValue;
        this.unit = fieldDict.unit || '';
        this.valueRange = fieldDict.valueRange || [];
        this.precision = fieldDict.precision || '';
        this.subFields = fieldDict.subFields || [];
        this.fields = fieldDict.fields || [];
        this.algorithm = fieldDict.algorithm || '';
        this.messageIdValue = fieldDict.messageIdValue; // 用于 MessageId 类型
        this.valueType = fieldDict.valueType; // 用于 MessageId 类型，可选值: "UnsignedInt" / "SignedInt"
        this.validWhen = fieldDict.validWhen || null; // 有效性条件 { field: "name", value: 1 }
        // 扩展支持：Array 与 Command 的嵌套元素
        this.elements = fieldDict.elements || [];
        this.cases = fieldDict.cases || [];
        // Encode / Command 等类型的基础整数类型（"signed" / "unsigned"）
        this.baseType = fieldDict.baseType || '';
        // Encode 类型的映射表
        this.maps = fieldDict.maps || [];
        // 字符串相关属性
        this.length = fieldDict.length;
        this.encoding = fieldDict.encoding;
        // Padding / Reserved 专用属性
        this.bitLength = fieldDict.bitLength || 0;
        this.fillValue = fieldDict.fillValue;
        if (this.fillValue && !this.fillValue.startsWith('0x')) {
            this.fillValue = '0x' + this.fillValue;
        }
        // Array 类型的相关属性
        this.element = fieldDict.element || null;  // 数组元素定义
        this.count = fieldDict.count;  // 固定元素个数
        this.countFromField = fieldDict.countFromField;  // 动态长度字段引用
        this.bytesInTrailer = fieldDict.bytesInTrailer;  // 贪婪读取模式，尾部保留字节数
        // Checksum 类型的相关属性
        this.rangeStartRef = fieldDict.rangeStartRef || '';  // 校验范围起始引用
        this.rangeEndRef = fieldDict.rangeEndRef || '';  // 校验范围结束引用
        this.parameters = fieldDict.parameters || {};  // 算法参数
        this.byteOrder = fieldDict.byteOrder || fieldDict.defaultByteOrder; // 字段级字节序覆写
    }

    /**
     * 判断是否需要比例转换
     */
    needsScaling() {
        return this.lsb !== null && this.lsb !== undefined && this.lsb !== 1;
    }

    /**
     * 判断是否需要范围验证
     */
    hasRangeValidation() {
        return this.valueRange.length > 0;
    }

    /**
     * 获取范围对列表
     */
    getRangePairs() {
        const pairs = [];
        for (const r of this.valueRange) {
            const minVal = r.min;
            const maxVal = r.max;
            if (minVal !== null && minVal !== undefined &&
                maxVal !== null && maxVal !== undefined) {
                pairs.push([minVal, maxVal]);
            }
        }
        return pairs;
    }

    /**
     * 验证字段名是否为合法 C++ 标识符
     * @throws {Error} 如果字段名不合法
     */
    validateFieldName() {
        // Padding 和 Reserved 类型的 fieldName 是可选的
        const optionalFieldNameTypes = ['Padding', 'Reserved'];
        if (optionalFieldNameTypes.includes(this.type)) {
            // 如果没有 fieldName，跳过验证
            if (!this.fieldName) {
                return;
            }
        }
        
        const cppIdentifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;
        if (!cppIdentifierPattern.test(this.fieldName)) {
            throw new Error(
                `Invalid field name (must be a valid C++ identifier): "${this.fieldName}" ` +
                `(must start with a letter or underscore, contain only letters, numbers, and underscores)`
            );
        }
    }

    /**
     * 验证值范围是否合法
     * @throws {Error} 如果值范围不合法
     */
    validateRanges() {
        for (const range of this.valueRange) {
            if (range.min === null || range.min === undefined ||
                range.max === null || range.max === undefined) {
                throw new Error(
                    `Field "${this.fieldName}" value range is missing min or max`
                );
            }
            if (range.min > range.max) {
                throw new Error(
                    `Field "${this.fieldName}" value range error: min (${range.min}) > max (${range.max})`
                );
            }
        }
    }
}

/**
 * JSON Schema 约束配置（单协议配置）
 */
const configSchema = {
    type: 'object',
    required: ['name', 'fields'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        version: { type: 'string' },
        description: { type: 'string' },
        defaultByteOrder: { enum: ['big', 'little'] },
        fields: {
            type: 'array',
            items: { type: 'object' }
        }
    },
    additionalProperties: true
};

/**
 * JSON Schema 约束配置（分发器配置）
 * messages 的值可以是字符串（路径）或对象（内联配置）
 */
const dispatcherSchema = {
    type: 'object',
    required: ['protocolName', 'dispatch', 'messages'],
    properties: {
        protocolName: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        dispatch: {
            type: 'object',
            required: ['field', 'type', 'byteOrder', 'offset', 'size'],
            properties: {
                field: { type: 'string', minLength: 1 },
                type: { enum: ['UnsignedInt', 'SignedInt', 'MessageId'] },
                byteOrder: { enum: ['big', 'little'] },
                offset: { type: 'number', minimum: 0 },
                size: { enum: [1, 2, 4, 8] }
            },
            additionalProperties: false
        },
        messages: {
            type: 'object',
            minProperties: 1,
            // 仅支持内联配置模式
            additionalProperties: {
                type: 'object',
                required: ['name', 'fields'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    fields: { type: 'array' }
                }
            }
        }
    },
    additionalProperties: false
};

/**
 * JSON Schema 约束配置（软件配置）
 * 多层级结构：软件 -> 通信节点列表 -> 图元列表 -> 协议
 */
const softwareSchema = {
    type: 'object',
    required: ['softwareName', 'commNodeList'],
    properties: {
        softwareName: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string' },
        commNodeList: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['id', 'nodeList'],
                properties: {
                    id: { type: 'string', minLength: 1 },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    nodeList: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['id', 'protocolName', 'dispatch', 'messages'],
                            properties: {
                                id: { type: 'string', minLength: 1 },
                                protocolName: { type: 'string', minLength: 1, maxLength: 255 },
                                description: { type: 'string' },
                                dispatch: {
                                    type: 'object',
                                    required: ['field', 'type', 'byteOrder', 'offset', 'size'],
                                    properties: {
                                        mode: { enum: ['single', 'multiple'] },
                                        field: { type: 'string', minLength: 1 },
                                        type: { enum: ['UnsignedInt', 'SignedInt', 'MessageId'] },
                                        byteOrder: { enum: ['big', 'little'] },
                                        offset: { type: 'number', minimum: 0 },
                                        size: { enum: [1, 2, 4, 8] }
                                    },
                                    additionalProperties: false
                                },
                                messages: {
                                    type: 'object',
                                    minProperties: 1,
                                    additionalProperties: {
                                        type: 'object',
                                        required: ['name', 'fields'],
                                        properties: {
                                            name: { type: 'string', minLength: 1 },
                                            fields: { type: 'array' }
                                        }
                                    }
                                }
                            },
                            additionalProperties: true
                        }
                    }
                },
                additionalProperties: true
            }
        }
    },
    additionalProperties: true
};

/**
 * 创建并配置 Ajv 校验器
 */
function createValidator(schema) {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    return ajv.compile(schema);
}

/**
 * 判断配置文件类型
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
 * 递归验证所有字段（包括嵌套字段）
 */
function validateAllFields(fields, context = 'root') {
    for (const field of fields) {
        const fieldInfo = new FieldInfo(field);

        // 验证字段名
        try {
            fieldInfo.validateFieldName();
        } catch (err) {
            throw new Error(`[${context}] ${err.message}`);
        }

        // 验证值范围
        try {
            fieldInfo.validateRanges();
        } catch (err) {
            throw new Error(`[${context}] ${err.message}`);
        }

        // 递归验证嵌套字段 (Struct)
        if (fieldInfo.fields && fieldInfo.fields.length > 0) {
            validateAllFields(fieldInfo.fields, `${context}.${fieldInfo.fieldName}`);
        }

        // 递归验证数组元素 (Array)
        if (fieldInfo.elements && fieldInfo.elements.length > 0) {
            validateAllFields(fieldInfo.elements, `${context}.${fieldInfo.fieldName}.elements`);
        }

        // 递归验证分支 (Command)
        if (fieldInfo.cases && Object.keys(fieldInfo.cases).length > 0) {
            for (const caseKey in fieldInfo.cases) {
                const caseConfig = fieldInfo.cases[caseKey];
                // 将 case 配置当作一个字段数组进行验证
                validateAllFields([caseConfig], `${context}.${fieldInfo.fieldName}.cases.${caseKey}`);
            }
        }
    }
}

/**
 * 解析配置对象（不读取文件）
 *
 * @param {Object} configDict - 配置字典
 * @returns {{kind: 'software' | 'dispatcher' | 'protocol', config: SoftwareConfig | DispatcherConfig | ProtocolConfig}}
 * @throws {Error} 配置不符合约束
 */
export function parseConfigObject(configDict) {
    // 检测配置类型
    const configType = detectConfigType(configDict);

    if (configType === 'software') {
        // 软件配置处理
        const validate = createValidator(softwareSchema);
        if (!validate(configDict)) {
            const errorMessages = validate.errors
                .map(e => `  - ${e.instancePath || 'root'}: ${e.message}`)
                .join('\n');
            throw new Error(`Software configuration does not meet constraints:\n${errorMessages}`);
        }

        const config = new SoftwareConfig(configDict);

        return {
            kind: 'software',
            config
        };
    } else if (configType === 'dispatcher') {
        // 分发器配置处理
        const validate = createValidator(dispatcherSchema);
        if (!validate(configDict)) {
            const errorMessages = validate.errors
                .map(e => `  - ${e.instancePath || 'root'}: ${e.message}`)
                .join('\n');
            throw new Error(`Dispatcher configuration does not meet constraints:\n${errorMessages}`);
        }

        const config = new DispatcherConfig(configDict);
        config.validate();

        return {
            kind: 'dispatcher',
            config
        };
    } else {
        // 单协议配置处理
        const validate = createValidator(configSchema);
        if (!validate(configDict)) {
            const errorMessages = validate.errors
                .map(e => `  - ${e.instancePath || 'root'}: ${e.message}`)
                .join('\n');
            throw new Error(`Configuration does not meet constraints:\n${errorMessages}`);
        }

        // 字段级别验证
        if (configDict.fields && configDict.fields.length > 0) {
            validateAllFields(configDict.fields);
        }

        // 创建协议配置对象
        const config = new ProtocolConfig(configDict);

        return {
            kind: 'protocol',
            config
        };
    }
}

/**
 * 解析 JSON 配置文件
 *
 * @param {string} filePath - JSON 配置文件路径
 * @returns {Promise<{kind: 'dispatcher' | 'protocol', config: DispatcherConfig | ProtocolConfig}>}
 * @throws {Error} 文件不存在、JSON 格式错误或配置不符合约束
 */
export async function parseConfigFile(filePath) {
    const content = await readFile(filePath, 'utf-8');

    let configDict;
    try {
        configDict = JSON.parse(content);
    } catch (err) {
        throw new Error(`JSON format error: ${err.message}`);
    }

    try {
        return parseConfigObject(configDict);
    } catch (err) {
        // 重新包装错误，增加文件名上下文
        throw new Error(`File ${filePath}: ${err.message}`);
    }
}

/**
 * 从字典创建 FieldInfo 对象
 *
 * @param {Object} fieldDict - 字段字典
 * @returns {FieldInfo} FieldInfo 对象
 */
export function getFieldInfo(fieldDict) {
    return new FieldInfo(fieldDict);
}
