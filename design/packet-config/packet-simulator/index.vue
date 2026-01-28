<template>
  <el-dialog
    v-model="visible"
    title="报文仿真预览"
    width="90%"
    top="5vh"
    custom-class="packet-simulator-dialog"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="simulator-container">
      <div class="simulator-left">
        <div class="panel-header">
          <h3>字段赋值</h3>
          <div class="header-actions">
            <el-button size="small" type="primary" link @click="resetValues">重置默认值</el-button>
          </div>
        </div>
        <div class="field-list">
          <div v-if="simulationFields.length === 0" class="empty-hint">
            暂无字段
          </div>
          <div
            v-for="(field, index) in simulationFields"
            :key="field.id"
            class="field-item"
            :class="{ 
              'active': hoveredOffset >= field.offset && hoveredOffset < field.offset + field.length,
              'selected': selectedFieldId === field.id
            }"
            :style="{ paddingLeft: `${field.level * 20}px` }"
            @mouseenter="highlightHex(field.offset, field.length)"
            @mouseleave="clearHighlight"
            @click="selectField(field)"
          >
            <div class="field-info">
              <span class="field-name" :title="field.fieldName">{{ field.fieldName }}</span>
              <span class="field-type">{{ field.type }}</span>
            </div>
            <div class="field-input">
              <!-- 根据类型显示不同的输入控件 -->
              <template v-if="isNumericType(field.type)">
                <el-input-number 
                  v-model="fieldValues[field.id]" 
                  size="small" 
                  controls-position="right"
                  :precision="field.type === 'Float' ? (field.precision === 'double' ? undefined : 2) : 0"
                  @change="recalculatePacket"
                />
              </template>
              <template v-else-if="field.type === 'String'">
                <el-input 
                  v-model="fieldValues[field.id]" 
                  size="small"
                  @input="recalculatePacket"
                />
              </template>
              <template v-else-if="field.type === 'Command'">
                 <!-- 暂时只显示值，后续支持选择 -->
                 <span class="readonly-value">Hex: {{ toHex(fieldValues[field.id]) }}</span>
              </template>
              <template v-else-if="['Padding', 'Reserved'].includes(field.type)">
                <span class="readonly-value">Padding ({{ field.length }}B)</span>
              </template>
              <template v-else>
                 <el-input 
                  v-model="fieldValues[field.id]" 
                  size="small"
                  @input="recalculatePacket"
                />
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="simulator-right">
        <div class="panel-header">
          <h3>Hex 视图 ({{ packetData.length }} bytes)</h3>
          <div class="header-info">
            <span>字节序: {{ byteOrder === 'big' ? '大端' : '小端' }}</span>
          </div>
        </div>
        <div class="hex-viewer">
          <div class="hex-header">
            <span class="offset-header">Offset</span>
            <span class="hex-col-header">00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F</span>
            <span class="ascii-col-header">ASCII</span>
          </div>
          <div class="hex-body">
            <div v-for="(row, rowIndex) in hexRows" :key="rowIndex" class="hex-row">
              <span class="offset-cell">{{ toHexAddress(rowIndex * 16) }}</span>
              <div class="hex-bytes">
                <span 
                  v-for="(byte, colIndex) in row.bytes" 
                  :key="colIndex"
                  class="byte-cell"
                  :class="{ 
                    'highlighted': isByteHighlighted(rowIndex * 16 + colIndex),
                    'field-start': isFieldStart(rowIndex * 16 + colIndex)
                  }"
                  @mouseenter="handleByteHover(rowIndex * 16 + colIndex)"
                  @mouseleave="clearHighlight"
                >
                  {{ toHexByte(byte) }}
                </span>
                <!-- 填充空位 -->
                <span v-for="n in (16 - row.bytes.length)" :key="`pad-${n}`" class="byte-cell empty"></span>
              </div>
              <div class="ascii-chars">
                <span 
                  v-for="(byte, colIndex) in row.bytes" 
                  :key="colIndex"
                  class="ascii-cell"
                  :class="{ 'highlighted': isByteHighlighted(rowIndex * 16 + colIndex) }"
                >
                  {{ toAscii(byte) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { Packet, PacketField } from '@/stores/packet-config';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  packet: Packet | null;
}>();

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 仿真字段结构（展平后，包含 offset 信息）
interface SimulationField {
  id: string;
  fieldName: string;
  type: string;
  level: number;
  offset: number;  // 字节偏移量
  length: number;  // 字节长度
  precision?: string | null;
  originalField: PacketField;
}

const simulationFields = ref<SimulationField[]>([]);
const fieldValues = ref<Record<string, any>>({});
const packetData = ref<Uint8Array>(new Uint8Array(0));
const byteOrder = computed(() => props.packet?.default_byte_order || 'big');

// Hex Viewer 交互状态
const hoveredOffset = ref<number>(-1);
const hoveredLength = ref<number>(0);
const selectedFieldId = ref<string | null>(null);

// 将 packetData 分割成 16 字节一行
const hexRows = computed(() => {
  const rows = [];
  const data = packetData.value;
  for (let i = 0; i < data.length; i += 16) {
    const chunk = data.slice(i, Math.min(i + 16, data.length));
    rows.push({ bytes: Array.from(chunk) });
  }
  return rows;
});

// 监听弹窗显示，初始化数据
watch(() => visible.value, (val) => {
  if (val && props.packet) {
    initSimulation();
  }
});

function initSimulation() {
  if (!props.packet) return;
  
  // 1. 初始化字段值
  const initialValues: Record<string, any> = {};
  
  // 递归收集默认值
  const collectDefaults = (fields: PacketField[]) => {
    fields.forEach(f => {
      // 如果有子字段，递归
      if (f.fields && f.fields.length > 0) {
        collectDefaults(f.fields);
      }
      // 如果是数组元素，暂时只处理第一个（后续支持多元素）
      if (f.element) {
        collectDefaults([f.element]);
      }
      
      // 设置默认值
      if (f.id) {
        if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
           initialValues[f.id] = f.defaultValue;
        } else {
           // 根据类型设置默认零值
           switch (f.type) {
             case 'SignedInt':
             case 'UnsignedInt':
             case 'Float':
               initialValues[f.id] = 0;
               break;
             case 'String':
               initialValues[f.id] = '';
               break;
             case 'Bitfield':
               initialValues[f.id] = 0; // 后续需要按位处理
               break;
             default:
               initialValues[f.id] = 0;
           }
        }
      }
    });
  };
  
  collectDefaults(props.packet.fields);
  fieldValues.value = initialValues;
  
  // 2. 计算报文
  recalculatePacket();
}

