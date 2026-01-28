# 节点配置表单说明文档

## 概述

本目录包含了流程图节点的配置表单定义文件，用于在属性面板中动态渲染节点的配置界面。

## 文件结构

```
forms/
├── index.js                    # 统一导出文件
├── tcp-node-form.js           # TCP节点配置表单
├── udp-node-form.js           # UDP节点配置表单
├── serial-node-form.js        # 串口节点配置表单
├── parse-node-form.js         # 协议解析节点配置表单
├── serialize-node-form.js     # 协议序列化节点配置表单
└── README.md                  # 本文档
```

## 表单配置结构

每个表单配置文件导出一个对象，包含以下字段：

### 基础信息

```javascript
{
  type: 'node-type',           // 节点类型标识，必须与节点定义中的type一致
  category: 'communication',   // 节点分类：communication(数据传输) / processing(协议处理)
  label: '节点名称',            // 节点显示名称
  description: '节点描述',      // 节点功能描述
  icon: '/images/icon.svg',    // 节点图标路径
  color: 'rgb(r, g, b)',       // 节点颜色
  inputs: 1,                   // 输入端口数量
  outputs: 1,                  // 输出端口数量
  outputLabels: ['标签1']      // 输出端口标签（可选）
}
```

### 字段配置 (defaults)

`defaults` 对象定义了节点的所有可配置字段：

```javascript
defaults: {
  fieldName: {
    value: '',                 // 默认值
    label: '字段标签',          // 显示标签
    type: 'text',              // 字段类型：text/number/select/checkbox
    placeholder: '提示文本',    // 输入框占位符
    help: '帮助信息',           // 字段说明
    
    // 验证函数（可选）
    validate: (value, config) => {
      if (!value) return '错误信息';
      return true;  // 验证通过
    },
    
    // 可见性控制（可选）
    visible: (config) => config.someField === 'someValue',
    
    // 数字类型专用
    min: 0,
    max: 100,
    
    // 选择框专用
    options: [
      { value: 'val1', label: '选项1' },
      { value: 'val2', label: '选项2' }
    ],
    
    // 动态选项（可选）
    dynamicOptions: true,
    optionsSource: 'packet-config',  // 选项数据源
    
    // 可编辑选择框（可选）
    editable: true
  }
}
```

### 表单布局 (formLayout)

`formLayout` 数组定义了表单的分组和显示顺序：

```javascript
formLayout: [
  {
    section: '基础配置',        // 分组标题
    fields: ['field1', 'field2'],  // 包含的字段
    collapsible: true,         // 是否可折叠（可选）
    collapsed: false,          // 默认是否折叠（可选）
    visible: (config) => true  // 分组可见性（可选）
  }
]
```

## 字段类型说明

### 1. text（文本输入框）

```javascript
fieldName: {
  value: '',
  label: '字段名',
  type: 'text',  // 可省略，默认为text
  placeholder: '请输入内容'
}
```

### 2. number（数字输入框）

```javascript
fieldName: {
  value: 0,
  label: '数字字段',
  type: 'number',
  min: 0,
  max: 100,
  placeholder: '请输入数字'
}
```

### 3. select（下拉选择框）

```javascript
fieldName: {
  value: 'option1',
  label: '选择字段',
  type: 'select',
  options: [
    { value: 'option1', label: '选项1' },
    { value: 'option2', label: '选项2' }
  ]
}
```

### 4. checkbox（复选框）

```javascript
fieldName: {
  value: false,
  label: '开关字段',
  type: 'checkbox',
  help: '启用此功能'
}
```

## 高级特性

### 1. 字段验证

```javascript
validate: (value, config) => {
  // value: 当前字段值
  // config: 整个配置对象
  
  if (!value) {
    return '字段不能为空';  // 返回错误信息
  }
  
  if (!/^[a-z]+$/.test(value)) {
    return '只能包含小写字母';
  }
  
  return true;  // 验证通过
}
```

### 2. 条件显示

```javascript
visible: (config) => {
  // 根据其他字段的值决定是否显示
  return config.mode === 'advanced';
}
```

### 3. 动态选项

```javascript
{
  dynamicOptions: true,
  optionsSource: 'packet-config',  // 从报文配置获取选项
  options: []  // 初始为空，运行时动态填充
}
```

### 4. 可编辑选择框

```javascript
{
  type: 'select',
  editable: true,  // 允许用户输入自定义值
  options: [
    { value: '/dev/ttyUSB0', label: '/dev/ttyUSB0' },
    { value: '/dev/ttyUSB1', label: '/dev/ttyUSB1' }
  ]
}
```

