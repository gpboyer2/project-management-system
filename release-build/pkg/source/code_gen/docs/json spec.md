### 协议数据类型JSON设计方案

> **两阶段处理架构说明**
>
> 本规范采用两阶段处理架构，将协议解析分为两个独立阶段：
>
> | 阶段 | 名称 | 职责 | 结构体 |
> |------|------|------|--------|
> | **Phase 1** | 协议层 (Protocol Layer) | 二进制数据的序列化/反序列化，严格对应报文格式 | `{Protocol}_Raw` |
> | **Phase 2** | 应用层 (Application Layer) | 数据的语义转换、校验及业务结构映射 | `{Protocol}Result` |
>
> 在下文字段属性说明中，将使用以下标记指明属性的处理阶段：
> - **[P1]** - 协议层处理（影响二进制布局和解析）
> - **[P2]** - 应用层处理（影响业务逻辑和数据校验）
> - **[P1+P2]** - 两层都需要处理

---

#### 根节点

整个协议定义是一个JSON对象。

**根对象属性**:

-   `name`: **协议名称 (必填)**
    -   **描述**: 定义协议的唯一名称，用于识别和管理。
    -   **值**: 字符串。
-   `description`: **描述 (可选)**
    -   **描述**: 协议的详细说明，用于理解协议的功能和作用。
    -   **值**: 字符串。
-   `version`: **协议版本 (可选)**
    -   **描述**: 指定协议的版本号，用于版本控制。
    -   **值**: 字符串，例如 "1.0"。
-   `defaultByteOrder`: **默认字节序 (可选)**
    -   **描述**: 指定协议中所有字段的默认字节序。单个字段可以覆写此设置。
    -   **值**: "big" (大端) 或 "little" (小端)。默认值为 "big"。
-   `fields`: **字段定义 (必填)**
    -   **描述**: 一个数组，包含协议中所有顶层字段的详细定义。
    -   **值**: 包含字段定义对象的数组。
-   `structAlignment`: **结构体字节对齐 (可选)**
    -   **描述**: 控制生成的 C++ 结构体在内存中的字节对齐方式。不影响协议的二进制布局，仅影响结构体成员的内存排列。
    -   **值**: 整数，支持 1, 2, 4, 8, 16。
        -   `1`: 紧凑对齐（无填充字节）
        -   `2/4/8/16`: 按指定字节边界对齐
        -   不配置：使用编译器默认对齐行为
    -   **实现**: 使用 `#pragma pack(push, N)` 和 `#pragma pack(pop)` 包装结构体定义
    -   **注意**: 此属性仅控制解析后数据结构的内存布局，不改变协议解析逻辑

```json
{
    "name": "YourProtocolName",
    "description": "这是一个示例协议，用于说明协议数据类型的JSON设计。",
    "version": "1.0",
    "defaultByteOrder": "big",
    "structAlignment": 1,  // 紧凑对齐，无填充
    "fields": [
        // ... 这里放置所有协议字段定义 ...
        {
            "type": "UnsignedInt",
            "fieldName": "exampleField",
            "byteLength": 4,
            "description": "这是一个示例无符号整数字段。"
        }
    ]
}
```

---

#### 1. 有符号整数 (SignedInt)

