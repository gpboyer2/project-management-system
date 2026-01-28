/**
 * 通信节点 API
 * 处理通信节点（接口）的 CRUD 操作，包括接口连接信息（endpoint_description）的管理
 */

import { apiClient } from './index';

/**
 * 端点描述接口
 * 符合数据字典 communication_nodes.endpoint_description 格式
 */
export interface EndpointDescription {
  /**
   * 接口元素唯一标识（稳定ID）
   * - 一个节点（communication_nodes 一行）包含多个接口元素
   */
  interface_id?: string

  /**
   * 接口名称（用于“通信接口列表”展示）
   */
  name?: string

  // 连接类型（尽可能保留展示字段，后续可删减）
  type: 'TCP Server' | 'TCP Client' | 'UDP' | 'UDP Multicast' | 'Serial' | 'CAN' | string

  // TCP/UDP 通用字段
  host?: string
  port?: number
  remote_host?: string
  remote_port?: number
  timeout?: number
  encoding?: string

  // UDP 组播
  group?: string

  // Serial 字段
  port_name?: string
  baud_rate?: number
  data_bits?: number
  stop_bits?: number
  parity?: string

  // CAN 字段
  can_channel?: string
  can_bitrate?: number

  // DDS 字段
  domain_id?: number
  participant_name?: string
  discovery_protocol?: 'simple' | 'server' | string
  discovery_server?: string
  transport?: 'udp' | 'tcp' | 'shm' | string
  network_interface?: string

  /**
   * 接口运行的协议报文引用列表（协议+版本由 packet_id 唯一确定）
   * - direction: input=接收，output=发送
   * - message_id: TCP/UDP 报文标识符
   * - topic_name: DDS Topic 名称
   * - reliability: DDS 可靠性配置
   * - durability: DDS 持久性配置
   */
  packet_ref_list?: Array<{
    packet_id: number
    direction: 'input' | 'output'
    message_id?: string
    topic_name?: string
    reliability?: 'best_effort' | 'reliable'
    durability?: 'volatile' | 'transient_local'
  }>
}

/**
 * 通信节点接口
 */
export interface CommunicationNode {
  id: string
  node_id: string
  name: string
  endpoint_description: EndpointDescription[] | null
  status: 'active' | 'inactive' | 'error' | 'deprecated'
  config: any | null
  flow_version: string
  flow_digest_sha256: string | null
  size_bytes: number
  created_at: number
  updated_at: number
}

/**
 * 创建通信节点请求参数
 */
export interface CreateCommunicationNodeParams {
  node_id: string
  name?: string
  endpoint_description?: EndpointDescription[]
  status?: string
  config?: any
}

/**
 * 更新通信节点请求参数
 */
export interface UpdateCommunicationNodeParams {
  name?: string
  endpoint_description?: EndpointDescription[]
  status?: string
  config?: any
  flow_version?: string
}

/**
 * 连接状态
 */
export type ConnectionStatusType = 'connected' | 'connecting' | 'disconnected' | 'error'

/**
 * 连接操作结果
 */
export interface ConnectionResult {
  node_id: string
  node_name?: string
  status?: ConnectionStatusType
  success?: boolean
  message?: string
  results?: Array<{
    endpoint: string
    success: boolean
    message: string
  }>
}

/**
 * 连接状态信息
 */
export interface ConnectionStatusInfo {
  node_id: string
  node_name?: string
  db_status?: string
  status: ConnectionStatusType
  connections: Array<{
    type: string
    status: ConnectionStatusType
    localAddress?: string
    remoteAddress?: string
    config?: EndpointDescription
  }>
}

/**
 * 通信节点 API
 */
