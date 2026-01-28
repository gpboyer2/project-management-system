<!--
  局部拓扑 Tab
  显示节点的局部拓扑图，展示当前节点与其他节点的连接关系
-->
<template>
  <div class="ide-topology">
    <VisNetwork
      v-if="!loadingTopology && topologyNodes.length > 0"
      :nodes="topologyNodes"
      :edges="topologyEdges"
      :options="visNetworkOptions"
      @ready="onNetworkReady"
    />

    <div v-if="loadingTopology" class="ide-topology-loading">
      <p>加载拓扑数据中...</p>
    </div>

    <div v-if="!loadingTopology && topologyNodes.length === 0" class="ide-topology-empty">
      <p>暂无拓扑数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import VisNetwork from '@/components/vis-network/index.vue';
import { communicationNodeApi, type CommunicationNode } from '@/api/communicationNode';
import { systemLevelDesignTreeApi } from '@/api/system-level-design-tree';
import type { TopologyNode, TopologyEdge } from '@/stores/topology';

const props = defineProps<{
  nodeId: string;
  displayName: string;
}>();

const topologyNodes = ref<TopologyNode[]>([]);
const topologyEdges = ref<TopologyEdge[]>([]);
const loadingTopology = ref(false);

const visNetworkOptions = computed(() => ({
  enableNavigation: false,
  nodes: {
    shape: 'box',
    font: {
      size: 14,
      color: '#333333',
      face: 'arial',
      multi: true
    },
    borderWidth: 2,
    borderWidthSelected: 3,
    margin: 10,
    color: {
      background: 'var(--color-bg-container)',
      border: 'var(--color-border-secondary)'
    },
    shadow: {
      enabled: true,
      color: 'rgba(0, 0, 0, 0.1)',
      size: 8,
      x: 2,
      y: 2
    }
  },
  edges: {
    width: 2,
    smooth: {
      enabled: true,
      type: 'cubicBezier',
      roundness: 0.5
    },
    font: {
      size: 12,
      align: 'middle',
      background: 'rgba(255, 255, 255, 0.9)',
      strokeWidth: 1,
      strokeColor: '#ffffff',
      color: '#333333'
    },
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 1,
        type: 'arrow'
      }
    }
  },
  physics: {
    enabled: false
  },
  interaction: {
    hover: false,
    dragNodes: false,
    dragView: false,
    zoomView: false,
    navigationButtons: false,
    multiselect: false,
    selectable: true,
    selectConnectedEdges: true
  },
  layout: {
    randomSeed: props.nodeId,
    improvedLayout: true,
    hierarchical: {
      enabled: false
    }
  },
  configure: {
    enabled: false
  }
}));

/**
 * 拓扑图就绪回调
 * @returns {void} 无返回值
 */
function onNetworkReady() {
  console.log('[TopologyTab] 局部拓扑图就绪');
}

/**
 * 加载拓扑数据
 * 查询所有通信节点，构建当前节点的局部拓扑关系
 * @returns {Promise<void>} 无返回值
 */