- **type**: `"SignedInt"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义了数据字段在解析和生成代码时所使用的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **按字节定义长度（必填）** **[P1]**
        -   **描述**: 指定字段占用的字节数。
        -   **值**: 1, 2, 4, 8。
        -   **阶段说明**: 协议层根据此值读取/写入对应字节数的二进制数据。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 协议层无条件解析该字段（因为它物理存在）；应用层在 `from_raw()` 转换时检查条件，设置 `{field}_valid` 标志。
    -   `defaultValue`: **默认值 (可选)** **[P1]**
        -   **描述**: 在生成报文过程中（解析的逆过程），如果没有数据，即提供一个默认值。
        -   **值**: 取决于字段类型。
        -   **阶段说明**: 协议层结构体字段的初始化值。创建 Raw 结构体时字段自动初始化为此值；`parse_from()` 会覆盖它；`serialize_to()` 若字段未被显式设置则使用此值。
    -   `valueRange`: **取值范围 (可选)** **[P2]**
        -   **描述**: 用于数据校验，确保解析出的值在指定的一个或多个范围内。该字段是一个数组，其中包含一个或多个范围对象。
        -   **值**: 一个包含一个或多个范围对象的数组。每个范围对象都应包含 `min` 和 `max` 属性。
        -   **阶段说明**: 协议层不执行此校验；应用层在 `from_raw()` 转换时执行校验，失败则返回错误。
    -   `unit`: **单位 (可选)** **[P2]**
        -   **描述**: 字段的物理单位。
        -   **值**: 字符串，例如 "V", "A", "°C"。
        -   **阶段说明**: 如果配合 `lsb` 使用，应用层执行单位转换；否则仅作为文档注释。
    
    -   **示例**:
    
    ```json
    // 场景：仅当 status_reg 字段值为 1 时，解析 weight 字段
    [
        {
            "type": "UnsignedInt",
            "fieldName": "status_reg",
            "byteLength": 1,
            "description": "状态寄存器，1表示重量数据有效"
        },
        {
            "type": "SignedInt",
            "fieldName": "weight",
            "description": "表示物体的重量",
            "byteLength": 2,
            "validWhen": {
                "field": "status_reg",
                "value": 1
            },
            "defaultValue": 500,
            "valueRange": [
              { "min": 0, "max": 1000 }
            ],
            "unit": "kg"
        }
    ]
    ```

#### 2. 无符号整数 (UnsignedInt)

结构与 `SignedInt` 完全相同，仅`type`不同。

-   **type**: `"UnsignedInt"`
-   **属性**: (同 `SignedInt`)
-   **示例**:

    ```json
    {
        "type": "UnsignedInt",
        "fieldName": "battery_level",
        "description": "电池电量百分比",
        "byteLength": 1,
        "valueRange": [
        { "min": 0, "max": 100 }
        ]
    }
    ```

#### 3. 报文标识 (MessageId)

用于标识不同类型报文的专用字段，主要用于协议分发器根据报文类型路由到对应的解析器。

- **type**: `"MessageId"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义了数据字段在解析和生成代码时所使用的唯一标识符。
        -   **值**: 字符串。默认“MessageId”。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **按字节定义长度（必填）** **[P1]**
        -   **描述**: 指定字段占用的字节数。
        -   **值**: 1, 2, 4, 8。
        -   **阶段说明**: 协议层根据此值读取/写入相应字节数。
    -   `valueType`: **标识字段的数据类型 (必填)** **[P1]**
        -   **描述**: 指定报文标识在二进制中的基础表示类型。
        -   **值**: `"UnsignedInt"`、`"SignedInt"`。
        -   **阶段说明**: 协议层根据此值确定使用有符号或无符号整数类型。
    -   `messageIdValue`: **报文标识值 (必填)** **[P1+P2]**
        -   **描述**: 该协议对应的唯一标识值，用于分发器识别和路由。
        -   **值**: 整数或字符串，取决于 `valueType`。
        -   **阶段说明**: 协议层存储此值用于分发匹配；应用层可用于报文类型验证。
    
-   **示例**:

    ```json
    {
        "type": "MessageId",
        "fieldName": "message_id",
        "description": "用于识别不同类型报文的标识字段",
        "byteLength": 2,
        "valueType": "UnsignedInt",
        "messageIdValue": 1,
        "valueRange": [
          { "min": 1, "max": 255 }
        ]
    }
    ```

#### 4. 浮点数 (Float)

- **type**: `"Float"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 协议层无条件解析；应用层检查条件并设置 `{field}_valid` 标志。
    -   `precision`: **数据精度 (必填)** **[P1]**
        -   **描述**: 定义浮点数的精度，决定其字节长度。
        -   **值**: "float" (4字节) 或 "double" (8字节)。
        -   **阶段说明**: 协议层根据此值决定读取 4 或 8 字节。
    -   `defaultValue`: **默认值 (可选)** **[P1]**
        -   **描述**: 在生成报文或解析时缺少字段时使用的默认值。
        -   **值**: 浮点数。
        -   **阶段说明**: 协议层结构体字段的初始化值。
    -   `valueRange`: **取值范围 (可选)** **[P2]**
        -   **描述**: 用于数据校验，确保解析出的值在指定的一个或多个范围内。该字段是一个数组，其中包含一个或多个范围对象。
        -   **值**: 一个包含一个或多个范围对象的数组。每个范围对象都应包含 `min` 和 `max` 属性。
        -   **阶段说明**: 应用层在 `from_raw()` 转换时执行校验。
    -   `unit`: **单位 (可选)** **[P2]**
        -   **描述**: 字段的物理单位。
        -   **值**: 字符串，例如 "V", "A", "°C"。
        -   **阶段说明**: 仅作为文档注释，或配合 `lsb` 进行单位转换。
    
-   **示例**:

    ```json
    {
        "type": "Float",
        "fieldName": "voltage",
        "description": "表示电压值",
        "precision": "float",
        "defaultValue": 3.3,
        "valueRange": [
          { "min": 0.0, "max": 5.0 }
        ],
        "unit": "V"
    }
    ```

#### 5. BCD 码 (Bcd)

- **type**: `"Bcd"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 定义BCD码占用的字节数。
        -   **值**: 1, 2, 4, 8。
        -   **阶段说明**: 协议层读取指定字节数，解码为 BCD 字符串存储在 Raw 结构体中。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 应用层检查条件并设置 `{field}_valid` 标志。
    -   `defaultValue`: **默认值 (可选)** **[P1]**
        -   **描述**: 在生成报文或解析时缺少字段时使用的默认值。
        -   **值**: BCD字符串。
        -   **阶段说明**: 协议层结构体字段的初始化值。
    -   `valueRange`: **取值范围 (可选)** **[P2]**
        -   **描述**: 用于数据校验，确保解析出的值在指定的一个或多个范围内。该字段是一个数组，其中包含一个或多个范围对象。
        -   **值**: 一个包含一个或多个范围对象的数组。每个范围对象都应包含 `min` 和 `max` 属性。
        -   **阶段说明**: 应用层在 `from_raw()` 转换时执行校验。
    
