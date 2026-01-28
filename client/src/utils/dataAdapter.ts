/**
 * 数据适配器工具
 * 提供后端数据到前端视图模型的数据转换函数
 */

import type { CommunicationNode } from '@/api/communicationNode';
import { INTERFACE_TYPE } from '@/views/ide/constants';

// ========== 类型定义 ==========

/**
 * 前端接口列表项接口
 */
export interface InterfaceItem {
  id: string;
  name: string;
  category: string;
  type: string;
  detail: string;
  packetCount: number;
  role: 'input' | 'output';  // 数据方向：input=接收, output=发送
  raw?: any;
}

// ========== 数据转换函数 ==========

/**
 * 将后端通信节点数据转换为前端接口列表格式
 * 根据 endpoint_description 推断接口类型、数据方向和详细信息
 * @param {CommunicationNode} node - 后端通信节点数据，包含 id、name、endpoint_description 等字段
 * @returns {InterfaceItem} 前端接口列表项，包含 category、type、role、detail 等视图所需字段
 */
export function convertNodeToInterfaceItem(node: CommunicationNode): InterfaceItem {
  // 从 endpoint_description 推断 category 和 detail
  let category = 'msg';
  let type = 'Msg';
  let detail = 'Internal Message';
  // 根据 type 推导数据方向：Server=接收(input), Client=发送(output)
  let role: 'input' | 'output' = 'input';

  if (node.endpoint_description && node.endpoint_description.length > 0) {
    const endpoint = node.endpoint_description[0];
    type = endpoint.type;

    // 根据类型确定 category 和 role
    if (endpoint.type.includes('TCP')) {
      category = INTERFACE_TYPE.TCP;
      if (endpoint.type === 'TCP Server') {
        role = 'input';
        detail = `Server ${endpoint.host || '0.0.0.0'}:${endpoint.port || '-'}`;
      } else {
        role = 'output';
        detail = `Client ${endpoint.remote_host || '-'}:${endpoint.remote_port || '-'}`;
      }
    } else if (endpoint.type.includes('UDP')) {
      category = INTERFACE_TYPE.UDP;
      // UDP 根据是否有 remote_host/port 判断方向
      role = endpoint.remote_host || endpoint.remote_port ? 'output' : 'input';
      if (endpoint.type === 'UDP Multicast') {
        detail = `Multicast ${endpoint.group || '-'}:${endpoint.port || '-'}`;
      } else {
        detail = `${endpoint.host || '-'}:${endpoint.port || '-'}`;
      }
    } else if (endpoint.type === 'Serial') {
      category = 'serial';
      role = 'input';
      detail = `${endpoint.port_name || '(未设置)'} @ ${endpoint.baud_rate || '-'} baud`;
    } else if (endpoint.type === 'CAN') {
      category = 'can';
      role = 'input';
      detail = `${endpoint.can_channel || '(未设置)'} @ ${endpoint.can_bitrate || '-'} bps`;
    }
  }

  return {
    id: node.id,
    name: node.name,
    category,
    type,
    detail,
    role,
    // 报文数量需要从报文关联表获取，待实现
    packetCount: 0,
    raw: node
  };
}
