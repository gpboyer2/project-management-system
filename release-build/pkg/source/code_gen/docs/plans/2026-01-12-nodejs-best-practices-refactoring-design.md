# Node.js 最佳实践重构设计

**日期**: 2026-01-12
**状态**: 待实施
**目标**: 解决 nodegen 模块的职责混淆问题，符合 Node.js 最佳实践

---

## 1. 问题总结

### 问题1：`getCppType()` 位置错误

**位置**: `config-parser.js:567-697`（130行）

`config-parser.js` 应该是**语言无关**的配置解析模块，但包含了 C++ 类型映射逻辑：

```javascript
// config-parser.js - 当前状态
class FieldInfo {
    getCppType(protocolName = null) {
        // 130行 C++ 类型映射：uint8_t, std::vector<>, std::string 等
    }
}
```

**违反原则**: 单一职责原则、分层架构（Domain 层混入 Infrastructure 细节）

### 问题2：`main.js` 双重分发

**位置**: `main.js:252-353`

存在 language × kind = 2×3 = 6 个分支的嵌套结构：

```javascript
if (language === 'python') {
    if (kind === 'software') { new PythonSoftwareProcessor(...) }
    else if (kind === 'dispatcher') { new PythonDispatcherGenerator(...) }
    else { new PythonCodeGenerator(...) }
} else {
    if (kind === 'software') { new SoftwareProcessor(...) }
    else if (kind === 'dispatcher') { new DispatcherGenerator(...) }
    else { new CodeGenerator(...) }
}
```

**违反原则**: 开放封闭原则（添加新语言需修改 main.js）

### 问题3：模板路径硬编码

**位置**: `template-manager.js:22-87`

```javascript
static TYPE_TEMPLATE_MAP = {
    'UnsignedInt': 'primitives/unsigned_int.cpp.template',  // 硬编码 .cpp
    // ...
};

constructor(templateBaseDir = null, protocolName = null) {
    // 没有 language 参数
}
```

**违反原则**: 依赖注入原则（无法通过配置切换语言）

---

## 2. 重构目标

1. **`config-parser.js` 保持语言无关** - 只做配置验证和 AST 构建
2. **类型映射独立成模块** - `cpp-type-mapper.js` 处理 C++ 特定逻辑
3. **消除双重分发** - 用工厂模式替代 `if-else` 嵌套
4. **模板路径可配置** - `TemplateManager` 支持语言参数

---

## 3. 设计方案

### 3.1 类型映射器抽取

**新增文件**: `nodegen/cpp-type-mapper.js`

```javascript
// cpp-type-mapper.js
export class CppTypeMapper {
    /**
     * 将 FieldInfo 映射为 C++ 类型字符串
     * @param {FieldInfo} fieldInfo - 字段信息对象
     * @param {string} protocolName - 协议名称（用于 Struct 命名）
     * @returns {string} C++ 类型，如 'uint16_t', 'std::vector<float>'
     */
    static mapType(fieldInfo, protocolName = null) {
        // 原 getCppType() 的全部逻辑移到这里

        // 1) 整数类型
        if (fieldInfo.type === 'UnsignedInt' || fieldInfo.type === 'SignedInt') {
            const unsignedMap = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            const signedMap = { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' };
            const map = fieldInfo.type === 'UnsignedInt' ? unsignedMap : signedMap;
            return map[fieldInfo.byteLength] || (fieldInfo.type === 'UnsignedInt' ? 'uint64_t' : 'int64_t');
        }

        // 2) 浮点数
        if (fieldInfo.type === 'Float') {
            if (fieldInfo.precision === 'float' || fieldInfo.byteLength === 4) return 'float';
            return 'double';
        }

        // 3) MessageId
        if (fieldInfo.type === 'MessageId') {
            const map = fieldInfo.valueType === 'SignedInt'
                ? { 1: 'int8_t', 2: 'int16_t', 4: 'int32_t', 8: 'int64_t' }
                : { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            return map[fieldInfo.byteLength] || 'uint64_t';
        }

        // 4) Array
        if (fieldInfo.type === 'Array') {
            const elementInfo = new FieldInfo(fieldInfo.element);
            let elementType = CppTypeMapper.mapType(elementInfo, protocolName);
            if (elementInfo.type === 'Struct' && protocolName && elementInfo.fieldName) {
                elementType = `${protocolName}_${capitalize(elementInfo.fieldName)}`;
            }
            return `std::vector<${elementType}>`;
        }

        // 5) Struct
        if (fieldInfo.type === 'Struct') {
            if (protocolName && fieldInfo.fieldName) {
                return `${protocolName}_${capitalize(fieldInfo.fieldName)}`;
            }
            return 'STRUCT_TYPE_PLACEHOLDER';
        }

        // 6) Command
        if (fieldInfo.type === 'Command') {
            return 'COMMAND_TYPE_SPECIAL_HANDLING';
        }

        // 7) Timestamp
        if (fieldInfo.type === 'Timestamp') {
            const map = { 1: 'uint8_t', 2: 'uint16_t', 4: 'uint32_t', 8: 'uint64_t' };
            return map[fieldInfo.byteLength] || 'uint64_t';
        }

        // 8) 其他类型
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

        throw new Error(`Unknown field type: "${fieldInfo.type}" (field: "${fieldInfo.fieldName}")`);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**调用方式变更**:

```javascript
// 变更前
const cppType = fieldInfo.getCppType(protocolName);

