# Node.js 最佳实践重构实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `getCppType()` 从 `config-parser.js` 抽取到独立模块，消除 `main.js` 双重分发，使 `TemplateManager` 支持多语言。

**Architecture:** 采用渐进式重构策略，每步保持系统可运行。先抽取类型映射器，再引入工厂模式，最后调整模板路径。

**Tech Stack:** Node.js ES Module, Nunjucks 模板引擎

---

## Task 0: 创建基线备份

**目的:** 在重构前保存生成输出，用于验证重构后行为不变。

**Files:**
- Create: `tests/generated/baseline/` (目录)

**Step 1: 生成基线输出**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/baseline/unsigned_int
node main.js ../tests/configs/test_struct.json -o ../tests/generated/baseline/struct
node main.js ../tests/configs/test_array.json -o ../tests/generated/baseline/array
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o ../tests/generated/baseline/dispatcher2
```

Expected: 4 个目录，每个包含 `*_parser.h`, `*_parser.cpp`, `protocol_parser_framework/`

**Step 2: Commit baseline**

```bash
git add tests/generated/baseline/
git commit -m "chore: add baseline for refactoring verification"
```

---

## Task 1: 新增 cpp-type-mapper.js

**目的:** 将 C++ 类型映射逻辑从 `FieldInfo.getCppType()` 抽取为独立模块。

**Files:**
- Create: `nodegen/cpp-type-mapper.js`

**Step 1: 创建 cpp-type-mapper.js 文件**

```javascript
/**
 * C++ 类型映射器
 * 将 FieldInfo 映射为 C++ 类型字符串
 *
 * 从 config-parser.js 抽取，保持 config-parser.js 语言无关
 */

import { FieldInfo } from './config-parser.js';

/**
 * 首字母大写辅助函数
 * @param {string} str - 输入字符串
 * @returns {string} 首字母大写的字符串
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * C++ 类型映射器类
 */
export class CppTypeMapper {
    /**
     * 将 FieldInfo 映射为 C++ 类型字符串
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} protocolName - 协议名称（用于 Struct 命名）
     * @returns {string} C++ 类型，如 'uint16_t', 'std::vector<float>'
     */
    static mapType(fieldInfo, protocolName = null) {
        // 1) 整数类型：根据 byteLength 精确选择最小可容纳类型
        if (fieldInfo.type === 'UnsignedInt' || fieldInfo.type === 'SignedInt') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            const signedMap = {
                1: 'int8_t',
                2: 'int16_t',
                4: 'int32_t',
                8: 'int64_t'
            };

            const width = fieldInfo.byteLength || 0;
            const map = fieldInfo.type === 'UnsignedInt' ? unsignedMap : signedMap;

            if (map[width]) {
                return map[width];
            }

            // 配置写错时，退化为最大宽度类型，让问题在协议设计层暴露
            return fieldInfo.type === 'UnsignedInt' ? 'uint64_t' : 'int64_t';
        }

        // 2) 浮点数：优先根据 precision 选择，其次根据 byteLength
        if (fieldInfo.type === 'Float') {
            if (fieldInfo.precision === 'float') {
                return 'float';
            } else if (fieldInfo.precision === 'double') {
                return 'double';
            }
            if (fieldInfo.byteLength === 4) {
                return 'float';
            } else if (fieldInfo.byteLength === 8) {
                return 'double';
            }
            return 'double';
        }

