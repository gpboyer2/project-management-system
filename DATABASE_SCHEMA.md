# Ww项目管理系统数据库设计

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name STRING NOT NULL COMMENT '需求名称',
    type_id INTEGER NOT NULL COMMENT '需求类型ID，关联requirement_types表',
    description TEXT COMMENT '需求描述',
    priority INTEGER NOT NULL COMMENT '优先级：1-P0 2-P1 3-P2 4-P3',
    status_id INTEGER NOT NULL COMMENT '需求状态ID，关联requirement_statuses表',
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
| id | INTEGER | 否 | 主键，自增 |
| name | STRING | 否 | 需求名称 |
| type_id | INTEGER | 否 | 需求类型ID，关联requirement_types表 |
| description | TEXT | 是 | 需求描述 |
| priority | INTEGER | 否 | 优先级：1-P0 2-P1 3-P2 4-P3 |
| status_id | INTEGER | 否 | 需求状态ID，关联requirement_statuses表 |
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name STRING NOT NULL COMMENT '任务名称',
    description TEXT COMMENT '任务描述',
    status_id INTEGER NOT NULL COMMENT '任务状态ID，关联requirement_task_statuses表',
    assignee_id INTEGER COMMENT '负责人用户ID',
    reporter_id INTEGER NOT NULL COMMENT '创建人用户ID',
    requirement_id INTEGER COMMENT '关联需求ID',
    review_id INTEGER COMMENT '关联评审ID',
    requirement_node_id INTEGER COMMENT '需求管理流程节点ID，关联requirement_process_nodes表',
    review_node_id INTEGER COMMENT '评审管理流程节点ID，关联review_process_nodes表',
    priority INTEGER NOT NULL COMMENT '优先级：1-P0 2-P1 3-P2 4-P3',
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
| id | INTEGER | 否 | 主键，自增 |
| name | STRING | 否 | 任务名称 |
| description | TEXT | 是 | 任务描述 |
| status_id | INTEGER | 否 | 任务状态ID，关联requirement_task_statuses表 |
| assignee_id | INTEGER | 是 | 负责人用户ID |
| reporter_id | INTEGER | 否 | 创建人用户ID |
| requirement_id | INTEGER | 是 | 关联需求ID |
| review_id | INTEGER | 是 | 关联评审ID |
| requirement_node_id | INTEGER | 是 | 需求管理流程节点ID，关联requirement_process_nodes表 |
| review_node_id | INTEGER | 是 | 评审管理流程节点ID，关联review_process_nodes表 |
| priority | INTEGER | 否 | 优先级：1-P0 2-P1 3-P2 4-P3 |
| estimated_hours | DECIMAL(10,2) | 是 | 预估工时(小时) |
| actual_hours | DECIMAL(10,2) | 是 | 实际工时(小时) |
| start_time | INTEGER | 是 | 开始时间，Unix时间戳 |
| end_time | INTEGER | 是 | 结束时间，Unix时间戳 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |


### 项目管理表 (projects)

```sql
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name STRING NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    status INTEGER NOT NULL COMMENT '状态：1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消',
    manager_id INTEGER NOT NULL COMMENT '项目负责人用户ID',
    start_date INTEGER COMMENT '开始日期，Unix时间戳',
    end_date INTEGER COMMENT '结束日期，Unix时间戳',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```


### 流程节点类型表 (process_node_types)

```sql
CREATE TABLE IF NOT EXISTS process_node_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_type_name STRING NOT NULL COMMENT '流程节点类型名称：需求评审、技术设计、开发、测试、上线',
    description TEXT COMMENT '流程节点类型描述',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| node_type_name | STRING | 否 | 流程节点类型名称：需求评审、技术设计、开发、测试、上线 |
| description | TEXT | 是 | 流程节点类型描述 |
| sort_order | INTEGER | 否 | 排序顺序，默认0 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求管理流程节点表 (requirement_process_nodes)

```sql
CREATE TABLE IF NOT EXISTS requirement_process_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL COMMENT '关联需求ID',
    name STRING NOT NULL COMMENT '节点名称',
    node_type_id INTEGER NOT NULL COMMENT '流程节点类型ID，关联process_node_types表',
    parent_node_id INTEGER COMMENT '父节点ID，支持树形结构',
    node_order INTEGER NOT NULL COMMENT '节点顺序',
    assignee_type INTEGER COMMENT '负责人类型：1-固定用户 2-角色 3-部门',
    assignee_id INTEGER COMMENT '负责人ID',
    duration_limit INTEGER COMMENT '处理时限(小时)',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| requirement_id | INTEGER | 否 | 关联需求ID |
