import { RectNode, RectNodeModel, h } from "@logicflow/core";
import { getBytesLength } from '../util';

// 节点配置字段定义（用于在节点上显示的属性）
const NODE_DISPLAY_FIELDS = {
  'tcp-in-node': [
    { key: 'host', label: '主机' },
    { key: 'port', label: '端口' }
  ],
  'tcp-out-node': [
    { key: 'host', label: '主机' },
    { key: 'port', label: '端口' }
  ],
  'udp-in-node': [
    { key: 'host', label: '主机' },
    { key: 'port', label: '端口' }
  ],
  'udp-out-node': [
    { key: 'host', label: '主机' },
    { key: 'port', label: '端口' }
  ],
  'parse-node': [
    { key: 'packetList', label: '报文', format: 'count' }
  ],
  'serialize-node': [
    { key: 'packetList', label: '报文', format: 'count' }
  ]
};

class RedNodeModel extends RectNodeModel {
  /**
   * 初始化节点数据
   * @param {Object} data - 节点数据
   * @param {string} data.type - 节点类型
   * @returns {void}
   */
  initNodeData(data) {
    super.initNodeData(data);
    // 根据是否有配置字段来决定高度
    const fields = NODE_DISPLAY_FIELDS[data.type] || [];
    const headerHeight = 44;
    const fieldHeight = fields.length > 0 ? fields.length * 24 + 8 : 0;

    this.width = 220;
    this.height = headerHeight + fieldHeight;
    this.radius = 12;
    this.headerHeight = headerHeight;
    // 隐藏默认文字，我们自己渲染
    this.text.editable = false;
    // 图标区域的颜色
    this.defaultFill = '#1890ff';
    this.iconSize = 28;

    // 连接点常显：LogicFlow 默认只在 hover/selected 时显示锚点
    this.isShowAnchor = true;
  }

  /**
   * 获取节点数据
   * @returns {Object} 节点数据对象
   */
  getData() {
    const data = super.getData();
    data.properties.ui = 'node-red';
    return data;
  }

  /**
   * 设置节点属性
   * @returns {void}
   */
  setAttributes() {
    // 根据配置字段数量动态调整高度
    const fields = NODE_DISPLAY_FIELDS[this.type] || [];
    const headerHeight = 44;
    const fieldHeight = fields.length > 0 ? fields.length * 24 + 8 : 0;
    this.height = headerHeight + fieldHeight;
    this.headerHeight = headerHeight;
  }

  /**
   * 更新节点文本
   * @param {string} val - 新的文本值
   * @returns {void}
   */
  updateText(val) {
    super.updateText(val);
    this.setAttributes();
  }

  /**
   * 获取节点样式
   * @returns {Object} 节点样式对象
   */
  getNodeStyle() {
    const style = super.getNodeStyle();
    style.fill = '#ffffff';
    style.strokeWidth = this.isSelected ? 2 : 1;
    style.stroke = this.isSelected ? '#2f54eb' : '#e0e0e0';
    return style;
  }

  /**
   * 获取图标颜色
   * @returns {string} 图标颜色值
   */
  getIconColor() {
    return this.properties?.style?.iconColor || this.defaultFill;
  }

  /**
   * 获取默认锚点配置
   * @returns {Array<Object>} 锚点配置数组
   */
  getDefaultAnchor() {
    const { x, y, id, width, height, headerHeight } = this;
    const hh = headerHeight || 44;
    // 输入锚点：左侧头部中间
    const inputY = y - height / 2 + hh / 2;
    // 正常输出锚点：右侧头部中间
    const outputY = y - height / 2 + hh / 2;
    // 错误输出锚点：右侧底部
    const errorY = y + height / 2 - 8;

    return [
      { x: x - width / 2, y: inputY, id: `${id}_input`, type: "left" },
      { x: x + width / 2, y: outputY, id: `${id}_output`, type: "right" },
      { x: x + width / 2, y: errorY, id: `${id}_error`, type: "right", isError: true }
    ];
  }

  /**
   * 获取轮廓样式
   * @returns {Object} 轮廓样式对象
   */
  getOutlineStyle() {
    const style = super.getOutlineStyle();
    style.stroke = 'transparent';
    style.hover.stroke = 'transparent';
    return style;
  }

  /**
   * 获取锚点样式
   * @returns {Object} 锚点样式对象
   */
  getAnchorStyle() {
    return {
      stroke: 'none',
      fill: '#8c8c8c',
      r: 4
    };
  }

  /**
   * LogicFlow 内部会在 hover/leave / selected 时调用 setIsShowAnchor(true/false)
   * 这里强制忽略关闭动作，保证锚点始终渲染
   * @param {boolean} flag - 是否显示锚点
   * @returns {void}
   */
  setIsShowAnchor(flag = true) {
    super.setIsShowAnchor(true);
    this.isShowAnchor = true;
  }

  /**
   * 获取文本样式
   * @returns {Object} 文本样式对象
   */
  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 14;
    style.fontWeight = 500;
    style.fill = '#1f1f1f';
    // 隐藏默认文字
    style.overflowMode = 'hidden';
    return style;
  }
}

class RedNode extends RectNode {
  /**
   * 获取锚点样式
   * @param {Object} anchorInfo - 锚点信息
   * @param {string} anchorInfo.id - 锚点 ID
   * @returns {Object} 锚点样式对象
   */
  getAnchorStyle(anchorInfo) {
    const style = super.getAnchorStyle(anchorInfo);
    style.visibility = 'visible';
    style.stroke = 'none';
    style.fill = anchorInfo && anchorInfo.id && anchorInfo.id.includes('_error') ? '#ff4d4f' : '#8c8c8c';
    return style;
  }

