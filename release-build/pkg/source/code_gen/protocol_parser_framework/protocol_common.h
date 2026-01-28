#ifndef PROTOCOL_COMMON_H
#define PROTOCOL_COMMON_H

#include <cstdint>
#include <string>
#include <vector>
#include <cstring>

namespace protocol_parser {

// ============================================================================
// 错误码枚举（通用错误码，与具体数据类型无关）
// ============================================================================
enum ParseError {
    SUCCESS = 0,                // 解析成功
    INSUFFICIENT_DATA,          // 数据不足
    INVALID_FORMAT,             // 格式无效
    INVALID_VALUE,              // 值无效（范围错误、格式错误等）
    INVALID_CHECKSUM,           // 校验和错误
    BUFFER_OVERFLOW,            // 缓冲区溢出
    DECOMPRESSION_FAILED,       // 解压失败
    COMPRESSION_FAILED,         // 压缩失败（序列化时）
    UNSUPPORTED_ENCODING,       // 不支持的编码/压缩算法
    UNKNOWN_ERROR               // 未知错误
};

// ============================================================================
// 字节序枚举
// ============================================================================
enum ByteOrder {
    BIG_ENDIAN,                 // 大端字节序
    LITTLE_ENDIAN,            // 小端字节序
    SYSTEM_ENDIAN,             // 系统字节序
    REVERSE_ENDIAN             // 反转字节序
};

// ============================================================================
// 反序列化结果结构体（二进制 → 结构体）
// ============================================================================
struct DeserializeResult {
    ParseError error_code;      // 错误码
    std::string error_message;  // 错误消息
    size_t bytes_consumed;      // 已解析的字节数

    DeserializeResult()
        : error_code(SUCCESS), error_message(""), bytes_consumed(0) {}

    DeserializeResult(ParseError err, const std::string& msg = "", size_t bytes = 0)
        : error_code(err), error_message(msg), bytes_consumed(bytes) {}

    bool is_success() const {
        return error_code == SUCCESS;
    }

    // 静态工厂方法
    static DeserializeResult success(size_t bytes = 0) {
        return DeserializeResult(SUCCESS, "", bytes);
    }
};

// ============================================================================
// 反序列化上下文结构体（二进制读取）
// ============================================================================
struct DeserializeContext {
    const uint8_t* data;        // 数据指针
    size_t offset;              // 当前偏移量
    size_t total_length;        // 总数据长度
    ByteOrder byte_order;       // 字节序
    uint8_t bit_offset;         // 当前位偏移 (0-7)

    DeserializeContext(const uint8_t* d, size_t len, ByteOrder order = BIG_ENDIAN)
        : data(d), offset(0), total_length(len), byte_order(order), bit_offset(0) {}

    // 检查是否有足够的数据可读
    bool has_bytes(size_t count) const {
        // 如果有位偏移，实际上可能需要多读一个字节
        if (bit_offset > 0) {
             // 如果我们已经在最后一个字节中间，再读 count 字节可能会越界
             // 这是一个简化的检查
             return (offset + count + 1) <= total_length;
        }
        return (offset + count) <= total_length;
    }

    // 获取剩余字节数
    size_t remaining_bytes() const {
        return (offset < total_length) ? (total_length - offset) : 0;
    }

    // 前进偏移量（以字节为单位）
    // 注意：调用此函数会自动重置 bit_offset 为 0，确保字节对齐
    void advance(size_t count) {
        offset += count;
        bit_offset = 0;  // 重置位偏移，确保字节对齐
    }

    // 前进位偏移
    void advance_bits(size_t count) {
        size_t total_bits = bit_offset + count;
        offset += total_bits / 8;
        bit_offset = total_bits % 8;
    }

    // 获取实际消费的总字节数（包括部分读取的最后一个字节）
    size_t get_total_bytes() const {
        return (bit_offset > 0) ? (offset + 1) : offset;
    }
};

// ============================================================================
// 序列化结果结构体
// ============================================================================
struct SerializeResult {
    ParseError error_code;      // 错误码（复用 ParseError）
    std::string error_message;  // 错误消息
    size_t bytes_written;       // 已写入的字节数

