/**
 * 协议分发器配置分析器
 *
 * 用于分析多个单协议JSON配置文件，自动生成dispatcher配置
 *
 * 当前代码生成逻辑当中没有用到这个文件
 *
 * @author AI Assistant
 * @date 2025-11-28
 */

import { logger } from './logger.js';

/**
 * 计算字段的字节长度
 * @param {Object} field - 字段对象
 * @returns {number} - 字段的字节长度，-1表示动态长度无法确定
 */
function calculateFieldByteLength(field) {
    if (!field || !field.type) {
        return 0;
    }

    switch (field.type) {
        case 'UnsignedInt':
        case 'SignedInt':
        case 'MessageId':
        case 'Bitfield':
        case 'Bcd':
        case 'Checksum':
        case 'Timestamp':
        case 'Encode':
        case 'Command':
        case 'Padding':
            return field.byteLength || 0;

        case 'Float':
            if (field.precision === 'float') return 4;
            if (field.precision === 'double') return 8;
            return field.byteLength || 4;

        case 'String':
            // 如果length为0，表示变长字符串，无法确定长度
            if (field.length === 0 || field.length === undefined) {
                return -1; // 动态长度
            }
            return field.length;

        case 'Struct':
            // 递归计算结构体内所有字段的总长度
            if (field.fields && Array.isArray(field.fields)) {
                let totalLength = 0;
                for (const subField of field.fields) {
                    const subLen = calculateFieldByteLength(subField);
                    if (subLen === -1) {
                        return -1; // 包含动态长度字段
                    }
                    totalLength += subLen;
                }
                return totalLength;
            }
            return 0;

        case 'Array':
            // 如果是动态数组（countFromField），无法确定长度
            if (field.countFromField) {
                return -1;
            }
            // 固定长度数组
            if (field.count !== undefined && field.element) {
                const elementLen = calculateFieldByteLength(field.element);
                if (elementLen === -1) {
                    return -1;
                }
                return field.count * elementLen;
            }
            return -1;

        default:
            // 未知类型，尝试使用byteLength
            return field.byteLength || 0;
    }
}

/**
 * 在字段列表中递归查找MessageId字段及其偏移量
 * @param {Array} fields - 字段数组
 * @param {number} currentOffset - 当前偏移量
 * @returns {Object|null} - 返回 {field, offset} 或 null
 */
function findMessageIdField(fields, currentOffset = 0) {
    if (!fields || !Array.isArray(fields)) {
        return null;
    }

    let offset = currentOffset;

    for (const field of fields) {
        // 检查当前字段是否是MessageId
        if (field.type === 'MessageId') {
            return {
                field: field,
                offset: offset
            };
        }

        // 如果是结构体，递归搜索
        if (field.type === 'Struct' && field.fields) {
            const result = findMessageIdField(field.fields, offset);
            if (result) {
                return result;
            }
        }

        // 计算当前字段的长度，累加到offset
        const fieldLength = calculateFieldByteLength(field);
        if (fieldLength === -1) {
            // 遇到动态长度字段，无法继续计算后续字段的精确offset
            // 但我们假设MessageId通常在动态字段之前
            // 继续搜索，但标记可能不准确
            console.warn(`警告: 字段 "${field.fieldName}" 是动态长度，后续offset计算可能不准确`);
            offset = -1; // 标记offset不确定
        } else if (offset !== -1) {
            offset += fieldLength;
        }
    }

    return null;
}

/**
 * 分析单个协议JSON，提取MessageId信息
 * @param {Object} protocol - 协议JSON对象
 * @param {string} protocolName - 协议名称（用于错误信息）
 * @returns {Object} - 返回分析结果
 */
