/**
 * 节点配置表单统一导出
 * 用于管理所有节点的配置表单定义
 */

import { tcpInNodeForm, tcpOutNodeForm } from './tcp-node-form';
import { udpInNodeForm, udpOutNodeForm } from './udp-node-form';
import serialNodeForm from './serial-node-form';
import parseNodeForm from './parse-node-form';
import serializeNodeForm from './serialize-node-form';

// 表单配置映射表
const nodeFormMap = {
  'tcp-in-node': tcpInNodeForm,
  'tcp-out-node': tcpOutNodeForm,
  'udp-in-node': udpInNodeForm,
  'udp-out-node': udpOutNodeForm,
  'serial-node': serialNodeForm,
  'parse-node': parseNodeForm,
  'serialize-node': serializeNodeForm
};

/**
 * 根据节点类型获取表单配置
 * @param {string} nodeType - 节点类型
 * @returns {Object|null} 表单配置对象
 */
export function getNodeForm(nodeType) {
  return nodeFormMap[nodeType] || null;
}

/**
 * 获取所有表单配置
 * @returns {Object} 所有表单配置的映射对象
 */
export function getAllNodeForms() {
  return nodeFormMap;
}

/**
 * 检查节点类型是否有表单配置
 * @param {string} nodeType - 节点类型
 * @returns {boolean} 是否存在表单配置
 */
export function hasNodeForm(nodeType) {
  return nodeType in nodeFormMap;
}

/**
 * 根据分类获取表单配置列表
 * @param {string} category - 节点分类
 * @returns {Array} 表单配置数组
 */
export function getNodeFormsByCategory(category) {
  return Object.values(nodeFormMap).filter(form => form.category === category);
}

// 默认导出
export default {
  getNodeForm,
  getAllNodeForms,
  hasNodeForm,
  getNodeFormsByCategory,
  // 直接导出各个表单配置
  tcpInNodeForm,
  tcpOutNodeForm,
  udpInNodeForm,
  udpOutNodeForm,
  serialNodeForm,
  parseNodeForm,
  serializeNodeForm
};
