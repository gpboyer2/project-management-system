# 协议解析两阶段重构 - 详细设计方案

> 基于 `2026-01-20-protocol-parsing-refactor-proposal.md` 提案的实现设计

## 1. 方案选择

### 1.1 总体方案：最小侵入式重构

**核心思路**：在现有模板和生成器基础上进行增量修改，保持向后兼容。

**实现要点**：

1. **头文件模板** - 在同一个文件中生成两个结构体
   - 先生成 `{Protocol}_Raw`（包含所有字段，含 Padding）
   - 再生成 `{Protocol}Result`（业务结构体，去除 Padding）
   - 添加 `from_raw()` / `to_raw()` 静态方法声明

2. **实现文件模板** - 分离解析逻辑
   - `parse_raw()`: 纯二进制解析，无 validWhen、无 valueRange
   - `convert_to_business()`: Raw → Business 转换，处理 validWhen、valueRange、类型转换
   - Facade 函数组合两步骤

**优势**：
- 改动范围可控
- 保持现有接口兼容
- 可以逐步迁移测试

---

## 2. 关键技术决策

### 2.1 Padding/Reserved 在 Raw 结构体中的表示

**选择**：使用索引自动命名

```cpp
// 示例
struct SensorData_Raw {
    uint8_t id;
    uint8_t padding_0;           // 自动索引命名
    int16_t temp;
    uint8_t reserved_0[4];       // 数组形式
};
```

**理由**：
- 自动生成，无歧义
- 清晰表达字段用途
- 支持多个 Padding/Reserved 字段

---

### 2.2 validWhen 字段在 Business 结构体中的表示

**选择**：保留原类型 + 有效标志（C++11 兼容）

```cpp
// 示例
struct SensorDataResult {
    uint8_t id;
    // Padding 字段被移除
    double temp;                 // 原始类型保留
    bool temp_valid;             // 有效性标志
};
```

**理由**：
- 兼容 C++11 技术栈（项目要求）
- 不依赖 C++17 的 `std::optional`
- 语义清晰，使用简单

**生成规则**：
- 对于有 `validWhen` 配置的字段，额外生成 `{field_name}_valid` 布尔字段
- `from_raw()` 中根据条件设置 `_valid` 标志
- `to_raw()` 中可选择性地处理无效字段（填充默认值或 0）

---

### 2.3 Bitfield 在 Raw 结构体中的表示

**选择**：Raw 层保持原始整数

```cpp
// Raw 层
struct SensorData_Raw {
    uint32_t status_raw;         // 原始位域掩码
};

// Business 层
struct SensorDataResult {
    struct {
        uint64_t bit_a = 0;      // 展开的位段值
        std::string bit_a_meaning;
        uint64_t bit_b = 0;
        // ...
    } status;
};
```

**理由**：
- Raw 层职责单一：只做二进制映射
- Business 层提供友好的访问接口
- 转换逻辑集中在 `from_raw()` / `to_raw()` 中

---

### 2.4 嵌套结构体处理

**选择**：递归生成 `_Raw` 版本

```cpp
// Raw 层嵌套
struct Header_Raw {
    uint16_t magic;
    uint8_t padding_0[2];
    uint16_t length;
};

struct SensorData_Raw {
    Header_Raw header;           // 嵌套也是 Raw
    uint8_t padding_0[2];
    int16_t temp;
};

// Business 层嵌套
struct HeaderResult {
    uint16_t magic;
    // Padding 被移除
    uint16_t length;
};

struct SensorDataResult {
    HeaderResult header;         // 嵌套也是 Business
    double temp;
    bool temp_valid;
};
```

**理由**：
- 保持层次一致性
- Raw 和 Business 结构体一一对应
- 转换逻辑可递归处理

---

## 3. 生成代码结构示例

基于提案中的 JSON 配置：

```json
{
    "name": "SensorData",
    "fields": [
        { "type": "UnsignedInt", "fieldName": "id", "byteLength": 1 },
        { "type": "Padding", "byteLength": 1 },
        { 
            "type": "SignedInt", 
            "fieldName": "temp", 
            "byteLength": 2, 
            "validWhen": {"field": "id", "value": 1},
            "valueRange": [{"min": -500, "max": 500}], 
            "unit": "0.1C" 
        }
    ]
}
```

### 3.1 生成的头文件 (SensorData_parser.h)