| name | STRING | 否 | 节点名称 |
| node_type_id | INTEGER | 否 | 流程节点类型ID，关联process_node_types表 |
| parent_node_id | INTEGER | 是 | 父节点ID，支持树形结构 |
| node_order | INTEGER | 否 | 节点顺序 |
| assignee_type | INTEGER | 是 | 负责人类型：1-固定用户 2-角色 3-部门 |
| assignee_id | INTEGER | 是 | 负责人ID |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求管理流程节点关系表 (requirement_process_node_relations)

```sql
CREATE TABLE IF NOT EXISTS requirement_process_node_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL COMMENT '关联需求ID',
    source_node_id INTEGER NOT NULL COMMENT '源节点ID',
    target_node_id INTEGER NOT NULL COMMENT '目标节点ID',
    relation_type INTEGER DEFAULT 1 COMMENT '关系类型：1-顺序 2-并行 3-条件',
    condition TEXT COMMENT '条件表达式（如：状态=通过）',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| requirement_id | INTEGER | 否 | 关联需求ID |
| source_node_id | INTEGER | 否 | 源节点ID |
| target_node_id | INTEGER | 否 | 目标节点ID |
| relation_type | INTEGER | 否 | 关系类型：1-顺序 2-并行 3-条件，默认1 |
| condition | TEXT | 是 | 条件表达式（如：状态=通过） |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 需求管理流程节点用户关联表 (requirement_process_node_users)

```sql
CREATE TABLE IF NOT EXISTS requirement_process_node_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL COMMENT '流程节点ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    role_type INTEGER DEFAULT 1 COMMENT '用户角色类型：1-负责人 2-参与者 3-观察者',
    status INTEGER DEFAULT 1 COMMENT '状态：1-正常 0-已移除',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| node_id | INTEGER | 否 | 流程节点ID |
| user_id | INTEGER | 否 | 用户ID |
| role_type | INTEGER | 否 | 用户角色类型：1-负责人 2-参与者 3-观察者，默认1 |
| status | INTEGER | 否 | 状态：1-正常 0-已移除，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 评审管理流程节点表 (review_process_nodes)

```sql
CREATE TABLE IF NOT EXISTS review_process_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL COMMENT '关联评审ID',
    name STRING NOT NULL COMMENT '节点名称',
    node_type_id INTEGER NOT NULL COMMENT '流程节点类型ID，关联process_node_types表',
    parent_node_id INTEGER COMMENT '父节点ID，支持树形结构',
    node_order INTEGER NOT NULL COMMENT '节点顺序',
    assignee_type INTEGER COMMENT '负责人类型：1-固定用户 2-角色 3-部门',
    assignee_id INTEGER COMMENT '负责人ID',
    duration_limit INTEGER COMMENT '处理时限(小时)',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| review_id | INTEGER | 否 | 关联评审ID |
| name | STRING | 否 | 节点名称 |
| node_type_id | INTEGER | 否 | 流程节点类型ID，关联process_node_types表 |
| parent_node_id | INTEGER | 是 | 父节点ID，支持树形结构 |
| node_order | INTEGER | 否 | 节点顺序 |
| assignee_type | INTEGER | 是 | 负责人类型：1-固定用户 2-角色 3-部门 |
| assignee_id | INTEGER | 是 | 负责人ID |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 评审管理流程节点关系表 (review_process_node_relations)

```sql
CREATE TABLE IF NOT EXISTS review_process_node_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL COMMENT '关联评审ID',
    source_node_id INTEGER NOT NULL COMMENT '源节点ID',
    target_node_id INTEGER NOT NULL COMMENT '目标节点ID',
    relation_type INTEGER DEFAULT 1 COMMENT '关系类型：1-顺序 2-并行 3-条件',
    condition TEXT COMMENT '条件表达式（如：状态=通过）',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| review_id | INTEGER | 否 | 关联评审ID |
