import BaseNode from "./BaseNode";

class FileNodeModel extends BaseNode.model {
  /**
   * 初始化文件节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffd591';
  }
}

export default {
  type: 'file',
  model: FileNodeModel,
  view: BaseNode.view
};
