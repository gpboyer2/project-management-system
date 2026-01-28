// 测试前端路由的 HTTP 状态码和基本加载情况
const http = require('http');
const { URL } = require('url');

const routes = [
  'http://localhost:9300/',
  'http://localhost:9300/#/topology-display',
  'http://localhost:9300/#/topology-display/detail',
  'http://localhost:9300/#/packet-config',
];

async function checkRoute(url) {
  return new Promise((resolve) => {
    // 对于 hash 路由，我们只检查基础 URL
    const baseUrl = url.split('#')[0];
    const urlObj = new URL(baseUrl);

    const options = {
      method: 'GET',
      timeout: 5000,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.path,
    };

    const req = http.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // 检查页面内容
        const hasAppDiv = data.includes('<div id="app"></div>');
        const hasMainJs = data.includes('/src/main.js');
        const hasViteClient = data.includes('/@vite/client');

        resolve({
          url,
          status: res.statusCode,
          hasAppDiv,
          hasMainJs,
          hasViteClient,
          success: res.statusCode === 200 && hasAppDiv && hasMainJs,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message,
        success: false,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false,
      });
    });
  });
}

async function testAllRoutes() {
  console.log('开始测试前端路由...\n');

  for (const route of routes) {
    const result = await checkRoute(route);

    console.log(`测试路由: ${result.url}`);
    console.log(`  HTTP 状态码: ${result.status}`);
    console.log(`  页面加载: ${result.success ? '成功' : '失败'}`);

    if (result.error) {
      console.log(`  错误信息: ${result.error}`);
    }

    if (result.hasAppDiv !== undefined) {
      console.log(`  包含 app 挂载点: ${result.hasAppDiv ? '是' : '否'}`);
      console.log(`  包含 main.js: ${result.hasMainJs ? '是' : '否'}`);
      console.log(`  包含 Vite 客户端: ${result.hasViteClient ? '是' : '否'}`);
    }

    console.log('');
  }

  console.log('测试完成！');
  console.log('\n注意：');
  console.log('1. Vue Router 使用 hash 模式，所有路由都会返回相同的 HTML');
  console.log('2. 实际的路由切换由 JavaScript 在客户端完成');
  console.log('3. 要检测 JavaScript 错误，需要在浏览器控制台中查看');
}

testAllRoutes().catch(console.error);
