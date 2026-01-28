# 协议解析代码生成重构方案：两阶段处理

## 1. 背景与目标

当前的代码生成方案将“网络报文解析”与“业务数据转换”耦合在一个过程中。为了提高代码的可维护性、灵活性及调试便利性，本方案提议在保持配置文件规范 (`docs/json spec.md`) 不变的前提下，将代码生成逻辑拆分为两个独立阶段：

1.  **协议层 (Protocol Layer)**: 负责二进制数据的序列化与反序列化，严格对应报文格式。
2.  **应用层 (Application Layer)**: 负责数据的语义转换、校验及业务结构映射。

## 2. 核心设计

### 2.1 数据结构拆分

我们将为每个协议定义生成两个不同的 C++ 结构体：

#### A. 协议传输对象 (Protocol Transfer Object, PTO)
*   **命名约定**: `TargetName_Raw` (例如 `TelemetryData_Raw`)
*   **职责**: 1:1 映射二进制报文布局。
*   **包含内容**:
    *   所有字段，包括 `Padding` (填充) 和 `Reserved` (保留) 字段。
    *   **包括那些无论业务是否有效都物理存在的字段**。
    *   使用原始数据类型 (如 `uint32_t`, `uint8_t`)，不进行单位转换或精度处理。
    *   `Timestamp` 存储为原始整数。
    *   `Bitfield` 存储为原始整数掩码。
    *   动态数组使用 `std::vector`。
    *   **移除** 第一阶段对 `validWhen` 的处理（因为它只影响业务意义，不影响物理布局）。

#### B. 业务领域对象 (Business Domain Object, BDO)
*   **命名约定**: `TargetName` (例如 `TelemetryData`)
*   **职责**: 提供对开发者友好的业务数据模型。
*   **包含内容**:
    *   仅包含有业务意义的字段，**去除** `Padding` 和 `Reserved`。
    *   使用语义化类型 (如 `double` 处理精度, `std::chrono` 处理时间, `Enum` 处理映射)。
    *   `Bitfield` 被展开为独立的 `bool` 字段或结构体。
    *   经过校验的数据。
    *   **validWhen 处理结果**: 使用 `std::optional` 或业务逻辑来表达字段的业务有效性。

### 2.2 处理流程

#### 过程一：网络报文序列化 (Serialization/Deserialization)
此过程仅关注 **Layout (布局)**，不关注 **Value (值)** 的合法性。

*   **输入**: 二进制 buffer
*   **输出**: `Protocol Transfer Object (PTO)`
*   **逻辑**:
    *   字节序转换 (Big/Little Endian)。
    *   根据 `byteLength` 读取数据。
    *   根据 `count` 或 `countFromField` 处理数组大小。
    *   **无条件解析**: 即使配置了 `validWhen`，也照常解析该字段，因为它物理上存在。
    *   **不执行** `valueRange` 校验。
    *   **不执行** 单位转换。

#### 过程二：语义转换 (Semantic Conversion)
此过程关注数据的 **Validity (合法性)** 和 **Semantics (语义)**。

*   **输入**: `Protocol Transfer Object (PTO)`
*   **输出**: `Business Domain Object (BDO)`
*   **逻辑**:
    *   **validWhen 校验**: 在此处检查依赖字段的值。如果条件不满足，则标记该字段在业务上无效（例如置为 `std::nullopt` 或忽略）。
    *   **校验**: 执行 `valueRange` 检查，超出范围则报错或抛出异常。
    *   **转换**:
        *   `Float` 精度还原 (e.g., raw value * 0.1)。
        *   `Timestamp` 转 `std::chrono`。
        *   `Encode` (Enum) 整数转枚举类型。
        *   `Bitfield` 掩码解包。
    *   **清洗**: 丢弃 `Padding` 和 `Reserved` 数据。

### 2.3 接口兼容性设计 (Facade Integration)

为了保证对现有调用代码的兼容性，我们将提供与旧版本完全一致的顶层 API。这些 API 将作为 **Facade (外观)**，内部依次调用 Phase 1 和 Phase 2 的逻辑。

*   **Deserialize 整合**: `Binary` -> `Raw` -> `Business`
*   **Serialize 整合**: `Business` -> `Raw` -> `Binary`

---

## 3. 代码生成示例

假设我们有以下 JSON 定义（`validWhen` 仅表示数据是否有意义，不影响物理存在）：

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

### 3.1 生成的头文件结构 (SensorData.h)