```cpp
#ifndef SENSORDATA_PARSER_H
#define SENSORDATA_PARSER_H

#include "./protocol_parser_framework/protocol_common.h"

namespace protocol_parser {

// ==========================================
// 1. 协议层结构体 (Protocol Layer)
// ==========================================
struct SensorData_Raw {
    uint8_t id;
    uint8_t padding_0;           // Padding 字段
    int16_t temp;                // 原始值，无单位转换

    // Raw 解析方法
    bool parse_from(const uint8_t* buffer, size_t len, ByteOrder byte_order);
    bool serialize_to(uint8_t* buffer, size_t buffer_size, ByteOrder byte_order) const;
};

// ==========================================
// 2. 业务层结构体 (Application Layer)
// ==========================================
struct SensorDataResult {
    uint8_t id;
    // Padding 字段被移除
    double temp;                 // 经过单位转换 (0.1C -> double)
    bool temp_valid;             // validWhen 有效性标志

    SensorDataResult() : id(0), temp(0.0), temp_valid(false) {}

    // Raw ↔ Business 转换方法
    static bool from_raw(const SensorData_Raw& raw, SensorDataResult& result);
    SensorData_Raw to_raw() const;
};

// ==========================================
// 3. 兼容性接口 (Integration Facade)
// ==========================================

// 反序列化函数（整合了 Parse Raw + Convert 两个步骤）
DeserializeResult deserialize_SensorData(
    const uint8_t* data,
    size_t length,
    SensorDataResult& result,
    ByteOrder byte_order = BIG_ENDIAN
);

// 序列化函数（整合了 Convert + Serialize Raw 两个步骤）
SerializeResult serialize_SensorData(
    const SensorDataResult& data,
    uint8_t* buffer,
    size_t buffer_size,
    ByteOrder byte_order = BIG_ENDIAN
);

} // namespace protocol_parser

#endif // SENSORDATA_PARSER_H
```

### 3.2 生成的实现文件 (SensorData_parser.cpp)

```cpp
#include "SensorData_parser.h"
#include <cstring>

namespace protocol_parser {

// ============================================================================
// Raw 结构体方法实现
// ============================================================================

bool SensorData_Raw::parse_from(const uint8_t* buffer, size_t len, ByteOrder byte_order) {
    DeserializeContext ctx(buffer, len, byte_order);
    
    // 无条件解析所有字段（包括 Padding）
    {
        uint8_t id_raw = 0;
        DeserializeResult res = deserialize_unsigned_int_generic<uint8_t>(ctx, id_raw);
        if (!res.is_success()) return false;
        this->id = id_raw;
    }
    {
        // Padding: 跳过 1 字节
        uint8_t padding_0_raw = 0;
        DeserializeResult res = deserialize_unsigned_int_generic<uint8_t>(ctx, padding_0_raw);
        if (!res.is_success()) return false;
        this->padding_0 = padding_0_raw;
    }
    {
        int16_t temp_raw = 0;
        DeserializeResult res = deserialize_signed_int_generic<int16_t>(ctx, temp_raw);
        if (!res.is_success()) return false;
        this->temp = temp_raw;  // 原始值，不做转换
    }
    
    return true;
}

bool SensorData_Raw::serialize_to(uint8_t* buffer, size_t buffer_size, ByteOrder byte_order) const {
    SerializeContext ctx(buffer, buffer_size, byte_order);
    
    {
        SerializeResult res = serialize_unsigned_int_generic<uint8_t>(ctx, this->id);
        if (!res.is_success()) return false;
    }
    {
        SerializeResult res = serialize_unsigned_int_generic<uint8_t>(ctx, this->padding_0);
        if (!res.is_success()) return false;
    }
    {
        SerializeResult res = serialize_signed_int_generic<int16_t>(ctx, this->temp);
        if (!res.is_success()) return false;
    }
    
    return true;
}

// ============================================================================
// Raw → Business 转换
// ============================================================================

bool SensorDataResult::from_raw(const SensorData_Raw& raw, SensorDataResult& result) {
    // 直接复制的字段
    result.id = raw.id;
    
    // validWhen 处理: temp 仅当 id == 1 时有效
    if (raw.id == 1) {
        // valueRange 校验
        if (raw.temp < -500 || raw.temp > 500) {
            return false;  // 校验失败
        }
        // 单位转换: 0.1C -> double
        result.temp = static_cast<double>(raw.temp) * 0.1;
        result.temp_valid = true;
    } else {
        result.temp = 0.0;
        result.temp_valid = false;
    }
    
    return true;
}

// ============================================================================
// Business → Raw 转换
// ============================================================================

SensorData_Raw SensorDataResult::to_raw() const {
    SensorData_Raw raw;
    
    raw.id = this->id;
    raw.padding_0 = 0;  // Padding 填充默认值
    
    if (this->temp_valid) {
        // 逆向单位转换: double -> 0.1C
        raw.temp = static_cast<int16_t>(this->temp / 0.1);
    } else {
        raw.temp = 0;
    }
    
    return raw;
}

// ============================================================================
// Facade 接口实现
// ============================================================================

DeserializeResult deserialize_SensorData(
    const uint8_t* data,
    size_t length,
    SensorDataResult& result,
    ByteOrder byte_order
) {
    if (data == nullptr || length == 0) {
        return DeserializeResult(INVALID_FORMAT, "Invalid input data", 0);
    }
    
    // Step 1: Binary -> Raw
    SensorData_Raw raw;
    if (!raw.parse_from(data, length, byte_order)) {
        return DeserializeResult(PARSE_ERROR, "Failed to parse raw binary data", 0);
    }
    
    // Step 2: Raw -> Business
    if (!SensorDataResult::from_raw(raw, result)) {
        return DeserializeResult(INVALID_VALUE, "Business validation failed", 0);
    }
    
    return DeserializeResult(SUCCESS, "Deserialize successful", length);
}

SerializeResult serialize_SensorData(
    const SensorDataResult& data,
    uint8_t* buffer,
    size_t buffer_size,
    ByteOrder byte_order
) {
    if (buffer == nullptr || buffer_size == 0) {
        return SerializeResult(INVALID_FORMAT, "Invalid output buffer", 0);
    }
    
    // Step 1: Business -> Raw
    SensorData_Raw raw = data.to_raw();
    
    // Step 2: Raw -> Binary
    if (!raw.serialize_to(buffer, buffer_size, byte_order)) {
        return SerializeResult(SERIALIZE_ERROR, "Failed to serialize raw structure", 0);
    }
    
    return SerializeResult(SUCCESS, "Serialize successful", sizeof(SensorData_Raw));
}

} // namespace protocol_parser
```

