### 协议数据类型JSON设计方案

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
-   `compression`: **压缩算法 (可选)**
    -   **描述**: 指定用于压缩字符串的算法。
    -   **值**: `"gzip"`, `"zlib"` 等。

```json
{
    "name": "YourProtocolName",
    "description": "这是一个示例协议，用于说明协议数据类型的JSON设计。",
    "version": "1.0",
    "defaultByteOrder": "big",
    "compression": "gzip",
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
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义了数据字段在解析和生成代码时所使用的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **按字节定义长度（必填）**
        -   **描述**: 指定字段占用的字节数。
        -   **值**: 1, 2, 4, 8。
    -   `isMessageId`: **是否为报文标识 (可选)**
        -   **描述**: 标记该字段是否用作识别不同报文类型的ID。
        -   **值**: true 或 false。
    -   `displayFormat`: **显示格式 (可选)**
        -   **描述**: 定义了数值在界面上展示时的格式。
        -   **值**: "decimal" (十进制) 或 "hex" (十六进制)。默认为 "decimal"。
    -   `isReversed`: **是否逆序 (可选)**
        -   **描述**: 指定字节数组或字符串是否需要反向处理。
        -   **值**: true 或 false。默认为 false。
    -   `defaultValue`: **默认值 (可选)**
        -   **描述**: 当数据流中不存在该字段，或在生成数据时提供一个默认值。
        -   **值**: 取决于字段类型。
    -   `maxValue`: **最大值 (可选)**
        -   **描述**: 用于数据校验，确保解析出的值不超过此限制。
        -   **值**: 取决于字段类型。
    -   `minValue`: **最小值 (可选)**
        -   **描述**: 用于数据校验，确保解析出的值不低于此限制。
        -   **值**: 取决于字段类型。
    -   `lsb`: **量纲 (可选)**
        -   **描述**: 最小有效位 (Least Significant Bit) 的物理意义，即比例因子。最终值 = 原始值 * lsb。
        -   **值**: 浮点数。
    -   `unit`: **单位 (可选)**
        -   **描述**: 字段的物理单位。
        -   **值**: 字符串，例如 "V", "A", "°C"。
    -   `validationRegex`: **输入限制表达式 (可选)**
        -   **描述**: 提供一个正则表达式，用于在用户输入时进行格式验证。
        -   **值**: 正则表达式字符串，默认使用 "^[0-9]+$"。
    -   `compression`: **压缩算法 (可选)**
        -   **描述**: 指定用于压缩整数的可变长度编码算法。
        -   **值**: `"varint"`。
    
-   **示例**:

    ```json
    {
        "type": "SignedInt",
        "fieldName": "weight",
        "description": "表示物体的重量",
        "byteLength": 2,
        "isMessageId": false,
        "displayFormat": "decimal",
        "isReversed": true,
        "defaultValue": 500,
        "maxValue": 1000,
        "minValue": 0,
        "lsb": 0.1,
        "unit": "kg",
        "validationRegex": "^[0-9]+$",
        "compression": "varint"
    }
    ```

#### 2. 无符号整数 (UnsignedInt)

结构与 `SignedInt` 完全相同，仅`type`不同。

-   **type**: `"UnsignedInt"`
-   **属性**: (同 `SignedInt`)
-   **示例**:

    ```json
    {
        "type": "UnsignedInt",
        "fieldName": "message_id",
        "description": "表示不同类型的报文",
        "byteLength": 4,
        "isMessageId": true,
        "displayFormat": "hex",
        "isReversed": false,
        "defaultValue": 0,
        "maxValue": 4294967295,
        "minValue": 0,
        "lsb": 1,
        "unit": "",
        "validationRegex": "^[0-9]+$",
        "compression": "varint"
    }
    ```

#### 3. 浮点数 (Float)

-   **type**: `"Float"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `precision`: **数据精度 (必填)**
        -   **描述**: 定义浮点数的精度，决定其字节长度。
        -   **值**: "float" (4字节) 或 "double" (8字节)。
    -   `defaultValue`: **默认值 (可选)**
        -   **描述**: 在生成报文或解析时缺少字段时使用的默认值。
        -   **值**: 浮点数。
    -   `maxValue`: **最大值 (可选)**
        -   **描述**: 用于数据校验，确保值不超过此上限。
        -   **值**: 浮点数。
    -   `minValue`: **最小值 (可选)**
        -   **描述**: 用于数据校验，确保值不低于此下限。
        -   **值**: 浮点数。
    -   `validationRegex`: **输入验证 (可选)**
        -   **描述**: 用于在用户输入时验证格式的正则表达式。
        -   **值**: 正则表达式字符串，默认使用 "^[0-9]+\\.?[0-9]*$"。
