/**
 *
 * 字段操作逻辑 composable
 * 处理字段查找、层级计算、拖拽添加、重排序等操作
 *
 */
import { ref, computed, nextTick, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getDefaultParams } from '@/config/checksum-algorithm-params';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { fieldOptions } from '@/stores/packet-field-options';
import { canNodeHaveChildren } from '@/utils';
import {
  findFieldNodeById,
  findFieldNodeParent,
  getFieldNodeLevel,
  toggleFieldNodeExpanded,
  collect_all_field_names,
} from '@/utils';
import { FIELD_TYPE_TO_ENGLISH } from '@/constants/field-types';
import type { PacketField, PacketData } from '@/types/packet';

export function useFieldOperations(
  packetData: (() => PacketData | null) | PacketData | null,
  readonly: (() => boolean) | boolean = false
) {
  const { confirmDelete } = useConfirmDialog();

  // 选中的字段索引
  const selectedFieldIndex = ref<number | null>(null);

  // 当前正在编辑名称的字段 ID
  const editingFieldId = ref<string | null>(null);
  const fieldNameInput = ref<HTMLInputElement | null>(null);
  const editingFieldOriginalName = ref<string>('');

  // 添加字段菜单状态
  const addFieldMenuVisible = ref(false);
  const addFieldMenuPosition = reactive({ x: 0, y: 0 });
  const addFieldMenuParentId = ref<string | null>(null);

  // 字段层级映射
  const fieldLevelMap = new Map<string, number>();

  // 计算属性：是否只读
  const isReadonly = computed(() => typeof readonly === 'function' ? readonly() : readonly);

  // 计算属性：当前报文数据
  const currentPacketData = computed(() => {
    if (typeof packetData === 'function') return packetData();
    return packetData;
  });

  /**
   * 展平的字段列表
   */
  const flattenedFields = computed(() => {
    const result: (PacketField & { level: number })[] = [];
    const fields = currentPacketData.value?.fields || [];
    fieldLevelMap.clear();

    function flatten(fieldList: PacketField[], level: number = 0) {
      for (const field of fieldList) {
        if (field.id) {
          fieldLevelMap.set(field.id, level);
        }
        result.push({ ...field, level });
        if (field.expanded && field.fields && field.fields.length > 0) {
          flatten(field.fields, level + 1);
        }
        // 编辑模式下为可包含子字段的类型添加占位符
        if (!isReadonly.value && field.expanded && canHaveChildren(field.type)) {
          result.push({
            id: `placeholder_${field.id}`,
            isPlaceholder: true,
            parentId: field.id,
            level: level + 1
          } as any);
        }
      }
    }

    flatten(fields);
    return result;
  });

  /**
   * 判断字段类型是否可以包含子字段
   */
  function canHaveChildren(type?: string): boolean {
    return canNodeHaveChildren(type, ['Struct', 'Array', 'Command']);
  }

  /**
   * 获取字段的层级
   * 使用 treeUtils.getFieldNodeLevel 工具函数
   */
  function getFieldLevel(field: PacketField): number {
    return getFieldNodeLevel(field, Object.fromEntries(fieldLevelMap));
  }

  /**
   * 递归查找字段对象
   * 使用 treeUtils.findFieldNodeById 工具函数
   */
  function findFieldById(field_list: PacketField[], field_id: string): PacketField | null {
    return findFieldNodeById(field_list, field_id);
  }

  /**
   * 查找字段的父字段信息
   * 使用 treeUtils.findFieldNodeParent 工具函数
   */
  function findFieldParentInfo(
    field_list: PacketField[],
    field_id: string
  ): { parent: PacketField } | null {
    return findFieldNodeParent(field_list, field_id);
  }

  /**
   * 切换字段展开状态
   * 使用 treeUtils.toggleFieldNodeExpanded 工具函数
   */
  function toggleFieldExpanded(fieldId: string) {
    const fields = currentPacketData.value?.fields;
    if (!fields) return;

    toggleFieldNodeExpanded(fields, fieldId);
  }

  /**
   * 开始编辑字段名称
   */
  function startEditing(field: PacketField) {
    if (isReadonly.value || !field.id) return;
    if ((field as any).field_name === undefined || (field as any).field_name === null) {
      (field as any).field_name = '';
    }
    editingFieldOriginalName.value = String((field as any).field_name || '');
    editingFieldId.value = field.id;
    nextTick(() => {
      fieldNameInput.value?.focus();
    });
  }

  /**
   * 结束编辑
   */
  function finishEditing() {
    const field_id = editingFieldId.value;
    if (!field_id || !currentPacketData.value?.fields) {
      editingFieldId.value = null;
      return;
    }

    const field = findFieldById(currentPacketData.value.fields, field_id);
    if (!field) {
      editingFieldId.value = null;
      return;
    }

    const new_name = String((field as any).field_name || '').trim();
    if (!new_name) {
      ElMessage.warning('字段名称不能为空');
      (field as any).field_name = editingFieldOriginalName.value;
      return;
    }

    const english_name_regex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!english_name_regex.test(new_name)) {
      ElMessage.warning('字段名称必须是英文，以字母开头，只能包含字母、数字和下划线');
      (field as any).field_name = editingFieldOriginalName.value;
      return;
    }

    // 检查唯一性（使用 treeUtils 工具函数）
    const name_list = collect_all_field_names(currentPacketData.value.fields);
    // 排除当前字段
    name_list.delete(editingFieldOriginalName.value);
    if (name_list.has(new_name)) {
      ElMessage.warning(`字段名称 "${new_name}" 已存在，请使用其他名称`);
      (field as any).field_name = editingFieldOriginalName.value;
      return;
    }

    (field as any).field_name = new_name;
    editingFieldId.value = null;
  }

  /**
   * 克隆字段类型（用于拖拽）
   * 使用常量和工具函数优化
   */
  function cloneFieldType(fieldType: any) {
    const field_type = fieldType?.fieldType || fieldType?.field_type || '';

    // 生成唯一字段名：同类型基名按“最大序号 + 1”递增（全局唯一，包含 struct 子字段）
    const base_name = (FIELD_TYPE_TO_ENGLISH as any)[field_type] || 'field';
    const existing_names = currentPacketData.value?.fields
      ? collect_all_field_names(currentPacketData.value.fields)
      : new Set<string>();

    const escape_regexp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escape_regexp(base_name)}(\\d+)$`);
    let max_index = 0;
    for (const name of existing_names) {
      const match = pattern.exec(name);
      if (!match) continue;
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > max_index) max_index = n;
    }
    const field_name = `${base_name}${max_index + 1}`;

    const is_container = field_type === 'Struct' || field_type === 'Array' || field_type === 'Command';

    const baseField: PacketField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field_name: field_name,
      type: field_type,
      description: '',
      byte_length: 1,
      default_value: 0,
      display_format: 'decimal',
      is_required: true,
      valid_when: { field: '', value: null },
      message_id_value: null,
      value_type: '',
      precision: null,
      unit: '',
      value_range: [],
      length: null,
      sub_fields: [],
      base_type: '',
      maps: [],
      count: null,
      cont_from_field: '',
      count_from_field: '',
      bytes_in_trailer: null,
      algorithm: '',
      parameters: {},
      expanded: is_container,
    } as any;

    // 根据字段类型设置默认值
    switch (field_type) {
      case 'SignedInt':
      case 'UnsignedInt':
        (baseField as any).byte_length = 4;
        break;
      case 'MessageId':
        (baseField as any).byte_length = 2;
        (baseField as any).value_type = 'UnsignedInt';
        break;
      case 'Float':
        (baseField as any).precision = 'float';
        break;
      case 'Bcd':
        (baseField as any).byte_length = 4;
        (baseField as any).default_value = '';
        break;
      case 'Timestamp':
        (baseField as any).byte_length = 4;
        (baseField as any).unit = 'day-milliseconds';
        break;
      case 'String':
        (baseField as any).length = 0;
        (baseField as any).encoding = 'utf8';
        (baseField as any).default_value = '';
        break;
      case 'Bitfield':
        (baseField as any).byte_length = 1;
        break;
      case 'Encode':
        (baseField as any).byte_length = 1;
        (baseField as any).base_type = 'UnsignedInt';
        break;
      case 'Command':
        (baseField as any).byte_length = 1;
        (baseField as any).base_type = 'unsigned';
        break;
      case 'Checksum':
        (baseField as any).byte_length = 2;
        (baseField as any).algorithm = 'crc16-modbus';
        (baseField as any).parameters = getDefaultParams('crc16-modbus');
        break;
      case 'Padding':
      case 'Reserved':
        (baseField as any).byte_length = 1;
        break;
    }

    return baseField;
  }

  /**
   * 向容器中添加子字段
   */
  function addFieldToContainer(parent_field: PacketField, new_field: PacketField) {
    if (parent_field.type === 'Command') {
      ElMessageBox.prompt('请输入命令值（如：0x01, 1, 等）', '添加命令分支', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '命令值不能为空'
      }).then(({ value }) => {
        if (!value || String(value).trim() === '') return;
        const cmd_value = String(value).trim();

        if (!parent_field.cases || typeof parent_field.cases !== 'object') {
          parent_field.cases = {};
        }
        if ((parent_field.cases as any)[cmd_value]) {
          ElMessage.warning(`命令值 ${cmd_value} 已存在`);
          return;
        }

        new_field.level = (parent_field.level || 0) + 1;
        new_field.parent_id = parent_field.id;

        (parent_field.cases as any)[cmd_value] = new_field;
        parent_field.fields = Object.values(parent_field.cases) as any;
        parent_field.expanded = true;
      }).catch(() => {});
      return;
    }

    if (parent_field.type === 'Array') {
      if ((parent_field as any).element || (parent_field.fields && parent_field.fields.length > 0)) {
        ElMessage.warning('数组已有元素定义，请直接编辑');
        return;
      }
      new_field.level = (parent_field.level || 0) + 1;
      new_field.parent_id = parent_field.id;
      (parent_field as any).element = new_field;
      parent_field.fields = [new_field];
      parent_field.expanded = true;
      return;
    }

    // 结构体
    if (!parent_field.fields) parent_field.fields = [];
    new_field.level = (parent_field.level || 0) + 1;
    new_field.parent_id = parent_field.id;
    parent_field.fields.push(new_field);
    parent_field.expanded = true;
  }

  /**
   * 将字段插入到扁平化索引对应的嵌套位置
   */
  function insertFieldAtFlatIndex(
    root_field_list: PacketField[],
    field_to_insert: PacketField,
    flat_index: number
  ) {
    const flat_list = flattenedFields.value;

    if (flat_index >= flat_list.length) {
      root_field_list.push(field_to_insert);
      return;
    }

    const target_item = flat_list[flat_index];
    if (!target_item) {
      root_field_list.push(field_to_insert);
      return;
    }

    // 占位符：由 handleFieldAdd 处理
    if ((target_item as any).isPlaceholder) {
      root_field_list.push(field_to_insert);
      return;
    }

    const target_field = target_item as PacketField;
    if (!target_field.id) {
      root_field_list.push(field_to_insert);
      return;
    }

    const parent_info = findFieldParentInfo(root_field_list, target_field.id);
    if (!parent_info) {
      const root_index = root_field_list.findIndex((f) => f.id === target_field.id);
      if (root_index !== -1) {
        root_field_list.splice(root_index, 0, field_to_insert);
        return;
      }
      root_field_list.push(field_to_insert);
      return;
    }

    const parent = parent_info.parent;
    if (!parent.fields) parent.fields = [];

    const child_index = parent.fields.findIndex((f: PacketField) => f.id === target_field.id);
    if (child_index !== -1) {
      parent.fields.splice(child_index, 0, field_to_insert);
      field_to_insert.level = (parent.level || 0) + 1;
      field_to_insert.parent_id = parent.id;
    } else {
      parent.fields.push(field_to_insert);
      field_to_insert.level = (parent.level || 0) + 1;
      field_to_insert.parent_id = parent.id;
    }
  }

  /**
   * 处理字段添加（拖拽）
   */
  function handleFieldAdd(evt: any) {
    if (isReadonly.value || !currentPacketData.value?.fields) return;

    const target_flat_index = evt?.newIndex;
    if (target_flat_index === undefined || target_flat_index === null) return;

    // 从拖拽元素上解析字段类型
    const source_item = evt?.item as HTMLElement | undefined;
    const field_type =
      source_item?.dataset?.fieldType ||
      source_item?.querySelector?.('.field-type')?.textContent?.trim() ||
      '';
    if (!field_type) return;

    const field_type_config = (fieldOptions as any)[field_type];
    if (!field_type_config) return;

    const new_field = cloneFieldType(field_type_config);

    const target_item = flattenedFields.value[target_flat_index];

    // 情况1：拖到占位符上
    if (target_item && (target_item as any).isPlaceholder) {
      const parent_id = (target_item as any).parentId;
      if (!parent_id) return;
      const parent_field = findFieldById(currentPacketData.value.fields, parent_id);
      if (!parent_field) return;
      addFieldToContainer(parent_field, new_field);
      return;
    }

    // 情况2：拖到现有字段位置，且其父容器为 Command
    if (target_item && (target_item as any).id) {
      const parent_info = findFieldParentInfo(currentPacketData.value.fields, (target_item as any).id);
      if (parent_info && parent_info.parent.type === 'Command') {
        addFieldToContainer(parent_info.parent, new_field);
        return;
      }
    }

    // 情况3：拖到现有字段位置或普通位置
    insertFieldAtFlatIndex(currentPacketData.value.fields, new_field, target_flat_index);
  }

  /**
   * 处理字段重排序
   */
  function handleFieldReorder(newFlattenedFields: any[]) {
    if (isReadonly.value || !currentPacketData.value?.fields) return;

    // 过滤掉占位符
    const real_fields = (newFlattenedFields || []).filter((f: any) => !f?.isPlaceholder);

    // 如果字段数量变化了，不走重排序
    const current_real_count = flattenedFields.value.filter((f: any) => !f?.isPlaceholder).length;
    // debug：必要时可临时打开日志定位拖拽问题
    if (real_fields.length !== current_real_count) {
      return;
    }

    // 重新计算层级
    const fields_with_level: any[] = [];
    let current_level = 0;

    for (const item of (newFlattenedFields || [])) {
      const updated_item = Object.assign({}, item, { level: current_level });
      fields_with_level.push(updated_item);

      if (item?.isPlaceholder) {
        current_level--;
        if (current_level < 0) current_level = 0;
        continue;
      }

      if (item?.expanded && canHaveChildren(item?.type)) {
        current_level++;
      }
    }

    const real_with_level = fields_with_level.filter((f: any) => !f?.isPlaceholder);

    // 重建层级结构
    const rebuildHierarchy = (flat_list: any[]): PacketField[] => {
      const result: PacketField[] = [];
      const stack: { field: PacketField; level: number }[] = [];

      for (const item of flat_list) {
        const level = item.level || 0;
        const field: PacketField = Object.assign({}, item);
        delete (field as any).fields;
        delete (field as any).level;
        delete (field as any).isPlaceholder;
        delete (field as any).parentId;
        field.level = level;

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          field.parent_id = undefined;
          result.push(field);
        } else {
          const parent = stack[stack.length - 1].field;
          if (!parent.fields) parent.fields = [];
          field.parent_id = parent.id;
          parent.fields.push(field);
        }

        if (canHaveChildren(field.type)) {
          stack.push({ field, level });
        }
      }

      return result;
    };

    currentPacketData.value.fields = rebuildHierarchy(real_with_level);
  }

  /**
   * 删除字段
   */
  function removeField(index: number) {
    if (isReadonly.value || !currentPacketData.value) return;

    const field = flattenedFields.value[index];
    if (!field || (field as any).isPlaceholder) return;

    function removeFromList(fieldList: PacketField[], targetId: string): boolean {
      const idx = fieldList.findIndex(f => f.id === targetId);
      if (idx > -1) {
        fieldList.splice(idx, 1);
        return true;
      }
      for (const f of fieldList) {
        if (f.fields && removeFromList(f.fields, targetId)) {
          return true;
        }
      }
      return false;
    }

    if (!field.id) return;
    const target_id = field.id;

    confirmDelete({
      title: '删除确认',
      message: '确定要删除这个字段吗？',
      onConfirm: () => {
        removeFromList(currentPacketData.value!.fields, target_id);
        selectedFieldIndex.value = null;
        ElMessage.success('已删除字段');
      }
    });
  }

  /**
   * 显示添加字段菜单
   */
  function showAddFieldMenu(event: MouseEvent, parentId: string | null) {
    if (isReadonly.value) return;
    addFieldMenuPosition.x = event.clientX;
    addFieldMenuPosition.y = event.clientY;
    addFieldMenuParentId.value = parentId;
    addFieldMenuVisible.value = true;
  }

  /**
   * 隐藏添加字段菜单
   */
  function hideAddFieldMenu() {
    addFieldMenuVisible.value = false;
  }

  /**
   * 从菜单添加字段
   */
  function addFieldFromMenu(fieldType: string) {
    if (isReadonly.value || !currentPacketData.value) return;

    const config = (fieldOptions as any)[fieldType];
    if (!config) return;

    const newField = cloneFieldType(config);

    if (addFieldMenuParentId.value) {
      const parent_field = findFieldById(currentPacketData.value.fields, addFieldMenuParentId.value);
      if (!parent_field) return;
      addFieldToContainer(parent_field, newField);
    } else {
      currentPacketData.value.fields.push(newField);
    }

    hideAddFieldMenu();
  }

  /**
   * 更新字段属性
   */
  function updateFieldProperty(fieldId: string, property: string, value: any) {
    if (isReadonly.value || !currentPacketData.value) return;

    function update(fieldList: PacketField[]): boolean {
      for (const field of fieldList) {
        if (field.id === fieldId) {
          field[property] = value;
          return true;
        }
        if (field.fields && update(field.fields)) {
          return true;
        }
        if ((field as any).element && update([(field as any).element])) {
          return true;
        }
        if (field.cases && typeof field.cases === 'object') {
          for (const case_field of Object.values(field.cases)) {
            if (update([case_field as PacketField])) return true;
          }
          return false;
        }
      }
      return false;
    }

    update(currentPacketData.value.fields);
  }

  /**
   * 双击快速添加字段
   */
  function handleFieldDoubleClick(fieldType: any) {
    if (isReadonly.value) return;
    const newField = cloneFieldType(fieldType);

    if (currentPacketData.value) {
      currentPacketData.value.fields.push(newField);
      ElMessage.success(`已添加 ${(newField as any).field_name}`);
    }
  }

  return {
    selectedFieldIndex,
    editingFieldId,
    fieldNameInput,
    editingFieldOriginalName,
    addFieldMenuVisible,
    addFieldMenuPosition,
    addFieldMenuParentId,
    flattenedFields,
    fieldLevelMap,
    canHaveChildren,
    getFieldLevel,
    findFieldById,
    findFieldParentInfo,
    toggleFieldExpanded,
    startEditing,
    finishEditing,
    cloneFieldType,
    addFieldToContainer,
    insertFieldAtFlatIndex,
    handleFieldAdd,
    handleFieldReorder,
    removeField,
    showAddFieldMenu,
    hideAddFieldMenu,
    addFieldFromMenu,
    updateFieldProperty,
    handleFieldDoubleClick,
  };
}