function analyzeProtocol(protocol, protocolName = 'Unknown') {
    const result = {
        found: false,
        fieldName: null,
        offset: -1,
        size: -1,
        valueType: null,
        byteOrder: null,
        messageIdValue: null,
        error: null
    };

    if (!protocol || !protocol.fields || !Array.isArray(protocol.fields)) {
        result.error = `协议 "${protocolName}" 没有有效的fields数组`;
        return result;
    }

    // 获取默认字节序
    const defaultByteOrder = protocol.defaultByteOrder || 'big';

    // 查找MessageId字段
    const messageIdResult = findMessageIdField(protocol.fields, 0);

    if (!messageIdResult) {
        result.error = `协议 "${protocolName}" 中未找到MessageId类型的字段`;
        return result;
    }

    const messageIdField = messageIdResult.field;

    result.found = true;
    result.fieldName = messageIdField.fieldName || 'messageId';
    result.offset = messageIdResult.offset;
    result.size = messageIdField.byteLength || 0;
    result.valueType = messageIdField.valueType || 'UnsignedInt';
    result.byteOrder = messageIdField.byteOrder || defaultByteOrder;
    result.messageIdValue = messageIdField.messageIdValue;

    // 验证必要属性
    if (result.offset === -1) {
        result.error = `协议 "${protocolName}" 的MessageId字段offset无法确定（之前存在动态长度字段）`;
        result.found = false;
    }

    if (result.size <= 0) {
        result.error = `协议 "${protocolName}" 的MessageId字段没有有效的byteLength`;
        result.found = false;
    }

    if (result.messageIdValue === null || result.messageIdValue === undefined) {
        result.error = `协议 "${protocolName}" 的MessageId字段没有设置messageIdValue`;
        result.found = false;
    }

    return result;
}

/**
 * 将messageIdValue转换为十进制字符串格式
 * @param {number|string} value - messageIdValue值
 * @param {number} size - 字节长度（已忽略，仅为兼容原接口）
 * @returns {string} - 十进制字符串，如 "256"
 */
function formatMessageIdKey(value, size) {
    let numValue;
    if (typeof value === 'string') {
        // 支持16进制字符串，同时支持10进制字符串
        if (value.startsWith('0x') || value.startsWith('0X')) {
            numValue = parseInt(value, 16);
        } else {
            numValue = parseInt(value, 10);
        }
    } else {
        numValue = value;
    }
    // 返回十进制字符串
    return String(numValue);
}

/**
 * 分析多个协议配置文件，生成dispatcher配置
 * 
 * @param {Array<Object>} protocols - 协议JSON对象数组
 * @returns {Object} - 返回dispatcher配置结果
 * 
 * @example
 * const protocols = [
 *     { name: "Protocol1", fields: [...], ... },
 *     { name: "Protocol2", fields: [...], ... }
 * ];
 * const result = analyzeProtocolsForDispatcher(protocols);
 * logger.log(result);
 * // {
 * //     dispatch: { field: "messageId", type: "UnsignedInt", byteOrder: "big", offset: 6, size: 2 },
 * //     messages: { "0x0100": {...}, "0x0101": {...} },
 * //     status: "1",
 * //     error_messages: ""
 * // }
 */
