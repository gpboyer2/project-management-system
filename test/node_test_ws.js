/**
 * 样式验证测试
 * 使用 Chrome DevTools Protocol 验证前端样式是否正确加载
 */

const { createChromeSession, reloadPage, evaluateScript } = require('./utils/chrome-devtools');

async function verifyStyles() {
  console.log('=== 开始样式验证 ===\n');

  await createChromeSession(async (ws) => {
    // 刷新页面加载新样式
    console.log('刷新页面...');
    await reloadPage(ws, true);

    // 等待额外时间确保样式完全加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 执行样式检查
    console.log('检查样式组件...\n');
    const result = await evaluateScript(ws, `
      (function() {
        const getStyle = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            exists: true,
            bgColor: s.backgroundColor,
            color: s.color,
            padding: s.padding
          };
        };

        return {
          ideHeader: getStyle('.ide-header'),
          ideFooter: getStyle('.ide-footer'),
          ideExplorer: getStyle('.ide-explorer'),
          ideTabs: getStyle('.ide-tabs'),
          tabWorkbench: getStyle('.tab-workbench'),
          treeNode: getStyle('.tree-node'),
          buildModal: !!document.querySelector('.ide-build-modal-overlay'),
          allComponents: {
            ideHeader: !!document.querySelector('.ide-header'),
            ideFooter: !!document.querySelector('.ide-footer'),
            ideExplorer: !!document.querySelector('.ide-explorer'),
            ideTabs: !!document.querySelector('.ide-tabs'),
            treeNode: !!document.querySelector('.tree-node')
          }
        };
      })()
    `);

    // 输出结果
    console.log('【组件存在性】');
    for (const [key, val] of Object.entries(result.allComponents || {})) {
      console.log('  ' + (val ? '✓' : '✗') + ' ' + key);
    }

    console.log('\n【ide-header 样式】');
    if (result.ideHeader) {
      console.log('  背景色: ' + result.ideHeader.bgColor);
      console.log('  存在: ' + result.ideHeader.exists);
    } else {
      console.log('  ✗ 未找到');
    }

    console.log('\n【ide-footer 样式】');
    if (result.ideFooter) {
      console.log('  背景色: ' + result.ideFooter.bgColor);
      console.log('  存在: ' + result.ideFooter.exists);
    } else {
      console.log('  ✗ 未找到');
    }

    console.log('\n【ide-explorer 样式】');
    if (result.ideExplorer) {
      console.log('  背景色: ' + result.ideExplorer.bgColor);
      console.log('  存在: ' + result.ideExplorer.exists);
    } else {
      console.log('  ✗ 未找到');
    }

    console.log('\n【ide-tabs 样式】');
    if (result.ideTabs) {
      console.log('  背景色: ' + result.ideTabs.bgColor);
      console.log('  存在: ' + result.ideTabs.exists);
    } else {
      console.log('  ✗ 未找到');
    }

    // 汇总结果
    const allPassed = Object.values(result.allComponents || {}).every(v => v === true);
    console.log('\n' + (allPassed ? '✓ 所有新样式组件已正确渲染！' : '✗ 部分组件未正确渲染'));
  });

  console.log('\n=== 验证完成 ===');
}

// 执行验证
verifyStyles().catch(err => {
  console.error('验证失败:', err.message);
  process.exit(1);
});