    SerializeResult()
        : error_code(SUCCESS), error_message(""), bytes_written(0) {}

    SerializeResult(ParseError err, const std::string& msg = "", size_t bytes = 0)
        : error_code(err), error_message(msg), bytes_written(bytes) {}

    bool is_success() const {
        return error_code == SUCCESS;
    }
};

// ============================================================================
// 序列化上下文结构体
// ============================================================================
struct SerializeContext {
    uint8_t* buffer;            // 输出缓冲区
    size_t offset;              // 当前写入偏移量
    size_t max_length;          // 缓冲区最大长度
    ByteOrder byte_order;       // 字节序
    uint8_t bit_offset;         // 当前位偏移 (0-7)

    SerializeContext(uint8_t* buf, size_t max_len, ByteOrder order = BIG_ENDIAN)
        : buffer(buf), offset(0), max_length(max_len), byte_order(order), bit_offset(0) {}

    // 检查是否有足够的空间可写
    bool has_space(size_t count) const {
        if (bit_offset > 0) {
            return (offset + count + 1) <= max_length;
        }
        return (offset + count) <= max_length;
    }

    // 获取剩余空间
    size_t remaining_space() const {
        return (offset < max_length) ? (max_length - offset) : 0;
    }

    // 前进偏移量（以字节为单位）
    // 注意：调用此函数会自动重置 bit_offset 为 0，确保字节对齐
    void advance(size_t count) {
        offset += count;
        bit_offset = 0;  // 重置位偏移，确保字节对齐
    }

    // 前进位偏移
    void advance_bits(size_t count) {
        size_t total_bits = bit_offset + count;
        offset += total_bits / 8;
        bit_offset = total_bits % 8;
    }

    // 获取实际使用的总字节数（包括部分填充的最后一个字节）
    size_t get_total_bytes() const {
        return (bit_offset > 0) ? (offset + 1) : offset;
    }
};

// ============================================================================
// 字节序转换通用工具函数
// ============================================================================

// 判断当前系统字节序
inline bool is_system_little_endian() {
    uint16_t test = 0x0001;
    return *reinterpret_cast<uint8_t*>(&test) == 0x01;
}

// 字节反转函数模板（支持整数和浮点类型）
template<typename T>
inline T reverse_bytes(T value) {
    uint8_t bytes[sizeof(T)];
    std::memcpy(bytes, &value, sizeof(T));
    
    // 反转字节顺序
    for (size_t i = 0; i < sizeof(T) / 2; ++i) {
        std::swap(bytes[i], bytes[sizeof(T) - 1 - i]);
    }
    
    T result;
    std::memcpy(&result, bytes, sizeof(T));
    return result;
}

// 根据字节序读取数据
template<typename T>
inline T read_with_byte_order(const uint8_t* data, ByteOrder order) {
    T value;
    std::memcpy(&value, data, sizeof(T));

    bool need_swap = (order == BIG_ENDIAN && is_system_little_endian()) ||
                     (order == LITTLE_ENDIAN && !is_system_little_endian());

    if (need_swap) {
        value = reverse_bytes(value);
    }

    return value;
}

// 根据字节序写入数据
template<typename T>
inline void write_with_byte_order(uint8_t* buffer, T value, ByteOrder order) {
    bool need_swap = (order == BIG_ENDIAN && is_system_little_endian()) ||
                     (order == LITTLE_ENDIAN && !is_system_little_endian());

    if (need_swap) {
        value = reverse_bytes(value);
    }

    std::memcpy(buffer, &value, sizeof(T));
}

// ============================================================================
// 错误消息辅助函数（通用错误消息，与具体数据类型无关）
// ============================================================================

inline std::string get_error_message(ParseError error) {
    switch (error) {
        case SUCCESS: return "Success";
        case INSUFFICIENT_DATA: return "Insufficient data";
        case INVALID_FORMAT: return "Invalid format";
        case INVALID_VALUE: return "Invalid value";
        case INVALID_CHECKSUM: return "Invalid checksum";
        case BUFFER_OVERFLOW: return "Buffer overflow";
        case DECOMPRESSION_FAILED: return "Decompression failed";
        case COMPRESSION_FAILED: return "Compression failed";
        case UNSUPPORTED_ENCODING: return "Unsupported encoding";
        case UNKNOWN_ERROR: return "Unknown error";
        default: return "Unknown error";
    }
}

// ============================================================================
// 通用反序列化函数模板（C++ 模板元编程实现，编译期展开，零运行时开销）
// ============================================================================

// 通用无符号整数反序列化模板
template<typename T>
inline DeserializeResult deserialize_unsigned_int_generic(DeserializeContext& ctx, T& out_value) {
    static_assert(std::is_unsigned<T>::value, "T must be unsigned integer type");
    
    const size_t byte_length = sizeof(T);
    
    if (!ctx.has_bytes(byte_length)) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for unsigned integer", 0);
    }
    