```cpp
#include <vector>
#include <optional>
#include <cstdint>
#include "protocol_parser_framework/protocol_common.h" // 引用现有框架

namespace protocol_parser {

// ==========================================
// 1. 协议层结构体 (Protocol Layer)
// ==========================================
struct SensorData_Raw {
    uint8_t id;
    uint8_t padding_0; 
    int16_t temp; 

    // 内部 helper 方法 (可选，也可以做成 free function)
    bool parse_from(const uint8_t* buffer, size_t len, ByteOrder byte_order);
    bool serialize_to(std::vector<uint8_t>& out, ByteOrder byte_order) const;
};

// ==========================================
// 2. 业务层结构体 (Application Layer)
// ==========================================
struct SensorDataResult { // 名称保持与旧版一致 (Result)
    uint8_t id;
    // Padding 字段被移除
    std::optional<double> temp; 

    // 内部 helper 方法 (用于两层互转)
    static std::optional<SensorDataResult> from_raw(const SensorData_Raw& raw);
    SensorData_Raw to_raw() const;
};

// ==========================================
// 3. 兼容性接口 (Integration Facade)
// ==========================================

/**
 * 反序列化函数（整合了 Parse Raw + Convert 两个步骤）
 * 保持与旧版接口完全一致
 */
DeserializeResult deserialize_SensorData(
    const uint8_t* data,
    size_t length,
    SensorDataResult& result,
    ByteOrder byte_order = BIG_ENDIAN
);

/**
 * 序列化函数（整合了 Convert + Serialize Raw 两个步骤）
 * 保持与旧版接口完全一致
 */
SerializeResult serialize_SensorData(
    const SensorDataResult& data,
    uint8_t* buffer,
    size_t buffer_size,
    ByteOrder byte_order = BIG_ENDIAN
);

} // namespace protocol_parser
```

### 3.2 生成的实现文件逻辑 (SensorData.cpp)

```cpp
namespace protocol_parser {

// ... SensorData_Raw 和 SensorDataResult 的内部实现 ...

// ==========================================
// 3. 兼容性接口实现 (Integration Facade Implementation)
// ==========================================

DeserializeResult deserialize_SensorData(
    const uint8_t* data,
    size_t length,
    SensorDataResult& result,
    ByteOrder byte_order
) {
    // Step 1: Binary -> Raw
    SensorData_Raw raw;
    // 注意：这里需要适配现有的 DeserializeResult 错误处理机制
    if (!raw.parse_from(data, length, byte_order)) {
        return DeserializeResult(PARSE_ERROR, "Failed to parse raw binary data", 0);
    }

    // Step 2: Raw -> Business
    auto business_opt = SensorDataResult::from_raw(raw);
    if (!business_opt.has_value()) {
        // 这里的转换失败通常意味着 valueRange 校验失败等业务错误
        return DeserializeResult(INVALID_VALUE, "Business validation failed (range check, etc.)", 0);
    }

    result = business_opt.value();
    // 成功返回
    return DeserializeResult(SUCCESS, "", length);
}

SerializeResult serialize_SensorData(
    const SensorDataResult& data,
    uint8_t* buffer,
    size_t buffer_size,
    ByteOrder byte_order
) {
    // Step 1: Business -> Raw
    SensorData_Raw raw = data.to_raw();

    // Step 2: Raw -> Binary
    std::vector<uint8_t> bytes;
    if (!raw.serialize_to(bytes, byte_order)) {
        return SerializeResult(SERIALIZE_ERROR, "Failed to serialize raw structure", 0);
    }

    if (bytes.size() > buffer_size) {
        return SerializeResult(BUFFER_OVERFLOW, "Buffer too small", 0);
    }

    // 复制数据到输出 buffer
    std::memcpy(buffer, bytes.data(), bytes.size());
    return SerializeResult(SUCCESS, "", bytes.size());
}

} // namespace protocol_parser
```

## 4. 实施计划

### 4.1 模板重构
需要创建两套模板：
1.  `raw_struct.h.template` / `raw_parser.cpp.template`: 负责生成 `_Raw` 结构体及其解析逻辑。
    *   **移除** `validWhen` 逻辑，所有字段按序解析。
    *   移除所有 `validate_range` 调用。
    *   强制使用基础类型。
2.  `domain_struct.h.template` / `converter.cpp.template`: 负责生成业务结构体及转换逻辑。
    *   **增加** `validWhen` 逻辑检查。
    *   增加 `from_raw` 和 `to_raw` 转换函数模板。

### 4.2 生成器逻辑修改
修改 `nodegen/cpp-impl-generator.js` 和相关生成器：
*   在 Phase 1 生成器中忽略 `validWhen`。
*   在 Phase 2 生成器中注入 `validWhen` 检查代码。
*   **新增**: 生成顶层 Facade 函数 (`deserialize_ProtocolName`, `serialize_ProtocolName`)，连接 Phase 1 和 Phase 2。

## 5. 总结
此方案在**内部**实现了两阶段解耦（Raw Layout vs Business Logic），而在**外部**保持了与旧版完全一致的函数签名接口。这对上层应用是透明的，同时带来了内部架构的清晰度提升。
