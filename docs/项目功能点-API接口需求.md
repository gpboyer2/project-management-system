# CSSC Node-View 项目功能点汇总（API接口需求）

> 更新时间：2025年11月24日 12:23
> 项目类型：基于Node-RED的可视化流程设计与系统测试平台
> 技术栈：Vue 3 + TypeScript + Vite + LogicFlow + Element Plus + Pinia
> 目的：为后端API接口开发提供完整的功能需求支撑

**说明**：本文档仅列出需要后端API接口支持的功能点，纯前端交互功能（如UI切换、拖拽、展开收起等）不在此列。

---

## 1. 用户认证与权限管理

### 1.1 用户认证接口
- **用户登录**：`POST /api/auth/login` - 用户名密码登录，返回JWT token
- **用户登出**：`POST /api/auth/logout` - 清除服务端会话
- **刷新Token**：`POST /api/auth/refresh` - 刷新过期的访问令牌
- **获取当前用户信息**：`GET /api/auth/me` - 获取当前登录用户详细信息

### 1.2 用户管理接口
- **获取用户列表**：`GET /api/users/list` - 支持分页、搜索、筛选
  - 查询参数：`page`, `size`, `keyword`, `role`, `status`
- **创建用户**：`POST /api/users/create` - 创建新用户账户
- **获取用户详情**：`GET /api/users/:id` - 获取指定用户的完整信息
- **更新用户信息**：`PUT /api/users/:id` - 更新用户基本信息和权限
- **删除用户**：`DELETE /api/users/:id` - 删除用户账户
- **复制用户**：`POST /api/users/:id/duplicate` - 复制用户创建副本
- **批量启用用户**：`POST /api/users/batch/enable` - 批量启用用户
- **批量禁用用户**：`POST /api/users/batch/disable` - 批量禁用用户
- **批量删除用户**：`POST /api/users/batch/delete` - 批量删除用户

### 1.3 角色权限接口
- **获取角色列表**：`GET /api/roles` - 获取所有角色定义（管理员/普通用户/访客）
- **获取权限列表**：`GET /api/permissions` - 获取所有功能权限
- **分配用户角色**：`POST /api/users/:id/roles` - 为用户分配角色
- **获取用户权限**：`GET /api/users/:id/permissions` - 获取用户的所有权限

---

## 2. 流程图管理（通信协议流程画布）

### 2.1 流程图CRUD接口
- **获取流程图列表**：`GET /api/flowcharts/list` - 获取所有流程图配置
  - 查询参数：`softwareId` - 按软件ID筛选
- **获取流程图详情**：`GET /api/flowcharts/:id` - 获取指定流程图的完整数据
- **创建流程图**：`POST /api/flowcharts/create` - 创建新的流程图配置
  - 请求体：`{ softwareId, name, description, nodes[], edges[] }`
- **更新流程图**：`PUT /api/flowcharts/:id` - 更新流程图配置
  - 请求体：`{ name, description, nodes[], edges[] }`
- **删除流程图**：`DELETE /api/flowcharts/:id` - 删除流程图

### 2.2 流程图导入导出
- **导出流程图**：`GET /api/flowcharts/:id/export` - 导出为JSON格式
  - 响应：JSON文件下载
- **导入流程图**：`POST /api/flowcharts/import` - 从JSON导入流程图
  - 请求体：`multipart/form-data` 或 JSON数据

### 2.3 节点配置管理
- **获取节点类型列表**：`GET /api/flowcharts/node-types/list` - 获取所有可用节点类型
  - 分类：数据传输（TCP/UDP/串口/CAN）、协议处理、通用（start/fetch/function/switch/delay/swap）、网络（MQTT/HTTP/WebSocket）、存储
- **获取节点配置模板**：`GET /api/flowcharts/node-types/:type/template` - 获取节点默认配置
- **更新节点属性**：`PUT /api/flowcharts/:id/nodes/:nodeId` - 更新节点配置
  - 请求体：`{ properties: {...} }`
- **更新连接属性**：`PUT /api/flowcharts/:id/edges/:edgeId` - 更新连接线标签和颜色
  - 请求体：`{ label, color, type }`

### 2.4 代码生成接口
- **生成C++代码**：`POST /api/flowcharts/:id/generate-code` - 根据流程图生成C++代码模块
  - 响应：`{ code: string, files: [...] }`
- **预览生成代码**：`GET /api/flowcharts/:id/preview-code` - 预览生成的代码
- **下载代码包**：`GET /api/flowcharts/:id/download-code` - 下载完整代码包

---

## 3. 体系配置管理（系统级设计）

### 3.1 层级节点管理接口
- **获取层级节点列表**：`GET /api/hierarchy-nodes/list` - 获取所有层级节点
  - 查询参数：`keyword` - 搜索关键词
- **创建层级节点**：`POST /api/hierarchy-nodes/create` - 创建新节点
  - 请求体：`{ node_type_id, name, description, status, parent_id }`
