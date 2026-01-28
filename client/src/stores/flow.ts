import { defineStore } from 'pinia';
import { ElMessage } from 'element-plus';

/**
 *
 * LogicFlow 流程图状态管理
 *
 */
export const useFlowStore = defineStore('flow', {
  state: () => ({
    flowData: null as any,
    selectedNodes: [] as string[],
    selectedEdges: [] as string[],
    clipboard: null as any,
    history: [] as any[],
    historyIndex: -1 as number,
    isDirty: false as boolean,
  }),

  getters: {
    hasSelection: (state) =>
      state.selectedNodes.length > 0 || state.selectedEdges.length > 0,
    canUndo: (state) => state.historyIndex > 0,
    canRedo: (state) => state.historyIndex < state.history.length - 1,
  },

  actions: {
    /**
     * 设置流程图数据
     * @param {any} data - 流程图数据
     * @returns {void}
     */
    setFlowData(data: any) {
      this.flowData = data;
      this.isDirty = true;
    },

    /**
     * 选中的节点列表
     * @param {string[]} nodeIds - 节点ID数组
     * @returns {void}
     */
    selectNodes(nodeIds: string[]) {
      this.selectedNodes = nodeIds;
    },

    /**
     * 选中的边列表
     * @param {string[]} edgeIds - 边ID数组
     * @returns {void}
     */
    selectEdges(edgeIds: string[]) {
      this.selectedEdges = edgeIds;
    },

    /**
     * 清除所有选中内容
     * @returns {void}
     */
    clearSelection() {
      this.selectedNodes = [];
      this.selectedEdges = [];
    },

    /**
     * 复制当前选中的节点和边
     * @returns {void}
     */
    copySelection() {
      if (this.hasSelection) {
        this.clipboard = {
          nodes: this.selectedNodes,
          edges: this.selectedEdges,
          timestamp: Date.now()
        };
        ElMessage.info('已复制选中内容');
      }
    },

    /**
     * 粘贴剪贴板内容
     * @returns {any} 剪贴板数据
     */
    paste() {
      if (this.clipboard) {
        // 这里会触发LogicFlow的粘贴操作
        ElMessage.info('执行粘贴操作');
        return this.clipboard;
      }
    },

    /**
     * 添加操作到历史记录
     * @param {any} action - 操作对象
     * @returns {void}
     */
    addToHistory(action: any) {
      // 移除当前位置之后的历史记录
      this.history = this.history.slice(0, this.historyIndex + 1);

      // 添加新的历史记录
      this.history.push({
        ...action,
        timestamp: Date.now()
      });

      this.historyIndex++;
      this.isDirty = true;

      // 限制历史记录数量
      if (this.history.length > 50) {
        this.history.shift();
        this.historyIndex--;
      }
    },

    /**
     * 撤销操作
     * @returns {any} 被撤销的操作对象
     */
    undo() {
      if (this.canUndo) {
        this.historyIndex--;
        const action = this.history[this.historyIndex];
        ElMessage.info(`撤销操作: ${JSON.stringify(action)}`);
        return action;
      }
    },

    /**
     * 重做操作
     * @returns {any} 被重做的操作对象
     */
    redo() {
      if (this.canRedo) {
        this.historyIndex++;
        const action = this.history[this.historyIndex];
        ElMessage.info(`重做操作: ${JSON.stringify(action)}`);
        return action;
      }
    },

    /**
     * 标记为已保存状态
     * @returns {void}
     */
    markAsClean() {
      this.isDirty = false;
    },

    /**
     * 重置所有状态
     * @returns {void}
     */
    reset() {
      this.flowData = null;
      this.selectedNodes = [];
      this.selectedEdges = [];
      this.clipboard = null;
      this.history = [];
      this.historyIndex = -1;
      this.isDirty = false;
    },
  },

  persist: {
    key: 'flow-store',
  }
});