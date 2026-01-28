import type { EndpointDescription } from '@/api/communicationNode';

// 连接配置类型定义
export interface ConnectionConfig {
  // 基础信息
  name: string;
  type: string;
  role: 'input' | 'output';

  // TCP/UDP 通用
  host: string;
  port: number;
  timeout: number;
  encoding: string;

  // UDP 组播
  multicastGroup: string;

  // Serial
  portName: string;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: string;

  // CAN
  canChannel: string;
  canBitrate: number;

  // DDS
  domainId: number;
  participantName: string;
  discoveryProtocol: 'simple' | 'server';
  discoveryServer: string;
  transport: 'udp' | 'tcp' | 'shm';
  networkInterface: string;
}

/**
 * 将连接配置转换为 endpoint_description 格式
 * @param connectionConfig - 连接配置对象
 * @returns endpoint_description 对象
 */
export function buildEndpointDescription(
  connectionConfig: ConnectionConfig
): EndpointDescription {
  const base: EndpointDescription = {
    interface_id: '',
    name: connectionConfig.name,
    type: ''
  };

  switch (connectionConfig.type) {
    case 'TCP':
      base.type = connectionConfig.role === 'input' ? 'TCP Server' : 'TCP Client';
      if (connectionConfig.role === 'input') {
        base.host = connectionConfig.host;
        base.port = connectionConfig.port;
      } else {
        base.remote_host = connectionConfig.host;
        base.remote_port = connectionConfig.port;
        base.timeout = connectionConfig.timeout;
      }
      base.encoding = connectionConfig.encoding;
      break;

    case 'UDP':
      if (connectionConfig.multicastGroup) {
        base.type = 'UDP Multicast';
        base.group = connectionConfig.multicastGroup;
        base.port = connectionConfig.port;
      } else {
        base.type = 'UDP';
        if (connectionConfig.role === 'input') {
          base.host = connectionConfig.host;
          base.port = connectionConfig.port;
        } else {
          base.remote_host = connectionConfig.host;
          base.remote_port = connectionConfig.port;
        }
      }
      base.encoding = connectionConfig.encoding;
      break;

    case 'Serial':
      base.type = 'Serial';
      base.port_name = connectionConfig.portName;
      base.baud_rate = connectionConfig.baudRate;
      base.data_bits = connectionConfig.dataBits;
      base.stop_bits = connectionConfig.stopBits;
      base.parity = connectionConfig.parity;
      break;

    case 'CAN':
      base.type = 'CAN';
      base.can_channel = connectionConfig.canChannel;
      base.can_bitrate = connectionConfig.canBitrate;
      break;

    case 'DDS':
      base.type = 'DDS';
      base.domain_id = connectionConfig.domainId;
      base.participant_name = connectionConfig.participantName || '';
      base.discovery_protocol = connectionConfig.discoveryProtocol || 'simple';
      if (connectionConfig.discoveryProtocol === 'server' && connectionConfig.discoveryServer) {
        base.discovery_server = connectionConfig.discoveryServer;
      }
      base.transport = connectionConfig.transport || 'udp';
      if (connectionConfig.networkInterface) {
        base.network_interface = connectionConfig.networkInterface;
      }
      // 调试日志：验证 DDS 配置是否正确构建
      console.log('[buildEndpointDescription] DDS config:', {
        domain_id: base.domain_id,
        participant_name: base.participant_name,
        discovery_protocol: base.discovery_protocol,
        transport: base.transport
      });
      break;
  }

  return base;
}

/**
 * 从 endpoint_description 加载连接配置
 * @param endpoint - endpoint_description 对象
 * @param connectionConfig - 连接配置对象（将被修改）
 */
export function loadFromEndpointDescription(
  endpoint: EndpointDescription,
  connectionConfig: ConnectionConfig
): void {
  // 兼容：接口元素不再存 role，这里根据 type/字段推导
  if (endpoint.type === 'TCP Server') {
    connectionConfig.role = 'input';
  } else if (endpoint.type === 'TCP Client') {
    connectionConfig.role = 'output';
  } else if (endpoint.type === 'UDP' || endpoint.type === 'UDP Multicast') {
    connectionConfig.role = endpoint.remote_host || endpoint.remote_port ? 'output' : 'input';
  } else {
    connectionConfig.role = 'input';
  }

  // 根据 type 判断连接方式
  if (endpoint.type.includes('TCP')) {
    connectionConfig.type = 'TCP';
    if (connectionConfig.role === 'input') {
      connectionConfig.host = endpoint.host || '0.0.0.0';
      connectionConfig.port = endpoint.port || 8080;
    } else {
      connectionConfig.host = endpoint.remote_host || '';
      connectionConfig.port = endpoint.remote_port || 8080;
      connectionConfig.timeout = endpoint.timeout || 30000;
    }
    connectionConfig.encoding = endpoint.encoding || 'utf8';
  } else if (endpoint.type.includes('UDP')) {
    connectionConfig.type = 'UDP';
    if (endpoint.type === 'UDP Multicast') {
      connectionConfig.multicastGroup = endpoint.group || '';
      connectionConfig.port = endpoint.port || 8080;
    } else {
      if (connectionConfig.role === 'input') {
        connectionConfig.host = endpoint.host || '0.0.0.0';
        connectionConfig.port = endpoint.port || 8080;
      } else {
        connectionConfig.host = endpoint.remote_host || '';
        connectionConfig.port = endpoint.remote_port || 8080;
      }
    }
    connectionConfig.encoding = endpoint.encoding || 'utf8';
  } else if (endpoint.type === 'Serial') {
    connectionConfig.type = 'Serial';
    connectionConfig.portName = endpoint.port_name || '';
    connectionConfig.baudRate = endpoint.baud_rate || 115200;
    connectionConfig.dataBits = endpoint.data_bits || 8;
    connectionConfig.stopBits = endpoint.stop_bits || 1;
    connectionConfig.parity = endpoint.parity || 'none';
  } else if (endpoint.type === 'CAN') {
    connectionConfig.type = 'CAN';
    connectionConfig.canChannel = endpoint.can_channel || '';
    connectionConfig.canBitrate = endpoint.can_bitrate || 500000;
  } else if (endpoint.type === 'DDS') {
    connectionConfig.type = 'DDS';
    connectionConfig.domainId = endpoint.domain_id ?? 0;
    connectionConfig.participantName = endpoint.participant_name || '';
    connectionConfig.discoveryProtocol = (endpoint.discovery_protocol as 'simple' | 'server') || 'simple';
    connectionConfig.discoveryServer = endpoint.discovery_server || '';
    connectionConfig.transport = (endpoint.transport as 'udp' | 'tcp' | 'shm') || 'udp';
    connectionConfig.networkInterface = endpoint.network_interface || '';
    // DDS 不使用 role，重置为默认值
    connectionConfig.role = 'input';
  }
}
