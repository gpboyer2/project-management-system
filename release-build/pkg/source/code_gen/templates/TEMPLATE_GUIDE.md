# 代码模板使用指南

## 概述

本文档说明如何使用 `templates/` 目录下的模板文件来生成协议解析和序列化代码。

### 模板文件组织结构

```
templates/
├── primitives/              # 基础类型模板（18个：9解析+9序列化）
│   ├── unsigned_int.cpp.template
│   ├── unsigned_int_serialize.cpp.template
│   ├── signed_int.cpp.template
│   ├── signed_int_serialize.cpp.template
│   ├── message_id.cpp.template
│   ├── message_id_serialize.cpp.template
│   ├── float.cpp.template
│   ├── float_serialize.cpp.template
│   ├── bcd.cpp.template
│   ├── bcd_serialize.cpp.template
│   ├── timestamp.cpp.template
│   ├── timestamp_serialize.cpp.template
│   ├── string.cpp.template
│   ├── string_serialize.cpp.template
│   ├── padding.cpp.template
│   ├── padding_serialize.cpp.template
│   ├── checksum.cpp.template
│   └── checksum_serialize.cpp.template
│
├── composites/              # 复合类型模板（11个）
│   ├── struct.h.template
│   ├── struct_call.cpp.template
│   ├── struct_call_serialize.cpp.template
│   ├── bitfield.cpp.template
│   ├── bitfield_serialize.cpp.template
│   ├── encode.cpp.template
│   ├── encode_serialize.cpp.template
│   ├── array_inline.cpp.template
│   ├── array_serialize_inline.cpp.template
│   ├── command_inline.cpp.template
│   └── command_serialize_inline.cpp.template
│
├── main_parser/             # 主解析器模板（6个：3解析+3序列化）
│   ├── main_parser.h.template
│   ├── main_parser.cpp.template
│   ├── field_call.cpp.template
│   ├── main_serializer_declaration.h.template
│   ├── main_serializer.cpp.template
│   └── field_serialize_call.cpp.template
│
├── dispatcher/              # 分发器模板（2个）
│   ├── dispatcher.h.template
│   └── dispatcher.cpp.template
│
└── TEMPLATE_GUIDE.md        # 本文件
```

**总计**: 37 个模板文件

## 模板语法

模板使用 **Nunjucks** 语法（与 Jinja2 兼容）。本节仅列出本项目模板中 **实际出现且推荐使用** 的语法子集。

### 1. 变量替换与访问

使用双花括号 `{{ variable_name }}` 输出变量值：

```cpp
int64_t {{ field_name }}_raw = 0;
```

支持使用点号访问对象属性，或使用方括号访问数组元素：

```cpp
// 访问 ranges 数组第一个元素的 min 属性
if (raw_val < {{ ranges[0].min }}) { ... }
```

### 2. 变量定义

使用 `{% set var = value %}` 定义或更新局部变量（常用于根据 byte_length 选择 C++ 类型）：

```cpp
{% set cpp_type = "uint64_t" %}
{% if byte_length == 1 %}
{%   set cpp_type = "uint8_t" %}
{% endif %}
```

### 3. 注释

使用 `{# ... #}` 包裹注释内容（不会输出到生成的代码中）：

```cpp
{# 根据 value_type 选择有符号或无符号类型 #}
```

### 4. 条件语句

使用 `{% if condition %}...{% endif %}` 表示条件块，支持 `elif` 和 `else`：

```cpp
{% if has_range %}
// 有范围验证
{% elif has_compress %}
// 有压缩
{% else %}
// 无验证
{% endif %}
```

### 5. 循环语句

使用 `{% for item in array %}...{% endfor %}` 遍历数组：

```cpp
{% for field in fields %}
{{ field.field_cpp_type }} {{ field.field_name }};
{% endfor %}
```

在循环中可以使用 `loop` 变量：
- `loop.last` - 是否最后一次迭代（常用于逗号控制）

```cpp
{% for range in ranges %}
{ {{ range.min }}, {{ range.max }} }{% if not loop.last %},{% endif %}
{% endfor %}
```

### 6. 比较与逻辑运算

仅列出模板中实际使用的运算符：

- **比较**: `==`, `!=`
- **逻辑**: `and`, `not`
- **测试**: `is defined`, `is not none`

