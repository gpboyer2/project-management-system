import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import FunctionNode from "./nodes/FunctionNode";
import SwitchNode from "./nodes/SwitchNode";
import StartNode  from "./nodes/StartNode";
import FetchNode from "./nodes/FetchNode";
import DelayNode from "./nodes/DelayNode";
import SwapNode from "./nodes/SwapNode";
import FlowLink from "./FlowLink";
import Palette from './tools/palette/index.vue';
import VueHtmlNode from './nodes/VueHtmlNode';

// 数据传输分类节点
import { TcpInNode, TcpOutNode } from "./nodes/TcpNode";
import { UdpInNode, UdpOutNode } from "./nodes/UdpNode";
import SerialNode from "./nodes/SerialNode";

// 协议处理分类节点
import ParseNode from "./nodes/ParseNode";
import SerializeNode from "./nodes/SerializeNode";

// Network 分类节点
import MqttInNode from "./nodes/MqttInNode";
import MqttOutNode from "./nodes/MqttOutNode";
import HttpInNode from "./nodes/HttpInNode";
import HttpResponseNode from "./nodes/HttpResponseNode";
import HttpRequestNode from "./nodes/HttpRequestNode";
import WebsocketInNode from "./nodes/WebsocketInNode";
import WebsocketOutNode from "./nodes/WebsocketOutNode";

// Storage 分类节点
import FileNode from "./nodes/FileNode";
import FileInNode from "./nodes/FileInNode";
import WatchNode from "./nodes/WatchNode";

/**
 * Node-RED 扩展插件类
 * 注册所有节点类型并管理面板组件
 * @class
 */
class NodeRedExtension {
  static pluginName = 'NodeRedExtension';

  /**
   * 构造函数，初始化插件并注册所有节点类型
   * @param {Object} options - 配置选项
   * @param {Object} options.lf - LogicFlow 实例
   */
  constructor ({ lf }) {
    // 数据传输分类
    lf.register(TcpInNode);
    lf.register(TcpOutNode);
    lf.register(UdpInNode);
    lf.register(UdpOutNode);
    lf.register(SerialNode);

    // 协议处理分类
    lf.register(ParseNode);
    lf.register(SerializeNode);

    // Common 分类
    lf.register(FunctionNode);
    lf.register(SwitchNode);
    lf.register(StartNode);
    lf.register(FetchNode);
    lf.register(FlowLink);
    lf.register(DelayNode);
    lf.register(SwapNode);
    lf.register(VueHtmlNode);

    // Network 分类
    lf.register(MqttInNode);
    lf.register(MqttOutNode);
    lf.register(HttpInNode);
    lf.register(HttpResponseNode);
    lf.register(HttpRequestNode);
    lf.register(WebsocketInNode);
    lf.register(WebsocketOutNode);

    // Storage 分类
    lf.register(FileNode);
    lf.register(FileInNode);
    lf.register(WatchNode);

    lf.setDefaultEdgeType('flow-link');
    this.app = createApp(Palette, {
      lf
    });
    this.app.use(ElementPlus);
    this.mountNode = null;
  }

  /**
   * 渲染面板组件到指定的 DOM 容器
   * @param {Object} lf - LogicFlow 实例
   * @param {HTMLElement} domOverlay - DOM 容器元素
   */
  render(lf, domOverlay) {
    const node = document.createElement('div');
    node.className = 'nv-node-red-palette';
    domOverlay.appendChild(node);
    this.mountNode = node;
    this.app.mount(node);
  }

  /**
   * 销毁插件，清理 Vue 应用和 DOM 节点
   */
  destroy() {
    if (this.app) {
      this.app.unmount();
      this.app = null;
    }
    if (this.mountNode && this.mountNode.parentNode) {
      this.mountNode.parentNode.removeChild(this.mountNode);
      this.mountNode = null;
    }
  }
}

export default NodeRedExtension;