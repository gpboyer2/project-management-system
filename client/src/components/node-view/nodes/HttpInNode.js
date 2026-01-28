import BaseNode from "./BaseNode";

/**
 * HTTP 输入节点模型类
 * 继承自 BaseNode.model，表示 HTTP 服务的输入端节点
 */
class HttpInNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点数据对象
   * @param {string} data.text - 节点显示文本
   * @param {string} data.properties - 节点属性配置
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ffe58f';
  }
  // HTTP In 只有输出端口
  /**
   * 获取默认锚点位置
   * HTTP In 节点只有一个右侧输出端口
   * @returns {Array<Object>} 锚点数组，包含锚点的坐标、ID和类型信息
   * @returns {number} anchor[].x - 锚点的 x 坐标
   * @returns {number} anchor[].y - 锚点的 y 坐标
   * @returns {string} anchor[].id - 锚点的唯一标识
   * @returns {string} anchor[].type - 锚点类型（"right"表示输出端口）
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
  type: 'http in',
  model: HttpInNodeModel,
  view: BaseNode.view
};