function resetValues() {
  initSimulation();
}

// 核心逻辑：根据字段定义和当前值，生成二进制数据
function recalculatePacket() {
  if (!props.packet) return;
  
  const fields = props.packet.fields;
  const buffer = new ArrayBuffer(1024 * 64); // 预分配 64KB
  const view = new DataView(buffer);
  let currentOffset = 0;
  const tempSimFields: SimulationField[] = [];
  const isBigEndian = byteOrder.value === 'big';

  // 递归序列化函数
  const processFields = (fieldList: PacketField[], level = 0, generateUI = true) => {
    for (const field of fieldList) {
      if (!field.id) continue;
      
      const startOffset = currentOffset;
      const value = fieldValues.value[field.id];
      
      // 处理复合类型
      if (field.type === 'Struct') {
        // 结构体本身不占空间，只是容器，但为了 UI 显示，可以记录一下
        if (field.fields) {
          processFields(field.fields, level + 1, generateUI);
        }
        continue;
      }
      
      if (field.type === 'Array') {
         // 处理数组
         let count = 1;
         if (field.count !== undefined && field.count !== null) {
           count = Number(field.count) || 1;
         }
         // 限制一下最大循环次数，防止崩溃
         count = Math.min(count, 100);
         
         for (let i = 0; i < count; i++) {
           if (field.element) {
              processFields([field.element], level + 1, generateUI && i === 0);
           } else if (field.fields) {
              processFields(field.fields, level + 1, generateUI && i === 0);
           }
         }
         continue;
      }

       if (field.type === 'Command') {
         // 命令字：通常有一个 BaseType 决定值的写入，然后根据值选择 Case
         // 这里简化：只写入 BaseType 的值
         const byteLength = field.byteLength || 1;
         writeNumber(view, currentOffset, value, byteLength, field.type === 'UnsignedInt' || field.baseType === 'unsigned', isBigEndian);
         currentOffset += byteLength;
         
         // TODO: 处理 Case 分支
         if (field.cases) {
            // 需要根据 value 找到对应的 case 并处理
            // 这里暂略，作为原型演示
         }
         
         if (generateUI) {
           tempSimFields.push({
            id: field.id,
            fieldName: field.fieldName,
            type: field.type,
            level,
            offset: startOffset,
            length: currentOffset - startOffset,
            originalField: field
          });
         }
         continue;
      }

      // 处理基本类型
      let byteLength = field.byteLength || 0;
      
      try {
        switch (field.type) {
          case 'SignedInt':
          case 'UnsignedInt':
          case 'MessageId':
          case 'Bcd': // BCD 暂时当做 Int 处理，后续完善
          case 'Encode':
             writeNumber(view, currentOffset, value, byteLength, field.type === 'UnsignedInt' || field.type === 'MessageId', isBigEndian);
             break;
             
          case 'Float':
             if (byteLength === 4) {
               view.setFloat32(currentOffset, Number(value), !isBigEndian);
             } else if (byteLength === 8) {
               view.setFloat64(currentOffset, Number(value), !isBigEndian);
             }
             break;
             
          case 'String':
             // 字符串处理
             const str = String(value || '');
             // 如果定长
             const length = field.length || str.length;
             byteLength = length; // 更新实际长度
             
             const encoder = new TextEncoder();
             const encoded = encoder.encode(str);
             for (let i = 0; i < length; i++) {
               if (i < encoded.length) {
                 view.setUint8(currentOffset + i, encoded[i]);
               } else {
                 view.setUint8(currentOffset + i, 0); // Padding
               }
             }
             break;
             
          case 'Padding':
          case 'Reserved':
             // 填充 0
             for (let i = 0; i < byteLength; i++) {
               view.setUint8(currentOffset + i, 0);
             }
             break;
             
          default:
             // 默认跳过长度
             break;
        }
      } catch (e) {
        console.error('Serialize error:', e);
      }
      
      // 更新偏移量
      currentOffset += byteLength;
      
      // 记录字段信息
      if (generateUI) {
        tempSimFields.push({
          id: field.id,
          fieldName: field.fieldName,
          type: field.type,
          level,
          offset: startOffset,
          length: byteLength,
          precision: field.precision,
          originalField: field
        });
      }
    }
  };

  processFields(fields);
  
  // 更新状态
  simulationFields.value = tempSimFields;
  packetData.value = new Uint8Array(buffer.slice(0, currentOffset));
}