```cpp
{% if fill_value and fill_value != "0x00" %}...{% endif %}
{% if message_id_value is defined and message_id_value is not none %}...{% endif %}
```

### 7. 过滤器

仅列出模板中实际使用的过滤器：

- `| default(val)`: 变量未定义或为空时使用默认值
- `| lower`: 转换为小写（如 `{{ protocol_name | lower }}`）
- `| trim`: 去除首尾空白字符
- `| indent(width)`: 缩进指定空格数（用于嵌套代码块对齐）

```cpp
#include "{{ framework_relative_path | default('./') }}protocol_common.h"
{{ field.field_parse_code | trim }}
{{ element_parse_code | indent(8) }}
```

## 模板文件说明

### 基础类型模板（primitives/）

包含 9 种基础类型，每种类型有 2 个模板（解析 + 序列化），共 18 个模板文件。

#### unsigned_int.cpp.template

**用途**: 生成无符号整数解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（1/2/4/8）
- `has_range`: 是否有范围验证（true/false）
- `ranges`: 范围数组，格式: `[{min: 0, max: 100}, ...]`
- `result_struct_type`: 结果结构体的类型名

#### unsigned_int_serialize.cpp.template

**用途**: 生成无符号整数序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（1/2/4/8）

#### signed_int.cpp.template

**用途**: 生成有符号整数解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（1/2/4/8）
- `has_range`: 是否有范围验证（true/false）
- `ranges`: 范围数组，格式: `[{min: -100, max: 100}, ...]`
- `result_struct_type`: 结果结构体的类型名

**示例**:
```json
{
    "field_name": "temperature",
    "byte_length": 2,
    "is_reversed": false,
    "has_range": true,
    "ranges": [
        {"min": -400, "max": 1250}
    ],
    "has_lsb": true,
    "lsb": 0.1
}
```

#### signed_int_serialize.cpp.template

**用途**: 生成有符号整数序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（1/2/4/8）

#### message_id.cpp.template

**用途**: 生成报文标识解析代码（专用于协议分发）

**模板变量**:
- `field_name`: 字段名称
- `is_reversed`: 是否逆序（true/false）
- `message_id_value`: 期望的 MessageId 值（用于验证，可选）
- `has_range`: 是否有范围验证（true/false）
- `is_single_range`: 是否为单范围（true/false）
- `ranges`: 范围数组，格式: `[{min: 0, max: 255}, ...]`

**特性**:
- 基于无符号整数实现
- 支持值匹配验证（用于分发器中验证协议ID）
- 支持多范围验证
- 用于 `dispatcher` 分发器的路由字段

**示例**:
```json
{
    "field_name": "message_id",
    "is_reversed": false,
    "message_id_value": "0x01",
    "has_range": true,
    "is_single_range": true,
    "ranges": [
        {"min": 1, "max": 255}
    ]
}
```

#### message_id_serialize.cpp.template

**用途**: 生成报文标识序列化代码

**模板变量**:
- `field_name`: 字段名称
- `is_reversed`: 是否逆序（true/false）

#### float.cpp.template

**用途**: 生成浮点数解析代码

**模板变量**:
- `field_name`: 字段名称
- `precision`: 精度（"float" 或 "double"）
- `has_range`: 是否有范围验证
- `ranges`: 范围数组

#### float_serialize.cpp.template

**用途**: 生成浮点数序列化代码

**模板变量**:
- `field_name`: 字段名称
- `precision`: 精度（"float" 或 "double"）

#### bcd.cpp.template

**用途**: 生成 BCD 码解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `has_range`: 是否有范围验证
- `ranges`: BCD 字符串范围数组

#### bcd_serialize.cpp.template

**用途**: 生成 BCD 码序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序

#### timestamp.cpp.template

**用途**: 生成时间戳解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `unit`: 时间单位（"seconds"/"milliseconds"/"microseconds"/"nanoseconds"/"day-milliseconds"/"day-0.1milliseconds"）

#### timestamp_serialize.cpp.template

**用途**: 生成时间戳序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `unit`: 时间单位

#### string.cpp.template

**用途**: 生成字符串解析代码

