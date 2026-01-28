import BaseNode from "./BaseNode";


class FetchNodeModel extends BaseNode.model {
  /**
   * 初始化获取节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ff9c6e';
  }
}

export default {
  type: 'fetch-node',
  model: FetchNodeModel,
  view: BaseNode.view
};
