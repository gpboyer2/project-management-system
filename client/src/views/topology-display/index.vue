<template>
  <div class="page-topology-display">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="control-group">
        <label class="control-label">
          模拟协议变更：
        </label>

        <select v-model="selectedProtocol" class="protocol-select">
          <option value="">
            -- 选择协议 --
          </option>

          <option value="mqtt">
            MQTT (车云通信)
          </option>

          <option value="can">
            CAN-FD (底盘控制)
          </option>

          <option value="someip">
            SOME/IP (域间服务)
          </option>
        </select>

        <el-button class="btn btn-primary" type="primary" @click="analyzeImpact">
          分析影响
        </el-button>

        <el-button class="btn btn-secondary" @click="resetAnalysis">
          重置
        </el-button>
      </div>

      <div class="info-panel">
        {{ infoText }}
      </div>
    </div>

    <!-- 主画布 -->
    <div ref="canvasRef" class="main-canvas">
      <!-- 导航条 -->
      <div class="navbar">
        <div class="nav-item" @click="showLevel0">
          体系全景
        </div>

        <template v-if="currentView === 'l2'">
          <div class="nav-arrow">
            &gt;
          </div>

          <div class="nav-item">
            智能汽车 (内部交互)
          </div>
        </template>
      </div>

      <!-- SVG连线层 -->
      <svg ref="svgLayerRef" class="svg-layer" />

      <!-- 接口锚点层 -->
      <div class="anchor-layer">
        <div
          v-for="anchor in currentAnchorList"
          :key="anchor.id"
          class="interface-anchor"
          :class="{ 'anchor-affected': isAnchorAffected(anchor) }"
          :style="{ left: anchor.x + 'px', top: anchor.y + 'px' }"
          @mouseenter="showTooltip(anchor, $event)"
          @mouseleave="hideTooltip"
          @click="showDetailCard(anchor, $event)"
        >
          <span class="anchor-protocol">
            {{ anchor.protocol }}
          </span>

          <span class="anchor-divider">
            |
          </span>

          <span class="anchor-count">
            {{ anchor.messageCount }} Msgs
          </span>
        </div>
      </div>

      <!-- 悬停 Tooltip -->
      <div
        v-if="tooltipVisible"
        class="anchor-tooltip"
        :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
      >
        <div class="tooltip-title">
          {{ currentTooltip.title }}
        </div>

        <div class="tooltip-desc">
          {{ currentTooltip.description }}
        </div>
      </div>

      <!-- 可拖拽详情卡片 -->
      <div
        v-if="detailCardVisible"
        class="detail-card"
        :style="{ left: detailCardPosition.x + 'px', top: detailCardPosition.y + 'px' }"
      >
        <div
          class="detail-card-header"
          @mousedown="startDragCard"
        >
          <span class="card-title">
            {{ currentDetailCard.protocol }} 接口详情
          </span>

          <el-button class="card-close" link @click="hideDetailCard">
            ×
          </el-button>
        </div>

        <div class="detail-card-body">
          <div class="card-summary">
            <span class="summary-label">
              通道：
            </span>

            <span class="summary-value">
              {{ currentDetailCard.source }} → {{ currentDetailCard.target }}
            </span>
          </div>

          <div class="card-messages">
            <div class="messages-header">
              <span>报文列表</span>

              <span class="messages-count">
                {{ currentDetailCard.messageList.length }} 条
              </span>
            </div>

            <div class="messages-list">
              <div
                v-for="msg in currentDetailCard.messageList"
                :key="msg.id"
                class="message-item"
                :class="{ 'message-selected': selectedMessageId === msg.id }"
                @click="selectMessage(msg)"
              >
                <div class="message-name">
                  {{ msg.name }}
                </div>

                <div class="message-meta">
                  <span class="message-id">
                    ID: {{ msg.id }}
                  </span>

                  <span class="message-size">
                    {{ msg.size }} bytes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 节点层 -->
      <div ref="nodeLayerRef" class="node-layer">
        <!-- Level 0 视图 -->
        <template v-if="currentView === 'l0'">
          <div
            v-for="node in l0Nodes"
            :id="node.id"
            :key="node.id"
            class="node l0-system"
            :class="{ 'affected-node': affectedNodeList.includes(node.id) }"
            :style="{ left: (node.x - 80) + 'px', top: (node.y - 50) + 'px' }"
            @dblclick="node.id === 'sys_car' ? showLevel2() : null"
          >
            <div>{{ node.name }}</div>

            <div class="node-hint">
              [双击钻取]
            </div>
          </div>
        </template>

        <!-- Level 2 视图 -->
        <template v-if="currentView === 'l2'">
          <!-- 外部上下文节点 -->
          <div
            v-for="node in l2Context"
            :id="node.id"
            :key="node.id"
            class="node context-node"
            :class="{ 'affected-node': affectedNodeList.includes(node.id) }"
            :style="{ left: (node.x - 60) + 'px', top: (node.y - 40) + 'px' }"
          >
            <div class="context-label">
              外部系统
            </div>

            <div>{{ node.name }}</div>
          </div>

          <!-- 系统边界框 -->
          <div class="system-boundary">
            <div class="boundary-label">
              智能汽车 (System Boundary)
            </div>
          </div>

          <!-- 内部硬件节点 -->
          <div
            v-for="hw in l2Hardware"
            :id="hw.id"
            :key="hw.id"
            class="node internal-hardware"
            :class="{ 'affected-node': affectedNodeList.includes(hw.id) }"
            :style="{ left: hw.x + 'px', top: hw.y + 'px' }"
          >
            <div class="hw-header">
              {{ hw.name }}
            </div>

            <!-- 内部节点 -->
            <div
              v-for="sw in getChildNodesByParent(hw.id)"
              :id="sw.id"
              :key="sw.id"
              class="internal-node"
              :class="{ 'affected-node': affectedNodeList.includes(sw.id) }"
            >
              {{ sw.name }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ElButton } from 'element-plus';

