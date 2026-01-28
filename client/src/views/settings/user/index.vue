<template>
  <div class="page-users-config" tabindex="0">
    <div class="users-config-content">
      <!-- 用户列表视图 -->
      <div class="users-list-view">
        <!-- 页面标题栏 -->
        <div class="users-list-header">
          <h1 class="users-list-title">
            <el-icon><User /></el-icon>
            用户管理
          </h1>

          <div class="users-list-actions">
            <el-button
              v-for="action in headerActions"
              :key="action.key"
              :type="getButtonType(action.type)"
              @click="handleAction(action.key)"
            >
              <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
              {{ action.label }}
            </el-button>
          </div>
        </div>

        <!-- 搜索和筛选区域 -->
        <div class="users-search-filter">
          <el-input
            id="user-search-input"
            v-model="searchKeyword"
            name="searchKeyword"
            class="users-search-input"
            placeholder="搜索用户名或邮箱..."
            clearable
            @input="handleSearch"
          />

          <!-- 筛选 -->
          <el-select
            v-model="filterRole"
            placeholder="所有角色"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="role in roleList"
              :key="role.role_id"
              :label="role.role_name"
              :value="role.role_id"
            />
          </el-select>

          <el-select
            v-model="filterStatus"
            placeholder="所有状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="正常" value="active" />

            <el-option label="禁用" value="inactive" />
          </el-select>
        </div>

        <!-- 用户表格 -->
        <div class="users-table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>
                  <input
                    id="select-all-users"
                    v-model="selectAll"
                    name="selectAllUsers"
                    type="checkbox"
                    @change="handleSelectAll"
                  />
                </th>

                <th>用户名</th>

                <th>昵称</th>

                <th>邮箱</th>

                <th>角色</th>

                <th>状态</th>

                <th>最后登录</th>

                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="user in filteredUserList"
                :key="user.user_id"
                :class="{ 'users-row-selected': selectedUsers.includes(user.user_id) }"
              >
                <td>
                  <input
                    v-model="selectedUsers"
                    type="checkbox"
                    name="selectedUsers"
                    class="users-checkbox"
                    :value="user.user_id"
                  />
                </td>

                <td>
                  <a href="#" class="users-name-link" @click.prevent="viewUserDetail(user)">
                    {{ user.user_name }}
                  </a>
                </td>

                <td>{{ user.real_name }}</td>

                <td>{{ user.email }}</td>

                <td>
                  <span class="status-badge" :class="getRoleBadgeClass(user.role_id)">
                    {{ getRoleDisplay(user.role_name) }}
                  </span>
                </td>

                <td>
                  <span class="status-badge" :class="user.status === 1 ? 'status-enabled' : 'status-disabled'">
                    {{ user.status === 1 ? '正常' : '禁用' }}
                  </span>
                </td>

                <td>{{ formatDate(user.last_login_time) }}</td>

                <td class="actions">
                  <div class="operation-buttons">
                    <el-tooltip content="编辑" placement="top">
                      <el-button
                        link
                        type="primary"
                        :icon="Edit"
                        @click="editUser(user)"
                      />
                    </el-tooltip>

                    <el-tooltip content="删除" placement="top">
                      <el-button
                        link
                        type="danger"
                        :icon="Delete"
                        @click="deleteUser(user)"
                      />
                    </el-tooltip>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="users-pagination">
          <span>
            显示第 <span id="page-start">
              {{ (pagination.current_page - 1) * pagination.page_size + 1 }}
            </span>
            -
            <span id="page-end">
              {{ Math.min(pagination.current_page * pagination.page_size, pagination.total) }}
            </span>
            项，共
            <span id="total-count">
              {{ pagination.total }}
            </span> 项
          </span>

          <div class="pagination-controls">
            <button
              id="prev-page"
              class="pagination-btn"
              :disabled="pagination.current_page === 1"
              @click="handleCurrentChange(pagination.current_page - 1)"
            >
              上一页
            </button>

            <el-select v-model="pagination.page_size" class="page-size" @change="handleSizeChange">
              <el-option :label="10" :value="10" />

              <el-option :label="20" :value="20" />

              <el-option :label="50" :value="50" />

              <el-option :label="100" :value="100" />
            </el-select>

            <button
              id="next-page"
              class="pagination-btn"
              :disabled="pagination.current_page >= totalPages"
              @click="handleCurrentChange(pagination.current_page + 1)"
            >
              下一页
            </button>
          </div>
        </div>

        <!-- 批量操作 -->
        <div v-show="selectedUsers.length > 0" class="user-actions">
          <span>
            已选择 <span id="selected-count">
              {{ selectedUsers.length }}
            </span> 项
          </span>

          <div class="actions-btns">
            <el-button class="button" @click="enableUsers">
              批量启用
            </el-button>

            <el-button class="button" @click="disableUsers">
              批量禁用
            </el-button>

            <el-button class="button button-danger" type="danger" @click="deleteUsers">
              批量删除
            </el-button>
          </div>
        </div>

        <input id="current-page" type="hidden" :value="pagination.current_page" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { userApi, roleApi } from '@/api/user';
