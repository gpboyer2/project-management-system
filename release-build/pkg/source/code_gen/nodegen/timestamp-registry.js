/**
 * 时间戳单位转换注册表
 *
 * 定义所有支持的时间戳单位及其转换函数映射。
 * 设计原则：
 * - 关注点分离：C++ 框架提供转换算法，注册表提供映射关系，模板负责代码渲染
 * - 架构一致性：与 compression-registry.js 采用相同的注册表模式
 * - 零运行时开销：所有函数都是 inline 的，编译器可完全内联
 * - 消除特殊情况：所有时间单位统一处理，无需在模板中使用 if-else 分支
 */

export const TIMESTAMP_REGISTRY = {
    /**
     * 秒（seconds）
     * - 标准 Unix 时间戳单位
     * - 转换系数：1 秒 = 1,000,000,000 纳秒
     */
    'seconds': {
        parse: 'protocol_timestamp::seconds_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_seconds',
        description: '秒到纳秒转换',
        factor: 1000000000
    },

    /**
     * 毫秒（milliseconds）
     * - 常用于高精度时间戳
     * - 转换系数：1 毫秒 = 1,000,000 纳秒
     */
    'milliseconds': {
        parse: 'protocol_timestamp::millis_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_millis',
        description: '毫秒到纳秒转换',
        factor: 1000000
    },

    /**
     * 微秒（microseconds）
     * - 用于更高精度的时间测量
     * - 转换系数：1 微秒 = 1,000 纳秒
     */
    'microseconds': {
        parse: 'protocol_timestamp::micros_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_micros',
        description: '微秒到纳秒转换',
        factor: 1000
    },

    /**
     * 纳秒（nanoseconds）
     * - 最高精度的时间单位
     * - 转换系数：1 纳秒 = 1 纳秒（直通）
     */
    'nanoseconds': {
        parse: 'protocol_timestamp::nanos_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_nanos',
        description: '纳秒（无需转换）',
        factor: 1
    },

    /**
     * 当天毫秒数（day-milliseconds）
     * - 表示从当天 0 点开始的毫秒数
     * - 范围：0-86,399,999（一天 = 86,400,000 毫秒）
     * - 转换系数：1 毫秒 = 1,000,000 纳秒
     */
    'day-milliseconds': {
        parse: 'protocol_timestamp::day_millis_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_day_millis',
        description: '当天毫秒数（从午夜开始的毫秒数）',
        factor: 1000000
    },

    /**
     * 当天 0.1 毫秒数（day-0.1milliseconds）
     * - 表示从当天 0 点开始的 0.1 毫秒数
     * - 转换系数：0.1 毫秒 = 100 微秒 = 100,000 纳秒
     */
    'day-0.1milliseconds': {
        parse: 'protocol_timestamp::day_0_1_millis_to_nanos',
        serialize: 'protocol_timestamp::nanos_to_day_0_1_millis',
        description: '当天0.1毫秒数（从午夜开始的0.1毫秒数）',
        factor: 100000
    }
};

/**
 * 获取指定时间单位的转换函数
 * @param {string} unit - 时间单位字符串
 * @returns {Object} 包含 parse 和 serialize 函数名的对象
 * @throws {Error} 如果时间单位不支持
 */
export function getTimestampFunctions(unit) {
    if (!TIMESTAMP_REGISTRY.hasOwnProperty(unit)) {
        throw new Error(`Unknown timestamp unit: ${unit}. Supported units: ${Object.keys(TIMESTAMP_REGISTRY).join(', ')}`);
    }
    return TIMESTAMP_REGISTRY[unit];
}

/**
 * 检查时间单位是否支持
 * @param {string} unit - 时间单位字符串
 * @returns {boolean} 是否支持
 */
export function isSupportedTimestampUnit(unit) {
    return TIMESTAMP_REGISTRY.hasOwnProperty(unit);
}

/**
 * 获取所有支持的时间单位列表
 * @returns {Array<string>} 时间单位数组
 */
export function getSupportedTimestampUnits() {
    return Object.keys(TIMESTAMP_REGISTRY);
}
