import BaseNode from "./BaseNode";

/**
 * UDP 输入节点模型类
 * 继承自 BaseNode.model，用于创建 UDP 接收数据节点
 */
class UdpInNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#13c2c2';
  }
}

/**
 * UDP 输出节点模型类
 * 继承自 BaseNode.model，用于创建 UDP 发送数据节点
 */
class UdpOutNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#13c2c2';
  }
}

export const UdpInNode = {
  type: 'udp-in-node',
  model: UdpInNodeModel,
  view: BaseNode.view
};

export const UdpOutNode = {
  type: 'udp-out-node',
  model: UdpOutNodeModel,
  view: BaseNode.view
};

export default UdpInNode;