import { ElMessage, ElMessageBox, ElButton } from 'element-plus';
import { Edit, Delete, User, Plus, WarningFilled } from '@element-plus/icons-vue';

// 操作按钮配置
interface ActionItem {
  key: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger';
  icon?: string;
}

const router = useRouter();

// 接口定义（使用后端原始字段名）
interface User {
  user_id: number
  user_name: string
  real_name: string
  email: string
  phone: string
  role_id: number
  role_name: string
  status: number  // 0: 禁用, 1: 启用
  create_time: number
  update_time: number
  last_login_time: number
}

// 角色列表接口定义
interface Role {
  role_id: number
  role_name: string
  role_code: string
  status: number
}

// 响应式数据
const loading = ref(false);

// Header actions
const headerActions = computed<ActionItem[]>(() => [
  {
    key: 'add',
    label: '新增用户',
    type: 'primary',
    icon: Plus
  }
]);

/**
 * 处理 Header 操作按钮点击事件
 * @param {string} key - 操作键值
 * @returns {void}
 */
function handleAction(key: string) {
  if (key === 'add') {
    addUser();
  }
}

/**
 * 获取 Element Plus 按钮类型
 * @param {string | undefined} type - 操作类型
 * @returns {string} Element Plus 按钮类型
 */
function getButtonType(type?: string) {
  const typeMap: Record<string, string> = {
    primary: 'primary',
    secondary: 'info',
    danger: 'danger',
    default: '',
  };
  return typeMap[type || 'default'] || '';
}

// 搜索和筛选
const searchKeyword = ref('');
const filterRole = ref('');
const filterStatus = ref('');

// 角色列表（从接口获取）
const roleList = ref<Role[]>([]);

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

// 选择状态
const selectedUsers = ref<number[]>([]);
const selectAll = ref(false);

// 分页数据
const pagination = reactive({
  current_page: 1,
  page_size: 20,
  total: 0
});

// 用户列表数据
const userList = ref<User[]>([]);

// 总页数
const totalPages = computed(() => Math.ceil(pagination.total / pagination.page_size) || 1);

// 过滤后的用户列表（前端不再过滤，由后端处理）
const filteredUserList = computed(() => userList.value);

/**
 * 加载用户列表数据
 * @returns {Promise<void>}
 */