function analyzeProtocolsForDispatcher(protocols) {
    const result = {
        dispatch: {},
        messages: {},
        status: "1",
        error_messages: ""
    };

    // 输入验证
    if (!protocols || !Array.isArray(protocols)) {
        result.status = "2";
        result.error_messages = "输入参数必须是协议JSON对象数组";
        return result;
    }

    if (protocols.length === 0) {
        result.status = "2";
        result.error_messages = "协议数组为空，至少需要一个协议";
        return result;
    }

    // 单协议特殊处理：不提取MessageId，直接返回
    if (protocols.length === 1) {
        result.dispatch = {
            mode: "single",
            field: "unkown",
            type: "unknown",
            byteOrder: "unkown",
            offset: 0,
            size: 0
        };
        result.messages["0"] = protocols[0];
        return result;
    }

    const errors = [];
    const analysisResults = [];

    // 分析每个协议
    for (let i = 0; i < protocols.length; i++) {
        const protocol = protocols[i];
        const protocolName = protocol.name || protocol.protocolName || `Protocol_${i + 1}`;
        
        const analysis = analyzeProtocol(protocol, protocolName);
        
        if (!analysis.found) {
            errors.push(analysis.error);
            continue;
        }

        analysisResults.push({
            protocol: protocol,
            protocolName: protocolName,
            analysis: analysis
        });
    }

    // 检查是否有成功分析的协议
    if (analysisResults.length === 0) {
        result.status = "2";
        result.error_messages = errors.join('; ');
        return result;
    }

    // 验证所有协议的MessageId offset和size是否一致
    const firstAnalysis = analysisResults[0].analysis;
    const referenceOffset = firstAnalysis.offset;
    const referenceSize = firstAnalysis.size;
    const referenceValueType = firstAnalysis.valueType;
    const referenceByteOrder = firstAnalysis.byteOrder;
    const referenceFieldName = firstAnalysis.fieldName;

    const inconsistencies = [];

    for (let i = 1; i < analysisResults.length; i++) {
        const { protocolName, analysis } = analysisResults[i];

        if (analysis.offset !== referenceOffset) {
            inconsistencies.push(
                `协议 "${protocolName}" 的MessageId offset (${analysis.offset}) 与第一个协议 (${referenceOffset}) 不一致`
            );
        }

        if (analysis.size !== referenceSize) {
            inconsistencies.push(
                `协议 "${protocolName}" 的MessageId size (${analysis.size}) 与第一个协议 (${referenceSize}) 不一致`
            );
        }
    }

    // 如果有不一致项，返回错误
    if (inconsistencies.length > 0) {
        result.status = "2";
        result.error_messages = inconsistencies.join('; ');
        // 即使有不一致，也尝试生成部分结果供参考
    }

    // 检查messageIdValue是否有重复
    const messageIdValues = new Map();
    const duplicates = [];

    for (const { protocolName, analysis } of analysisResults) {
        const key = formatMessageIdKey(analysis.messageIdValue, referenceSize);
        
        if (messageIdValues.has(key)) {
            duplicates.push(
                `MessageId值 ${key} 重复: "${messageIdValues.get(key)}" 和 "${protocolName}"`
            );
        } else {
            messageIdValues.set(key, protocolName);
        }
    }

    if (duplicates.length > 0) {
        const dupError = duplicates.join('; ');
        if (result.status === "2") {
            result.error_messages += '; ' + dupError;
        } else {
            result.status = "2";
            result.error_messages = dupError;
        }
    }

    // 生成dispatch配置
    result.dispatch = {
        mode: "multiple",
        field: referenceFieldName,
        type: referenceValueType,
        byteOrder: referenceByteOrder,
        offset: referenceOffset,
        size: referenceSize
    };

    // 生成messages映射
    for (const { protocol, analysis } of analysisResults) {
        const key = formatMessageIdKey(analysis.messageIdValue, referenceSize);
        result.messages[key] = protocol;
    }

    // 如果之前有分析错误但不影响生成，添加警告
    if (errors.length > 0 && result.status === "1") {
        result.error_messages = `警告: 部分协议分析失败 - ${errors.join('; ')}`;
    }

    return result;
}

// 导出函数
export { analyzeProtocolsForDispatcher };