// 接口定义
interface MessageInfo {
  id: string;
  name: string;
  size: number;
  description: string;
}

interface EdgeInfo {
  id: string;
  source: string;
  target: string;
  label: string;
  proto: string;
  view: string;
  summary: string;
  messageList: MessageInfo[];
}

interface AnchorInfo {
  id: string;
  edgeId: string;
  protocol: string;
  messageCount: number;
  x: number;
  y: number;
  edge: EdgeInfo;
}

// 当前视图
const currentView = ref<'l0' | 'l2'>('l0');

// 选中的协议
const selectedProtocol = ref('');

// 受影响的节点列表
const affectedNodeList = ref<string[]>([]);

// 受影响的连线列表
const affectedEdgeList = ref<string[]>([]);

// 选中的报文ID
const selectedMessageId = ref<string | null>(null);

// 组件引用
const canvasRef = ref<HTMLElement>();
const svgLayerRef = ref<SVGSVGElement>();
const nodeLayerRef = ref<HTMLElement>();

// Tooltip 状态
const tooltipVisible = ref(false);
const tooltipPosition = ref({ x: 0, y: 0 });
const currentTooltip = ref({ title: '', description: '' });

// 详情卡片状态
const detailCardVisible = ref(false);
const detailCardPosition = ref({ x: 100, y: 100 });
const currentDetailCard = ref({
  protocol: '',
  source: '',
  target: '',
  edgeId: '',
  messageList: [] as MessageInfo[]
});

// 拖拽状态
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// 锚点列表
const anchorList = ref<AnchorInfo[]>([]);

// 信息面板文字
const infoText = computed(() => {
  if (currentView.value === 'l0') {
    return '当前视图：Level 0 体系全景\n展示宏观系统关系。点击 [智能汽车] 进入内部交互视图。\n\n悬停锚点查看摘要，点击查看报文详情。';
  }
  return '当前视图：Level 2 系统内部\n注意观察右侧和上方的外部节点，它们展示了内部组件如何与外界通信。\n\n点击报文可高亮影响范围。';
});

// 当前视图的锚点列表
const currentAnchorList = computed(() => {
  return anchorList.value.filter(a => a.edge.view === currentView.value);
});

// Level 0 节点数据
const l0Nodes = ref([
  { id: 'sys_car', name: '智能汽车', x: 400, y: 300 },
  { id: 'sys_cloud', name: '车企云平台', x: 400, y: 100 },
  { id: 'sys_app', name: '手机 App', x: 700, y: 300 }
]);

// Level 2 外部上下文节点
const l2Context = ref([
  { id: 'ctx_cloud', name: '车企云平台', x: 400, y: 50 },
  { id: 'ctx_app', name: '手机 App', x: 750, y: 300 }
]);