        // 3) MessageId：根据 byteLength 和 valueType 选择合适的整数类型
        if (fieldInfo.type === 'MessageId') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            const signedMap = {
                1: 'int8_t',
                2: 'int16_t',
                4: 'int32_t',
                8: 'int64_t'
            };
            const typeMap = fieldInfo.valueType === 'SignedInt' ? signedMap : unsignedMap;
            return typeMap[fieldInfo.byteLength] || 'uint64_t';
        }

        // 4) Array 类型：统一使用 std::vector
        if (fieldInfo.type === 'Array') {
            if (!fieldInfo.element) {
                throw new Error(`Array type field "${fieldInfo.fieldName}" is missing element definition`);
            }

            const elementInfo = new FieldInfo(fieldInfo.element);
            let elementType = CppTypeMapper.mapType(elementInfo, protocolName);

            // 特殊处理：如果元素是 Struct，需要生成正确的结构体名称
            if (elementInfo.type === 'Struct' && protocolName && elementInfo.fieldName) {
                elementType = `${protocolName}_${capitalize(elementInfo.fieldName)}`;
            }

            return `std::vector<${elementType}>`;
        }

        // 5) Struct 类型：由调用者根据协议名称生成完整类型名
        if (fieldInfo.type === 'Struct') {
            if (protocolName && fieldInfo.fieldName) {
                return `${protocolName}_${capitalize(fieldInfo.fieldName)}`;
            }
            return 'STRUCT_TYPE_PLACEHOLDER';
        }

        // 6) Command 类型：返回特殊标记
        if (fieldInfo.type === 'Command') {
            return 'COMMAND_TYPE_SPECIAL_HANDLING';
        }

        // 7) Timestamp：根据 byteLength 选择合适的整数类型
        if (fieldInfo.type === 'Timestamp') {
            const unsignedMap = {
                1: 'uint8_t',
                2: 'uint16_t',
                4: 'uint32_t',
                8: 'uint64_t'
            };
            return unsignedMap[fieldInfo.byteLength] || 'uint64_t';
        }

        // 8) 其他类型：保持原有宽类型设计
        const typeMapping = {
            'Bitfield': 'uint64_t',
            'String': 'std::string',
            'Bcd': 'std::string',
            'Bytes': 'std::vector<uint8_t>',
            'Checksum': 'uint64_t',
            'Encode': 'uint64_t',
            'Padding': 'uint8_t',
            'Reserved': 'uint8_t'
        };

        if (typeMapping[fieldInfo.type]) {
            return typeMapping[fieldInfo.type];
        }

        throw new Error(`Unknown field type: "${fieldInfo.type}" (field name: "${fieldInfo.fieldName}")`);
    }
}
```

**Step 2: 验证文件语法正确**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node -c cpp-type-mapper.js
```

Expected: 无语法错误（或静默成功）

**Step 3: Commit**

```bash
git add nodegen/cpp-type-mapper.js
git commit -m "feat: add CppTypeMapper module extracted from FieldInfo.getCppType()"
```

---

## Task 2: 修改 cpp-header-generator.js 使用 CppTypeMapper

**目的:** 将 `cpp-header-generator.js` 中的 `getCppType()` 调用替换为 `CppTypeMapper.mapType()`。

**Files:**
- Modify: `nodegen/cpp-header-generator.js:7,128,191,237`

**Step 1: 添加 import 语句**

在文件顶部添加：
```javascript
import { CppTypeMapper } from './cpp-type-mapper.js';
```

**Step 2: 替换 getCppType 调用**

将以下 3 处调用替换：

| 行号 | 原代码 | 新代码 |
|------|--------|--------|
| 128 | `fieldInfo.getCppType(protocolName)` | `CppTypeMapper.mapType(fieldInfo, protocolName)` |
| 191 | `caseFieldInfo.getCppType(protocolName)` | `CppTypeMapper.mapType(caseFieldInfo, protocolName)` |
| 237 | `fieldInfo.getCppType(protocolName)` | `CppTypeMapper.mapType(fieldInfo, protocolName)` |