    if (byte_length > 8) {
        return DeserializeResult(INVALID_FORMAT, "Unsigned integer byte length too large", 0);
    }
    
    const uint8_t* ptr = ctx.data + ctx.offset;
    T value = 0;
    
    switch (byte_length) {
        case 1:
            value = static_cast<T>(*ptr);
            break;
        case 2:
            value = static_cast<T>(read_with_byte_order<uint16_t>(ptr, ctx.byte_order));
            break;
        case 4:
            value = static_cast<T>(read_with_byte_order<uint32_t>(ptr, ctx.byte_order));
            break;
        case 8:
            value = static_cast<T>(read_with_byte_order<uint64_t>(ptr, ctx.byte_order));
            break;
    }
    
    out_value = value;
    ctx.advance(byte_length);
    return DeserializeResult(SUCCESS, "", byte_length);
}

// 通用有符号整数反序列化模板
template<typename T>
inline DeserializeResult deserialize_signed_int_generic(DeserializeContext& ctx, T& out_value) {
    static_assert(std::is_signed<T>::value, "T must be signed integer type");
    
    const size_t byte_length = sizeof(T);
    
    if (!ctx.has_bytes(byte_length)) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for signed integer", 0);
    }
    
    if (byte_length > 8) {
        return DeserializeResult(INVALID_FORMAT, "Signed integer byte length too large", 0);
    }
    
    const uint8_t* ptr = ctx.data + ctx.offset;
    T value = 0;
    
    switch (byte_length) {
        case 1: {
            int8_t v;
            std::memcpy(&v, ptr, 1);
            value = static_cast<T>(v);
            break;
        }
        case 2:
            value = static_cast<T>(read_with_byte_order<int16_t>(ptr, ctx.byte_order));
            break;
        case 4:
            value = static_cast<T>(read_with_byte_order<int32_t>(ptr, ctx.byte_order));
            break;
        case 8:
            value = static_cast<T>(read_with_byte_order<int64_t>(ptr, ctx.byte_order));
            break;
    }
    
    out_value = value;
    ctx.advance(byte_length);
    return DeserializeResult(SUCCESS, "", byte_length);
}

// 通用浮点数反序列化模板
template<typename T>
inline DeserializeResult deserialize_float_generic(DeserializeContext& ctx, T& out_value) {
    static_assert(std::is_floating_point<T>::value, "T must be floating point type");
    
    const size_t byte_length = sizeof(T);
    
    if (!ctx.has_bytes(byte_length)) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for float", 0);
    }
    
    const uint8_t* ptr = ctx.data + ctx.offset;
    out_value = read_with_byte_order<T>(ptr, ctx.byte_order);
    
    ctx.advance(byte_length);
    return DeserializeResult(SUCCESS, "", byte_length);
}