-   **示例**:

    ```json
    {
        "type": "Float",
        "fieldName": "voltage",
        "description": "表示电压值",
        "precision": "float",
        "defaultValue": 3.3,
        "maxValue": 5.0,
        "minValue": 0.0,
        "validationRegex": "^[0-9]+\\.?[0-9]*$"
    }
    ```

#### 4. BCD 码 (Bcd)

-   **type**: `"Bcd"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 定义BCD码占用的字节数。
        -   **值**: 1, 2, 4, 8。
    -   `isReversed`: **是否逆序 (可选)**
        -   **描述**: 指定字节数组是否需要反向处理。
        -   **值**: true 或 false。默认为 false。
    -   `defaultValue`: **默认值 (可选)**
        -   **描述**: 在生成报文或解析时缺少字段时使用的默认值。
        -   **值**: BCD字符串。
    -   `maxValue`: **最大值 (可选)**
        -   **描述**: 用于数据校验，确保值不超过此上限。
        -   **值**: BCD字符串。
    -   `minValue`: **最小值 (可选)**
        -   **描述**: 用于数据校验，确保值不低于此下限。
        -   **值**: BCD字符串。
    -   `validationRegex`: **输入验证 (可选)**
        -   **描述**: 用于在用户输入时验证格式的正则表达式。
        -   **值**: 正则表达式字符串，默认使用 "^(0|[1-9][0-9]*)$"。
-   **示例**:

    ```json
    {
        "type": "Bcd",
        "fieldName": "timestamp_bcd",
        "description": "表示时间戳的BCD编码",
        "byteLength": 4,
        "isReversed": true,
        "defaultValue": "000000",
        "maxValue": "999999",
        "minValue": "000000",
        "validationRegex": "^(0|[1-9][0-9]*)$"
    }
    ```

#### 5. 时间戳 (Timestamp)

-   **type**: `"Timestamp"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 定义时间戳占用的字节数，决定了其表示范围。
        -   **值**: 整数，通常为 4 (32位) 或 8 (64位)。
    -   `unit`: **时间单位 (必填)**
        -   **描述**: 定义时间戳的单位，与 `byteLength` 结合确定时间戳的类型。
        -   **值**: `"seconds"` (秒), `"milliseconds"` (毫秒), `"microseconds"` (微秒), `"nanoseconds"` (纳秒),`"day-milliseconds"` (4字节当天毫秒数), `"day-0.1milliseconds"` (4字节当天毫秒数乘10)。
    -   `displayFormat`: **显示格式 (可选)**
        -   **描述**: 定义了在解析之后展示的时间格式。
        -   **值**: 字符串，例如 `"YYYY-MM-DD HH:mm:ss.sss"`。
    -   `compression`: **压缩算法 (可选)**
        -   **描述**: 指定用于压缩时间戳的可变长度编码算法。
        -   **值**: `"varint"`。
-   **示例**:

    ```json
    {
        "type": "Timestamp",
        "fieldName": "event_time",
        "description": "表示事件发生的时间戳",
        "byteLength": 4,
        "unit": "day-milliseconds",
        "displayFormat": "YYYY-MM-DD HH:mm:ss",
        "compression": "varint"
    }
    ```

