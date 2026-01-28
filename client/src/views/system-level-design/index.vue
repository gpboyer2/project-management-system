<!--
  体系配置页面
  展示系统配置的树形结构和详细信息面板
-->

<template>
  <div class="sidebar-system-level-design" tabindex="0">
    <div class="system-config-container">
      <!-- 搜索区域 -->
      <div class="system-config-search">
        <el-icon class="search-icon" :size="14">
          <Search />
        </el-icon>

        <input
          type="text"
          :placeholder="searchPlaceholder"
          class="system-config-search-input"
          :value="searchKeyword"
          @input="(event: Event) => handleSearch((event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 主要布局区域 -->
      <div class="system-config-layout">
        <!-- 左侧树形结构面板 -->
        <div class="system-config-left-panel">
          <!-- 新增根节点按钮 -->
          <div class="add-root-container">
            <el-button class="add-root-button" type="primary" @click="handleAddRootNode">
              <el-icon :size="14">
                <Plus />
              </el-icon> {{ getRootLevelName() }}
            </el-button>
          </div>

          <!-- 系统配置树 -->
          <div id="system-config-tree" class="system-config-tree">
            <HierarchyTreeNode
              v-for="node in hierarchyNodes"
              :key="node.id"
              :node="node"
              @toggle="toggleHierarchyNode"
              @edit="editHierarchyNode"
              @context-menu="showHierarchyContextMenu"
            />
            
            <!-- 空状态提示 -->
            <div v-if="hierarchyNodes.length === 0" class="tree-empty-tip">
              暂无数据，点击上方按钮新增
            </div>
          </div>
        </div>

        <!-- 右侧详情面板 -->
        <div id="system-config-details" class="system-config-right-panel">
          <!-- 节点表单（统一使用 NodeForm 处理所有层级） -->
          <NodeForm
            v-if="panelMode === 'form'"
            :form-data="formData"
            :edit-type="editType"
            :comp-options="compOptions"
            @submit="submitForm"
          />

          <!-- 默认提示 -->
          <div v-else class="default-placeholder">
            <el-icon class="placeholder-icon"><InfoFilled /></el-icon>

            <p class="placeholder-title">
              暂未选择节点
            </p>

            <p class="placeholder-desc">
              请在左侧树形结构中选择一个节点进行查看或编辑，<br />或点击上方"{{ getRootLevelName() }}"按钮创建顶级节点
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="simpleContextMenu.visible"
      class="simple-context-menu"
      :style="{ left: simpleContextMenu.x + 'px', top: simpleContextMenu.y + 'px' }"
    >
      <div class="menu-item" @click="handleContextMenuAction('edit')">
        编辑
      </div>

      <template v-for="childLevel in contextMenuChildLevelList" :key="childLevel.id">
        <div class="menu-item" @click="handleContextMenuAction('add-child-' + childLevel.id)">
          新增{{ childLevel.display_name }}
        </div>
      </template>

      <div v-if="contextMenuEnableCommNodeList" class="menu-item" @click="handleContextMenuAction('add-comm-node')">
        新增通信节点
      </div>

      <div class="menu-divider" />

      <div class="menu-item danger" @click="handleContextMenuAction('delete')">
        删除
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineComponent, h, resolveComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useSystemLevelDesignStore } from '@/stores';
import { useHierarchyConfigStore } from '@/stores/hierarchy-config';
import { storeToRefs } from 'pinia';
import { ElMessage, ElButton } from 'element-plus';
import { Plus, Search, Folder, Monitor, Box, Document, InfoFilled, ArrowDown, ArrowRight, Edit } from '@element-plus/icons-vue';
import NodeForm from './components/system-design-detail/index.vue';

// 组件配置选项接口（与子组件保持一致）
interface CompOptions {
  levelConfig: {
    id: string
    display_name: string
    fields: Array<{
      id: string
      name: string
      type: 'string' | 'number' | 'textarea' | 'date' | 'select'
      required?: boolean
      placeholder?: string
      defaultValue?: string | number
      options?: string[]
      order?: number
    }>
    enable_comm_node_list?: boolean
  }
}

// 层级节点接口
interface HierarchyNode {
  id: string;
  name: string;
  node_type_id: string;  // 对应层级配置的 id
  parentId?: string;
  expanded?: boolean;
  children?: HierarchyNode[];
}

// 图标映射
const iconMap: Record<string, typeof Folder> = { Folder, Monitor, Box, Document };