function writeNumber(view: DataView, offset: number, value: any, length: number, isUnsigned: boolean, isBigEndian: boolean) {
  const num = Number(value) || 0;
  // 注意 DataView 的 setInt/Uint 方法如果不指定 endian，默认是 Big Endian
  // setInt8(byteOffset, value)
  // setInt16(byteOffset, value, littleEndian)
  const littleEndian = !isBigEndian;
  
  switch (length) {
    case 1:
      isUnsigned ? view.setUint8(offset, num) : view.setInt8(offset, num);
      break;
    case 2:
      isUnsigned ? view.setUint16(offset, num, littleEndian) : view.setInt16(offset, num, littleEndian);
      break;
    case 4:
      isUnsigned ? view.setUint32(offset, num, littleEndian) : view.setInt32(offset, num, littleEndian);
      break;
    case 8:
      isUnsigned ? view.setBigUint64(offset, BigInt(num), littleEndian) : view.setBigInt64(offset, BigInt(num), littleEndian);
      break;
  }
}

// 辅助函数
function isNumericType(type: string) {
  return ['SignedInt', 'UnsignedInt', 'Float', 'MessageId', 'Encode', 'Bcd'].includes(type);
}

function toHex(val: number) {
  return '0x' + (Number(val) || 0).toString(16).toUpperCase();
}