-   **示例**:

    ```json
    {
        "type": "Bcd",
        "fieldName": "timestamp_bcd",
        "description": "表示时间戳的BCD编码",
        "byteLength": 4,
        "defaultValue": "000000",
        "valueRange": [
          { "min": "000000", "max": "999999" }
        ]
    }
    ```

#### 6. 时间戳 (Timestamp)

-   **type**: `"Timestamp"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 定义时间戳占用的字节数，决定了其表示范围。
        -   **值**: 整数，通常为 4 (32位) 或 8 (64位)。
        -   **阶段说明**: 协议层读取指定字节数的原始整数值，存储在 Raw 结构体中。
    -   `unit`: **时间单位 (必填)** **[P2]**
        -   **描述**: 定义时间戳的单位，与 `byteLength` 结合确定时间戳的类型。
        -   **值**: `"seconds"` (秒), `"milliseconds"` (毫秒), `"microseconds"` (微秒), `"nanoseconds"` (纳秒),`"day-milliseconds"` (4字节当天毫秒数), `"day-0.1milliseconds"` (4字节当天毫秒数乘10)。
        -   **阶段说明**: 协议层存储原始整数；应用层在 `from_raw()` 时根据 `unit` 转换为标准时间格式（如纳秒），在 `to_raw()` 时执行逆向转换。

-   **示例**:

    ```json
    {
        "type": "Timestamp",
        "fieldName": "event_time",
        "description": "表示事件发生的时间戳",
        "byteLength": 4,
        "unit": "day-milliseconds"
    }
    ```

#### 7. 字符串 (String)

- **type**: `"String"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `length`: **字段长度 (必填)** **[P1]**
        -   **描述**: 定义字符串占用的字节数。如果为 `0`，表示这是一个变长字符串，读取到 `\0` 字符截止。
        -   **值**: 整数。
        -   **阶段说明**: 协议层根据此值读取指定字节数或直到 `\0`。
    -   `encoding`: **编码格式 (可选)** **[P1]**
        -   **描述**: 定义字符串的编码格式。
        -   **值**: 字符串，例如 "ASCII", "UTF-8", "GBK"。
        -   **阶段说明**: 协议层根据编码格式解析字节序列为字符串。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 应用层检查条件并设置 `{field}_valid` 标志。
    -   `defaultValue`: **默认值 (可选)** **[P1]**
        -   **描述**: 当数据流中不存在该字段，或在生成数据时提供一个默认值。
        -   **值**: 字符串。
        -   **阶段说明**: 协议层结构体字段的初始化值。
    
-   **示例**:

    ```json
    {
        "type": "String",
        "fieldName": "device_name",
        "description": "表示设备的名称",
        "length": 32,
        "encoding": "GBK",
        "defaultValue": "UnknownDevice"
    }
    ```

#### 8. 位域 (Bitfield)