#### 6. 字符串 (String)

-   **type**: `"String"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `length`: **字段长度 (必填)**
        -   **描述**: 定义字符串占用的字节数。如果为 `0`，表示这是一个变长字符串。
        -   **值**: 整数。
    -   `encoding`: **编码格式 (可选)**
        -   **描述**: 定义字符串的编码格式。
        -   **值**: 字符串，例如 "ASCII", "UTF-8", "GBK"。
    -   `defaultValue`: **默认值 (可选)**
        -   **描述**: 当数据流中不存在该字段，或在生成数据时提供一个默认值。
        -   **值**: 字符串。
    -   `validationRegex`: **输入限制表达式 (可选)**
        -   **描述**: 提供一个正则表达式，用于在用户输入时进行格式验证。
        -   **值**: 正则表达式字符串。
    -   `compression`: **压缩算法 (可选)**
        -   **描述**: 指定用于压缩字符串的算法。
        -   **值**: `"gzip"`, `"zlib"` 等。
-   **示例**:

    ```json
    // 定长字符串
    {
        "type": "String",
        "fieldName": "device_name",
        "description": "表示设备的名称",
        "length": 32,
        "encoding": "GBK",
        "defaultValue": "UnknownDevice",
        "validationRegex": "^[a-zA-Z0-9_\\-]+$",
        "compression": "gzip"
    }
    // 变长字符串
    {
        "type": "String",
        "fieldName": "log_message",
        "description": "表示日志消息",
        "length": 0,
        "encoding": "UTF-8",
        "defaultValue": "",
        "validationRegex": ".*",
        "compression": "zlib"
    }
    ```

#### 7. 位域 (Bitfield)

-   **type**: `"Bitfield"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 定义位域占用的总字节数。
        -   **值**: 整数，例如 1, 2, 4, 8。
    -   `isReversed`: **是否逆序 (可选)**
        -   **描述**: 指定字节数组是否需要反向处理。
        -   **值**: true 或 false。默认为 false。
    -   `subFields`: **子字段 (必填)**
        -   **描述**: 一个数组，定义位域中的每一个位段。
        -   **值**: 子字段对象数组。
        -   **每个位段对象**:
            -   `name`: **位字段名称 (必填)**。
            -   `startBit`: **起始位 (必填)**，从 0 开始计数。
            -   `endBit`: **结束位 (必填)**，包含此位。
            -   `maps`: **值映射 (可选)**，一个数组，用于将位段的数值映射为有意义的字符串。
                -   **每个map对象**: `value` (数值), `meaning` (含义)。