// 通用BCD反序列化函数
inline DeserializeResult deserialize_bcd_generic(DeserializeContext& ctx, std::string& out_value,
                                                 size_t byte_length) {
    if (!ctx.has_bytes(byte_length)) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for BCD", 0);
    }
    
    const uint8_t* ptr = ctx.data + ctx.offset;
    std::string bcd_str;
    bcd_str.reserve(byte_length * 2);
    
    for (size_t i = 0; i < byte_length; ++i) {
        uint8_t byte = ptr[i];
        uint8_t high = (byte >> 4) & 0x0F;
        uint8_t low = byte & 0x0F;
        
        if (high > 9 || low > 9) {
            return DeserializeResult(INVALID_VALUE, "Invalid BCD value", 0);
        }
        
        bcd_str += ('0' + high);
        bcd_str += ('0' + low);
    }
    
    out_value = bcd_str;
    ctx.advance(byte_length);
    return DeserializeResult(SUCCESS, "", byte_length);
}

// 通用字符串反序列化函数
inline DeserializeResult deserialize_string_generic(DeserializeContext& ctx, std::string& out_value,
                                                    size_t length, const std::string& encoding) {
    const uint8_t* ptr = ctx.data + ctx.offset;
    size_t bytes_consumed = 0;
    
    if (length == 0) {
        // 变长字符串：读取到 '\0' 截止
        size_t remaining = ctx.remaining_bytes();
        size_t str_len = 0;
        
        // 查找 '\0' 终止符
        while (str_len < remaining && ptr[str_len] != '\0') {
            str_len++;
        }
        
        // 检查是否找到终止符
        if (str_len == remaining) {
            return DeserializeResult(INVALID_FORMAT, "Variable-length string missing null terminator", 0);
        }
        
        // 读取字符串内容（不包含 '\0'）
        out_value.assign(reinterpret_cast<const char*>(ptr), str_len);
        // 消费字符串内容 + '\0' 终止符
        bytes_consumed = str_len + 1;
    } else {
        // 定长字符串：读取固定字节数
        if (!ctx.has_bytes(length)) {
            return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for fixed-length string", 0);
        }
        
        // 查找实际内容长度（到第一个 '\0' 或到 length）
        size_t actual_length = 0;
        for (size_t i = 0; i < length; ++i) {
            if (ptr[i] == '\0') {
                break;
            }
            actual_length++;
        }
        
        out_value.assign(reinterpret_cast<const char*>(ptr), actual_length);
        bytes_consumed = length;
    }
    
    // TODO: 根据 encoding 进行字符集转换
    // ASCII: 直接使用
    // UTF-8: 验证编码合法性
    // GBK: 转换为内部编码（UTF-8 或宽字符）
    
    ctx.advance(bytes_consumed);
    return DeserializeResult(SUCCESS, "", bytes_consumed);
}

// 通用填充跳过函数
inline DeserializeResult skip_padding_generic(DeserializeContext& ctx, size_t byte_length) {
    if (!ctx.has_bytes(byte_length)) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for padding", 0);
    }
    
    ctx.advance(byte_length);
    return DeserializeResult(SUCCESS, "", byte_length);
}

// 通用位填充跳过函数
inline DeserializeResult skip_bits_generic(DeserializeContext& ctx, size_t bit_count) {
    // 简单检查：将剩余字节转换为位
    size_t bits_remaining = (ctx.total_length - ctx.offset) * 8 - ctx.bit_offset;
    if (bit_count > bits_remaining) {
        return DeserializeResult(INSUFFICIENT_DATA, "Not enough data for bit padding", 0);
    }
    
    ctx.advance_bits(bit_count);
    return DeserializeResult(SUCCESS, "", 0); // bytes_consumed 难以精确表示，暂传 0
}

// 通用范围验证模板（单范围）
template<typename T>
inline bool validate_range_single(T value, T min, T max) {
    return value >= min && value <= max;
}

