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
    requirement_id BIGINT PRIMARY KEY IDENTITY(1,1),
    requirement_name VARCHAR(255) NOT NULL COMMENT '需求名称',
    requirement_type VARCHAR(50) NOT NULL COMMENT '需求类型：业务需求、技术需求、产品需求',
    description TEXT COMMENT '需求描述',
    priority VARCHAR(10) NOT NULL COMMENT '优先级：P0, P1, P2, P3',
    status VARCHAR(50) NOT NULL COMMENT '状态：待设计、待产品评审、待技术评审、开发中、测试中、已上线、已结束',
    current_assignee_id BIGINT COMMENT '当前负责人用户ID',
    reporter_id BIGINT NOT NULL COMMENT '提出人用户ID',
    project_id BIGINT COMMENT '所属项目ID',
    planned_version VARCHAR(50) COMMENT '规划版本',
    actual_version VARCHAR(50) COMMENT '实际上线版本',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_priority ON requirements(priority);
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_current_assignee ON requirements(current_assignee_id);
```

### 任务管理表 (tasks)

```sql
CREATE TABLE IF NOT EXISTS tasks (
    task_id BIGINT PRIMARY KEY IDENTITY(1,1),
    task_name VARCHAR(255) NOT NULL COMMENT '任务名称',
    description TEXT COMMENT '任务描述',
    priority VARCHAR(10) NOT NULL COMMENT '优先级：P0, P1, P2, P3',
    status VARCHAR(50) NOT NULL COMMENT '状态：未开始、进行中、已完成、已取消',
    assignee_id BIGINT COMMENT '负责人用户ID',
    reporter_id BIGINT NOT NULL COMMENT '创建人用户ID',
    requirement_id BIGINT COMMENT '关联需求ID',
    project_id BIGINT COMMENT '所属项目ID',
    estimated_hours DECIMAL(10,2) COMMENT '预估工时(小时)',
    actual_hours DECIMAL(10,2) COMMENT '实际工时(小时)',
    start_time TIMESTAMP COMMENT '开始时间',
    end_time TIMESTAMP COMMENT '结束时间',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_requirement ON tasks(requirement_id);
```

### 缺陷管理表 (defects)

```sql
CREATE TABLE IF NOT EXISTS defects (
    defect_id BIGINT PRIMARY KEY IDENTITY(1,1),
    defect_name VARCHAR(255) NOT NULL COMMENT '缺陷名称',
    description TEXT COMMENT '缺陷描述',
    severity VARCHAR(50) NOT NULL COMMENT '严重程度：致命、严重、一般、轻微',
    status VARCHAR(50) NOT NULL COMMENT '状态：待修复、修复中、已修复、已验证、已关闭',
    assignee_id BIGINT COMMENT '负责人用户ID',
    reporter_id BIGINT NOT NULL COMMENT '报告人用户ID',
    requirement_id BIGINT COMMENT '关联需求ID',
    task_id BIGINT COMMENT '关联任务ID',
    project_id BIGINT COMMENT '所属项目ID',
    reproduce_steps TEXT COMMENT '复现步骤',
    fix_version VARCHAR(50) COMMENT '修复版本',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_assignee ON defects(assignee_id);
```

### 项目管理表 (projects)

```sql
CREATE TABLE IF NOT EXISTS projects (
    project_id BIGINT PRIMARY KEY IDENTITY(1,1),
    project_name VARCHAR(255) NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    status VARCHAR(50) NOT NULL COMMENT '状态：待立项、进行中、已暂停、已完成、已取消',
    manager_id BIGINT NOT NULL COMMENT '项目负责人用户ID',
    department_id BIGINT COMMENT '所属部门ID',
    start_date TIMESTAMP COMMENT '开始日期',
    end_date TIMESTAMP COMMENT '结束日期',
    budget DECIMAL(15,2) COMMENT '项目预算',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
```

### 项目团队表 (project_teams)

```sql
CREATE TABLE IF NOT EXISTS project_teams (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role VARCHAR(50) NOT NULL COMMENT '角色：项目经理、开发工程师、测试工程师、UI设计师、产品经理',
    status INTEGER DEFAULT 1 COMMENT '状态：1-正常 0-已移除',
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_project_teams_project ON project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_user ON project_teams(user_id);
```

### 流程管理表 (workflows)

```sql
CREATE TABLE IF NOT EXISTS workflows (
    workflow_id BIGINT PRIMARY KEY IDENTITY(1,1),
    workflow_name VARCHAR(255) NOT NULL COMMENT '流程名称',
    description TEXT COMMENT '流程描述',
    workflow_type VARCHAR(50) NOT NULL COMMENT '流程类型：需求流程、任务流程、缺陷流程、项目流程',
    status INTEGER DEFAULT 1 COMMENT '状态：1-启用 0-禁用',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(workflow_type);
```

### 流程节点表 (workflow_nodes)

```sql
CREATE TABLE IF NOT EXISTS workflow_nodes (
    node_id BIGINT PRIMARY KEY IDENTITY(1,1),
    workflow_id BIGINT NOT NULL COMMENT '流程ID',
    node_name VARCHAR(255) NOT NULL COMMENT '节点名称',
    node_type VARCHAR(50) NOT NULL COMMENT '节点类型：开始节点、审批节点、执行节点、结束节点',
    node_order INTEGER NOT NULL COMMENT '节点顺序',
    assignee_type VARCHAR(50) COMMENT '负责人类型：固定用户、角色、部门',
    assignee_id BIGINT COMMENT '负责人ID',
    duration_limit INTEGER COMMENT '处理时限(小时)',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_order ON workflow_nodes(node_order);
```

### 流程实例表 (workflow_instances)

```sql
CREATE TABLE IF NOT EXISTS workflow_instances (
    instance_id BIGINT PRIMARY KEY IDENTITY(1,1),
    workflow_id BIGINT NOT NULL COMMENT '流程ID',
    business_type VARCHAR(50) NOT NULL COMMENT '业务类型：需求、任务、缺陷、项目',
    business_id BIGINT NOT NULL COMMENT '业务ID',
    current_node_id BIGINT COMMENT '当前节点ID',
    status VARCHAR(50) NOT NULL COMMENT '状态：运行中、已完成、已取消',
    create_user_id BIGINT NOT NULL COMMENT '创建人用户ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_workflow_instances_business ON workflow_instances(business_type, business_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
```

### 流程执行记录表 (workflow_executions)

```sql
CREATE TABLE IF NOT EXISTS workflow_executions (
    execution_id BIGINT PRIMARY KEY IDENTITY(1,1),
    instance_id BIGINT NOT NULL COMMENT '流程实例ID',
    node_id BIGINT NOT NULL COMMENT '节点ID',
    executor_id BIGINT NOT NULL COMMENT '执行人用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作：通过、驳回、转发',
    comment TEXT COMMENT '审批意见',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP COMMENT '结束时间',
    duration INTEGER COMMENT '处理时长(分钟)',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_workflow_executions_instance ON workflow_executions(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_node ON workflow_executions(node_id);
```

### 标签管理表 (tags)

```sql
CREATE TABLE IF NOT EXISTS tags (
    tag_id BIGINT PRIMARY KEY IDENTITY(1,1),
    tag_name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    tag_color VARCHAR(20) COMMENT '标签颜色',
    description VARCHAR(255) COMMENT '标签描述',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(tag_name);
```

### 需求标签关联表 (requirement_tags)

```sql
CREATE TABLE IF NOT EXISTS requirement_tags (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    requirement_id BIGINT NOT NULL COMMENT '需求ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_requirement_tags_requirement ON requirement_tags(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_tags_tag ON requirement_tags(tag_id);
```

### 评论管理表 (comments)

```sql
CREATE TABLE IF NOT EXISTS comments (
    comment_id BIGINT PRIMARY KEY IDENTITY(1,1),
    business_type VARCHAR(50) NOT NULL COMMENT '业务类型：需求、任务、缺陷',
    business_id BIGINT NOT NULL COMMENT '业务ID',
    user_id BIGINT NOT NULL COMMENT '评论人用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_comment_id BIGINT COMMENT '父评论ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_comments_business ON comments(business_type, business_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
```

### 操作记录表 (operation_records)

```sql
CREATE TABLE IF NOT EXISTS operation_records (
    record_id BIGINT PRIMARY KEY IDENTITY(1,1),
    business_type VARCHAR(50) NOT NULL COMMENT '业务类型：需求、任务、缺陷',
    business_id BIGINT NOT NULL COMMENT '业务ID',
    user_id BIGINT NOT NULL COMMENT '操作人用户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型：创建、更新、删除、状态变更',
    operation_detail TEXT COMMENT '操作详情',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_operation_records_business ON operation_records(business_type, business_id);
CREATE INDEX IF NOT EXISTS idx_operation_records_user ON operation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_records_type ON operation_records(operation_type);
```

### 通知管理表 (notifications)

```sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    title VARCHAR(255) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    type VARCHAR(50) NOT NULL COMMENT '通知类型：系统通知、业务通知、提醒',
    status INTEGER DEFAULT 0 COMMENT '阅读状态：0-未读 1-已读',
    business_type VARCHAR(50) COMMENT '关联业务类型',
    business_id BIGINT COMMENT '关联业务ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
```

## 与现有表的关系

### 用户认证与权限管理表 (已存在)
- `users` - 用户表 (已存在)
- `roles` - 角色表 (已存在)
- `permissions` - 权限表 (已存在)
- `role_permissions` - 角色权限关联表 (已存在)
- `user_sessions` - 用户会话表 (已存在)
- `operation_logs` - 操作日志表 (已存在)

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

### 索引优化
- 对经常查询的字段创建索引
- 为外键字段创建索引以提高连接查询性能
- 根据实际查询模式调整索引策略

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