export const communicationNodeApi = {
  /**
   * 查询通信节点（支持过滤）
   * GET /api/communication-nodes/query
   * @param params 查询参数
   * @returns 通信节点列表
   */
  query: (params?: {
    node_id?: string
    include_endpoints?: boolean
  }) => apiClient.get<CommunicationNode[]>('/communication-nodes/query', params || {}),

  /**
   * 获取所有通信节点
   * @returns 通信节点列表
   */
  getAll: () => apiClient.get<CommunicationNode[]>('/communication-nodes'),

  /**
   * 根据 ID 获取通信节点详情
   * @param id 通信节点 ID
   * @returns 通信节点详情
   */
  getById: (id: string) => apiClient.get<CommunicationNode>('/communication-nodes/detail', { id }),

  /**
   * 根据层级节点ID获取通信节点列表
   * @param nodeId 层级节点 ID
   * @returns 通信节点列表
   */
  getListByNodeId: (nodeId: string) =>
    apiClient.get<CommunicationNode[]>('/communication-nodes/by-node', { node_id: nodeId }),

  /**
   * 确保"节点接口容器行"存在（一个节点一行）
   * @param nodeId 层级节点 ID
   * @returns 通信节点
   */
  ensureNodeInterfaceContainer: (nodeId: string) =>
    apiClient.post<CommunicationNode>('/communication-nodes/ensure', { node_id: nodeId }),

  /**
   * 创建通信节点
   * @param data 创建参数
   * @returns 通信节点
   */
  create: (data: CreateCommunicationNodeParams) =>
    apiClient.post<CommunicationNode>('/communication-nodes', data),

  /**
   * 更新通信节点
   * @param id 通信节点 ID
   * @param data 更新参数
   * @returns 通信节点
   */
  update: (id: string, data: UpdateCommunicationNodeParams) =>
    apiClient.post<CommunicationNode>('/communication-nodes/update', Object.assign({ id }, data)),

  /**
   * 更新通信节点的接口连接信息
   * @param id 通信节点 ID
   * @param endpointList 接口连接信息列表
   * @returns 通信节点
   */
  updateEndpoints: (id: string, endpointList: EndpointDescription[]) =>
    apiClient.post<CommunicationNode>('/communication-nodes/update-endpoints', {
      id,
      endpoint_description: endpointList
    }),

  /**
   * 删除通信节点
   * POST /api/communication-nodes/delete  body: { data: [id1, id2, ...] }
   * 入参为数组，天然支持批量操作
   * @param idList 通信节点 ID 列表
   * @returns 删除结果
   */
  delete: (idList: string[]) =>
    apiClient.post<{ success: boolean; count: number; deleted_count: number }>('/communication-nodes/delete', {
      data: idList
    }),

  /**
   * 建立通信节点连接
   * @param id 通信节点 ID
   * @returns 连接结果
   */
  connect: (id: string) => apiClient.post<ConnectionResult>('/communication-nodes/connect', { id }),

  /**
   * 断开通信节点连接
   * @param id 通信节点 ID
   * @returns 连接结果
   */
  disconnect: (id: string) => apiClient.post<ConnectionResult>('/communication-nodes/disconnect', { id }),

  /**
   * 获取通信节点连接状态
   * @param id 通信节点 ID
   * @returns 连接状态信息
   */
  getConnectionStatus: (id: string) => apiClient.get<ConnectionStatusInfo>('/communication-nodes/connection-status', { id }),

  /**
   * 添加报文关联到接口
   * POST /api/communication-nodes/packet-ref/create
   * @param nodeId 通信节点 ID
   * @param interfaceId 接口 ID
   * @param packetId 报文 ID
   * @param direction 方向（input=接收，output=发送）
   * @returns 操作结果
   */
  createPacketRef: (nodeId: string, interfaceId: string, packetId: number, direction: 'input' | 'output') =>
    apiClient.post<{ success: boolean; packet_ref_list: Array<{ packet_id: number; direction: string }> }>('/communication-nodes/packet-ref/create', {
      node_id: nodeId,
      interface_id: interfaceId,
      packet_id: packetId,
      direction
    }),

  /**
   * 从接口移除报文关联
   * POST /api/communication-nodes/packet-ref/delete
   * @param nodeId 通信节点 ID
   * @param interfaceId 接口 ID
   * @param packetId 报文 ID
   * @returns 操作结果
   */
  deletePacketRef: (nodeId: string, interfaceId: string, packetId: number) =>
    apiClient.post<{ success: boolean; packet_ref_list: Array<{ packet_id: number; direction: string }> }>('/communication-nodes/packet-ref/delete', {
      node_id: nodeId,
      interface_id: interfaceId,
      packet_id: packetId
    })
};

