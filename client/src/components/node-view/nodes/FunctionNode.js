import BaseNode from "./BaseNode";

class FunctionNodeModel extends BaseNode.model {
  /**
   * 初始化函数节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffa940';
  }
}

export default {
  type: 'function-node',
  model: FunctionNodeModel,
  view: BaseNode.view
};
