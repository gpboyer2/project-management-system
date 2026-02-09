# API接口文档

本项目提供了完整的项目管理系统API接口，涵盖了用户认证、项目管理、任务管理、需求管理、评审管理、权限管理等功能模块。

---

## 1. 用户认证模块 (authRouter.js)

### 1.1 用户登录
- **接口描述**：用户通过用户名和密码登录系统，获取访问令牌和刷新令牌。
- **请求方法**：POST
- **请求URL**：`/api/auth/login`
- **请求参数**：
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "user": {
        "USER_ID": 1,
        "USER_NAME": "admin",
        "REAL_NAME": "系统管理员",
        "EMAIL": "admin@example.com",
        "PHONE": "13800138000",
        "ROLE_ID": 1,
        "ROLE_NAME": "超级管理员",
        "STATUS": 1,
        "permissions": ["SYSTEM:USER:VIEW", "SYSTEM:USER:CREATE", "SYSTEM:USER:EDIT", "SYSTEM:USER:DELETE"]
      }
    }
  }
  ```
- **错误响应示例**：
  ```json
  {
    "code": 401,
    "message": "用户名或密码错误"
  }
  ```

### 1.2 用户登出
- **接口描述**：用户登出系统，使令牌失效。
- **请求方法**：POST
- **请求URL**：`/api/auth/logout`
- **请求参数**：无（需要在请求头中携带Authorization: Bearer <token>）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "登出成功"
  }
  ```

### 1.3 刷新Token
- **接口描述**：使用刷新令牌获取新的访问令牌。
- **请求方法**：POST
- **请求URL**：`/api/auth/refresh`
- **请求参数**：
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "刷新成功",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
  ```

### 1.4 获取当前用户信息
- **接口描述**：获取当前登录用户的详细信息，包括角色和权限。
- **请求方法**：GET
- **请求URL**：`/api/auth/me`
- **请求参数**：无（需要在请求头中携带Authorization: Bearer <token>）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "USER_ID": 1,
      "USER_NAME": "admin",
      "REAL_NAME": "系统管理员",
      "EMAIL": "admin@example.com",
      "PHONE": "13800138000",
      "ROLE_ID": 1,
      "ROLE_NAME": "超级管理员",
      "STATUS": 1,
      "permissions": ["SYSTEM:USER:VIEW", "SYSTEM:USER:CREATE", "SYSTEM:USER:EDIT", "SYSTEM:USER:DELETE"]
    }
  }
  ```

### 1.5 修改密码
- **接口描述**：修改当前登录用户的密码。
- **请求方法**：POST
- **请求URL**：`/api/auth/change-password`
- **请求参数**：
  ```json
  {
    "oldPassword": "oldpassword123",
    "newPassword": "newpassword123"
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "密码修改成功"
  }
  ```

---

## 2. 用户管理模块 (userRouter.js)

### 2.1 查询用户列表
- **接口描述**：分页查询用户列表，支持关键字搜索和角色、状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/user/list?current_page=1&page_size=10&keyword=admin&role=1&status=1`
- **请求参数**：
  - current_page：当前页码（默认1）
  - page_size：每页数量（默认10）
  - keyword：搜索关键字（用户名、真实姓名、邮箱、手机号）
  - role：角色ID筛选
  - status：状态筛选（0：禁用，1：启用）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "list": [
        {
          "USER_ID": 1,
          "USER_NAME": "admin",
          "REAL_NAME": "系统管理员",
          "EMAIL": "admin@example.com",
          "PHONE": "13800138000",
          "ROLE_ID": 1,
          "ROLE_NAME": "超级管理员",
          "STATUS": 1,
          "CREATE_TIME": "2024-01-01T00:00:00.000Z",
          "UPDATE_TIME": "2024-01-01T00:00:00.000Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 10,
        "total": 1
      }
    }
  }
  ```

