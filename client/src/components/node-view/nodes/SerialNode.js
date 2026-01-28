import BaseNode from "./BaseNode";


class SerialNodeModel extends BaseNode.model {
  /**
   * 初始化串口节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffc53d';
  }
}

export default {
  type: 'serial-node',
  model: SerialNodeModel,
  view: BaseNode.view
};
