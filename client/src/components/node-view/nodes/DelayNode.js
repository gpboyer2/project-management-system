import BaseNode from "./BaseNode";

class DelayNodeModel extends BaseNode.model {
  /**
   * 初始化延迟节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#b37feb';
  }
}

export default {
  type: 'delay-node',
  model: DelayNodeModel,
  view: BaseNode.view
};
