/**
 * 串口节点配置表单
 * 用于配置串口通信节点的参数
 */

export default {
  // 节点类型标识
  type: 'serial-node',
  
  // 节点分类
  category: 'communication',
  
  // 节点显示名称
  label: '串口',
  
  // 节点描述
  description: '串口通信节点，用于通过串行接口收发数据',
  
  // 默认配置
  defaults: {
    name: {
      value: '',
      label: '节点名称',
      placeholder: '请输入节点名称'
    },
    port: {
      value: '',
      label: '串口设备',
      type: 'select',
      options: [
        { value: '/dev/ttyUSB0', label: '/dev/ttyUSB0' },
        { value: '/dev/ttyUSB1', label: '/dev/ttyUSB1' },
        { value: '/dev/ttyS0', label: '/dev/ttyS0' },
        { value: '/dev/ttyS1', label: '/dev/ttyS1' },
        { value: 'COM1', label: 'COM1' },
        { value: 'COM2', label: 'COM2' },
        { value: 'COM3', label: 'COM3' },
        { value: 'COM4', label: 'COM4' }
      ],
      editable: true,
      placeholder: '请选择或输入串口设备',
      /**
       * 验证串口设备配置是否有效
       * @param {string} value - 串口设备路径
       * @returns {boolean|string} 验证通过返回 true，失败返回错误信息
       */
      validate: (value) => {
        if (!value) return '串口设备不能为空';
        return true;
      }
    },
    baudRate: {
      value: 9600,
      label: '波特率',
      type: 'select',
      options: [
        { value: 300, label: '300' },
        { value: 1200, label: '1200' },
        { value: 2400, label: '2400' },
        { value: 4800, label: '4800' },
        { value: 9600, label: '9600' },
        { value: 19200, label: '19200' },
        { value: 38400, label: '38400' },
        { value: 57600, label: '57600' },
        { value: 115200, label: '115200' },
        { value: 230400, label: '230400' },
        { value: 460800, label: '460800' },
        { value: 921600, label: '921600' }
      ]
    },
    dataBits: {
      value: 8,
      label: '数据位',
      type: 'select',
      options: [
        { value: 5, label: '5位' },
        { value: 6, label: '6位' },
        { value: 7, label: '7位' },
        { value: 8, label: '8位' }
      ]
    },
    stopBits: {
      value: 1,
      label: '停止位',
      type: 'select',
      options: [
        { value: 1, label: '1位' },
        { value: 1.5, label: '1.5位' },
        { value: 2, label: '2位' }
      ]
    },
    parity: {
      value: 'none',
      label: '校验位',
      type: 'select',
      options: [
        { value: 'none', label: '无校验' },
        { value: 'even', label: '偶校验' },
        { value: 'odd', label: '奇校验' },
        { value: 'mark', label: '标记校验' },
        { value: 'space', label: '空格校验' }
      ]
    },
    flowControl: {
      value: 'none',
      label: '流控制',
      type: 'select',
      options: [
        { value: 'none', label: '无流控' },
        { value: 'hardware', label: '硬件流控(RTS/CTS)' },
        { value: 'software', label: 'XON/XOFF 流控' }
      ]
    },
    autoOpen: {
      value: true,
      label: '自动打开',
      type: 'checkbox',
      help: '节点初始化时自动打开串口'
    },
    autoReconnect: {
      value: true,
      label: '自动重连',
      type: 'checkbox',
      help: '串口断开后自动尝试重新连接'
    },
    reconnectInterval: {
      value: 5000,
      label: '重连间隔(ms)',
      type: 'number',
      min: 1000,
      placeholder: '请输入重连间隔(毫秒)',
      /**
       * 判断重连间隔字段是否可见
       * @param {Object} config - 完整的节点配置对象
       * @returns {boolean} 当自动重连开启时返回 true
       */
      visible: (config) => config.autoReconnect === true
    },
    delimiter: {
      value: '',
      label: '数据分隔符',
      placeholder: '例如: \\n, \\r\\n, 或自定义字符',
      help: '用于分割接收到的数据流，留空表示不分割'
    },
    encoding: {
      value: 'utf8',
      label: '数据编码',
      type: 'select',
      options: [
        { value: 'utf8', label: 'UTF-8' },
        { value: 'ascii', label: 'ASCII' },
        { value: 'hex', label: 'HEX' },
        { value: 'base64', label: 'Base64' },
        { value: 'binary', label: 'Binary' }
      ]
    }
  },
  
  // 输入端口配置
  inputs: 1,
  
  // 输出端口配置
  outputs: 1,
  
  // 图标配置
  icon: '/images/serial.svg',
  
  // 节点颜色
  color: '#ffc53d',
  
  // 表单布局
  formLayout: [
    {
      section: '基础配置',
      fields: ['name', 'port']
    },
    {
      section: '串口参数',
      fields: ['baudRate', 'dataBits', 'stopBits', 'parity', 'flowControl']
    },
    {
      section: '连接配置',
      fields: ['autoOpen', 'autoReconnect', 'reconnectInterval']
    },
    {
      section: '数据配置',
      fields: ['delimiter', 'encoding'],
      collapsible: true,
      collapsed: true
    }
  ]
};