### 2.2 新增用户（支持批量）
- **接口描述**：批量创建用户，支持同时创建多个用户。
- **请求方法**：POST
- **请求URL**：`/api/user/create`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "USER_NAME": "testuser",
        "PASSWORD": "password123",
        "REAL_NAME": "测试用户",
        "EMAIL": "test@example.com",
        "PHONE": "13800138000",
        "ROLE_ID": 2,
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功创建 1 个用户",
    "data": [
      {
        "success": true,
        "USER_NAME": "testuser",
        "message": "创建成功"
      }
    ]
  }
  ```

### 2.3 更新用户（支持批量）
- **接口描述**：批量更新用户信息，支持同时更新多个用户。
- **请求方法**：POST
- **请求URL**：`/api/user/update`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "USER_ID": 1,
        "REAL_NAME": "更新的真实姓名",
        "EMAIL": "updated@example.com",
        "PHONE": "13900139000",
        "ROLE_ID": 3,
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功更新 1 个用户",
    "data": [
      {
        "success": true,
        "USER_ID": 1,
        "message": "更新成功"
      }
    ]
  }
  ```

### 2.4 删除用户（支持批量）
- **接口描述**：批量删除用户，支持同时删除多个用户（超级管理员不能被删除）。
- **请求方法**：POST
- **请求URL**：`/api/user/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2, 3]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功删除 2 个用户",
    "data": [
      {
        "success": true,
        "USER_ID": 1,
        "message": "删除成功"
      }
    ]
  }
  ```

---

## 3. 项目管理模块 (projectRouter.js)

### 3.1 获取项目列表
- **接口描述**：获取项目列表，支持分页和状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/projects/query?page=1&pageSize=20&status=1`
- **请求参数**：
  - page：页码，默认1
  - pageSize：每页数量，默认20
  - status：项目状态（1-待立项 2-进行中 3-已暂停 4-已完成 5-已取消）
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "name": "项目管理系统开发",
          "description": "开发一个项目管理系统",
          "status": 2,
          "manager_id": 1,
          "department_id": 1,
          "start_date": 1704067200,
          "end_date": 1735689600,
          "budget": 100000,
          "create_time": 1704067200,
          "update_time": 1704067200
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 20,
        "total": 1
      }
    }
  }
  ```

