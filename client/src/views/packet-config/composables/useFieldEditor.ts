import { ref, nextTick, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { PacketField } from '@/stores/packet-config';

/**
 * 字段编辑器配置选项接口
 */
interface UseFieldEditorOptions {
  currentPacket: Ref<any>;
  findFieldById: (fields: PacketField[], id: string) => PacketField | null;
  findFieldParentInfo: (fieldList: PacketField[], fieldId: string) => { parent: PacketField } | null;
  collectAllFieldNames: (fields: PacketField[]) => Set<string>;
  onFieldUpdated?: () => void;
}

/**
 * 字段编辑器组合函数
 * 提供字段编辑、内联编辑、添加字段等功能
 * @param {UseFieldEditorOptions} options - 配置选项
 * @returns {Object} 包含状态和方法的响应式对象
 */
export function useFieldEditor(options: UseFieldEditorOptions) {
  const {
    currentPacket,
    findFieldById,
    findFieldParentInfo,
    collectAllFieldNames,
    onFieldUpdated,
  } = options;

  const editingCell = ref<{ fieldId: string; column: 'name' } | null>(null);
  const editingValue = ref<string | number>('');

  const addFieldMenuVisible = ref(false);
  const addFieldMenuPosition = ref({ x: 0, y: 0 });
  const addFieldTargetParentId = ref<string | null>(null);

  /**
   * 根据字段ID获取真实字段对象
   * @param {string} fieldId - 字段ID
   * @returns {PacketField | null} 字段对象，未找到时返回null
   */
  function getRealFieldById(fieldId?: string): PacketField | null {
    if (!fieldId || !currentPacket.value?.fields) return null;
    return findFieldById(currentPacket.value.fields, fieldId);
  }

  /**
   * 获取字段的实际字节长度
   * @param {string} fieldId - 字段ID
   * @returns {number | undefined} 字节长度，未定义或无效时返回undefined
   */
  function getRealFieldByteLength(fieldId?: string): number | undefined {
    const field = getRealFieldById(fieldId);
    const raw = field ? (field as any).byte_length : undefined;
    if (raw === null || raw === undefined) return undefined;
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) ? num : undefined;
  }

  /**
   * 获取字段的实际长度
   * @param {string} fieldId - 字段ID
   * @returns {number | undefined} 字段长度，未定义或无效时返回undefined
   */
  function getRealFieldLength(fieldId?: string): number | undefined {
    const field = getRealFieldById(fieldId);
    const raw = field ? (field as any).length : undefined;
    if (raw === null || raw === undefined) return undefined;
    const num = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(num) ? num : undefined;
  }

  /**
   * 设置字段的字节长度
   * @param {string} fieldId - 字段ID
   * @param {unknown} value - 新的字节长度值
   */
  function setRealFieldByteLength(fieldId: string | undefined, value: unknown) {
    const field = getRealFieldById(fieldId);
    if (!field) return;

    const numValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numValue)) return;
    if (numValue < 0) return;

    (field as any).byte_length = numValue;
  }

  /**
   * 设置字段的长度
   * @param {string} fieldId - 字段ID
   * @param {unknown} value - 新的长度值
   */
  function setRealFieldLength(fieldId: string | undefined, value: unknown) {
    const field = getRealFieldById(fieldId);
    if (!field) return;

    const numValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numValue)) return;
    if (numValue < 0) return;

    (field as any).length = numValue;
  }

  /**
   * 处理字段字节长度输入事件
   * @param {string} fieldId - 字段ID
   * @param {Event} event - 输入事件对象
   */
  function handleRealFieldByteLengthInput(fieldId: string | undefined, event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    setRealFieldByteLength(fieldId, target.value);
  }

  /**
   * 处理字段长度输入事件
   * @param {string} fieldId - 字段ID
   * @param {Event} event - 输入事件对象
   */
  function handleRealFieldLengthInput(fieldId: string | undefined, event: Event) {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    setRealFieldLength(fieldId, target.value);
  }

  /**
   * 处理字段字节长度选择事件
   * @param {string} fieldId - 字段ID
   * @param {unknown} value - 选定的字节长度值
   */
  function handleRealFieldByteLengthSelect(fieldId: string | undefined, value: unknown) {
    setRealFieldByteLength(fieldId, value);
  }

  /**
   * 开始编辑单元格
   * @param {PacketField} field - 要编辑的字段对象
   * @param {'name'} column - 要编辑的列名
   * @param {MouseEvent} event - 鼠标事件对象
   */
  function startEditCell(field: PacketField, column: 'name', event: MouseEvent) {
    event.stopPropagation();
    if (!field.id) return;

    editingCell.value = { fieldId: field.id, column };
    editingValue.value = column === 'name' ? (field as any).field_name || '' : (field as any).byte_length || 0;

    nextTick(() => {
      const input = (event.target as HTMLElement).querySelector('input') ||
                    (event.target as HTMLElement).closest('.list-cell')?.querySelector('input');
      if (input) {
        (input as HTMLInputElement).focus();
        (input as HTMLInputElement).select();
      }
    });
  }

  /**
   * 保存单元格编辑内容
   * 包含字段名验证、重名检查、父级同步更新
   */
  function saveEditCell() {
    if (!editingCell.value || !currentPacket.value?.fields) return;

    const { fieldId, column } = editingCell.value;
    const field = findFieldById(currentPacket.value.fields, fieldId);

    if (!field) {
      editingCell.value = null;
      return;
    }

    if (column === 'name') {
      const newName = String(editingValue.value).trim();

      if (!newName) {
        ElMessage.warning({ message: '字段名称不能为空', plain: true });
        return;
      }

      const englishNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      if (!englishNameRegex.test(newName)) {
        ElMessage.warning({ message: '字段名称必须是英文，以字母开头，只能包含字母、数字和下划线', plain: true });
        return;
      }

      const existingNames = collectAllFieldNames(currentPacket.value.fields);
      existingNames.delete((field as any).field_name || '');

      if (existingNames.has(newName)) {
        ElMessage.warning({ message: `字段名称 "${newName}" 已存在，请使用其他名称`, plain: true });
        return;
      }

      (field as any).field_name = newName;
    }

    // 特殊处理：如果是命令字的子字段，同步更新父字段的 cases 对象
    const parentInfo = findFieldParentInfo(currentPacket.value.fields, fieldId);
    if (parentInfo && parentInfo.parent.type === 'Command' && parentInfo.parent.cases) {
      const parentField = parentInfo.parent;
      for (const key in parentField.cases) {
        if (parentField.cases[key].id === field.id) {
          if (column === 'name') {
            parentField.cases[key].field_name = (field as any).field_name;
          }
          break;
        }
      }
    }

    editingCell.value = null;
    editingValue.value = '';
    onFieldUpdated?.();
  }

  /**
   * 取消单元格编辑
   */
  function cancelEditCell() {
    editingCell.value = null;
    editingValue.value = '';
  }

  /**
   * 处理编辑输入框的按键事件
   * @param {KeyboardEvent} event - 键盘事件对象
   */
  function handleEditKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditCell();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditCell();
    }
  }

  /**
   * 显示添加字段菜单
   * @param {MouseEvent} event - 鼠标事件对象
   * @param {string} parentId - 父字段ID
   */
  function showAddFieldMenu(event: MouseEvent, parentId: string) {
    event.stopPropagation();

    const menuWidth = 260;
    const menuHeight = 420;
    const padding = 10;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }

    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);

    addFieldMenuPosition.value = { x, y };
    addFieldTargetParentId.value = parentId;
    addFieldMenuVisible.value = true;
  }

  /**
   * 隐藏添加字段菜单
   */
  function hideAddFieldMenu() {
    addFieldMenuVisible.value = false;
    addFieldTargetParentId.value = null;
  }

  /**
   * 从菜单中选择字段类型并添加
   * @param {string} fieldType - 字段类型
   * @param {Function} addFieldToContainer - 添加字段到容器的回调函数
   * @param {Function} cloneFieldType - 克隆字段类型的回调函数
   */
  async function addFieldFromMenu(
    fieldType: string,
    addFieldToContainer: (parent: PacketField, newField: PacketField) => Promise<void>,
    cloneFieldType: (fieldType: any) => PacketField
  ) {
    const parentId = addFieldTargetParentId.value;
    hideAddFieldMenu();

    if (!currentPacket.value?.fields || !parentId) return;

    const parentField = findFieldById(currentPacket.value.fields, parentId);
    if (!parentField) return;

    const newField = cloneFieldType(fieldType);
    await addFieldToContainer(parentField, newField);
  }

  return {
    editingCell,
    editingValue,
    addFieldMenuVisible,
    addFieldMenuPosition,
    addFieldTargetParentId,
    getRealFieldById,
    getRealFieldByteLength,
    getRealFieldLength,
    setRealFieldByteLength,
    setRealFieldLength,
    handleRealFieldByteLengthInput,
    handleRealFieldLengthInput,
    handleRealFieldByteLengthSelect,
    startEditCell,
    saveEditCell,
    cancelEditCell,
    handleEditKeydown,
    showAddFieldMenu,
    hideAddFieldMenu,
    addFieldFromMenu,
  };
}

export type FieldEditorReturn = ReturnType<typeof useFieldEditor>;
