<template>
  <div class="page-login">
    <!-- 左侧品牌展示区 -->
    <div class="login-brand">
      <div class="login-brand__content">
        <!-- Logo 和标题 -->
        <div class="login-brand__header">
          <div class="login-brand__logo">
            <el-icon><Share /></el-icon>
          </div>

          <h1 class="login-brand__title">
            Node-View
          </h1>

          <p class="login-brand__subtitle">
            流程设计与协议解析平台
          </p>
        </div>

        <!-- 产品特性 -->
        <div class="login-brand__features">
          <div class="login-brand__feature">
            <el-icon><Share /></el-icon>

            <div class="login-brand__feature-content">
              <h3>可视化流程设计</h3>

              <p>拖拽式节点编辑，直观构建数据流程</p>
            </div>
          </div>

          <div class="login-brand__feature">
            <el-icon><Coin /></el-icon>

            <div class="login-brand__feature-content">
              <h3>协议解析配置</h3>

              <p>灵活的报文配置，支持多种协议格式</p>
            </div>
          </div>

          <div class="login-brand__feature">
            <el-icon><Connection /></el-icon>

            <div class="login-brand__feature-content">
              <h3>网络拓扑展示</h3>

              <p>实时系统状态监控，层级结构可视化</p>
            </div>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="login-brand__footer">
          <p>可视化解决方案</p>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="login-brand__bg">
        <div class="login-brand__circle login-brand__circle--1" />

        <div class="login-brand__circle login-brand__circle--2" />

        <div class="login-brand__circle login-brand__circle--3" />
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login-form-section">
      <div class="login-form-wrapper">
        <!-- 表单头部 -->
        <div class="login-header">
          <h2 class="login-title">
            欢迎回来
          </h2>

          <p class="login-subtitle">
            请登录您的账户以继续
          </p>
        </div>

        <!-- 登录表单 -->
        <form class="login-form" @submit.prevent="handleLogin">
          <!-- 用户名 -->
          <div class="form-field">
            <label for="username" class="form-label">
              用户名
            </label>

            <div class="form-input-wrapper">
              <el-icon class="form-input-prefix"><User /></el-icon>

              <input
                id="username"
                v-model="loginForm.username"
                type="text"
                class="form-input"
                placeholder="请输入用户名"
                autocomplete="username"
                :disabled="loading"
              />
            </div>
          </div>

          <!-- 密码 -->
          <div class="form-field">
            <label for="password" class="form-label">
              密码
            </label>

            <div class="form-input-wrapper">
              <el-icon class="form-input-prefix"><Lock /></el-icon>

              <input
                id="password"
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="请输入密码"
                autocomplete="current-password"
                :disabled="loading"
              />

              <el-button
                type="button"
                class="form-input-suffix"
                :icon="showPassword ? View : Hide"
                link
                @click="showPassword = !showPassword"
              />
            </div>
          </div>

          <!-- 记住登录和忘记密码 -->
          <div class="form-options">
            <label class="checkbox-label">
              <input
                v-model="loginForm.rememberMe"
                name="rememberMe"
                type="checkbox"
                class="form-checkbox"
                :disabled="loading"
              />

              <span class="checkbox-custom" />

              <span class="checkbox-text">
                记住登录状态
              </span>
            </label>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="form-error">
            <el-icon><WarningFilled /></el-icon>

            <span>{{ errorMessage }}</span>
          </div>

          <!-- 登录按钮 -->
          <el-button
            type="primary"
            class="login-button"
            native-type="submit"
            :loading="loading"
            :disabled="!isFormValid"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </form>

        <!-- 底部信息 -->
        <div class="login-footer">
          <div class="login-footer__divider">
            <span>演示账号</span>
          </div>

          <p class="login-footer__hint">
            账号：admin &nbsp;&nbsp; 密码：admin123
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import { authApi } from '@/api';
import { View, Hide, Share, Coin, Connection, User, Lock, WarningFilled } from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
});

// 状态
const loading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

// 表单验证
const isFormValid = computed(() => {
  return loginForm.username.trim() !== '' && loginForm.password.trim() !== '';
});

/**
 * 处理登录表单提交
 */
async function handleLogin() {
  if (!isFormValid.value || loading.value) return;

  loading.value = true;
  errorMessage.value = '';

  console.log('[登录] 开始登录流程:', {
    username: loginForm.username,
    time: new Date().toLocaleTimeString()
  });

  // 调用登录接口
  const response = await authApi.login({
    username: loginForm.username,
    password: loginForm.password
  });

  // 调试：打印响应结构
  console.log('[登录] 登录接口响应:', response);

  // 判断登录成功/失败
  if (response.status === 'success') {
    const { accessToken, refreshToken, user } = response.datum;

    console.log('[登录] 开始保存登录状态到 store:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user,
      userInfo: user
    });

    // 保存登录状态到 store
    userStore.token = accessToken;
    userStore.refreshToken = refreshToken || '';
    userStore.userInfo = {
      id: String(user.id),
      username: user.username,
      nickname: user.realName || user.username,
      email: user.email || '',
      avatar: user.avatar || '',
      permissions: user.permissions || [],
      roles: [user.roleId === 1 ? 'admin' : 'user'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    userStore.permissions = user.permissions || [];
    userStore.roles = [user.roleId === 1 ? 'admin' : 'user'];

    console.log('[登录] 保存后的用户状态:', {
      isLoggedIn: userStore.isLoggedIn,
      hasToken: !!userStore.token,
      hasUserInfo: !!userStore.userInfo,
      userInfo: userStore.userInfo
    });

    console.log('[登录] 准备跳转到首页:', {
      target: '/',
      time: new Date().toLocaleTimeString()
    });

    // 跳转到需求管理页面
    router.push('/requirement-management');
  } else {
    console.error('[登录] 登录失败:', response.message);
    errorMessage.value = response.message || '登录失败，请检查用户名和密码';
  }

  loading.value = false;
}
</script>

<style lang="scss" src="./index.scss"></style>
