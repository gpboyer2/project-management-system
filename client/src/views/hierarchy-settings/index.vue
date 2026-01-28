<template>
  <div class="hierarchy-settings">
    <!-- 页面标题栏 -->
    <div class="hierarchy-settings-header">
      <h1 class="hierarchy-settings-title">
        {{ $route.meta.title }}
      </h1>

      <div class="hierarchy-settings-actions">
        <el-button
          v-for="action in headerActions"
          :key="action.key"
          :type="getButtonType(action.type)"
          @click="handleAction(action.key)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </div>

    <div class="settings-content">
      <div class="level-list">
        <template
          v-for="(level, index) in sortedLevels"
          :key="level.id"
        >
          <div
            class="level-item"
            :class="{ 'level-item--selected': selectedLevelId === level.id }"
            draggable="true"
            @click="selectLevel(level.id)"
            @contextmenu.prevent="handleContextMenu($event, level)"
            @dragstart="handleDragStart(index)"
            @dragover.prevent
            @drop="handleDrop(index)"
          >
            <div class="level-item-header">
              <el-icon
                class="level-icon"
                :size="20"
              >
                <component :is="level.icon_class" />
              </el-icon>

              <span class="level-name">
                {{ level.display_name }}
              </span>

              <span class="level-type">
                ({{ level.type_name }})
              </span>

              <div
                class="btn-icon btn-danger-icon"
                title="删除层级"
                @click.stop="handleDeleteLevel(level.id)"
              >
                <el-icon :size="14">
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>

          <div
            v-if="index < sortedLevels.length - 1"
            class="level-arrow"
          >
            <el-icon :size="18">
              <ArrowDown />
            </el-icon>
          </div>
        </template>
      </div>

      <div
        v-if="selectedLevel"
        class="level-editor"
      >
        <div>
          <h3>编辑层级属性</h3>

          <div class="form-group">
            <label>程序名称</label>

            <input
              v-model="selectedLevel.type_name"
              type="text"
              class="form-control"
              placeholder="如: LEVEL_A, LEVEL_B（英文大写，用于程序内部）"
              @change="handleChange"
            />
          </div>

          <div class="form-group">
            <label>显示名称</label>

            <input
              v-model="selectedLevel.display_name"
              type="text"
              class="form-control"
              placeholder="如: 笔记本, 键盘"
              @change="handleChange"
            />
          </div>

          <div class="form-group">
            <label>图标CSS类名</label>

            <el-select
              v-model="selectedLevel.icon_class"
              placeholder="请选择图标"
              class="form-control"
              @change="handleChange"
            >
              <el-option
                v-for="icon in commonIcons"
                :key="icon"
                :label="icon"
                :value="icon"
              >
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon :size="16">
                    <component :is="icon" />
                  </el-icon>

                  <span>{{ icon }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <div class="form-group">
            <label>描述</label>

            <textarea
              v-model="selectedLevel.description"
              class="form-control"
              rows="3"
              placeholder="请输入层级描述"
              @change="handleChange"
            />
          </div>
        </div>

        <div class="comm-node-list-toggle">
          <label class="toggle-label">
            <input
              v-model="selectedLevel.enable_comm_node_list"
              name="enableCommNodeList"
              type="checkbox"
              @change="handleChange"
            />

            <span>启用通信节点列表</span>
          </label>

          <span class="toggle-hint">
            启用后，该层级节点可维护通信节点列表
          </span>
        </div>

        <div class="fields-editor">
          <div class="fields-header">
            <h3>编辑字段属性</h3>

            <el-button type="primary" size="small" @click="handleAddField">
              + 新增字段
            </el-button>
          </div>

          <div v-if="selectedLevel.fields.length === 0" class="fields-empty">
            暂无字段，点击"新增字段"添加
          </div>

          <div v-else class="fields-list">
            <div
              v-for="field in selectedLevel.fields"
              :key="field.id"
              class="field-item"
            >
              <div class="field-row">
                <input
                  v-model="field.name"
                  type="text"
                  class="form-control field-name"
                  placeholder="字段名称"
                  @change="handleFieldChange(field)"
                />

                <el-select
                  v-model="field.type"
                  class="field-type"
                  @change="handleFieldChange(field)"
                >
                  <el-option label="文本" value="string" />

                  <el-option label="数字" value="number" />

                  <el-option label="多行文本" value="textarea" />

                  <el-option label="日期" value="date" />

                  <el-option label="下拉选择" value="select" />
                </el-select>

                <label class="field-required">
                  <input
                    v-model="field.required"
                    name="fieldRequired"
                    type="checkbox"
                    @change="handleFieldChange(field)"
                  />
                  必填
                </label>

                <div
                  class="btn-icon btn-danger-icon"
                  title="删除字段"
                  @click="handleDeleteField(field.id)"
                >
                  <el-icon :size="14">
                    <Delete />
                  </el-icon>
                </div>
              </div>

              <div v-if="field.type === 'select'" class="field-options">
                <input
                  :value="(field.options || []).join(',')"
                  type="text"
                  class="form-control"
                  placeholder="选项值，用逗号分隔"
                  @change="handleOptionsChange(field, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div
        class="menu-item"
        @click="handleAddLevel"
      >
        <el-icon :size="14">
          <Plus />
        </el-icon>

        <span>新增层级</span>
      </div>
      <div
        v-if="contextMenu.targetLevelId"
        class="menu-item menu-item--danger"
        @click="handleContextMenuDelete"
      >
        <el-icon :size="14">
          <Delete />
        </el-icon>

        <span>删除层级</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { ElMessageBox, ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import {
  ArrowDown,
  Plus,
  Delete,
  Refresh
} from '@element-plus/icons-vue';

// 操作按钮配置
interface ActionItem {
  key: string;
  label: string;
  type?: 'primary' | 'secondary' | 'danger' | 'default';
  icon?: any;
}

const hierarchyStore = useHierarchyConfigStore();
const { hierarchyLevels, sortedLevels } = storeToRefs(hierarchyStore);

const selectedLevelId = ref<string>();
const dragSourceIndex = ref<number | null>(null);

const selectedLevel = computed(() =>
  hierarchyLevels.value.find(l => l.id === selectedLevelId.value)
);

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetLevelId: null as string | null
});

