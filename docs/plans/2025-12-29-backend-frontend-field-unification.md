# 前后端字段命名统一实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 统一前后端字段命名，前端完全使用后端的 snake_case 字段名，消除类型定义与实际使用的不一致问题。

**架构:** 修改前端类型定义、Store、组件和 API 调用，使字段命名与后端保持一致（snake_case）。

**技术栈:** TypeScript, Vue 3, Pinia, Element Plus

---

## 修改原则

1. **后端字段优先**: 前端字段名必须与后端完全一致
2. **保持后端命名风格**: snake_case（小写下划线）
3. **全量修改**: 一次性修改所有不一致的地方
4. **验证优先**: 每个步骤后验证代码可编译运行

---

## 字段映射表

| 前端当前字段 | 后端实际字段 | 修改后字段 |
|------------|-------------|-----------|
| `id` (User) | `user_id` | `user_id` |
| `username` | `user_name` | `user_name` |
| `nickname` | `real_name` | `real_name` |
| `roleId` | `role_id` | `role_id` |
| `createdAt` | `create_time` | `create_time` |
| `updatedAt` | `update_time` | `update_time` |
| `lastLoginAt` | `last_login_time` | `last_login_time` |
| `current_page` | `current_page` | `current_page` |
| `page_size` | `page_size` | `page_size` |
| `status: 'active'` | `status: 1/0` | `status: number` |

---

### Task 1: 修改 API 响应类型定义

**文件:**
- Modify: `client/src/api/index.ts:16-20`

**Step 1: 更新 ApiResponse 接口定义**

将 ApiResponse 接口改为匹配后端响应格式：

```typescript
// API响应类型定义（匹配后端响应格式）
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error'  // 响应状态：success 或 error
  data: T                      // 响应数据
  message: string              // 响应消息
}
```

**Step 2: 验证类型定义正确**

运行: `cd client && pnpm run build`
Expected: 编译成功，无类型错误

**Step 3: 提交修改**

```bash
git add client/src/api/index.ts
git commit -m "fix: 更新 ApiResponse 类型定义以匹配后端响应格式"
```

---

### Task 2: 修改 PaginationParams 分页类型定义

**文件:**
- Modify: `client/src/types/index.ts:26-30`

**Step 1: 更新 PaginationParams 接口**

```typescript
// 分页参数（使用 snake_case 匹配后端）
export interface PaginationParams {
  current_page: number  // 当前页码
  page_size: number     // 每页条数
  total?: number        // 总条数
}
```

**Step 2: 验证修改**

运行: `cd client && pnpm run build`
Expected: 编译成功（可能有类型错误，将在后续任务修复）

**Step 3: 提交修改**

```bash
git add client/src/types/index.ts
git commit -m "refactor: 分页参数字段改为 snake_case"
```

---

### Task 3: 修改 User 用户类型定义

**文件:**
- Modify: `client/src/types/index.ts:68-81`

**Step 1: 更新 User 接口定义**

```typescript
// 用户基础信息（使用 snake_case 匹配后端）
export interface User {
  user_id: string              // 用户ID
  user_name: string            // 用户名
  real_name?: string           // 真实姓名
  email?: string               // 邮箱
  avatar?: string              // 头像URL
  phone?: string               // 手机号
  role_id?: number             // 角色ID
  status: number               // 用户状态：1-正常，0-禁用
  create_time: string          // 创建时间
  update_time: string          // 更新时间
  last_login_time?: string     // 最后登录时间
}
```

**Step 2: 更新 UserProfile 接口**

```typescript
// 用户详细资料
export interface UserProfile extends User {
  bio?: string                  // 个人简介
  website?: string              // 个人网站
  location?: string             // 所在地
  company?: string              // 公司
}
```

**Step 3: 删除或注释不需要的接口**

```typescript
// 以下接口与后端不匹配，暂时注释
// export interface UserPreferences { ... }
// export interface NotificationSettings { ... }
```

**Step 4: 提交修改**

```bash
git add client/src/types/index.ts
git commit -m "refactor: User 类型字段改为 snake_case"
```

