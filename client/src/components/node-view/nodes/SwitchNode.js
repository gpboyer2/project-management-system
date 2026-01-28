import BaseNode from "./BaseNode";

/**
 * Switch 节点模型类
 * 继承自 BaseNode.model，用于创建交换机节点
 */
class SwitchNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#fff566';
  }
}

export default {
  type: 'switch-node',
  model: SwitchNodeModel,
  view: BaseNode.view
};
