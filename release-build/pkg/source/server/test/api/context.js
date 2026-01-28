/**
 * 测试全局上下文
 * 管理测试过程中的共享状态
 */

const { ApiClient } = require('./lib/api-client');
const DataTracker = require('./utils/data-tracker');

/**
 * 全局上下文类
 */
class TestContext {
  constructor() {
    this.apiClient = null;
    this.dataTracker = null;
    this.adminToken = null;
    this.testData = {};
  }

  /**
   * 初始化上下文
   */
  initialize(apiClient, dataTracker) {
    this.apiClient = apiClient;
    this.dataTracker = dataTracker;
  }

  /**
   * 获取共享的 API 客户端实例
   */
  getApiClient() {
    if (!this.apiClient) {
      throw new Error('ApiClient 未初始化，请确保测试正确运行');
    }
    return this.apiClient;
  }

  /**
   * 获取共享的数据追踪器实例
   */
  getDataTracker() {
    if (!this.dataTracker) {
      throw new Error('DataTracker 未初始化，请确保测试正确运行');
    }
    return this.dataTracker;
  }

  /**
   * 创建新的 API 客户端实例（用于测试无token访问等场景）
   */
  createApiClient() {
    const client = new ApiClient();
    // 在测试环境中禁用自动清除token
    client.setAutoClearToken(false);
    return client;
  }

  /**
   * 设置管理员 token
   */
  setAdminToken(token) {
    this.adminToken = token;
    if (this.apiClient) {
      this.apiClient.setToken(token);
    }
  }

  /**
   * 获取管理员 token
   */
  getAdminToken() {
    return this.adminToken;
  }

  /**
   * 保存测试数据
   */
  setTestData(key, value) {
    this.testData[key] = value;
  }

  /**
   * 获取测试数据
   */
  getTestData(key) {
    return this.testData[key];
  }

  /**
   * 清除测试数据
   */
  clearTestData() {
    this.testData = {};
  }

  /**
   * 重置上下文
   */
  reset() {
    this.adminToken = null;
    this.clearTestData();
  }
}

// 创建全局单例实例
const globalContext = new TestContext();

module.exports = {
  TestContext,
  ApiClient,
  getContext: () => globalContext,
  getApiClient: () => globalContext.getApiClient(),
  getDataTracker: () => globalContext.getDataTracker(),
  createApiClient: () => globalContext.createApiClient(),
  setAdminToken: (token) => globalContext.setAdminToken(token),
  getAdminToken: () => globalContext.getAdminToken(),
  setTestData: (key, value) => globalContext.setTestData(key, value),
  getTestData: (key) => globalContext.getTestData(key)
};