| source_node_id | INTEGER | 否 | 源节点ID |
| target_node_id | INTEGER | 否 | 目标节点ID |
| relation_type | INTEGER | 否 | 关系类型：1-顺序 2-并行 3-条件，默认1 |
| condition | TEXT | 是 | 条件表达式（如：状态=通过） |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 评审管理流程节点用户关联表 (review_process_node_users)

```sql
CREATE TABLE IF NOT EXISTS review_process_node_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL COMMENT '流程节点ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    role_type INTEGER DEFAULT 1 COMMENT '用户角色类型：1-负责人 2-参与者 3-观察者',
    status INTEGER DEFAULT 1 COMMENT '状态：1-正常 0-已移除',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| node_id | INTEGER | 否 | 流程节点ID |
| user_id | INTEGER | 否 | 用户ID |
| role_type | INTEGER | 否 | 用户角色类型：1-负责人 2-参与者 3-观察者，默认1 |
| status | INTEGER | 否 | 状态：1-正常 0-已移除，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求类型表 (requirement_types)

```sql
CREATE TABLE IF NOT EXISTS requirement_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name STRING NOT NULL COMMENT '需求类型名称：业务需求、技术需求、产品需求',
    description TEXT COMMENT '需求类型描述',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| type_name | STRING | 否 | 需求类型名称：业务需求、技术需求、产品需求 |
| description | TEXT | 是 | 需求类型描述 |
| sort_order | INTEGER | 否 | 排序顺序，默认0 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求状态表 (requirement_statuses)

```sql
CREATE TABLE IF NOT EXISTS requirement_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_name STRING NOT NULL COMMENT '需求状态名称：待设计、待产品评审、待技术评审、开发中、测试中、已上线、已结束',
    description TEXT COMMENT '需求状态描述',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| status_name | STRING | 否 | 需求状态名称：待设计、待产品评审、待技术评审、开发中、测试中、已上线、已结束 |
| description | TEXT | 是 | 需求状态描述 |
| sort_order | INTEGER | 否 | 排序顺序，默认0 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 需求任务状态表 (requirement_task_statuses)

```sql
CREATE TABLE IF NOT EXISTS requirement_task_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status_name STRING NOT NULL COMMENT '任务状态名称：未开始、进行中、已完成、已取消',
    description TEXT COMMENT '任务状态描述',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| status_name | STRING | 否 | 任务状态名称：未开始、进行中、已完成、已取消 |
| description | TEXT | 是 | 任务状态描述 |
| sort_order | INTEGER | 否 | 排序顺序，默认0 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |


### 评论管理表 (comments)

```sql
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type INTEGER NOT NULL COMMENT '业务类型：1-需求 2-任务',
    business_id INTEGER NOT NULL COMMENT '业务ID',
    user_id INTEGER NOT NULL COMMENT '评论人用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_id INTEGER COMMENT '父评论ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| business_type | INTEGER | 否 | 业务类型：1-需求 2-任务 |
| business_id | INTEGER | 否 | 业务ID |
| user_id | INTEGER | 否 | 评论人用户ID |
| content | TEXT | 否 | 评论内容 |
| parent_id | INTEGER | 是 | 父评论ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 操作记录表 (operation_records)

```sql
CREATE TABLE IF NOT EXISTS operation_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type INTEGER NOT NULL COMMENT '业务类型：1-需求 2-任务 3-项目 4-流程节点 5-评审维度',
    business_id INTEGER NOT NULL COMMENT '关联的业务ID',
    user_id INTEGER NOT NULL COMMENT '操作人用户ID',
    operation_type INTEGER NOT NULL COMMENT '操作类型：1-创建 2-更新 3-删除 4-状态变更 5-分配 6-评论 7-审批',
    operation_detail TEXT COMMENT '操作详情（JSON格式，包含变更前和变更后的数据）',
    ip_address STRING COMMENT '操作人IP地址',
    user_agent STRING COMMENT '用户代理（浏览器信息）',
    create_time INTEGER COMMENT '操作时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| business_type | INTEGER | 否 | 业务类型：1-需求 2-任务 3-项目 4-流程节点 5-评审维度 |