---

## 4. 需要修改的文件清单

### 4.1 模板文件

| 文件 | 修改内容 |
|------|----------|
| `templates/main_parser/main_parser.h.template` | 添加 `_Raw` 结构体定义、转换方法声明 |
| `templates/main_parser/main_parser.cpp.template` | 生成 `parse_from()`、`from_raw()`、Facade 实现 |
| `templates/main_parser/main_serializer.cpp.template` | 生成 `serialize_to()`、`to_raw()` 实现 |
| `templates/composites/struct.h.template` | 添加对应的 `_Raw` 嵌套结构体 |

### 4.2 生成器文件

| 文件 | 修改内容 |
|------|----------|
| `nodegen/cpp-header-generator.js` | 生成两种结构体、处理 Padding 字段、添加 `_valid` 标志 |
| `nodegen/cpp-impl-generator.js` | 分离 Raw 解析逻辑（移除 validWhen）、生成转换函数 |
| `nodegen/cpp-serializer-generator.js` | 分离 Raw 序列化逻辑、生成逆向转换函数 |

---

## 5. 实施阶段规划

### 阶段 1：头文件生成器重构
1. 修改 `cpp-header-generator.js` 生成 `_Raw` 结构体
2. 修改模板添加 Padding 字段命名逻辑
3. 添加 `_valid` 标志字段生成

### 阶段 2：实现文件生成器重构
1. 修改 `cpp-impl-generator.js` 分离 Raw 解析
2. 实现 `from_raw()` 转换逻辑生成
3. 修改 Facade 函数生成

### 阶段 3：序列化器重构
1. 修改 `cpp-serializer-generator.js` 分离 Raw 序列化
2. 实现 `to_raw()` 转换逻辑生成
3. 修改 Facade 函数生成

### 阶段 4：测试与验证
1. 使用现有测试配置生成新代码
2. 编译验证
3. 运行现有测试用例

---

## 6. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 嵌套结构体处理复杂 | 递归处理，确保每层都生成对应的 `_Raw` 版本 |
| 现有测试可能失败 | 保持 Facade 接口不变，确保向后兼容 |
| Bitfield 转换逻辑复杂 | 复用现有的位域解析代码，仅调整位置 |
| 生成代码膨胀 | 权衡：代码可读性和调试便利性更重要 |

---

## 7. 待确认事项

1. ~~validWhen 字段使用 `std::optional` 还是有效标志？~~ → 使用有效标志（C++11 兼容）
2. 是否需要为 Raw 结构体单独生成头文件？ → 否，放在同一个头文件中
3. 转换失败时的错误处理策略？ → 返回 false，由调用者处理
