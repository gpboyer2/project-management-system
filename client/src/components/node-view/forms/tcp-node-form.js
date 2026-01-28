/**
 * TCP节点配置表单
 * TCP in: 接收数据，监听本机IP和端口
 * TCP out: 发送数据，连接目标IP和端口
 */

// TCP in 节点配置 - 接收数据，监听本机
export const tcpInNodeForm = {
  type: 'tcp-in-node',
  category: 'communication',
  label: 'TCP in',
  description: 'TCP接收节点，监听本机端口接收数据',
  defaults: {
    name: { value: '', label: '节点名称', placeholder: '请输入节点名称' },
    host: { value: '0.0.0.0', label: '监听地址', placeholder: '本机监听地址，0.0.0.0表示所有网卡', help: '默认监听本机所有网卡' },
    port: { value: 8080, label: '监听端口', type: 'number', min: 1, max: 65535, placeholder: '请输入监听端口(1-65535)' },
    encoding: { value: 'utf8', label: '数据编码', type: 'select', options: [
      { value: 'utf8', label: 'UTF-8' }, { value: 'ascii', label: 'ASCII' }, { value: 'hex', label: 'HEX' }, { value: 'base64', label: 'Base64' }
    ]}
  },
  inputs: 0,
  outputs: 1,
  icon: '/images/tcp.svg',
  color: '#69b1ff',
  formLayout: [
    { section: '监听配置', fields: ['name', 'host', 'port'] },
    { section: '数据配置', fields: ['encoding'], collapsible: true, collapsed: true }
  ]
};

// TCP out 节点配置 - 发送数据，连接目标
export const tcpOutNodeForm = {
  type: 'tcp-out-node',
  category: 'communication',
  label: 'TCP out',
  description: 'TCP发送节点，连接目标地址发送数据',
  defaults: {
    name: { value: '', label: '节点名称', placeholder: '请输入节点名称' },
    host: { value: '', label: '目标地址', placeholder: '请输入目标IP地址或域名', help: '请配置目标服务器的IP地址' },
    port: { value: 8080, label: '目标端口', type: 'number', min: 1, max: 65535, placeholder: '请输入目标端口(1-65535)', help: '请配置目标服务器的端口' },
    timeout: { value: 30000, label: '超时时间(ms)', type: 'number', min: 0, placeholder: '连接超时时间' },
    encoding: { value: 'utf8', label: '数据编码', type: 'select', options: [
      { value: 'utf8', label: 'UTF-8' }, { value: 'ascii', label: 'ASCII' }, { value: 'hex', label: 'HEX' }, { value: 'base64', label: 'Base64' }
    ]}
  },
  inputs: 1,
  outputs: 0,
  icon: '/images/tcp.svg',
  color: '#69b1ff',
  formLayout: [
    { section: '目标配置', fields: ['name', 'host', 'port', 'timeout'] },
    { section: '数据配置', fields: ['encoding'], collapsible: true, collapsed: true }
  ]
};

export default tcpInNodeForm;
