import { ref, computed, type Ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { fieldOptions } from '@/stores/packet-field-options';
import { getDefaultParams } from '@/config/checksum-algorithm-params';
import { FIELD_TYPE_TO_ENGLISH } from '@/constants/field-types';
import type { PacketField } from '@/stores/packet-config';

interface UseFieldOperationsOptions {
  currentPacket: Ref<any>;
  onFieldUpdated?: () => void;
}

/**
 * 报文字段操作组合函数
 * 提供字段的增删改查、拖拽排序、展开折叠等操作
 * @param {UseFieldOperationsOptions} options - 配置选项
 * @param {Ref<any>} options.currentPacket - 当前报文数据
 * @param {Function} options.onFieldUpdated - 字段更新时的回调函数
 * @returns {Object} 包含字段操作方法和状态的对象
 */
export function useFieldOperations(options: UseFieldOperationsOptions) {
  const { currentPacket, onFieldUpdated } = options;
  const selectedFieldIndex = ref<number | null>(null);

  /**
   * 判断字段类型是否可以包含子字段
   * @param {string} fieldType - 字段类型
   * @returns {boolean} 是否可以包含子字段
   */
  function canHaveChildren(fieldType?: string): boolean {
    return fieldType === 'Struct' || fieldType === 'Array' || fieldType === 'Command';
  }

  /**
   * 递归收集所有字段名（包括嵌套字段）
   * @param {PacketField[]} fields - 字段列表
   * @returns {Set<string>} 所有字段名的集合
   */
  function collectAllFieldNames(fields: PacketField[]): Set<string> {
    const names = new Set<string>();

    const collectFromFields = (fieldList: PacketField[]) => {
      for (const field of fieldList) {
        if ((field as any).field_name) {
          names.add((field as any).field_name);
        }
        if (field.fields && Array.isArray(field.fields)) {
          collectFromFields(field.fields);
        }
        if ((field as any).element) {
          collectFromFields([(field as any).element]);
        }
        if (field.cases && typeof field.cases === 'object') {
          for (const caseField of Object.values(field.cases)) {
            collectFromFields([caseField as PacketField]);
          }
        }
      }
    };

    collectFromFields(fields);
    return names;
  }

  /**
   * 生成唯一的英文字段名
   * @param {string} fieldType - 字段类型
   * @returns {string} 唯一的字段名
   */
  function generateUniqueFieldName(fieldType: string): string {
    if (!currentPacket.value?.fields) {
      const baseName = FIELD_TYPE_TO_ENGLISH[fieldType as keyof typeof FIELD_TYPE_TO_ENGLISH] || 'field';
      return baseName + '1';
    }

    const existingNames = collectAllFieldNames(currentPacket.value.fields);
    const baseName = FIELD_TYPE_TO_ENGLISH[fieldType as keyof typeof FIELD_TYPE_TO_ENGLISH] || 'field';
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapeRegExp(baseName)}(\\d+)$`);

    let maxIndex = 0;
    for (const name of existingNames) {
      const match = pattern.exec(name);
      if (!match) continue;
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxIndex) maxIndex = n;
    }

    return `${baseName}${maxIndex + 1}`;
  }

  /**
   * 克隆字段类型（用于拖拽）
   * @param {any} fieldType - 字段类型定义
   * @returns {PacketField} 新的字段对象
   */
  function cloneFieldType(fieldType: any): PacketField {
    const resolvedType: string = fieldType?.fieldType || fieldType?.field_type || '';
    const isContainer = resolvedType === 'Struct' ||
                        resolvedType === 'Array' ||
                        resolvedType === 'Command';

    const uniqueFieldName = generateUniqueFieldName(resolvedType);

    const baseField: PacketField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field_name: uniqueFieldName,
      type: resolvedType,
      description: '',
      byte_length: 1,
      default_value: 0,
      display_format: 'decimal',
      is_required: true,
      valid_when: {
        field: '',
        value: null,
      },
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
      bytes_in_trailer: '',
      algorithm: '',
      parameters: {},
      expanded: isContainer,
    } as any;

    // 根据字段类型设置默认值
    switch (resolvedType) {
      case 'SignedInt':
      case 'UnsignedInt':
        (baseField as any).byte_length = 4;
        break;
      case 'MessageId':
        (baseField as any).byte_length = 2;
        (baseField as any).value_type = 'UnsignedInt';
        break;
      case 'Float':
        baseField.precision = 'float';
        break;
      case 'Bcd':
        (baseField as any).byte_length = 4;
        (baseField as any).default_value = '';
        break;
      case 'Timestamp':
        (baseField as any).byte_length = 4;
        baseField.unit = 'day-milliseconds';
        break;
      case 'String':
        baseField.length = 0;
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
        baseField.algorithm = 'crc16-modbus';
        baseField.parameters = getDefaultParams('crc16-modbus');
        break;
      case 'Padding':
      case 'Reserved':
        (baseField as any).byte_length = 1;
        break;
    }

    return baseField;
  }

  /**
   * 递归查找字段对象
   * @param {PacketField[]} fields - 字段列表
   * @param {string} id - 字段ID
   * @returns {PacketField | null} 找到的字段对象，未找到返回null
   */
  function findFieldById(fields: PacketField[], id: string): PacketField | null {
    for (const f of fields) {
      if (f.id === id) return f;
      if (f.fields) {
        const found = findFieldById(f.fields, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 查找字段的父字段信息
   * @param {PacketField[]} fieldList - 字段列表
   * @param {string} fieldId - 字段ID
   * @returns {{ parent: PacketField } | null} 父字段信息，未找到返回null
   */
  function findFieldParentInfo(
    fieldList: PacketField[],
    fieldId: string
  ): { parent: PacketField } | null {
    for (const item of fieldList) {
      if (item.fields) {
        if (item.fields.some((f: PacketField) => f.id === fieldId)) {
          return { parent: item };
        }
        const result = findFieldParentInfo(item.fields, fieldId);
        if (result) return result;
      }
      if ((item as any).element && (item as any).element.id === fieldId) {
        return { parent: item };
      }
    }
    return null;
  }

  /**
   * 获取扁平化的字段列表用于显示（包含虚拟占位符）
   * @returns {any[]} 扁平化的字段列表
   */
  function getFlattenedFieldsForDisplay(): any[] {
    if (!currentPacket.value?.fields) return [];

    const flattenFields = (fields: PacketField[], level = 0): any[] => {
      const result: any[] = [];
      for (const field of fields) {
        result.push({ ...field, level });

        if (field.expanded && canHaveChildren(field.type)) {
          if (field.fields && field.fields.length > 0) {
            result.push(...flattenFields(field.fields, level + 1));
          }
          result.push({
            id: `placeholder_${field.id}`,
            isPlaceholder: true,
            parentId: field.id,
            level: level + 1,
          });
        }
      }
      return result;
    };

    return flattenFields(currentPacket.value.fields);
  }

  const flattenedFields = computed(() => getFlattenedFieldsForDisplay());

  const selectedField = computed(() => {
    if (selectedFieldIndex.value === null) return null;
    const fields = flattenedFields.value;
    if (selectedFieldIndex.value < 0 || selectedFieldIndex.value >= fields.length) return null;
    return fields[selectedFieldIndex.value];
  });

  /**
   * 选择字段
   * @param {number} flatIndex - 扁平化列表中的索引
   */
  function selectField(flatIndex: number) {
    selectedFieldIndex.value = flatIndex;
    onFieldUpdated?.();
  }

  /**
   * 切换字段展开状态
   * @param {string} fieldId - 字段ID
   */
  function toggleFieldExpanded(fieldId: string) {
    if (!currentPacket.value?.fields) return;

    const toggleInFields = (fields: PacketField[]): boolean => {
      for (const field of fields) {
        if (field.id === fieldId) {
          field.expanded = !field.expanded;
          return true;
        }
        if (field.fields && toggleInFields(field.fields)) {
          return true;
        }
      }
      return false;
    };

    toggleInFields(currentPacket.value.fields);
  }

  /**
   * 向容器中添加子字段
   * @param {PacketField} parentField - 父字段对象
   * @param {PacketField} newField - 要添加的新字段
   * @returns {Promise<void>}
   */
  async function addFieldToContainer(parentField: PacketField, newField: PacketField) {
    if (parentField.type === 'Command') {
      try {
        const commandValue = await ElMessageBox.prompt('请输入命令值（如：0x01, 1, 等）', '添加命令分支', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /.+/,
          inputErrorMessage: '命令值不能为空'
        });

        if (!commandValue.value || commandValue.value.trim() === '') return;

        const cmdValue = commandValue.value.trim();

        if (!parentField.cases || typeof parentField.cases !== 'object') {
          parentField.cases = {};
        }

        if (parentField.cases[cmdValue]) {
          ElMessage.warning({ message: `命令值 ${cmdValue} 已存在`, plain: true });
          return;
        }

        newField.level = (parentField.level || 0) + 1;
        newField.parentId = parentField.id;

        parentField.cases[cmdValue] = newField;
        parentField.fields = Object.values(parentField.cases);
      } catch (error) {
        return;
      }
    } else if (parentField.type === 'Array') {
      if (parentField.element || (parentField.fields && parentField.fields.length > 0)) {
        ElMessage.warning({ message: '数组已有元素定义，请直接编辑', plain: true });
        return;
      }
      newField.level = (parentField.level || 0) + 1;
      newField.parentId = parentField.id;
      (parentField as any).element = newField;
      parentField.fields = [newField];
    } else {
      if (!parentField.fields) parentField.fields = [];
      newField.level = (parentField.level || 0) + 1;
      newField.parentId = parentField.id;
      parentField.fields.push(newField);
    }
  }

  /**
   * 将字段插入到扁平化索引对应的嵌套位置
   * @param {PacketField[]} fields - 字段列表
   * @param {PacketField} fieldToInsert - 要插入的字段
   * @param {number} flatIndex - 扁平化列表中的索引
   */
  function insertFieldAtFlatIndex(
    fields: PacketField[],
    fieldToInsert: PacketField,
    flatIndex: number
  ) {
    const flatList = flattenedFields.value;

    // 边界检查：负数或无效索引
    if (!Number.isFinite(flatIndex) || flatIndex < 0) {
      fields.unshift(fieldToInsert);
      return;
    }

    // 边界检查：超出范围
    if (flatIndex >= flatList.length) {
      fields.push(fieldToInsert);
      return;
    }

    const targetItem = flatList[flatIndex];
    if (!targetItem) {
      fields.push(fieldToInsert);
      return;
    }

    if ((targetItem as any).isPlaceholder) {
      fields.push(fieldToInsert);
      return;
    }

    const targetField = targetItem as PacketField;
    const parentInfo = findFieldParentInfo(fields, targetField.id!);

    if (!parentInfo) {
      const rootIndex = fields.findIndex((f) => f.id === targetField.id);
      if (rootIndex !== -1) {
        fields.splice(rootIndex, 0, fieldToInsert);
      } else {
        fields.push(fieldToInsert);
      }
    } else {
      const parent = parentInfo.parent;
      if (parent.fields) {
        const childIndex = parent.fields.findIndex(
          (f: PacketField) => f.id === targetField.id
        );
        if (childIndex !== -1) {
          parent.fields.splice(childIndex, 0, fieldToInsert);
          fieldToInsert.level = (parent.level || 0) + 1;
          fieldToInsert.parentId = parent.id;
        } else {
          parent.fields.push(fieldToInsert);
          fieldToInsert.level = (parent.level || 0) + 1;
          fieldToInsert.parentId = parent.id;
        }
      }
    }
  }

  /**
   * 处理字段添加（拖拽）
   * @param {any} evt - 拖拽事件对象
   * @returns {Promise<void>}
   */
  async function handleFieldAdd(evt: any) {
    if (!currentPacket.value?.fields) return;

    const sourceItem = evt.item;
    if (!sourceItem) return;

    const targetFlatIndex = evt.newIndex;
    if (targetFlatIndex === undefined) return;

    const fieldTypeElement = sourceItem.querySelector('.field-type');
    const fieldType = fieldTypeElement?.textContent?.trim();
    if (!fieldType || !fieldOptions[fieldType]) return;

    const newField = cloneFieldType(fieldOptions[fieldType]);
    const targetItem = flattenedFields.value[targetFlatIndex];

    if (targetItem && (targetItem as any).isPlaceholder) {
      const parentId = (targetItem as any).parentId;
      if (!parentId) return;

      const parentField = findFieldById(currentPacket.value.fields, parentId);
      if (!parentField) return;

      await addFieldToContainer(parentField, newField);
      return;
    }

    if (targetItem && targetItem.id) {
      const parentInfo = findFieldParentInfo(currentPacket.value.fields, targetItem.id);
      if (parentInfo && parentInfo.parent.type === 'Command') {
        await addFieldToContainer(parentInfo.parent, newField);
        return;
      }
    }

    insertFieldAtFlatIndex(currentPacket.value.fields, newField, targetFlatIndex);
  }

  /**
   * 处理字段重新排序
   * @param {any[]} newFlattenedFields - 新的扁平化字段列表
   */
  function handleFieldReorder(newFlattenedFields: any[]) {
    if (!currentPacket.value?.fields) return;

    const realFields = newFlattenedFields.filter((f: any) => !f.isPlaceholder);
    const currentRealFieldCount = flattenedFields.value.filter((f: any) => !f.isPlaceholder).length;
    if (realFields.length !== currentRealFieldCount) return;

    const fieldsWithUpdatedLevel: any[] = [];
    let currentLevel = 0;

    for (const item of newFlattenedFields) {
      const updatedItem = { ...item, level: currentLevel };
      fieldsWithUpdatedLevel.push(updatedItem);

      if (item.isPlaceholder) {
        currentLevel--;
        if (currentLevel < 0) currentLevel = 0;
      } else if (item.expanded && canHaveChildren(item.type)) {
        currentLevel++;
      }
    }

    const realFieldsWithLevel = fieldsWithUpdatedLevel.filter((f: any) => !f.isPlaceholder);

    // 重建层级结构
    const rebuildHierarchy = (flatList: any[]): PacketField[] => {
      const result: PacketField[] = [];
      const stack: { field: PacketField; level: number }[] = [];

      for (const item of flatList) {
        const level = item.level || 0;
        const field: PacketField = {
          id: item.id,
          field_name: item.field_name,
          type: item.type,
          description: item.description,
          byte_length: item.byte_length,
          default_value: item.default_value,
          display_format: item.display_format,
          is_required: item.is_required,
          valid_when: item.valid_when,
          message_id_value: item.message_id_value,
          value_type: item.value_type,
          precision: item.precision,
          unit: item.unit,
          value_range: item.value_range,
          length: item.length,
          sub_fields: item.sub_fields,
          base_type: item.base_type,
          maps: item.maps,
          count: item.count,
          count_from_field: item.count_from_field,
          bytes_in_trailer: item.bytes_in_trailer,
          expanded: item.expanded,
          encoding: item.encoding,
          algorithm: item.algorithm,
          range_start_ref: item.range_start_ref,
          range_end_ref: item.range_end_ref,
          parameters: item.parameters,
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          result.push(field);
        } else {
          const parent = stack[stack.length - 1].field;
          if (!parent.fields) {
            parent.fields = [];
          }
          parent.fields.push(field);
        }

        if (canHaveChildren(field.type)) {
          stack.push({ field, level });
        }
      }

      return result;
    };

    currentPacket.value.fields = rebuildHierarchy(realFieldsWithLevel);
  }

  /**
   * 递归删除字段（根据字段ID）
   * @param {PacketField[]} fieldList - 字段列表
   * @param {string} fieldId - 要删除的字段ID
   * @returns {boolean} 是否成功删除
   */
  function removeFieldById(fieldList: PacketField[], fieldId: string): boolean {
    const index = fieldList.findIndex((f) => f.id === fieldId);
    if (index !== -1) {
      fieldList.splice(index, 1);
      return true;
    }

    for (const field of fieldList) {
      if (field.fields && removeFieldById(field.fields, fieldId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 基于扁平化索引删除字段
   * @param {number} flatIndex - 扁平化列表中的索引
   * @returns {Promise<void>}
   */
  async function removeFieldByFlatIndex(flatIndex: number) {
    const fields = flattenedFields.value;
    if (flatIndex < 0 || flatIndex >= fields.length) return;

    const fieldToDelete = fields[flatIndex];
    if (!fieldToDelete.id) return;

    try {
      await ElMessageBox.confirm('确定要删除这个字段吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });

      if (!currentPacket.value?.fields) return;

      const success = removeFieldById(currentPacket.value.fields, fieldToDelete.id);

      if (success) {
        if (selectedFieldIndex.value === flatIndex) {
          selectedFieldIndex.value = null;
        } else if (
          selectedFieldIndex.value !== null &&
          selectedFieldIndex.value > flatIndex
        ) {
          selectedFieldIndex.value--;
        }
      } else {
        ElMessage.error({ message: '删除字段失败', plain: true });
      }
    } catch {
      // 用户取消
    }
  }

  /**
   * 添加字段到末尾
   * @param {any} fieldType - 字段类型定义
   */
  function addFieldToEnd(fieldType: any) {
    if (!currentPacket.value) return;

    const newField = cloneFieldType(fieldType);

    if (!currentPacket.value.fields) {
      currentPacket.value.fields = [];
    }
    currentPacket.value.fields.push(newField);
    currentPacket.value.field_count = currentPacket.value.fields.length;
    selectedFieldIndex.value = currentPacket.value.fields.length - 1;
  }

  return {
    selectedFieldIndex,
    flattenedFields,
    selectedField,
    canHaveChildren,
    collectAllFieldNames,
    generateUniqueFieldName,
    cloneFieldType,
    findFieldById,
    findFieldParentInfo,
    getFlattenedFieldsForDisplay,
    selectField,
    toggleFieldExpanded,
    addFieldToContainer,
    insertFieldAtFlatIndex,
    handleFieldAdd,
    handleFieldReorder,
    removeFieldById,
    removeFieldByFlatIndex,
    addFieldToEnd,
  };
}

export type FieldOperationsReturn = ReturnType<typeof useFieldOperations>;