### 3.2 创建项目
- **接口描述**：创建新的项目。
- **请求方法**：POST
- **请求URL**：`/api/projects/create`
- **请求参数**：
  ```json
  {
    "name": "新项目",
    "description": "项目描述",
    "status": 1,
    "manager_id": 1,
    "department_id": 1,
    "start_date": 1704067200,
    "end_date": 1735689600,
    "budget": 50000
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "项目创建成功",
    "datum": {
      "id": 2,
      "name": "新项目",
      "description": "项目描述",
      "status": 1,
      "manager_id": 1,
      "department_id": 1,
      "start_date": 1704067200,
      "end_date": 1735689600,
      "budget": 50000,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 3.3 更新项目
- **接口描述**：更新项目信息。
- **请求方法**：POST
- **请求URL**：`/api/projects/update`
- **请求参数**：
  ```json
  {
    "id": 1,
    "name": "更新后的项目名称",
    "description": "更新后的项目描述",
    "status": 2,
    "manager_id": 1,
    "department_id": 1,
    "start_date": 1704067200,
    "end_date": 1735689600,
    "budget": 150000
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "项目更新成功",
    "datum": {
      "id": 1,
      "name": "更新后的项目名称",
      "description": "更新后的项目描述",
      "status": 2,
      "manager_id": 1,
      "department_id": 1,
      "start_date": 1704067200,
      "end_date": 1735689600,
      "budget": 150000,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 3.4 删除项目
- **接口描述**：删除项目，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/projects/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "项目删除成功"
  }
  ```

---

## 4. 任务管理模块 (taskRouter.js)

### 4.1 获取任务列表
- **接口描述**：获取任务列表，支持分页和多种筛选条件。
- **请求方法**：GET
- **请求URL**：`/api/tasks/query?page=1&pageSize=20&requirementId=1&reviewId=2&status=1`
- **请求参数**：
  - page：页码，默认1
  - pageSize：每页数量，默认20
  - requirementId：需求ID
  - reviewId：评审ID
  - status：任务状态
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "name": "任务1",
          "description": "任务描述",
          "priority": 1,
          "status_id": 1,
          "assignee_id": 1,
          "reporter_id": 1,
          "requirement_id": 1,
          "review_id": 2,
          "requirement_node_id": 1,
          "review_node_id": 2,
          "estimated_hours": 8,
          "actual_hours": 0,
          "start_time": 1704067200,
          "end_time": 1704153600,
          "create_time": 1704067200,
          "update_time": 1704067200,
          "assignee": {
            "USER_ID": 1,
            "USER_NAME": "admin",
            "REAL_NAME": "系统管理员"
          },
          "reporter": {
            "USER_ID": 1,
            "USER_NAME": "admin",
            "REAL_NAME": "系统管理员"
          }
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 20,
        "total": 1
      }
    }
  }
  ```

### 4.2 创建任务
- **接口描述**：创建新的任务。
- **请求方法**：POST
- **请求URL**：`/api/tasks/create`
- **请求参数**：
  ```json
  {
    "name": "新任务",
    "description": "任务描述",
    "priority": 1,
    "status_id": 1,
    "assignee_id": 1,
    "reporter_id": 1,
    "requirement_id": 1,
    "review_id": 2,
    "requirement_node_id": 1,
    "review_node_id": 2,
    "estimated_hours": 8,
    "actual_hours": 0,
    "start_time": 1704067200,
    "end_time": 1704153600
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "任务创建成功",
    "datum": {
      "id": 2,
      "name": "新任务",
      "description": "任务描述",
      "priority": 1,
      "status_id": 1,
      "assignee_id": 1,
      "reporter_id": 1,
      "requirement_id": 1,
      "review_id": 2,
      "requirement_node_id": 1,
      "review_node_id": 2,
      "estimated_hours": 8,
      "actual_hours": 0,
      "start_time": 1704067200,
      "end_time": 1704153600,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 4.3 更新任务
- **接口描述**：更新任务信息。
- **请求方法**：POST
- **请求URL**：`/api/tasks/update`
- **请求参数**：
  ```json
  {
    "id": 1,
    "name": "更新后的任务名称",
    "description": "更新后的任务描述",
    "priority": 2,
    "status_id": 2,
    "assignee_id": 2,
    "reporter_id": 1,
    "requirement_id": 1,
    "review_id": 2,
    "requirement_node_id": 1,
    "review_node_id": 2,
    "estimated_hours": 10,
    "actual_hours": 5,
    "start_time": 1704067200,
    "end_time": 1704240000
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "任务更新成功",
    "datum": {
      "id": 1,
      "name": "更新后的任务名称",
      "description": "更新后的任务描述",
      "priority": 2,
      "status_id": 2,
      "assignee_id": 2,
      "reporter_id": 1,
      "requirement_id": 1,
      "review_id": 2,
      "requirement_node_id": 1,
      "review_node_id": 2,
      "estimated_hours": 10,
      "actual_hours": 5,
      "start_time": 1704067200,
      "end_time": 1704240000,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 4.4 删除任务
- **接口描述**：删除任务，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/tasks/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "任务删除成功"
  }
  ```

---

## 5. 需求管理模块 (requirementRouter.js)

### 5.1 获取需求列表
- **接口描述**：获取需求列表，支持分页和项目ID、状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/requirements/query?page=1&pageSize=20&projectId=1&status=1`
- **请求参数**：
  - page：页码，默认1
  - pageSize：每页数量，默认20
  - projectId：项目ID
  - status：需求状态
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "name": "需求1",
          "type_id": 1,
          "description": "需求描述",
          "priority": 1,
          "status_id": 1,
          "current_assignee_id": 1,
          "reporter_id": 1,
          "project_id": 1,
          "planned_version": "v1.0",
          "actual_version": "",
          "create_time": 1704067200,
          "update_time": 1704067200,
          "current_assignee": {
            "USER_ID": 1,
            "USER_NAME": "admin",
            "REAL_NAME": "系统管理员"
          },
          "reporter": {
            "USER_ID": 1,
            "USER_NAME": "admin",
            "REAL_NAME": "系统管理员"
          },
          "project": {
            "id": 1,
            "name": "项目管理系统开发"
          }
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 20,
        "total": 1
      }
    }
  }
  ```

### 5.2 创建需求
- **接口描述**：创建新的需求。
- **请求方法**：POST
- **请求URL**：`/api/requirements/create`
- **请求参数**：
  ```json
  {
    "name": "新需求",
    "type_id": 1,
    "description": "需求描述",
    "priority": 1,
    "status_id": 1,
    "current_assignee_id": 1,
    "reporter_id": 1,
    "project_id": 1,
    "planned_version": "v1.0",
    "actual_version": ""
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "需求创建成功",
    "datum": {
      "id": 2,
      "name": "新需求",
      "type_id": 1,
      "description": "需求描述",
      "priority": 1,
      "status_id": 1,
      "current_assignee_id": 1,
      "reporter_id": 1,
      "project_id": 1,
      "planned_version": "v1.0",
      "actual_version": "",
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 5.3 更新需求
- **接口描述**：更新需求信息。
- **请求方法**：POST
- **请求URL**：`/api/requirements/update`
- **请求参数**：
  ```json
  {
    "id": 1,
    "name": "更新后的需求名称",
    "type_id": 2,
    "description": "更新后的需求描述",
    "priority": 2,
    "status_id": 2,
    "current_assignee_id": 2,
    "reporter_id": 1,
    "project_id": 1,
    "planned_version": "v1.1",
    "actual_version": "v1.0"
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "需求更新成功",
    "datum": {
      "id": 1,
      "name": "更新后的需求名称",
      "type_id": 2,
      "description": "更新后的需求描述",
      "priority": 2,
      "status_id": 2,
      "current_assignee_id": 2,
      "reporter_id": 1,
      "project_id": 1,
      "planned_version": "v1.1",
      "actual_version": "v1.0",
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 5.4 删除需求
- **接口描述**：删除需求，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/requirements/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "需求删除成功"
  }
  ```

---

## 6. 评审管理模块 (reviewRouter.js)

### 6.1 获取评审列表
- **接口描述**：获取评审列表，支持分页和项目ID、状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/reviews/query?page=1&pageSize=20&projectId=1&status=1`
- **请求参数**：
  - page：页码，默认1
  - pageSize：每页数量，默认20
  - projectId：项目ID
  - status：评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "project_id": 1,
          "name": "评审1",
          "description": "评审描述",
          "review_type": 1,
          "status": 1,
          "reporter_id": 1,
          "reviewer_id": 2,
          "start_time": 1704067200,
          "end_time": 1704153600,
          "create_time": 1704067200,
          "update_time": 1704067200,
          "reporter": {
            "USER_ID": 1,
            "USER_NAME": "admin",
            "REAL_NAME": "系统管理员"
          },
          "reviewer": {
            "USER_ID": 2,
            "USER_NAME": "reviewer",
            "REAL_NAME": "评审员"
          },
          "project": {
            "id": 1,
            "name": "项目管理系统开发"
          }
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 20,
        "total": 1
      }
    }
  }
  ```

### 6.2 创建评审
- **接口描述**：创建新的评审。
- **请求方法**：POST
- **请求URL**：`/api/reviews/create`
- **请求参数**：
  ```json
  {
    "name": "新评审",
    "description": "评审描述",
    "review_type": 1,
    "status": 1,
    "reporter_id": 1,
    "reviewer_id": 2,
    "project_id": 1,
    "start_time": 1704067200,
    "end_time": 1704153600
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "评审创建成功",
    "datum": {
      "id": 2,
      "project_id": 1,
      "name": "新评审",
      "description": "评审描述",
      "review_type": 1,
      "status": 1,
      "reporter_id": 1,
      "reviewer_id": 2,
      "start_time": 1704067200,
      "end_time": 1704153600,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 6.3 更新评审
- **接口描述**：更新评审信息。
- **请求方法**：POST
- **请求URL**：`/api/reviews/update`
- **请求参数**：
  ```json
  {
    "id": 1,
    "name": "更新后的评审名称",
    "description": "更新后的评审描述",
    "review_type": 2,
    "status": 2,
    "reporter_id": 1,
    "reviewer_id": 3,
    "project_id": 1,
    "start_time": 1704067200,
    "end_time": 1704240000
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "评审更新成功",
    "datum": {
      "id": 1,
      "project_id": 1,
      "name": "更新后的评审名称",
      "description": "更新后的评审描述",
      "review_type": 2,
      "status": 2,
      "reporter_id": 1,
      "reviewer_id": 3,
      "start_time": 1704067200,
      "end_time": 1704240000,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 6.4 删除评审
- **接口描述**：删除评审，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/reviews/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "评审删除成功"
  }
  ```

---

## 7. 权限管理模块 (permissionRouter.js)

### 7.1 查询权限列表
- **接口描述**：查询权限列表，支持分页和状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/permissions/list?current_page=1&page_size=10&status=1&keyword=user`
- **请求参数**：
  - current_page：当前页码，默认1
  - page_size：每页数量，默认10
  - status：状态筛选（0：禁用，1：启用）
  - keyword：搜索关键字（权限名称或权限代码）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "list": [
        {
          "PERMISSION_ID": 1,
          "PERMISSION_NAME": "用户查看",
          "PERMISSION_CODE": "SYSTEM:USER:VIEW",
          "DESCRIPTION": "查看用户列表和详情",
          "STATUS": 1,
          "CREATE_TIME": "2024-01-01T00:00:00.000Z",
          "UPDATE_TIME": "2024-01-01T00:00:00.000Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 10,
        "total": 1
      }
    }
  }
  ```

### 7.2 新增权限（支持批量）
- **接口描述**：批量创建权限，支持同时创建多个权限。
- **请求方法**：POST
- **请求URL**：`/api/permissions/create`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "PERMISSION_NAME": "用户查看",
        "PERMISSION_CODE": "SYSTEM:USER:VIEW",
        "DESCRIPTION": "查看用户列表和详情",
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功创建 1 个权限",
    "data": [
      {
        "success": true,
        "PERMISSION_NAME": "用户查看",
        "message": "创建成功"
      }
    ]
  }
  ```

### 7.3 更新权限（支持批量）
- **接口描述**：批量更新权限信息，支持同时更新多个权限。
- **请求方法**：POST
- **请求URL**：`/api/permissions/update`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "PERMISSION_ID": 1,
        "PERMISSION_NAME": "更新后的用户查看",
        "DESCRIPTION": "更新后的权限描述",
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功更新 1 个权限",
    "data": [
      {
        "success": true,
        "PERMISSION_ID": 1,
        "message": "更新成功"
      }
    ]
  }
  ```

### 7.4 删除权限（支持批量）
- **接口描述**：批量删除权限，支持同时删除多个权限。
- **请求方法**：POST
- **请求URL**：`/api/permissions/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2, 3]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功删除 2 个权限",
    "data": [
      {
        "success": true,
        "PERMISSION_ID": 1,
        "message": "删除成功"
      }
    ]
  }
  ```

---

## 8. 角色管理模块 (roleRouter.js)

### 8.1 查询角色列表
- **接口描述**：查询角色列表，支持分页和状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/roles/list?current_page=1&page_size=10&status=1&keyword=admin`
- **请求参数**：
  - current_page：当前页码，默认1
  - page_size：每页数量，默认10
  - status：状态筛选（0：禁用，1：启用）
  - keyword：搜索关键字（角色名称或角色代码）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "list": [
        {
          "ROLE_ID": 1,
          "ROLE_NAME": "系统管理员",
          "ROLE_CODE": "SYSTEM_ADMIN",
          "DESCRIPTION": "系统管理员角色",
          "STATUS": 1,
          "CREATE_TIME": "2024-01-01T00:00:00.000Z",
          "UPDATE_TIME": "2024-01-01T00:00:00.000Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 10,
        "total": 1
      }
    }
  }
  ```

### 8.2 新增角色（支持批量）
- **接口描述**：批量创建角色，支持同时创建多个角色。
- **请求方法**：POST
- **请求URL**：`/api/roles/create`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "ROLE_NAME": "系统管理员",
        "ROLE_CODE": "SYSTEM_ADMIN",
        "DESCRIPTION": "系统管理员角色",
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功创建 1 个角色",
    "data": [
      {
        "success": true,
        "ROLE_NAME": "系统管理员",
        "message": "创建成功"
      }
    ]
  }
  ```

