import BaseNode from "./BaseNode";

/**
 * Swap 节点模型类
 * 继承自 BaseNode.model，用于创建交换节点
 */
class SwapNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#85a5ff';
  }
}

export default {
  type: 'swap-node',
  model: SwapNodeModel,
  view: BaseNode.view
};
