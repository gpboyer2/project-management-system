import BaseNode from "./BaseNode";

/**
 * MQTT 输出节点模型类
 * 继承自 BaseNode.model，表示 MQTT 服务的输出端节点
 */
class MqttOutNodeModel extends BaseNode.model {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点数据对象
   * @param {string} data.text - 节点显示文本
   * @param {string} data.properties - 节点属性配置
   */
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = '#ff85c0';
  }
  // MQTT Out 只有输入端口
  /**
   * 获取默认锚点位置
   * MQTT Out 节点只有一个左侧输入端口
   * @returns {Array<Object>} 锚点数组，包含锚点的坐标、ID和类型信息
   * @returns {number} anchor[].x - 锚点的 x 坐标
   * @returns {number} anchor[].y - 锚点的 y 坐标
   * @returns {string} anchor[].id - 锚点的唯一标识
   * @returns {string} anchor[].type - 锚点类型（"left"表示输入端口）
   */
  getDefaultAnchor() {
    const { x, y, id, width } = this;
    const anchors = [
      {
        x: x - width / 2,
        y: y,
        id: `${id}_left`,
        type: "left"
      }
    ];
    return anchors;
  }
}

export default {
  type: 'mqtt out',
  model: MqttOutNodeModel,
  view: BaseNode.view
};
