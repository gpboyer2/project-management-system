# 协议解析两阶段重构 - 实施计划

> 基于 `2026-01-20-protocol-parsing-refactor-design.md` 设计方案的详细实施计划

## 一、头文件生成器重构 (`nodegen/cpp-header-generator.js`)

### 1.1 新增方法：`_generateRawFieldContext()`

**职责**：为 Raw 结构体准备字段上下文

**逻辑**：
- 遍历所有字段（包括 Padding/Reserved）
- Padding/Reserved 使用索引命名：`padding_0`, `padding_1`, `reserved_0`...
- Bitfield 类型生成原始整数字段（如 `uint32_t status_raw`）
- 不生成 `_valid` 标志字段
- 递归处理嵌套 Struct，生成对应的 `_Raw` 版本

### 1.2 新增方法：`_generateRawSubStructs()`

**职责**：为嵌套的 Struct 类型递归生成 `_Raw` 版本

### 1.3 修改方法：`_prepareMainFieldContext()`

**修改内容**：
- 对于有 `validWhen` 配置的字段，标记 `has_valid_when: true`
- 在 Business 结构体中为这些字段额外生成 `{field_name}_valid` 布尔字段

### 1.4 修改方法：`generate()`

**修改内容**：
- 新增 Padding/Reserved 索引计数器
- 准备 Raw 层上下文变量
- 传递给模板渲染

### 1.5 模板上下文扩展

新增模板变量：
- `raw_structs`: Raw 层嵌套结构体定义数组
- `raw_fields`: Raw 层顶层字段数组
- `has_valid_when_fields`: 是否有 validWhen 字段

---

## 二、头文件模板修改 (`templates/main_parser/main_parser.h.template`)

### 2.1 结构调整

在现有结构前添加：
1. Raw 层嵌套结构体定义（`{% for raw_struct in raw_structs %}`）
2. `{Protocol}_Raw` 主结构体定义
3. `parse_from()` 和 `serialize_to()` 方法声明

### 2.2 Business 结构体修改

- 为有 `validWhen` 的字段添加 `{field_name}_valid` 成员
- 添加 `from_raw()` 静态方法声明
- 添加 `to_raw()` 方法声明

---

## 三、实现文件生成器重构 (`nodegen/cpp-impl-generator.js`)

### 3.1 新增方法：`_generateRawFieldParseCalls()`

**职责**：生成 `parse_from()` 方法中的字段解析代码

**逻辑**：
- 无条件解析所有字段（移除 validWhen 条件判断）
- 不执行 valueRange 校验
- 不执行单位转换
- Bitfield 保持原始整数值

### 3.2 新增方法：`_generateFromRawFieldConversions()`

**职责**：生成 `from_raw()` 静态方法实现

**逻辑**：
- 处理 validWhen 条件，设置 `_valid` 标志
- 执行 valueRange 校验
- 执行单位转换（Float 精度、Timestamp 等）
- 执行 Bitfield 解包
- 执行 Encode 映射

### 3.3 修改方法：`generate()`

**修改内容**：
- 准备 Raw 解析上下文
- 准备 from_raw 转换上下文
- 修改 Facade 函数上下文

---

## 四、实现文件模板修改 (`templates/main_parser/main_parser.cpp.template`)

### 4.1 新增模板段落

1. `{Protocol}_Raw::parse_from()` 实现
2. `{Protocol}Result::from_raw()` 实现
3. Facade 函数实现（两阶段调用）

---

## 五、序列化器生成器重构 (`nodegen/cpp-serializer-generator.js`)

### 5.1 新增方法：`_generateRawFieldSerializeCalls()`

**职责**：生成 `serialize_to()` 方法中的字段序列化代码

**逻辑**：
- 无条件序列化所有字段（包括 Padding）
- 不执行逆向单位转换
- Bitfield 直接写入原始整数值

### 5.2 新增方法：`_generateToRawFieldConversions()`

**职责**：生成 `to_raw()` 方法实现

**逻辑**：
- 执行逆向单位转换
- 执行 Bitfield 打包
- Padding 字段填充默认值（0 或 fillValue）
- 根据 `_valid` 标志处理可选字段

### 5.3 修改方法：`generate()`

**修改内容**：
- 准备 Raw 序列化上下文
- 准备 to_raw 转换上下文
- 修改 Facade 函数上下文

---

## 六、序列化器模板修改 (`templates/main_parser/main_serializer.cpp.template`)

### 6.1 新增模板段落

1. `{Protocol}_Raw::serialize_to()` 实现
2. `{Protocol}Result::to_raw()` 实现
3. Facade 函数实现（两阶段调用）

---

## 七、嵌套结构体模板修改 (`templates/composites/struct.h.template`)

### 7.1 新增 Raw 版本模板段落

为嵌套 Struct 生成对应的 `_Raw` 结构体定义

---

## 实施清单

### 阶段 1：头文件生成器重构