// 通用多范围验证模板
template<typename T>
inline bool validate_multi_range(T value, const std::vector<std::pair<T, T>>& ranges) {
    for (const auto& range : ranges) {
        if (value >= range.first && value <= range.second) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// 通用序列化函数模板（与解析函数对称）
// ============================================================================

// 通用无符号整数序列化模板
template<typename T>
inline SerializeResult serialize_unsigned_int_generic(SerializeContext& ctx, T value) {
    static_assert(std::is_unsigned<T>::value, "T must be unsigned integer type");

    const size_t byte_length = sizeof(T);

    if (!ctx.has_space(byte_length)) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for unsigned integer", 0);
    }

    if (byte_length > 8) {
        return SerializeResult(INVALID_FORMAT, "Unsigned integer byte length too large", 0);
    }

    uint8_t* ptr = ctx.buffer + ctx.offset;

    switch (byte_length) {
        case 1:
            *ptr = static_cast<uint8_t>(value);
            break;
        case 2:
            write_with_byte_order(ptr, static_cast<uint16_t>(value), ctx.byte_order);
            break;
        case 4:
            write_with_byte_order(ptr, static_cast<uint32_t>(value), ctx.byte_order);
            break;
        case 8:
            write_with_byte_order(ptr, static_cast<uint64_t>(value), ctx.byte_order);
            break;
    }

    ctx.advance(byte_length);
    return SerializeResult(SUCCESS, "", byte_length);
}

// 通用有符号整数序列化模板
template<typename T>
inline SerializeResult serialize_signed_int_generic(SerializeContext& ctx, T value) {
    static_assert(std::is_signed<T>::value, "T must be signed integer type");

    const size_t byte_length = sizeof(T);

    if (!ctx.has_space(byte_length)) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for signed integer", 0);
    }

    if (byte_length > 8) {
        return SerializeResult(INVALID_FORMAT, "Signed integer byte length too large", 0);
    }

    uint8_t* ptr = ctx.buffer + ctx.offset;

    switch (byte_length) {
        case 1: {
            int8_t v = static_cast<int8_t>(value);
            std::memcpy(ptr, &v, 1);
            break;
        }
        case 2:
            write_with_byte_order(ptr, static_cast<int16_t>(value), ctx.byte_order);
            break;
        case 4:
            write_with_byte_order(ptr, static_cast<int32_t>(value), ctx.byte_order);
            break;
        case 8:
            write_with_byte_order(ptr, static_cast<int64_t>(value), ctx.byte_order);
            break;
    }

    ctx.advance(byte_length);
    return SerializeResult(SUCCESS, "", byte_length);
}

// 通用浮点数序列化模板
template<typename T>
inline SerializeResult serialize_float_generic(SerializeContext& ctx, T value) {
    static_assert(std::is_floating_point<T>::value, "T must be floating point type");

    const size_t byte_length = sizeof(T);

    if (!ctx.has_space(byte_length)) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for float", 0);
    }

    uint8_t* ptr = ctx.buffer + ctx.offset;
    write_with_byte_order(ptr, value, ctx.byte_order);

    ctx.advance(byte_length);
    return SerializeResult(SUCCESS, "", byte_length);
}

// 通用BCD序列化函数
inline SerializeResult serialize_bcd_generic(SerializeContext& ctx, const std::string& value,
                                             size_t byte_length) {
    if (!ctx.has_space(byte_length)) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for BCD", 0);
    }

    // BCD 需要偶数位数字
    size_t required_digits = byte_length * 2;
    if (value.length() > required_digits) {
        return SerializeResult(INVALID_VALUE, "BCD string too long", 0);
    }

    // 填充前导零
    std::string padded_value = value;
    while (padded_value.length() < required_digits) {
        padded_value = "0" + padded_value;
    }

    uint8_t* ptr = ctx.buffer + ctx.offset;

    for (size_t i = 0; i < byte_length; ++i) {
        char high_char = padded_value[i * 2];
        char low_char = padded_value[i * 2 + 1];

        if (high_char < '0' || high_char > '9' || low_char < '0' || low_char > '9') {
            return SerializeResult(INVALID_VALUE, "Invalid BCD character", 0);
        }

        uint8_t high = high_char - '0';
        uint8_t low = low_char - '0';
        ptr[i] = (high << 4) | low;
    }

    ctx.advance(byte_length);
    return SerializeResult(SUCCESS, "", byte_length);
}