**Step 3: 运行验证**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/verify/unsigned_int
```

Expected: 生成成功，无错误

**Step 4: 对比输出**

Run (PowerShell):
```powershell
diff (Get-Content ../tests/generated/baseline/unsigned_int/testunsignedint_parser.h) (Get-Content ../tests/generated/verify/unsigned_int/testunsignedint_parser.h)
```

Expected: 无差异

**Step 5: Commit**

```bash
git add nodegen/cpp-header-generator.js
git commit -m "refactor: use CppTypeMapper in cpp-header-generator.js"
```

---

## Task 3: 修改 cpp-serializer-generator.js 使用 CppTypeMapper

**目的:** 将 `cpp-serializer-generator.js` 中的 `getCppType()` 调用替换为 `CppTypeMapper.mapType()`。

**Files:**
- Modify: `nodegen/cpp-serializer-generator.js:7,308,312`

**Step 1: 添加 import 语句**

在文件顶部添加：
```javascript
import { CppTypeMapper } from './cpp-type-mapper.js';
```

**Step 2: 替换 getCppType 调用**

将以下 2 处调用替换：

| 行号 | 原代码 | 新代码 |
|------|--------|--------|
| 308 | `elementInfo.getCppType(this.protocolName)` | `CppTypeMapper.mapType(elementInfo, this.protocolName)` |
| 312 | `elementInfo.getCppType(this.protocolName)` | `CppTypeMapper.mapType(elementInfo, this.protocolName)` |

**Step 3: 运行验证**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_array.json -o ../tests/generated/verify/array
```

Expected: 生成成功，无错误

**Step 4: 对比输出**

Run (PowerShell):
```powershell
diff (Get-Content ../tests/generated/baseline/array/testarray_parser.cpp) (Get-Content ../tests/generated/verify/array/testarray_parser.cpp)
```

Expected: 无差异

**Step 5: Commit**

```bash
git add nodegen/cpp-serializer-generator.js
git commit -m "refactor: use CppTypeMapper in cpp-serializer-generator.js"
```

---

## Task 4: 修改 template-manager.js 使用 CppTypeMapper

**目的:** 将 `template-manager.js` 中的 `getCppType()` 调用替换为 `CppTypeMapper.mapType()`。

**Files:**
- Modify: `nodegen/template-manager.js:10,286`

**Step 1: 添加 import 语句**

在文件顶部 import 区域添加：
```javascript
import { CppTypeMapper } from './cpp-type-mapper.js';
```

**Step 2: 替换 getCppType 调用**

将以下调用替换：

| 行号 | 原代码 | 新代码 |
|------|--------|--------|
| 286 | `elementInfo.getCppType(this.protocolName)` | `CppTypeMapper.mapType(elementInfo, this.protocolName)` |

**Step 3: 运行验证**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_struct.json -o ../tests/generated/verify/struct
```

Expected: 生成成功，无错误

**Step 4: 对比输出**

Run (PowerShell):
```powershell
diff (Get-Content ../tests/generated/baseline/struct/teststruct_parser.h) (Get-Content ../tests/generated/verify/struct/teststruct_parser.h)
```

Expected: 无差异

**Step 5: Commit**

```bash
git add nodegen/template-manager.js
git commit -m "refactor: use CppTypeMapper in template-manager.js"
```

---

## Task 5: 从 config-parser.js 删除 getCppType()

**目的:** 完成类型映射器抽取，从 `FieldInfo` 类中删除 `getCppType()` 方法。

**Files:**
- Modify: `nodegen/config-parser.js:563-697` (删除约 135 行)

**Step 1: 确认无遗漏调用**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test
grep -r "getCppType" nodegen/*.js --include="*.js" | grep -v "cpp-type-mapper.js" | grep -v "README.md"
```

Expected: 无输出（所有调用已替换）

**Step 2: 删除 getCppType 方法**

从 `config-parser.js` 的 `FieldInfo` 类中删除 `getCppType()` 方法（行 563-697）。

**Step 3: 运行完整验证**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/verify/unsigned_int
node main.js ../tests/configs/test_struct.json -o ../tests/generated/verify/struct
node main.js ../tests/configs/test_array.json -o ../tests/generated/verify/array
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o ../tests/generated/verify/dispatcher2
```

Expected: 全部生成成功

**Step 4: Commit**

```bash
git add nodegen/config-parser.js
git commit -m "refactor: remove getCppType() from FieldInfo - now in CppTypeMapper"
```

---

## Task 6: 新增 generator-factory.js

**目的:** 引入工厂模式，消除 `main.js` 中的双重分发逻辑。

**Files:**
- Create: `nodegen/generator-factory.js`

**Step 1: 创建 generator-factory.js 文件**

```javascript
/**
 * 生成器工厂
 * 根据目标语言和配置类型创建对应的生成器实例
 *
 * 消除 main.js 中的 language × kind 双重分发逻辑
 */

