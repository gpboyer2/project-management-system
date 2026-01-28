import BaseNode from "./BaseNode";

/**
 * Watch 节点模型类
 * 继承自 BaseNode.model，用于创建监视节点（只有输出端口）
 */
class WatchNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点初始数据
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#87e8de';
  }
  /**
   * 获取默认锚点配置
   * Watch 节点只有输出端口
   * @returns {Array} 锚点配置数组
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
}

export default {
  type: 'watch',
  model: WatchNodeModel,
  view: BaseNode.view
};
