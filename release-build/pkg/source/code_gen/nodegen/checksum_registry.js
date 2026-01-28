/**
 * 校验算法注册表
 * 定义所有支持的校验算法及其元数据
 * 
 * 每个算法配置包含：
 * - cppClass: C++ 类名
 * - returnType: 返回值类型
 * - byteLength: 校验值字节长度
 * - description: 描述
 * - required: 必填参数列表（对应构造函数参数）
 * - optional: 可选参数映射（参数名 -> {setter, default}）
 * - fixedParams: 预定义固定参数（优先级高于 JSON 配置）
 */

export const CHECKSUM_ALGORITHMS = {
    // ========================================================================
    // 简单累加和系列
    // ========================================================================
    "sum8": {
        cppClass: "Checksum_Sum",
        returnType: "uint8_t",
        byteLength: 1,
        description: "8-bit Sum Checksum (truncated to 8 bits)",
        required: [],
        optional: {
            "initial": { setter: "set_initial", default: 0 }
        }
    },
    
    "sum16": {
        cppClass: "Checksum_Sum",
        returnType: "uint16_t",
        byteLength: 2,
        description: "16-bit Sum Checksum (truncated to 16 bits)",
        required: [],
        optional: {
            "initial": { setter: "set_initial", default: 0 }
        }
    },
    
    "sum32": {
        cppClass: "Checksum_Sum",
        returnType: "uint32_t",
        byteLength: 4,
        description: "32-bit Sum Checksum",
        required: [],
        optional: {
            "initial": { setter: "set_initial", default: 0 }
        }
    },

    // ========================================================================
    // 异或校验
    // ========================================================================
    "xor8": {
        cppClass: "Checksum_XOR",
        returnType: "uint8_t",
        byteLength: 1,
        description: "8-bit XOR Checksum",
        required: [],
        optional: {
            "initial": { setter: "set_initial", default: 0 }
        }
    },

    // ========================================================================
    // 标准 CRC8
    // ========================================================================
    "crc8": {
        cppClass: "Checksum_CRC<uint8_t>",
        returnType: "uint8_t",
        byteLength: 1,
        description: "CRC8 (Poly=0x07, Init=0x00, RefIn=false, RefOut=false, XorOut=0x00)",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0x00 },
            "xorOut": { setter: "set_xor_out", default: 0x00 },
            "refIn": { setter: "set_ref_in", default: false },
            "refOut": { setter: "set_ref_out", default: false }
        },
        // 固定参数（预定义标准）
        fixedParams: {
            "poly": 0x07,
            "init": 0x00,
            "xorOut": 0x00,
            "refIn": false,
            "refOut": false
        }
    },

    // ========================================================================
    // 标准 CRC16-Modbus
    // ========================================================================
    "crc16-modbus": {
        cppClass: "Checksum_CRC<uint16_t>",
        returnType: "uint16_t",
        byteLength: 2,
        description: "CRC16-Modbus (Poly=0x8005, Init=0xFFFF, RefIn=true, RefOut=true)",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0xFFFF },
            "xorOut": { setter: "set_xor_out", default: 0x0000 },
            "refIn": { setter: "set_ref_in", default: true },
            "refOut": { setter: "set_ref_out", default: true }
        },
        // 固定参数（预定义标准）
        fixedParams: {
            "poly": 0x8005,
            "init": 0xFFFF,
            "xorOut": 0x0000,
            "refIn": true,
            "refOut": true
        }
    },

    // ========================================================================
    // 标准 CRC32 (IEEE 802.3)
    // ========================================================================
    "crc32": {
        cppClass: "Checksum_CRC<uint32_t>",
        returnType: "uint32_t",
        byteLength: 4,
        description: "CRC32-IEEE 802.3 (Poly=0x04C11DB7, Init=0xFFFFFFFF, RefIn=true, RefOut=true, XorOut=0xFFFFFFFF)",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0xFFFFFFFF },
            "xorOut": { setter: "set_xor_out", default: 0xFFFFFFFF },
            "refIn": { setter: "set_ref_in", default: true },
            "refOut": { setter: "set_ref_out", default: true }
        },
        // 固定参数（预定义标准）
        fixedParams: {
            "poly": 0x04C11DB7,
            "init": 0xFFFFFFFF,
            "xorOut": 0xFFFFFFFF,
            "refIn": true,
            "refOut": true
        }
    },

    // ========================================================================
    // 自定义 CRC 算法
    // ========================================================================
    "crc8-custom": {
        cppClass: "Checksum_CRC<uint8_t>",
        returnType: "uint8_t",
        byteLength: 1,
        description: "Custom CRC8 Algorithm",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0 },
            "xorOut": { setter: "set_xor_out", default: 0 },
            "refIn": { setter: "set_ref_in", default: false },
            "refOut": { setter: "set_ref_out", default: false }
        }
    },

    "crc16-custom": {
        cppClass: "Checksum_CRC<uint16_t>",
        returnType: "uint16_t",
        byteLength: 2,
        description: "Custom CRC16 Algorithm",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0 },
            "xorOut": { setter: "set_xor_out", default: 0 },
            "refIn": { setter: "set_ref_in", default: false },
            "refOut": { setter: "set_ref_out", default: false }
        }
    },

    "crc32-custom": {
        cppClass: "Checksum_CRC<uint32_t>",
        returnType: "uint32_t",
        byteLength: 4,
        description: "Custom CRC32 Algorithm",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0 },
            "xorOut": { setter: "set_xor_out", default: 0 },
            "refIn": { setter: "set_ref_in", default: false },
            "refOut": { setter: "set_ref_out", default: false }
        }
    },

    // ========================================================================
    // 通用别名（用于兼容旧配置）
    // ========================================================================
    "custom": {
        // 默认为 CRC16 Custom
        cppClass: "Checksum_CRC<uint16_t>",
        returnType: "uint16_t",
        byteLength: 2,
        description: "Generic Custom Algorithm (defaults to CRC16)",
        required: [
            { name: "poly", argOrder: 0 }
        ],
        optional: {
            "init": { setter: "set_init", default: 0 },
            "xorOut": { setter: "set_xor_out", default: 0 },
            "refIn": { setter: "set_ref_in", default: false },
            "refOut": { setter: "set_ref_out", default: false }
        }
    }
};

/**
 * 获取算法配置
 * @param {string} algorithmName - 算法名称
 * @returns {Object|null} 算法配置对象，如果不存在则返回 null
 */
export function getChecksumAlgorithm(algorithmName) {
    return CHECKSUM_ALGORITHMS[algorithmName] || null;
}

/**
 * 检查算法是否支持
 * @param {string} algorithmName - 算法名称
 * @returns {boolean}
 */
export function isChecksumAlgorithmSupported(algorithmName) {
    return algorithmName in CHECKSUM_ALGORITHMS;
}

/**
 * 获取所有支持的算法名称
 * @returns {string[]}
 */
export function getSupportedAlgorithms() {
    return Object.keys(CHECKSUM_ALGORITHMS);
}