## 使用示例

### 在组件中导入表单配置

```javascript
import { getNodeForm } from '@/components/node-view/forms';

// 获取TCP节点的表单配置
const tcpForm = getNodeForm('tcp-node');

// 获取所有表单配置
import { getAllNodeForms } from '@/components/node-view/forms';
const allForms = getAllNodeForms();

// 检查节点是否有表单配置
import { hasNodeForm } from '@/components/node-view/forms';
if (hasNodeForm('tcp-node')) {
  // 有配置
}

// 按分类获取表单
import { getNodeFormsByCategory } from '@/components/node-view/forms';
const commForms = getNodeFormsByCategory('communication');
```

### 渲染表单

```javascript
// 在flowchart/index.vue的属性面板中
const nodeForm = getNodeForm(selectedNode.type);

if (nodeForm) {
  // 根据formLayout渲染表单
  nodeForm.formLayout.forEach(section => {
    // 渲染分组标题
    renderSectionTitle(section.section);
    
    // 渲染字段
    section.fields.forEach(fieldName => {
      const fieldConfig = nodeForm.defaults[fieldName];
      
      // 检查可见性
      if (fieldConfig.visible && !fieldConfig.visible(currentConfig)) {
        return;
      }
      
      // 根据类型渲染不同的输入控件
      renderField(fieldName, fieldConfig);
    });
  });
}
```

## 节点配置概览

### 数据传输分类 (communication)

| 节点类型 | 文件名 | 主要配置 |
|---------|--------|---------|
| TCP | tcp-node-form.js | 工作模式、主机地址、端口、超时、重连 |
| UDP | udp-node-form.js | 工作模式(单播/广播/组播)、端口、缓冲区 |
| 串口 | serial-node-form.js | 串口设备、波特率、数据位、停止位、校验位 |

### 协议处理分类 (processing)

| 节点类型 | 文件名 | 主要配置 |
|---------|--------|---------|
| 协议解析 | parse-node-form.js | 协议配置、解析模式、字节序、输出格式 |
| 协议序列化 | serialize-node-form.js | 协议配置、序列化模式、字节序、填充方式 |

## 扩展新节点

### 1. 创建表单配置文件

在 `forms/` 目录下创建新的表单配置文件，例如 `mqtt-node-form.js`：

```javascript
export default {
  type: 'mqtt-node',
  category: 'communication',
  label: 'MQTT',
  description: 'MQTT通信节点',
  defaults: {
    // 字段定义
  },
  formLayout: [
    // 布局定义
  ]
};
```

### 2. 在index.js中注册

```javascript
import mqttNodeForm from './mqtt-node-form';

const nodeFormMap = {
  // ...existing forms
  'mqtt-node': mqttNodeForm
};
```

### 3. 创建对应的节点定义

在 `nodes/` 目录下创建 `MqttNode.js`，确保 `type` 字段与表单配置一致。

## 注意事项

1. **类型一致性**：表单配置的 `type` 必须与节点定义中的 `type` 完全一致
2. **字段命名**：使用驼峰命名法，避免使用保留字
3. **验证函数**：验证失败时返回错误信息字符串，成功返回 `true`
4. **可见性控制**：`visible` 函数接收完整的配置对象，可以根据多个字段的值决定显示
5. **默认值**：确保所有字段都有合理的默认值
6. **帮助信息**：为复杂字段提供 `help` 说明，提升用户体验
7. **动态选项**：需要在运行时从其他模块获取选项数据时，使用 `dynamicOptions` 和 `optionsSource`

## 最佳实践

1. **分组合理**：将相关字段放在同一分组中
2. **折叠高级选项**：将不常用的高级配置设为可折叠，默认折叠
3. **提供示例**：在 `placeholder` 中提供输入示例
4. **即时验证**：使用 `validate` 函数提供即时反馈
5. **条件显示**：使用 `visible` 函数隐藏不相关的字段
6. **一致性**：同类型节点的配置结构保持一致
7. **文档完善**：为每个字段提供清晰的 `label` 和 `help`

## 版本历史

- **v1.0** (2025-11-21)
  - 初始版本
  - 实现6个节点的表单配置
  - 支持基础字段类型和高级特性

## 相关文档

- [LogicFlow 文档](https://site.logic-flow.cn/)
- [Node-RED 节点配置](https://nodered.org/docs/creating-nodes/properties)
- [Element Plus 表单组件](https://element-plus.org/zh-CN/component/form.html)