---

### Task 4: 修改认证相关类型定义

**文件:**
- Modify: `client/src/types/index.ts:111-143`

**Step 1: 更新认证相关接口**

```typescript
// 登录凭证（使用 snake_case 匹配后端）
export interface LoginCredentials {
  user_name: string      // 用户名
  password: string       // 密码
}

// JWT载荷（使用 snake_case 匹配后端）
export interface JwtPayload {
  user_id: string            // 用户ID
  user_name: string          // 用户名
  role_id: number            // 角色ID
  iat: number                // 签发时间
  exp: number                // 过期时间
}
```

**Step 2: 删除不匹配的接口**

```typescript
// 以下接口暂不使用，注释掉
// export interface RegisterData { ... }
// export interface AuthTokens { ... }
```

**Step 3: 提交修改**

```bash
git add client/src/types/index.ts
git commit -m "refactor: 认证相关类型字段改为 snake_case"
```

---

### Task 5: 修改 user.ts Store 中的字段使用

**文件:**
- Modify: `client/src/stores/user.ts`

**Step 1: 更新 UserStore 状态定义**

找到 UserStore 的 state 定义，将字段名改为 snake_case：

```typescript
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    refresh_token: localStorage.getItem('refresh_token') || '',
    user_id: undefined,        // 原 USER_ID
    user_name: undefined,       // 原 USER_NAME
    real_name: undefined,       // 原 REAL_NAME
    email: undefined,
    phone: undefined,
    role_id: undefined,         // 原 ROLE_ID
    status: undefined,          // 原 STATUS
    create_time: undefined,     // 原 CREATE_TIME
    update_time: undefined,     // 原 UPDATE_TIME
    permissions: [],
    roles: [],
  }),
  // ...
})
```

**Step 2: 更新 actions 中的字段引用**

将所有 actions 中的字段引用改为 snake_case：

```typescript
// 登录 action
async login(user_name: string, password: string) {
  const data = await authApi.login({ user_name, password })
  this.token = data.access_token
  this.user_id = data.user_id
  this.user_name = data.user_name
  // ...
}

// 获取用户信息 action
async getUserInfo() {
  const data = await userApi.getInfo()
  this.user_id = data.user_id
  this.user_name = data.user_name
  this.real_name = data.real_name
  // ...
}
```

**Step 3: 更新 getters 中的字段引用**

```typescript
getters: {
  // 用户显示名
  displayName(): string {
    return this.real_name || this.user_name || '未知用户'
  },
  // 是否已登录
  is_logged_in(): boolean {
    return !!this.token && !!this.user_id
  },
}
```

**Step 4: 提交修改**

```bash
git add client/src/stores/user.ts
git commit -m "refactor: UserStore 字段改为 snake_case"
```

---

### Task 6: 修改 user.ts API 文件中的字段使用

**文件:**
- Modify: `client/src/api/user.ts`

**Step 1: 更新 API 接口定义**

```typescript
export const userApi = {
  // 获取用户列表
  list: (params: {
    current_page?: number
    page_size?: number
    keyword?: string
    role_id?: number
    status?: number
    user_id?: number
  }) => apiClient.get('/users/list', params),

  // 创建用户
  create: (data: Array<{
    user_name: string
    password: string
    real_name?: string
    email?: string
    phone?: string
    role_id?: number
    status?: number
  }>) => apiClient.post('/users/create', data),

  // 更新用户
  update: (data: Array<{
    user_id: number
    user_name?: string
    password?: string
    real_name?: string
    email?: string
    phone?: string
    role_id?: number
    status?: number
  }>) => apiClient.post('/users/update', data),
}
```

**Step 2: 提交修改**

```bash
git add client/src/api/user.ts
git commit -m "refactor: userApi 字段改为 snake_case"
```

---

### Task 7: 全局搜索替换组件中的字段使用

**文件:**
- Modify: `client/src/views/**/*.vue`
- Modify: `client/src/components/**/*.vue`

**Step 1: 创建全局替换脚本**

创建 `client/scripts/replaceFields.js`：

