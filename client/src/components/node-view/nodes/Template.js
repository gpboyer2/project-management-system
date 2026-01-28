/**
 * 自定义节点模板
 * 
 * 本文件提供了创建自定义节点的示例代码
 * 根据需求选择合适的模板进行修改
 */

import BaseNode from "./BaseNode";
import { h } from "@logicflow/core";

// ============================================================
// 模板 1：基本节点（推荐，90% 的情况使用这个）
// ============================================================
// 只需要自定义颜色、锚点位置等，不需要自定义视图
// 使用场景：大多数节点

/*
class BasicNodeModel extends BaseNode.model {
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = 'rgb(129, 212, 250)'; // 自定义背景色
  }
}

export default {
  type: 'basic-node',
  model: BasicNodeModel,
  view: BaseNode.view  // 直接使用基础视图，无需自定义
};
*/

// ============================================================
// 模板 2：自定义图标节点
// ============================================================
// 需要使用 SVG sprite 图标或自定义图标
// 使用场景：MQTT、HTTP、WebSocket 等协议节点

/*
class CustomIconNode extends BaseNode.view {
  getIcon() {
    const { width, height } = this.props.model;
    
    return h('svg', {
      width: 30,
      height: 30,
      x: -width / 2,
      y: -height / 2,
      viewBox: '0 0 24 24',
      fill: 'none'
    }, [
      h('use', {
        href: 'images/icons-sprite.svg#icon-mqtt'  // 修改为你的图标ID
      })
    ]);
  }
}

class CustomIconNodeModel extends BaseNode.model {
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = 'rgb(216, 191, 216)';
  }
  
  // 可选：自定义锚点位置（例如只有输出端口）
  getDefaultAnchor() {
    const { x, y, id, width } = this;
    return [
      {
        x: x + width / 2,
        y: y,
        id: `${id}_right`,
        type: "right"
      }
    ];
  }
}

export default {
  type: 'custom-icon-node',
  model: CustomIconNodeModel,
  view: CustomIconNode  // 使用自定义视图
};
*/

// ============================================================
// 模板 3：自定义形状节点
// ============================================================
// 需要改变节点的整体形状（圆形、菱形、多边形等）
// 使用场景：决策节点、特殊功能节点

/*
class CustomShapeNode extends BaseNode.view {
  getShape() {
    const { x, y, width, height } = this.props.model;
    const style = this.props.model.getNodeStyle();
    
    // 示例：绘制菱形
    const points = `${x},${y - height/2} ${x + width/2},${y} ${x},${y + height/2} ${x - width/2},${y}`;
    
    return h('g', { className: 'nv-custom-shape-node' }, [
      h('polygon', {
        ...style,
        points
      }),
      this.getIcon()
    ]);
  }
}

class CustomShapeNodeModel extends BaseNode.model {
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = 'rgb(255, 235, 59)';
  }
}

export default {
  type: 'custom-shape-node',
  model: CustomShapeNodeModel,
  view: CustomShapeNode
};
*/

// ============================================================
// 模板 4：自定义锚点形状节点
// ============================================================
// 需要改变锚点的形状（圆形、三角形等）
// 使用场景：需要特殊视觉效果的节点

/*
class CustomAnchorNode extends BaseNode.view {
  getAnchorShape({ x, y }) {
    // 示例：使用圆形锚点代替默认的方形
    return h("circle", {
      cx: x,
      cy: y,
      r: 5,
      className: 'nv-custom-anchor',
      fill: '#fff',
      stroke: '#1890ff',
      strokeWidth: 2
    });
  }
}

class CustomAnchorNodeModel extends BaseNode.model {
  initNodeData (data) {
    super.initNodeData(data);
    this.defaultFill = 'rgb(100, 200, 150)';
  }
}

export default {
  type: 'custom-anchor-node',
  model: CustomAnchorNodeModel,
  view: CustomAnchorNode
};
*/

// ============================================================
// 可重写的方法列表
// ============================================================

/**
 * View 类可重写方法：
 * - getAnchorShape({ x, y }) - 自定义锚点形状
 * - getIcon() - 自定义节点图标
 * - getShape() - 自定义节点整体形状
 *
 * Model 类可重写方法：
 * - initNodeData(data) - 初始化节点数据（宽高、颜色等）
 * - getData() - 获取节点数据
 * - setAttributes() - 设置节点属性
 * - updateText(val) - 更新节点文本
 * - getNodeStyle() - 获取节点样式
 * - getDefaultAnchor() - 自定义锚点位置
 * - getOutlineStyle() - 自定义轮廓样式
 */

// ============================================================
// 最佳实践
// ============================================================

/**
 * 1. 优先使用模板 1（基本节点）
 *    - 90% 的节点只需要改变颜色和锚点位置
 *    - 直接使用 BaseNode.view，代码最简洁
 * 
 * 2. 按需自定义 View
 *    - 只有在需要自定义图标、形状时才创建 View 类
 *    - 避免不必要的代码复杂度
 * 
 * 3. 保持一致性
 *    - 自定义视图时保持与 BaseNode 的风格一致
 *    - 使用相同的尺寸、间距、颜色规范
 * 
 * 4. 代码复用
 *    - 尽量调用父类方法，避免重复代码
 *    - 只重写需要改变的方法
 */

// ============================================================
// 注意事项
// ============================================================

/**
 * 必须遵守的规则：
 * - 必须从 @logicflow/core 导入 h 函数来创建 SVG 元素
 * - 自定义 View 类必须继承 BaseNode.view
 * - 自定义 Model 类必须继承 BaseNode.model
 * - 在 initNodeData 中必须先调用 super.initNodeData(data)
 * - type 必须是唯一的，不能与其他节点重复
 */

// 默认导出一个空对象，防止被误注册
export default {
  type: 'template-node',
  model: BaseNode.model,
  view: BaseNode.view
};
