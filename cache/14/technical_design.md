# 系统架构可视化技术设计方案

## 1. 技术架构概述

### 核心技术栈
- **D3.js v7**: 数据驱动文档，用于SVG渲染和交互
- **HTML5/CSS3**: 页面结构和样式
- **JavaScript ES6+**: 逻辑实现
- **SVG**: 矢量图形渲染

### 系统组件
1. **数据管理层**: JSON数据结构和加载机制
2. **渲染引擎**: SVG节点和连线渲染
3. **交互控制器**: 缩放、悬停、点击事件处理
4. **虚线框管理器**: 动态虚线框显示逻辑
5. **状态管理器**: 当前视图状态和层级追踪
6. **UI控制面板**: 缩放控制、重置、信息显示

## 2. 数据结构设计

### 层级节点结构
```javascript
{
  "id": "unique_id",           // 唯一标识符
  "name": "节点名称",          // 显示名称
  "type": "system|subsystem|device|software", // 节点类型
  "level": 0-3,                // 层级深度 (0=系统, 3=软件)
  "children": [...],           // 子节点数组
  "x": 0,                      // X坐标
  "y": 0,                      // Y坐标
  "fx": null,                  // 固定X坐标
  "fy": null,                  // 固定Y坐标
  "visible": true,             // 是否可见
  "radius": 0                  // 节点半径
}
```

### 数据生成规则
- **系统层**: 3个节点，层级0，半径20px，蓝色
- **子系统层**: 9个节点，层级1，半径15px，紫色
- **设备层**: 27个节点，层级2，半径10px，绿色
- **软件层**: 81个节点，层级3，半径5px，橙色

## 3. 布局算法

### 力导向布局 (Force-Directed Layout)
使用D3的力导向模拟实现节点自动布局：

```javascript
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id).distance(d => getDistance(d)))
  .force("charge", d3.forceManyBody().strength(d => getStrength(d)))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(d => d.radius + 5));
```

### 层级距离配置
- **系统间距离**: 300px
- **子系统间距离**: 150px
- **设备间距离**: 80px
- **软件间距离**: 40px

## 4. 虚线框系统

### 虚线框数据结构
```javascript
{
  "id": "bbox_system_1",
  "level": 0,
  "targetNode": "system_1",
  "x": 0, "y": 0, "width": 0, "height": 0,
  "visible": true,
  "stroke": "#4285f4",
  "strokeWidth": 3,
  "strokeDasharray": "10,5"
}
```

### 虚线框显示逻辑
```javascript
function updateBoundingBoxes(scale, focusNode) {
  // 根据缩放级别和焦点节点决定显示哪些虚线框
  // 缩放级别阈值：0.5(系统), 1.5(子系统), 3.0(设备)
}
```

### 层级阈值配置
- **scale < 0.5**: 只显示系统虚线框
- **0.5 ≤ scale < 1.5**: 显示系统 + 子系统虚线框
- **1.5 ≤ scale < 3.0**: 显示子系统 + 设备虚线框
- **scale ≥ 3.0**: 只显示设备虚线框

## 5. 缩放交互系统

### 缩放模式
1. **全局缩放**: 在空白区域滚动鼠标滚轮
2. **焦点缩放**: 在节点上悬停时滚动滚轮
3. **平滑过渡**: 使用D3的zoom.transform实现动画

### 缩放约束
- **最小缩放**: 0.1 (显示所有节点)
- **最大缩放**: 8.0 (单个节点细节)
- **缩放中心**: 鼠标位置或节点中心

### 缩放事件处理
```javascript
const zoom = d3.zoom()
  .scaleExtent([0.1, 8])
  .on("zoom", handleZoom)
  .filter(event => {
    // 自定义过滤逻辑，区分全局缩放和焦点缩放
  });
```

## 6. 节点样式系统

### 节点视觉属性
```javascript
const nodeStyles = {
  system:    { radius: 20, color: '#4285f4', stroke: '#1a73e8', strokeWidth: 2 },
  subsystem: { radius: 15, color: '#9c27b0', stroke: '#7b1fa2', strokeWidth: 2 },
  device:    { radius: 10, color: '#4caf50', stroke: '#388e3c', strokeWidth: 1 },
  software:  { radius:  5, color: '#ff9800', stroke: '#f57c00', strokeWidth: 1 }
};
```

### 连线样式
```javascript
const linkStyles = {
  color: '#999',
  width: 1,
  opacity: 0.8
};
```

## 7. 交互事件处理

### 事件类型
1. **鼠标悬停**: 节点放大 + 显示工具提示
2. **鼠标点击**: 聚焦该节点 + 显示详细信息
3. **鼠标滚轮**: 缩放视图或焦点节点
4. **拖拽节点**: 手动调整节点位置

### 事件监听器
```javascript
// 节点事件
nodeElements
  .on("mouseover", handleMouseOver)
  .on("mouseout", handleMouseOut)
  .on("click", handleClick)
  .call(d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded));
```

## 8. 性能优化策略

### 渲染优化
1. **虚拟化**: 只渲染视口内的节点
2. **LOD (Level of Detail)**: 根据缩放级别调整节点细节
3. **批量更新**: 使用requestAnimationFrame批量更新DOM

### 内存管理
1. **对象池**: 重用节点和连线对象
2. **懒加载**: 按需加载深层级节点数据

## 9. 状态管理

### 视图状态
```javascript
const viewState = {
  scale: 1.0,
  translate: [0, 0],
  focusNode: null,
  selectedNode: null,
  visibleLevels: [0, 1, 2, 3],
  boundingBoxes: []
};
```

### 状态更新流程
1. 用户交互触发事件
2. 事件处理器更新状态
3. 状态变更触发重新渲染
4. 动画过渡到新状态

## 10. 响应式设计

### 断点配置
- **大屏**: >1200px (完整功能)
- **中屏**: 768px-1200px (适配布局)
- **小屏**: <768px (简化交互)

### 适配策略
- SVG使用viewBox自适应容器
- 控制面板在小屏下折叠
- 触摸设备支持手势缩放

## 11. 错误处理

### 异常情况
1. **数据加载失败**: 显示错误提示
2. **渲染超时**: 显示加载状态
3. **内存溢出**: 降级渲染质量

### 容错机制
- 数据验证和修复
- 优雅降级策略
- 用户友好的错误提示

## 12. 扩展性设计

### 插件系统
- 自定义节点渲染器
- 自定义布局算法
- 自定义交互处理器

### 配置系统
- 主题配置
- 布局配置
- 交互配置

这个技术设计方案提供了完整的实现蓝图，涵盖了从数据结构到用户交互的所有关键环节，确保系统能够满足120个节点的复杂层级可视化需求。