**模板变量**:
- `field_name`: 字段名称
- `length`: 字符串长度（0 表示变长）
- `encoding`: 编码格式（"ASCII"/"UTF-8"/"GBK"）

#### string_serialize.cpp.template

**用途**: 生成字符串序列化代码

**模板变量**:
- `field_name`: 字段名称
- `length`: 字符串长度（0 表示变长）
- `encoding`: 编码格式

#### bitfield.cpp.template

**用途**: 生成位域解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `sub_fields`: 子字段数组，每个元素包含:
  - `name`: 位段名称
  - `start_bit`: 起始位
  - `end_bit`: 结束位
  - `maps`: 值映射（可选），格式: `[{value: 0, meaning: "关闭"}, ...]`

**示例**:
```json
{
    "field_name": "status",
    "byte_length": 1,
    "is_reversed": false,
    "sub_fields": [
        {
            "name": "power",
            "start_bit": 0,
            "end_bit": 0,
            "maps": [
                {"value": 0, "meaning": "关闭"},
                {"value": 1, "meaning": "开启"}
            ]
        }
    ]
}
```

#### bitfield_serialize.cpp.template

**用途**: 生成位域序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `sub_fields`: 子字段数组

#### encode.cpp.template

**用途**: 生成编码值映射解析代码

**模板变量**:
- `field_name`: 字段名称
- `base_type`: 基础类型（"signed" 或 "unsigned"）
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `maps`: 值映射数组，格式: `[{value: 0, meaning: "待机"}, ...]`

#### encode_serialize.cpp.template

**用途**: 生成编码值映射序列化代码

**模板变量**:
- `field_name`: 字段名称
- `base_type`: 基础类型
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `maps`: 值映射数组

#### padding.cpp.template

**用途**: 生成填充/保留字段解析代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（可选）
- `bit_length`: 位长度（可选）

#### padding_serialize.cpp.template

**用途**: 生成填充/保留字段序列化代码

**模板变量**:
- `field_name`: 字段名称
- `byte_length`: 字节长度（可选）
- `bit_length`: 位长度（可选）

#### checksum.cpp.template

**用途**: 生成校验和解析代码

**模板变量**:
- `field_name`: 字段名称
- `algorithm`: 校验算法名称
- `byte_length`: 校验和字节长度
- `start_field`: 校验范围起始字段
- `end_field`: 校验范围结束字段

#### checksum_serialize.cpp.template

**用途**: 生成校验和序列化代码

**模板变量**:
- `field_name`: 字段名称
- `algorithm`: 校验算法名称
- `byte_length`: 校验和字节长度
- `start_field`: 校验范围起始字段
- `end_field`: 校验范围结束字段

### 复合类型模板（composites/）

包含 11 个复合类型模板。

#### struct.h.template

**用途**: 生成结构体定义（头文件内嵌套结构体）

**模板变量**:
- `struct_name`: 结构体名称
- `STRUCT_NAME_UPPER`: 大写的结构体名称
- `fields`: 字段数组，每个元素包含:
  - `field_type`: C++ 类型
  - `field_name`: 字段名称
  - `description`: 字段描述
  - `default_value`: 默认值（可选）

#### struct_call.cpp.template

**用途**: 生成结构体字段解析调用代码

**模板变量**:
- `field_name_capitalized`: 结构体字段名称（首字母大写）
- `description`: 结构体描述
- `has_description`: 是否有描述（true/false）
- `sub_field_calls`: 子字段调用代码数组

#### struct_call_serialize.cpp.template

**用途**: 生成结构体字段序列化调用代码

**模板变量**:
- `field_name_capitalized`: 结构体字段名称（首字母大写）
- `description`: 结构体描述
- `has_description`: 是否有描述（true/false）
- `sub_field_calls`: 子字段调用代码数组

#### array_inline.cpp.template

**用途**: 生成数组解析代码（内联方式）

**模板变量**:
- `field_name`: 字段名称
- `element_type`: 元素类型
- `count_type`: 计数类型（"fixed"/"from_field"/"trailer"）
- `count`: 固定数量（当 count_type 为 "fixed" 时）
- `count_field`: 计数字段名（当 count_type 为 "from_field" 时）
- `trailer_bytes`: 尾部字节数（当 count_type 为 "trailer" 时）
- `element_size`: 元素大小
- `element_parse_code`: 元素解析代码

