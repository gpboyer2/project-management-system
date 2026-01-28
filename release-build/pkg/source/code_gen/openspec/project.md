# Project Context

## Purpose

**C++ 协议解析与序列化代码生成系统** (Protocol Parser & Serializer Code Generator)

这是一个基于 JSON 协议定义的自动化代码生成系统，能够将 JSON 格式的协议配置文件自动转换为高性能的 C++ 协议解析和序列化代码。

### 核心价值
- **数据驱动**: 通过 JSON 配置驱动代码生成，无需手写解析和序列化逻辑
- **双向转换**: 同时支持解析（二进制→结构体）和序列化（结构体→二进制）
- **高性能**: 生成的代码采用直接函数调用，零分配，编译器友好，易于优化
- **类型安全**: 完整的 C++ 类型系统，编译期检查
- **Tagged Union 分发**: 分发器使用 `enum + union` 实现零堆分配的多协议路由

## Tech Stack

### 代码生成器 (Node.js)
- Node.js >= 18.17 或 >= 20.0
- ES Module (import/export)
- Nunjucks 3.2+ (模板引擎，与 Jinja2 语法兼容)
- Commander.js 12.0+ (CLI 参数解析)
- Ajv 8.12+ (JSON Schema 验证)

### 生成代码 (C++)
- C++11 标准库，无外部依赖
- CMake 3.10+ (可选构建系统)

## Project Conventions

### Code Style

**JavaScript/Node.js**:
- ES Module 语法 (import/export)
- 类名使用 PascalCase (如 `TemplateManager`, `ConfigParser`)
- 函数名使用 camelCase (如 `generateCode`, `parseConfig`)
- 文件名使用 kebab-case (如 `code-generator.js`, `config-parser.js`)

**C++ 生成代码**:
- 函数名使用 snake_case (如 `deserialize_Protocol`, `serialize_Protocol`)
- 结构体名使用 PascalCase (如 `ProtocolResult`, `DeserializeContext`)
- 宏和枚举值使用 UPPER_SNAKE_CASE (如 `PARSE_SUCCESS`, `BUFFER_TOO_SHORT`)
- 字段名使用 camelCase (如 `messageId`, `dataLength`)

**命名规范**:
- 解析函数: `deserialize_<ProtocolName>()`
- 序列化函数: `serialize_<ProtocolName>()`
- 结果结构体: `<ProtocolName>Result`
- 分发器: `<Name>Dispatcher`, `<Name>DispatcherResult`

### Architecture Patterns

**分层架构**:
```
nodegen/                    # 代码生成器层
├── main.js                 # CLI 入口
├── code-generator.js       # 单协议生成器
├── dispatcher-generator.js # 分发器生成器
├── config-parser.js        # JSON 配置解析
└── template-manager.js     # 模板管理

templates/                  # 模板资源层
├── primitives/             # 基础类型模板
├── composites/             # 复合类型模板
├── main_parser/            # 主解析器模板
└── dispatcher/             # 分发器模板

protocol_parser_framework/  # 运行时框架层
├── protocol_common.h       # 通用定义
├── protocol_checksum.h     # 校验和算法
└── protocol_timestamp.h    # 时间戳转换
```

**核心设计模式**:
- **模板方法模式**: Nunjucks 模板驱动代码生成
- **Tagged Union**: 分发器使用 enum + union 实现零堆分配路由
- **递归 DFS**: 嵌套结构体通过深度优先遍历生成

### Testing Strategy

**测试配置**:
- 位于 `tests/configs/` 目录
- 覆盖 25+ 种类型测试（基础类型、复合类型、校验和、分发器等）

**C++ 测试运行器**:
- 位于 `tests/test_runner/`
- 使用 CMake 构建
- 每个测试验证解析和序列化的正确性

**测试流程**:
1. 修改 JSON 配置或模板
2. 运行代码生成器生成 C++ 代码
3. 编译并运行 C++ 测试验证正确性

### Git Workflow

- 主分支: `master`
- 提交信息使用中文描述变更内容
- 提交前确保代码生成器可正常运行

## Domain Context

### 协议解析领域知识

**字节序 (Byte Order)**:
- 大端序 (Big Endian): 高位字节在前，网络协议常用
- 小端序 (Little Endian): 低位字节在前，x86 架构默认

**常见协议字段类型**:
- MessageId: 报文标识，用于区分不同协议类型
- Checksum: 校验和，用于数据完整性验证
- Timestamp: 时间戳，多种单位（秒/毫秒/微秒/纳秒）
- BCD: 压缩十进制，常见于工业协议
- Bitfield: 位域，多个标志位打包在一个字节中

**分发器 (Dispatcher)**:
- 根据 MessageId 路由到对应的协议解析器
- Tagged Union 架构实现零堆分配

## Important Constraints

### 技术约束
- 生成的 C++ 代码必须兼容 C++11 标准
- 不依赖外部库，仅使用标准库
- 零堆分配设计（分发器使用 Tagged Union）

### 性能要求
- 解析/序列化函数必须是直接调用，无虚函数开销
- 内存占用确定，适合嵌入式环境

### 兼容性要求
- Node.js >= 18.17 或 >= 20.0
- 跨平台：Windows、Linux、macOS

## External Dependencies

### Node.js 依赖
| 包名 | 版本 | 用途 |
|------|------|------|
| nunjucks | ^3.2.0 | 模板引擎 |
| commander | ^12.0.0 | CLI 参数解析 |
| ajv | ^8.12.0 | JSON Schema 验证 |

### 无外部运行时依赖
生成的 C++ 代码仅依赖 C++11 标准库，无需任何外部库。