// 变更后
import { CppTypeMapper } from './cpp-type-mapper.js';
const cppType = CppTypeMapper.mapType(fieldInfo, protocolName);
```

### 3.2 GeneratorFactory 消除双重分发

**新增文件**: `nodegen/generator-factory.js`

```javascript
// generator-factory.js
import { CodeGenerator } from './code-generator.js';
import { DispatcherGenerator } from './dispatcher-generator.js';
import { SoftwareProcessor } from './software-processor.js';
import { PythonCodeGenerator, PythonDispatcherGenerator, PythonSoftwareProcessor } from './python-code-generator.js';

export class GeneratorFactory {
    // 生成器注册表：language → kind → GeneratorClass
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
            throw new Error(`Unknown config kind: "${kind}". Supported: ${supported}`);
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
}
```

**main.js 简化后**:

```javascript
// main.js (重构后核心逻辑)
import { GeneratorFactory } from './generator-factory.js';

async function executeGeneration(rawConfig, options, outputDir, configFilePath, inputMode) {
    // ... 预处理逻辑保持不变 ...

    const { kind, config } = parseConfigObject(normalizedConfig);

    const generatorOptions = {
        language: options.language,
        platform: options.platform,
        cppSdk: options.cppSdk,
        templateDir: options.templateDir,
        frameworkSrc: options.frameworkSrc
    };

    // 一行创建生成器，无分支
    const generator = GeneratorFactory.create(
        options.language,
        kind,
        config,
        generatorOptions
    );

    generator.printSummary();

    if (options.summaryOnly) {
        logger.log('(Summary-only mode, no files generated)');
        return;
    }

    await generator.generateFiles(outputDir);

    if (options.verbose) {
        generator.printGeneratedFiles?.(outputDir);
    }
}
```

### 3.3 TemplateManager 语言感知

**构造函数变更**:

```javascript
// template-manager.js (重构后)
export class TemplateManager {
    /**
     * @param {string} language - 目标语言 ('cpp11' | 'python')
     * @param {string} protocolName - 协议名称
     * @param {string} templateBaseDir - 可选，覆盖默认模板目录
     */
    constructor(language = 'cpp11', protocolName = null, templateBaseDir = null) {
        this.language = language;
        this.protocolName = protocolName;

        // 自动解析到语言子目录
        if (templateBaseDir === null) {
            templateBaseDir = path.join(__dirname, '../templates', language);
        }

        this.templateBaseDir = path.normalize(templateBaseDir);

        // Nunjucks 环境配置
        this.env = nunjucks.configure(this.templateBaseDir, {
            autoescape: false,
            trimBlocks: true,
            lstripBlocks: true
        });

        this._registerCustomFilters();
        this.templateCache = new Map();
        this.frameworkRelativePath = './';
    }

