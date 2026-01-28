#ifndef PROTOCOL_CHECKSUM_H
#define PROTOCOL_CHECKSUM_H

#include <cstdint>
#include <cstddef>

namespace protocol_parser {

// ============================================================================
// 简单累加和校验 (Sum)
// ============================================================================
class Checksum_Sum {
public:
    Checksum_Sum() : initial_(0) {}
    
    // 可选参数配置
    void set_initial(uint32_t val) { initial_ = val; }
    
    // 统一计算接口
    uint32_t calculate(const uint8_t* data, size_t length) const {
        uint32_t sum = initial_;
        for (size_t i = 0; i < length; ++i) {
            sum += data[i];
        }
        return sum;
    }

private:
    uint32_t initial_;
};

// ============================================================================
// 异或校验 (XOR)
// ============================================================================
class Checksum_XOR {
public:
    Checksum_XOR() : initial_(0) {}
    
    // 可选参数配置
    void set_initial(uint8_t val) { initial_ = val; }
    
    // 统一计算接口
    uint8_t calculate(const uint8_t* data, size_t length) const {
        uint8_t xor_val = initial_;
        for (size_t i = 0; i < length; ++i) {
            xor_val ^= data[i];
        }
        return xor_val;
    }

private:
    uint8_t initial_;
};

// ============================================================================
// 通用 CRC 算法模板类
// ============================================================================
template<typename T>
class Checksum_CRC {
public:
    // 必填参数：多项式（通过构造函数传递）
    Checksum_CRC(T polynomial) 
        : poly_(polynomial)
        , init_(0)
        , xor_out_(0)
        , ref_in_(false)
        , ref_out_(false) 
    {}
    
    // 可选参数配置（带默认值）
    void set_init(T val) { init_ = val; }
    void set_xor_out(T val) { xor_out_ = val; }
    void set_ref_in(bool val) { ref_in_ = val; }
    void set_ref_out(bool val) { ref_out_ = val; }

    // 统一计算接口
    T calculate(const uint8_t* data, size_t length) const {
        T crc = init_;
        
        for (size_t i = 0; i < length; ++i) {
            uint8_t byte = data[i];
            
            // 输入反转
            if (ref_in_) {
                byte = reverse_bits_8(byte);
            }
            
            // CRC 计算（位宽自适应）
            crc = crc_update(crc, byte);
        }
        
        // 输出反转
        if (ref_out_) {
            crc = reverse_bits(crc);
        }
        
        // 结果异或
        crc ^= xor_out_;
        
        return crc;
    }

private:
    T poly_;
    T init_;
    T xor_out_;
    bool ref_in_;
    bool ref_out_;
    
    // 反转字节的位顺序
    static uint8_t reverse_bits_8(uint8_t byte) {
        byte = ((byte & 0xF0) >> 4) | ((byte & 0x0F) << 4);
        byte = ((byte & 0xCC) >> 2) | ((byte & 0x33) << 2);
        byte = ((byte & 0xAA) >> 1) | ((byte & 0x55) << 1);
        return byte;
    }
    
    // 反转任意类型的位顺序
    static T reverse_bits(T value) {
        T result = 0;
        size_t bits = sizeof(T) * 8;
        for (size_t i = 0; i < bits; ++i) {
            result <<= 1;
            result |= (value & 1);
            value >>= 1;
        }
        return result;
    }
    
    // CRC 更新（通用实现）
    T crc_update(T crc, uint8_t byte) const {
        const size_t width = sizeof(T) * 8;
        
        if (width == 8) {
            // CRC-8
            crc ^= byte;
            for (int i = 0; i < 8; ++i) {
                if (crc & 0x80) {
                    crc = (crc << 1) ^ poly_;
                } else {
                    crc <<= 1;
                }
            }
        } else if (width == 16) {
            // CRC-16
            crc ^= (static_cast<T>(byte) << 8);
            for (int i = 0; i < 8; ++i) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ poly_;
                } else {
                    crc <<= 1;
                }
            }
        } else if (width == 32) {
            // CRC-32
            crc ^= (static_cast<T>(byte) << 24);
            for (int i = 0; i < 8; ++i) {
                if (crc & 0x80000000UL) {
                    crc = (crc << 1) ^ poly_;
                } else {
                    crc <<= 1;
                }
            }
        } else {
            // 其他位宽（通用慢速实现）
            T top_bit = static_cast<T>(1) << (width - 1);
            crc ^= (static_cast<T>(byte) << (width - 8));
            for (int i = 0; i < 8; ++i) {
                if (crc & top_bit) {
                    crc = (crc << 1) ^ poly_;
                } else {
                    crc <<= 1;
                }
            }
        }
        
        return crc;
    }
};

// ============================================================================
// 预定义的标准 CRC16-Modbus (使用特化或别名)
// ============================================================================
class Checksum_CRC16_Modbus : public Checksum_CRC<uint16_t> {
public:
    Checksum_CRC16_Modbus() : Checksum_CRC<uint16_t>(0x8005) {
        set_init(0xFFFF);
        set_xor_out(0x0000);
        set_ref_in(true);
        set_ref_out(true);
    }
};

} // namespace protocol_parser

#endif // PROTOCOL_CHECKSUM_H