-   **type**: `"Bitfield"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 定义位域占用的总字节数。
        -   **值**: 整数。
        -   **阶段说明**: 协议层读取指定字节数的原始整数值（如 `uint32_t`），存储在 Raw 结构体中。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 应用层检查条件并设置 `{field}_valid` 标志。
    -   `subFields`: **子字段 (必填)** **[P2]**
        -   **描述**: 一个数组，定义位域中的每一个位段。
        -   **值**: 子字段对象数组。
        -   **每个位段对象**:
            -   `name`: **位字段名称 (必填)** **[P2]**，用于 Business 结构体中的字段命名。
            -   `startBit`: **起始位 (必填)** **[P2]**，从 0 开始计数，用于从原始整数中提取位段值。
            -   `endBit`: **结束位 (必填)** **[P2]**，包含此位，用于从原始整数中提取位段值。
            -   `maps`: **值映射 (可选)** **[P2]**，一个数组，用于将位段的数值映射为有意义的字符串。
                -   **每个map对象**: `value` (数值), `meaning` (含义)。
        -   **阶段说明**: 协议层不处理子字段，只存储原始整数；应用层在 `from_raw()` 时根据 `startBit`/`endBit` 解包为独立的位段值和含义字符串，在 `to_raw()` 时重新打包。
-   **示例**:

    ```json
    {
        "type": "Bitfield",
        "fieldName": "device_status",
        "description": "表示设备的状态",
        "byteLength": 1,
        "subFields": [
            {
                "name": "power",
                "startBit": 0,
                "endBit": 0,
                "maps": [
                    { "value": 0, "meaning": "关闭" },
                    { "value": 1, "meaning": "开启" }
                ]
            },
            {
                "name": "mode",
                "startBit": 1,
                "endBit": 3,
                "maps": [
                    { "value": 0, "meaning": "待机" },
                    { "value": 1, "meaning": "自动" },
                    { "value": 2, "meaning": "手动" }
                ]
            },
            {
                "name": "error_code",
                "startBit": 4,
                "endBit": 7
            }
        ]
    }
    ```

#### 9. 编码 (Encode)

用于定义一个字段，其数值对应着特定的含义。

- **type**: "Encode"

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义了数据字段在解析和生成代码时所使用的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `baseType`: **基础类型 (必填)** **[P1]**
        -   **描述**: 定义命令字本身的基础整数类型。
        -   **值**: "signed" 或 "unsigned"。
        -   **阶段说明**: 协议层根据此值决定使用有符号或无符号整数解析。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 指定字段占用的字节数。
        -   **值**: 1, 2, 4, 8。
        -   **阶段说明**: 协议层读取指定字节数的原始整数值，存储在 Raw 结构体中。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 应用层检查条件并设置 `{field}_valid` 标志。
    -   `maps`: **值映射表 (必填)** **[P2]**
        -   **描述**: 一个数组，用于定义数值与其对应含义的映射关系。
        -   **值**: 对象数组，每个对象包含：
            -   `value`: 数值。
            -   `meaning`: 字符串，表示该数值的含义。
        -   **阶段说明**: 协议层存储原始整数值；应用层在 `from_raw()` 时根据 maps 查找并设置 `{field}_meaning` 字符串，在 `to_raw()` 时只使用原始整数值。
    
-   **示例**:

    ```json
    {
        "type": "Encode",
        "fieldName": "work_mode",
        "description": "表示设备的工作模式",
        "baseType": "unsigned",
        "byteLength": 1,
        "maps": [
            { "value": 0, "meaning": "待机模式" },
            { "value": 1, "meaning": "自动模式" },
            { "value": 2, "meaning": "手动模式" },
            { "value": 10, "meaning": "调试模式" }
        ]
    }
    ```

#### 10. 结构体 (Struct)

对应 `ProtocolItemStruct`。一个简单的容器。

-   **type**: `"Struct"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 协议层无条件解析整个结构体（因为它物理存在）；应用层检查条件并设置 `{field}_valid` 标志。
    -   `fields`: **子字段 (必填)** **[P1+P2]**
        -   **描述**: 定义结构体内部的字段集合。
        -   **值**: 字段对象数组，每个对象遵循本文档定义的字段格式。可以嵌套。
        -   **阶段说明**: 协议层递归生成对应的 `_Raw` 嵌套结构体；应用层生成对应的 Business 嵌套结构体。

-   **示例**:

    ```json
    {
        "type": "Struct",
        "fieldName": "packet_header",
        "description": "数据包的头部",
        "fields": [
            {
                "type": "UnsignedInt",
                "fieldName": "magic",
                "description": "数据包的魔术数",
                "byteLength": 2,
                "defaultValue": 1
            },
            {
                "type": "UnsignedInt",
                "fieldName": "version",
                "byteLength": 1
            },
            {
                "type": "UnsignedInt",
                "fieldName": "body_length",
                "description": "数据体的长度",
                "byteLength": 2
            }
        ]
    }
    ```

#### 11. 数组 (Array)

对应 `ProtocolItemArray`。

