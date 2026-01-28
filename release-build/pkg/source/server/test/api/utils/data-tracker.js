/**
 * 数据追踪器
 * 记录测试过程中创建的所有数据
 *
 * 使用方式：track(deleteUrl, data)
 * dataTracker.track('/hierarchy/hierarchy-nodes/123', { name: '测试节点' })
 * dataTracker.track('/roles/delete', { id: 456, name: '测试角色' })
 */

class DataTracker {
  constructor() {
    this.currentSession = null;
    this.trackedData = [];
  }

  /**
   * 开始新的测试会话
   */
  startSession() {
    const timestamp = Date.now();
    this.currentSession = `test-${timestamp}`;
    this.trackedData = [];

    console.log(`[数据追踪] 开始新的测试会话: ${this.currentSession}`);
    return this.currentSession;
  }

  /**
   * 记录创建的数据
   * @param {string} deleteUrl - 删除 API 完整路径
   * @param {object} data - 数据信息
   */
  track(deleteUrl, data = {}) {
    if (!this.currentSession) {
      console.warn('[数据追踪] 未启动测试会话，数据未被追踪');
      return;
    }

    this.trackedData.push({
      deleteUrl,
      data,
      testId: this.currentSession,
      createdAt: Date.now()
    });

    console.log(`[数据追踪] 记录数据: ${deleteUrl}`);
  }

  /**
   * 获取所有测试数据
   */
  getAll() {
    return this.trackedData;
  }

  /**
   * 统计追踪的数据数量
   */
  getCount() {
    return this.trackedData.length;
  }

  /**
   * 清空追踪记录
   */
  clear() {
    this.trackedData = [];
    console.log('[数据追踪] 已清空所有追踪记录');
  }

  /**
   * 获取当前 testId
   */
  getTestId() {
    return this.currentSession;
  }

  /**
   * 打印追踪摘要
   */
  printSummary() {
    console.log('\n[数据追踪摘要]');
    console.log(`测试 ID: ${this.currentSession}`);
    console.log(`总计追踪: ${this.getCount()} 条数据`);
    console.log('');
  }
}

module.exports = DataTracker;
