# 字段属性只读面板重设计

## 概述

重新设计报文协议只读模式下右侧"字段属性"面板的展示样式，采用紧凑表格风格，提升视觉体验。

## 问题分析

当前设计的问题：

1. **布局太单调** - 每一行都是独立的卡片，显得零散
2. **视觉层次不清晰** - 所有属性看起来同等重要
3. **空间利用不佳** - 标签和值之间大量空白，值右对齐显得不紧凑
4. **缺少分组** - 属性没有按类别组织

## 设计方案

### 设计风格

采用**混合式紧凑表格风格**：

- 短值用左右并排，无分隔线（靠行间距区分）
- 基础属性和复杂属性之间用虚线分隔
- 复杂值（数组、对象）带箭头标记

### 视觉效果

```
┌─────────────────────────────────────┐
│  字段属性                            │
├─────────────────────────────────────┤
│                                     │
│  字段名称          unsignedInt1     │
│  字段类型            无符号整数      │
│  字节长度                  4        │
│  显示格式            decimal        │
│  默认值                    0        │
│                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  有效性条件    ▸ 已配置             │
│  值映射表      ▸ 共 3 项            │
│                                     │
└─────────────────────────────────────┘
```

### 核心改动

| 属性 | 原来 | 现在 |
|------|------|------|
| 行内边距 | `10px 12px` | `4px 0` |
| 行背景 | 有背景+边框 | 无 |
| 行间距 | `8px` | `6px` |
| 标签颜色 | `text-secondary` | `text-tertiary`（更淡） |
| 标签宽度 | 固定 `110px` | 最小 `80px`，自适应 |
| 列表内边距 | `12px` | `16px` |

## 实现细节

### 涉及文件

- `client/src/views/ide/components/protocol-interface/components/field-props-readonly/index.vue`
- `client/src/views/ide/components/protocol-interface/components/field-props-readonly/index.scss`

### SCSS 样式

```scss
.field-props-readonly {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.field-props-readonly-list {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

// 基础属性区域
.field-props-readonly-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

// 分隔线
.field-props-readonly-divider {
  height: 1px;
  margin: 12px 0;
  border: none;
  border-top: 1px dashed var(--color-border-secondary);
}

// 每一行属性
.field-props-readonly-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0;
}

// 标签
.field-props-readonly-label {
  font-size: 13px;
  color: var(--color-text-tertiary);
  flex: 0 0 auto;
  min-width: 80px;
}

// 值
.field-props-readonly-value {
  font-size: 13px;
  color: var(--color-text-primary);
  text-align: right;
  flex: 1;
  word-break: break-word;
}

// 复杂值（数组、对象）带箭头
.field-props-readonly-value--complex {
  color: var(--color-text-secondary);

  &::before {
    content: '▸ ';
    color: var(--color-text-quaternary);
  }
}
```

### Vue 模板

```vue
<template>
  <div class="field-props-readonly">
    <template v-if="hasItems">
      <div class="field-props-readonly-list">
        <!-- 基础属性 -->
        <div class="field-props-readonly-section">
          <div
            v-for="item in basicItems"
            :key="item.key"
            class="field-props-readonly-item"
          >
            <span class="field-props-readonly-label">
              {{ item.label }}
            </span>
            <span class="field-props-readonly-value">
              {{ item.value }}
            </span>
          </div>
        </div>

        <!-- 分隔线（仅当有复杂属性时显示） -->
        <hr v-if="complexItems.length > 0" class="field-props-readonly-divider" />

        <!-- 复杂属性 -->
        <div v-if="complexItems.length > 0" class="field-props-readonly-section">
          <div
            v-for="item in complexItems"
            :key="item.key"
            class="field-props-readonly-item"
          >
            <span class="field-props-readonly-label">
              {{ item.label }}
            </span>
            <span class="field-props-readonly-value field-props-readonly-value--complex">
              {{ item.value }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="ide-toolbox-empty">
        <i class="ri-table-line ide-toolbox-empty-icon" />
        <p>选择一个字段查看属性</p>
      </div>
    </template>
  </div>
</template>
```

### 脚本逻辑

```ts
// 复杂类型的 key 列表
const complexKeys = new Set([
  'valid_when',
  'value_range',
  'maps',
  'sub_fields',
  'fields',
  'element',
  'parameters',
  'cases',
]);

// 基础属性（简单值）
const basicItems = computed(() =>
  displayItems.value.filter(item => !complexKeys.has(item.key))
);

// 复杂属性（对象/数组）
const complexItems = computed(() =>
  displayItems.value.filter(item => complexKeys.has(item.key))
);

// 是否有任何属性
const hasItems = computed(() => displayItems.value.length > 0);
```

## 设计原则

1. **移除卡片边框** - 去掉每行的 `border` 和 `background`，整体更干净
2. **减小行间距** - 从 `8px gap` 改为 `6px`，更紧凑
3. **左对齐值** - 值不再右对齐，改为右侧左对齐，视觉更舒适
4. **虚线分隔** - 基本属性和复杂属性之间用虚线分隔
5. **复杂值标记** - 对象/数组类型的值前面加 `▸` 符号，暗示可展开（未来扩展）