-   **type**: `"Array"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。    
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 协议层无条件解析数组；应用层检查条件并设置 `{field}_valid` 标志。
    -   **长度定义 (三选一)** **[P1]**:
        -   `count`: **固定元素个数 (Static Count)**
            -   **描述**: 数组长度在编译期确定。解析器将循环解析指定数量的元素。适用于固定格式协议（如 3x3 矩阵）。
            -   **值**: 正整数 (>= 1)。
            -   **阶段说明**: 协议层根据此值确定循环次数。
        -   `countFromField`: **动态关联长度 (Dynamic Count via Field)**
            -   **描述**: 数组长度由报文中前序字段的值决定（运行时确定）。解析器会读取指定字段的值作为元素个数。
            -   **值**: 字符串，表示引用字段的 `fieldName` 或路径 (如 `"header.body_len"`)。**注意**: 引用字段必须在数组之前已定义并解析。
            -   **阶段说明**: 协议层从 Raw 结构体中读取引用字段值确定数组长度。
        -   `bytesInTrailer`: **贪婪读取模式 (Greedy Read with Trailer)**
            -   **描述**: 解析器持续读取并填充数组，直到报文剩余未读字节数等于此值。通常用于解析报文末尾的不定长列表。
            -   **逻辑**: 循环条件为 `CurrentPos < (MessageTotalLength - bytesInTrailer)`。
            -   **值**: 整数 (>= 0)。例如 `0` 表示一直读到报文末尾。
            -   **阶段说明**: 协议层根据剩余字节数动态计算数组长度。
    -   `element`: **元素定义 (必填)** **[P1+P2]**
        -   **描述**: 定义数组中单个元素的结构。由于数组是同构的（所有元素类型相同），这里只需要定义一个字段对象。
        -   **值**: 一个字段对象，可以是任何有效的字段类型，如 `SignedInt`, `Struct`, `Array` 等。
        -   **阶段说明**: 如果元素是 Struct 类型，协议层生成对应的 `_Raw` 元素结构体；应用层生成 Business 元素结构体。

-   **示例**:

    ```json
    // 1. 固定元素个数 (Static Count)
    // 场景：读取 5 个浮点数
    {
        "type": "Array",
        "fieldName": "sensor_readings",
        "description": "固定采集的5组传感器数据",
        "count": 5,
        "element": {
            "type": "Float",
            "fieldName": "val",
            "precision": "float"
        }
    }
    
    // 2. 动态关联长度 (Dynamic Count via Field)
    // 场景：先读一个 count 字段，再读 count 个用户结构体
    {
        "type": "Array",
        "fieldName": "user_list",
        "description": "当前在线用户列表",
        "countFromField": "header.user_count",
        "element": {
            "type": "Struct",
            "fieldName": "user_info",
            "fields": [
                { "type": "UnsignedInt", "fieldName": "uid", "byteLength": 4 },
                { "type": "String", "fieldName": "name", "length": 32 }
            ]
        }
    }

    // 3. 贪婪读取模式 (Greedy Read with Trailer)
    // 场景：读取报文剩余所有数据，直到最后剩下 2 字节（CRC）
    {
        "type": "Array",
        "fieldName": "raw_data_chunk",
        "description": "变长数据块",
        "bytesInTrailer": 2,
        "element": {
            "type": "UnsignedInt",
            "fieldName": "byte",
            "byteLength": 1
        }
    }
    ```

#### 12. 命令字 (Command)

对应 `ProtocolItemCMD`。

- **type**: `"Command"`

-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。    
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `baseType`: **基础类型 (必填)** **[P1]**
        -   **描述**: 定义命令字本身的基础整数类型。
        -   **值**: "signed" 或 "unsigned"。
        -   **阶段说明**: 协议层根据此值决定使用有符号或无符号整数解析命令字。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 定义命令字占用的字节数。
        -   **值**: 1, 2, 4, 8。
        -   **阶段说明**: 协议层读取指定字节数的命令字值。
    -   `validWhen`: **有效性条件 (可选)** **[P2]**
        -   **描述**: 指定本字段的有效性是否依赖于前面已解析的某个字段。只有当引用字段的值（或位域子字段的值）等于指定值时，本字段才有效。
        -   **值**: 对象，包含：
            -   `field`: **引用字段名** (字符串，支持 `field.subfield` 格式引用位域)。
            -   `value`: **期望值** (整数，当引用字段等于此值时有效)。
        -   **阶段说明**: 应用层检查条件并设置 `{field}_valid` 标志。
    -   `cases`: **分支定义 (必填)** **[P1+P2]**
        -   **描述**: 定义一个对象，其键是命令字的匹配值，值是该命令对应的后续数据结构。
        -   **值**: 对象，键为字符串形式的数值 (例如 `"0x01"`), 值为字段对象。
        -   **阶段说明**: 协议层根据命令字值选择对应的分支进行解析，分支内的 Struct 生成对应的 `_Raw` 版本；应用层执行分支内字段的业务转换。
    
-   **示例**:

    ```json
    {
        "type": "Command",
        "fieldName": "command_id",
        "description": "命令标识",  
        "baseType": "unsigned",
        "byteLength": 1,
        "cases": {
            "0x01": {
                "type": "Struct",
                "fieldName": "set_time_request",
                "fields": [
                    { "type": "Timestamp", "byteLength": 4, "unit": "seconds" }
                ]
            },
            "0x02": {
                "type": "Struct",
                "fieldName": "get_config_request",
                "fields": [
                    { "type": "UnsignedInt", "fieldName": "config_id", "byteLength": 1 }
                ]
            }
        }
    }
    ```

#### 13. 填充或保留字 (Padding/Reserved)

-   **type**: `"Padding"` 或 `"Reserved"`
-   **属性**:
    -   `fieldName`: **字段名称 (可选)** **[P1]**
        -   **描述**: 为填充或保留字段提供一个名称，便于识别。
        -   **值**: 字符串。
        -   **阶段说明**: 协议层使用此名称或自动生成索引名称（如 `padding_0`, `reserved_1`）；应用层的 Business 结构体中**不包含**此字段。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   **长度定义 (互斥)** **[P1]**:
        -   `byteLength`: **字节长度**
            -   **描述**: 按字节定义字段的长度。
            -   **值**: 整数。
            -   **阶段说明**: 协议层读取/写入指定字节数。
        -   `bitLength`: **位长度**
            -   **描述**: 按位定义字段的长度。
            -   **值**: 整数。
            -   **阶段说明**: 协议层读取/写入指定位数。
    -   `fillValue`: **填充值 (可选)** **[P1]**
        -   **描述**: 在生成报文时用于填充该字段的十六进制值。
        -   **值**: 十六进制字符串 (例如 `"00"` 或 `"FF"`)。
        -   **阶段说明**: 协议层在 `serialize_to()` 时使用此值填充；如未指定，默认填充 0。

> **两阶段处理特殊说明**：
> - **Raw 结构体**: 包含 Padding/Reserved 字段，使用自动索引命名（如 `uint8_t padding_0;`）
> - **Business 结构体**: **不包含** Padding/Reserved 字段（已清洗）
> - `from_raw()`: 直接丢弃 Padding/Reserved 数据
> - `to_raw()`: 使用 `fillValue` 或默认值 0 填充
-   **示例**:
    ```json
    {
        "type": "Padding",
        "fieldName": "padding_bytes",
        "description": "填充字节",
        "byteLength": 4,
        "fillValue": "00"
    }
    {
        "type": "Reserved",
        "fieldName": "future_use",
        "description": "保留字段",
        "bitLength": 12
    }
    ```

#### 14. 校验位 (Checksum)（预留）

-   **type**: `"Checksum"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)** **[P1+P2]**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)** **[文档]**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `algorithm`: **校验算法 (必填)** **[P1]**
        -   **描述**: 指定校验和计算所使用的算法。
        -   **值**: 字符串 (例如 `"crc16-modbus"`, `"crc32"`, `"sum8"`, `"custom"`)。
        -   **阶段说明**: 协议层使用此算法读取校验值；应用层可用于校验验证。
    -   `byteLength`: **字节长度 (必填)** **[P1]**
        -   **描述**: 定义校验和字段本身占用的字节数。
        -   **默认值**: 为0时由算法自动推导。
        -   **值**: 整数。
        -   **阶段说明**: 协议层读取/写入指定字节数的校验值。
    -   `rangeStartRef`: **校验范围起始引用 (必填)** **[P1]**
        -   **描述**: 校验范围的起始字段路径。
        -   **默认值**: 当前结构体的起始位置。
        -   **值**: 字符串，例如 `"header.magic"`。
        -   **阶段说明**: 协议层记录此位置的字节偏移量，用于校验计算。
    -   `rangeEndRef`: **校验范围结束引用 (必填)** **[P1]**
        -   **描述**: 校验范围的结束字段路径。
        -   **默认值**: 本字段（Checksum）之前的位置。
        -   **值**: 字符串，例如 `"payload"`。
        -   **阶段说明**: 协议层记录此位置的字节偏移量，用于校验计算。
    -   `parameters`: **算法参数 (可选)** **[P1]**
        -   **描述**: 包含特定算法所需的任何参数。这是一个开放的配置对象，不同算法支持的参数不同。
        -   **值**: 对象。常见通用参数包括：
            -   `byteOrder`: **字节序** (`"big"` 或 `"little"`) - 指定多字节校验值的存储顺序。若未指定，通常默认使用协议字节序。
            -   `poly`: **多项式** (整数) - CRC 算法专用。
            -   `init`: **初始值** (整数) - CRC 算法专用。
            -   `xorOut`: **结果异或值** (整数) - CRC 算法专用。
            -   `refIn`: **输入反转** (布尔值) - CRC 算法专用。
            -   `refOut`: **输出反转** (布尔值) - CRC 算法专用。
            -   `check`: **预期值** (整数) - 用于测试验证。
        -   **阶段说明**: 协议层使用这些参数配置校验算法。