// Level 2 硬件节点
const l2Hardware = ref([
  { id: 'hw_cockpit', name: '座舱域控制器 (8295)', x: 150, y: 200 },
  { id: 'hw_adas', name: '智驾域控制器 (Orin)', x: 150, y: 400 },
  { id: 'hw_gateway', name: '中央网关 (NXP)', x: 450, y: 200 }
]);

// Level 2 子节点
const l2ChildNode = ref([
  { id: 'sw_hmi', name: 'HMI 交互界面', parent: 'hw_cockpit' },
  { id: 'sw_nav', name: '导航引擎', parent: 'hw_cockpit' },
  { id: 'sw_plan', name: '规划控制算法', parent: 'hw_adas' },
  { id: 'sw_percept', name: '视觉感知', parent: 'hw_adas' },
  { id: 'sw_tbox', name: 'T-Box 通信服务', parent: 'hw_gateway' },
  { id: 'sw_route', name: '路由转发', parent: 'hw_gateway' }
]);

// 连线数据（包含报文信息）
const edgeList = ref<EdgeInfo[]>([
  // L0 连线
  {
    id: 'edge_car_cloud',
    source: 'sys_car',
    target: 'sys_cloud',
    label: 'MQTT/4G',
    proto: 'mqtt',
    view: 'l0',
    summary: '智能汽车 → 车企云平台 遥测通信',
    messageList: [
      { id: 'MSG_001', name: 'Vehicle_Status', size: 64, description: '车辆状态上报' },
      { id: 'MSG_002', name: 'GPS_Location', size: 32, description: 'GPS定位数据' },
      { id: 'MSG_003', name: 'Remote_Cmd', size: 16, description: '远程控制指令' },
      { id: 'MSG_004', name: 'OTA_Request', size: 128, description: 'OTA升级请求' },
      { id: 'MSG_005', name: 'Diag_Report', size: 256, description: '诊断报告上传' }
    ]
  },
  {
    id: 'edge_car_cloud_http',
    source: 'sys_car',
    target: 'sys_cloud',
    label: 'HTTP/5G',
    proto: 'http',
    view: 'l0',
    summary: '智能汽车 → 车企云平台 大文件传输',
    messageList: [
      { id: 'MSG_006', name: 'Log_Upload', size: 1024, description: '日志上传' },
      { id: 'MSG_007', name: 'Map_Update', size: 2048, description: '地图更新' }
    ]
  },
  {
    id: 'edge_app_cloud',
    source: 'sys_app',
    target: 'sys_cloud',
    label: 'HTTPS',
    proto: 'https',
    view: 'l0',
    summary: '手机App → 车企云平台 用户交互',
    messageList: [
      { id: 'MSG_101', name: 'User_Auth', size: 48, description: '用户认证' },
      { id: 'MSG_102', name: 'Car_Control', size: 24, description: '车辆控制请求' },
      { id: 'MSG_103', name: 'Status_Query', size: 16, description: '状态查询' }
    ]
  },
  
  // L2 连线
  {
    id: 'edge_hmi_route',
    source: 'sw_hmi',
    target: 'sw_route',
    label: 'SOME/IP',
    proto: 'someip',
    view: 'l2',
    summary: 'HMI → 路由转发 座舱服务调用',
    messageList: [
      { id: 'MSG_201', name: 'Nav_Request', size: 64, description: '导航请求' },
      { id: 'MSG_202', name: 'Media_Ctrl', size: 32, description: '媒体控制' }
    ]
  },
  {
    id: 'edge_plan_route',
    source: 'sw_plan',
    target: 'sw_route',
    label: 'SOME/IP',
    proto: 'someip',
    view: 'l2',
    summary: '规划控制 → 路由转发 智驾指令',
    messageList: [
      { id: 'MSG_301', name: 'Req_Torque', size: 16, description: '扭矩请求' },
      { id: 'MSG_302', name: 'Stat_Speed', size: 8, description: '速度状态' },
      { id: 'MSG_303', name: 'Brake_Cmd', size: 12, description: '制动指令' },
      { id: 'MSG_304', name: 'Steer_Angle', size: 8, description: '转向角度' }
    ]
  },
  {
    id: 'edge_tbox_cloud',
    source: 'sw_tbox',
    target: 'ctx_cloud',
    label: 'MQTT',
    proto: 'mqtt',
    view: 'l2',
    summary: 'T-Box → 云平台 遥测数据上报',
    messageList: [
      { id: 'MSG_401', name: 'Telemetry', size: 128, description: '遥测数据包' },
      { id: 'MSG_402', name: 'Heartbeat', size: 8, description: '心跳包' },
      { id: 'MSG_403', name: 'Alarm_Event', size: 64, description: '告警事件' }
    ]
  },
  {
    id: 'edge_app_ctx',
    source: 'ctx_app',
    target: 'ctx_cloud',
    label: 'HTTPS',
    proto: 'https',
    view: 'l2',
    summary: '手机App → 云平台 外部访问',
    messageList: [
      { id: 'MSG_501', name: 'API_Call', size: 256, description: 'API调用' }
    ]
  }
]);

