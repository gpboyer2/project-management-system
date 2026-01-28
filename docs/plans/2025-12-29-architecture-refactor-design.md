# 表层架构梳理和规范化重构设计文档

日期：2025-12-29
分支：master

## 一、总体架构目标

### 前端重构目标

1. 建立清晰的模块职责边界 - components、views、stores、api 各司其职
2. 统一目录组织规范 - 按功能模块划分，便于快速定位和维护
3. 优化路由结构 - 使用 Vue Router hash 模式，路由命名与页面功能对应
4. 建立统一的类型定义体系 - TypeScript 接口与后端 API 响应格式完全一致

### 后端重构目标

1. 严格遵循 MVC 架构 - Controllers 处理请求响应，Services 处理业务逻辑，Models 处理数据
2. 统一 API 响应格式 - 使用 res.apiSuccess/res.apiError 工具函数
3. 规范 Router 文件结构 - 路由定义与 Swagger 文档分离
4. 建立清晰的错误处理机制

### 代码规范目标

1. 命名规范统一 - 变量使用 snake_case，集合变量使用 list 后缀
2. API 接口规范 - 禁止路径参数，使用请求体传参，天然支持批量操作
3. 返回值规范 - 明确返回 undefined，避免返回空字符串

## 二、前端架构重构方案

### 目录结构优化

```
client/src/
├── api/              # API 接口封装（按模块分组）
│   ├── index.ts
│   ├── auth.ts
│   ├── user.ts
│   └── ...
├── components/       # 公共组件（按功能分组）
│   ├── common/
│   └── business/
├── views/            # 页面组件（按路由模块分组）
│   ├── topology-display/
│   ├── flowchart/
│   └── ...
├── stores/           # Pinia 状态管理
├── router/           # 路由配置
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
├── layouts/          # 布局组件
└── styles/           # 全局样式
```

### 路由规范

- 使用 hash 模式：`/#/packet-config?mode=edit` 或 `/#/packet-config/edit`
- 路由命名与 views 目录结构对应

### API 调用规范

- 类型定义字段名必须与后端返回完全一致
- 调用时直接透传对象：`await api.update(id, data)`
- 多请求操作的用户提示统一处理

## 三、后端架构重构方案

### MVC 结构规范

```
server/mvc/
├── controllers/      # 控制器层
│   ├── auth.js
│   ├── user.js
│   └── ...
├── services/         # 业务逻辑层
│   ├── auth.js
│   ├── user.js
│   └── ...
└── models/          # 数据模型层
    ├── index.js
    ├── user.js
    └── ...
```

### 职责划分

- Controllers：接收请求、参数验证、调用 Service、返回响应
- Services：业务逻辑处理、异常捕获、数据操作、确保响应格式一致
- Models：数据模型定义、数据库查询方法

### Router 文件格式规范

上半部分 - 业务逻辑区：
- 路由定义（简洁中文注释 + 链式调用）
- CRUD 顺序：list → create → update → delete
- 路由之间 2 行空行

下半部分 - 文档定义区：
- Swagger API 文档
- 每个 Swagger 块之间 2 行空行

两区之间：3 行空行分隔

### API 响应规范

成功响应：
```javascript
{
  status: "success",
  message: "操作成功",
  data: {
    list: [],
    pagination: {
      current_page: 1,
      page_size: 20,
      total: 100
    }
  }
}
```

错误响应：
```javascript
{
  status: "error",
  message: "错误信息",
  data: null
}
```

## 四、规范化具体措施

### 命名规范统一

| 类别 | 规范 | 示例 |
|------|------|------|
| 数据库表名 | snake_case | `users`, `flowcharts` |
| 数据库字段 | snake_case | `user_name`, `created_at` |
| Model 字段 | snake_case | `user_name: DataTypes.STRING` |
| JS 变量 | snake_case | `const user_list = []` |
| 集合变量 | snake_case + list | `user_list`, `account_list` |
| JS 类名 | 保持原样 | `class User` |
| 函数/方法名 | 保持原样 | `getUserList()` |
| 前端类型 | snake_case | `interface User { user_name: string }` |

### API 接口设计规范

正确示例：
```javascript
router.post('/delete', authController.delete)
// 请求体：{ data: [1, 2, 3] }
```

错误示例：
```javascript
router.delete('/users/:id', authController.delete)
```

### 返回值规范

正确示例：
```javascript
function getUser(id) {
  if (!found) return undefined
  return user
}
```

错误示例：
```javascript
function getUser(id) {
  if (!found) return ''
  return user
}
```

## 五、实施计划

### 阶段一：分析与诊断

1. 前端架构分析
2. 后端架构分析
3. 依赖关系分析

### 阶段二：架构重构

1. 前端重构
2. 后端重构

### 阶段三：代码规范化

1. 命名规范统一
2. API 接口规范化

## 六、验证策略

### 检查清单

前端：
- 目录结构清晰
- 路由配置符合规范
- API 调用无字段转换
- 类型定义与后端一致

后端：
- MVC 三层职责清晰
- 使用 res.apiSuccess/res.apiError
- Router 文件格式规范
- 响应格式统一

代码规范：
- 变量名 snake_case
- 集合变量 list 后缀
- 无路径参数
- 返回值明确

### 测试方法

- 人工测试：用户手动启动服务验证
- 代码审查：逐个检查关键文件
- API 测试：使用 Swagger 文档

### 回滚策略

- 直接基于当前分支进行修改，不要新分支,且不用推送代码!
