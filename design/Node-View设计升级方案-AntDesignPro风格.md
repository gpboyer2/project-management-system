# Node-View 设计升级方案

> 基于 Ant Design Pro 设计规范，结合工业软件特点定制

---

## 一、设计理念

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **清晰（Clear）** | 信息层级分明，重点突出，减少认知负担 |
| **高效（Efficient）** | 简化操作路径，提升工作效率 |
| **专业（Professional）** | 体现工业软件的严谨性和可靠性 |
| **一致（Consistent）** | 统一的视觉语言和交互模式 |

### 1.2 品牌定位

- **产品名称**：Node-View 流程设计器
- **品牌调性**：专业、可靠、高效、现代
- **目标用户**：工业领域工程师、系统集成商、协议开发人员

---

## 二、色彩系统

### 2.1 品牌主色

采用 Ant Design 官方「极客蓝」(Geekblue) 作为主色，体现科技感和专业性。

```scss
// 主色（品牌蓝）
--color-primary-50: #f0f5ff;
--color-primary-100: #d6e4ff;
--color-primary-200: #adc6ff;
--color-primary-300: #85a5ff;
--color-primary-400: #597ef7;
--color-primary-500: #2f54eb;  // 主色
--color-primary-600: #1d39c4;
--color-primary-700: #10239e;
--color-primary-800: #061178;
--color-primary-900: #030852;
```

**主色应用场景**：
- 主要按钮背景色
- 链接文字颜色
- 导航激活状态
- 品牌强调元素

### 2.2 功能色

```scss
// 成功色
--color-success: #52c41a;
--color-success-bg: #f6ffed;
--color-success-border: #b7eb8f;

// 警告色
--color-warning: #faad14;
--color-warning-bg: #fffbe6;
--color-warning-border: #ffe58f;

// 错误色
--color-error: #ff4d4f;
--color-error-bg: #fff2f0;
--color-error-border: #ffccc7;

// 信息色
--color-info: #1677ff;
--color-info-bg: #e6f4ff;
--color-info-border: #91caff;
```

### 2.3 中性色（亮色主题）

```scss
// 标题/正文
--color-text-primary: rgba(0, 0, 0, 0.88);
// 次要文字
--color-text-secondary: rgba(0, 0, 0, 0.65);
// 辅助/说明文字
--color-text-tertiary: rgba(0, 0, 0, 0.45);
// 禁用文字
--color-text-disabled: rgba(0, 0, 0, 0.25);
// 占位符
--color-text-placeholder: rgba(0, 0, 0, 0.25);

// 边框
--color-border-primary: #d9d9d9;
--color-border-secondary: #f0f0f0;

// 背景
--color-bg-page: #f5f5f5;          // 页面背景
--color-bg-container: #ffffff;      // 容器背景
--color-bg-elevated: #ffffff;       // 浮层背景
--color-bg-spotlight: rgba(0, 0, 0, 0.85);  // 聚光灯背景
```

### 2.4 中性色（暗色主题）

```scss
[data-theme="dark"] {
  // 标题/正文
  --color-text-primary: rgba(255, 255, 255, 0.85);
  // 次要文字
  --color-text-secondary: rgba(255, 255, 255, 0.65);
  // 辅助/说明文字
  --color-text-tertiary: rgba(255, 255, 255, 0.45);
  // 禁用文字
  --color-text-disabled: rgba(255, 255, 255, 0.25);
  
  // 边框
  --color-border-primary: #424242;
  --color-border-secondary: #303030;
  
  // 背景
  --color-bg-page: #141414;
  --color-bg-container: #1f1f1f;
  --color-bg-elevated: #262626;
}
```

### 2.5 状态指示色（工业场景专用）

```scss
// 在线/正常运行
--color-status-online: #52c41a;
// 离线/停止
--color-status-offline: #bfbfbf;
// 告警/注意
--color-status-warning: #faad14;
// 故障/错误
--color-status-error: #ff4d4f;
// 未知状态
--color-status-unknown: #8c8c8c;
```

---

## 三、字体系统

### 3.1 字体家族

