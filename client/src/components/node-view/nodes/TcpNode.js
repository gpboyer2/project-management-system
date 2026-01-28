import BaseNode from "./BaseNode";

/**
 * TCP 输入节点模型类
 * 继承自 BaseNode.model，用于创建 TCP 接收数据节点
 */
class TcpInNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#1890ff';
  }
}

/**
 * TCP 输出节点模型类
 * 继承自 BaseNode.model，用于创建 TCP 发送数据节点
 */
class TcpOutNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#1890ff';
  }
}

export const TcpInNode = {
  type: 'tcp-in-node',
  model: TcpInNodeModel,
  view: BaseNode.view
};

export const TcpOutNode = {
  type: 'tcp-out-node',
  model: TcpOutNodeModel,
  view: BaseNode.view
};

export default TcpInNode;
