import BaseNode from "./BaseNode";

class StartNodeModel extends BaseNode.model {
  /**
   * 重写定义锚点
   * @returns {Array} 锚点数组，每个锚点包含 x, y, id, type 属性
   */
  getDefaultAnchor() {
    const { x, y, id, width } = this;
    const anchors = [
      {
        x: x + width / 2,
        y: y,
        id: `${id}_right`,
        type: "right"
      }
    ];
    return anchors;
  }
  /**
   * 初始化节点数据
   * @param {Object} data - 节点数据对象
   * @returns {void} 无返回值
   */
  initNodeData(data) {
    super.initNodeData(data);
    this.defaultFill = '#b7eb8f';
  }
}

export default {
  type: 'start-node',
  model: StartNodeModel,
  view: BaseNode.view
};