| business_id | INTEGER | 否 | 关联的业务ID |
| user_id | INTEGER | 否 | 操作人用户ID |
| operation_type | INTEGER | 否 | 操作类型：1-创建 2-更新 3-删除 4-状态变更 5-分配 6-评论 7-审批 |
| operation_detail | TEXT | 是 | 操作详情（JSON格式，包含变更前和变更后的数据） |
| ip_address | STRING | 是 | 操作人IP地址 |
| user_agent | STRING | 是 | 用户代理（浏览器信息） |
| create_time | INTEGER | 是 | 操作时间，Unix时间戳 |

### 通知管理表 (notifications)

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL COMMENT '接收用户ID',
    title STRING NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    type INTEGER NOT NULL COMMENT '通知类型：1-系统通知 2-业务通知 3-提醒',
    status INTEGER DEFAULT 0 COMMENT '阅读状态：0-未读 1-已读',
    business_type INTEGER COMMENT '关联业务类型',
    business_id INTEGER COMMENT '关联业务ID',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| user_id | INTEGER | 否 | 接收用户ID |
| title | STRING | 否 | 通知标题 |
| content | TEXT | 是 | 通知内容 |
| type | INTEGER | 否 | 通知类型：1-系统通知 2-业务通知 3-提醒 |
| status | INTEGER | 否 | 阅读状态：0-未读 1-已读，默认0 |
| business_type | INTEGER | 是 | 关联业务类型 |
| business_id | INTEGER | 是 | 关联业务ID |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

## 与现有表的关系

### 用户认证与权限管理表 (已存在)

#### 用户表 (users)

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

#### 项目团队管理表 (project_teams)

```sql
CREATE TABLE IF NOT EXISTS project_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL COMMENT '所属项目ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    role_id INTEGER NOT NULL COMMENT '角色ID',
    status INTEGER DEFAULT 1 COMMENT '状态：1-正常 0-已移除',
    join_time INTEGER COMMENT '加入时间，Unix时间戳',
    leave_time INTEGER COMMENT '离开时间，Unix时间戳',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| project_id | INTEGER | 否 | 所属项目ID |
| user_id | INTEGER | 否 | 用户ID |
| role_id | INTEGER | 否 | 角色ID |
| status | INTEGER | 否 | 状态：1-正常 0-已移除，默认1 |
| join_time | INTEGER | 是 | 加入时间，Unix时间戳 |
| leave_time | INTEGER | 是 | 离开时间，Unix时间戳 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

#### 操作日志表 (operation_logs)

```sql
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER COMMENT '用户ID',
    operation_type STRING NOT NULL COMMENT '操作类型',
    operation_detail TEXT COMMENT '操作详情',
    ip_address STRING COMMENT 'IP地址',
    user_agent STRING COMMENT '用户代理',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

### 流程执行记录表 (process_executions)

