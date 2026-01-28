# C++ 协议解析与序列化代码生成系统

## 项目简介

基于 JSON 协议定义的 C++ 代码生成系统。输入 JSON 配置文件,自动生成高性能的 C++ 协议解析和序列化代码。

当前作为 [cssc-node-view](https://gitee.com/alphasinger/cssc-node-view/tree/develop/) 项目的子项目。

## 核心特性

- **双向转换**: 自动生成解析（二进制→结构体）和序列化（结构体→二进制）代码
- **模块化设计**: 框架层与生成层分离,易于维护和扩展
- **高性能**: 生成的代码直接使用函数调用,编译器友好,易于内联优化,零分配
- **数据驱动**: 解析和序列化逻辑完全由 JSON 配置驱动,无需手写代码
- **类型丰富**: 支持 10 种基础类型 + 6 种复合类型(详见下文)
- **协议分发**: 支持多协议分发器生成,使用智能指针多态实现自动路由
- **多层级架构**: 支持软件→通信节点→图元→协议的完整层级结构
- **C++11 标准**: 符合 C++11 标准,无第三方依赖

## 支持的配置类型

| 配置类型 | 适用场景 | 顶层字段特征 | 输出结构 |
|---------|---------|------------|---------|
| **单协议** | 单一固定格式的协议 | `name`, `fields` | 1个 .h + 1个 .cpp |
| **分发器** | 多种报文类型的协议簇 | `protocolName`, `dispatch`, `messages` | 1个分发器 + N个子协议 |
| **软件配置** | 完整软件系统，多层级结构 | `softwareName`, `commNodeList` | 多层目录 + 接口聚合 |

## 目录结构

```
code_gen_test/
│
├── protocol_parser_framework/         # 框架层:协议无关的通用代码
│   ├── protocol_common.h              # MessageBase/DeserializeResult/SerializeResult/Context/辅助函数
│   ├── protocol_checksum.h            # 校验和算法(Sum/XOR/CRC系列)
│   └── protocol_timestamp.h           # 时间戳单位转换函数
│
├── templates/                         # 模板资源
│   ├── primitives/                    # 基础类型模板(18种:9解析+9序列化)
│   ├── composites/                    # 复合类型模板(11种:含bitfield/encode/array/command/struct)
│   ├── main_parser/                   # 主解析器模板(6种:3解析+3序列化)
│   ├── dispatcher/                    # 分发器模板(2种)
│   └── TEMPLATE_GUIDE.md              # 模板开发指南
│
├── nodegen/                           # Node.js 代码生成器
│   ├── main.js                        # CLI 入口
│   ├── code-generator.js              # 单协议生成器
│   ├── cpp-serializer-generator.js    # 序列化代码生成器
│   ├── dispatcher-generator.js        # 分发器生成器
│   ├── dispatcher-analyzer.js         # 分发器配置分析器（从多个单协议自动生成dispatcher配置）
│   ├── config-parser.js               # JSON 配置解析
│   ├── template-manager.js            # Nunjucks 模板管理
│   ├── cpp-header-generator.js        # C++ 头文件生成
│   ├── cpp-impl-generator.js          # C++ 实现文件生成
│   ├── checksum_registry.js           # 校验算法注册表
│   ├── timestamp-registry.js          # 时间戳单位注册表
│   ├── package.json                   # npm 项目配置
│   └── README.md                      # 详细使用说明
│
├── tests/
│   ├── configs/                       # 协议测试配置(25+种)
│   │   ├── dispatcher_test/           # 分发器测试配置1(offset=0)
│   │   └── dispatcher_test2/          # 分发器测试配置2(offset=6)
│   ├── generated/                     # 生成的C++代码(按类型分目录)
│   └── test_runner/                   # C++测试运行器(CMake工程)
│
├── README.md                          # 本文件
├── CLAUDE.md                          # AI 上下文文档
└── json spec.md                       # JSON 配置格式规范
```

## 支持的数据类型

| 类型分类 | 类型名称 | 说明 |
|---------|---------|------|
| **基础类型** | UnsignedInt | 无符号整数(1/2/4/8字节),支持字节序、LSB缩放、范围验证 |
| | SignedInt | 有符号整数(1/2/4/8字节),支持补码表示 |
| | MessageId | 报文标识(1/2/4/8字节),用于协议分发,支持值匹配验证 |
| | Float | 浮点数(4/8字节),支持 float/double |
| | Bcd | BCD 编码,压缩十进制表示 |
| | Timestamp | 时间戳,支持秒/毫秒/微秒/纳秒/当天毫秒等多种单位 |
| | String | 字符串,支持定长/变长、ASCII/UTF-8/GBK编码 |
| | Padding | 填充字段,跳过指定字节数 |
| | Reserved | 保留字段(Padding别名) |
| | Checksum | 校验和,支持Sum8/16/32、XOR8、CRC8/16/32 |
| **复合类型** | Bitfield | 位域,支持子字段提取和值映射 |
| | Encode | 编码映射,字节数组到枚举值映射 |
| | Bytes | 编码映射(Encode别名) |
| | Struct | 嵌套结构体,递归解析/序列化 |
| | Array | 数组,支持固定长度/动态长度(基于前置长度字段) |
| | Command | 命令字分支,根据命令值路由到不同协议处理 |

## 快速开始

### 1. 安装依赖

```bash
cd nodegen
npm install
```

### 2. 生成协议代码

```bash
# 基础用法:从JSON配置生成C++代码(解析+序列化)
node main.js <config.json>

# 指定输出目录
node main.js <config.json> -o ./output

# 示例:生成无符号整数测试协议（单协议模式）
node main.js ../tests/configs/test_unsigned_int.json \
  -o ../tests/generated/unsigned_int

# 示例:生成分发器协议（分发器模式）
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json \
  -o ../tests/generated/dispatcher2

# 示例:生成完整软件配置（多层级模式）
node main.js ../tests/configs/test_software.json \
  -o ../tests/generated/software_test
```

### 3. 使用生成的代码

#### 解析报文

```cpp
#include "testunsignedintprotocol_parser.h"

int main() {
    // 准备二进制数据
    uint8_t data[] = { 0x12, 0x34 };  // deviceId = 0x1234

    // 反序列化协议（二进制 → 结构体）
    protocol_parser::TestUnsignedIntProtocolResult result;
    auto parse_result = protocol_parser::deserialize_TestUnsignedIntProtocol(
        data, sizeof(data), result
    );

    // 检查结果
    if (parse_result.is_success()) {
        std::cout << "Device ID: " << result.deviceId << std::endl;
    } else {
        std::cerr << "Parse error: " << parse_result.error_message << std::endl;
        return 1;
    }

    return 0;
}
```

#### 序列化报文

```cpp
#include "testunsignedintprotocol_parser.h"

int main() {
    // 准备数据结构
    protocol_parser::TestUnsignedIntProtocolResult data;
    data.deviceId = 0x1234;
    // ... 设置其他字段

    // 序列化为二进制
    uint8_t buffer[1024];
    auto serialize_result = protocol_parser::serialize_TestUnsignedIntProtocol(
        data, buffer, sizeof(buffer)
    );

    // 检查结果
    if (serialize_result.is_success()) {
        std::cout << "序列化成功,字节数: " << serialize_result.bytes_written << std::endl;
        // 使用 buffer 发送数据...
    } else {
        std::cerr << "Serialize error: " << serialize_result.error_message << std::endl;
        return 1;
    }

    return 0;
}
```

#### 使用分发器

```cpp
#include "iotprotocol_dispatcher.h"

int main() {
    // 准备包含 MessageID 的报文数据
    uint8_t data[] = {
        0x55, 0xAA, 0x55, 0xAA,  // syncWord
        0x00, 0x1C,              // packetLength
        0x01, 0x00,              // messageId = 0x0100 (SensorData)
        // ... 后续字段
    };

    // 分发器自动识别报文类型并解析
    protocol_parser::IotProtocolDispatcherResult result;
    auto parse_result = protocol_parser::deserialize_IotProtocolDispatcher(
        data, sizeof(data), result
    );

    if (parse_result.is_success()) {
        // 根据报文类型处理
        switch (result.messageType) {
            case protocol_parser::MSG_SENSOR_DATA:
                // 使用 as<T>() 获取具体类型指针
                auto sensor = result.as<protocol_parser::SensorDataResult>();
                std::cout << "Sensor ID: " << sensor->sensorId << std::endl;
                std::cout << "Temperature: " << sensor->temperature << std::endl;
                break;
            // ... 其他类型
        }
    }

    return 0;
}
```

#### 往返转换验证

```cpp
// 完整的往返测试：deserialize → serialize → deserialize
uint8_t original[] = { 0x12, 0x34, /* ... */ };

// 1. 反序列化（二进制 → 结构体）
TestUnsignedIntProtocolResult data;
deserialize_TestUnsignedIntProtocol(original, sizeof(original), data);

// 2. 序列化（结构体 → 二进制）
uint8_t buffer[1024];
auto ser_result = serialize_TestUnsignedIntProtocol(data, buffer, sizeof(buffer));

// 3. 再次反序列化验证
TestUnsignedIntProtocolResult data2;
deserialize_TestUnsignedIntProtocol(buffer, ser_result.bytes_written, data2);

// 4. 验证字节级精确匹配
assert(memcmp(original, buffer, sizeof(original)) == 0);
```

## 使用方式

代码生成系统支持三种使用方式，适应不同的使用场景：

### 方式一：文件模式（CLI）

适用于本地开发、手动测试、配置文件存储在文件系统的场景。

```bash
# 单协议配置
node main.js config.json -o ./output

# 分发器配置（支持子协议路径引用，自动加载）
node main.js dispatcher.json -o ./output
```

**特点**：
- 分发器配置中的 `messages` 可以使用路径引用，CLI 会自动加载子协议文件
- 路径相对于主配置文件所在目录

**分发器配置示例（路径引用模式）**：
```json
{
    "protocolName": "DeviceProtocol",
    "dispatch": { "field": "messageId", "type": "UnsignedInt", "byteOrder": "big", "offset": 0, "size": 2 },
    "messages": {
        "1": "./login_request.json",
        "2": "./heartbeat.json"
    }
}
```

### 方式二：JSON 字符串模式（CLI）

适用于 CI/CD 流水线、Shell 脚本调用、配置存储在数据库的场景。

```bash
# 单协议配置 - 直接传入 JSON 字符串
node main.js --json '{"name": "Test", "fields": [...]}' -o ./output

# 分发器配置（要求所有子协议内联）
node main.js --json '{"protocolName": "MyDispatcher", "dispatch": {...}, "messages": {"1": {...}}}' -o ./output

# 从标准输入读取 JSON（使用 "-" 符号）
# Linux/macOS:
cat config.json | node main.js --json - -o ./output

# PowerShell:
Get-Content config.json -Raw | node main.js --json - -o ./output

# 也可以结合其他命令使用管道
curl -s https://api.example.com/protocol/config | node main.js --json - -o ./output
```

**特点**：
- 使用 `--json` 或 `-j` 选项传入 JSON 字符串
- 使用 `--json -` 从标准输入（STDIN）读取 JSON，支持管道操作
- 与文件路径参数互斥，不能同时使用
- 分发器配置要求所有子协议都是内联格式，不支持路径引用

**分发器配置示例（内联模式）**：
```json
{
    "protocolName": "DeviceProtocol",
    "dispatch": { "field": "messageId", "type": "UnsignedInt", "byteOrder": "big", "offset": 0, "size": 2 },
    "messages": {
        "1": {
            "name": "LoginRequest",
            "fields": [...]
        },
        "2": {
            "name": "Heartbeat",
            "fields": [...]
        }
    }
}
```

### 方式三：Node.js 模块导入

适用于 Node.js 后端服务直接调用，无需启动子进程，性能最优。

```javascript
import { CodeGenerator } from './nodegen/code-generator.js';
import { DispatcherGenerator } from './nodegen/dispatcher-generator.js';
import { parseConfigObject } from './nodegen/config-parser.js';

// ============================================================
// 单协议生成
// ============================================================
const protocolConfig = {
    name: "LoginRequest",
    version: "1.0",
    defaultByteOrder: "big",
    fields: [
        { type: "UnsignedInt", fieldName: "userId", byteLength: 4 },
        { type: "String", fieldName: "username", length: 32, encoding: "UTF-8" }
    ]
};

// 解析并验证配置
const { config } = parseConfigObject(protocolConfig);

// 创建生成器并生成代码
const generator = new CodeGenerator(config, { /* options */ });
await generator.generateFiles('./output');

// ============================================================
// 分发器生成（内联模式）
// ============================================================
const dispatcherConfig = {
    protocolName: "DeviceProtocol",
    dispatch: { field: "messageId", type: "UnsignedInt", byteOrder: "big", offset: 0, size: 2 },
    messages: {
        "1": { name: "LoginRequest", fields: [...] },
        "2": { name: "Heartbeat", fields: [...] }
    }
};

// 解析并验证配置
const { config: dispConfig } = parseConfigObject(dispatcherConfig);

// 创建生成器并生成代码
const dispatcherGenerator = new DispatcherGenerator(dispConfig, { /* options */ });
await dispatcherGenerator.generateFiles('./output');
```

**导出的类和函数**：

| 模块 | 导出 | 说明 |
|------|------|------|
| `config-parser.js` | `parseConfigObject(obj)` | 解析并验证配置对象，返回 `{ kind, config }` |
| `config-parser.js` | `ProtocolConfig` | 单协议配置类 |
| `config-parser.js` | `DispatcherConfig` | 分发器配置类 |
| `code-generator.js` | `CodeGenerator` | 单协议代码生成器 |
| `dispatcher-generator.js` | `DispatcherGenerator` | 分发器代码生成器 |

**Generator 构造函数参数**：

```javascript
// CodeGenerator
new CodeGenerator(config, options)
// - config: ProtocolConfig 实例
// - options.templateDir: 模板目录路径（可选）
// - options.frameworkSrc: 框架头文件路径（可选）

// DispatcherGenerator
new DispatcherGenerator(config, options)
// - config: DispatcherConfig 实例（要求子协议已内联）
// - options.templateDir: 模板目录路径（可选）
// - options.frameworkSrc: 框架头文件路径（可选）
```

## 命令行选项

```bash
node main.js [config-file] [选项]

参数:
  config-file                JSON 配置文件路径（与 --json 选项互斥）

选项:
  -j, --json <json-string>   JSON 配置字符串（与文件路径参数互斥）
  -o, --output <dir>         输出目录(默认: ./generated_code)
  -s, --summary-only         仅显示配置摘要,不生成文件
  -v, --verbose              显示详细信息
  --log-output <mode>        日志输出模式: console, file, both (默认: console)
  --log-file <path>          日志文件路径 (当模式为 file/both 时生效, 默认: nodegen.log)
  --log-level <level>        日志级别 (error/warn/info/debug)
  --template-dir <dir>       覆盖默认模板目录
  --framework-src <path>     覆盖默认框架头文件路径（需指向具体文件）
  --language <lang>          目标语言标准 (cpp11, python; 默认: cpp11)
  --platform <platform>      目标平台 (目前仅支持 linux-x86_64, 默认: linux-x86_64)
  --cpp-sdk                  生成 C++ SDK (默认启用)
  --no-cpp-sdk               禁用 C++ SDK 生成 (暂不支持)
  -h, --help                 显示帮助信息
```

## 技术架构

### 代码生成器 (nodegen/)

| 模块 | 职责 |
|------|------|
| main.js | CLI 入口,参数解析,流程控制 |
| code-generator.js | 单协议生成器 |
| cpp-serializer-generator.js | 序列化代码生成器 |
| dispatcher-generator.js | 分发器生成器(智能指针多态) |
| dispatcher-analyzer.js | 分发器配置分析器(从多个单协议自动生成dispatcher配置) |
| software-processor.js | 软件配置处理器(多层级结构) |
| config-parser.js | JSON 解析和验证 |
| template-manager.js | Nunjucks 模板管理 |
| cpp-header-generator.js | C++ 头文件生成 |
| cpp-impl-generator.js | C++ 实现文件生成 |
| checksum_registry.js | 校验算法注册表(Sum/XOR/CRC) |
| timestamp-registry.js | 时间戳单位注册表 |

**技术栈**:
- Node.js >= 18.17 (ES Module)
- Nunjucks 3.2+ (模板引擎)
- Commander.js 12.0+ (CLI 框架)
- Ajv 8.12+ (JSON Schema 验证)

### 框架层 (protocol_parser_framework/)

**protocol_common.h** - 协议无关的通用定义:

**多态支持**:
- `MessageBase` 抽象基类: 所有协议结果结构体的公共基类,支持分发器中的多态存储

**反序列化支持**（二进制 → 结构体）:
- `ParseError` 枚举:错误码(SUCCESS, INSUFFICIENT_DATA, INVALID_VALUE等)
- `ByteOrder` 枚举:字节序(BIG_ENDIAN, LITTLE_ENDIAN)
- `DeserializeResult` 结构:反序列化结果(错误码、消息、已消费字节数)
- `DeserializeContext` 结构:反序列化上下文(数据指针、偏移、长度、字节序)
- `read_with_byte_order<T>()`: 字节序读取

**序列化支持**（结构体 → 二进制）:
- `SerializeResult` 结构:序列化结果(错误码、消息、已写字节数)
- `SerializeContext` 结构:序列化上下文(缓冲区、偏移、最大长度、字节序)
- `write_with_byte_order<T>()`: 字节序写入

**protocol_checksum.h** - 校验和算法:
- `Checksum_Sum` 类:累加和校验(8/16/32位)
- `Checksum_XOR` 类:异或校验(8位)
- `Checksum_CRC<T>` 模板类:CRC校验(8/16/32位,支持自定义多项式)

**protocol_timestamp.h** - 时间戳单位转换:
- 秒/毫秒/微秒/纳秒与内部纳秒表示的双向转换
- 当天毫秒数(day-milliseconds)等特殊格式支持

### 模板系统 (templates/)

- **基础类型模板**(primitives/, 18个):
  - 9个解析模板: unsigned_int, signed_int, message_id, float, bcd, timestamp, string, padding, checksum
  - 9个序列化模板: *_serialize.cpp.template

- **复合类型模板**(composites/, 11个):
  - struct.h, struct_call, struct_call_serialize
  - bitfield, bitfield_serialize
  - encode, encode_serialize
  - array_inline, array_serialize_inline
  - command_inline, command_serialize_inline

- **主解析器模板**(main_parser/, 6个):
  - 3个解析: main_parser.h, main_parser.cpp, field_call
  - 3个序列化: main_serializer_declaration.h, main_serializer.cpp, field_serialize_call

- **分发器模板**(dispatcher/, 2个): dispatcher.h, dispatcher.cpp

**总计**: 37 个模板文件

## JSON 配置格式

详细配置规范见 [json spec.md](json%20spec.md)

简单示例:

```json
{
    "name": "SimpleProtocol",
    "version": "1.0",
    "description": "简单协议示例",
    "defaultByteOrder": "big",
    "fields": [
        {
            "type": "UnsignedInt",
            "fieldName": "deviceId",
            "byteLength": 2,
            "description": "设备ID"
        },
        {
            "type": "SignedInt",
            "fieldName": "temperature",
            "byteLength": 2,
            "lsbValue": 0.1,
            "description": "温度(单位:0.1°C)"
        }
    ]
}
```

分发器配置示例:

```json
{
    "protocolName": "IotProtocol",
    "description": "IoT设备通信协议分发器",
    "dispatch": {
        "field": "messageId",
        "type": "UnsignedInt",
        "byteOrder": "big",
        "offset": 6,
        "size": 2
    },
    "messages": {
        "0x0100": "./sensor_data.json",
        "0x0101": "./device_status.json",
        "0x0102": "./config_update.json"
    }
}
```

## 生成的代码结构

### 单协议模式

```
output/
├── <protocol>_parser.h           # 头文件
│   ├── 结构体定义(继承 MessageBase)
│   ├── deserialize_<Protocol>() 声明
│   └── serialize_<Protocol>() 声明
│
├── <protocol>_parser.cpp         # 实现文件
│   ├── 解析辅助函数
│   ├── deserialize_<Protocol>() 实现
│   ├── 序列化辅助函数
│   └── serialize_<Protocol>() 实现
│
└── protocol_parser_framework/
    ├── protocol_common.h         # 框架层(自动复制)
    ├── protocol_checksum.h       # 校验和算法(按需复制)
    └── protocol_timestamp.h      # 时间戳函数(按需复制)
```

### 分发器模式

```
output/
├── <dispatcher>_dispatcher.h     # 分发器头文件
│   ├── MessageType 枚举
│   ├── DispatcherResult 结构体(含 shared_ptr<MessageBase>)
│   └── deserialize/serialize 函数声明
│
├── <dispatcher>_dispatcher.cpp   # 分发器实现
│   └── 基于 MessageID 的路由逻辑
│
├── <subprotocol1>_parser.h/cpp   # 子协议1
├── <subprotocol2>_parser.h/cpp   # 子协议2
│
└── protocol_parser_framework/
    └── protocol_common.h
```

### 软件配置模式（多层级）

```
output/{softwareName}/
├── protocol_parser_framework/        # 共享框架（软件级）
│   ├── protocol_common.h
│   ├── protocol_checksum.h
│   └── protocol_timestamp.h
│
├── {softwareName}_interface.h        # 软件级接口聚合文件
│                                     # 包含所有通信节点和图元的头文件
│
├── {commNode1.id}/                   # 通信节点1目录
│   ├── {node1.id}/                   # 图元1目录
│   │   ├── xxx_dispatcher.h          # 分发器头文件(dispatch.mode=multiple)
│   │   ├── xxx_dispatcher.cpp        # 分发器实现
│   │   ├── sub1_parser.h/cpp         # 子协议1
│   │   └── sub2_parser.h/cpp         # 子协议2
│   │
│   └── {node2.id}/                   # 图元2目录
│       ├── xxx_parser.h              # 单协议头文件(dispatch.mode=single)
│       └── xxx_parser.cpp            # 单协议实现
│
└── {commNode2.id}/                   # 通信节点2目录
    └── {node3.id}/                   # 图元3目录
        ├── xxx_parser.h
        └── xxx_parser.cpp
```

**关键特性**:
- **框架共享**: 所有 `protocol_parser_framework` 文件放在软件根目录，避免重复
- **动态路径**: 生成的代码会根据所在目录自动计算相对路径来引用框架文件
- **层级清晰**: 软件→通信节点→图元→协议的目录结构清晰可见
- **接口聚合**: `{softwareName}_interface.h` 提供统一入口，包含所有生成的头文件

## 参考文档

- [nodegen/README.md](nodegen/README.md) - 代码生成器详细使用说明
- [json spec.md](json%20spec.md) - JSON 配置格式完整规范
- [templates/TEMPLATE_GUIDE.md](templates/TEMPLATE_GUIDE.md) - 模板开发指南
- [CLAUDE.md](CLAUDE.md) - AI 上下文文档
- [tests/test_runner/README.md](tests/test_runner/README.md) - 测试套件说明
- [tests/configs/README.md](tests/configs/README.md) - 配置文件说明

## 许可证

MIT License

---

**版本**: 2.2 (新增分发器智能指针多态架构)
**最后更新**: 2025-11-27
