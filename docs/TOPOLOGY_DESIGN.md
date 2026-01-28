# 局部拓扑图需求文档

## 一、功能概述

展示当前系统节点与其他节点之间的软件级连接关系。基于通信接口（TCP Server/Client）的 IP:port 匹配，自动发现和展示连接关系。

## 二、UI 设计

### 2.1 节点样式

- **节点形状**：大矩形（约 220px × 200px，接近正方形）
- **节点结构**：
  ```
  ┌─────────────────────────┐
  │   上半部分               │
  │   软件名称               │
  │   软件ID                 │
  ├─────────────────────────┤
  │   下半部分               │
  │   接口汇总               │
  │   TCP Server: 2个        │
  │   TCP Client: 1个        │
  │   端口: 8080, 9000       │
  └─────────────────────────┘
  ```

### 2.2 连线样式

- **连接规则**：软件之间一条连线
- **连线颜色**：
  - 绿色：当前节点发送 → 其他节点（TCP Client 连接）
  - 蓝色：其他节点 → 当前节点（TCP Server 连接）
- **箭头方向**：表示数据流向

### 2.3 布局

- **中心节点**：当前查看的节点（固定在画布中心）
- **周边节点**：与中心节点有连接关系的其他节点（辐射状分布）

## 三、交互配置

- **禁用控制按钮**：不显示导航按钮
- **禁用拖拽**：节点不可拖动
- **禁用缩放**：画布不可缩放

## 四、数据结构

### 4.1 节点数据

```typescript
interface TopologyNode {
  id: string;           // 节点ID (systemNodeId)
  label: string;        // 软件名称
  name: string;         // 软件名称（备用）
  type: 'center' | 'connected';  // 节点类型
  softwareId: string;   // 软件ID
  interfaceSummary: {   // 接口汇总
    tcpServerCount: number;
    tcpClientCount: number;
    ports: number[];
  };
  x?: number;
  y?: number;
  fixed?: { x: boolean; y: boolean };
}
```

### 4.2 连线数据

```typescript
interface TopologyEdge {
  id: string;
  from: string;         // 源节点ID
  to: string;           // 目标节点ID
  label: string;        // 连线标签（如 "发送 → 192.168.1.100:8080"）
  direction: 'in' | 'out';  // in=接收, out=发送
  color: string;
  arrows: 'to';
}
```

## 五、连接匹配规则

- **发送方向**：当前节点的 TCP Client (`remote_host:remote_port`) → 其他节点的 TCP Server (`host:port`)
- **接收方向**：其他节点的 TCP Client (`remote_host:remote_port`) → 当前节点的 TCP Server (`host:port`)

## 六、未来扩展方向（协议级连接）

- **当前**：软件级，A软件 ↔ B软件（一条线）
- **扩展**：协议级，A_P1 → B_P1、A_P1 → B_P2、A_P1 → C_P1（一对多或多对一）
- **扩展时**：大矩形内部显示小矩形（协议节点），协议之间用连线

```
当前（简化版）          未来（扩展版）
┌─────┐               ┌─────┐
│  A  │─────────────▶ │  B  │
└─────┘               └─────┘

                      ┌─────────────────┐
                      │       A         │
                      │ ┌───┐ ┌───┐    │
                      │ │P1 │ │P2 │    │
                      │ └─┬─┘ └───┘    │
                      └───┼────────────┘
                          │
                ┌─────────┼─────────┐
                ▼         ▼         ▼
          ┌─────────┐ ┌─────────┐ ┌─────────┐
          │    B    │ │    C    │ │    D    │
          │ ┌───┐   │ │ ┌───┐   │ │ ┌───┐   │
          │ │P1 │   │ │ │P1 │   │ │ │P1 │   │
          │ └───┘   │ │ └───┘   │ │ └───┘   │
          └─────────┘ └─────────┘ └─────────┘
```