```scss
// 主字体（中文优先）
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', 'WenQuanYi Micro Hei', sans-serif;

// 代码字体
--font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
  Courier, monospace;

// 推荐网络字体（可选）
// 思源黑体：https://fonts.google.com/specimen/Noto+Sans+SC
// 阿里巴巴普惠体：https://fonts.alicdn.com/font_2263779_ok4s5pqv47.css
```

### 3.2 字号系统

```scss
// 基础字号（推荐 14px）
--font-size-base: 14px;

// 字号等级
--font-size-xs: 12px;    // 辅助说明、标签
--font-size-sm: 12px;    // 次要信息
--font-size-base: 14px;  // 正文（默认）
--font-size-lg: 16px;    // 强调文字
--font-size-xl: 20px;    // 小标题

// 标题字号
--font-size-h1: 38px;    // 页面大标题
--font-size-h2: 30px;    // 区域标题
--font-size-h3: 24px;    // 卡片标题
--font-size-h4: 20px;    // 模块标题
--font-size-h5: 16px;    // 列表标题
```

### 3.3 字重

```scss
--font-weight-regular: 400;   // 正文
--font-weight-medium: 500;    // 强调
--font-weight-semibold: 600;  // 标题
--font-weight-bold: 700;      // 大标题
```

### 3.4 行高

```scss
--line-height-xs: 1.33;    // 紧凑
--line-height-sm: 1.5;     // 默认
--line-height-base: 1.57;  // 正文
--line-height-lg: 1.67;    // 宽松
```

- **标题**: 紧凑行高 - `line-height-xs`
- **正文**: 舒适行高 - `line-height-base`

---

## 四、间距系统

### 4.1 基础间距

采用 4px 为基础单位的间距系统：

```scss
--spacing-xxs: 4px;    // 最小间距，如图标与文字
--spacing-xs: 8px;     // 紧凑元素间距
--spacing-sm: 12px;    // 小组件内部间距
--spacing-base: 16px;  // 标准间距，最常用
--spacing-lg: 24px;    // 中等间距，区块分隔
--spacing-xl: 32px;    // 大间距，主要区块间
--spacing-xxl: 48px;   // 页面级间距
```

### 4.2 组件内间距

```scss
// 按钮内边距
--padding-btn-sm: 0 7px;
--padding-btn-base: 4px 15px;
--padding-btn-lg: 6px 15px;

// 输入框内边距
--padding-input-sm: 0 7px;
--padding-input-base: 4px 11px;
--padding-input-lg: 6px 11px;

// 卡片内边距
--padding-card: 24px;
--padding-card-sm: 12px;

// 表格单元格
--padding-table-cell: 16px;
--padding-table-cell-sm: 8px;
```

---

## 五、圆角系统

```scss
--radius-none: 0;
--radius-sm: 2px;      // 小按钮、标签
--radius-base: 6px;    // 默认（Ant Design 5.x）
--radius-lg: 8px;      // 卡片、弹窗
--radius-xl: 12px;     // 大型容器
--radius-full: 9999px; // 药丸形状
```

---

## 六、阴影系统

```scss
// 一级阴影（基础浮层）
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03),
             0 1px 6px -1px rgba(0, 0, 0, 0.02),
             0 2px 4px 0 rgba(0, 0, 0, 0.02);

// 二级阴影（悬浮、下拉）
--shadow-base: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
               0 3px 6px -4px rgba(0, 0, 0, 0.12),
               0 9px 28px 8px rgba(0, 0, 0, 0.05);

// 三级阴影（弹窗、抽屉）
--shadow-lg: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
             0 3px 6px -4px rgba(0, 0, 0, 0.12),
             0 9px 28px 8px rgba(0, 0, 0, 0.05);
```

---

## 七、组件样式规范

### 7.1 按钮

| 类型 | 背景色 | 文字色 | 边框 | 用途 |
|------|--------|--------|------|------|
| Primary | #2f54eb | #fff | 无 | 主要操作 |
| Default | #fff | rgba(0,0,0,0.88) | #d9d9d9 | 次要操作 |
| Dashed | #fff | rgba(0,0,0,0.88) | #d9d9d9 虚线 | 添加操作 |
| Text | transparent | #2f54eb | 无 | 链接式操作 |
| Link | transparent | #2f54eb | 无 | 纯链接 |

