/**
 * C++ 类型映射器
 * 将 FieldInfo 映射为 C++ 类型字符串
 *
 * 从 config-parser.js 抽取，保持 config-parser.js 语言无关
 */

import { FieldInfo } from './config-parser.js';

/**
 * 首字母大写辅助函数
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * C++ 类型映射器类
 */
export class CppTypeMapper {
    /**
     * 将 FieldInfo 映射为 C++ 类型字符串
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} protocolName - 协议名称（用于 Struct 命名）
     * @returns {string} C++ 类型，如 'uint16_t', 'std::vector<float>'
     */
    static mapType(fieldInfo, protocolName = null) {
        // 1) 整数类型：根据 byteLength 精确选择最小可容纳类型
        if (fieldInfo.type === 'UnsignedInt' || fieldInfo.type === 'SignedInt') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            const signedMap = {
                1: 'int8_t',
                2: 'int16_t',
                4: 'int32_t',
                8: 'int64_t'
            };

            const width = fieldInfo.byteLength || 0;
            const map = fieldInfo.type === 'UnsignedInt' ? unsignedMap : signedMap;

            if (map[width]) {
                return map[width];
            }

            // 配置写错时，退化为最大宽度类型，让问题在协议设计层暴露
            return fieldInfo.type === 'UnsignedInt' ? 'uint64_t' : 'int64_t';
        }

        // 2) 浮点数：优先根据 precision 选择，其次根据 byteLength
        if (fieldInfo.type === 'Float') {
            // 优先检查 precision 配置
            if (fieldInfo.precision === 'float') {
                return 'float';
            } else if (fieldInfo.precision === 'double') {
                return 'double';
            }
            // 其次根据 byteLength 判断
            if (fieldInfo.byteLength === 4) {
                return 'float';
            } else if (fieldInfo.byteLength === 8) {
                return 'double';
            }
            // 默认使用 double（更大精度）
            return 'double';
        }

        // 3) MessageId：根据 byteLength 和 valueType 选择合适的整数类型
        if (fieldInfo.type === 'MessageId') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            const signedMap = {
                1: 'int8_t',
                2: 'int16_t',
                4: 'int32_t',
                8: 'int64_t'
            };
            const typeMap = fieldInfo.valueType === 'SignedInt' ? signedMap : unsignedMap;
            return typeMap[fieldInfo.byteLength] || 'uint64_t';
        }

        // 4) Array 类型：统一使用 std::vector（实用主义优先，避免类型系统复杂性）
        if (fieldInfo.type === 'Array') {
            if (!fieldInfo.element) {
                throw new Error(`Array type field "${fieldInfo.fieldName}" is missing element definition`);
            }

            // 递归获取元素类型
            const elementInfo = new FieldInfo(fieldInfo.element);
            let elementType = CppTypeMapper.mapType(elementInfo, protocolName);

            // 特殊处理：如果元素是 Struct，需要生成正确的结构体名称
            if (elementInfo.type === 'Struct' && protocolName && elementInfo.fieldName) {
                elementType = `${protocolName}_${capitalize(elementInfo.fieldName)}`;
            }

            // 统一使用 std::vector（固定长度、动态长度、贪婪模式均使用动态容器）
            return `std::vector<${elementType}>`;
        }

        // 5) Struct 类型：由调用者根据协议名称生成完整类型名
        if (fieldInfo.type === 'Struct') {
            if (protocolName && fieldInfo.fieldName) {
                return `${protocolName}_${capitalize(fieldInfo.fieldName)}`;
            }
            // 没有足够信息生成类型名，返回占位符（调用者应该覆盖）
            return 'STRUCT_TYPE_PLACEHOLDER';
        }

        // 6) Command 类型：不生成结构体成员（在解析时动态处理分支）
        // Command 类型不应该调用 getCppType，但为了兼容性返回特殊标记
        if (fieldInfo.type === 'Command') {
            // Command 类型在头文件中需要生成命令字字段和各分支字段
            // 这里返回特殊标记，由头文件生成器特殊处理
            return 'COMMAND_TYPE_SPECIAL_HANDLING';
        }

        // 7) Timestamp：根据 byteLength 选择合适的整数类型
        if (fieldInfo.type === 'Timestamp') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            return unsignedMap[fieldInfo.byteLength] || 'uint64_t';
        }

        // 8) 其他类型：保持原有宽类型设计
        const typeMapping = {
            'Bitfield': 'uint64_t',
            'String': 'std::string',
            'Bcd': 'std::string',
            'Bytes': 'std::vector<uint8_t>',
            'Checksum': 'uint64_t',
            'Encode': 'uint64_t',  // Encode 类型也是整数
            'Padding': 'uint8_t',  // Padding 类型通常不需要存储，但为了兼容性返回基础类型
            'Reserved': 'uint8_t'  // Reserved 类型同 Padding
        };

        if (typeMapping[fieldInfo.type]) {
            return typeMapping[fieldInfo.type];
        }

        // 未知类型：直接抛出错误，让问题在代码生成期暴露
        throw new Error(`Unknown field type: "${fieldInfo.type}" (field name: "${fieldInfo.fieldName}")`);
    }
}