> **两阶段处理说明**：
> - **协议层**: 读取校验值并存储在 Raw 结构体中；序列化时计算并写入校验值
> - **应用层**: 可选择性地执行校验验证（在 `from_raw()` 中），校验失败可返回错误
-   **示例**:
    ```json
    {
        "type": "Checksum",
        "fieldName": "crc",
        "description": "CRC校验",
        "algorithm": "crc16-modbus",
        "rangeStartRef": "header",
        "rangeEndRef": "payload",
        "parameters": {
            "byteOrder": "big",
            "poly": 0x1021,
            "init": 0xFFFF,
            "xorOut": 0x0000,
            "refIn": false,
            "refOut": false
        }
    }
    ```

---

### 完整综合示例

下面是一个将上述设计组合起来的完整协议定义JSON示例。

```json
{
    "name": "CompleteProtocolExample",
    "description": "完整协议示例 (无压缩版本)",
    "version": "1.0",
    "defaultByteOrder": "big",
    "fields": [
        {
            "type": "SignedInt",
            "fieldName": "temperature",
            "description": "温度",
            "byteLength": 2
        },
        {
            "type": "UnsignedInt",
            "fieldName": "deviceId",
            "description": "设备ID",
            "byteLength": 4
        },
        {
            "type": "Float",
            "fieldName": "voltage",
            "description": "电压",
            "precision": "float"
        },
        {
            "type": "Bcd",
            "fieldName": "timestampBcd",
            "description": "BCD时间戳",
            "byteLength": 6
        },
        {
            "type": "Timestamp",
            "fieldName": "eventTime",
            "description": "事件时间",  
            "byteLength": 4,
            "unit": "seconds"
        },
        {
            "type": "String",
            "fieldName": "deviceName",
            "description": "设备名称",
            "length": 32
        },
        {
            "type": "Bitfield",
            "fieldName": "statusFlags",
            "description": "状态标志",
            "byteLength": 1,
            "subFields": [
                { "name": "power", "startBit": 0, "endBit": 0 },
                { "name": "error", "startBit": 1, "endBit": 1 }
            ]
        },
        {
            "type": "Encode",
            "fieldName": "workMode",
            "description": "工作模式",
            "baseType": "unsigned",
            "byteLength": 1,
            "maps": [
                { "value": 0, "meaning": "待机" },
                { "value": 1, "meaning": "运行" }
            ]
        },
        {
            "type": "Struct",
            "fieldName": "header",
            "description": "消息头",
            "fields": [
                { "type": "UnsignedInt", "fieldName": "magic", "byteLength": 2 },
                { "type": "UnsignedInt", "fieldName": "version", "byteLength": 1 }
            ]
        },
        {
            "type": "Array",
            "fieldName": "sensorData",
            "description": "传感器数据",
            "count": 5,
            "element": {
                "type": "Struct",
                "fieldName": "sensorItem",
                "fields": [
                    { "type": "UnsignedInt", "fieldName": "id", "byteLength": 1 },
                    { "type": "SignedInt", "fieldName": "value", "byteLength": 2 }
                ]
            }
        },
        {
            "type": "Command",
            "fieldName": "commandType",
            "description": "命令类型", 
            "baseType": "unsigned",
            "byteLength": 1,
            "cases": {
                "0x01": {
                    "type": "Struct",
                    "fieldName": "readCommand",
                    "fields": [
                        { "type": "UnsignedInt", "fieldName": "registerAddr", "byteLength": 2 }
                    ]
                },
                "0x02": {
                    "type": "Struct",
                    "fieldName": "writeCommand",
                    "fields": [
                        { "type": "UnsignedInt", "fieldName": "registerAddr", "byteLength": 2 },
                        { "type": "UnsignedInt", "fieldName": "value", "byteLength": 2 }
                    ]
                }
            }
        },
        {
            "type": "Padding",
            "fieldName": "alignment",
            "description": "对齐填充",
            "byteLength": 2
        },
        {
            "type": "Reserved",
            "fieldName": "reserved",
            "description": "保留字段",
            "bitLength": 4
        },
        {
            "type": "Checksum",
            "fieldName": "crc",
            "description": "CRC校验",
            "algorithm": "crc16-modbus",
            "byteLength": 2
        }
    ]
}
```