**按钮尺寸**：
- 小型：高度 24px，字号 14px
- 默认：高度 32px，字号 14px
- 大型：高度 40px，字号 16px

### 7.2 输入框

```scss
// 默认状态
background: #ffffff;
border: 1px solid #d9d9d9;
border-radius: 6px;
padding: 4px 11px;
height: 32px;
font-size: 14px;

// 悬停状态
border-color: #2f54eb;

// 聚焦状态
border-color: #2f54eb;
box-shadow: 0 0 0 2px rgba(47, 84, 235, 0.1);
outline: none;

// 禁用状态
background: rgba(0, 0, 0, 0.04);
border-color: #d9d9d9;
color: rgba(0, 0, 0, 0.25);
cursor: not-allowed;
```

### 7.3 表格

```scss
// 表头
background: #fafafa;
font-weight: 600;
color: rgba(0, 0, 0, 0.88);
border-bottom: 1px solid #f0f0f0;

// 表格行
background: #ffffff;
border-bottom: 1px solid #f0f0f0;

// 悬停行
background: #fafafa;

// 选中行
background: #e6f4ff;
```

### 7.4 卡片

```scss
background: #ffffff;
border-radius: 8px;
box-shadow: var(--shadow-sm);
padding: 24px;

// 卡片标题
font-size: 16px;
font-weight: 500;
color: rgba(0, 0, 0, 0.88);
padding-bottom: 16px;
margin-bottom: 16px;
border-bottom: 1px solid #f0f0f0;
```

### 7.5 导航/Header

```scss
// 顶部导航
background: #001529;  // 深色导航
height: 48px;

// 亮色导航（推荐）
background: #ffffff;
border-bottom: 1px solid #f0f0f0;
height: 56px;
box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

// Logo 区域
width: 200px;
font-size: 18px;
font-weight: 600;

// 菜单项
padding: 0 20px;
height: 56px;
line-height: 56px;
color: rgba(0, 0, 0, 0.65);

// 菜单项 - 激活
color: #2f54eb;
border-bottom: 2px solid #2f54eb;
```

---

## 八、页面布局规范

### 8.1 整体布局

```
┌─────────────────────────────────────────────────────┐
│                    Header (56px)                     │
├────────────┬────────────────────────────────────────┤
│            │                                         │
│  Sidebar   │              Content                    │
│  (208px)   │         (padding: 24px)                 │
│            │                                         │
│            │                                         │
└────────────┴────────────────────────────────────────┘
```

### 8.2 内容区布局

```scss
// 页面容器
margin: 0 auto;
padding: 24px;

// 页面标题区
margin-bottom: 24px;

// 内容卡片间距
gap: 24px;
```

### 8.3 响应式断点（参考，项目暂不需要）

```scss
// 参考值
--breakpoint-xs: 480px;
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
--breakpoint-xxl: 1600px;
```

---

## 九、动效规范

### 9.1 过渡时间

```scss
--motion-duration-fast: 0.1s;    // 开关、选择
--motion-duration-mid: 0.2s;     // 悬停、聚焦
--motion-duration-slow: 0.3s;    // 弹窗、抽屉
```

### 9.2 过渡曲线

```scss
--motion-ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
--motion-ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
--motion-ease-out-back: cubic-bezier(0.12, 0.4, 0.29, 1.46);
```

### 9.3 常用动效

```scss
// 按钮悬停
transition: all 0.2s var(--motion-ease-in-out);

// 输入框聚焦
transition: border-color 0.2s, box-shadow 0.2s;

// 卡片悬停
transition: box-shadow 0.3s, transform 0.3s;
transform: translateY(-2px);

// 弹窗进入
animation: fadeIn 0.2s ease-out;
```

---

## 十、图标规范

### 10.1 推荐图标库

继续使用当前项目已有的 **Remix Icon**，与 Ant Design 风格兼容。

```html
<!-- 已安装：https://remixicon.com/ -->
<i class="ri-home-line"></i>
```

### 10.2 图标尺寸

