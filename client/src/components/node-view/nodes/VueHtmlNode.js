import { HtmlNode, HtmlNodeModel } from "@logicflow/core";
import { createApp, ref, h } from 'vue';
import ElementPlus from 'element-plus';
import VueNode from './vue-node/index.vue';

/**
 * Vue HTML 节点视图类
 * 继承自 HtmlNode，用于在 LogicFlow 中渲染 Vue 组件
 */
class VueHtmlNode extends HtmlNode {
  /**
   * 构造函数
   * @param {Object} props - 节点属性对象
   */
  constructor (props) {
    super(props);
    this.isMounted = false;
    // 用于保证只绑定一次事件（避免重复绑定导致触发多次）
    this._hasBindSelectEvent = false;
    this.r = h(VueNode, {
      properties: props.model.getProperties(),
      text: props.model.inputData,
      onBtnClick: (i) => {
        this.r.component.props.text = String(Number(this.r.component.props.text) + Number(i));
      }
    });
    this.app = createApp({
      render: () => this.r
    });
    // 为这个独立的 Vue 实例注册 Element Plus
    this.app.use(ElementPlus);
  }
  /**
   * 设置 HTML 内容并挂载 Vue 组件
   * @param {HTMLElement} rootEl - 根 DOM 元素
   */
  setHtml(rootEl) {
    if (!this.isMounted) {
      this.isMounted = true;
      const node = document.createElement('div');
      rootEl.appendChild(node);
      this.app.mount(node);

      // 关键修复：
      // HtmlNode 的内容通过 foreignObject 渲染为 HTML DOM。
      // HTML 内部点击不会稳定冒泡到 SVG 事件系统，导致 lf.on('node:click') 收不到，
      // 从而"点击图元无法跳转到属性"。
      // 这里在捕获阶段监听 mousedown，把点击显式转发为 LogicFlow 的 node:click。
      if (!this._hasBindSelectEvent) {
        this._hasBindSelectEvent = true;
        rootEl.addEventListener('mousedown', (e) => {
          try {
            // 允许输入控件正常工作，但仍然要能选中节点
            // 只做最小干预：不阻止默认行为，只负责把选中与事件同步出去
            const model = this.props?.model;
            const graphModel = this.props?.graphModel;

            // 尝试让 LogicFlow 选中该节点（不同版本 API 不同，这里做兼容）
            if (graphModel && typeof graphModel.selectNodeById === 'function') {
              graphModel.selectNodeById(model.id);
            } else if (model && typeof model.setSelected === 'function') {
              model.setSelected(true);
            }

            // 显式触发 node:click，保证上层监听能收到
            if (graphModel && graphModel.eventCenter && typeof graphModel.eventCenter.emit === 'function') {
              graphModel.eventCenter.emit('node:click', { data: model.getData(), e });
            }
          } catch (err) {
            // 避免任何异常影响画布交互
          }
        }, true);
      }
    } else {
      this.r.component.props.properties = this.props.model.getProperties();
    }
  }
  /**
   * 获取节点文本
   * @returns {null} 始终返回 null，因为使用 Vue 组件渲染
   */
  getText () {
    return null;
  }
}

/**
 * Vue HTML 节点模型类
 * 继承自 HtmlNodeModel，用于定义 Vue 节点的属性和行为
 */
class VueHtmlNodeModel extends HtmlNodeModel {
  /**
   * 设置节点属性
   */
  setAttributes() {
    this.width = 300;
    this.height = 100;
    this.text.editable = false;
    this.inputData = this.text.value;
  }
  /**
   * 获取节点轮廓样式
   * @returns {Object} 轮廓样式对象
   */
  getOutlineStyle() {
    const style = super.getOutlineStyle();
    style.stroke = 'none';
    style.hover.stroke = 'none';
    return style;
  }
  /**
   * 获取默认锚点配置
   * @returns {Array} 空数组，表示不显示锚点
   */
  getDefaultAnchor() {
    return [];
  }
  /**
   * 获取节点数据
   * @returns {Object} 节点数据对象
   */
  getData () {
    const data = super.getData();
    data.text.value = this.inputData;
    return data;
  }
}

export default {
  type: 'vue-html',
  model: VueHtmlNodeModel,
  view: VueHtmlNode
};