// 递归树节点组件
const HierarchyTreeNode = defineComponent({
  name: 'HierarchyTreeNode',
  props: {
    node: { type: Object, required: true }
  },
  emits: ['toggle', 'edit', 'context-menu'],
  setup(props, { emit }) {
    const hierarchyConfigStore = useHierarchyConfigStore();
    const level = computed(() => 
      hierarchyConfigStore.hierarchyLevels.find(l => l.id === props.node.node_type_id)
    );
    
    return () => h('div', {
      class: 'tree-node',
      'data-id': props.node.id,
      'data-type': props.node.node_type_id
    }, [
      h('div', {
        class: 'tree-node-content',
        onClick: () => emit('edit', props.node),
        onContextmenu: (e: MouseEvent) => {
          e.preventDefault();
          emit('context-menu', e, props.node);
        }
      }, [
        h('span', {
          class: 'tree-expand-icon',
          onClick: (e: Event) => {
            e.stopPropagation();
            if (props.node.children && props.node.children.length > 0) {
              emit('toggle', props.node.id);
            }
          }
        },
        props.node.children && props.node.children.length > 0
          ? [h(resolveComponent('el-icon'), { size: 14 }, () => h(props.node.expanded ? ArrowDown : ArrowRight))]
          : ''
        ),
        h('span', { class: 'tree-node-icon' }, [
          level.value?.icon_class
            ? h(resolveComponent('el-icon'), { size: 'inherit' }, () => h(iconMap[level.value!.icon_class] || Folder))
            : h(resolveComponent('el-icon'), { size: 'inherit' }, () => h(Folder))
        ]),
        h('span', { class: 'tree-node-name' }, getNodeDisplayValue(props.node)),
        h(resolveComponent('el-button'), {
          class: 'tree-edit-button',
          title: `编辑${level.value?.display_name || '节点'}`,
          icon: Edit,
          size: 'small',
          link: true,
          onClick: (e: Event) => {
            e.stopPropagation();
            emit('edit', props.node);
          }
        }, () => '编辑')
      ]),
      props.node.expanded && props.node.children && props.node.children.length > 0
        ? h('div', { class: 'tree-children' }, 
          props.node.children.map((child: HierarchyNode) => 
            h(HierarchyTreeNode, {
              key: child.id,
              node: child,
              onToggle: (id: string) => emit('toggle', id),
              onEdit: (node: HierarchyNode) => emit('edit', node),
              onContextMenu: (e: MouseEvent, node: HierarchyNode) => emit('context-menu', e, node)
            })
          )
        )
        : null
    ]);
  }
});

// 使用 store
const systemDesignStore = useSystemLevelDesignStore();
const hierarchyConfigStore = useHierarchyConfigStore();

// 本地状态
const selectedNode = ref<HierarchyNode | null>(null);
const panelMode = ref<'form' | 'default'>('default');
const editType = ref<'add' | 'edit'>('add');
const formData = ref<Record<string, string | undefined>>({});
const compOptions = ref<CompOptions>({
  levelConfig: {
    id: '',
    display_name: '',
    fields: [],
    enable_comm_node_list: false
  }
});

// 从 store 获取响应式状态
const { hierarchyNodes, searchKeyword } = storeToRefs(systemDesignStore);
const { handleSearch } = systemDesignStore;

/**
 * 获取节点的显示字段名（取第一个排序字段）
 * @param {string} nodeTypeId - 层级类型 ID
 * @returns {string} 显示字段名
 */