下面是另一个复杂协议的示例：

```json
{
    "name": "AdvancedSensorProtocol",
    "version": "1.0",
    "defaultByteOrder": "little",
    "fields": [
        {
            "type": "Struct",
            "fieldName": "header",
            "fields": [
                { "type": "UnsignedInt", "fieldName": "magic", "byteLength": 2, "defaultValue": 1 },
                { "type": "Reserved", "fieldName": "reserved_bits", "bitLength": 12, "fillValue": "0" },
                { "type": "UnsignedInt", "fieldName": "payloadLength", "byteLength": 20 }
            ]
        },
        {
            "type": "Struct",
            "fieldName": "payload",
            "defaultByteOrder": "big",
            "fields": [
                { "type": "UnsignedInt", "fieldName": "sensorId", "byteLength": 4 },
                { "type": "SignedInt", "fieldName": "temperature", "byteLength": 2, "lsb": 0.1, "unit": "C" },
                { "type": "Padding", "byteLength": 1 },
                { "type": "Timestamp", "byteLength": 4, "unit": "seconds" }
            ]
        },
        {
            "type": "Checksum",
            "fieldName": "crc",
            "algorithm": "crc16-modbus",
            "byteLength": 2,
            "advancedCrc": {
                "rangeStartRef": "header",
                "rangeEndRef": "payload"
            }
        }
    ]
}
```