-   **示例**:

    ```json
    {
        "type": "Bitfield",
        "fieldName": "device_status",
        "description": "表示设备的状态",
        "byteLength": 1,
        "isReversed": false,
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

#### 8. 编码 (Encode)

用于定义一个字段，其数值对应着特定的含义。

-   **type**: "Encode"
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义了数据字段在解析和生成代码时所使用的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `baseType`: **基础类型 (必填)**
        -   **描述**: 定义命令字本身的基础整数类型。
        -   **值**: "signed" 或 "unsigned"。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 指定字段占用的字节数。
        -   **值**: 1, 2, 4, 8。
    -   `isReversed`: **是否逆序 (可选)**
        -   **描述**: 指定字节数组是否需要反向处理。
        -   **值**: true 或 false。默认为 false。
    -   `maps`: **值映射表 (必填)**
        -   **描述**: 一个数组，用于定义数值与其对应含义的映射关系。
        -   **值**: 对象数组，每个对象包含：
            -   `value`: 数值。
            -   `meaning`: 字符串，表示该数值的含义。
-   **示例**:

    ```json
    {
        "type": "Encode",
        "fieldName": "work_mode",
        "description": "表示设备的工作模式",
        "baseType": "unsigned",
        "byteLength": 1,
        "isReversed": false,
        "maps": [
            { "value": 0, "meaning": "待机模式" },
            { "value": 1, "meaning": "自动模式" },
            { "value": 2, "meaning": "手动模式" },
            { "value": 10, "meaning": "调试模式" }
        ]
    }
    ```

#### 9. 结构体 (Struct)

对应 `ProtocolItemStruct`。一个简单的容器。

-   **type**: `"Struct"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `fields`: **子字段 (必填)**
        -   **描述**: 定义结构体内部的字段集合。
        -   **值**: 字段对象数组，每个对象遵循本文档定义的字段格式。
    -   `compression`: **压缩算法 (可选)**
        -   **描述**: 指定用于压缩整个结构体序列化后字节流的算法。
        -   **值**: `"gzip"`, `"zlib"` 等。
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
        ],
        "compression": "gzip"
    }
    ```

#### 10. 数组 (Array)

对应 `ProtocolItemArray`。

-   **type**: `"Array"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。    
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   **长度定义 (三选一)**:
        -   `count`: **固定元素个数**
            -   **描述**: 指定数组包含的固定数量的元素。
            -   **值**: 整数。
        -   `countFromField`: **从字段获取元素个数**
            -   **描述**: 指定数组的元素数量由报文中另一个字段的值决定。
            -   **值**: 字符串，表示另一个字段的 `fieldName` 或路径 (例如 `"header.body_length"`)。
        -   `bytesInTrailer`: **尾部数据长度**
            -   **描述**: 指定数组一直持续到报文末尾，并保留指定字节数作为尾部数据。
            -   **值**: 整数。
    -   `element`: **元素定义 (必填)**
        -   **描述**: 定义数组中单个元素的结构。
        -   **值**: 一个字段对象，可以是任何有效的字段类型，如 `SignedInt`, `Struct` 等。
    -   `compression`: **压缩算法 (可选)**
        -   **描述**: 指定用于压缩整个数组序列化后字节流的算法。
        -   **值**: `"gzip"`, `"zlib"` 等。
-   **示例**:

    ```json
    // 定长数组
    {
        "type": "Array",
        "fieldName": "sensor_data",
        "description": "传感器采集到的原始数据",
        "count": 5,
        "element": {
            "type": "Float",
            "fieldName": "reading",
            "precision": "float"
        },
        "compression": "gzip"
    }
    
    // 变长数组
    {
        "type": "Array",
        "fieldName": "user_list",
        "description": "用户列表",
        "countFromField": "packet_header.body_length",
        "element": {
            "type": "Struct",
            "fieldName": "user_info",
            "fields": [
                { "type": "UnsignedInt", "fieldName": "user_id", "byteLength": 4 },
                { "type": "String", "fieldName": "user_name", "length": 32 }
            ]
        },
        "compression": "zlib"
    }
    ```

#### 11. 命令字 (Command)

对应 `ProtocolItemCMD`。

