// 全局变量
let data = null;
let nodes = [];
let links = [];
let simulation = null;
let svg = null;
let g = null;
let zoomBehavior = null;
let currentScale = 1;
let focusNode = null;
let selectedNode = null;
let boundingBoxes = [];
let tooltip = null;

// 节点样式配置
const nodeStyles = {
  system: { radius: 20, color: '#4285F4', stroke: '#1a73e8' },
  subsystem: { radius: 15, color: '#9C27B0', stroke: '#7b1fa2' },
  device: { radius: 10, color: '#4CAF50', stroke: '#388e3c' },
  software: { radius: 5, color: '#FF9800', stroke: '#f57c00' }
};

// 虚线框样式配置
const bboxStyles = {
  system: { stroke: '#4285F4', strokeWidth: 3, dashArray: '10,5' },
  subsystem: { stroke: '#9C27B0', strokeWidth: 2, dashArray: '8,4' },
  device: { stroke: '#4CAF50', strokeWidth: 1, dashArray: '5,3' }
};

// 缩放阈值配置
const scaleThresholds = {
  system: 0.5,
  subsystem: 1.5,
  device: 3.0
};

// 初始化应用
async function init() {
  try {
    showLoading(true);

    // 加载数据
    await loadData();

    // 处理节点和连接
    processData();

    // 初始化SVG
    initSVG();

    // 初始化力导向布局
    initSimulation();

    // 初始化事件监听
    initEventListeners();

    // 初始渲染
    render();

    // 更新状态
    updateStatus();

    showLoading(false);
  } catch (error) {
    console.error('初始化失败:', error);
    showLoading(false);
  }
}

// 加载数据
async function loadData() {
  // 使用内嵌的数据（从system_architecture.js获得）
  data = datum
}

// 处理数据：扁平化节点和生成连接
function processData() {
  nodes = [];
  links = [];

  function traverse(node, parent = null) {
    const nodeData = {
      id: node.id,
      name: node.name,
      type: node.type,
      level: node.level,
      description: node.description,
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100,
      fx: null,
      fy: null,
      visible: true
    };

    // 添加样式属性
    if (nodeStyles[node.type]) {
      Object.assign(nodeData, nodeStyles[node.type]);
    }

    nodes.push(nodeData);

    // 创建连接
    if (parent) {
      links.push({
        id: `${parent.id}-${node.id}`,
        source: parent.id,
        target: node.id,
        sourceNode: parent,
        targetNode: node
      });
    }

    // 处理子节点
    if (node.children) {
      node.children.forEach(child => {
        traverse(child, node);
      });
    }
  }

  traverse(data);
}

// 初始化SVG
function initSVG() {
  const container = document.getElementById('mainSvg');
  const rect = container.getBoundingClientRect();

  svg = d3.select('#mainSvg')
    .attr('width', rect.width)
    .attr('height', rect.height)
    .attr('viewBox', [0, 0, rect.width, rect.height]);

  // 创建主要的g元素
  g = svg.append('g')
    .attr('class', 'main-group');

  // 创建连线组
  g.append('g').attr('class', 'links-group');

  // 创建虚线框组
  g.append('g').attr('class', 'bounding-boxes-group');

  // 创建节点组
  g.append('g').attr('class', 'nodes-group');

  // 创建标签组
  g.append('g').attr('class', 'labels-group');

  // 初始化缩放行为
  zoomBehavior = d3.zoom()
    .scaleExtent([0.1, 8])
    .on('zoom', handleZoom);

  svg.call(zoomBehavior);
}

// 初始化力导向布局
function initSimulation() {
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(d => d.id)
      .distance(d => getLinkDistance(d))
      .strength(0.5))
    .force('charge', d3.forceManyBody()
      .strength(d => getChargeStrength(d)))
    .force('center', d3.forceCenter(
      svg.attr('width') / 2,
      svg.attr('height') / 2
    ))
    .force('collision', d3.forceCollide()
      .radius(d => d.radius + 20))
    .force('x', d3.forceX()
      .x(d => getNodeX(d))
      .strength(0.05))
    .force('y', d3.forceY()
      .y(d => getNodeY(d))
      .strength(0.05));
}

// 获取连接距离
function getLinkDistance(link) {
  const levels = [500, 250, 120, 60];
  return levels[link.sourceNode.level + 1] || 60;
}

// 获取电荷强度
function getChargeStrength(node) {
  const strengths = [-800, -500, -250, -100];
  return strengths[node.level + 1] || -100;
}

// 获取节点X坐标倾向
function getNodeX(node) {
  const systems = 3;
  if (node.level === 0) {
    // 系统节点水平分布
    const index = parseInt(node.id.split('_')[1]) - 1;
    return (svg.attr('width') / (systems + 1)) * (index + 1);
  }
  return svg.attr('width') / 2;
}

