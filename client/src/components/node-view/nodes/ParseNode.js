import BaseNode from "./BaseNode";

class ParseNodeModel extends BaseNode.model {
  /**
   * 初始化解析节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#52c41a';
  }
}

export default {
  type: 'parse-node',
  model: ParseNodeModel,
  view: BaseNode.view
};