import { CodeGenerator } from './code-generator.js';
import { DispatcherGenerator } from './dispatcher-generator.js';
import { SoftwareProcessor } from './software-processor.js';
import { PythonCodeGenerator, PythonDispatcherGenerator, PythonSoftwareProcessor } from './python-code-generator.js';

/**
 * 生成器工厂类
 */
export class GeneratorFactory {
    /**
     * 生成器注册表：language → kind → GeneratorClass
     * @type {Object.<string, Object.<string, Function>>}
     */
    static registry = {
        'cpp11': {
            'software': SoftwareProcessor,
            'dispatcher': DispatcherGenerator,
            'protocol': CodeGenerator
        },
        'python': {
            'software': PythonSoftwareProcessor,
            'dispatcher': PythonDispatcherGenerator,
            'protocol': PythonCodeGenerator
        }
    };

    /**
     * 创建生成器实例
     * @param {string} language - 目标语言 ('cpp11' | 'python')
     * @param {string} kind - 配置类型 ('software' | 'dispatcher' | 'protocol')
     * @param {Object} config - 配置对象
     * @param {Object} options - 生成器选项
     * @returns {Object} 生成器实例
     * @throws {Error} 不支持的语言或配置类型
     */
    static create(language, kind, config, options) {
        const langRegistry = this.registry[language];
        if (!langRegistry) {
            const supported = Object.keys(this.registry).join(', ');
            throw new Error(`Unsupported language: "${language}". Supported: ${supported}`);
        }

        const GeneratorClass = langRegistry[kind];
        if (!GeneratorClass) {
            const supported = Object.keys(langRegistry).join(', ');
            throw new Error(`Unknown config kind: "${kind}" for language "${language}". Supported: ${supported}`);
        }

        return new GeneratorClass(config, options);
    }

    /**
     * 注册新的生成器（用于扩展）
     * @param {string} language - 语言标识
     * @param {string} kind - 配置类型
     * @param {Function} GeneratorClass - 生成器类
     */
    static register(language, kind, GeneratorClass) {
        if (!this.registry[language]) {
            this.registry[language] = {};
        }
        this.registry[language][kind] = GeneratorClass;
    }

    /**
     * 获取支持的语言列表
     * @returns {string[]} 语言列表
     */
    static getSupportedLanguages() {
        return Object.keys(this.registry);
    }

    /**
     * 获取指定语言支持的配置类型
     * @param {string} language - 语言标识
     * @returns {string[]} 配置类型列表
     */
    static getSupportedKinds(language) {
        const langRegistry = this.registry[language];
        return langRegistry ? Object.keys(langRegistry) : [];
    }
}
```

**Step 2: 验证文件语法正确**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node -c generator-factory.js
```

Expected: 无语法错误

**Step 3: Commit**

```bash
git add nodegen/generator-factory.js
git commit -m "feat: add GeneratorFactory to eliminate double dispatch in main.js"
```

---

## Task 7: 重构 main.js 使用 GeneratorFactory

**目的:** 使用 `GeneratorFactory` 替换 `main.js` 中的 if-else 嵌套。

**Files:**
- Modify: `nodegen/main.js:4,252-370`

**Step 1: 添加 import 语句**

在文件顶部添加：
```javascript
import { GeneratorFactory } from './generator-factory.js';
```

**Step 2: 替换 executeGeneration 函数中的分发逻辑**

将行 252-370 的 if-else 嵌套替换为：