### 8.3 更新角色（支持批量）
- **接口描述**：批量更新角色信息，支持同时更新多个角色。
- **请求方法**：POST
- **请求URL**：`/api/roles/update`
- **请求参数**：
  ```json
  {
    "data": [
      {
        "ROLE_ID": 1,
        "ROLE_NAME": "更新后的系统管理员",
        "DESCRIPTION": "更新后的角色描述",
        "STATUS": 1
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功更新 1 个角色",
    "data": [
      {
        "success": true,
        "ROLE_ID": 1,
        "message": "更新成功"
      }
    ]
  }
  ```

### 8.4 删除角色（支持批量）
- **接口描述**：批量删除角色，支持同时删除多个角色。
- **请求方法**：POST
- **请求URL**：`/api/roles/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2, 3]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "成功删除 2 个角色",
    "data": [
      {
        "success": true,
        "ROLE_ID": 1,
        "message": "删除成功"
      }
    ]
  }
  ```

---

## 9. 流程节点类型管理模块 (processNodeTypeRouter.js)

### 9.1 获取流程节点类型列表
- **接口描述**：获取流程节点类型列表，支持分页和名称、类型筛选。
- **请求方法**：GET
- **请求URL**：`/api/process-node-types/query?page=1&pageSize=20&name=开始&type=1`
- **请求参数**：
  - page：页码，默认1
  - pageSize：每页数量，默认20
  - name：节点类型名称（模糊搜索）
  - type：节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "name": "开始节点",
          "type": 1,
          "description": "流程开始节点",
          "sort_order": 1,
          "config": {},
          "status": 1,
          "create_time": 1704067200,
          "update_time": 1704067200
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 20,
        "total": 1
      }
    }
  }
  ```

### 9.2 创建流程节点类型
- **接口描述**：创建新的流程节点类型。
- **请求方法**：POST
- **请求URL**：`/api/process-node-types/create`
- **请求参数**：
  ```json
  {
    "name": "新节点类型",
    "type": 99,
    "description": "其他节点类型",
    "sort_order": 10,
    "config": {}
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "流程节点类型创建成功",
    "datum": {
      "id": 2,
      "name": "新节点类型",
      "type": 99,
      "description": "其他节点类型",
      "sort_order": 10,
      "config": {},
      "status": 1,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 9.3 更新流程节点类型
- **接口描述**：更新流程节点类型信息。
- **请求方法**：POST
- **请求URL**：`/api/process-node-types/update`
- **请求参数**：
  ```json
  {
    "id": 1,
    "name": "更新后的节点类型",
    "type": 1,
    "description": "更新后的节点描述",
    "sort_order": 1,
    "config": {}
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "流程节点类型更新成功",
    "datum": {
      "id": 1,
      "name": "更新后的节点类型",
      "type": 1,
      "description": "更新后的节点描述",
      "sort_order": 1,
      "config": {},
      "status": 1,
      "create_time": 1704067200,
      "update_time": 1704067200
    }
  }
  ```

### 9.4 删除流程节点类型
- **接口描述**：删除流程节点类型，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/process-node-types/delete`
- **请求参数**：
  ```json
  {
    "data": [1, 2]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "流程节点类型删除成功"
  }
  ```

---

## 10. 通信节点管理模块 (communicationNodeRouter.js)

### 10.1 获取通信节点列表
- **接口描述**：获取通信节点列表，支持按体系节点筛选。
- **请求方法**：GET
- **请求URL**：`/api/communication-nodes/by-node?node_id=123`
- **请求参数**：
  - node_id：体系节点ID（必填）
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": "comm-123",
        "node_id": "arch_node_001",
        "name": "通信节点1",
        "endpoint_description": [
          {
            "role": "input",
            "type": "TCP Server",
            "host": "127.0.0.1",
            "port": 8080
          },
          {
            "role": "output",
            "type": "TCP Client",
            "remote_host": "127.0.0.1",
            "remote_port": 9090
          }
        ],
        "status": "active",
        "flow_version": "1.0"
      }
    ]
  }
  ```

### 10.2 创建通信节点
- **接口描述**：创建新的通信节点。
- **请求方法**：POST
- **请求URL**：`/api/communication-nodes`
- **请求参数**：
  ```json
  {
    "node_id": "arch_node_001",
    "name": "新通信节点",
    "endpoint_description": [
      {
        "role": "input",
        "type": "TCP Server",
        "host": "127.0.0.1",
        "port": 8081
      }
    ],
    "status": "active"
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": "comm-456",
      "node_id": "arch_node_001",
      "name": "新通信节点",
      "endpoint_description": [
        {
          "role": "input",
          "type": "TCP Server",
          "host": "127.0.0.1",
          "port": 8081
        }
      ],
      "status": "active",
      "flow_version": "1.0"
    }
  }
  ```

### 10.3 更新通信节点
- **接口描述**：更新通信节点信息。
- **请求方法**：POST
- **请求URL**：`/api/communication-nodes/update`
- **请求参数**：
  ```json
  {
    "id": "comm-123",
    "name": "更新后的通信节点",
    "endpoint_description": [
      {
        "role": "input",
        "type": "TCP Server",
        "host": "127.0.0.1",
        "port": 8080
      },
      {
        "role": "output",
        "type": "TCP Client",
        "remote_host": "127.0.0.1",
        "remote_port": 9091
      }
    ],
    "status": "active"
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": "comm-123",
      "node_id": "arch_node_001",
      "name": "更新后的通信节点",
      "endpoint_description": [
        {
          "role": "input",
          "type": "TCP Server",
          "host": "127.0.0.1",
          "port": 8080
        },
        {
          "role": "output",
          "type": "TCP Client",
          "remote_host": "127.0.0.1",
          "remote_port": 9091
        }
      ],
      "status": "active",
      "flow_version": "1.0"
    }
  }
  ```

### 10.4 删除通信节点
- **接口描述**：删除通信节点，支持批量删除。
- **请求方法**：POST
- **请求URL**：`/api/communication-nodes/delete`
- **请求参数**：
  ```json
  {
    "data": ["comm-123", "comm-456"]
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "deleted": 2
    }
  }
  ```

---

## 11. 流程图管理模块 (flowchartRouter.js)

### 11.1 保存流程图
- **接口描述**：保存流程图数据。
- **请求方法**：POST
- **请求URL**：`/api/flowcharts/save`
- **请求参数**：
  ```json
  {
    "arch_node_id": "arch_node_001",
    "name": "通信流程图",
    "nodes": [],
    "edges": []
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "arch_node_id": "arch_node_001"
    }
  }
  ```

### 11.2 加载流程图
- **接口描述**：根据体系节点ID加载流程图数据。
- **请求方法**：GET
- **请求URL**：`/api/flowcharts/by-arch-node?arch_node_id=arch_node_001`
- **请求参数**：
  - arch_node_id：体系节点ID（必填）
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "arch_node_id": "arch_node_001",
      "name": "通信流程图",
      "nodes": [],
      "edges": [],
      "create_time": "2024-01-01T00:00:00.000Z",
      "update_time": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

---

## 12. 体系层级管理模块 (hierarchyRouter.js)

### 12.1 获取层级类型列表
- **接口描述**：获取所有层级类型配置。
- **请求方法**：GET
- **请求URL**：`/api/hierarchy-levels/list`
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "系统级",
        "description": "系统级别的节点类型",
        "level": 1,
        "fields": [],
        "create_time": "2024-01-01T00:00:00.000Z",
        "update_time": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

### 12.2 创建层级类型
- **接口描述**：创建新的层级类型。
- **请求方法**：POST
- **请求URL**：`/api/hierarchy-levels/create`
- **请求参数**：
  ```json
  {
    "name": "系统级",
    "description": "系统级别的节点类型",
    "level": 1,
    "fields": []
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "name": "系统级",
      "description": "系统级别的节点类型",
      "level": 1,
      "fields": [],
      "create_time": "2024-01-01T00:00:00.000Z",
      "update_time": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 12.3 获取层级节点树
- **接口描述**：获取完整的层级节点树结构。
- **请求方法**：GET
- **请求URL**：`/api/hierarchy-nodes/list`
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": [
      {
        "id": 1,
        "name": "主系统",
        "type_id": 1,
        "parent_id": null,
        "data": {},
        "children": [
          {
            "id": 2,
            "name": "子系统1",
            "type_id": 1,
            "parent_id": 1,
            "data": {},
            "children": []
          }
        ],
        "create_time": "2024-01-01T00:00:00.000Z",
        "update_time": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

---

## 13. 评审流程模板管理模块 (reviewTemplateRouter.js)

### 13.1 获取评审模板列表
- **接口描述**：获取评审模板列表，支持分页和类型、状态筛选。
- **请求方法**：GET
- **请求URL**：`/api/review-templates/query?current_page=1&page_size=10&template_type=1&status=1`
- **请求参数**：
  - current_page：当前页码，默认1
  - page_size：每页数量，默认10
  - template_type：模板类型（1-技术评审 2-业务评审 3-产品评审）
  - status：状态（1-启用 0-禁用）
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "操作成功",
    "datum": {
      "list": [
        {
          "id": 1,
          "name": "技术评审模板",
          "description": "技术评审流程模板",
          "template_type": 1,
          "is_default": true,
          "status": 1,
          "create_time": 1704067200,
          "update_time": 1704067200,
          "nodes": [
            {
              "id": 1,
              "template_id": 1,
              "name": "需求评审",
              "node_type_id": 3,
              "parent_node_id": null,
              "node_order": 1,
              "assignee_type": 1,
              "assignee_id": 1,
              "duration_limit": 24,
              "status": 1,
              "create_time": 1704067200,
              "update_time": 1704067200
            }
          ]
        }
      ],
      "pagination": {
        "current_page": 1,
        "page_size": 10,
        "total": 1
      }
    }
  }
  ```

### 13.2 创建评审模板
- **接口描述**：创建新的评审模板。
- **请求方法**：POST
- **请求URL**：`/api/review-templates/create`
- **请求参数**：
  ```json
  {
    "name": "新评审模板",
    "description": "评审模板描述",
    "template_type": 1,
    "is_default": false,
    "nodes": [
      {
        "name": "需求评审",
        "node_type_id": 3,
        "parent_node_id": null,
        "node_order": 1,
        "assignee_type": 1,
        "assignee_id": 1,
        "duration_limit": 24
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "成功创建评审模板",
    "datum": {
      "id": 2,
      "name": "新评审模板",
      "description": "评审模板描述",
      "template_type": 1,
      "is_default": false,
      "status": 1,
      "create_time": 1704067200,
      "update_time": 1704067200,
      "nodes": [
        {
          "id": 2,
          "template_id": 2,
          "name": "需求评审",
          "node_type_id": 3,
          "parent_node_id": null,
          "node_order": 1,
          "assignee_type": 1,
          "assignee_id": 1,
          "duration_limit": 24,
          "status": 1,
          "create_time": 1704067200,
          "update_time": 1704067200
        }
      ]
    }
  }
  ```

### 13.3 更新评审模板
- **接口描述**：更新评审模板信息。
- **请求方法**：POST
- **请求URL**：`/api/review-templates/update?id=1`
- **请求参数**：
  ```json
  {
    "name": "更新后的评审模板",
    "description": "更新后的模板描述",
    "template_type": 1,
    "is_default": true,
    "nodes": [
      {
        "name": "需求评审",
        "node_type_id": 3,
        "parent_node_id": null,
        "node_order": 1,
        "assignee_type": 1,
        "assignee_id": 1,
        "duration_limit": 24
      }
    ]
  }
  ```
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "成功更新评审模板",
    "datum": {
      "id": 1,
      "name": "更新后的评审模板",
      "description": "更新后的模板描述",
      "template_type": 1,
      "is_default": true,
      "status": 1,
      "create_time": 1704067200,
      "update_time": 1704067200,
      "nodes": [
        {
          "id": 1,
          "template_id": 1,
          "name": "需求评审",
          "node_type_id": 3,
          "parent_node_id": null,
          "node_order": 1,
          "assignee_type": 1,
          "assignee_id": 1,
          "duration_limit": 24,
          "status": 1,
          "create_time": 1704067200,
          "update_time": 1704067200
        }
      ]
    }
  }
  ```

### 13.4 删除评审模板
- **接口描述**：删除评审模板。
- **请求方法**：POST
- **请求URL**：`/api/review-templates/delete?id=1`
- **响应示例**：
  ```json
  {
    "status": "success",
    "message": "成功删除评审模板",
    "datum": null
  }
  ```

---

## 响应格式说明

### 成功响应
```json
{
  "status": "success",
  "message": "操作成功",
  "datum": {
    "list": [],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total": 0
    }
  }
}
```

### 错误响应
```json
{
  "status": "error",
  "message": "操作失败",
  "datum": null
}
```

---

## 认证方式

所有需要认证的接口都需要在请求头中携带以下信息：
```
Authorization: Bearer <access_token>
```

其中 `<access_token>` 是通过 `/api/auth/login` 接口获取的访问令牌。

---

## 错误码说明

| 错误码 | 描述 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