// 获取节点Y坐标倾向
function getNodeY(node) {
  if (node.level === 0) {
    return svg.attr('height') / 3;
  } else if (node.level === 1) {
    return svg.attr('height') / 2;
  } else if (node.level === 2) {
    return svg.attr('height') * 2 / 3;
  }
  return svg.attr('height') * 3 / 4;
}

// 处理缩放事件
function handleZoom(event) {
  const { transform } = event;
  currentScale = transform.k;

  g.attr('transform', transform);

  // 更新虚线框
  updateBoundingBoxes();

  // 更新状态
  updateStatus();
}

// 渲染函数
function render() {
  renderLinks();
  renderNodes();
  renderLabels();
  updateBoundingBoxes();

  // 监听模拟更新
  simulation.on('tick', () => {
    updateNodePositions();
    updateLinkPositions();
    updateBoundingBoxPositions();
  });
}

// 渲染连线
function renderLinks() {
  const linkElements = g.select('.links-group')
    .selectAll('.link')
    .data(links, d => d.id);

  linkElements.enter()
    .append('line')
    .attr('class', 'link')
    .attr('id', d => `link-${d.id}`)
    .merge(linkElements)
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

  linkElements.exit().remove();
}

// 渲染节点
function renderNodes() {
  const nodeElements = g.select('.nodes-group')
    .selectAll('.node')
    .data(nodes, d => d.id);

  const nodeEnter = nodeElements.enter()
    .append('g')
    .attr('class', 'node')
    .attr('id', d => `node-${d.id}`)
    .call(d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('click', handleClick)
    .on('dblclick', handleDoubleClick);

  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', d => d.radius)
    .attr('fill', d => d.color)
    .attr('stroke', d => d.stroke);

  nodeElements.merge(nodeEnter);
  nodeElements.exit().remove();
}

// 渲染标签
function renderLabels() {
  const labelElements = g.select('.labels-group')
    .selectAll('.node-label')
    .data(nodes.filter(d => d.level <= 1), d => d.id);

  labelElements.enter()
    .append('text')
    .attr('class', 'node-label')
    .attr('id', d => `label-${d.id}`)
    .text(d => d.name)
    .merge(labelElements)
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.radius + 12);

  labelElements.exit().remove();
}

// 更新节点位置
function updateNodePositions() {
  g.select('.nodes-group')
    .selectAll('.node')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  g.select('.labels-group')
    .selectAll('.node-label')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.radius + 12);
}