```scss
--icon-size-xs: 12px;   // 标签内图标
--icon-size-sm: 14px;   // 按钮内图标
--icon-size-base: 16px; // 默认
--icon-size-lg: 20px;   // 菜单图标
--icon-size-xl: 24px;   // 页面图标
```

### 10.3 图标颜色

- 与相邻文字保持一致
- 功能图标使用对应功能色
- 装饰图标使用 `rgba(0, 0, 0, 0.45)`

### 10.4 图标背景

- **按钮内图标**：不使用背景色，保持透明
- **树节点/列表项图标**：可使用浅色背景（如 `--color-primary-50`）增强层级感
- **状态指示图标**：可使用对应状态色的浅色背景（如 `--color-success-bg`）

---

## 十一、登录页设计

### 11.1 布局方案

采用左右分栏布局：
- 左侧：品牌展示区（60%），渐变背景 + 产品介绍
- 右侧：登录表单区（40%），纯白背景

### 11.2 视觉元素

```
┌──────────────────────────┬───────────────────┐
│                          │                   │
│      品牌 Logo           │    登录表单       │
│                          │                   │
│      产品标语            │    · 用户名       │
│                          │    · 密码         │
│      装饰图形/插画       │    · 记住登录     │
│                          │    · 登录按钮     │
│                          │                   │
│      版权信息            │                   │
└──────────────────────────┴───────────────────┘
```

### 11.3 配色方案

```scss
// 左侧背景渐变
background: linear-gradient(135deg, #2f54eb 0%, #1d39c4 100%);

// 右侧
background: #ffffff;

// 登录按钮
background: #2f54eb;
height: 40px;
border-radius: 6px;
```

---

## 十二、实施计划

### 第一阶段：基础样式升级（3-5天）

1. **更新 CSS 变量系统**
   - 替换颜色变量
   - 更新间距系统
   - 调整字体系统

2. **升级全局样式**
   - 更新 `index.scss` 中的基础样式
   - 调整按钮、输入框、卡片等基础组件

3. **覆盖 Element Plus 默认样式**
   - 创建 `element-plus-override.scss`
   - 统一组件视觉风格

### 第二阶段：核心页面改造（5-7天）

1. **登录页重构**
   - 新的左右分栏布局
   - 品牌元素设计

2. **导航栏升级**
   - 新的 Header 设计
   - Logo 和导航菜单优化

3. **主要功能页面**
   - 报文配置页面
   - 拓扑图页面
   - 设置页面

### 第三阶段：细节打磨（2-3天）

1. **动效优化**
   - 添加过渡动画
   - 优化加载状态

2. **暗色主题适配**
   - 完善暗色主题变量
   - 测试暗色模式效果

3. **最终测试和调整**

---

## 十三、CSS 变量完整定义

以下为可直接使用的完整 CSS 变量：

