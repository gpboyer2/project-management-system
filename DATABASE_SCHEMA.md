# 项目管理系统数据库设计

## 系统概述

本系统是一个企业级项目管理平台，参考 Jira 和 Gitee 的项目管理理念，提供项目立项审核、全生命周期管理、流程审批引擎和任务分配跟踪功能。

## 核心业务模块

### 需求管理模块
- 需求创建与编辑
- 需求状态跟踪
- 需求优先级管理
- 需求分类与标签
- 需求关联关系

### 任务管理模块
- 任务创建与分配
- 任务状态跟踪
- 任务优先级管理
- 任务依赖关系
- 任务工时统计

### 缺陷管理模块
- 缺陷创建与编辑
- 缺陷状态跟踪
- 缺陷严重程度管理
- 缺陷关联需求/任务
- 缺陷修复过程跟踪

### 项目管理模块
- 项目创建与配置
- 项目团队管理
- 项目阶段管理
- 项目进度跟踪

### 流程管理模块
- 工作流定义
- 流程节点配置
- 审批流程管理
- 流程实例跟踪

## 数据库表结构设计

### 需求管理表 (requirements)

```sql
CREATE TABLE IF NOT EXISTS requirements (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_name STRING NOT NULL COMMENT '需求名称',
    requirement_type STRING NOT NULL COMMENT '需求类型：业务需求、技术需求、产品需求',
    description TEXT COMMENT '需求描述',
    priority STRING NOT NULL COMMENT '优先级：P0, P1, P2, P3',
    status STRING NOT NULL COMMENT '状态：待设计、待产品评审、待技术评审、开发中、测试中、已上线、已结束',
    current_assignee_id INTEGER COMMENT '当前负责人用户ID',
    reporter_id INTEGER NOT NULL COMMENT '提出人用户ID',
    project_id INTEGER COMMENT '所属项目ID',
    planned_version STRING COMMENT '规划版本',
    actual_version STRING COMMENT '实际上线版本',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| requirement_id | INTEGER | 否 | 主键，自增 |
| requirement_name | STRING | 否 | 需求名称 |
| requirement_type | STRING | 否 | 需求类型：业务需求、技术需求、产品需求 |
| description | TEXT | 是 | 需求描述 |
| priority | STRING | 否 | 优先级：P0, P1, P2, P3 |
| status | STRING | 否 | 状态：待设计、待产品评审、待技术评审、开发中、测试中、已上线、已结束 |
| current_assignee_id | INTEGER | 是 | 当前负责人用户ID |
| reporter_id | INTEGER | 否 | 提出人用户ID |
| project_id | INTEGER | 是 | 所属项目ID |
| planned_version | STRING | 是 | 规划版本 |
| actual_version | STRING | 是 | 实际上线版本 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 任务管理表 (tasks)

```sql
CREATE TABLE IF NOT EXISTS tasks (
    task_id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_name STRING NOT NULL COMMENT '任务名称',
    description TEXT COMMENT '任务描述',
    priority STRING NOT NULL COMMENT '优先级：P0, P1, P2, P3',
    status STRING NOT NULL COMMENT '状态：未开始、进行中、已完成、已取消',
    assignee_id INTEGER COMMENT '负责人用户ID',
    reporter_id INTEGER NOT NULL COMMENT '创建人用户ID',
    requirement_id INTEGER COMMENT '关联需求ID',
    project_id INTEGER COMMENT '所属项目ID',
    estimated_hours DECIMAL(10,2) COMMENT '预估工时(小时)',
    actual_hours DECIMAL(10,2) COMMENT '实际工时(小时)',
    start_time INTEGER COMMENT '开始时间，Unix时间戳',
    end_time INTEGER COMMENT '结束时间，Unix时间戳',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| task_id | INTEGER | 否 | 主键，自增 |
| task_name | STRING | 否 | 任务名称 |
| description | TEXT | 是 | 任务描述 |
| priority | STRING | 否 | 优先级：P0, P1, P2, P3 |
| status | STRING | 否 | 状态：未开始、进行中、已完成、已取消 |
| assignee_id | INTEGER | 是 | 负责人用户ID |
| reporter_id | INTEGER | 否 | 创建人用户ID |
| requirement_id | INTEGER | 是 | 关联需求ID |
| project_id | INTEGER | 是 | 所属项目ID |
| estimated_hours | DECIMAL(10,2) | 是 | 预估工时(小时) |
| actual_hours | DECIMAL(10,2) | 是 | 实际工时(小时) |
| start_time | INTEGER | 是 | 开始时间，Unix时间戳 |
| end_time | INTEGER | 是 | 结束时间，Unix时间戳 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 缺陷管理表 (defects)

```sql
CREATE TABLE IF NOT EXISTS defects (
    defect_id INTEGER PRIMARY KEY AUTOINCREMENT,
    defect_name STRING NOT NULL COMMENT '缺陷名称',
    description TEXT COMMENT '缺陷描述',
    severity STRING NOT NULL COMMENT '严重程度：致命、严重、一般、轻微',
    status STRING NOT NULL COMMENT '状态：待修复、修复中、已修复、已验证、已关闭',
    assignee_id INTEGER COMMENT '负责人用户ID',
    reporter_id INTEGER NOT NULL COMMENT '报告人用户ID',
    requirement_id INTEGER COMMENT '关联需求ID',
    task_id INTEGER COMMENT '关联任务ID',
    project_id INTEGER COMMENT '所属项目ID',
    reproduce_steps TEXT COMMENT '复现步骤',
    fix_version STRING COMMENT '修复版本',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| defect_id | INTEGER | 否 | 主键，自增 |
| defect_name | STRING | 否 | 缺陷名称 |
| description | TEXT | 是 | 缺陷描述 |
| severity | STRING | 否 | 严重程度：致命、严重、一般、轻微 |
| status | STRING | 否 | 状态：待修复、修复中、已修复、已验证、已关闭 |
| assignee_id | INTEGER | 是 | 负责人用户ID |
| reporter_id | INTEGER | 否 | 报告人用户ID |
| requirement_id | INTEGER | 是 | 关联需求ID |
| task_id | INTEGER | 是 | 关联任务ID |
| project_id | INTEGER | 是 | 所属项目ID |
| reproduce_steps | TEXT | 是 | 复现步骤 |
| fix_version | STRING | 是 | 修复版本 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 项目管理表 (projects)

```sql
CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name STRING NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    status STRING NOT NULL COMMENT '状态：待立项、进行中、已暂停、已完成、已取消',
    manager_id INTEGER NOT NULL COMMENT '项目负责人用户ID',
    department_id INTEGER COMMENT '所属部门ID',
    start_date INTEGER COMMENT '开始日期，Unix时间戳',
    end_date INTEGER COMMENT '结束日期，Unix时间戳',
    budget DECIMAL(15,2) COMMENT '项目预算',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| project_id | INTEGER | 否 | 主键，自增 |
| project_name | STRING | 否 | 项目名称 |
| description | TEXT | 是 | 项目描述 |
| status | STRING | 否 | 状态：待立项、进行中、已暂停、已完成、已取消 |
| manager_id | INTEGER | 否 | 项目负责人用户ID |
| department_id | INTEGER | 是 | 所属部门ID |
| start_date | INTEGER | 是 | 开始日期，Unix时间戳 |
| end_date | INTEGER | 是 | 结束日期，Unix时间戳 |
| budget | DECIMAL(15,2) | 是 | 项目预算 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 项目团队表 (project_teams)

```sql
CREATE TABLE IF NOT EXISTS project_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL COMMENT '项目ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    role STRING NOT NULL COMMENT '角色：项目经理、开发工程师、测试工程师、UI设计师、产品经理',
    status INTEGER DEFAULT 1 COMMENT '状态：1-正常 0-已移除',
    join_time INTEGER COMMENT '加入时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| project_id | INTEGER | 否 | 项目ID |
| user_id | INTEGER | 否 | 用户ID |
| role | STRING | 否 | 角色：项目经理、开发工程师、测试工程师、UI设计师、产品经理 |
| status | INTEGER | 否 | 状态：1-正常 0-已移除，默认1 |
| join_time | INTEGER | 是 | 加入时间，Unix时间戳 |

### 流程管理表 (workflows)

```sql
CREATE TABLE IF NOT EXISTS workflows (
    workflow_id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name STRING NOT NULL COMMENT '流程名称',
    description TEXT COMMENT '流程描述',
    workflow_type STRING NOT NULL COMMENT '流程类型：需求流程、任务流程、缺陷流程、项目流程',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| workflow_id | INTEGER | 否 | 主键，自增 |
| workflow_name | STRING | 否 | 流程名称 |
| description | TEXT | 是 | 流程描述 |
| workflow_type | STRING | 否 | 流程类型：需求流程、任务流程、缺陷流程、项目流程 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 流程节点表 (workflow_nodes)

```sql
CREATE TABLE IF NOT EXISTS workflow_nodes (
    node_id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL COMMENT '流程ID',
    node_name STRING NOT NULL COMMENT '节点名称',
    node_type STRING NOT NULL COMMENT '节点类型：开始节点、审批节点、执行节点、结束节点',
    node_order INTEGER NOT NULL COMMENT '节点顺序',
    assignee_type STRING COMMENT '负责人类型：固定用户、角色、部门',
    assignee_id INTEGER COMMENT '负责人ID',
    duration_limit INTEGER COMMENT '处理时限(小时)',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| node_id | INTEGER | 否 | 主键，自增 |
| workflow_id | INTEGER | 否 | 流程ID |
| node_name | STRING | 否 | 节点名称 |
| node_type | STRING | 否 | 节点类型：开始节点、审批节点、执行节点、结束节点 |
| node_order | INTEGER | 否 | 节点顺序 |
| assignee_type | STRING | 是 | 负责人类型：固定用户、角色、部门 |
| assignee_id | INTEGER | 是 | 负责人ID |
| duration_limit | INTEGER | 是 | 处理时限(小时) |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 流程实例表 (workflow_instances)

```sql
CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL COMMENT '流程ID',
    business_type STRING NOT NULL COMMENT '业务类型：需求、任务、缺陷、项目',
    business_id INTEGER NOT NULL COMMENT '业务ID',
    current_node_id INTEGER COMMENT '当前节点ID',
    status STRING NOT NULL COMMENT '状态：运行中、已完成、已取消',
    create_user_id INTEGER NOT NULL COMMENT '创建人用户ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| instance_id | INTEGER | 否 | 主键，自增 |
| workflow_id | INTEGER | 否 | 流程ID |
| business_type | STRING | 否 | 业务类型：需求、任务、缺陷、项目 |
| business_id | INTEGER | 否 | 业务ID |
| current_node_id | INTEGER | 是 | 当前节点ID |
| status | STRING | 否 | 状态：运行中、已完成、已取消 |
| create_user_id | INTEGER | 否 | 创建人用户ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 流程执行记录表 (workflow_executions)

```sql
CREATE TABLE IF NOT EXISTS workflow_executions (
    execution_id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL COMMENT '流程实例ID',
    node_id INTEGER NOT NULL COMMENT '节点ID',
    executor_id INTEGER NOT NULL COMMENT '执行人用户ID',
    action STRING NOT NULL COMMENT '操作：通过、驳回、转发',
    comment TEXT COMMENT '审批意见',
    start_time INTEGER NOT NULL COMMENT '开始时间，Unix时间戳',
    end_time INTEGER COMMENT '结束时间，Unix时间戳',
    duration INTEGER COMMENT '处理时长(分钟)',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| execution_id | INTEGER | 否 | 主键，自增 |
| instance_id | INTEGER | 否 | 流程实例ID |
| node_id | INTEGER | 否 | 节点ID |
| executor_id | INTEGER | 否 | 执行人用户ID |
| action | STRING | 否 | 操作：通过、驳回、转发 |
| comment | TEXT | 是 | 审批意见 |
| start_time | INTEGER | 否 | 开始时间，Unix时间戳 |
| end_time | INTEGER | 是 | 结束时间，Unix时间戳 |
| duration | INTEGER | 是 | 处理时长(分钟) |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 标签管理表 (tags)

```sql
CREATE TABLE IF NOT EXISTS tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name STRING NOT NULL COMMENT '标签名称',
    tag_color STRING COMMENT '标签颜色',
    description STRING COMMENT '标签描述',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| tag_id | INTEGER | 否 | 主键，自增 |
| tag_name | STRING | 否 | 标签名称 |
| tag_color | STRING | 是 | 标签颜色 |
| description | STRING | 是 | 标签描述 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求标签关联表 (requirement_tags)

```sql
CREATE TABLE IF NOT EXISTS requirement_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL COMMENT '需求ID',
    tag_id INTEGER NOT NULL COMMENT '标签ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| requirement_id | INTEGER | 否 | 需求ID |
| tag_id | INTEGER | 否 | 标签ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 评论管理表 (comments)

```sql
CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type STRING NOT NULL COMMENT '业务类型：需求、任务、缺陷',
    business_id INTEGER NOT NULL COMMENT '业务ID',
    user_id INTEGER NOT NULL COMMENT '评论人用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_comment_id INTEGER COMMENT '父评论ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| comment_id | INTEGER | 否 | 主键，自增 |
| business_type | STRING | 否 | 业务类型：需求、任务、缺陷 |
| business_id | INTEGER | 否 | 业务ID |
| user_id | INTEGER | 否 | 评论人用户ID |
| content | TEXT | 否 | 评论内容 |
| parent_comment_id | INTEGER | 是 | 父评论ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 操作记录表 (operation_records)

```sql
CREATE TABLE IF NOT EXISTS operation_records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type STRING NOT NULL COMMENT '业务类型：需求、任务、缺陷',
    business_id INTEGER NOT NULL COMMENT '业务ID',
    user_id INTEGER NOT NULL COMMENT '操作人用户ID',
    operation_type STRING NOT NULL COMMENT '操作类型：创建、更新、删除、状态变更',
    operation_detail TEXT COMMENT '操作详情',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| record_id | INTEGER | 否 | 主键，自增 |
| business_type | STRING | 否 | 业务类型：需求、任务、缺陷 |
| business_id | INTEGER | 否 | 业务ID |
| user_id | INTEGER | 否 | 操作人用户ID |
| operation_type | STRING | 否 | 操作类型：创建、更新、删除、状态变更 |
| operation_detail | TEXT | 是 | 操作详情 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 通知管理表 (notifications)

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL COMMENT '接收用户ID',
    title STRING NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    type STRING NOT NULL COMMENT '通知类型：系统通知、业务通知、提醒',
    status INTEGER DEFAULT 0 COMMENT '阅读状态：0-未读 1-已读',
    business_type STRING COMMENT '关联业务类型',
    business_id INTEGER COMMENT '关联业务ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| notification_id | INTEGER | 否 | 主键，自增 |
| user_id | INTEGER | 否 | 接收用户ID |
| title | STRING | 否 | 通知标题 |
| content | TEXT | 是 | 通知内容 |
| type | STRING | 否 | 通知类型：系统通知、业务通知、提醒 |
| status | INTEGER | 否 | 阅读状态：0-未读 1-已读，默认0 |
| business_type | STRING | 是 | 关联业务类型 |
| business_id | INTEGER | 是 | 关联业务ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

## 与现有表的关系

### 用户认证与权限管理表 (已存在)

#### 用户表 (users)

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name STRING NOT NULL COMMENT '用户名',
    password STRING NOT NULL COMMENT '密码',
    real_name STRING COMMENT '真实姓名',
    email STRING COMMENT '邮箱',
    phone STRING COMMENT '电话',
    avatar STRING COMMENT '头像',
    role_id INTEGER COMMENT '角色ID',
    status INTEGER DEFAULT 1 COMMENT '状态：0-禁用 1-正常',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳',
    last_login_time INTEGER COMMENT '最后登录时间，Unix时间戳',
    last_login_ip STRING COMMENT '最后登录IP'
);
```

#### 角色表 (roles)

```sql
CREATE TABLE IF NOT EXISTS roles (
    role_id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name STRING NOT NULL COMMENT '角色名称',
    role_code STRING NOT NULL COMMENT '角色代码',
    description STRING COMMENT '角色描述',
    status INTEGER DEFAULT 1 COMMENT '状态：0-禁用 1-正常',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

#### 权限表 (permissions)

```sql
CREATE TABLE IF NOT EXISTS permissions (
    permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name STRING NOT NULL COMMENT '权限名称',
    permission_code STRING NOT NULL COMMENT '权限代码',
    resource_type STRING COMMENT '资源类型',
    resource_path STRING COMMENT '资源路径',
    description STRING COMMENT '权限描述',
    parent_id INTEGER COMMENT '父权限ID',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    status INTEGER DEFAULT 1 COMMENT '状态：0-禁用 1-正常',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

#### 角色权限关联表 (role_permissions)

```sql
CREATE TABLE IF NOT EXISTS role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL COMMENT '角色ID',
    permission_id INTEGER NOT NULL COMMENT '权限ID'
);
```

#### 用户会话表 (user_sessions)

```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id STRING PRIMARY KEY COMMENT '会话ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    token STRING NOT NULL COMMENT '访问令牌',
    refresh_token STRING COMMENT '刷新令牌',
    ip_address STRING COMMENT 'IP地址',
    user_agent STRING COMMENT '用户代理',
    expires_at INTEGER COMMENT '过期时间，Unix时间戳',
    status INTEGER DEFAULT 1 COMMENT '状态：0-无效 1-有效',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

#### 操作日志表 (operation_logs)

```sql
CREATE TABLE IF NOT EXISTS operation_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER COMMENT '用户ID',
    operation_type STRING NOT NULL COMMENT '操作类型',
    operation_detail TEXT COMMENT '操作详情',
    ip_address STRING COMMENT 'IP地址',
    user_agent STRING COMMENT '用户代理',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

### 关联关系
- 所有业务表通过 `user_id` 字段关联到 `users` 表
- 项目团队表通过 `project_id` 关联到 `projects` 表
- 需求、任务、缺陷通过 `project_id` 关联到 `projects` 表
- 任务、缺陷通过 `requirement_id` 关联到 `requirements` 表
- 缺陷通过 `task_id` 关联到 `tasks` 表
- 流程相关表通过 `workflow_id` 和 `node_id` 建立关联关系

## 数据安全与索引优化

### 数据安全
- 所有表都包含 `create_time` 和 `update_time` 字段用于审计
- 敏感数据字段使用适当的加密存储
- 外键约束确保数据一致性

### 索引优化（开发阶段规范）
- **核心原则**：开发阶段不关注数据库性能，索引会增加数据迁移复杂度
- **强制规则**：禁止在 Sequelize 模型中定义任何索引（indexes 配置）
- **禁止行为**：禁止在代码中手动创建索引，只保留主键索引（PRIMARY KEY）
- **生产环境**：生产环境部署时再根据性能需求添加必要索引

原因：索引约束（如 UNIQUE）会导致数据迁移失败，开发阶段数据量小无需考虑查询性能，索引增加表结构变更的复杂度

## 扩展建议

### 性能优化
- 根据数据量和查询频率优化索引
- 考虑分区表设计以提高大数据量查询性能
- 实现缓存策略减少数据库访问压力

### 功能扩展
- 添加自定义字段支持
- 实现高级搜索和筛选功能
- 增加数据导出和报表功能
- 添加时间轴和甘特图支持

### 集成建议
- 与邮件系统集成实现通知推送
- 与企业微信/钉钉集成实现消息通知
- 与代码管理系统集成实现需求-代码关联
- 与持续集成系统集成实现自动化测试

## 维护说明

### 数据库备份
- 定期备份数据库
- 实现增量备份策略
- 测试备份恢复过程

### 性能监控
- 监控数据库性能指标
- 优化慢查询
- 分析并优化查询执行计划

### 数据清理
- 定期清理过期数据
- 优化历史数据存储策略
- 实现数据归档功能