// 更新连线位置
function updateLinkPositions() {
  g.select('.links-group')
    .selectAll('.link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);
}

// 拖拽事件处理
function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// 鼠标悬停事件
function handleMouseOver(event, d) {
  // 高亮节点
  d3.select(event.currentTarget).select('.node-circle')
    .attr('r', d.radius * 1.2)
    .attr('stroke-width', 3);

  // 显示工具提示
  showTooltip(event, d);
}

function handleMouseOut(event, d) {
  // 恢复节点样式
  d3.select(event.currentTarget).select('.node-circle')
    .attr('r', d.radius)
    .attr('stroke-width', 2);

  // 隐藏工具提示
  hideTooltip();
}

// 点击事件
function handleClick(event, d) {
  event.stopPropagation();

  // 更新选中状态
  if (selectedNode) {
    d3.select(`#node-${selectedNode.id} .node-circle`)
      .attr('stroke', selectedNode.stroke)
      .attr('stroke-width', 2);
  }

  selectedNode = d;
  d3.select(event.currentTarget).select('.node-circle')
    .attr('stroke', '#FFD700')
    .attr('stroke-width', 3);

  // 应用高亮效果
  applyHighlight(d);

  updateStatus();
}

// 获取节点的所有子孙节点ID
function getDescendantIds(nodeId) {
  const descendantIds = new Set([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    links.forEach(link => {
      if (link.source.id === currentId) {
        const targetId = link.target.id;
        if (!descendantIds.has(targetId)) {
          descendantIds.add(targetId);
          queue.push(targetId);
        }
      }
    });
  }

  return descendantIds;
}

// 应用高亮效果
function applyHighlight(node) {
  const descendantIds = getDescendantIds(node.id);

  // 处理节点
  g.select('.nodes-group')
    .selectAll('.node')
    .classed('node-dimmed', d => !descendantIds.has(d.id))
    .classed('node-highlighted', d => descendantIds.has(d.id));

  // 处理连线
  g.select('.links-group')
    .selectAll('.link')
    .classed('link-dimmed', d => !descendantIds.has(d.source.id) && !descendantIds.has(d.target.id))
    .classed('link-highlighted', d => descendantIds.has(d.source.id) && descendantIds.has(d.target.id));

  // 处理虚线框
  g.select('.bounding-boxes-group')
    .selectAll('.bounding-box')
    .classed('bbox-dimmed', d => !descendantIds.has(d.node.id))
    .classed('bbox-highlighted', d => descendantIds.has(d.node.id));

  // 处理标签
  g.select('.labels-group')
    .selectAll('.node-label')
    .classed('label-dimmed', d => !descendantIds.has(d.id));
}

// 清除高亮效果
function clearHighlight() {
  g.select('.nodes-group')
    .selectAll('.node')
    .classed('node-dimmed', false)
    .classed('node-highlighted', false);

  g.select('.links-group')
    .selectAll('.link')
    .classed('link-dimmed', false)
    .classed('link-highlighted', false);

  g.select('.bounding-boxes-group')
    .selectAll('.bounding-box')
    .classed('bbox-dimmed', false)
    .classed('bbox-highlighted', false);

  g.select('.labels-group')
    .selectAll('.node-label')
    .classed('label-dimmed', false);
}

// 双击事件
function handleDoubleClick(event, d) {
  event.stopPropagation();
  focusOnNode(d);
}

// 聚焦到节点
function focusOnNode(node) {
  focusNode = node;

  const transform = d3.zoomIdentity
    .translate(
      svg.attr('width') / 2 - node.x,
      svg.attr('height') / 2 - node.y
    )
    .scale(2);

  svg.transition()
    .duration(750)
    .call(zoomBehavior.transform, transform);
}

// 显示工具提示
function showTooltip(event, d) {
  const tooltip = d3.select('#tooltip');

  tooltip.html(`
                <div class="tooltip-title">${d.name}</div>
                <div class="tooltip-content">
                    <div>类型: ${getTypeLabel(d.type)}</div>
                    <div>层级: ${d.level + 1}</div>
                    <div>${d.description}</div>
                </div>
            `);

  tooltip.style('display', 'block')
    .style('left', (event.clientX + 10) + 'px')
    .style('top', (event.clientY - 10) + 'px');
}

// 隐藏工具提示
function hideTooltip() {
  d3.select('#tooltip').style('display', 'none');
}

// 获取类型标签
function getTypeLabel(type) {
  const labels = {
    system: '系统',
    subsystem: '子系统',
    device: '设备',
    software: '软件'
  };
  return labels[type] || type;
}

// 更新虚线框
function updateBoundingBoxes() {
  const systemNodes = nodes.filter(d => d.type === 'system');
  const subsystemNodes = nodes.filter(d => d.type === 'subsystem');
  const deviceNodes = nodes.filter(d => d.type === 'device');

  // 确定要显示的虚线框
  let boxesToShow = [];

  if (currentScale < scaleThresholds.system) {
    // 只显示系统虚线框
    boxesToShow = systemNodes.map(node => ({
      id: `bbox-${node.id}`,
      node: node,
      type: 'system',
      style: bboxStyles.system
    }));
  } else if (currentScale < scaleThresholds.subsystem) {
    // 显示系统和子系统虚线框
    boxesToShow = [
      ...systemNodes.map(node => ({
        id: `bbox-${node.id}`,
        node: node,
        type: 'system',
        style: bboxStyles.system
      })),
      ...subsystemNodes.map(node => ({
        id: `bbox-${node.id}`,
        node: node,
        type: 'subsystem',
        style: bboxStyles.subsystem
      }))
    ];
  } else if (currentScale < scaleThresholds.device) {
    // 显示子系统和设备虚线框
    boxesToShow = [
      ...subsystemNodes.map(node => ({
        id: `bbox-${node.id}`,
        node: node,
        type: 'subsystem',
        style: bboxStyles.subsystem
      })),
      ...deviceNodes.map(node => ({
        id: `bbox-${node.id}`,
        node: node,
        type: 'device',
        style: bboxStyles.device
      }))
    ];
  } else {
    // 只显示设备虚线框
    boxesToShow = deviceNodes.map(node => ({
      id: `bbox-${node.id}`,
      node: node,
      type: 'device',
      style: bboxStyles.device
    }));
  }

  // 渲染虚线框
  renderBoundingBoxes(boxesToShow);
}

// 渲染虚线框
function renderBoundingBoxes(boxes) {
  const boxElements = g.select('.bounding-boxes-group')
    .selectAll('.bounding-box')
    .data(boxes, d => d.id);

  boxElements.enter()
    .append('rect')
    .attr('class', 'bounding-box')
    .attr('id', d => d.id)
    .merge(boxElements)
    .each(function (d) {
      const rect = getBoundingRect(d.node);
      d3.select(this)
        .attr('x', rect.x)
        .attr('y', rect.y)
        .attr('width', rect.width)
        .attr('height', rect.height)
        .attr('stroke', d.style.stroke)
        .attr('stroke-width', d.style.strokeWidth / currentScale)
        .attr('stroke-dasharray', d.style.dashArray)
        .classed('bbox-fadein', true);
    });

  boxElements.exit().remove();
}

// 获取节点的边界矩形
function getBoundingRect(node) {
  const padding = 40;
  const children = nodes.filter(d => {
    // 找到该节点的所有子节点
    return links.some(link =>
      link.source.id === node.id && link.target.id === d.id
    );
  });

  if (children.length === 0) {
    return {
      x: node.x - node.radius - padding,
      y: node.y - node.radius - padding,
      width: (node.radius + padding) * 2,
      height: (node.radius + padding) * 2
    };
  }

  const minX = Math.min(node.x, ...children.map(d => d.x));
  const maxX = Math.max(node.x, ...children.map(d => d.x));
  const minY = Math.min(node.y, ...children.map(d => d.y));
  const maxY = Math.max(node.y, ...children.map(d => d.y));

  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2
  };
}

// 更新虚线框位置
function updateBoundingBoxPositions() {
  g.select('.bounding-boxes-group')
    .selectAll('.bounding-box')
    .each(function (d) {
      const rect = getBoundingRect(d.node);
      d3.select(this)
        .attr('x', rect.x)
        .attr('y', rect.y)
        .attr('stroke-width', d.style.strokeWidth / currentScale);
    });
}

// 更新状态显示
function updateStatus() {
  document.getElementById('scaleValue').textContent =
    Math.round(currentScale * 100) + '%';

  document.getElementById('focusNode').textContent =
    focusNode ? focusNode.name : '无';

  document.getElementById('selectedNode').textContent =
    selectedNode ? selectedNode.name : '无';
}

// 显示/隐藏加载状态
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// 初始化事件监听器
function initEventListeners() {
  // 控制按钮事件
  document.getElementById('resetView').addEventListener('click', resetView);
  document.getElementById('fitToView').addEventListener('click', fitToView);
  document.getElementById('centerView').addEventListener('click', centerView);

  // 搜索功能
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // 窗口大小调整
  window.addEventListener('resize', handleResize);

  // 点击空白处取消选择
  svg.on('click', function (event) {
    if (event.target === this) {
      if (selectedNode) {
        d3.select(`#node-${selectedNode.id} .node-circle`)
          .attr('stroke', selectedNode.stroke)
          .attr('stroke-width', 2);
        selectedNode = null;
        clearHighlight();
        updateStatus();
      }
    }
  });
}

// 重置视图
function resetView() {
  focusNode = null;
  selectedNode = null;
  clearHighlight();

  svg.transition()
    .duration(750)
    .call(zoomBehavior.transform, d3.zoomIdentity);
}

// 适应画布
function fitToView() {
  const bounds = g.node().getBBox();
  const width = svg.attr('width');
  const height = svg.attr('height');

  const scale = Math.min(
    width / bounds.width,
    height / bounds.height
  ) * 0.8;

  const transform = d3.zoomIdentity
    .translate(
      width / 2 - (bounds.x + bounds.width / 2) * scale,
      height / 2 - (bounds.y + bounds.height / 2) * scale
    )
    .scale(scale);

  svg.transition()
    .duration(750)
    .call(zoomBehavior.transform, transform);
}

// 居中显示
function centerView() {
  const bounds = g.node().getBBox();
  const width = svg.attr('width');
  const height = svg.attr('height');

  const transform = d3.zoomIdentity
    .translate(
      width / 2 - (bounds.x + bounds.width / 2) * currentScale,
      height / 2 - (bounds.y + bounds.height / 2) * currentScale
    )
    .scale(currentScale);

  svg.transition()
    .duration(750)
    .call(zoomBehavior.transform, transform);
}

// 搜索功能
function handleSearch(event) {
  const query = event.target.value.toLowerCase();
  if (!query) return;

  const foundNode = nodes.find(node =>
    node.name.toLowerCase().includes(query)
  );

  if (foundNode) {
    focusOnNode(foundNode);
  }
}

// 窗口大小调整
function handleResize() {
  const container = document.getElementById('mainSvg');
  const rect = container.getBoundingClientRect();

  svg.attr('width', rect.width)
    .attr('height', rect.height)
    .attr('viewBox', [0, 0, rect.width, rect.height]);

  simulation.force('center', d3.forceCenter(rect.width / 2, rect.height / 2));
  simulation.alpha(0.3).restart();
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);