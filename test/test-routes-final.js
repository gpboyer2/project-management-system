// 前端路由测试最终报告
// 使用 Node.js HTTP 模块测试 Vue Router hash 模式路由

const http = require('http');

// 测试配置
const config = {
  baseUrl: 'http://localhost:9300',
  timeout: 5000,
  retries: 3,
};

// 路由列表
const routes = [
  {
    path: '/#/topology-display',
    name: '拓扑展示',
    description: '显示系统拓扑结构',
  },
  {
    path: '/#/topology-display/detail',
    name: '节点详情',
    description: '显示节点详细信息',
  },
  {
    path: '/#/packet-config',
    name: '报文配置',
    description: '配置报文结构',
  },
];

// 测试单个路由
async function testRoute(route) {
  const url = `${config.baseUrl}/`; // hash 路由都返回相同的 HTML

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 9300,
      path: '/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RouteTest/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        // 检查关键元素
        const checks = {
          statusCode: res.statusCode,
          isHtml: res.headers['content-type']?.includes('text/html'),
          hasAppDiv: body.includes('<div id="app"></div>'),
          hasMainJs: body.includes('/src/main.js'),
          hasViteClient: body.includes('/@vite/client'),
          hasHtmlStructure: body.includes('<!DOCTYPE html>'),
        };

        // 判断是否成功
        const success =
          checks.statusCode === 200 &&
          checks.isHtml &&
          checks.hasAppDiv &&
          checks.hasMainJs &&
          checks.hasViteClient &&
          checks.hasHtmlStructure;

        resolve({
          route: route.path,
          name: route.name,
          description: route.description,
          success,
          checks,
          error: success ? null : '页面加载失败',
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        route: route.path,
        name: route.name,
        description: route.description,
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        route: route.path,
        name: route.name,
        description: route.description,
        success: false,
        error: '请求超时',
      });
    });

    req.setTimeout(config.timeout);
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('\n========================================');
  console.log('     前端路由测试报告');
  console.log('========================================\n');

  console.log(`测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`服务器地址: ${config.baseUrl}`);
  console.log(`路由模式: Vue Router Hash 模式`);
  console.log(`测试路由数: ${routes.length}`);
  console.log('');

  const results = [];

  for (const route of routes) {
    console.log(`正在测试: ${route.name} (${route.path})`);
    const result = await testRoute(route);
    results.push(result);
  }

  // 打印详细结果
  console.log('\n========================================');
  console.log('     测试结果详情');
  console.log('========================================\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   路由路径: ${result.route}`);
    console.log(`   功能描述: ${result.description}`);

    if (result.success) {
      console.log(`   状态: ✅ 成功`);
      console.log(`   HTTP 状态码: ${result.checks.statusCode}`);
      console.log(`   Content-Type: ${result.checks.isHtml ? 'text/html' : '其他'}`);
      console.log(`   App 挂载点: ${result.checks.hasAppDiv ? '存在' : '不存在'}`);
      console.log(`   Main.js: ${result.checks.hasMainJs ? '已加载' : '未加载'}`);
      console.log(`   Vite 客户端: ${result.checks.hasViteClient ? '已加载' : '未加载'}`);
    } else {
      console.log(`   状态: ❌ 失败`);
      console.log(`   错误信息: ${result.error}`);
      if (result.checks) {
        console.log(`   HTTP 状态码: ${result.checks.statusCode}`);
      }
    }
    console.log('');
  });

  // 汇总统计
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log('========================================');
  console.log('     测试汇总');
  console.log('========================================\n');
  console.log(`总测试数: ${results.length}`);
  console.log(`成功: ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`失败: ${failCount} (${((failCount / results.length) * 100).toFixed(1)}%)`);
  console.log('');

  // 重要说明
  console.log('========================================');
  console.log('     重要说明');
  console.log('========================================\n');
  console.log('1. Vue Router Hash 模式特点:');
  console.log('   - 所有 hash 路由（#/xxx）都返回相同的 HTML');
  console.log('   - 实际路由切换由 JavaScript 在客户端完成');
  console.log('   - 服务器端只需返回 index.html\n');

  console.log('2. 本测试验证内容:');
  console.log('   - HTTP 响应状态码是否为 200');
  console.log('   - 是否返回正确的 HTML 内容');
  console.log('   - 是否包含 Vue app 挂载点');
  console.log('   - 是否正确加载 main.js 和 Vite 客户端\n');

  console.log('3. JavaScript 运行时错误检测:');
  console.log('   - HTTP 测试无法检测 JavaScript 运行时错误');
  console.log('   - 需要在浏览器控制台中查看');
  console.log('   - 建议使用 Chrome DevTools 或 Firefox 开发者工具\n');

  console.log('4. 推荐的进一步测试:');
  console.log('   - 在浏览器中手动访问每个路由');
  console.log('   - 检查浏览器控制台是否有错误或警告');
  console.log('   - 验证页面功能是否正常工作');
  console.log('   - 检查网络请求是否成功\n');

  // 返回退出码
  const exitCode = failCount > 0 ? 1 : 0;
  process.exit(exitCode);
}

// 运行测试
runTests().catch((error) => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