// 常用图标列表（用于下拉选择）
const commonIcons = [
  'Folder', 'Monitor', 'Box', 'Files', 'Document',
  'Setting', 'Connection', 'DataLine', 'Platform', 'Cpu',
  'Histogram', 'TrendCharts', 'Grid', 'Menu', 'Operation',
  'Tools', 'Link', 'Share', 'MessageBox', 'ChatDotRound',
  'Bell', 'Warning', 'CircleCheck', 'Star', 'Flag'
];

// Header actions
const headerActions = computed<ActionItem[]>(() => [
  {
    key: 'reset',
    label: '重置默认',
    type: 'default',
    icon: Refresh
  },
  {
    key: 'add',
    label: '新增层级',
    type: 'primary',
    icon: Plus
  }
]);

/**
 * 处理顶部操作按钮点击事件
 * @param {string} key - 操作按钮的 key 值（reset/add）
 */
function handleAction(key: string) {
  if (key === 'reset') {
    handleReset();
  } else if (key === 'add') {
    handleAddLevel();
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

/**
 * 选中层级
 * @param {string} levelId - 层级 ID
 */
function selectLevel(levelId: string) {
  selectedLevelId.value = levelId;
}

/**
 * 层级属性变更时自动保存
 */
async function handleChange() {
  if (selectedLevel.value) {
    await hierarchyStore.updateLevel(selectedLevel.value.id, {
      type_name: selectedLevel.value.type_name,
      display_name: selectedLevel.value.display_name,
      icon_class: selectedLevel.value.icon_class,
      description: selectedLevel.value.description,
      enable_comm_node_list: selectedLevel.value.enable_comm_node_list
    });
    ElMessage.success('保存成功');
  }
}

/**
 * 拖拽开始时记录源索引
 * @param {number} index - 拖拽起始索引
 */
function handleDragStart(index: number) {
  dragSourceIndex.value = index;
}

/**
 * 拖拽放置时重新排序层级
 * @param {number} targetIndex - 目标索引
 */
async function handleDrop(targetIndex: number) {
  if (dragSourceIndex.value === null || dragSourceIndex.value === targetIndex) {
    return;
  }

  const levels = sortedLevels.value.slice();
  const [moved] = levels.splice(dragSourceIndex.value, 1);
  levels.splice(targetIndex, 0, moved);

  dragSourceIndex.value = null;

  const newOrderIds = levels.map(l => l.id);
  await hierarchyStore.rebuildLinearHierarchy(newOrderIds);
}

/**
 * 显示右键菜单
 * @param {MouseEvent} event - 鼠标事件
 * @param {any} level - 层级对象
 */
function handleContextMenu(event: MouseEvent, level: any) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    targetLevelId: level.id
  };
  // 选中当前层级
  selectLevel(level.id);
}

/**
 * 关闭右键菜单
 */
function closeContextMenu() {
  contextMenu.value.visible = false;
}

/**
 * 通过右键菜单删除层级
 */