function toHexAddress(val: number) {
  return val.toString(16).toUpperCase().padStart(8, '0');
}

function toHexByte(val: number) {
  return val.toString(16).toUpperCase().padStart(2, '0');
}

function toAscii(val: number) {
  return (val >= 32 && val <= 126) ? String.fromCharCode(val) : '.';
}

// 高亮处理
function highlightHex(offset: number, length: number) {
  hoveredOffset.value = offset;
  hoveredLength.value = length;
}

function clearHighlight() {
  hoveredOffset.value = -1;
  hoveredLength.value = 0;
}

function isByteHighlighted(byteIndex: number) {
  if (hoveredOffset.value === -1) return false;
  return byteIndex >= hoveredOffset.value && byteIndex < hoveredOffset.value + hoveredLength.value;
}

function isFieldStart(byteIndex: number) {
   return simulationFields.value.some(f => f.offset === byteIndex);
}

function handleByteHover(byteIndex: number) {
  // 查找对应的字段
  const field = simulationFields.value.find(f => byteIndex >= f.offset && byteIndex < f.offset + f.length);
  if (field) {
    highlightHex(field.offset, field.length);
    // 可以在这里做一些交互，比如滚动左侧列表到对应字段
  } else {
    clearHighlight();
  }
}

function selectField(field: SimulationField) {
  selectedFieldId.value = field.id;
}
</script>

<style lang="scss" scoped>
.simulator-container {
  display: flex;
  height: 65vh;
  gap: 16px;
  
  .simulator-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    
    .field-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      
      .field-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f2f5;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.active {
          background-color: #e6f7ff; // 高亮背景色
        }
        
        &.selected {
           background-color: #e6f7ff;
           border-left: 3px solid #1890ff;
        }
        
        .field-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          
          .field-name {
            font-weight: 500;
            color: #303133;
          }
          
          .field-type {
            font-size: 12px;
            color: #909399;
          }
        }
        
        .field-input {
          width: 140px;
          
          .readonly-value {
             font-size: 12px;
             color: #909399;
          }
        }
      }
    }
  }
  
  .simulator-right {
    flex: 1.5;
    display: flex;
    flex-direction: column;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background-color: #fafafa;
    
    .hex-viewer {
      flex: 1;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      padding: 12px;
      background: #fff;
      
      .hex-header {
        display: flex;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
        color: #1890ff;
        font-weight: bold;
        
        .offset-header {
          width: 80px;
          margin-right: 16px;
        }
        
        .hex-col-header {
           flex: 1;
           letter-spacing: 1px;
        }
        
        .ascii-col-header {
           width: 160px;
           padding-left: 16px;
           border-left: 1px solid #eee;
        }
      }
      
      .hex-body {
        .hex-row {
          display: flex;
          height: 24px;
          line-height: 24px;
          
          &:hover {
             background-color: #f5f5f5;
          }
          
          .offset-cell {
            width: 80px;
            margin-right: 16px;
            color: #1890ff;
          }
          
          .hex-bytes {
            flex: 1;
            display: flex;
            gap: 4px; // 字节之间的间隙
            
            .byte-cell {
              width: 20px;
              text-align: center;
              color: #333;
              cursor: default;
              border-radius: 2px;
              
              &.highlighted {
                background-color: #ffd591; // 橙色高亮
                color: #000;
                font-weight: bold;
              }
              
              &.empty {
                color: transparent;
              }
            }
          }
          
          .ascii-chars {
            width: 160px;
            padding-left: 16px;
            border-left: 1px solid #eee;
            display: flex;
            
            .ascii-cell {
              width: 10px;
              text-align: center;
              color: #666;
              
              &.highlighted {
                 background-color: #ffd591;
                 color: #000;
              }
            }
          }
        }
      }
    }
  }
  
  .panel-header {
    padding: 10px 16px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #f5f7fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
    
    .header-info {
      font-size: 12px;
      color: #606266;
    }
  }
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: #909399;
}
</style>

