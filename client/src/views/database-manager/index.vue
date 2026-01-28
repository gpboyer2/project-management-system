<template>
  <div class="database-manager">
    <!-- 左侧表列表 -->
    <aside class="database-manager-sidebar">
      <div class="sidebar-header">
        <h3>数据表</h3>

        <el-button
          class="btn-refresh"
          title="刷新"
          :icon="RefreshRight"
          circle
          @click="loadTableList"
        />
      </div>

      <div class="sidebar-search">
        <input
          id="table-search-input"
          v-model="tableSearch"
          name="tableSearch"
          type="text"
          placeholder="搜索表名..."
          class="search-input"
        />
      </div>

      <ul class="table-list">
        <li
          v-for="table in filteredTableList"
          :key="table"
          :class="['table-item', { active: currentTable === table }]"
          @click="selectTable(table)"
        >
          <span class="table-icon">
            <Document />
          </span>

          <span class="table-name">
            {{ table }}
          </span>
        </li>
      </ul>
    </aside>

    <!-- 右侧数据区域 -->
    <main class="database-manager-main">
      <template v-if="currentTable">
        <!-- 工具栏 -->
        <div class="database-manager-toolbar">
          <div class="database-manager-title-group">
            <el-icon class="database-manager-icon"><Coin /></el-icon>

            <h2 class="database-manager-title">
              {{ currentTable }}
            </h2>

            <span class="database-manager-subtitle">
              共 {{ tableSchema?.rowCount || 0 }} 条记录
            </span>
          </div>

          <div class="database-manager-actions">
            <el-button
              v-for="action in headerActions"
              :key="action.key"
              :type="getButtonType(action.type)"
              :icon="action.icon"
              :disabled="action.disabled"
              @click="handleAction(action.key)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </div>

        <!-- 表结构信息 -->
        <div v-if="showSchema" class="schema-info">
          <div class="schema-header">
            <h4>表结构</h4>

            <el-button link type="primary" @click="showSchema = false">
              收起
            </el-button>
          </div>

          <table class="schema-table">
            <thead>
              <tr>
                <th>字段名</th>

                <th>类型</th>

                <th>主键</th>

                <th>非空</th>

                <th>默认值</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="col in tableSchema?.columns" :key="col.name">
                <td>{{ col.name }}</td>

                <td>{{ col.type }}</td>

                <td>{{ col.primaryKey ? '✓' : '' }}</td>

                <td>{{ col.notNull ? '✓' : '' }}</td>

                <td>{{ col.defaultValue }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <el-button
          v-else
          link
          type="primary"
          class="show-schema-btn"
          @click="showSchema = true"
        >
          显示表结构
        </el-button>

        <!-- 数据表格和详情容器 -->
        <div class="data-table-wrapper">
          <!-- 数据表格 -->
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="checkbox-col">
                    <input
                      v-model="selectAll"
                      name="selectAll"
                      type="checkbox"
                      @change="toggleSelectAll"
                    />
                  </th>

                  <th 
                    v-for="col in dataColumnList" 
                    :key="col"
                    :class="{ sortable: true, sorted: orderBy === col }"
                    @click="sortBy(col)"
                  >
                    {{ col }}
                    <span v-if="orderBy === col" class="sort-icon">
                      {{ orderDir === 'ASC' ? '↑' : '↓' }}
                    </span>
                  </th>

                  <th class="action-col">
                    操作
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(row, index) in dataList"
                  :key="index"
                  :class="{ 'selected-row': selectedRowDetail === row }"
                  @click="selectRowDetail(row)"
                >
                  <td class="checkbox-col">
                    <input
                      v-model="selectedRowList"
                      name="selectedRows"
                      type="checkbox"
                      :value="row"
                      @click.stop
                    />
                  </td>

                  <td v-for="col in dataColumnList" :key="col">
                    <span class="cell-content" :title="String(row[col])">
                      {{ formatCellValue(row[col]) }}
                    </span>
                  </td>

                  <td class="action-col">
                    <el-button link type="primary" @click.stop="editRow(row)">
                      编辑
                    </el-button>

                    <el-button link type="danger" @click.stop="deleteRow(row)">
                      删除
                    </el-button>
                  </td>
                </tr>

                <tr v-if="dataList.length === 0">
                  <td :colspan="dataColumnList.length + 2" class="empty-row">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 行详情面板 -->
          <div v-if="selectedRowDetail" class="row-detail-panel">
            <div class="row-detail-header">
              <h4>行详情</h4>

              <div class="row-detail-actions">
                <el-button
                  link
                  type="primary"
                  title="复制 JSON"
                  @click="copyRowDetail"
                >
                  复制
                </el-button>

                <el-button link @click="closeRowDetail">
                  ✕
                </el-button>
              </div>
            </div>

            <div class="row-detail-content">
              <pre class="json-viewer">{{ JSON.stringify(selectedRowDetail, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <span class="pagination-info">
            第 {{ pagination.current_page }} 页 / 共 {{ Math.ceil(pagination.total / pagination.page_size) || 1 }} 页
          </span>

          <div class="pagination-actions">
            <el-button :disabled="pagination.current_page <= 1" @click="goToPage(pagination.current_page - 1)">
              上一页
            </el-button>

            <select v-model="pagination.page_size" @change="queryData">
              <option :value="10">
                10条/页
              </option>

              <option :value="20">
                20条/页
              </option>

              <option :value="50">
                50条/页
              </option>

              <option :value="100">
                100条/页
              </option>
            </select>

            <el-button :disabled="pagination.current_page >= Math.ceil(pagination.total / pagination.page_size)" @click="goToPage(pagination.current_page + 1)">
              下一页
            </el-button>
          </div>
        </div>

        <!-- SQL查询区域 -->
        <div class="sql-query-section">
          <div class="sql-header">
            <h4>SQL查询</h4>

            <el-button type="primary" @click="executeSQL">
              执行
            </el-button>
          </div>

          <textarea 
            v-model="sqlQuery" 
            class="sql-input" 
            placeholder="输入SELECT查询语句..."
            rows="3"
          />
        </div>
      </template>

      <!-- 未选择表时的提示 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          🗃️
        </div>

        <p>请从左侧选择一个数据表</p>
      </div>
    </main>

    <!-- 编辑对话框 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ isEdit ? '编辑数据' : '新增数据' }}</h3>

          <el-button link @click="closeDialog">
            ×
          </el-button>
        </div>

        <div class="dialog-body">
          <div v-for="col in tableSchema?.columns" :key="col.name" class="form-item">
            <label>{{ col.name }}</label>

            <input 
              v-model="formData[col.name]" 
              :type="getInputType(col.type)"
              :disabled="isEdit && col.primaryKey"
              :placeholder="col.type"
            />
          </div>
        </div>

        <div class="dialog-footer">
          <el-button @click="closeDialog">
            取消
          </el-button>

          <el-button type="primary" @click="saveData">
            保存
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { databaseApi, type TableSchema } from '@/api/database';
import { ElMessage, ElMessageBox } from 'element-plus';
import { RefreshRight, Search, Plus, DeleteFilled, Coin } from '@element-plus/icons-vue';
import { copyJsonToClipboard } from '@/utils/clipboard';

// 操作按钮配置
interface ActionItem {
  key: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger' | 'default';
  icon?: string;
  disabled?: boolean;
}

// Header actions
const headerActions = computed<ActionItem[]>(() => [
  {
    key: 'search',
    label: '搜索',
    type: 'default',
    icon: Search
  },
  {
    key: 'add',
    label: '新增',
    type: 'primary',
    icon: Plus
  },
  {
    key: 'delete',
    label: '删除',
    type: 'danger',
    icon: DeleteFilled,
    disabled: selectedRowList.value.length === 0
  }
]);

/**
 * 处理顶部操作按钮点击事件
 * @param {string} key - 操作按钮的 key 值（search/add/delete）
 */
function handleAction(key: string) {
  if (key === 'search') {
    queryData();
  } else if (key === 'add') {
    showAddDialog();
  } else if (key === 'delete') {
    deleteSelectedRow();
  }
}

/**
 * 获取 Element Plus 按钮类型映射
 * @param {string} type - 自定义按钮类型（primary/secondary/danger/default）
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

// 表列表
const tableList = ref<string[]>([]);
const tableSearch = ref('');
const currentTable = ref('');
const tableSchema = ref<TableSchema | null>(null);
const showSchema = ref(false);

// 数据列表
const dataList = ref<Record<string, any>[]>([]);
const dataColumnList = ref<string[]>([]);
const dataSearch = ref('');
const selectedRowList = ref<Record<string, any>[]>([]);
const selectAll = ref(false);

// 分页
const pagination = ref({
  current_page: 1,
  page_size: 20,
  total: 0
});

// 排序
const orderBy = ref('');
const orderDir = ref<'ASC' | 'DESC'>('ASC');

// SQL查询
const sqlQuery = ref('');

// 对话框
const dialogVisible = ref(false);
const isEdit = ref(false);
const formData = ref<Record<string, any>>({});

// 行详情
const selectedRowDetail = ref<Record<string, any> | null>(null);

// 计算过滤后的表列表
const filteredTableList = computed(() => {
  if (!tableSearch.value) return tableList.value;
  return tableList.value.filter(t => t.toLowerCase().includes(tableSearch.value.toLowerCase()));
});

/**
 * 加载所有数据库表列表
 */
async function loadTableList() {
  const res = await databaseApi.getTableList();
  if (res.status === 'success') {
    tableList.value = res.datum?.list || [];
  } else {
    ElMessage.error(res.message || '加载表列表失败');
  }
}

/**
 * 选择表并加载表结构和数据
 * @param {string} tableName - 表名
 */
async function selectTable(tableName: string) {
  currentTable.value = tableName;
  dataSearch.value = '';
  orderBy.value = '';
  orderDir.value = 'ASC';
  pagination.value.current_page = 1;
  selectedRowList.value = [];
  selectAll.value = false;

  await loadTableSchema();
  await queryData();
}

/**
 * 加载当前表的结构信息
 */
async function loadTableSchema() {
  const res = await databaseApi.getTableSchema(currentTable.value);
  if (res.status === 'success') {
    tableSchema.value = res.datum;
  } else {
    ElMessage.error(res.message || '加载表结构失败');
  }
}

/**
 * 查询当前表的数据
 */
async function queryData() {
  const res = await databaseApi.queryData({
    tableName: currentTable.value,
    current_page: pagination.value.current_page,
    page_size: pagination.value.page_size,
    keyword: dataSearch.value,
    orderBy: orderBy.value,
    orderDir: orderDir.value
  });
  if (res.status === 'success') {
    dataList.value = res.datum?.list || [];
    dataColumnList.value = res.datum?.columns || [];
    pagination.value.total = res.datum?.pagination?.total || 0;
    selectedRowList.value = [];
    selectAll.value = false;
  } else {
    ElMessage.error(res.message || '查询数据失败');
  }
}

/**
 * 按字段排序
 * @param {string} col - 字段名
 */
function sortBy(col: string) {
  if (orderBy.value === col) {
    orderDir.value = orderDir.value === 'ASC' ? 'DESC' : 'ASC';
  } else {
    orderBy.value = col;
    orderDir.value = 'ASC';
  }
  queryData();
}

/**
 * 跳转到指定页码
 * @param {number} page - 目标页码
 */
function goToPage(page: number) {
  pagination.value.current_page = page;
  queryData();
}

/**
 * 切换全选状态
 */
function toggleSelectAll() {
  if (selectAll.value) {
    selectedRowList.value = [...dataList.value];
  } else {
    selectedRowList.value = [];
  }
}

/**
 * 获取主键字段名
 * @returns {string} 主键字段名
 */
function getPrimaryKey(): string {
  const pkCol = tableSchema.value?.columns.find(c => c.primaryKey);
  return pkCol?.name || tableSchema.value?.columns[0]?.name || 'id';
}

/**
 * 显示新增数据对话框
 */
function showAddDialog() {
  isEdit.value = false;
  formData.value = {};
  dialogVisible.value = true;
}

/**
 * 编辑行数据
 * @param {Record<string, any>} row - 行数据对象
 */
function editRow(row: Record<string, any>) {
  isEdit.value = true;
  formData.value = { ...row };
  dialogVisible.value = true;
}

/**
 * 关闭编辑对话框
 */
function closeDialog() {
  dialogVisible.value = false;
  formData.value = {};
}

/**
 * 保存数据（新增或更新）
 */
async function saveData() {
  const pk = getPrimaryKey();
  let res;
  if (isEdit.value) {
    res = await databaseApi.updateData(currentTable.value, pk, [formData.value]);
  } else {
    res = await databaseApi.createData(currentTable.value, [formData.value]);
  }

  if (res.status === 'success') {
    ElMessage.success(isEdit.value ? '更新成功' : '新增成功');
    closeDialog();
    await queryData();
    await loadTableSchema();
  } else {
    ElMessage.error(res.message || '保存失败');
  }
}

// 删除结果类型
interface DeleteResult {
  success: boolean
  id?: string | number
  message?: string
}

/**
 * 处理删除结果，显示详细信息
 * @param {DeleteResult[]} resultList - 删除结果列表
 */
function handleDeleteResult(resultList: DeleteResult[]) {
  const successList = resultList.filter(r => r.success);
  const failedList = resultList.filter(r => !r.success);

  if (failedList.length === 0) {
    // 全部成功
    ElMessage.success(`成功删除 ${successList.length} 条数据`);
  } else if (successList.length === 0) {
    // 全部失败
    ElMessage.error('删除失败');
  } else {
    // 部分成功，部分失败，显示详细弹窗
    const failedDetailList = failedList.map(r => `ID: ${r.id}，原因: ${r.message || '未知错误'}`).join('\n');
    ElMessageBox.alert(
      `成功删除 ${successList.length} 条数据\n删除失败 ${failedList.length} 条数据：\n\n${failedDetailList}`,
      '删除结果',
      {
        type: 'warning',
        confirmButtonText: '知道了',
        dangerouslyUseHTMLString: false
      }
    );
  }
}

/**
 * 删除单行数据
 * @param {Record<string, any>} row - 行数据对象
 */
async function deleteRow(row: Record<string, any>) {
  try {
    await ElMessageBox.confirm('确定要删除这条数据吗？', '确认删除', { type: 'warning' });
    const pk = getPrimaryKey();
    const res = await databaseApi.deleteData(currentTable.value, pk, [row[pk]]);
    if (res.status === 'success') {
      const resultList = res.datum as DeleteResult[];
      handleDeleteResult(resultList);
      await queryData();
      await loadTableSchema();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message);
    }
  }
}

/**
 * 批量删除选中的行
 */
async function deleteSelectedRow() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRowList.value.length} 条数据吗？`, '确认删除', { type: 'warning' });
    const pk = getPrimaryKey();
    const pkValueList = selectedRowList.value.map(row => row[pk]);
    const res = await databaseApi.deleteData(currentTable.value, pk, pkValueList);
    if (res.status === 'success') {
      const resultList = res.datum as DeleteResult[];
      handleDeleteResult(resultList);
      await queryData();
      await loadTableSchema();
    } else {
      ElMessage.error(res.message || '删除失败');
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message);
    }
  }
}

/**
 * 执行自定义 SQL 查询
 */
async function executeSQL() {
  if (!sqlQuery.value.trim()) {
    ElMessage.warning('请输入SQL语句');
    return;
  }
  const res = await databaseApi.executeQuery(sqlQuery.value);
  if (res.status === 'success') {
    dataList.value = res.datum?.list || [];
    dataColumnList.value = res.datum?.columns || [];
    pagination.value.total = res.datum?.pagination?.total || 0;
    ElMessage.success(`查询成功，返回 ${dataList.value.length} 条记录`);
  } else {
    ElMessage.error(res.message || 'SQL执行失败');
  }
}

/**
 * 格式化单元格值用于显示
 * @param {any} value - 单元格值
 * @returns {string} 格式化后的字符串（超过100字符截断）
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';

  // 后端模型 getter 已自动解析 JSON 字段为对象
  if (typeof value === 'object') {
    const str = JSON.stringify(value);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  }

  const str = String(value);
  return str.length > 100 ? str.substring(0, 100) + '...' : str;
}

/**
 * 根据字段类型获取输入框类型
 * @param {string} colType - 数据库字段类型
 * @returns {string} HTML input type（number/text）
 */
function getInputType(colType: string): string {
  const type = colType.toUpperCase();
  if (type.includes('INT') || type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) {
    return 'number';
  }
  return 'text';
}

/**
 * 选择行查看详情
 * @param {Record<string, any>} row - 行数据对象
 */
function selectRowDetail(row: Record<string, any>) {
  selectedRowDetail.value = row;
}

/**
 * 关闭行详情面板
 */
function closeRowDetail() {
  selectedRowDetail.value = null;
}

/**
 * 复制行详情 JSON 到剪贴板
 */
async function copyRowDetail() {
  await copyJsonToClipboard(selectedRowDetail.value);
}

onMounted(() => {
  loadTableList();
});
</script>

<style lang="scss" src="./index.scss"></style>