// 通用字符串序列化函数
inline SerializeResult serialize_string_generic(SerializeContext& ctx, const std::string& value,
                                                size_t fixed_length, const std::string& encoding) {
    // TODO: 根据 encoding 进行字符集转换
    // ASCII: 直接使用
    // UTF-8: 直接使用（假设输入已是UTF-8）
    // GBK: 从内部编码转换为 GBK
    
    uint8_t* ptr = ctx.buffer + ctx.offset;
    size_t bytes_written = 0;
    
    if (fixed_length == 0) {
        // 变长字符串：写入内容 + '\0' 终止符
        size_t write_length = value.length() + 1;
        
        if (!ctx.has_space(write_length)) {
            return SerializeResult(BUFFER_OVERFLOW, "Not enough space for variable-length string", 0);
        }
        
        std::memcpy(ptr, value.data(), value.length());
        ptr[value.length()] = '\0';
        bytes_written = write_length;
    } else {
        // 定长字符串：写入固定字节数
        if (!ctx.has_space(fixed_length)) {
            return SerializeResult(BUFFER_OVERFLOW, "Not enough space for fixed-length string", 0);
        }
        
        // 不足补0，超长截断
        size_t copy_len = (value.length() < fixed_length) ? value.length() : fixed_length;
        std::memcpy(ptr, value.data(), copy_len);
        
        // 填充剩余部分为 0
        if (copy_len < fixed_length) {
            std::memset(ptr + copy_len, 0, fixed_length - copy_len);
        }
        
        bytes_written = fixed_length;
    }

    ctx.advance(bytes_written);
    return SerializeResult(SUCCESS, "", bytes_written);
}

// 通用填充写入函数
inline SerializeResult write_padding_generic(SerializeContext& ctx, size_t byte_length,
                                             uint8_t fill_value = 0x00) {
    if (!ctx.has_space(byte_length)) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for padding", 0);
    }

    uint8_t* ptr = ctx.buffer + ctx.offset;
    std::memset(ptr, fill_value, byte_length);

    ctx.advance(byte_length);
    return SerializeResult(SUCCESS, "", byte_length);
}

// 通用位填充写入函数
// 支持跨字节边界写入指定的位数（填充 0 或 1）
inline SerializeResult write_padding_bits_generic(SerializeContext& ctx, size_t bit_count,
                                                  uint8_t fill_bit = 0) {
    // 计算剩余空间（位）
    size_t bits_remaining = (ctx.max_length - ctx.offset) * 8 - ctx.bit_offset;
    if (bit_count > bits_remaining) {
        return SerializeResult(BUFFER_OVERFLOW, "Not enough space for bit padding", 0);
    }

    // 逐位写入
    // 为了性能，这可以优化，但对于 padding 来说，简单循环足够了
    size_t bits_to_write = bit_count;
    uint8_t fill = fill_bit ? 1 : 0;
    
    // 如果 bit_count 很大，这可能会慢。但通常 Padding 不会太大。
    // 更好的实现是先处理非对齐部分，然后 memset 中间字节，最后处理剩余非对齐部分。
    // 这里采用简单的逐位写入以确保正确性。
    
    size_t current_offset = ctx.offset;
    uint8_t current_bit = ctx.bit_offset;
    
    while (bits_to_write > 0) {
        uint8_t* ptr = ctx.buffer + current_offset;
        if (fill) {
            *ptr |= (1 << (7 - current_bit));
        } else {
            *ptr &= ~(1 << (7 - current_bit));
        }
        
        current_bit++;
        if (current_bit == 8) {
            current_bit = 0;
            current_offset++;
        }
        bits_to_write--;
    }

    ctx.advance_bits(bit_count);
    return SerializeResult(SUCCESS, "", 0); // bytes_written 难以精确表示
}

} // namespace protocol_parser

#endif // PROTOCOL_COMMON_H
