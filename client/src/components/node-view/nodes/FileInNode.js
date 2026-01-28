import BaseNode from "./BaseNode";

class FileInNodeModel extends BaseNode.model {
  /**
   * 初始化文件输入节点数据
   * @param {Object} data - 节点数据
   * @returns {void}
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffd591';
  }
}

export default {
  type: 'file in',
  model: FileInNodeModel,
  view: BaseNode.view
};