/**
 * 根据父节点ID获取子节点列表
 * @param {string} parentId - 父节点ID
 * @returns {Array<{ id: string; name: string; parent: string }>} 子节点列表
 */
function getChildNodesByParent(parentId: string) {
  return l2ChildNode.value.filter(sw => sw.parent === parentId);
}

/**
 * 判断锚点是否受影响
 * @param {AnchorInfo} anchor - 锚点信息
 * @returns {boolean} 是否受影响
 */
function isAnchorAffected(anchor: AnchorInfo) {
  return affectedEdgeList.value.includes(anchor.edgeId) ||
         (selectedProtocol.value && anchor.edge.proto === selectedProtocol.value);
}

/**
 * 显示锚点的 Tooltip 提示
 * @param {AnchorInfo} anchor - 锚点信息
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
function showTooltip(anchor: AnchorInfo, event: MouseEvent) {
  if (detailCardVisible.value) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const canvasRect = canvas.getBoundingClientRect();

  currentTooltip.value = {
    title: anchor.edge.label,
    description: anchor.edge.summary
  };

  tooltipPosition.value = {
    x: event.clientX - canvasRect.left + 10,
    y: event.clientY - canvasRect.top - 50
  };

  tooltipVisible.value = true;
}

/**
 * 隐藏 Tooltip 提示
 * @returns {void}
 */
function hideTooltip() {
  tooltipVisible.value = false;
}

/**
 * 显示接口详情卡片
 * @param {AnchorInfo} anchor - 锚点信息
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
function showDetailCard(anchor: AnchorInfo, event: MouseEvent) {
  hideTooltip();

  const canvas = canvasRef.value;
  if (!canvas) return;

  const canvasRect = canvas.getBoundingClientRect();

  currentDetailCard.value = {
    protocol: anchor.edge.label,
    source: getNodeName(anchor.edge.source),
    target: getNodeName(anchor.edge.target),
    edgeId: anchor.edgeId,
    messageList: anchor.edge.messageList
  };

  // 计算卡片位置，确保不超出边界
  let x = event.clientX - canvasRect.left + 20;
  let y = event.clientY - canvasRect.top - 100;

  if (x + 320 > canvasRect.width) {
    x = event.clientX - canvasRect.left - 340;
  }
  if (y < 10) {
    y = 10;
  }

  detailCardPosition.value = { x, y };
  detailCardVisible.value = true;
  selectedMessageId.value = null;
}

/**
 * 隐藏接口详情卡片
 * @returns {void}
 */
function hideDetailCard() {
  detailCardVisible.value = false;
  selectedMessageId.value = null;
  // 清除报文级高亮
  if (!selectedProtocol.value) {
    affectedNodeList.value = [];
    affectedEdgeList.value = [];
    renderEdges();
  }
}

/**
 * 根据节点ID获取节点名称
 * @param {string} nodeId - 节点ID
 * @returns {string} 节点名称
 */
function getNodeName(nodeId: string): string {
  const l0Node = l0Nodes.value.find(n => n.id === nodeId);
  if (l0Node) return l0Node.name;

  const l2Ctx = l2Context.value.find(n => n.id === nodeId);
  if (l2Ctx) return l2Ctx.name;

  const hw = l2Hardware.value.find(n => n.id === nodeId);
  if (hw) return hw.name;

  const sw = l2ChildNode.value.find(n => n.id === nodeId);
  if (sw) return sw.name;

  return nodeId;
}

/**
 * 选择报文并触发影响分析
 * @param {MessageInfo} msg - 报文信息
 * @returns {void}
 */
