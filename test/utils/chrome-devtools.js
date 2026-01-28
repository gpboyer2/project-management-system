/**
 * Chrome DevTools Protocol 测试工具
 * 提供与 Chrome 远程调试端口交互的通用功能
 */

const WebSocket = require('ws');
const http = require('http');

/**
 * Chrome DevTools 连接配置
 */
const CHROME_CONFIG = {
  httpUrl: '127.0.0.1',
  httpPort: 9222,
  targetUrl: 'localhost:9300',
  timeout: 12000,
};

/**
 * 获取可用的 Chrome 标签页 WebSocket URL
 * @returns {Promise<string|null>} WebSocket URL 或 null
 */
async function getChromeWebSocketUrl() {
  return new Promise((resolve) => {
    http.get(`http://${CHROME_CONFIG.httpUrl}:${CHROME_CONFIG.httpPort}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          const tab = tabs.find(t => t.type === 'page' && t.url.includes(CHROME_CONFIG.targetUrl));
          resolve(tab ? tab.webSocketDebuggerUrl : null);
        } catch (e) {
          console.error('解析 Chrome 标签页信息失败:', e.message);
          resolve(null);
        }
      });
    }).on('error', () => {
      console.error(`无法连接到 Chrome DevTools (${CHROME_CONFIG.httpUrl}:${CHROME_CONFIG.httpPort})`);
      console.error('请确保 Chrome 以远程调试模式启动:');
      console.error('  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
      resolve(null);
    });
  });
}

/**
 * 执行 Chrome DevTools 命令并等待结果
 * @param {Object} ws - WebSocket 连接
 * @param {number} id - 命令 ID
 * @param {string} method - DevTools 方法名
 * @param {Object} params - 方法参数
 * @returns {Promise<Object>} 命令执行结果
 */
function executeCommand(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageHandler = (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.id === id) {
          ws.removeListener('message', messageHandler);
          if (data.error) {
            reject(new Error(data.error.message));
          } else {
            resolve(data.result);
          }
        }
      } catch (e) {
        ws.removeListener('message', messageHandler);
        reject(e);
      }
    };

    ws.on('message', messageHandler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

/**
 * 等待页面加载完成事件
 * @param {Object} ws - WebSocket 连接
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<void>}
 */
function waitForPageLoad(ws, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const messageHandler = (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.method === 'Page.loadEventFired') {
          ws.removeListener('message', messageHandler);
          resolve();
        }
      } catch (e) {
        // 忽略解析错误
      }
    };

    ws.on('message', messageHandler);

    setTimeout(() => {
      ws.removeListener('message', messageHandler);
      reject(new Error('页面加载超时'));
    }, timeout);
  });
}

/**
 * 在页面上下文中执行 JavaScript 代码
 * @param {Object} ws - WebSocket 连接
 * @param {string} expression - JavaScript 表达式
 * @param {boolean} returnByValue - 是否返回值而非远程对象
 * @returns {Promise<any>} 执行结果
 */
async function evaluateScript(ws, expression, returnByValue = true) {
  await executeCommand(ws, Date.now(), 'Runtime.enable');
  return await executeCommand(ws, Date.now() + 1, 'Runtime.evaluate', {
    expression,
    returnByValue,
  });
}

/**
 * 刷新页面并等待加载完成
 * @param {Object} ws - WebSocket 连接
 * @param {boolean} ignoreCache - 是否忽略缓存
 * @returns {Promise<void>}
 */
async function reloadPage(ws, ignoreCache = true) {
  await executeCommand(ws, Date.now(), 'Page.enable');
  await executeCommand(ws, Date.now() + 1, 'Page.reload', { ignoreCache });
  await waitForPageLoad(ws);
}

/**
 * 导航到指定 URL
 * @param {Object} ws - WebSocket 连接
 * @param {string} url - 目标 URL
 * @returns {Promise<void>}
 */
async function navigateTo(ws, url) {
  await executeCommand(ws, Date.now(), 'Page.enable');
  await executeCommand(ws, Date.now() + 1, 'Page.navigate', { url });
  await waitForPageLoad(ws);
}

/**
 * 创建 Chrome DevTools 会话
 * @param {Function} callback - 会话回调函数，接收 ws 对象作为参数
 * @returns {Promise<void>}
 */
async function createChromeSession(callback) {
  const wsUrl = await getChromeWebSocketUrl();

  if (!wsUrl) {
    throw new Error('无法获取 Chrome WebSocket URL');
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket 连接超时'));
    }, CHROME_CONFIG.timeout);

    ws.on('open', async () => {
      clearTimeout(timeout);
      try {
        await callback(ws);
        ws.close();
        resolve();
      } catch (e) {
        ws.close();
        reject(e);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

module.exports = {
  CHROME_CONFIG,
  getChromeWebSocketUrl,
  executeCommand,
  waitForPageLoad,
  evaluateScript,
  reloadPage,
  navigateTo,
  createChromeSession,
};
