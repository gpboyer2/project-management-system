<template>
  <div class="user-detail-page">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="breadcrumb">
          <span class="breadcrumb-item">
            用户管理
          </span>

          <span class="breadcrumb-separator">
            /
          </span>

          <span class="breadcrumb-current">
            {{ pageTitle }}
          </span>
        </div>

        <span :class="['status-badge', statusClass]">
          {{ statusText }}
        </span>
      </div>

      <div class="detail-header-right">
        <el-button
          v-if="isEditing"
          class="action-btn primary"
          type="primary"
          @click="saveUser"
        >
          保存
        </el-button>

        <el-button v-if="!isAdding" class="action-btn" @click="saveAsUser">
          <el-icon><DocumentCopy /></el-icon>
          保存副本
        </el-button>

        <el-button v-if="!isAdding && !isEditing" class="action-btn" @click="startEdit">
          <el-icon><Edit /></el-icon>
          编辑用户
        </el-button>

        <el-button
          v-if="!isAdding && !isEditing"
          class="action-btn danger"
          type="danger"
          @click="deleteCurrentUser"
        >
          <el-icon><DeleteFilled /></el-icon>
          删除用户
        </el-button>

        <el-button class="action-btn" @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="detail-content">
      <!-- 用户头像卡片 -->
      <div class="overview-card">
        <div :class="['user-avatar', `avatar-role-${currentUser?.role_id || 1}`]">
          {{ userInitial }}
        </div>

        <div class="user-summary">
          <h1 class="user-name">
            {{ currentUser?.user_name || '新用户' }}
          </h1>

          <p class="user-role">
            {{ currentUser?.role_name || '未分配角色' }}
          </p>
        </div>
      </div>

      <!-- 基本信息表单 -->
      <div class="form-section">
        <h2 class="section-title">
          基本信息
        </h2>

        <div class="form-grid">
          <div class="form-item">
            <label class="form-label">
              用户名
            </label>

            <input
              v-model="currentUser.user_name"
              type="text"
              class="form-input"
              :readonly="!isEditing"
              placeholder="请输入用户名"
            />
          </div>

          <div class="form-item">
            <label class="form-label">
              姓名
            </label>

            <input
              v-model="currentUser.real_name"
              type="text"
              class="form-input"
              :readonly="!isEditing"
              placeholder="请输入姓名"
            />
          </div>

          <div class="form-item">
            <label class="form-label">
              手机
            </label>

            <input
              v-model="currentUser.phone"
              type="text"
              class="form-input"
              :readonly="!isEditing"
              placeholder="请输入手机号"
            />
          </div>

          <div class="form-item">
            <label class="form-label">
              邮箱
            </label>

            <input
              v-model="currentUser.email"
              type="email"
              class="form-input"
              :readonly="!isEditing"
              placeholder="请输入邮箱"
            />
          </div>

          <div class="form-item">
            <label class="form-label">
              角色
            </label>

            <el-select
              v-model="currentUser.role_id"
              :disabled="!isEditing"
              placeholder="请选择角色"
              class="form-select"
            >
              <el-option
                v-for="role in roleList"
                :key="role.role_id"
                :label="role.role_name"
                :value="role.role_id"
              />
            </el-select>
          </div>

          <div class="form-item">
            <label class="form-label">
              状态
            </label>

            <el-select
              v-model="currentUser.status"
              :disabled="!isEditing"
              placeholder="请选择状态"
              class="form-select"
            >
              <el-option label="正常" :value="1" />

              <el-option label="禁用" :value="0" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 其他信息 -->
      <div v-if="!isAdding" class="info-section">
        <h2 class="section-title">
          其他信息
        </h2>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">
              创建时间
            </span>

            <span class="info-value">
              {{ formatDate(currentUser?.create_time) }}
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">
              更新时间
            </span>

            <span class="info-value">
              {{ formatDate(currentUser?.update_time) }}
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">
              最后登录
            </span>

            <span class="info-value">
              {{ formatDate(currentUser?.last_login_time) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { userApi, roleApi } from '@/api/user';
import { ElMessage, ElMessageBox, ElButton } from 'element-plus';
import { DocumentCopy, Edit, DeleteFilled, ArrowLeft, WarningFilled } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();

// 接口定义
interface User {
  user_id: number
  user_name: string
  real_name: string
  email: string
  phone: string
  role_id: number
  role_name: string
  status: number
  create_time: number
  update_time: number
  last_login_time: number
}

interface Role {
  role_id: number
  role_name: string
  role_code: string
  status: number
}

// 角色列表
const roleList = ref<Role[]>([]);

// 当前用户数据
const currentUser = ref<User>({
  user_id: 0,
  user_name: '',
  real_name: '',
  email: '',
  phone: '',
  role_id: 1,
  role_name: '',
  status: 1,
  create_time: 0,
  update_time: 0,
  last_login_time: 0
});

// 计算属性
const isAdding = computed(() => route.query.mode === 'add');
const isEditing = computed(() => route.query.mode === 'edit' || route.query.mode === 'add');

const pageTitle = computed(() => {
  if (isAdding.value) return '新增用户';
  if (isEditing.value) return '编辑用户';
  return '用户详情';
});

const userInitial = computed(() => {
  const name = currentUser.value?.user_name || '';
  return name.charAt(0).toUpperCase() || 'U';
});

const statusClass = computed(() => {
  const status = currentUser.value?.status;
  return {
    'status-active': status === 1,
    'status-inactive': status === 0
  };
});

const statusText = computed(() => {
  return currentUser.value?.status === 1 ? '正常' : '禁用';
});

/**
 * 格式化日期时间戳为本地化字符串
 * @param {number | undefined} timestamp - Unix 时间戳（毫秒）
 * @returns {string} 格式化后的日期时间字符串，无值时返回 '-'
 */
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * 加载角色列表
 * @returns {Promise<void>}
 */
async function loadRoleList() {
  const response = await roleApi.list({ status: 1 });
  if (response.status === 'success') {
    roleList.value = response.list || [];
  } else {
    console.error('加载角色列表失败:', response.message);
  }
}

/**
 * 加载用户详情数据
 * @param {string} userId - 用户 ID
 * @returns {Promise<void>}
 */
async function loadUserDetail(userId: string) {
  const response = await userApi.list({ user_id: Number(userId) });
  if (response.status === 'success') {
    const userData = response.list?.[0];
    if (userData) {
      currentUser.value = userData;
    } else {
      ElMessage.error('用户不存在');
      router.replace('/settings/user');
    }
  } else {
    console.error('获取用户详情失败:', response.message);
    router.replace('/settings/user');
  }
}

/**
 * 保存用户信息（新增或更新）
 * @returns {Promise<void>}
 */
async function saveUser() {
  if (!currentUser.value.user_name) {
    ElMessage.error('用户名不能为空');
    return;
  }

  try {
    if (isAdding.value) {
      const response = await userApi.create([{
        user_name: currentUser.value.user_name,
        password: '123456',
        real_name: currentUser.value.real_name,
        email: currentUser.value.email,
        phone: currentUser.value.phone,
        role_id: currentUser.value.role_id,
        status: currentUser.value.status
      }]);
      if (response.status === 'success') {
        ElMessage.success('创建成功，默认密码为 123456');
        router.push('/settings/user');
      } else {
        ElMessage.error(response.message || '创建失败');
      }
    } else {
      const response = await userApi.update([{
        user_id: currentUser.value.user_id,
        user_name: currentUser.value.user_name,
        real_name: currentUser.value.real_name,
        email: currentUser.value.email,
        phone: currentUser.value.phone,
        role_id: currentUser.value.role_id,
        status: currentUser.value.status
      }]);
      if (response.status === 'success') {
        ElMessage.success('保存成功');
        router.push('/settings/user');
      } else {
        ElMessage.error(response.message || '保存失败');
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  }
}

/**
 * 另存为用户（复制当前用户创建新用户）
 * @returns {Promise<void>}
 */
async function saveAsUser() {
  if (!currentUser.value.user_name) {
    ElMessage.error('用户名不能为空');
    return;
  }

  try {
    const response = await userApi.create([{
      user_name: `${currentUser.value.user_name}_copy`,
      password: '123456',
      real_name: currentUser.value.real_name,
      email: currentUser.value.email,
      phone: currentUser.value.phone,
      role_id: currentUser.value.role_id,
      status: currentUser.value.status
    }]);
    if (response.status === 'success') {
      ElMessage.success('另存为成功，默认密码为 123456');
    } else {
      ElMessage.error(response.message || '另存为失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '另存为失败');
  }
}

/**
 * 开始编辑用户
 * @returns {void}
 */
function startEdit() {
  router.push({ path: '/settings/user/detail', query: { mode: 'edit', id: String(currentUser.value.user_id) } });
}

/**
 * 删除当前用户
 * @returns {Promise<void>}
 */
async function deleteCurrentUser() {
  if (!currentUser.value.user_id) return;

  try {
    await ElMessageBox.confirm(`确定要删除用户"${currentUser.value.user_name}"吗？`, '确认删除', {
      type: 'warning',
      icon: WarningFilled,
    });
    const response = await userApi.delete([currentUser.value.user_id]);
    if (response.status === 'success') {
      ElMessage.success('删除成功');
      router.push('/settings/user');
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
}

/**
 * 返回用户列表页
 * @returns {void}
 */
function handleBack() {
  router.push('/settings/user');
}

/**
 * 处理路由变化，根据模式初始化用户数据或加载详情
 * @returns {void}
 */
function handleRouteChange() {
  const mode = route.query.mode as string;
  const id = route.query.id as string;

  if (mode === 'add') {
    const defaultRole = roleList.value[0];
    currentUser.value = {
      user_id: 0,
      user_name: '',
      real_name: '',
      email: '',
      phone: '',
      role_id: defaultRole?.role_id || 1,
      role_name: defaultRole?.role_name || '',
      status: 1,
      create_time: Date.now(),
      update_time: Date.now(),
      last_login_time: 0
    };
  } else if (id) {
    loadUserDetail(id);
  }
}

// 监听路由变化
watch(() => route.query, handleRouteChange, { immediate: true });

// 初始化
onMounted(() => {
  loadRoleList();
});
</script>

<style lang="scss" src="./index.scss"></style>