```javascript
    // ============================================================
    // 第三步：使用工厂模式创建生成器并生成代码
    // ============================================================
    const generator = GeneratorFactory.create(
        options.language,
        kind,
        config,
        generatorOptions
    );

    // 打印配置摘要
    generator.printSummary();

    // 如果只显示摘要，则退出
    if (options.summaryOnly) {
        logger.log('(Summary-only mode, no files generated)');
        return;
    }

    // 生成文件
    logger.log(`Starting ${kind} generation process...\n`);
    await generator.generateFiles(outputDir);

    logger.log('\n' + '='.repeat(60));
    logger.log('Code generation completed!');
    logger.log('='.repeat(60));

    // 如果启用详细模式，显示生成的文件列表
    if (options.verbose && typeof generator.printGeneratedFiles === 'function') {
        generator.printGeneratedFiles(outputDir);
    }
```

**Step 3: 运行验证**

Run:
```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/verify/unsigned_int
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o ../tests/generated/verify/dispatcher2
```

Expected: 全部生成成功

**Step 4: 对比输出**

Run (PowerShell):
```powershell
diff (Get-Content ../tests/generated/baseline/unsigned_int/testunsignedint_parser.h) (Get-Content ../tests/generated/verify/unsigned_int/testunsignedint_parser.h)
diff (Get-Content ../tests/generated/baseline/dispatcher2/iotprotocol_dispatcher.h) (Get-Content ../tests/generated/verify/dispatcher2/iotprotocol_dispatcher.h)
```

Expected: 无差异

**Step 5: Commit**

```bash
git add nodegen/main.js
git commit -m "refactor: use GeneratorFactory in main.js - eliminate double dispatch"
```

---

## Task 8: 清理并更新文档

**目的:** 更新 README.md 和设计文档状态。

**Files:**
- Modify: `nodegen/README.md` (更新架构说明)
- Modify: `docs/plans/2026-01-12-nodejs-best-practices-refactoring-design.md` (更新状态)

**Step 1: 更新设计文档状态**

将 `docs/plans/2026-01-12-nodejs-best-practices-refactoring-design.md` 第 4 行的：
```
**状态**: 待实施
```
改为：
```
**状态**: 已完成
```

**Step 2: 删除验证目录**

Run:
```bash
rm -rf E:/ProjectCode/lc_code_gen_test/tests/generated/verify
rm -rf E:/ProjectCode/lc_code_gen_test/tests/generated/baseline
```

**Step 3: Final Commit**

```bash
git add docs/plans/2026-01-12-nodejs-best-practices-refactoring-design.md
git commit -m "docs: mark refactoring design as completed"
```

---

## 验证检查清单

重构完成后，运行以下验证确保系统正常：

```bash
cd E:/ProjectCode/lc_code_gen_test/nodegen

# 1. 单协议生成
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/unsigned_int
node main.js ../tests/configs/test_signed_int.json -o ../tests/generated/signed_int
node main.js ../tests/configs/test_float.json -o ../tests/generated/float
node main.js ../tests/configs/test_struct.json -o ../tests/generated/struct
node main.js ../tests/configs/test_array.json -o ../tests/generated/array

# 2. 分发器生成
node main.js ../tests/configs/dispatcher_test/device_dispatcher.json -o ../tests/generated/dispatcher
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o ../tests/generated/dispatcher2

# 3. 综合测试
node main.js ../tests/configs/test_comprehensive_iot.json -o ../tests/generated/comprehensive_iot
```

全部生成成功即表示重构完成。

---

## 注意事项

1. **TemplateManager 语言感知 (Step 6-7 from design doc)** 暂不实施
   - 原因：当前只有 C++ 模板，移动目录会增加复杂度但无实际收益
   - 建议：等到真正需要 Python 模板时再实施

2. **模板目录结构变更** 暂不实施
   - 原因：同上，当前模板结构工作正常
   - 建议：作为未来 Python 支持的一部分实施

3. **回滚策略**
   - 每个 Task 都有独立 commit
   - 如果某个 Task 失败，可以 `git revert` 回退到上一个稳定状态