function getDisplayFieldName(nodeTypeId: string): string {
  const level = hierarchyConfigStore.hierarchyLevels.find(l => l.id === nodeTypeId);
  if (level?.fields && level.fields.length > 0) {
    const sortedFields = [...level.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sortedFields[0].name;
  }
  return 'id';
}

/**
 * 获取节点的显示值
 * @param {any} node - 节点对象
 * @returns {string} 节点显示名称
 */
function getNodeDisplayValue(node: any): string {
  const displayField = getDisplayFieldName(node.node_type_id);
  return node[displayField] || node.id;
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {'success' | 'info' | 'warning' | 'error'} type - 消息类型
 */
const showMessage = (message: string, type: 'success' | 'info' | 'warning' | 'error') => {
  ElMessage({ message, type, duration: 3000 });
};

// 搜索框 placeholder
const searchPlaceholder = computed(() => {
  const levels = hierarchyConfigStore.sortedLevels;
  return levels.length > 0
    ? `搜索${levels.map(l => l.display_name).join('、')}...`
    : '搜索节点...';
});

/**
 * 获取根层级显示名称
 * @returns {string} 根层级名称（如"新增笔记本"）
 */
const getRootLevelName = () => {
  const rootLevel = hierarchyConfigStore.rootLevels[0];
  return rootLevel ? `新增${rootLevel.display_name}` : '新增节点';
};

/**
 * 新增根节点
 */
const handleAddRootNode = () => {
  const rootLevel = hierarchyConfigStore.rootLevels[0];
  if (rootLevel) {
    panelMode.value = 'form';
    editType.value = 'add';
    formData.value = {};
    compOptions.value = {
      levelConfig: rootLevel
    };
  }
};

/**
 * 切换节点展开/收起状态
 * @param {string} nodeId - 节点 ID
 */
const toggleHierarchyNode = (nodeId: string) => {
  systemDesignStore.toggleHierarchyNode(nodeId);
};

/**
 * 编辑节点
 * @param {HierarchyNode} node - 节点对象
 */
const editHierarchyNode = (node: HierarchyNode) => {
  console.log('[Index] editHierarchyNode 被调用，节点信息:', node);
  const levelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === node.node_type_id);
  if (levelConfig) {
    panelMode.value = 'form';
    editType.value = 'edit';
    formData.value = { id: node.id };
    compOptions.value = { levelConfig };
    selectedNode.value = node;
    console.log('[Index] formData 已设置，应该触发 NodeForm 的 watch');
  }
};

// 获取右键菜单中当前节点的子层级列表
const contextMenuChildLevelList = computed(() => {
  const node = simpleContextMenu.value.node;
  if (!node || !node.node_type_id) return [];
  return hierarchyConfigStore.getChildLevels(node.node_type_id);
});

// 判断右键菜单中当前节点的层级是否启用了通信节点列表
const contextMenuEnableCommNodeList = computed(() => {
  const node = simpleContextMenu.value.node;
  if (!node || !node.node_type_id) return false;
  const level = hierarchyConfigStore.hierarchyLevels.find(l => l.id === node.node_type_id);
  return level?.enable_comm_node_list || false;
});

// 右键菜单状态
const simpleContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null as HierarchyNode | null
});

/**
 * 显示右键菜单
 * @param {MouseEvent} event - 鼠标事件
 * @param {HierarchyNode} node - 节点对象
 */
const showHierarchyContextMenu = (event: MouseEvent, node: HierarchyNode) => {
  simpleContextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node: node
  };

  const closeMenu = () => {
    simpleContextMenu.value.visible = false;
    document.removeEventListener('click', closeMenu);
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

// Router
const router = useRouter();

/**
 * 处理右键菜单操作
 * @param {string} action - 操作类型（edit/add-child-{levelId}/add-comm-node/delete）
 */
const handleContextMenuAction = (action: string) => {
  const node = simpleContextMenu.value.node;
  if (!node) return;

  // 添加子节点
  if (action.startsWith('add-child-')) {
    const childNodeTypeId = action.replace('add-child-', '');
    const childLevelConfig = hierarchyConfigStore.hierarchyLevels.find(l => l.id === childNodeTypeId);
    if (childLevelConfig) {
      panelMode.value = 'form';
      editType.value = 'add';
      formData.value = { parentId: node.id };
      compOptions.value = { levelConfig: childLevelConfig };
      simpleContextMenu.value.visible = false;
    }
    return;
  }

  switch (action) {
    case 'edit':
      editHierarchyNode(node);
      break;
    case 'add-comm-node':
      // 跳转到流程图页面新增通信节点
      router.push({ path: '/flowchart', query: { archNodeId: node.id } });
      break;
    case 'delete': {
      systemDesignStore.deleteHierarchyNode(node.id)
        .then(() => showMessage(`"${getNodeDisplayValue(node)}"删除成功`, 'success'))
        .catch(() => showMessage('删除失败，请重试', 'error'));
      break;
    }
  }

  simpleContextMenu.value.visible = false;
};

/**
 * 提交表单后重置面板状态
 */
const submitForm = () => {
  panelMode.value = 'default';
  selectedNode.value = null;
};

// 组件挂载
onMounted(async () => {
  await hierarchyConfigStore.loadLevels();
  await systemDesignStore.loadHierarchyNodes();
});

// 组件卸载
onUnmounted(() => {
  console.log('体系配置页面已卸载');
});
</script>

<style lang="scss" src="./index.scss"></style>