function selectMessage(msg: MessageInfo) {
  selectedMessageId.value = msg.id;

  // 高亮当前连线和两端节点
  const edge = edgeList.value.find(e => e.id === currentDetailCard.value.edgeId);
  if (edge) {
    affectedEdgeList.value = [edge.id];

    const nodeIdList: string[] = [edge.source, edge.target];

    // 如果是子节点，也高亮其父节点
    const sourceChild = l2ChildNode.value.find(node => node.id === edge.source);
    if (sourceChild) {
      nodeIdList.push(sourceChild.parent);
    }
    const targetChild = l2ChildNode.value.find(node => node.id === edge.target);
    if (targetChild) {
      nodeIdList.push(targetChild.parent);
    }

    affectedNodeList.value = [...new Set(nodeIdList)];
    renderEdges();
  }
}

/**
 * 开始拖拽详情卡片
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
function startDragCard(event: MouseEvent) {
  isDragging.value = true;
  dragOffset.value = {
    x: event.clientX - detailCardPosition.value.x,
    y: event.clientY - detailCardPosition.value.y
  };

  document.addEventListener('mousemove', onDragCard);
  document.addEventListener('mouseup', stopDragCard);
}

/**
 * 拖拽详情卡片中
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
function onDragCard(event: MouseEvent) {
  if (!isDragging.value) return;

  const canvas = canvasRef.value;
  if (!canvas) return;

  const canvasRect = canvas.getBoundingClientRect();

  let x = event.clientX - dragOffset.value.x;
  let y = event.clientY - dragOffset.value.y;

  // 限制在画布范围内
  x = Math.max(0, Math.min(x, canvasRect.width - 320));
  y = Math.max(0, Math.min(y, canvasRect.height - 300));

  detailCardPosition.value = { x, y };
}

/**
 * 停止拖拽详情卡片
 * @returns {void}
 */
function stopDragCard() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDragCard);
  document.removeEventListener('mouseup', stopDragCard);
}

/**
 * 显示 Level 0 体系全景视图
 * @returns {void}
 */
function showLevel0() {
  currentView.value = 'l0';
  resetAnalysis();
  nextTick(() => {
    renderEdges();
  });
}

/**
 * 显示 Level 2 系统内部交互视图
 * @returns {void}
 */
function showLevel2() {
  currentView.value = 'l2';
  resetAnalysis();
  nextTick(() => {
    renderEdges();
  });
}

/**
 * 渲染节点间的连线和锚点
 * @returns {void}
 */
