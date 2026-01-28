/**
 * 协议接口模块统一导出
 * @module protocol-interface
 * @description 提供 Composable、类型定义和组件的统一导出
 */

// Composables 导出
export { useInterfacePacketRefs } from './composables/useInterfacePacketRefs';
export { useInterfaceVersionControl } from './composables/useInterfaceVersionControl';
export { useInterfaceDraft } from './composables/useInterfaceDraft';

// 类型导出
export type { PacketField, PacketData, EditStatus } from './types';

// 组件导出
export { default as AddPacketDialog } from './components/add-packet-dialog/index.vue';