```sql
CREATE TABLE IF NOT EXISTS process_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL COMMENT '关联需求ID',
    node_id INTEGER NOT NULL COMMENT '流程节点ID',
    executor_id INTEGER COMMENT '执行人用户ID',
    action INTEGER NOT NULL COMMENT '操作：1-通过 2-驳回 3-转发',
    comment TEXT COMMENT '审批意见',
    start_time INTEGER NOT NULL COMMENT '开始时间，Unix时间戳',
    end_time INTEGER COMMENT '结束时间，Unix时间戳',
    duration INTEGER COMMENT '处理时长(分钟)',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| requirement_id | INTEGER | 否 | 关联需求ID |
| requirement_id | INTEGER | 否 | 关联需求ID |
| node_id | INTEGER | 否 | 流程节点ID |
| executor_id | INTEGER | 是 | 执行人用户ID |
| action | INTEGER | 否 | 操作：1-通过 2-驳回 3-转发 |
| comment | TEXT | 是 | 审批意见 |
| start_time | INTEGER | 否 | 开始时间，Unix时间戳 |
| end_time | INTEGER | 是 | 结束时间，Unix时间戳 |
| duration | INTEGER | 是 | 处理时长(分钟) |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 数据导入导出记录表 (data_import_exports)

```sql
CREATE TABLE IF NOT EXISTS data_import_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL COMMENT '操作人用户ID',
    operation_type INTEGER NOT NULL COMMENT '操作类型：1-导入 2-导出',
    data_type INTEGER NOT NULL COMMENT '数据类型：1-需求 2-任务 3-项目',
    file_name STRING COMMENT '文件名',
    file_size INTEGER COMMENT '文件大小(字节)',
    status INTEGER NOT NULL COMMENT '状态：1-成功 0-失败',
    error_message TEXT COMMENT '错误信息',
    record_count INTEGER COMMENT '处理记录数',
    create_time INTEGER COMMENT '创建时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| user_id | INTEGER | 否 | 操作人用户ID |
| operation_type | INTEGER | 否 | 操作类型：1-导入 2-导出 |
| data_type | INTEGER | 否 | 数据类型：1-需求 2-任务 3-项目 |
| file_name | STRING | 是 | 文件名 |
| file_size | INTEGER | 是 | 文件大小(字节) |
| status | INTEGER | 否 | 状态：1-成功 0-失败 |
| error_message | TEXT | 是 | 错误信息 |
| record_count | INTEGER | 是 | 处理记录数 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |

### 需求版本管理表 (requirement_versions)

```sql
CREATE TABLE IF NOT EXISTS requirement_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL COMMENT '关联需求ID',
    name STRING NOT NULL COMMENT '版本名称',
    description TEXT COMMENT '版本描述',
    planned_start_time INTEGER COMMENT '计划开始时间，Unix时间戳',
    planned_end_time INTEGER COMMENT '计划结束时间，Unix时间戳',
    actual_start_time INTEGER COMMENT '实际开始时间，Unix时间戳',
    actual_end_time INTEGER COMMENT '实际结束时间，Unix时间戳',
    status INTEGER NOT NULL COMMENT '状态：1-规划中 2-进行中 3-已完成 4-已取消',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| requirement_id | INTEGER | 否 | 关联需求ID |
| name | STRING | 否 | 版本名称 |
| description | TEXT | 是 | 版本描述 |
| planned_start_time | INTEGER | 是 | 计划开始时间，Unix时间戳 |
| planned_end_time | INTEGER | 是 | 计划结束时间，Unix时间戳 |
| actual_start_time | INTEGER | 是 | 实际开始时间，Unix时间戳 |
| actual_end_time | INTEGER | 是 | 实际结束时间，Unix时间戳 |
| status | INTEGER | 否 | 状态：1-规划中 2-进行中 3-已完成 4-已取消 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 评审管理表 (reviews)

```sql
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL COMMENT '所属项目ID',
    name STRING NOT NULL COMMENT '评审名称',
    description TEXT COMMENT '评审描述',
    review_type INTEGER NOT NULL DEFAULT 1 COMMENT '评审类型：1-技术评审 2-业务评审 3-产品评审',
    status INTEGER NOT NULL DEFAULT 1 COMMENT '评审状态：1-待开始 2-进行中 3-已完成 4-已取消',
    reporter_id INTEGER NOT NULL COMMENT '评审发起人用户ID',
    reviewer_id INTEGER COMMENT '评审负责人用户ID',
    start_time INTEGER COMMENT '开始时间，Unix时间戳',
    end_time INTEGER COMMENT '结束时间，Unix时间戳',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| project_id | INTEGER | 否 | 所属项目ID |
| name | STRING | 否 | 评审名称 |
| description | TEXT | 是 | 评审描述 |
| review_type | INTEGER | 否 | 评审类型：1-技术评审 2-业务评审 3-产品评审，默认1 |
| status | INTEGER | 否 | 评审状态：1-待开始 2-进行中 3-已完成 4-已取消，默认1 |
| reporter_id | INTEGER | 否 | 评审发起人用户ID |
| reviewer_id | INTEGER | 是 | 评审负责人用户ID |
| start_time | INTEGER | 是 | 开始时间，Unix时间戳 |
| end_time | INTEGER | 是 | 结束时间，Unix时间戳 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 评审维度管理表 (review_dimensions)