- **获取层级节点详情**：`GET /api/hierarchy-nodes/:id` - 获取节点完整信息
- **更新层级节点**：`PUT /api/hierarchy-nodes/:id` - 更新节点信息
- **删除层级节点**：`DELETE /api/hierarchy-nodes/:id` - 删除节点及其所有子节点

### 3.2 通信节点管理接口
- **获取通信节点列表**：`GET /api/communication-nodes/list` - 获取所有通信节点
  - 查询参数：`nodeId` - 按层级节点筛选
- **创建通信节点**：`POST /api/communication-nodes/create` - 为层级节点添加通信节点
  - 请求体：`{ nodeId, name, type, host, port, protocol, description }`
- **更新通信节点**：`PUT /api/communication-nodes/:id` - 更新通信节点配置
- **删除通信节点**：`DELETE /api/communication-nodes/:id` - 删除通信节点
- **获取通信节点状态**：`GET /api/communication-nodes/:id/status` - 获取节点连接状态
- **测试通信节点连接**：`POST /api/communication-nodes/:id/test` - 测试节点连通性
  - 响应：`{ success: boolean, message: string, responseTime: number }`

### 3.3 右键菜单操作接口
- **获取上下文菜单**：`GET /api/context-menu/list` - 获取右键菜单配置
  - 查询参数：`targetType`（层级类型名）、`targetId`
- **执行菜单操作**：`POST /api/context-menu/execute` - 执行右键菜单操作
  - 请求体：`{ action, targetType, targetId, params }`

### 3.4 体系树查询接口
- **获取完整体系树**：`GET /api/system-tree/list` - 获取完整的动态层级树形结构
- **搜索体系节点**：`GET /api/system-tree/search` - 按关键词搜索节点
  - 查询参数：`keyword` - 搜索关键词

---

## 4. 拓扑展示

### 4.1 拓扑数据接口
- **获取拓扑图数据**：`GET /api/topology` - 获取完整的拓扑图数据
  - 响应：`{ nodes: [...], edges: [...] }`

---

## 5. 报文配置管理

### 5.1 报文CRUD接口
- **获取报文列表**：`GET /api/packets/list` - 获取所有报文配置
  - 查询参数：`page`, `size`, `keyword`, `hierarchy_node_id`, `protocol`, `status`
- **获取报文详情**：`GET /api/packets/:id` - 获取报文完整配置（含字段定义）
- **创建报文**：`POST /api/packets/create` - 创建新报文
  - 请求体：`{ name, description, hierarchy_node_id, protocol, status, fields: [...] }`
- **更新报文**：`PUT /api/packets/:id` - 更新报文配置
- **删除报文**：`DELETE /api/packets/:id` - 删除报文
- **复制报文**：`POST /api/packets/:id/duplicate` - 复制报文创建副本

### 5.2 报文批量操作接口
- **批量启用报文**：`POST /api/packets/batch/enable` - 批量启用
  - 请求体：`{ ids: [...] }`
- **批量禁用报文**：`POST /api/packets/batch/disable` - 批量禁用
- **批量删除报文**：`POST /api/packets/batch/delete` - 批量删除

### 5.3 报文导入导出接口
- **导出报文**：`GET /api/packets/:id/export` - 导出单个报文为JSON
- **批量导出报文**：`POST /api/packets/batch/export` - 批量导出
  - 请求体：`{ ids: [...] }`
  - 响应：ZIP文件包含多个JSON
- **导入报文**：`POST /api/packets/import` - 从JSON导入报文
  - 请求体：`multipart/form-data` 或 JSON数据

### 5.4 字段类型管理接口
- **获取字段类型列表**：`GET /api/packets/field-types/list` - 获取所有可用字段类型
  - 包含：UnsignedInt, Int8/16/32/64, Uint8/16/32/64, Float/Double, Bool, String, Struct, Array, Bit, Enum
- **获取字段类型配置**：`GET /api/packets/field-types/:type` - 获取字段类型配置
  - 响应：`{ type, name, description, ... }`
  
### 5.5 字段管理接口
- **添加字段**：`POST /api/packets/:id/fields` - 为报文添加字段
  - 请求体：`{ fieldType, fieldName, description, ... }`
- **更新字段**：`PUT /api/packets/:id/fields/:fieldId` - 更新字段配置
- **删除字段**：`DELETE /api/packets/:id/fields/:fieldId` - 删除字段
- **添加嵌套字段**：`POST /api/packets/:id/fields/:parentId/nested` - 为Struct/Array添加子字段
- **获取扁平化字段列表**：`GET /api/packets/:id/fields/flattened` - 获取扁平化的字段结构
- **切换字段展开状态**：`PUT /api/packets/:id/fields/:fieldId/toggle` - 切换Struct/Array字段展开/收起
- **更新字段顺序**：`PUT /api/packets/:id/fields/reorder` - 调整字段顺序
  - 请求体：`{ fieldIds: [...] }`

### 5.6 层级节点接口
- **获取层级节点列表**：`GET /api/packet-messages/nodes/list` - 获取所有关联的层级节点列表

---

## 6. 系统设置管理