```javascript
const fs = require('fs');
const path = require('path');

const replacements = [
  // User 字段
  { from: /\.user_id/g, to: '.user_id' },  // 已经是 snake_case，不需要改
  { from: /USER_ID/g, to: 'user_id' },
  { from: /\.user_name/g, to: '.user_name' },
  { from: /USER_NAME/g, to: 'user_name' },
  { from: /real_name/g, to: 'real_name' },
  { from: /REAL_NAME/g, to: 'real_name' },
  { from: /role_id/g, to: 'role_id' },
  { from: /ROLE_ID/g, to: 'role_id' },

  // 时间字段
  { from: /\.create_time/g, to: '.create_time' },
  { from: /CREATE_TIME/g, to: 'create_time' },
  { from: /\.update_time/g, to: '.update_time' },
  { from: /UPDATE_TIME/g, to: 'update_time' },

  // 分页字段
  { from: /current_page/g, to: 'current_page' },
  { from: /current_page/g, to: 'current_page' },
  { from: /page_size/g, to: 'page_size' },
  { from: /page_size/g, to: 'page_size' },
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (file !== 'node_modules' && file !== 'dist') {
        walkDirectory(filePath);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts')) {
      replaceInFile(filePath);
    }
  });
}

walkDirectory(path.join(__dirname, '../src'));
console.log('字段替换完成！');
```

**Step 2: 运行替换脚本**

```bash
cd client
node scripts/replaceFields.js
```

**Step 3: 手动检查和修复**

检查以下文件，确保替换正确：
- `client/src/views/user/index.vue`
- `client/src/views/user/detail.vue`
- `client/src/components/xxx.vue`

**Step 4: 提交修改**

```bash
git add client/src
git commit -m "refactor: 组件字段改为 snake_case"
```

---

### Task 8: 修改 auth.ts Store 中的字段使用

**文件:**
- Modify: `client/src/stores/auth.ts`

**Step 1: 检查 authStore 中的字段使用**

如果有使用 `userId`、`username` 等字段，改为 `user_id`、`user_name`。

**Step 2: 提交修改**

```bash
git add client/src/stores/auth.ts
git commit -m "refactor: authStore 字段改为 snake_case"
```

---

### Task 9: 修改 API 请求拦截器

**文件:**
- Modify: `client/src/api/index.ts:77-124`

**Step 1: 检查请求拦截器中的字段使用**

确保 token 相关字段使用 snake_case：

```typescript
// 添加认证token
const userStore = useUserStore();
if (userStore.token) {
  config.headers.Authorization = `Bearer ${userStore.token}`;
}
```

**Step 2: 提交修改**

```bash
git add client/src/api/index.ts
git commit -m "refactor: 请求拦截器字段优化"
```

---

### Task 10: 验证修改

**Step 1: 执行 lint 检查**

```bash
cd client
pnpm lint
```

Expected: lint 通过，无错误（允许有警告）

**Step 2: 执行 build 编译**

```bash
pnpm build
```

Expected: 编译成功

**Step 3: 检查类型错误**

如果有类型错误，逐个修复：
- 检查类型定义是否正确
- 检查 API 调用是否匹配
- 检查组件使用是否正确

**Step 4: 提交最终修改**

```bash
git add client
git commit -m "fix: 修复字段统一后的类型错误"
```

---

## 注意事项

1. **后端字段优先**: 前端字段名必须与后端完全一致
2. **保持数据类型**: 后端使用数字类型的枚举，前端也要使用数字
3. **全量修改**: 不要遗漏任何一处字段使用
4. **验证优先**: 每个步骤后都要验证代码可编译运行
5. **提交频率**: 每完成一个文件就提交一次

---

## 完成检查清单

- [ ] ApiResponse 类型定义已更新
- [ ] PaginationParams 类型定义已更新
- [ ] User 类型定义已更新
- [ ] 认证相关类型定义已更新
- [ ] userStore 字段已更新
- [ ] authStore 字段已更新
- [ ] userApi 字段已更新
- [ ] 组件字段已全局替换
- [ ] lint 检查通过
- [ ] build 编译成功