-   **type**: `"Command"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。    
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `baseType`: **基础类型 (必填)**
        -   **描述**: 定义命令字本身的基础整数类型。
        -   **值**: "signed" 或 "unsigned"。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 定义命令字占用的字节数。
        -   **值**: 1, 2, 4, 8。
    -   `isReversed`: **是否逆序 (可选)**
        -   **描述**: 指定字节数组是否需要反向处理。
        -   **值**: true 或 false。默认为 false。
    -   `cases`: **分支定义 (必填)**
        -   **描述**: 定义一个对象，其键是命令字的匹配值，值是该命令对应的后续数据结构。
        -   **值**: 对象，键为字符串形式的数值 (例如 `"0x01"`), 值为字段对象。
-   **示例**:

    ```json
    {
        "type": "Command",
        "fieldName": "command_id",
        "description": "命令标识",  
        "baseType": "unsigned",
        "byteLength": 1,
        "isReversed": false,
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

#### 12. 填充或保留字 (Padding/Reserved)

-   **type**: `"Padding"` 或 `"Reserved"`
-   **属性**:
    -   `fieldName`: **字段名称 (可选)**
        -   **描述**: 为填充或保留字段提供一个名称，便于识别。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   **长度定义 (互斥)**:
        -   `byteLength`: **字节长度**
            -   **描述**: 按字节定义字段的长度。
            -   **值**: 整数。
        -   `bitLength`: **位长度**
            -   **描述**: 按位定义字段的长度。
            -   **值**: 整数。
    -   `fillValue`: **填充值 (可选)**
        -   **描述**: 在生成报文时用于填充该字段的十六进制值。
        -   **值**: 十六进制字符串 (例如 `"00"` 或 `"FF"`)。
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

#### 13. 校验位 (Checksum)（预留）

-   **type**: `"Checksum"`
-   **属性**:
    -   `fieldName`: **字段名称 (必填)**
        -   **描述**: 定义数据字段的唯一标识符。
        -   **值**: 字符串。
    -   `description`: **描述 (可选)**
        -   **描述**: 字段的详细说明，用于解释其作用和含义。
        -   **值**: 字符串。
    -   `algorithm`: **校验算法 (必填)**
        -   **描述**: 指定校验和计算所使用的算法。
        -   **值**: 字符串 (例如 `"crc16-modbus"`, `"crc32"`, `"sum8"`)。
    -   `byteLength`: **字节长度 (必填)**
        -   **描述**: 定义校验和字段本身占用的字节数。
        -   **值**: 整数。
    -   `advancedCrc`: **高级 CRC 参数 (可选)**
        -   **描述**: 包含用于 CRC 计算的高级参数。
        -   **值**: 对象，包含以下属性：
            -   `poly`: **CRC多项式**
                -   **描述**: CRC 计算中使用的多项式。
                -   **值**: 整数 (通常表示为十六进制)，例如 `0x1021`。
            -   `init`: **CRC初始值**
                -   **描述**: CRC 计算开始前的初始值。
                -   **值**: 整数 (通常表示为十六进制)。
            -   `xorOut`: **结果异或值**
                -   **描述**: CRC 计算完成后，与结果进行异或操作的值。
                -   **值**: 整数 (通常表示为十六进制)。
            -   `refIn`: **输入数据反转**
                -   **描述**: 在 CRC 计算前，是否对输入数据的每个字节进行比特反转。
                -   **值**: 布尔值 (`true` 或 `false`)。
            -   `refOut`: **输出数据反转**
                -   **描述**: 在 CRC 计算完成后，是否对最终的 CRC 值进行比特反转。
                -   **值**: 布尔值 (`true` 或 `false`)。
            -   `byteOrder`: **字节序**
                -   **描述**: 指定多字节数据的存储顺序。可覆写容器（如 Struct）的默认字节序。
                -   **值**: `"big"` (大端) 或 `"little"` (小端)。
            -   `rangeStartRef`: **校验范围起始引用**
                -   **描述**: 校验范围的起始字段路径，用于指定 CRC 计算的起始位置。
                -   **值**: 字符串，例如 `"header.magic"`。
            -   `rangeEndRef`: **校验范围结束引用**
                -   **描述**: 校验范围的结束字段路径，用于指定 CRC 计算的结束位置。
                -   **值**: 字符串，例如 `"payload"`。
-   **示例**:
    ```json
    {
        "type": "Checksum",
        "fieldName": "crc",
        "description": "CRC校验",
        "algorithm": "crc16-modbus",
        "byteLength": 2,
        "advancedCrc": {
            "byteOrder": "big",
            "rangeStartRef": "header",
            "rangeEndRef": "payload",
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
    "description": "完整协议示例",
    "version": "1.0",
    "defaultByteOrder": "big",
    "defaultBitOrder": "msb0",
    "compression": "gzip",
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
    "defaultBitOrder": "msb0",
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