### 6.1 系统配置接口
- **获取系统配置**：`GET /api/settings/list` - 获取所有系统配置
- **更新系统配置**：`PUT /api/settings/:id` - 更新系统配置
  - 请求体：`{ systemName, description, sessionTimeout, passwordPolicy, ... }`
- **重置系统配置**：`POST /api/settings/reset` - 恢复默认配置
- **上传Logo**：`POST /api/settings/logo` - 上传系统Logo
  - 请求体：`multipart/form-data`

### 6.2 主题配置接口
- **获取用户主题偏好**：`GET /api/user/theme` - 获取用户主题设置
- **更新用户主题偏好**：`PUT /api/user/theme` - 保存用户主题选择
  - 请求体：`{ theme: 'light' | 'dark' }`
- **获取系统主题配置**：`GET /api/settings/theme` - 获取系统默认主题配置

### 6.3 通知配置接口
- **获取通知配置**：`GET /api/settings/notifications` - 获取通知配置
- **更新通知配置**：`PUT /api/settings/notifications` - 更新通知设置
- **测试邮件通知**：`POST /api/settings/notifications/test-email` - 发送测试邮件

---

## 7. 体系层级配置管理

### 7.1 层级类型管理接口
- **获取层级类型列表**：`GET /api/hierarchy-levels/list` - 获取所有层级类型配置
- **创建层级类型**：`POST /api/hierarchy-levels/create` - 创建新的层级类型
  - 请求体：`{ type_name, display_name, icon_class, description, order, parent_id }`
- **更新层级类型**：`PUT /api/hierarchy-levels/:id` - 更新层级类型配置
- **删除层级类型**：`DELETE /api/hierarchy-levels/:id` - 删除层级类型

### 7.2 层级字段管理接口
- **添加层级字段**：`POST /api/hierarchy-levels/:id/fields` - 为层级添加自定义字段
  - 请求体：`{ name, type, required, defaultValue }`
- **更新层级字段**：`PUT /api/hierarchy-levels/:id/fields/:fieldId` - 更新字段配置
- **删除层级字段**：`DELETE /api/hierarchy-levels/:id/fields/:fieldId` - 删除字段

### 7.3 动态层级节点接口
- **获取层级节点树**：`GET /api/hierarchy-nodes/list` - 获取完整的动态层级树
- **创建层级节点**：`POST /api/hierarchy-nodes/create` - 创建新节点
  - 请求体：`{ levelId, name, parent_id, customFields: {...} }`
- **更新层级节点**：`PUT /api/hierarchy-nodes/:id` - 更新节点信息
- **删除层级节点**：`DELETE /api/hierarchy-nodes/:id` - 删除节点及其子节点

---

## 8. 数据统计与监控

### 8.1 统计数据接口
- **获取系统统计**：`GET /api/statistics/system/list` - 获取系统整体统计数据
  - 响应：`{ userCount, nodeCount, communicationNodeCount, packetCount, ... }`
- **获取用户活动统计**：`GET /api/statistics/user-activity/list` - 获取用户活动统计
- **获取资源使用统计**：`GET /api/statistics/resource-usage/list` - 获取资源使用情况

### 8.2 日志查询接口
- **获取操作日志**：`GET /api/logs/operations/list` - 获取用户操作日志
  - 查询参数：`page`, `size`, `userId`, `action`, `startTime`, `endTime`
- **获取系统日志**：`GET /api/logs/system/list` - 获取系统运行日志
- **获取错误日志**：`GET /api/logs/errors/list` - 获取错误日志

---

## 9. 文件管理

### 9.1 文件上传下载接口
- **上传文件**：`POST /api/files/upload` - 上传文件
  - 请求体：`multipart/form-data`
  - 响应：`{ fileId, fileName, fileUrl, size }`
- **下载文件**：`GET /api/files/:id/download` - 下载文件
- **删除文件**：`DELETE /api/files/:id` - 删除文件
- **获取文件列表**：`GET /api/files/list` - 获取文件列表
  - 查询参数：`page`, `size`, `type`, `uploaderId`

---

## 10. 通知消息

### 10.1 消息管理接口
- **获取消息列表**：`GET /api/notifications/list` - 获取用户消息列表
  - 查询参数：`page`, `size`, `status` (read/unread)
- **标记消息已读**：`PUT /api/notifications/:id/read` - 标记消息为已读
- **批量标记已读**：`POST /api/notifications/batch/read` - 批量标记已读
- **删除消息**：`DELETE /api/notifications/:id` - 删除消息
- **获取未读消息数**：`GET /api/notifications/unread-count` - 获取未读消息数量

---

## 总结


所有接口均遵循RESTful API设计规范，支持标准的HTTP方法（GET、POST、PUT、DELETE），并提供完整的请求参数和响应格式说明。

**接口设计原则**：
- 统一的响应格式：`{ code, data, message, success, timestamp }`
- 统一的错误处理机制
- 支持分页、搜索、筛选等通用功能
- 支持批量操作提升效率
- 完整的CRUD操作支持
- 文件上传下载支持
- 实时状态查询支持
- WebSocket支持（用于实时更新）
- JWT认证和权限控制
