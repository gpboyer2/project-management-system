# Struct 子字段缩进显示设计

## 背景

在报文配置页面的只读模式（及编辑模式）下，当 struct 结构体展开后，子字段与其他字段在视觉上是平级显示的，用户无法一眼看出层级归属关系。

## 需求

通过左侧缩进的方式，让 struct 的子字段层级关系更直观，使用户能够清晰地识别哪些字段属于某个 struct。

## 设计方案

### 方案选择

采用 **左侧缩进** 方案，理由：
1. **最简洁** - 不需要额外的视觉元素
2. **最直观** - 层级一目了然，符合用户看文件树、大纲的习惯
3. **实现简单** - 根据字段层级添加 `padding-left` 即可

### 缩进规格

| 属性 | 值 | 说明 |
|-----|-----|------|
| 每层缩进 | `24px` | 足够区分层级，又不会占用太多空间 |
| 缩进位置 | 名称列 | 只对"名称"列应用缩进，其他列保持对齐 |
| 最大层级 | 无限制 | 递归支持任意嵌套深度 |

### 视觉效果

```
名称                      类型           字节长度
signedInt                # 有符号整数      1
unsignedInt1             + 无符号整数      4
▼ struct  含1个字段       {} 结构体        0
   └ timestamp           ⏱ 时间戳         1
float1                   % 浮点数          1
```

### 适用范围

- 只读模式
- 编辑模式
- 所有可展开类型：Struct、Array、Command

## 实现方案

### 修改位置

`client/src/views/packet-config/components/packet-field-list/index.vue`

### 实现方式

在字段列表渲染时，根据 `field.level` 计算 `padding-left`：

```vue
<span
  class="field-name"
  :style="{ paddingLeft: `${(field.level || 0) * 24}px` }"
>
  {{ field.field_name }}
</span>
```

### 依赖条件

字段数据需要包含 `level` 属性，该属性在 `useFieldOperations.ts` 的 `flatten` 函数中已经通过 `fieldLevelMap` 进行计算和维护。

## 验收标准

1. struct 展开后，子字段相对于父字段有明显的缩进
2. 嵌套的 struct 子字段缩进层层递进
3. 缩进只影响名称列，其他列保持对齐
4. 编辑模式和只读模式表现一致
