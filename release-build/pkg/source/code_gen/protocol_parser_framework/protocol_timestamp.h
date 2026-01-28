#pragma once
/**
 * @file protocol_timestamp.h
 * @brief 时间戳单位转换函数库
 *
 * 设计理念：
 * - 所有时间戳在 C++ 结构体中统一使用纳秒（uint64_t）表示
 * - 解析时：从协议单位（seconds/milliseconds/microseconds/nanoseconds）转换为纳秒
 * - 序列化时：从纳秒转换回协议单位
 * - 所有函数都是 inline 的，确保零运行时开销
 * - 包含溢出检查，确保数据安全性
 */

#include <cstdint>
#include <limits>

namespace protocol_timestamp {

// ============================================================================
// 解析函数：从协议单位到纳秒
// ============================================================================

/**
 * @brief 将秒转换为纳秒
 * @param seconds 秒值
 * @param nanos 输出参数，转换后的纳秒值
 * @return true 转换成功，false 溢出
 */
inline bool seconds_to_nanos(uint64_t seconds, uint64_t& nanos) {
    const uint64_t factor = 1000000000ULL;
    if (seconds > std::numeric_limits<uint64_t>::max() / factor) {
        nanos = 0;
        return false; // 溢出
    }
    nanos = seconds * factor;
    return true;
}

/**
 * @brief 将毫秒转换为纳秒
 * @param millis 毫秒值
 * @param nanos 输出参数，转换后的纳秒值
 * @return true 转换成功，false 溢出
 */
inline bool millis_to_nanos(uint64_t millis, uint64_t& nanos) {
    const uint64_t factor = 1000000ULL;
    if (millis > std::numeric_limits<uint64_t>::max() / factor) {
        nanos = 0;
        return false; // 溢出
    }
    nanos = millis * factor;
    return true;
}

/**
 * @brief 将微秒转换为纳秒
 * @param micros 微秒值
 * @param nanos 输出参数，转换后的纳秒值
 * @return true 转换成功，false 溢出
 */
inline bool micros_to_nanos(uint64_t micros, uint64_t& nanos) {
    const uint64_t factor = 1000ULL;
    if (micros > std::numeric_limits<uint64_t>::max() / factor) {
        nanos = 0;
        return false; // 溢出
    }
    nanos = micros * factor;
    return true;
}

/**
 * @brief 纳秒到纳秒（直通函数，保持 API 一致性），用于解析过程
 * @param input_nanos 输入纳秒值
 * @param output_nanos 输出参数，转换后的纳秒值
 * @return true 始终成功
 */
inline bool nanos_to_nanos(uint64_t input_nanos, uint64_t& output_nanos) {
    output_nanos = input_nanos;
    return true;
}

/**
 * @brief 纳秒到纳秒（序列化用重载版本），用于序列化过程
 * @param input_nanos 输入纳秒值
 * @return 纳秒值（直接返回）
 */
inline uint64_t nanos_to_nanos(uint64_t input_nanos) {
    return input_nanos;
}

/**
 * @brief 将当天毫秒数转换为纳秒
 * @param day_millis 当天毫秒数（0-86399999）
 * @param nanos 输出参数，转换后的纳秒值
 * @return true 转换成功，false 溢出
 */
inline bool day_millis_to_nanos(uint64_t day_millis, uint64_t& nanos) {
    // 一天最多 86400000 毫秒，不会溢出
    nanos = day_millis * 1000000ULL;
    return true;
}

/**
 * @brief 将当天 0.1 毫秒数转换为纳秒
 * @param day_0_1_millis 当天 0.1 毫秒数
 * @param nanos 输出参数，转换后的纳秒值
 * @return true 转换成功，false 溢出
 */
inline bool day_0_1_millis_to_nanos(uint64_t day_0_1_millis, uint64_t& nanos) {
    // 0.1 毫秒 = 100 微秒 = 100000 纳秒
    nanos = day_0_1_millis * 100000ULL;
    return true;
}

// ============================================================================
// 序列化函数：从纳秒到协议单位
// ============================================================================

/**
 * @brief 将纳秒转换为秒
 * @param nanos 纳秒值
 * @return 秒值（截断）
 */
inline uint64_t nanos_to_seconds(uint64_t nanos) {
    return nanos / 1000000000ULL;
}

/**
 * @brief 将纳秒转换为毫秒
 * @param nanos 纳秒值
 * @return 毫秒值（截断）
 */
inline uint64_t nanos_to_millis(uint64_t nanos) {
    return nanos / 1000000ULL;
}

/**
 * @brief 将纳秒转换为微秒
 * @param nanos 纳秒值
 * @return 微秒值（截断）
 */
inline uint64_t nanos_to_micros(uint64_t nanos) {
    return nanos / 1000ULL;
}

/**
 * @brief 将纳秒转换为当天毫秒数
 * @param nanos 纳秒值
 * @return 当天毫秒数（截断）
 */
inline uint64_t nanos_to_day_millis(uint64_t nanos) {
    return nanos / 1000000ULL;
}

/**
 * @brief 将纳秒转换为当天 0.1 毫秒数
 * @param nanos 纳秒值
 * @return 当天 0.1 毫秒数（截断）
 */
inline uint64_t nanos_to_day_0_1_millis(uint64_t nanos) {
    return nanos / 100000ULL;
}

} // namespace protocol_timestamp
