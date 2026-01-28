/**
 * 协议解析节点配置表单
 * 用于配置协议解析节点的参数
 */

export default {
  // 节点类型标识
  type: 'parse-node',
  
  // 节点分类
  category: 'processing',
  
  // 节点显示名称
  label: '协议解析',
  
  // 节点描述
  description: '协议解析节点，用于将二进制数据按照协议规则解析为结构化数据',
  
  // 默认配置
  defaults: {
    packetIdList: {
      value: [],
      label: '报文配置',
      type: 'multi-select',
      dynamicOptions: true,
      optionsSource: 'packet-config',
      placeholder: '请选择报文配置',
      help: '从报文配置列表中选择要使用的协议（可多选）'
    }
  },
  
  // 输入端口配置
  inputs: 1,
  
  // 输出端口配置（主输出+错误输出）
  outputs: 2,
  
  // 输出端口标签
  outputLabels: ['解析结果', '错误输出'],
  
  // 图标配置
  icon: '/images/parse.svg',
  
  // 节点颜色
  color: '#95de64',
  
  // 表单布局
  formLayout: [
    {
      section: '报文配置',
      fields: ['packetIdList']
    }
  ]
};