---

## 协议分发器配置 (Dispatcher Configuration)

### 概述

协议分发器配置用于定义一个协议簇，该协议簇包含多个子协议，并通过 MessageID 字段进行分发。分发器配置文件是一个独立的 JSON 文件，它不定义具体的字段结构，而是定义如何识别和分发到不同的子协议。

**使用场景**：
- 一个连接上可能接收多种不同类型的报文
- 每种报文类型由一个固定位置的 MessageID 字段标识
- 需要根据 MessageID 的值，选择对应的协议解析器

### 配置文件格式

分发器配置文件是一个 JSON 对象，包含以下属性：

#### 根对象属性

- `protocolName`: **分发器名称 (必填)**
  - **描述**: 定义生成的 C++ 分发器类名和命名空间。
  - **值**: 字符串，建议使用 PascalCase 命名。
  - **示例**: `"MyDeviceProtocolDispatcher"`

- `description`: **描述 (可选)**
  - **描述**: 分发器的详细说明，用于文档生成。
  - **值**: 字符串。

- `dispatch`: **分发字段定义 (必填)**
  - **描述**: 定义用于报文分发的 MessageID 字段的位置和类型。
  - **值**: 对象，包含以下属性：
    - `mode`: **分发模式 (必填)**
      - **描述**: 协议分发的工作模式，可选 `"single"` 或 `"multiple"`。
      - **值**: `"single"` 或 `"multiple"`
      - **详解**:
        - `"single"`：表示当前为单协议模式，此时 dispatch 的其他字段（如 `field`、`type`、`byteOrder`、`offset`、`size`）均不生效，分发器作为单一协议处理，且 MessageID 默认为 `0`。
        - `"multiple"`：表示当前为多协议路由模式，此时 dispatch 的其他配置字段均需填写，并生效，用于根据 MessageID 字段进行多子协议分发。
    - `field`: **字段名称 (必填)**
      - **描述**: MessageID 字段在生成代码中的变量名。
      - **值**: 字符串，建议使用 camelCase。
      - **示例**: `"messageId"`, `"msgType"`
    - `type`: **字段类型 (必填)**
      - **描述**: MessageID 字段的数据类型。
      - **值**: `"UnsignedInt"` 或 `"SignedInt"`
      - **限制**: 当前仅支持整数类型
    - `byteOrder`: **字节序 (必填)**
      - **描述**: MessageID 字段的字节序。
      - **值**: `"big"` (大端) 或 `"little"` (小端)
    - `offset`: **偏移量 (必填)**
      - **描述**: MessageID 字段在报文中的起始字节偏移（从0开始）。
      - **值**: 非负整数
      - **示例**: `0` (报文开头), `4` (跳过4字节头部)
    - `size`: **字节长度 (必填)**
      - **描述**: MessageID 字段占用的字节数。
      - **值**: 1, 2, 4, 8
      - **限制**: 必须与 C++ 整数类型对齐（uint8_t, uint16_t, uint32_t, uint64_t）

- `messages`: **报文映射表 (必填)**
  - **描述**: MessageID 值到子协议配置文件的映射关系。
  - **值**: 对象，每个属性的 key 是 MessageID 的字符串表示，value 是对应的协议配置文件路径。
  - **Key 格式**:
    - 十六进制字符串: `"0x0001"`, `"0x00FF"`
    - 十进制字符串（推荐）: `"1"`, `"255"`
  - **Value 格式（三选一）**:
    - 相对路径（相对于分发器配置文件）: `"./protocols/login.json"`
    - 绝对路径: `"/path/to/protocol.json"`
    - 协议配置json：`{单协议json}`
  - **注意**: 所有引用的子协议配置文件必须是有效的单协议配置（标准 protocol.json 格式）

### 完整示例

```json
{
  "protocolName": "MyDeviceProtocolDispatcher",
  "description": "设备通信协议分发器，支持登录、心跳和数据上传三种报文类型",
  "dispatch": {
    "field": "messageId",
    "type": "UnsignedInt",
    "byteOrder": "big",
    "offset": 4,
    "size": 2
  },
  "messages": {
    "0x0001": "./protocols/login_request.json",
    "0x0002": "./protocols/heartbeat.json",
    "0x0003": "./protocols/data_upload.json"
  }
}
```

### 约束和限制

1. **MessageID 位置固定**: 分发器要求所有子协议的 MessageID 字段位置相同（由 `dispatch.offset` 和 `dispatch.size` 定义）
2. **子协议独立性**: 每个子协议配置文件必须是完整的、独立的协议定义
3. **唯一性**: `messages` 中的 MessageID 值不能重复
4. **类型限制**: 当前仅支持整数类型的 MessageID（未来可扩展支持字符串等）
5. **兼容性**: 分发器配置和单协议配置是互斥的，一个 JSON 文件只能是其中一种类型