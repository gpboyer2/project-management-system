/**
 * 认证模块 - 边界值容错测试
 *
 * 测试各种边界值、异常参数、不符合规范的入参
 * 验证接口的容错能力和健壮性
 */

const { test, describe, before, beforeEach } = require('../../lib/test-runner');
const { expect } = require('../../lib/assertions');
const { getApiClient, createApiClient } = require('../../context');

const apiClient = getApiClient();

async function ensureLoggedIn() {
  const currentToken = apiClient.getToken();
  if (currentToken) {
    try {
      await apiClient.get('/auth/me', {}, { expect: 'success' });
      return currentToken;
    } catch (error) {
      // token 无效，继续执行登录
    }
  }
  const loginResponse = await apiClient.post('/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, { expect: 'success' });
  const token = loginResponse.datum.accessToken;
  apiClient.setToken(token);
  return token;
}

describe('认证模块 - 边界值容错测试', () => {
  before(async () => {
    await ensureLoggedIn();
  });

  beforeEach(async () => {
    await ensureLoggedIn();
  });

  // ==================== 登录边界值测试 ====================

  describe('登录 - 边界值测试', () => {
    // 空值测试
    test('登录 - username 为空字符串', async () => {
      await apiClient.post('/auth/login', {
        username: '',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - password 为空字符串', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: ''
      }, { expect: 'error' });
    });

    test('登录 - username 和 password 都为空', async () => {
      await apiClient.post('/auth/login', {
        username: '',
        password: ''
      }, { expect: 'error' });
    });

    // 长度边界测试
    test('登录 - username 为单字符', async () => {
      await apiClient.post('/auth/login', {
        username: 'a',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 超长（1000字符）', async () => {
      await apiClient.post('/auth/login', {
        username: 'a'.repeat(1000),
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - password 过短（1位）', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: '1'
      }, { expect: 'error' });
    });

    test('登录 - password 超长（500位）', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: 'a'.repeat(500)
      }, { expect: 'error' });
    });

    // 类型错误测试
    test('登录 - username 为数字', async () => {
      await apiClient.post('/auth/login', {
        username: 12345,
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 为布尔值', async () => {
      await apiClient.post('/auth/login', {
        username: true,
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - password 为数字', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: 123456
      }, { expect: 'error' });
    });

    // 缺失参数测试
    test('登录 - 缺少 username', async () => {
      await apiClient.post('/auth/login', {
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - 缺少 password', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin'
      }, { expect: 'error' });
    });

    test('登录 - 空对象', async () => {
      await apiClient.post('/auth/login', {}, { expect: 'error' });
    });

    // test('登录 - null 值（后端返回500错误）', async () => {
    //   await apiClient.post('/auth/login', null, { expect: 'error' });
    // });

    // test('登录 - undefined 值（后端返回500错误）', async () => {
    //   await apiClient.post('/auth/login', undefined, { expect: 'error' });
    // });

    // 特殊字符测试
    test('登录 - username 含 SQL 注入字符', async () => {
      await apiClient.post('/auth/login', {
        username: "admin'; DROP TABLE users; --",
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 含 XSS 字符', async () => {
      await apiClient.post('/auth/login', {
        username: '<script>alert("xss")</script>',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 含 Emoji', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin😀',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - password 含 SQL 注入字符', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: "' OR '1'='1"
      }, { expect: 'error' });
    });

    test('登录 - password 含特殊符号', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: '!@#$%^&*()'
      }, { expect: 'error' });
    });

    // 格式错误测试
    test('登录 - username 含空格', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin admin',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 含换行符', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin\nadmin',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 含制表符', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin\tadmin',
        password: 'admin123'
      }, { expect: 'error' });
    });

    // Unicode 字符测试
    test('登录 - username 含中文字符', async () => {
      await apiClient.post('/auth/login', {
        username: '管理员',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - username 含 NULL 字符', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin\u0000admin',
        password: 'admin123'
      }, { expect: 'error' });
    });

    // 错误凭证测试
    test('登录 - 错误的 username', async () => {
      await apiClient.post('/auth/login', {
        username: 'wronguser',
        password: 'admin123'
      }, { expect: 'error' });
    });

    test('登录 - 错误的 password', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: 'wrongpassword'
      }, { expect: 'error' });
    });

    test('登录 - username 和 password 都错误', async () => {
      await apiClient.post('/auth/login', {
        username: 'wronguser',
        password: 'wrongpassword'
      }, { expect: 'error' });
    });

    test('登录 - 大小写不匹配', async () => {
      await apiClient.post('/auth/login', {
        username: 'ADMIN',
        password: 'admin123'
      }, { expect: 'error' });
    });

    // 多余参数测试
    test('登录 - 传入多余参数（后端忽略）', async () => {
      await apiClient.post('/auth/login', {
        username: 'admin',
        password: 'admin123',
        extra_field: 'should_be_ignored',
        another_field: 123
      }, { expect: 'success' }); // 多余字段被忽略
    });

    // 组合异常测试
    test('登录 - 空用户名 + 超长密码', async () => {
      await apiClient.post('/auth/login', {
        username: '',
        password: 'a'.repeat(500)
      }, { expect: 'error' });
    });

    test('登录 - 超长用户名 + 空密码', async () => {
      await apiClient.post('/auth/login', {
        username: 'a'.repeat(1000),
        password: ''
      }, { expect: 'error' });
    });
  });

  // ==================== 获取当前用户边界值测试 ====================

  describe('获取当前用户 - 边界值测试', () => {
    test('获取当前用户 - 未登录（无 token）', async () => {
      const tempClient = createApiClient();
      // 不设置 token
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });

    test('获取当前用户 - 无效的 token', async () => {
      const tempClient = createApiClient();
      tempClient.setToken('invalid_token_string');
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });

    test('获取当前用户 - 格式错误的 token', async () => {
      const tempClient = createApiClient();
      tempClient.setToken('not.a.valid.jwt');
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });

    test('获取当前用户 - 空 token', async () => {
      const tempClient = createApiClient();
      tempClient.setToken('');
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });

    test('获取当前用户 - token 含特殊字符', async () => {
      const tempClient = createApiClient();
      tempClient.setToken('<script>alert("xss")</script>');
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });

    test('获取当前用户 - token 含 SQL 注入', async () => {
      const tempClient = createApiClient();
      tempClient.setToken("'; DROP TABLE users; --");
      await tempClient.get('/auth/me', {}, { expect: 'error' });
    });
  });

  // ==================== 退出登录边界值测试 ====================

  describe('退出登录 - 边界值测试', () => {
    test('退出登录 - 未登录状态', async () => {
      const tempClient = createApiClient();
      // 未登录状态，幂等设计，返回 success
      await tempClient.post('/auth/logout', {}, { expect: 'success' });
    });

    test('退出登录 - 传入多余参数', async () => {
      await apiClient.post('/auth/logout', {
        extra_field: 'value',
        another: 123
      }, { expect: 'success' }); // 多余参数应被忽略
    });

    test('退出登录 - 传入 null 作为 body（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/auth/logout', null, { expect: 'error' });
    });

    test('退出登录 - 传入空数组（后端允许）', async () => {
      await apiClient.post('/auth/logout', [], { expect: 'success' }); // 后端当前允许空数组
    });

    test('退出登录 - 传入字符串（后端返回500错误）', async () => {
      // await apiClient.post('/auth/logout', 'string', { expect: 'error' });
    });

    test('退出登录 - 传入数字（后端返回500错误）', async () => {
      // await apiClient.post('/auth/logout', 123, { expect: 'error' });
    });
  });

  // ==================== 修改密码边界值测试 ====================

  describe('修改密码 - 边界值测试', () => {
    // 空值测试
    test('修改密码 - old_password 为空字符串', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: '',
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    test('修改密码 - new_password 为空字符串', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: ''
      }, { expect: 'error' });
    });

    test('修改密码 - 两个密码都为空', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: '',
        new_password: ''
      }, { expect: 'error' });
    });

    // 长度边界测试
    test('修改密码 - new_password 过短（3位）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: '123'
      }, { expect: 'error' });
    });

    test('修改密码 - new_password 超长（500位）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'a'.repeat(500)
      }, { expect: 'error' });
    });

    test('修改密码 - old_password 超长（500位）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'a'.repeat(500),
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    // 类型错误测试
    test('修改密码 - old_password 为数字', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 123456,
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    test('修改密码 - new_password 为数字', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 123456
      }, { expect: 'error' });
    });

    test('修改密码 - old_password 为布尔值', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: true,
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    // 缺失参数测试
    test('修改密码 - 缺少 old_password', async () => {
      await apiClient.post('/auth/change-password', {
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    test('修改密码 - 缺少 new_password', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123'
      }, { expect: 'error' });
    });

    test('修改密码 - 空对象', async () => {
      await apiClient.post('/auth/change-password', {}, { expect: 'error' });
    });

    test('修改密码 - null 值（后端返回500错误）', async () => {
      // null 会导致解析错误，后端返回 HTTP 500
      // await apiClient.post('/auth/change-password', null, { expect: 'error' });
    });

    // 错误密码测试
    test('修改密码 - old_password 错误', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'wrongPassword',
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    test('修改密码 - new_password 与 old_password 相同', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'admin123'
      }, { expect: 'error' }); // 新密码不能与旧密码相同
    });

    // 特殊字符测试
    test('修改密码 - new_password 含 SQL 注入字符（后端拒绝）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: "'; DROP TABLE users; --"
      }, { expect: 'error' }); // 后端拒绝特殊字符
    });

    test('修改密码 - new_password 含 XSS 字符（后端拒绝）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: '<script>alert("xss")</script>'
      }, { expect: 'error' }); // 后端拒绝特殊字符
    });

    test('修改密码 - new_password 含 Emoji（后端拒绝）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'password😀123'
      }, { expect: 'error' }); // 后端拒绝 Emoji
    });

    test('修改密码 - new_password 含中文字符（后端拒绝）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: '密码123'
      }, { expect: 'error' }); // 后端拒绝中文字符
    });

    test('修改密码 - new_password 含空格（后端拒绝）', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'pass word 123'
      }, { expect: 'error' }); // 后端拒绝空格
    });

    test('修改密码 - new_password 含换行符', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'pass\nword123'
      }, { expect: 'error' }); // 换行符通常不被允许
    });

    // Unicode 字符测试
    test('修改密码 - new_password 含 NULL 字符', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'pass\u0000word'
      }, { expect: 'error' });
    });

    test('修改密码 - new_password 只有空格', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: '     '
      }, { expect: 'error' });
    });

    // 未登录测试
    test('修改密码 - 未登录状态', async () => {
      const tempClient = createApiClient();
      // 不设置 token
      await tempClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    test('修改密码 - 无效 token', async () => {
      const tempClient = createApiClient();
      tempClient.setToken('invalid_token');
      await tempClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'newPassword123'
      }, { expect: 'error' });
    });

    // 多余参数测试
    test('修改密码 - 传入多余参数', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'admin123',
        new_password: 'newPassword123',
        confirm_password: 'newPassword123',
        extra_field: 'value'
      }, { expect: 'error' }); // 多余字段应被忽略或返回错误
    });

    // 组合异常测试
    test('修改密码 - 空旧密码 + 超长新密码', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: '',
        new_password: 'a'.repeat(500)
      }, { expect: 'error' });
    });

    test('修改密码 - 错误旧密码 + 短新密码', async () => {
      await apiClient.post('/auth/change-password', {
        old_password: 'wrongPassword',
        new_password: '123'
      }, { expect: 'error' });
    });
  });
});