```scss
:root {
  // ==================== 品牌色 ====================
  --color-primary-50: #f0f5ff;
  --color-primary-100: #d6e4ff;
  --color-primary-200: #adc6ff;
  --color-primary-300: #85a5ff;
  --color-primary-400: #597ef7;
  --color-primary-500: #2f54eb;
  --color-primary-600: #1d39c4;
  --color-primary-700: #10239e;
  --color-primary-800: #061178;
  --color-primary-900: #030852;

  // ==================== 功能色 ====================
  --color-success: #52c41a;
  --color-success-bg: #f6ffed;
  --color-success-border: #b7eb8f;

  --color-warning: #faad14;
  --color-warning-bg: #fffbe6;
  --color-warning-border: #ffe58f;

  --color-error: #ff4d4f;
  --color-error-bg: #fff2f0;
  --color-error-border: #ffccc7;

  --color-info: #1677ff;
  --color-info-bg: #e6f4ff;
  --color-info-border: #91caff;

  // ==================== 中性色 ====================
  --color-text-primary: rgba(0, 0, 0, 0.88);
  --color-text-secondary: rgba(0, 0, 0, 0.65);
  --color-text-tertiary: rgba(0, 0, 0, 0.45);
  --color-text-disabled: rgba(0, 0, 0, 0.25);
  --color-text-placeholder: rgba(0, 0, 0, 0.25);

  --color-border-primary: #d9d9d9;
  --color-border-secondary: #f0f0f0;
  --color-border-focus: #2f54eb;

  --color-bg-page: #f5f5f5;
  --color-bg-container: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-bg-spotlight: rgba(0, 0, 0, 0.85);
  --color-bg-mask: rgba(0, 0, 0, 0.45);

  // ==================== 状态色（工业场景）====================
  --color-status-online: #52c41a;
  --color-status-offline: #bfbfbf;
  --color-status-warning: #faad14;
  --color-status-error: #ff4d4f;
  --color-status-unknown: #8c8c8c;

  // ==================== 字体 ====================
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  --font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
    Courier, monospace;

  --font-size-xs: 12px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-h1: 38px;
  --font-size-h2: 30px;
  --font-size-h3: 24px;
  --font-size-h4: 20px;
  --font-size-h5: 16px;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-xs: 1.33;
  --line-height-sm: 1.5;
  --line-height-base: 1.57;
  --line-height-lg: 1.67;

  // ==================== 间距 ====================
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-base: 16px;
  --spacing-md: 20px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  // ==================== 圆角 ====================
  --radius-none: 0;
  --radius-sm: 2px;
  --radius-base: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  // ==================== 阴影 ====================
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03),
               0 1px 6px -1px rgba(0, 0, 0, 0.02),
               0 2px 4px 0 rgba(0, 0, 0, 0.02);
  --shadow-base: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
                 0 3px 6px -4px rgba(0, 0, 0, 0.12),
                 0 9px 28px 8px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
               0 3px 6px -4px rgba(0, 0, 0, 0.12),
               0 9px 28px 8px rgba(0, 0, 0, 0.05);

  // ==================== 动效 ====================
  --motion-duration-fast: 0.1s;
  --motion-duration-mid: 0.2s;
  --motion-duration-slow: 0.3s;
  --motion-ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --motion-ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --motion-ease-out-back: cubic-bezier(0.12, 0.4, 0.29, 1.46);

  // ==================== 层级 ====================
  --z-dropdown: 1050;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-message: 1080;

  // ==================== 组件尺寸 ====================
  --height-sm: 24px;
  --height-base: 32px;
  --height-lg: 40px;

  --header-height: 56px;
  --sidebar-width: 208px;
  --sidebar-collapsed-width: 48px;
}

// ==================== 暗色主题 ====================
[data-theme="dark"] {
  --color-text-primary: rgba(255, 255, 255, 0.85);
  --color-text-secondary: rgba(255, 255, 255, 0.65);
  --color-text-tertiary: rgba(255, 255, 255, 0.45);
  --color-text-disabled: rgba(255, 255, 255, 0.25);
  --color-text-placeholder: rgba(255, 255, 255, 0.25);

  --color-border-primary: #424242;
  --color-border-secondary: #303030;

  --color-bg-page: #141414;
  --color-bg-container: #1f1f1f;
  --color-bg-elevated: #262626;
  --color-bg-mask: rgba(0, 0, 0, 0.65);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3),
               0 1px 6px -1px rgba(0, 0, 0, 0.2),
               0 2px 4px 0 rgba(0, 0, 0, 0.2);
  --shadow-base: 0 6px 16px 0 rgba(0, 0, 0, 0.32),
                 0 3px 6px -4px rgba(0, 0, 0, 0.48),
                 0 9px 28px 8px rgba(0, 0, 0, 0.2);
}
```

---

## 十四、附录

### A. 相关资源

- Ant Design 官网：https://ant.design
- Ant Design Pro：https://pro.ant.design
- Remix Icon 图标库：https://remixicon.com
- Element Plus 文档：https://element-plus.org

### B. 配色工具

- Ant Design 调色板：https://ant.design/docs/spec/colors
- ColorSpace：https://mycolor.space

### C. 字体资源

- 阿里巴巴普惠体：https://www.alibabafonts.com/#/font
- 思源黑体：https://fonts.google.com/specimen/Noto+Sans+SC

---

**文档版本**：v1.0  
**创建日期**：2025-12-19  
**适用项目**：Node-View 流程设计器