// 如果直接运行此文件，执行示例测试
// 示例测试
const testProtocols_single = [
    {
        name: "边界情况测试协议",
        defaultByteOrder: "big",
        fields: [
        {
            id: "field_edge_001_01",
            type: "Struct",
            fieldName: "meta",
            description: "元数据头部",
            isRequired: true,
            fields: [
            {
                id: "field_edge_001_01_01",
                type: "UnsignedInt",
                fieldName: "syncWord",
                description: "大端序同步字 (0x12345678)，测试局部字节序覆写",
                byteLength: 4,
                defaultValue: 305419896,
                defaultByteOrder: "big",
                displayFormat: "hex",
                isRequired: true,
                level: 1,
                parentId: "field_edge_001_01",
            },
            {
                id: "field_edge_001_01_02",
                type: "UnsignedInt",
                fieldName: "packetSize",
                description: "包总长度，用于贪婪读取计算",
                byteLength: 2,
                displayFormat: "decimal",
                isRequired: true,
                level: 1,
                parentId: "field_edge_001_01",
            },
            {
                id: "field_edge_001_01_03",
                type: "MessageId",
                fieldName: "msgId",
                description: "报文标识符",
                byteLength: 2,
                valueType: "UnsignedInt",
                messageIdValue: 256,
                isRequired: true,
                level: 1,
                parentId: "field_edge_001_01",
            },
            ],
            expanded: false,
        },
        {
            id: "field_edge_001_02",
            type: "Array",
            fieldName: "calibMatrix",
            description: "3x3 校准矩阵，测试固定长度数组",
            count: 9,
            isRequired: true,
            element: {
            type: "Float",
            fieldName: "val",
            precision: "float",
            defaultValue: 1,
            },
            expanded: false,
        },
        {
            id: "field_edge_001_03",
            type: "Bitfield",
            fieldName: "compStatus",
            description: "紧凑位域测试",
            byteLength: 1,
            isRequired: true,
            subFields: [
            {
                name: "errA",
                startBit: 0,
                endBit: 0,
            },
            {
                name: "errB",
                startBit: 1,
                endBit: 2,
            },
            {
                name: "mode",
                startBit: 3,
                endBit: 6,
            },
            {
                name: "flag",
                startBit: 7,
                endBit: 7,
            },
            ],
        },
        {
            id: "field_edge_001_04",
            type: "Reserved",
            fieldName: "rsvd",
            description: "保留字段填充测试",
            byteLength: 3,
            fillValue: "FF",
            isRequired: false,
        },
        {
            id: "field_edge_001_05",
            type: "Array",
            fieldName: "rawData",
            description: "贪婪读取数组：读取直到剩下2个字节（CRC）",
            bytesInTrailer: 2,
            isRequired: true,
            element: {
            type: "UnsignedInt",
            fieldName: "byte",
            byteLength: 1,
            },
            expanded: false,
        },
        {
            id: "field_edge_001_06",
            type: "Checksum",
            fieldName: "crc",
            description: "CRC16，测试小端序校验和",
            algorithm: "crc16-modbus",
            byteLength: 2,
            rangeStartRef: "meta",
            rangeEndRef: "rawData",
            parameters: {
            byteOrder: "little",
            },
            isRequired: true,
        },
        ],
    },
    ];

logger.log('===== 测试协议分析 - 单协议 =====');
const result1 = analyzeProtocolsForDispatcher(testProtocols_single);
logger.log(JSON.stringify(result1, null, 2));


const testProtocols_multi = [
    {
        "name": "Protocol1",
        "version": "1.0",
        "defaultByteOrder": "big",
        "fields": [
            {
                "type": "UnsignedInt",
                "fieldName": "header",
                "byteLength": 2
            },
            {
                "type": "UnsignedInt",
                "fieldName": "length",
                "byteLength": 4
            },
            {
                "type": "MessageId",
                "fieldName": "messageId",
                "byteLength": 2,
                "valueType": "UnsignedInt",
                "messageIdValue": 256
            },
            {
                "type": "UnsignedInt",
                "fieldName": "data",
                "byteLength": 4
            }
        ]
    },
    {
        "name": "Protocol2",
        "version": "1.0",
        "defaultByteOrder": "big",
        "fields": [
            {
                "type": "UnsignedInt",
                "fieldName": "header",
                "byteLength": 2
            },
            {
                "type": "UnsignedInt",
                "fieldName": "length",
                "byteLength": 4
            },
            {
                "type": "MessageId",
                "fieldName": "messageId",
                "byteLength": 2,
                "valueType": "UnsignedInt",
                "messageIdValue": 257
            },
            {
                "type": "String",
                "fieldName": "message",
                "length": 32
            }
        ]
    },
    {
        "name": "Protocol3",
        "version": "1.0",
        "defaultByteOrder": "big",
        "fields": [
            {
                "type": "UnsignedInt",
                "fieldName": "header",
                "byteLength": 2
            },
            {
                "type": "UnsignedInt",
                "fieldName": "length",
                "byteLength": 4
            },
            {
                "type": "MessageId",
                "fieldName": "messageId",
                "byteLength": 2,
                "valueType": "UnsignedInt",
                "messageIdValue": 258
            },
            {
                "type": "Float",
                "fieldName": "temperature",
                "precision": "float"
            }
        ]
    }
];
logger.log('===== 测试协议分析 - 多协议 =====');
const result2 = analyzeProtocolsForDispatcher(testProtocols_multi);
logger.log(JSON.stringify(result2, null, 2));