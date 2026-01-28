// 简化版路由测试脚本
const http = require('http');

function testRoute(url) {
  return new Promise((resolve) => {
    console.log(`\n测试: ${url}`);

    const options = {
      hostname: 'localhost',
      port: 9300,
      path: '/',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头:`, JSON.stringify(res.headers, null, 2));

      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`响应体长度: ${body.length} bytes`);
        console.log(`响应体预览: ${body.substring(0, 200)}`);
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      console.error(`请求错误: ${error.message}`);
      resolve({ error: error.message });
    });

    req.end();
  });
}

async function main() {
  console.log('=== 前端路由测试 ===');
  await testRoute('http://localhost:9300/');
}

main();
