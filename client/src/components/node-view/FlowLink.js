import { BezierEdge, BezierEdgeModel } from "@logicflow/core";

/**
 * 流程连线模型类，自定义贝塞尔曲线的样式
 * @class
 * @extends BezierEdgeModel
 */
class FlowLinkModel extends BezierEdgeModel {
  /**
   * 获取连线样式
   * @returns {Object} 连线样式对象
   * @returns {number} return.strokeWidth - 连线宽度
   * @returns {string} return.stroke - 连线颜色，选中状态为蓝色，未选中为灰色
   */
  getEdgeStyle() {
    const style = super.getEdgeStyle();
    // 连接线宽度改细
    style.strokeWidth = 1.5;
    style.stroke = this.isSelected ? '#2f54eb' : '#bfbfbf';
    return style;
  }
}

/**
 * 流程连线视图类
 * @class
 * @extends BezierEdge
 */
class FlowLink extends BezierEdge {}

export default {
  type: 'flow-link',
  view: FlowLink,
  model: FlowLinkModel
};