function renderEdges() {
  const svg = svgLayerRef.value;
  const canvas = canvasRef.value;
  if (!svg || !canvas) return;

  // 清空现有连线
  svg.innerHTML = '';
  anchorList.value = [];

  const canvasRect = canvas.getBoundingClientRect();

  // 筛选当前视图的连线
  const currentEdgeList = edgeList.value.filter(e => e.view === currentView.value);

  // 1. 对连线进行分组 (按 source-target 键，忽略方向)
  const edgeGroups = new Map<string, EdgeInfo[]>();

  currentEdgeList.forEach(edge => {
    // 生成唯一键：始终让 ID 小的在前，确保无向一致性
    const key = edge.source < edge.target
      ? `${edge.source}-${edge.target}`
      : `${edge.target}-${edge.source}`;

    if (!edgeGroups.has(key)) {
      edgeGroups.set(key, []);
    }
    edgeGroups.get(key)!.push(edge);
  });

  // 2. 遍历每一组，渲染一条线和多个锚点
  edgeGroups.forEach((groupEdges) => {
    if (groupEdges.length === 0) return;

    // 使用组内第一个边来确定端点
    const representativeEdge = groupEdges[0];
    const sourceEl = document.getElementById(representativeEdge.source);
    const targetEl = document.getElementById(representativeEdge.target);

    if (sourceEl && targetEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // 转换为画布内相对坐标
      const sRect = {
        left: sourceRect.left - canvasRect.left,
        top: sourceRect.top - canvasRect.top,
        right: sourceRect.right - canvasRect.left,
        bottom: sourceRect.bottom - canvasRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
        centerX: sourceRect.left + sourceRect.width / 2 - canvasRect.left,
        centerY: sourceRect.top + sourceRect.height / 2 - canvasRect.top
      };

      const tRect = {
        left: targetRect.left - canvasRect.left,
        top: targetRect.top - canvasRect.top,
        right: targetRect.right - canvasRect.left,
        bottom: targetRect.bottom - canvasRect.top,
        width: targetRect.width,
        height: targetRect.height,
        centerX: targetRect.left + targetRect.width / 2 - canvasRect.left,
        centerY: targetRect.top + targetRect.height / 2 - canvasRect.top
      };

      // 计算边缘连接点
      let x1, y1, x2, y2;

      // 简单的方向判断逻辑
      const deltaX = tRect.centerX - sRect.centerX;
      const deltaY = tRect.centerY - sRect.centerY;

      // 判断主要方向（水平还是垂直）
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平连接
        if (deltaX > 0) {
          // Target 在右边: Source右 -> Target左
          x1 = sRect.right;
          y1 = sRect.centerY;
          x2 = tRect.left;
          y2 = tRect.centerY;
        } else {
          // Target 在左边: Source左 -> Target右
          x1 = sRect.left;
          y1 = sRect.centerY;
          x2 = tRect.right;
          y2 = tRect.centerY;
        }
      } else {
        // 垂直连接
        if (deltaY > 0) {
          // Target 在下边: Source下 -> Target上
          x1 = sRect.centerX;
          y1 = sRect.bottom;
          x2 = tRect.centerX;
          y2 = tRect.top;
        } else {
          // Target 在上边: Source上 -> Target下
          x1 = sRect.centerX;
          y1 = sRect.top;
          x2 = tRect.centerX;
          y2 = tRect.bottom;
        }
      }

      // 判断该组是否有受影响的连线
      const isGroupAffected = groupEdges.some(edge =>
        affectedEdgeList.value.includes(edge.id) ||
        (selectedProtocol.value && edge.proto === selectedProtocol.value)
      );

      // 创建 SVG 连线（只画一条）
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('class', isGroupAffected ? 'edge affected-edge' : 'edge');
      svg.appendChild(line);

      // 计算中心点
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;

      // 计算锚点布局 - 竖向排列
      const anchorHeight = 35; // 每个锚点的高度 + 间距
      const totalHeight = groupEdges.length * anchorHeight;
      const startY = centerY - totalHeight / 2 + anchorHeight / 2; // 垂直居中起始点

      // 遍历组内每条边，创建锚点
      groupEdges.forEach((edge, index) => {
        // 垂直排列锚点
        const anchorX = centerX - 60; // 水平居中 (减去宽度的一半)
        const anchorY = startY + index * anchorHeight - 12; // -12 是为了微调对齐

        anchorList.value.push({
          id: 'anchor_' + edge.id,
          edgeId: edge.id,
          protocol: edge.label,
          messageCount: edge.messageList.length,
          x: anchorX,
          y: anchorY,
          edge: edge
        });
      });
    }
  });
}

/**
 * 分析选定协议的影响范围
 * @returns {void}
 */
function analyzeImpact() {
  if (!selectedProtocol.value) return;

  hideDetailCard();

  const nodeIdList: string[] = [];
  const edgeIdList: string[] = [];

  // 查找受影响的连线和节点
  edgeList.value
    .filter(e => e.view === currentView.value && e.proto === selectedProtocol.value)
    .forEach(edge => {
      edgeIdList.push(edge.id);
      nodeIdList.push(edge.source);
      nodeIdList.push(edge.target);

      // 如果是子节点，也高亮其父节点
      const childNode = l2ChildNode.value.find(node => node.id === edge.source || node.id === edge.target);
      if (childNode) {
        nodeIdList.push(childNode.parent);
      }
    });

  affectedNodeList.value = [...new Set(nodeIdList)];
  affectedEdgeList.value = [...new Set(edgeIdList)];

  // 重新渲染连线
  renderEdges();
}

/**
 * 重置影响分析状态
 * @returns {void}
 */
function resetAnalysis() {
  selectedProtocol.value = '';
  selectedMessageId.value = null;
  affectedNodeList.value = [];
  affectedEdgeList.value = [];
  hideDetailCard();
  renderEdges();
}

/**
 * 处理窗口大小变化事件
 * @returns {void}
 */
function handleResize() {
  renderEdges();
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    renderEdges();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousemove', onDragCard);
  document.removeEventListener('mouseup', stopDragCard);
});

// 监听视图变化
watch(currentView, () => {
  hideDetailCard();
  nextTick(() => {
    renderEdges();
  });
});
</script>

<style lang="scss" src="./index.scss"></style>