async function loadTopologyData() {
  if (!props.nodeId) return;

  loadingTopology.value = true;
  try {
    const result = await communicationNodeApi.query();
    if (result.status !== 'success' || !result.datum) {
      topologyNodes.value = [];
      topologyEdges.value = [];
      return;
    }

    const allNodes = result.datum as CommunicationNode[];
    const currentNode = allNodes.find(n => n.node_id === props.nodeId);
    if (!currentNode?.endpoint_description) {
      topologyNodes.value = [];
      topologyEdges.value = [];
      return;
    }

    const nodes: TopologyNode[] = [];
    const edges: TopologyEdge[] = [];
    const connectionMap = new Map<string, { from: string; to: string; label: string; direction: 'in' | 'out' }>();

    const currentNodeName = props.displayName || props.nodeId;
    const interfaceSummary = summarizeEndpoints(currentNode.endpoint_description);
    const centerNodeLabel = buildNodeLabel(currentNodeName, props.nodeId, interfaceSummary, true);

    const centerNode: TopologyNode = {
      id: props.nodeId,
      label: centerNodeLabel,
      name: currentNodeName,
      type: 'center',
      shape: 'box',
      color: {
        background: 'rgba(52, 152, 219, 0.95)',
        border: '#2980b9',
        highlight: {
          background: 'rgba(52, 152, 219, 1)',
          border: '#2980b9'
        }
      },
      font: {
        color: '#ffffff',
        multi: true,
        align: 'left'
      },
      widthConstraint: {
        minimum: 200,
        maximum: 200
      },
      heightConstraint: {
        minimum: 80
      },
      margin: 10,
      x: 0,
      y: 0,
      fixed: { x: true, y: true }
    };
    nodes.push(centerNode);

    const connectedNodeIds = new Set<string>();
    const connectedNodeData = new Map<string, { name: string; endpointSummary: any }>();

    for (const endpoint of currentNode.endpoint_description) {
      if (!endpoint) continue;

      if (endpoint.type === 'TCP Client' && endpoint.remote_host && endpoint.remote_port) {
        const targetHost = String(endpoint.remote_host).trim();
        const targetPort = Number(endpoint.remote_port);

        for (const otherNode of allNodes) {
          if (otherNode.node_id === props.nodeId) continue;
          if (!otherNode.endpoint_description) continue;

          for (const otherEndpoint of otherNode.endpoint_description) {
            if (otherEndpoint.type === 'TCP Server' &&
                otherEndpoint.host === targetHost &&
                otherEndpoint.port === targetPort) {
              const otherNodeId = otherNode.node_id;
              const nodeName = await getNodeName(otherNodeId);
              const connectionKey = `${props.nodeId}-${otherNodeId}`;

              if (!connectedNodeIds.has(otherNodeId)) {
                const endpointSummary = summarizeEndpoints(otherNode.endpoint_description);
                connectedNodeData.set(otherNodeId, { name: nodeName, endpointSummary });
                connectedNodeIds.add(otherNodeId);
              }

              if (!connectionMap.has(connectionKey)) {
                connectionMap.set(connectionKey, {
                  from: props.nodeId,
                  to: otherNodeId,
                  label: `发送 → ${targetHost}:${targetPort}`,
                  direction: 'out'
                });
              }
              break;
            }
          }
        }
      }

      if (endpoint.type === 'TCP Server' && endpoint.host && endpoint.port) {
        const localHost = String(endpoint.host).trim();
        const localPort = Number(endpoint.port);

        for (const otherNode of allNodes) {
          if (otherNode.node_id === props.nodeId) continue;
          if (!otherNode.endpoint_description) continue;

          for (const otherEndpoint of otherNode.endpoint_description) {
            if (otherEndpoint.type === 'TCP Client' &&
                otherEndpoint.remote_host === localHost &&
                otherEndpoint.remote_port === localPort) {
              const otherNodeId = otherNode.node_id;
              const nodeName = await getNodeName(otherNodeId);
              const connectionKey = `${otherNodeId}-${props.nodeId}`;

              if (!connectedNodeIds.has(otherNodeId)) {
                const endpointSummary = summarizeEndpoints(otherNode.endpoint_description);
                connectedNodeData.set(otherNodeId, { name: nodeName, endpointSummary });
                connectedNodeIds.add(otherNodeId);
              }

              if (!connectionMap.has(connectionKey)) {
                connectionMap.set(connectionKey, {
                  from: otherNodeId,
                  to: props.nodeId,
                  label: `接收 ← ${localHost}:${localPort}`,
                  direction: 'in'
                });
              }
              break;
            }
          }
        }
      }
    }

    const connectedNodeList = Array.from(connectedNodeData.entries());
    const positions = calculateNodePositions(connectedNodeList.length);

    connectedNodeList.forEach(([otherNodeId, data], index) => {
      const isOutgoing = connectionMap.has(`${props.nodeId}-${otherNodeId}`);
      const nodeLabel = buildNodeLabel(data.name, otherNodeId, data.endpointSummary, false);
      const pos = positions[index];

      const connectedNode: TopologyNode = {
        id: otherNodeId,
        label: nodeLabel,
        name: data.name,
        type: 'connected',
        shape: 'box',
        color: isOutgoing ? {
          background: 'rgba(46, 204, 113, 0.15)',
          border: '#27ae60',
          highlight: {
            background: 'rgba(46, 204, 113, 0.3)',
            border: '#27ae60'
          }
        } : {
          background: 'rgba(52, 152, 219, 0.15)',
          border: '#3498db',
          highlight: {
            background: 'rgba(52, 152, 219, 0.3)',
            border: '#3498db'
          }
        },
        font: {
          color: isOutgoing ? '#27ae60' : '#3498db',
          multi: true,
          align: 'left'
        },
        widthConstraint: {
          minimum: 160,
          maximum: 160
        },
        heightConstraint: {
          minimum: 60
        },
        margin: 10,
        x: pos.x,
        y: pos.y,
        fixed: { x: true, y: true }
      };
      nodes.push(connectedNode);
    });

    connectionMap.forEach((conn) => {
      const edge: TopologyEdge = {
        id: `${conn.from}-${conn.to}`,
        from: conn.from,
        to: conn.to,
        label: conn.label,
        color: conn.direction === 'out' ? {
          color: '#27ae60',
          highlight: '#229954'
        } : {
          color: '#3498db',
          highlight: '#2980b9'
        },
        width: 2,
        arrows: 'to',
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.3
        }
      };
      edges.push(edge);
    });

    topologyNodes.value = nodes;
    topologyEdges.value = edges;

    console.log('[TopologyTab] 局部拓扑加载完成:', { nodes: nodes.length, edges: edges.length });
  } catch (error) {
    console.error('[TopologyTab] 加载拓扑数据失败:', error);
    topologyNodes.value = [];
    topologyEdges.value = [];
  } finally {
    loadingTopology.value = false;
  }
}