  /**
   * 获取锚点形状
   * @param {Object} anchorData - 锚点数据
   * @param {number} anchorData.x - 锚点 X 坐标
   * @param {number} anchorData.y - 锚点 Y 坐标
   * @param {string} anchorData.id - 锚点 ID
   * @returns {VNode} 锚点虚拟 DOM 节点
   */
  getAnchorShape(anchorData) {
    const { x, y, id } = anchorData;
    const isError = id && id.includes('_error');

    // 连接点样式 - 统一为小方块，错误输出用红色
    const size = { w: 8, h: 8 };
    const fill = isError ? '#ff4d4f' : '#8c8c8c';
    const radius = 2;

    return h("rect", {
      x: x - size.w / 2,
      y: y - size.h / 2,
      width: size.w,
      height: size.h,
      rx: radius,
      ry: radius,
      fill: fill,
      stroke: 'none',
      className: `nv-custom-anchor ${isError ? 'nv-anchor-error' : ''}`
    });
  }

  /**
   * 获取节点图标
   * @returns {VNode|null} 图标虚拟 DOM 节点，无图标时返回 null
   */
  getIcon() {
    const { width, height, properties, iconSize, headerHeight } = this.props.model;
    const icon = properties?.icon;
    if (!icon) return null;

    const size = iconSize || 28;
    const iconDisplaySize = 16;
    const hh = headerHeight || 44;
    // 图标在头部区域的中心
    const iconX = -width / 2 + 10 + (size - iconDisplaySize) / 2;
    const iconY = -height / 2 + (hh - iconDisplaySize) / 2;

    return h('image', {
      width: iconDisplaySize,
      height: iconDisplaySize,
      x: iconX,
      y: iconY,
      href: icon,
      style: 'filter: brightness(0) invert(1);'
    });
  }

  /**
   * 格式化显示值
   * @param {*} value - 原始值
   * @param {string} format - 格式化类型，如 'count'
   * @returns {string} 格式化后的字符串
   */
  formatValue(value, format) {
    if (value === undefined || value === null || value === '') return '-';
    if (format === 'count' && Array.isArray(value)) {
      return value.length > 0 ? `${value.length} 项` : '-';
    }
    return String(value);
  }

  /**
   * 渲染配置字段列表
   * @returns {VNode|null} 字段组虚拟 DOM 节点，无字段时返回 null
   */
  getFieldsGroup() {
    const { x, y, width, height, properties, headerHeight, type } = this.props.model;
    const fields = NODE_DISPLAY_FIELDS[type] || [];
    if (fields.length === 0) return null;

    const hh = headerHeight || 44;
    const startY = -height / 2 + hh + 4;
    const fieldHeight = 24;
    const paddingX = 12;

    const fieldElements = fields.map((field, index) => {
      const fieldY = startY + index * fieldHeight + fieldHeight / 2;
      const value = this.formatValue(properties?.[field.key], field.format);

      return h('g', { key: field.key }, [
        // 字段标签
        h('text', {
          x: -width / 2 + paddingX,
          y: fieldY,
          textAnchor: 'start',
          dominantBaseline: 'middle',
          fill: '#8c8c8c',
          fontSize: 12,
          fontWeight: 400,
          style: 'pointer-events: none;'
        }, field.label),
        // 字段值
        h('text', {
          x: width / 2 - paddingX,
          y: fieldY,
          textAnchor: 'end',
          dominantBaseline: 'middle',
          fill: '#1f1f1f',
          fontSize: 12,
          fontWeight: 400,
          style: 'pointer-events: none;'
        }, value)
      ]);
    });

    return h('g', { transform: `translate(${x}, ${y})` }, fieldElements);
  }

  /**
   * 获取节点形状
   * @returns {VNode} 节点虚拟 DOM 节点
   */
  getShape() {
    const { x, y, width, height, radius, iconSize, headerHeight, type } = this.props.model;
    const { text } = this.props.model;
    const style = this.props.model.getNodeStyle();
    const iconColor = this.props.model.getIconColor();
    const size = iconSize || 28;
    const hh = headerHeight || 44;
    const fields = NODE_DISPLAY_FIELDS[type] || [];
    const hasFields = fields.length > 0;

    return h('g', { className: 'nv-red-node' }, [
      // 节点阴影
      h('rect', {
        x: x - width / 2 + 1,
        y: y - height / 2 + 2,
        width,
        height,
        rx: radius,
        ry: radius,
        fill: 'rgba(0, 0, 0, 0.06)',
        stroke: 'none'
      }),
      // 节点主体
      h('rect', {
        ...style,
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        rx: radius,
        ry: radius
      }),
      // 头部与内容区分隔线
      hasFields ? h('line', {
        x1: x - width / 2 + 8,
        y1: y - height / 2 + hh,
        x2: x + width / 2 - 8,
        y2: y - height / 2 + hh,
        stroke: '#f0f0f0',
        strokeWidth: 1
      }) : null,
      // 头部区域
      h('g', {
        style: 'pointer-events: none;',
        transform: `translate(${x}, ${y})`
      }, [
        // 圆形图标背景
        h('circle', {
          cx: -width / 2 + 10 + size / 2,
          cy: -height / 2 + hh / 2,
          r: size / 2,
          fill: iconColor,
          stroke: 'none'
        }),
        // 图标
        this.getIcon(),
        // 节点名称
        h('text', {
          x: -width / 2 + 10 + size + 10,
          y: -height / 2 + hh / 2,
          textAnchor: 'start',
          dominantBaseline: 'middle',
          fill: '#1f1f1f',
          fontSize: 14,
          fontWeight: 500,
          style: 'pointer-events: none;'
        }, text?.value || '')
      ]),
      // 配置字段列表
      this.getFieldsGroup()
    ]);
  }
}

export default {
  type: 'red-node',
  model: RedNodeModel,
  view: RedNode
};
