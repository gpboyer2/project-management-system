import BaseNode from "./BaseNode";

class SerializeNodeModel extends BaseNode.model {
  /**
   * 初始化序列化节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#faad14';
  }
}

export default {
  type: 'serialize-node',
  model: SerializeNodeModel,
  view: BaseNode.view
};