async function loadUserList() {
  try {
    loading.value = true;
    const response = await userApi.list({
      current_page: pagination.current_page,
      page_size: pagination.page_size,
      keyword: searchKeyword.value || undefined,
      role: filterRole.value ? parseInt(filterRole.value) : undefined,
      status: filterStatus.value ? (filterStatus.value === 'active' ? 1 : 0) : undefined
    });
    if (response.status === 'success') {
      userList.value = response.datum.list || [];
      pagination.current_page = response.datum.pagination?.current_page || 1;
      pagination.page_size = response.datum.pagination?.page_size || 20;
      pagination.total = response.datum.pagination?.total || 0;
    } else {
      ElMessage.error(response.message || '加载用户列表失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载用户列表失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 格式化日期时间戳为本地化字符串
 * @param {number} timestamp - Unix 时间戳（毫秒）
 * @returns {string} 格式化后的日期时间字符串，无值时返回 '-'
 */
function formatDate(timestamp: number): string {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString('zh-CN');
}

/**
 * 获取角色显示文本
 * @param {string} roleName - 角色名称
 * @returns {string} 角色显示文本，无值时返回 '未分配'
 */
function getRoleDisplay(roleName: string): string {
  return roleName || '未分配';
}

/**
 * 获取角色徽章样式类名
 * @param {number} roleId - 角色 ID
 * @returns {string} CSS 类名
 */
function getRoleBadgeClass(roleId: number): string {
  if (roleId === 1) return 'status-admin';
  if (roleId === 2) return 'status-user';
  return 'status-guest';
}

/**
 * 处理搜索操作
 * @returns {void}
 */
function handleSearch() {
  pagination.current_page = 1;
  loadUserList();
}

/**
 * 处理筛选操作
 * @returns {void}
 */
function handleFilter() {
  pagination.current_page = 1;
  loadUserList();
}

/**
 * 处理全选/取消全选操作
 * @returns {void}
 */
function handleSelectAll() {
  if (selectAll.value) {
    selectedUsers.value = filteredUserList.value.map(user => user.user_id);
  } else {
    selectedUsers.value = [];
  }
}

/**
 * 跳转到新增用户页面
 * @returns {void}
 */
function addUser() {
  router.push({ path: '/settings/user/detail', query: { mode: 'add' } });
}

/**
 * 跳转到用户详情页面
 * @param {User} user - 用户对象
 * @returns {void}
 */
function viewUserDetail(user: User) {
  router.push({ path: '/settings/user/detail', query: { mode: 'view', id: String(user.user_id) } });
}

/**
 * 跳转到编辑用户页面
 * @param {User} user - 用户对象
 * @returns {void}
 */
function editUser(user: User) {
  router.push({ path: '/settings/user/detail', query: { mode: 'edit', id: String(user.user_id) } });
}

/**
 * 删除单个用户
 * @param {User} user - 用户对象
 * @returns {Promise<void>}
 */
async function deleteUser(user: User) {
  try {
    await ElMessageBox.confirm(`确定要删除用户"${user.user_name}"吗？`, '确认删除', {
      type: 'warning',
      icon: WarningFilled,
    });
    const response = await userApi.delete([user.user_id]);
    const result = response;
    if (result.status === 'success') {
      ElMessage.success(result.message || '删除成功');
      loadUserList();
    } else {
      ElMessage.error(result.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
}

/**
 * 批量启用用户
 * @returns {Promise<void>}
 */
async function enableUsers() {
  try {
    const updateData = selectedUsers.value.map(id => ({ user_id: id, status: 1 }));
    const response = await userApi.update(updateData);
    const result = response;
    if (result.status === 'success') {
      ElMessage.success(result.message || '启用成功');
      selectedUsers.value = [];
      selectAll.value = false;
      loadUserList();
    } else {
      ElMessage.error(result.message || '启用失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '启用失败');
  }
}

/**
 * 批量禁用用户
 * @returns {Promise<void>}
 */
async function disableUsers() {
  try {
    const updateData = selectedUsers.value.map(id => ({ user_id: id, status: 0 }));
    const response = await userApi.update(updateData);
    const result = response;
    if (result.status === 'success') {
      ElMessage.success(result.message || '禁用成功');
      selectedUsers.value = [];
      selectAll.value = false;
      loadUserList();
    } else {
      ElMessage.error(result.message || '禁用失败');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '禁用失败');
  }
}

/**
 * 批量删除用户
 * @returns {Promise<void>}
 */
async function deleteUsers() {
  try {
    const count = selectedUsers.value.length;
    await ElMessageBox.confirm(`确定要删除选中的 ${count} 个用户吗？`, '确认删除', {
      type: 'warning',
      icon: WarningFilled,
    });
    const response = await userApi.delete(selectedUsers.value);
    const result = response;
    if (result.status === 'success') {
      ElMessage.success(result.message || '删除成功');
      selectedUsers.value = [];
      selectAll.value = false;
      loadUserList();
    } else {
      ElMessage.error(result.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
}

/**
 * 处理每页显示数量变化
 * @returns {void}
 */
function handleSizeChange() {
  pagination.current_page = 1;
  loadUserList();
}

/**
 * 处理页码变化
 * @param {number} page - 目标页码
 * @returns {void}
 */
function handleCurrentChange(page: number) {
  pagination.current_page = page;
  loadUserList();
}

// 初始化
onMounted(() => {
  loadRoleList();
  loadUserList();
});
</script>

<style lang="scss" src="./index.scss"></style>