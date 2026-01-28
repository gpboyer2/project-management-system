/**
 * 图标路径测试
 * 验证 Unicode 符号和 FontAwesome 图标的显示逻辑
 */

// 测试数据
const testIcons = [
  // Unicode 符号
  '📡', '🐛', '✅', '⚠️', '📊', '💬',
  '⚙️', '🔀', '🔄', '📏', '📝', '⏱️',
  '🎯', '🔍', '🌐', '🔌', '📄', '📖', '👁️',

  // FontAwesome 图标类名
  'cog', 'wrench', 'check', 'times', 'plus', 'minus',
  'globe', 'search', 'filter', 'save', 'upload', 'download'
];

// 判断是否为 FontAwesome 图标类名
function isFontAwesomeIcon(icon) {
  if (!icon) return false;

  // 常见的 FontAwesome 图标类名列表
  const faIcons = [
    'cog', 'cogs', 'gear', 'wrench', 'check', 'times', 'plus', 'minus',
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'home', 'user', 'users', 'clock', 'calendar', 'star',
    'heart', 'search', 'filter', 'edit', 'trash', 'save',
    'upload', 'download', 'refresh', 'play', 'pause', 'stop',
    'database', 'server', 'cloud', 'globe', 'link', 'unlink',
    'lock', 'unlock', 'key', 'eye', 'eye-slash', 'info',
    'question', 'exclamation', 'warning', 'check-circle', 'times-circle',
    'signal', 'wifi', 'bluetooth', 'usb', 'battery', 'plug'
  ];

  return faIcons.includes(icon) || icon.startsWith('fa-');
}

// 测试函数
function testIconsList() {
  console.log('图标测试开始...');

  testIcons.forEach(icon => {
    const isFA = isFontAwesomeIcon(icon);
    const shouldUseUnicode = !isFA;

    console.log(`图标 "${icon}":`);
    console.log(`  - 是否为 FontAwesome: ${isFA}`);
    console.log(`  - 使用 Unicode 符号: ${shouldUseUnicode}`);
    console.log(`  - HTML 元素: ${isFA ? `<i class="fa fa-${icon}"></i>` : `<span class="emoji-icon">${icon}</span>`}`);
    console.log('---');
  });

  console.log(`总计: ${testIcons.length} 个图标`);
  console.log('图标测试完成');
}

// 如果在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testIconsList, isFontAwesomeIcon };

  // 直接运行测试
  testIconsList();
}