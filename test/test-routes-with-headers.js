// 带正确 headers 的路由测试脚本
const http = require('http');

function testRoute(url, description) {
  return new Promise((resolve) => {
    console.log(`\n测试: ${description}`);
    console.log(`URL: ${url}`);

    const options = {
      hostname: 'localhost',
      port: 9300,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'curl/8.7.1',
        'Accept': '*/*',
      },
    };

    const req = http.request(options, (res) => {
      console.log(`HTTP 状态码: ${res.statusCode}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);

      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const hasAppDiv = body.includes('<div id="app"></div>');
        const hasMainJs = body.includes('/src/main.js');
        const hasViteClient = body.includes('/@vite/client');

        console.log(`页面大小: ${body.length} bytes`);
        console.log(`包含 app 挂载点: ${hasAppDiv ? '是' : '否'}`);
        console.log(`包含 main.js: ${hasMainJs ? '是' : '否'}`);
        console.log(`包含 Vite 客户端: ${hasViteClient ? '是' : '否'}`);

        resolve({
          description,
          url,
          statusCode: res.statusCode,
          hasAppDiv,
          hasMainJs,
          hasViteClient,
          success: res.statusCode === 200 && hasAppDiv && hasMainJs,
        });
      });
    });

    req.on('error', (error) => {
      console.error(`请求错误: ${error.message}`);
      resolve({ description, error: error.message, success: false });
    });

    req.end();
  });
}

async function main() {
  console.log('=== 前端路由 HTTP 状态码测试 ===');
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));

  const results = [];

  results.push(await testRoute('http://localhost:9300/', '根路由'));
  results.push(await testRoute('http://localhost:9300/#/topology-display', '拓扑展示'));
  results.push(await testRoute('http://localhost:9300/#/topology-display/detail', '节点详情'));
  results.push(await testRoute('http://localhost:9300/#/packet-config', '报文配置'));

  console.log('\n========================================');
  console.log('测试结果汇总');
  console.log('========================================');

  results.forEach((result) => {
    if (result.error) {
      console.log(`❌ ${result.description}: 失败 (${result.error})`);
    } else if (result.success) {
      console.log(`✅ ${result.description}: 成功 (HTTP ${result.statusCode})`);
    } else {
      console.log(`⚠️  ${result.description}: 部分成功 (HTTP ${result.statusCode})`);
    }
  });

  console.log('\n注意:');
  console.log('1. Vue Router 使用 hash 模式，所有路由返回相同的 HTML');
  console.log('2. 实际路由由 JavaScript 在客户端处理');
  console.log('3. JavaScript 错误需要在浏览器控制台查看');
}

main().catch(console.error);