/**
 * 汇总端点信息
 * 统计 TCP Server、TCP Client、UDP 的数量和端口
 * @param {any[]} endpointList - 端点列表
 * @returns {{ tcpServerCount: number; tcpClientCount: number; udpCount: number; ports: string }} 端点汇总信息
 */
function summarizeEndpoints(endpointList: any[]): {
  tcpServerCount: number;
  tcpClientCount: number;
  udpCount: number;
  ports: string;
} {
  const summary = {
    tcpServerCount: 0,
    tcpClientCount: 0,
    udpCount: 0,
    ports: [] as string[]
  };

  for (const ep of endpointList) {
    if (!ep) continue;
    if (ep.type === 'TCP Server') {
      summary.tcpServerCount++;
      if (ep.port) summary.ports.push(String(ep.port));
    } else if (ep.type === 'TCP Client') {
      summary.tcpClientCount++;
      if (ep.remote_port) summary.ports.push(String(ep.remote_port));
    } else if (ep.type === 'UDP' || ep.type === 'UDP Multicast') {
      summary.udpCount++;
      if (ep.port) summary.ports.push(String(ep.port));
    }
  }

  return {
    ...summary,
    ports: [...new Set(summary.ports)].slice(0, 4).join(', ') + (summary.ports.length > 4 ? '...' : '')
  };
}

/**
 * 构建节点标签
 * 根据节点类型生成不同的显示格式
 * @param {string} name - 节点名称
 * @param {string} nodeId - 节点 ID
 * @param {{ tcpServerCount: number; tcpClientCount: number; udpCount: number; ports: string }} summary - 端点汇总信息
 * @param {boolean} isCenter - 是否为中心节点
 * @returns {string} 节点标签文本
 */
function buildNodeLabel(name: string, nodeId: string, summary: {
  tcpServerCount: number;
  tcpClientCount: number;
  udpCount: number;
  ports: string;
}, isCenter: boolean): string {
  const displayName = name.length > 10 ? name.slice(0, 10) + '...' : name;
  const shortId = nodeId.slice(-6);

  if (isCenter) {
    const lines = [
      `📦 ${displayName}`,
      `ID: ${shortId}`,
      '────────────',
      `📡 接口汇总`,
      summary.tcpServerCount > 0 ? `  Server: ${summary.tcpServerCount}` : '',
      summary.tcpClientCount > 0 ? `  Client: ${summary.tcpClientCount}` : '',
      summary.udpCount > 0 ? `  UDP: ${summary.udpCount}` : '',
      summary.ports ? `  端口: ${summary.ports}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  } else {
    const lines = [
      `📦 ${displayName}`,
      `ID: ${shortId}`,
      '──────────',
      `📡 ${summary.tcpServerCount}S/${summary.tcpClientCount}C`,
      summary.ports ? `  ${summary.ports}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }
}

/**
 * 计算节点位置
 * 根据节点数量，将它们均匀分布在圆周上
 * @param {number} count - 节点数量
 * @returns {Array<{ x: number; y: number }>} 节点坐标数组
 */
function calculateNodePositions(count: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const radius = 300;

  if (count === 0) {
    return positions;
  }

  if (count === 1) {
    positions.push({ x: radius, y: 0 });
  } else if (count === 2) {
    positions.push({ x: radius, y: 0 });
    positions.push({ x: -radius, y: 0 });
  } else if (count === 3) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
      positions.push({
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle))
      });
    }
  } else if (count === 4) {
    positions.push({ x: radius, y: -radius });
    positions.push({ x: radius, y: radius });
    positions.push({ x: -radius, y: radius });
    positions.push({ x: -radius, y: -radius });
  } else {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
      positions.push({
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle))
      });
    }
  }

  return positions;
}

/**
 * 获取节点名称
 * 从系统层级设计树中查询节点的名称
 * @param {string} nodeId - 节点 ID
 * @returns {Promise<string>} 节点名称，失败时返回节点 ID
 */
async function getNodeName(nodeId: string): Promise<string> {
  try {
    const result = await systemLevelDesignTreeApi.getNodeById(nodeId);
    if (result.status === 'success' && result.datum) {
      return result.datum.properties?.['名称'] || result.datum.name || nodeId;
    }
  } catch (error) {
    console.warn(`获取节点 ${nodeId} 名称失败:`, error);
  }
  return nodeId;
}

onMounted(() => {
  loadTopologyData();
});

watch(() => props.nodeId, loadTopologyData);
</script>

<style lang="scss" scoped>
@use '../../../index.scss' as *;
@use './index.scss' as *;
</style>