```sql
CREATE TABLE IF NOT EXISTS review_dimensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL COMMENT '所属项目ID',
    name STRING NOT NULL COMMENT '评审维度名称',
    description TEXT COMMENT '评审维度描述',
    dimension_type INTEGER NOT NULL DEFAULT 1 COMMENT '评审维度类型：1-技术评审 2-业务评审 3-产品评审',
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT '评审维度权重',
    status INTEGER NOT NULL DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序顺序',
    create_time INTEGER COMMENT '创建时间，Unix时间戳',
    update_time INTEGER COMMENT '更新时间，Unix时间戳'
);
```

| 字段名 | 类型 | 是否允许为空 | 注释 |
|--------|------|-------------|------|
| id | INTEGER | 否 | 主键，自增 |
| project_id | INTEGER | 否 | 所属项目ID |
| name | STRING | 否 | 评审维度名称 |
| description | TEXT | 是 | 评审维度描述 |
| dimension_type | INTEGER | 否 | 评审维度类型：1-技术评审 2-业务评审 3-产品评审，默认1 |
| weight | DECIMAL(5,2) | 否 | 评审维度权重，默认1.00 |
| status | INTEGER | 否 | 状态：1-启用 0-禁用，默认1 |
| sort_order | INTEGER | 否 | 排序顺序，默认0 |
| create_time | INTEGER | 是 | 创建时间，Unix时间戳 |
| update_time | INTEGER | 是 | 更新时间，Unix时间戳 |

### 关联关系
- 所有业务表通过 `user_id` 字段关联到 `users` 表
- 项目团队表通过 `project_id` 关联到 `projects` 表
- 需求通过 `project_id` 关联到 `projects` 表，通过 `type_id` 关联到 `requirement_types` 表，通过 `status_id` 关联到 `requirement_statuses` 表
- 评审通过 `project_id` 关联到 `projects` 表
- 任务通过 `requirement_id` 关联到 `requirements` 表，通过 `review_id` 关联到 `reviews` 表，通过 `status_id` 关联到 `requirement_task_statuses` 表，通过 `requirement_node_id` 关联到 `requirement_process_nodes` 表，通过 `review_node_id` 关联到 `review_process_nodes` 表
- 需求管理流程节点通过 `requirement_id` 关联到 `requirements` 表，通过 `node_type_id` 关联到 `process_node_types` 表，通过 `parent_node_id` 实现树形结构
- 需求管理流程节点关系通过 `requirement_id` 关联到 `requirements` 表，通过 `source_node_id` 和 `target_node_id` 关联到 `requirement_process_nodes` 表
- 需求管理流程节点用户关联通过 `node_id` 关联到 `requirement_process_nodes` 表，通过 `user_id` 关联到 `users` 表
- 评审管理流程节点通过 `review_id` 关联到 `reviews` 表，通过 `node_type_id` 关联到 `process_node_types` 表，通过 `parent_node_id` 实现树形结构
- 评审管理流程节点关系通过 `review_id` 关联到 `reviews` 表，通过 `source_node_id` 和 `target_node_id` 关联到 `review_process_nodes` 表
- 评审管理流程节点用户关联通过 `node_id` 关联到 `review_process_nodes` 表，通过 `user_id` 关联到 `users` 表
- 流程执行记录通过 `requirement_id` 关联到 `requirements` 表，通过 `node_id` 关联到 `requirement_process_nodes` 表
- 需求版本管理通过 `requirement_id` 关联到 `requirements` 表
- 评审维度管理通过 `project_id` 关联到 `projects` 表

## 数据安全与索引优化

### 数据安全
- 所有表都包含 `create_time` 和 `update_time` 字段用于审计
- 敏感数据字段使用适当的加密存储
- 开发阶段不使用外键约束，避免增加数据迁移复杂度

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
