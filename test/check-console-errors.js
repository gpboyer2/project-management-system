#!/usr/bin/env node

/**
 * 通过 Chrome DevTools Protocol 检查前端路由控制台错误
 * 使用方法: node check-console-errors.js
 */

const http = require('http');
const WebSocket = require('ws').default || require('ws');

// 如果没有 ws 模块，尝试使用内置的 WebSocket
if (!WebSocket) {
  try {
    const { WebSocket: NativeWS } = require('ws');
    global.WebSocket = NativeWS;
  } catch (e) {
    console.error('需要 ws 模块，请运行: npm install ws');
    process.exit(1);
  }
}

// 路由列表
const ROUTES = [
  { path: '/', name: '欢迎页' },
  { path: '/editor/ide/dashboard', name: '仪表板' },
  { path: '/editor/ide/node/list', name: '通信节点' },
  { path: '/editor/ide/interface/list', name: '通信接口' },
  { path: '/editor/ide/logic/list', name: '逻辑节点' },
  { path: '/editor/ide/icd/list', name: 'ICD配置' },
  { path: '/editor/ide/packet/list', name: '报文列表' },
  { path: '/login', name: '登录页' },
  { path: '/topology-display', name: '拓扑展示' },
  { path: '/topology-display/detail', name: '节点详情' },
  { path: '/flowchart', name: '流程图' },
  { path: '/packet-config', name: '报文配置' },
  { path: '/user', name: '用户管理' },
  { path: '/user/detail', name: '用户详情' },
  { path: '/settings', name: '系统设置' },
  { path: '/hierarchy-settings', name: '体系层级配置' },
  { path: '/database-manager', name: '数据管理' },
];

const CDP_PORT = 9222;
let messageId = 1;

