/**
 *
 * 字段操作相关逻辑
 *
 */
import { ref, computed, nextTick, type Ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { PacketField } from '@/stores/packet-config';
import { getDefaultParams } from '@/config/checksum-algorithm-params';
import { FIELD_TYPE_TO_ENGLISH } from '@/constants/field-types';

/**
 * 报文字段操作组合函数
 * 提供报文字段的增删改查、选择、展开等操作
 * @param {Ref<any | null>} currentPacket - 当前报文对象
 * @returns {{
 *   selectedFieldIndex: Ref<number | null>,
 *   selectedField: Ref<any>,
 *   flattenedFields: Ref<any[]>,
 *   canHaveChildren: (fieldType?: string) => boolean,
 *   collectAllFieldNames: (fields: PacketField[]) => Set<string>,
 *   generateUniqueFieldName: (fieldType: string) => string,
 *   findFieldById: (fields: PacketField[], id: string) => PacketField | null,
 *   getRealFieldById: (fieldId?: string) => PacketField | null,
 *   findFieldParentInfo: (fieldList: PacketField[], fieldId: string) => { parent: PacketField } | null,
 *   cloneFieldType: (fieldType: any) => PacketField,
 *   addFieldToContainer: (parentField: PacketField, newField: PacketField) => Promise<void>,
 *   removeFieldById: (fieldList: PacketField[], fieldId: string) => boolean,
 *   toggleFieldExpanded: (fieldId: string) => void,
 *   selectField: (flatIndex: number, asideVisible: Ref<boolean>) => void
 * }}
 */
export function usePacketFields(currentPacket: Ref<any | null>) {
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
   * 递归收集所有字段名
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

    let counter = 1;
    let newName = `${baseName}${counter}`;

    while (existingNames.has(newName)) {
      counter++;
      newName = `${baseName}${counter}`;
    }

    return newName;
  }

  /**
   * 递归查找字段对象
   * @param {PacketField[]} fields - 字段列表
   * @param {string} id - 字段 ID
   * @returns {PacketField | null} 找到的字段对象，未找到返回 null
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
   * 根据字段 id 读写真实字段对象
   * @param {string} fieldId - 字段 ID
   * @returns {PacketField | null} 找到的字段对象，未找到返回 null
   */
  function getRealFieldById(fieldId?: string): PacketField | null {
    if (!fieldId || !currentPacket.value?.fields) return null;
    return findFieldById(currentPacket.value.fields, fieldId);
  }

  /**
   * 查找字段的父字段信息
   * @param {PacketField[]} fieldList - 字段列表
   * @param {string} fieldId - 字段 ID
   * @returns {{ parent: PacketField } | null} 父字段信息，未找到返回 null
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
   * 克隆字段类型
   * @param {any} fieldType - 字段类型对象
   * @returns {PacketField} 克隆后的字段对象
   */
  function cloneFieldType(fieldType: any): PacketField {
    const isContainer = fieldType.fieldType === 'Struct' ||
                        fieldType.fieldType === 'Array' ||
                        fieldType.fieldType === 'Command';

    const uniqueFieldName = generateUniqueFieldName(fieldType.fieldType);

    const baseField: PacketField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field_name: uniqueFieldName,
      type: fieldType.fieldType,
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
      cont_from_field: '',
      bytes_in_trailer: '',
      algorithm: '',
      parameters: {},
      expanded: isContainer,
    };

    // 根据字段类型设置默认值
    switch (fieldType.fieldType) {
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
   * 向容器中添加子字段
   * @param {PacketField} parentField - 父字段对象
   * @param {PacketField} newField - 新字段对象
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
      parentField.element = newField;
      parentField.fields = [newField];
    } else {
      if (!parentField.fields) parentField.fields = [];
      newField.level = (parentField.level || 0) + 1;
      newField.parentId = parentField.id;
      parentField.fields.push(newField);
    }
  }

  /**
   * 递归删除字段
   * @param {PacketField[]} fieldList - 字段列表
   * @param {string} fieldId - 字段 ID
   * @returns {boolean} 是否删除成功
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
   * 获取扁平化的字段列表
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
   * 切换字段展开状态
   * @param {string} fieldId - 字段 ID
   * @returns {void}
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
   * 选择字段
   * @param {number} flatIndex - 扁平化列表中的索引
   * @param {Ref<boolean>} asideVisible - 侧边栏可见状态
   * @returns {void}
   */
  function selectField(flatIndex: number, asideVisible: Ref<boolean>) {
    const fields = flattenedFields.value;
    if (flatIndex < 0 || flatIndex >= fields.length) return;

    nextTick(() => {
      selectedFieldIndex.value = flatIndex;
      if (!asideVisible.value) {
        asideVisible.value = true;
      }
    });
  }

  return {
    selectedFieldIndex,
    selectedField,
    flattenedFields,
    canHaveChildren,
    collectAllFieldNames,
    generateUniqueFieldName,
    findFieldById,
    getRealFieldById,
    findFieldParentInfo,
    cloneFieldType,
    addFieldToContainer,
    removeFieldById,
    toggleFieldExpanded,
    selectField,
  };
}