#### array_serialize_inline.cpp.template

**用途**: 生成数组序列化代码（内联方式）

**模板变量**:
- `field_name`: 字段名称
- `element_type`: 元素类型
- `count_type`: 计数类型
- `count`: 固定数量
- `count_field`: 计数字段名
- `element_serialize_code`: 元素序列化代码

#### command_inline.cpp.template

**用途**: 生成命令字（条件分支）解析代码

**模板变量**:
- `field_name`: 字段名称
- `base_type`: 基础类型（"signed" 或 "unsigned"）
- `byte_length`: 字节长度
- `is_reversed`: 是否逆序
- `cases`: 分支数组，每个元素包含:
  - `value`: 命令值
  - `case_name`: 分支名称
  - `case_parse_code`: 该分支的解析代码

**示例**:
```json
{
    "field_name": "command_id",
    "base_type": "unsigned",
    "byte_length": 1,
    "is_reversed": false,
    "cases": [
        {
            "value": "0x01",
            "case_name": "read_command",
            "case_parse_code": "..."
        },
        {
            "value": "0x02",
            "case_name": "write_command",
            "case_parse_code": "..."
        }
    ]
}
```

#### command_serialize_inline.cpp.template

**用途**: 生成命令字序列化代码

**模板变量**:
- `field_name`: 字段名称
- `base_type`: 基础类型
- `byte_length`: 字节长度
- `cases`: 分支数组

### 主解析器模板（main_parser/）

包含 6 个主解析器模板，分为解析和序列化两部分。

#### main_parser.h.template

**用途**: 生成主解析器头文件

**模板变量**:
- `protocol_name`: 协议名称
- `PROTOCOL_NAME_UPPER`: 大写的协议名称
- `namespace`: 命名空间名称
- `fields`: 顶层字段数组
- `sub_structs`: 嵌套结构体定义数组

**特殊处理**:
- 结果结构体继承自 `MessageBase` 以支持分发器多态

#### main_parser.cpp.template

**用途**: 生成主解析器实现文件

**模板变量**:
- `protocol_name`: 协议名称
- `protocol_version`: 协议版本
- `protocol_description`: 协议描述
- `default_byte_order`: 默认字节序
- `helper_functions`: 辅助函数代码
- `field_calls`: 字段解析调用代码

#### field_call.cpp.template

**用途**: 生成单字段解析调用代码

**模板变量**:
- `field_name`: 字段名称
- `result_prefix`: 结果前缀

#### main_serializer_declaration.h.template

**用途**: 生成序列化函数声明（嵌入头文件）

**模板变量**:
- `protocol_name`: 协议名称

#### main_serializer.cpp.template

**用途**: 生成主序列化器实现

**模板变量**:
- `protocol_name`: 协议名称
- `default_byte_order`: 默认字节序
- `serialize_helper_functions`: 序列化辅助函数
- `serialize_field_calls`: 字段序列化调用

#### field_serialize_call.cpp.template

**用途**: 生成单字段序列化调用代码

**模板变量**:
- `field_name`: 字段名称
- `result_prefix`: 数据前缀

### 分发器模板（dispatcher/）

包含 2 个分发器模板，用于生成多协议路由代码。

#### dispatcher.h.template

**用途**: 生成分发器头文件

**模板变量**:
- `protocol_name`: 分发器名称
- `PROTOCOL_NAME_UPPER`: 大写的分发器名称
- `namespace`: 命名空间名称
- `dispatch_field`: 分发字段名称
- `dispatch_cpp_type`: 分发字段 C++ 类型
- `dispatch_offset`: 分发字段偏移量
- `dispatch_size`: 分发字段大小（字节）
- `dispatch_byte_order`: 分发字段字节序
- `default_byte_order`: 默认字节序枚举值
- `messages`: 子协议信息数组，每个元素包含：
   - `id_value`: MessageID 数值
   - `id_hex`: MessageID 十六进制字符串
   - `enum_name`: 枚举成员名
   - `protocol_name`: 子协议名称
   - `result_type`: 结果结构体类型名
   - `member_name`: 成员名
   - `header_file`: 头文件名