    // ... 其余方法保持不变 ...
}
```

**模板目录结构**:

```
templates/
├── cpp11/                    # C++ 模板
│   ├── primitives/
│   │   ├── unsigned_int.cpp.template
│   │   ├── signed_int.cpp.template
│   │   └── ...
│   ├── composites/
│   ├── main_parser/
│   └── dispatcher/
├── python/                   # Python 模板（未来）
│   └── ...
└── TEMPLATE_GUIDE.md
```

---

## 4. 实施计划

### 执行顺序

按依赖关系从底层往上改，每步保持可运行：

| Step | 操作 | 风险 |
|------|------|------|
| 1 | 新增 `cpp-type-mapper.js` | 无（纯新增） |
| 2 | 修改 generator 文件，切换到 CppTypeMapper | 低 |
| 3 | 从 FieldInfo 删除 `getCppType()` | 低 |
| 4 | 新增 `generator-factory.js` | 无（纯新增） |
| 5 | 重构 `main.js` 使用 GeneratorFactory | 中 |
| 6 | 调整 TemplateManager 构造函数 | 中 |
| 7 | 移动模板文件到 `templates/cpp11/` | 中 |

### 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `nodegen/cpp-type-mapper.js` | 类型映射（~140行） |
| **新增** | `nodegen/generator-factory.js` | 生成器工厂（~50行） |
| **修改** | `nodegen/config-parser.js` | 删除 `getCppType()`（-130行） |
| **修改** | `nodegen/main.js` | 使用 GeneratorFactory（-80行） |
| **修改** | `nodegen/template-manager.js` | 增加 language 参数（~10行改动） |
| **修改** | `nodegen/cpp-header-generator.js` | 改用 CppTypeMapper |
| **修改** | `nodegen/cpp-impl-generator.js` | 改用 CppTypeMapper |
| **修改** | `nodegen/cpp-serializer-generator.js` | 改用 CppTypeMapper |
| **修改** | `nodegen/dispatcher-generator.js` | 改用 CppTypeMapper |
| **修改** | `nodegen/code-generator.js` | 传递 language 给 TemplateManager |
| **移动** | `templates/*` → `templates/cpp11/*` | 模板文件归类 |

### 测试验证

每个 Step 完成后执行：

```bash
# 生成测试协议
cd nodegen
node main.js ../tests/configs/test_unsigned_int.json -o ../tests/generated/unsigned_int
node main.js ../tests/configs/dispatcher_test2/iot_dispatcher.json -o ../tests/generated/dispatcher2

# 对比输出（确保与重构前一致）
diff -r ../tests/generated/unsigned_int ../tests/generated/unsigned_int_backup
```

---

## 5. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 模板路径变更导致找不到文件 | Step 6 和 Step 7 一起做；或先用符号链接过渡 |
| 遗漏某处 `getCppType()` 调用 | 全局搜索 `getCppType` 确认所有调用点 |
| GeneratorFactory 注册表 key 不匹配 | 确保 `protocol` 与 `parseConfigObject` 返回值一致 |
| TemplateManager 旧调用方式失效 | 添加兼容性检测（检测第一个参数是路径还是语言） |

---

## 6. 预期收益

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 添加新语言需修改文件数 | 5+ | 1（注册到 factory） |
| `config-parser.js` C++ 代码 | 130行 | 0行 |
| `main.js` 分支数 | 6个 | 0个 |
| 模板路径可配置性 | 无 | 支持 |

---

## 7. 附录：未来扩展示例

添加 Java 支持只需：

```javascript
// 1. 创建 java-type-mapper.js
export class JavaTypeMapper {
    static mapType(fieldInfo, protocolName) { /* ... */ }
}

// 2. 创建 java-code-generator.js
export class JavaCodeGenerator { /* ... */ }

// 3. 注册到工厂
GeneratorFactory.register('java', 'protocol', JavaCodeGenerator);
GeneratorFactory.register('java', 'dispatcher', JavaDispatcherGenerator);
GeneratorFactory.register('java', 'software', JavaSoftwareProcessor);

// 4. 创建模板目录 templates/java/
```

无需修改 `main.js`、`config-parser.js` 或 `template-manager.js`。