async function handleContextMenuDelete() {
  if (contextMenu.value.targetLevelId) {
    await handleDeleteLevel(contextMenu.value.targetLevelId);
    closeContextMenu();
  }
}

/**
 * 新增层级（在当前选中层级后插入）
 */
async function handleAddLevel() {
  // 先记住当前选中层级的ID和位置（在 addLevel 之前）
  const currentLevels = sortedLevels.value.slice();
  const currentLevelIds = currentLevels.map(l => l.id);
  let insertIndex = currentLevels.length; // 默认末尾

  if (selectedLevelId.value) {
    const targetIndex = currentLevelIds.indexOf(selectedLevelId.value);
    if (targetIndex !== -1) {
      insertIndex = targetIndex + 1;
    }
  }

  // 生成唯一的程序名称：LEVEL_时间戳_随机数
  const uniqueTypeName = `LEVEL_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  // const uniqueTypeName = `LEVEL_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const newLevel = await hierarchyStore.addLevel({
    type_name: uniqueTypeName,
    display_name: '新层级',
    icon_class: 'Document',
  });

  if (newLevel) {
    // 构建新的顺序：在 insertIndex 位置插入新层级
    const newOrderIds = [...currentLevelIds];
    newOrderIds.splice(insertIndex, 0, newLevel.id);

    await hierarchyStore.rebuildLinearHierarchy(newOrderIds);

    selectedLevelId.value = newLevel.id;
    ElMessage.success('新增层级成功');
  }
}

/**
 * 删除层级
 * @param {string} levelId - 层级 ID
 */
async function handleDeleteLevel(levelId: string) {
  try {
    await ElMessageBox.confirm('确定删除此层级吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await hierarchyStore.deleteLevel(levelId);

    const levels = sortedLevels.value.slice();
    const newOrderIds = levels.map(l => l.id);
    if (newOrderIds.length > 0) {
      await hierarchyStore.rebuildLinearHierarchy(newOrderIds);
      if (selectedLevelId.value === levelId) {
        selectedLevelId.value = newOrderIds[0];
      }
    } else {
      if (selectedLevelId.value === levelId) {
        selectedLevelId.value = undefined;
      }
    }

    ElMessage.success('删除成功');
  } catch { }
}

/**
 * 为当前层级添加字段
 */
async function handleAddField() {
  if (!selectedLevelId.value) return;
  await hierarchyStore.addFieldToLevel(selectedLevelId.value, {
    name: '新字段',
    type: 'string',
    required: false
  });
  ElMessage.success('新增字段成功');
}

/**
 * 更新字段属性
 * @param {{ id: string; name: string; type: string; required: boolean; options?: string[] }} field - 字段对象
 */
async function handleFieldChange(field: { id: string; name: string; type: string; required: boolean; options?: string[] }) {
  if (!selectedLevelId.value) return;
  await hierarchyStore.updateField(selectedLevelId.value, field.id, {
    name: field.name,
    type: field.type as 'string' | 'number' | 'date' | 'select' | 'textarea',
    required: field.required,
    options: field.options
  });
}

/**
 * 删除字段
 * @param {string} fieldId - 字段 ID
 */
async function handleDeleteField(fieldId: string) {
  if (!selectedLevelId.value) return;
  try {
    await ElMessageBox.confirm('确定删除此字段吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await hierarchyStore.deleteField(selectedLevelId.value, fieldId);
    ElMessage.success('删除字段成功');
  } catch { }
}

/**
 * 更新下拉选项字段的可选值
 * @param {{ id: string; options?: string[] }} field - 字段对象
 * @param {Event} event - 输入事件
 */
function handleOptionsChange(field: { id: string; options?: string[] }, event: Event) {
  const value = (event.target as HTMLInputElement).value;
  field.options = value.split(',').map(s => s.trim()).filter(Boolean);
  handleFieldChange(field as { id: string; name: string; type: string; required: boolean; options?: string[] });
}

/**
 * 重置为默认层级配置
 */
async function handleReset() {
  try {
    await ElMessageBox.confirm('确定重置为默认配置吗？所有自定义层级将被删除。', '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const success = await hierarchyStore.resetToDefault();
    if (success) {
      const levels = sortedLevels.value;
      selectedLevelId.value = levels.length > 0 ? levels[0].id : undefined;
      ElMessage.success('重置成功');
    }
  } catch { }
}

// 页面加载时加载数据并选中第一个层级
onMounted(async () => {
  await hierarchyStore.loadLevels();
  const levels = sortedLevels.value;
  if (levels.length > 0) {
    selectedLevelId.value = levels[0].id;
  }
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
});
</script>
<style lang="scss" src="./index.scss"></style>