**生成内容**:
- `MessageType` 枚举定义
- `DispatcherResult` 结构体（含 `std::shared_ptr<MessageBase>` 多态存储）
- `as<T>()`, `asShared<T>()`, `hasData()` 辅助方法
- 反序列化/序列化函数声明

#### dispatcher.cpp.template

**用途**: 生成分发器实现文件

**模板变量**:
- 同 dispatcher.h.template

**生成内容**:
- 基于 `dispatch_offset` 和 `dispatch_size` 读取 MessageID
- `switch-case` 路由到对应子协议解析器
- 使用 `std::make_shared<T>()` 创建子协议结果
- 序列化时根据 `messageType` 选择对应序列化器

## 代码生成流程

### 1. 解析 JSON 协议定义

读取 JSON 协议配置文件，解析出所有字段定义。

### 2. 构建字段树

根据字段类型构建解析树，处理嵌套的结构体、数组等。

### 3. 生成字段解析代码

对于每个字段：
1. 根据字段类型选择对应的模板文件
2. 准备模板变量
3. 渲染模板，生成该字段的解析代码

### 4. 组合生成完整解析器

将所有字段的解析代码组合到主解析器模板中，生成最终的 `.h` 和 `.cpp` 文件。

## 示例：生成有符号整数字段

### 输入 JSON:
```json
{
    "type": "SignedInt",
    "fieldName": "temperature",
    "byteLength": 2,
    "isReversed": false,
    "lsb": 0.1,
    "valueRange": [
        {"min": -400, "max": 1250}
    ]
}
```

### 模板变量:
```json
{
    "field_name": "temperature",
    "byte_length": 2,
    "is_reversed": false,
    "has_range": true,
    "ranges": [
        {"min": -400, "max": 1250}
    ],
    "has_lsb": true,
    "lsb": 0.1
}
```

### 生成的代码:
```cpp
{
    int64_t temperature_raw = 0;
    ParseResult result_temperature = parse_signed_int(ctx, temperature_raw, 2, false);

    if (!result_temperature.is_success()) {
        return result_temperature;
    }

    // 范围验证
    std::vector<std::pair<int64_t, int64_t>> ranges_temperature = {
        {-400, 1250}
    };

    if (!validate_range(temperature_raw, ranges_temperature)) {
        return ParseResult(INVALID_VALUE, "temperature value out of range", 0);
    }

    // 应用量纲
    result.temperature = temperature_raw * 0.1;
}
```

## 模板引擎

本项目使用 **Nunjucks** 作为模板引擎：

- **功能强大**: 支持复杂的控制结构、过滤器、宏等
- **Jinja2 兼容**: 与 Python Jinja2 语法基本一致
- **安全**: 默认禁用自动转义（适合代码生成场景）
- **灵活**: 支持自定义过滤器和测试

### Nunjucks 配置

```javascript
import nunjucks from 'nunjucks';

const env = nunjucks.configure(templateDir, {
    autoescape: false,        // 禁用HTML转义（生成C++代码）
    trimBlocks: true,         // 移除块标签后的换行
    lstripBlocks: true        // 去除块标签前的空白
});
```

## 注意事项

1. **变量命名**: 确保生成的变量名不会与 C++ 关键字冲突
2. **类型转换**: 注意 JSON 数值和 C++ 类型之间的转换
3. **代码格式**: 生成的代码应保持一致的缩进和格式
4. **错误处理**: 模板渲染失败时应给出清晰的错误信息
5. **文档注释**: 生成的代码应包含适当的注释
6. **MessageBase 继承**: 所有协议结果结构体必须继承 `MessageBase` 以支持分发器

## 扩展模板

要添加新的数据类型支持：

1. 在 `protocol_parser_framework/protocol_common.h` 中添加解析/序列化辅助函数
2. 在 `templates/primitives/` 或 `templates/composites/` 中创建新模板（解析+序列化）
3. 在 `nodegen/template-manager.js` 中注册新模板映射
4. 在 `nodegen/cpp-impl-generator.js` 和 `nodegen/cpp-serializer-generator.js` 中添加生成逻辑
5. 更新 `json spec.md` JSON 协议定义规范
6. 添加测试配置和测试用例

---

**版本**: 2.1 (新增分发器智能指针多态模板)
**更新日期**: 2025-11-27