| 序号 | 文件 | 操作 | 描述 |
|------|------|------|------|
| 1 | `cpp-header-generator.js` | 新增 | Padding/Reserved 索引计数器 `_paddingIndex` 和 `_reservedIndex` |
| 2 | `cpp-header-generator.js` | 新增 | 方法 `_generateRawFieldContext()` 为 Raw 结构体准备字段上下文 |
| 3 | `cpp-header-generator.js` | 新增 | 方法 `_generateRawSubStructs()` 递归生成嵌套 Raw 结构体 |
| 4 | `cpp-header-generator.js` | 修改 | `_prepareMainFieldContext()` 添加 `has_valid_when` 标记 |
| 5 | `cpp-header-generator.js` | 修改 | `generate()` 方法，准备 Raw 层上下文变量 |
| 6 | `main_parser.h.template` | 新增 | Raw 嵌套结构体渲染段落 |
| 7 | `main_parser.h.template` | 新增 | `{Protocol}_Raw` 主结构体渲染段落 |
| 8 | `main_parser.h.template` | 新增 | `parse_from()` / `serialize_to()` 方法声明 |
| 9 | `main_parser.h.template` | 修改 | Business 结构体，添加 `_valid` 字段渲染逻辑 |
| 10 | `main_parser.h.template` | 新增 | `from_raw()` / `to_raw()` 方法声明 |
| 11 | `struct.h.template` | 新增 | Raw 版本嵌套结构体渲染段落 |

### 阶段 2：实现文件生成器重构

| 序号 | 文件 | 操作 | 描述 |
|------|------|------|------|
| 12 | `cpp-impl-generator.js` | 新增 | 方法 `_generateRawFieldParseCalls()` 生成 Raw 解析代码（无 validWhen） |
| 13 | `cpp-impl-generator.js` | 新增 | 方法 `_generateFromRawFieldConversions()` 生成 Raw→Business 转换代码 |
| 14 | `cpp-impl-generator.js` | 修改 | `generate()` 方法，准备 Raw 解析和转换上下文 |
| 15 | `main_parser.cpp.template` | 新增 | `parse_from()` 方法实现渲染段落 |
| 16 | `main_parser.cpp.template` | 新增 | `from_raw()` 方法实现渲染段落 |
| 17 | `main_parser.cpp.template` | 修改 | `deserialize_{Protocol}()` 为 Facade 两阶段调用 |

### 阶段 3：序列化器生成器重构

| 序号 | 文件 | 操作 | 描述 |
|------|------|------|------|
| 18 | `cpp-serializer-generator.js` | 新增 | 方法 `_generateRawFieldSerializeCalls()` 生成 Raw 序列化代码 |
| 19 | `cpp-serializer-generator.js` | 新增 | 方法 `_generateToRawFieldConversions()` 生成 Business→Raw 转换代码 |
| 20 | `cpp-serializer-generator.js` | 修改 | `generate()` 方法，准备 Raw 序列化和转换上下文 |
| 21 | `main_serializer.cpp.template` | 新增 | `serialize_to()` 方法实现渲染段落 |
| 22 | `main_serializer.cpp.template` | 新增 | `to_raw()` 方法实现渲染段落 |
| 23 | `main_serializer.cpp.template` | 修改 | `serialize_{Protocol}()` 为 Facade 两阶段调用 |

### 阶段 4：测试与验证

| 序号 | 操作 | 描述 |
|------|------|------|
| 24 | 生成测试 | 使用 `test_struct.json` 配置生成新代码，验证 validWhen 处理 |
| 25 | 生成测试 | 使用 `test_padding_reserved.json` 配置生成新代码，验证 Padding 命名 |
| 26 | 生成测试 | 使用 `test_bitfield.json` 配置生成新代码，验证 Bitfield Raw/Business 分离 |
| 27 | 编译验证 | 编译所有生成的测试代码 |
| 28 | 回归测试 | 运行现有测试用例，验证向后兼容性 |

---

## 文件修改总览

| 文件路径 | 修改类型 | 优先级 |
|----------|----------|--------|
| `nodegen/cpp-header-generator.js` | 重构 | 阶段 1 |
| `templates/main_parser/main_parser.h.template` | 重构 | 阶段 1 |
| `templates/composites/struct.h.template` | 扩展 | 阶段 1 |
| `nodegen/cpp-impl-generator.js` | 重构 | 阶段 2 |
| `templates/main_parser/main_parser.cpp.template` | 重构 | 阶段 2 |
| `nodegen/cpp-serializer-generator.js` | 重构 | 阶段 3 |
| `templates/main_parser/main_serializer.cpp.template` | 重构 | 阶段 3 |

---

## 依赖关系

```
阶段 1 (头文件)
    ↓
阶段 2 (解析实现) ──→ 阶段 3 (序列化实现)
    ↓                      ↓
    └──────→ 阶段 4 (测试验证) ←──────┘
```

- 阶段 2 和阶段 3 可以并行进行
- 阶段 4 必须等待阶段 2 和阶段 3 完成

---

## 风险检查点

| 检查点 | 位置 | 验证内容 |
|--------|------|----------|
| CP-1 | 阶段 1 完成后 | Raw 结构体正确生成，Padding 命名正确 |
| CP-2 | 阶段 2 完成后 | parse_from() 无条件解析，from_raw() 正确转换 |
| CP-3 | 阶段 3 完成后 | serialize_to() 正确序列化，to_raw() 正确转换 |
| CP-4 | 阶段 4 完成后 | 所有现有测试通过，向后兼容性确认 |
