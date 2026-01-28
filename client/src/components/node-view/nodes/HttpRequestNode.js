import BaseNode from "./BaseNode";

class HttpRequestNodeModel extends BaseNode.model {
  /**
   * 初始化HTTP请求节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffe58f';
  }
}

export default {
  type: 'http request',
  model: HttpRequestNodeModel,
  view: BaseNode.view
};