// 获取 Chrome 页面的 WebSocket URL
async function getChromePageUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CDP_PORT}/json/list`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const pages = JSON.parse(data);
          // 查找 localhost:9300 的页面
          const targetPage = pages.find(p => p.url.includes('localhost:9300'));
          if (targetPage) {
            resolve(targetPage.webSocketDebuggerUrl);
          } else {
            reject(new Error('未找到 localhost:9300 页面，请先在浏览器中打开'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 连接到 CDP 并执行命令
async function executeCDPCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id: messageId++, method, params });
    ws.send(msg);

    const handler = (data) => {
      const response = JSON.parse(data);
      if (response.id === messageId - 1) {
        ws.off('message', handler);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      }
    };

    ws.on('message', handler);
  });
}

// 等待指定时间
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 收集控制台消息
async function collectConsoleMessages(ws, duration = 2000) {
  const messages = [];

  // 启用 Log 领域
  try {
    await executeCDPCommand(ws, 'Log.enable');
  } catch (e) {
    // Log 可能已经启用
  }

  // 启用 Runtime 领域以监听 console API
  try {
    await executeCDPCommand(ws, 'Runtime.enable');
  } catch (e) {
    // Runtime 可能已经启用
  }

  const handler = (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      messages.push({
        type: msg.params.type,
        args: msg.params.args.map(arg => arg.value),
        timestamp: msg.params.timestamp
      });
    }
    if (msg.method === 'Log.entryAdded') {
      messages.push({
        type: 'log',
        entry: msg.params.entry,
        timestamp: Date.now()
      });
    }
  };

  ws.on('message', handler);

  await wait(duration);

  ws.off('message', handler);

  return messages;
}

// 导航到指定路由并收集错误
async function testRoute(ws, route) {
  const url = `http://localhost:9300/#${route.path}`;

  // 导航到目标页面
  try {
    await executeCDPCommand(ws, 'Page.navigate', { url });
  } catch (e) {
    // Page 领域可能未启用，尝试启用
    await executeCDPCommand(ws, 'Page.enable');
    await executeCDPCommand(ws, 'Page.navigate', { url });
  }

  // 等待页面加载
  await wait(2500);

  // 清空之前的控制台消息
  // 通过执行 JavaScript 清空
  try {
    await executeCDPCommand(ws, 'Runtime.evaluate', {
      expression: 'console.clear()'
    });
  } catch (e) {
    // 忽略
  }

  // 再次导航确保干净的状态
  await executeCDPCommand(ws, 'Page.navigate', { url });
  await wait(3000);

  // 获取控制台日志
  const logs = await collectConsoleMessages(ws, 1000);

  // 检查是否有错误
  const errors = [];
  const warnings = [];

  logs.forEach(log => {
    const text = typeof log.args === 'string' ? log.args :
                 Array.isArray(log.args) ? log.args.join(' ') :
                 log.entry?.entryText || JSON.stringify(log);

    // 过滤路由日志（正常）
    if (text.includes('[路由 #') || text.includes('🚀 开始') || text.includes('✅ 完成')) {
      return;
    }

    // 过滤 Vite 日志
    if (text.includes('[vite]') || text.includes('connect ')) {
      return;
    }

    // 过滤请求已取消的错误（正常情况，组件卸载或重复请求导致）
    if (text.includes('请求已取消') || text.includes('CanceledError') ||
        text.includes('ERR_CANCELED') || text.includes('component may have been unmounted')) {
      return;
    }

    // 检查错误
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('uncaught') ||
        text.includes('TypeError') || text.includes('ReferenceError') ||
        text.includes('SyntaxError') || text.includes('NetworkError')) {
      errors.push(text);
    }

    // 检查警告
    if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('warn')) {
      warnings.push(text);
    }
  });

  // 检查页面中的错误元素
  try {
    const result = await executeCDPCommand(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const errors = [];
          // 检查是否有明显的错误提示
          const errorElements = document.querySelectorAll('.el-message--error, .error, [class*="error"]');
          errorElements.forEach(el => {
            if (el.textContent && el.textContent.trim()) {
              errors.push(el.textContent.trim());
            }
          });
          return errors;
        })()
      `,
      returnByValue: true
    });
    if (result.result && result.result.value) {
      result.result.value.forEach(err => errors.push(err));
    }
  } catch (e) {
    // 忽略
  }

  return {
    route: route.name,
    path: route.path,
    url,
    errors,
    warnings,
    logCount: logs.length
  };
}

// 主函数
async function main() {
  console.log('连接到 Chrome DevTools...\n');

  let wsUrl;
  try {
    wsUrl = await getChromePageUrl();
  } catch (e) {
    console.error('错误:', e.message);
    console.log('\n请确保：');
    console.log('1. Chrome 浏览器正在运行');
    console.log('2. 使用远程调试模式启动: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
    console.log('3. 在浏览器中打开 http://localhost:9300');
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);

  ws.on('open', async () => {
    console.log('已连接到 Chrome\n');
    console.log('开始测试路由...\n');

    const results = [];

    for (const route of ROUTES) {
      process.stdout.write(`\r测试中: ${route.name} (${route.path})                     `);

      try {
        const result = await testRoute(ws, route);
        results.push(result);

        if (result.errors.length > 0) {
          console.log(`\r❌ ${route.name}: 发现 ${result.errors.length} 个错误`);
        } else if (result.warnings.length > 0) {
          console.log(`\r⚠️  ${route.name}: ${result.warnings.length} 个警告`);
        } else {
          console.log(`\r✅ ${route.name}: 正常`);
        }
      } catch (e) {
        results.push({
          route: route.name,
          path: route.path,
          errors: [`测试失败: ${e.message}`],
          warnings: [],
          logCount: 0
        });
        console.log(`\r❌ ${route.name}: 测试失败 - ${e.message}`);
      }
    }

    console.log('\n\n==================== 测试结果汇总 ====================\n');

    let totalErrors = 0;
    let totalWarnings = 0;

    results.forEach((r, i) => {
      if (r.errors.length > 0) {
        console.log(`❌ ${r.route} (/${r.path})`);
        r.errors.forEach(err => {
          console.log(`   - ${err}`);
          totalErrors++;
        });
        console.log('');
      } else if (r.warnings.length > 0) {
        console.log(`⚠️  ${r.route} (${r.path})`);
        r.warnings.forEach(warn => {
          console.log(`   - ${warn}`);
          totalWarnings++;
        });
        console.log('');
      }
    });

    console.log('=====================================================\n');
    console.log(`总计: ${results.length} 个路由, ${totalErrors} 个错误, ${totalWarnings} 个警告`);

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('\n所有路由测试通过，未发现控制台错误！');
    } else {
      console.log('\n发现问题的路由:');
      results.filter(r => r.errors.length > 0 || r.warnings.length > 0)
             .forEach(r => console.log(`  - ${r.route}: ${r.errors.length} 错误, ${r.warnings.length} 警告`));
    }

    ws.close();
    process.exit(totalErrors > 0 ? 1 : 0);
  });

  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err.message);
    process.exit(1);
  });
}

main().catch(console.error);
