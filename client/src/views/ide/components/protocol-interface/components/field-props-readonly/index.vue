<template>
  <div class="field-props-readonly">
    <template v-if="field">
      <!-- 字段头部 -->
      <div class="field-header">
        <div class="field-header__info">
          <span
            class="field-header__icon"
            :style="{
              background: typeConfig?.icon_bg_color || 'var(--color-primary-50)',
              color: typeConfig?.icon_color || 'var(--color-primary-500)'
            }"
          >
            <el-icon><component :is="typeConfig?.icon || QuestionFilled" /></el-icon>
          </span>
          <span class="field-header__name">{{ field.field_name || '未命名字段' }}</span>
        </div>
      </div>

      <!-- 核心属性标签 -->
      <div class="field-core-tags">
        <span class="field-core-tags__tag">{{ typeConfig?.field_name || field.type }}</span>
        <span v-if="field.byte_length" class="field-core-tags__tag">{{ field.byte_length }} 字节</span>
        <span v-if="field.length" class="field-core-tags__tag">长度 {{ field.length }}</span>
        <span v-if="field.precision" class="field-core-tags__tag">{{ field.precision }}</span>
      </div>

      <!-- 属性分组列表 -->
      <div class="field-groups">
        <!-- 数值属性分组 -->
        <div v-if="numericGroup.length > 0" class="field-group field-group--numeric">
          <div class="field-group__title">数值属性</div>
          <div class="field-group__content">
            <div v-for="item in numericGroup" :key="item.key" class="field-group__item">
              <span class="field-group__label">{{ item.label }}</span>
              <span class="field-group__value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- 值映射分组 -->
        <div v-if="hasMaps" class="field-group field-group--maps">
          <div class="field-group__title">值映射</div>
          <div class="field-group__content">
            <div v-for="(map, idx) in displayMaps" :key="idx" class="field-group__map-item">
              <span class="field-group__map-key">{{ map.value }}</span>
              <span class="field-group__map-arrow">→</span>
              <span class="field-group__map-label">{{ map.label }}</span>
            </div>
            <div v-if="mapsOverflow > 0" class="field-group__map-more">
              +{{ mapsOverflow }} more...
            </div>
          </div>
        </div>

        <!-- 子字段分组 -->
        <div v-if="hasSubFields" class="field-group field-group--fields">
          <div class="field-group__title">子字段</div>
          <div class="field-group__content">
            <div class="field-group__item">
              <span class="field-group__label">子字段数量</span>
              <span class="field-group__value">{{ subFieldsCount }} 个</span>
            </div>

            <div class="field-group__subfields">
              <div
                v-for="row in flattenedSubFields"
                :key="row.key"
                class="field-group__subfield-item"
                :style="{ paddingLeft: `${row.level * 12}px` }"
              >
                <div class="field-group__subfield-main">
                  <span class="field-group__subfield-name">
                    {{ row.displayName }}
                    <span v-if="row.caseKey" class="field-group__subfield-case">
                      (case: {{ row.caseKey }})
                    </span>
                  </span>
                  <span class="field-group__subfield-type">{{ row.displayType }}</span>
                  <span class="field-group__subfield-len">
                    {{ row.displayByteLength }}
                  </span>
                </div>

                <div class="field-group__subfield-desc">
                  <template v-if="row.debugKeys">
                    无可展示字段信息（keys: {{ row.debugKeys }}）
                  </template>
                  <template v-else>
                    {{ row.displayDescription }}
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 有效性条件分组 -->
        <div v-if="hasValidWhen" class="field-group field-group--condition">
          <div class="field-group__title">有效性条件</div>
          <div class="field-group__content">
            <div class="field-group__condition">
              {{ formatValidWhen(field.valid_when) }}
            </div>
          </div>
        </div>

        <!-- 算法配置分组 -->
        <div v-if="hasAlgorithm" class="field-group field-group--algorithm">
          <div class="field-group__title">算法配置</div>
          <div class="field-group__content">
            <div class="field-group__item">
              <span class="field-group__label">校验算法</span>
              <span class="field-group__value">{{ field.algorithm }}</span>
            </div>
            <div v-if="field.range_start_ref || field.range_end_ref" class="field-group__item">
              <span class="field-group__label">校验范围</span>
              <span class="field-group__value">
                {{ field.range_start_ref || '起始' }} ~ {{ field.range_end_ref || '当前' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 其他属性分组 -->
        <div v-if="otherGroup.length > 0" class="field-group field-group--other">
          <div class="field-group__title">其他属性</div>
          <div class="field-group__content">
            <div v-for="item in otherGroup" :key="item.key" class="field-group__item">
              <span class="field-group__label">{{ item.label }}</span>
              <span class="field-group__value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="field-props-empty">
        <el-icon class="field-props-empty__icon"><Tickets /></el-icon>
        <p class="field-props-empty__text">选择一个字段查看属性</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QuestionFilled, Tickets } from '@element-plus/icons-vue';
import { fieldOptions, type FieldTypeConfig } from '@/stores/packet-field-options';

type DisplayItem = {
  key: string;
  label: string;
  value: string;
};

type SubFieldRow = {
  key: string;
  level: number;
  caseKey?: string;
  field: Record<string, any>;
  displayName: string;
  displayType: string;
  displayByteLength: string;
  displayDescription: string;
  debugKeys?: string;
};

const props = defineProps<{
  field?: Record<string, any> | null;
}>();

const field = computed(() => props.field || null);

// 获取字段类型配置
const typeConfig = computed<FieldTypeConfig | null>(() => {
  if (!field.value?.type) return null;
  return (fieldOptions as any)[field.value.type] || null;
});

/**
 * 格式化有效性条件
 * @param {any} validWhen - 有效性条件对象
 * @returns {string} 格式化后的有效性条件字符串
 */
function formatValidWhen(validWhen: any): string {
  if (!validWhen) return '';
  const fieldName = validWhen.field || validWhen.fields || '';
  const value = validWhen.value;
  if (!fieldName) return '';
  return `当 ${fieldName} = ${value} 时有效`;
}

/**
 * 判断值是否有意义
 * @param {unknown} value - 待判断的值
 * @returns {boolean} 值是否有意义
 */
function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return false;
    return entries.some(([, v]) => hasMeaningfulValue(v));
  }
  return false;
}

// 数值属性的 key 列表
const numericKeys = new Set([
  'default_value',
  'max_value',
  'min_value',
  'lsb',
  'unit',
]);

// 需要排除的 key（已在其他地方展示或不需要展示）
const excludedKeys = new Set([
  'id',
  'field_name',
  'type',
  'description',
  'byte_length',
  'length',
  'precision',
  'display_format',
  'is_required',
  'valid_when',
  'maps',
  'fields',
  'sub_fields',
  'element',
  'children',
  'cases',
  'algorithm',
  'parameters',
  'range_start_ref',
  'range_end_ref',
  'expanded',
  'parentId',
  'level',
]);

// 属性标签映射
const labelMap: Record<string, string> = {
  default_value: '默认值',
  max_value: '最大值',
  min_value: '最小值',
  lsb: '量纲',
  unit: '单位',
  encoding: '编码格式',
  is_reversed: '是否逆序',
  is_message_id: '报文标识',
  message_id_value: '标识值',
  value_type: '值类型',
  value_range: '取值范围',
  compression: '压缩算法',
  validation_regex: '输入验证',
  fill_value: '填充值',
  bit_length: '位长度',
  count: '元素个数',
  count_from_field: '长度字段',
  bytes_in_trailer: '尾部长度',
  base_type: '基础类型',
};

/**
 * 格式化值
 * @param {unknown} value - 待格式化的值
 * @param {string} [key] - 字段键名（可选）
 * @returns {string} 格式化后的字符串
 */
function formatValue(value: unknown, key?: string): string {
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (Array.isArray(value)) {
    if (key === 'value_range') {
      // 兼容两种形态：
      // 1) 新结构：[{ min, max }, ...]
      // 2) 旧结构：[min, max]
      const isObjectRangeList = value.some((v) => v && typeof v === 'object' && !Array.isArray(v));
      if (isObjectRangeList) {
        const parts = value
          .map((v: any) => {
            if (!v || typeof v !== 'object') return '';
            const min = v.min ?? '';
            const max = v.max ?? '';
            return `${min}~${max}`;
          })
          .filter((s) => s !== '');
        return parts.length > 0 ? `[${parts.join(', ')}]` : '';
      }
      if (value.length === 2) {
        return `[${value[0]}, ${value[1]}]`;
      }
      return `共 ${value.length} 项`;
    }
    return `共 ${value.length} 项`;
  }
  if (value && typeof value === 'object') {
    return '已配置';
  }
  return String(value ?? '');
}

// 数值属性分组
const numericGroup = computed<DisplayItem[]>(() => {
  const f = field.value;
  if (!f) return [];

  return Array.from(numericKeys)
    .filter((k) => hasMeaningfulValue(f[k]))
    .map((k) => ({
      key: k,
      label: labelMap[k] || k,
      value: formatValue(f[k], k),
    }));
});

// 值映射相关
const hasMaps = computed(() => {
  const f = field.value;
  return Array.isArray(f?.maps) && f!.maps.length > 0;
});

const displayMaps = computed(() => {
  if (!hasMaps.value) return [];
  return (field.value!.maps || []).slice(0, 3);
});

const mapsOverflow = computed(() => {
  if (!hasMaps.value) return 0;
  return Math.max(0, (field.value!.maps || []).length - 3);
});

// 子字段递归展平（全展开、不折叠）
const flattenedSubFields = computed<SubFieldRow[]>(() => {
  const root = field.value;
  if (!root) return [];

  const out: SubFieldRow[] = [];
  const visited = new Set<string>();

  const getFirstString = (obj: any, keys: string[]): string => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (s) return s;
    }
    return '';
  };

  const getFirstNumberLike = (obj: any, keys: string[]): string => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v === undefined || v === null) continue;
      if (typeof v === 'number') return String(v);
      const n = Number(v);
      if (Number.isFinite(n)) return String(n);
    }
    return '';
  };

  const normalizeDisplay = (node: any) => {
    const name = getFirstString(node, ['field_name', 'name', 'fieldName', 'label', 'display_name']);
    const type = getFirstString(node, ['type', 'fieldType', 'field_type', 'valueType', 'value_type', 'base_type']);
    const byteLen = getFirstNumberLike(node, ['byte_length', 'byteLength', 'byte_len']);
    const desc = getFirstString(node, ['description', 'desc', 'remark', 'comment']);

    const startBit = getFirstNumberLike(node, ['start_bit', 'startBit', 'start']);
    const endBit = getFirstNumberLike(node, ['end_bit', 'endBit', 'end']);
    const bitLen = getFirstNumberLike(node, ['bit_length', 'bitLength']);

    const maps = Array.isArray(node?.maps) ? node.maps : [];
    const mapsPreview = maps
      .slice(0, 5)
      .map((m: any) => {
        const v = m?.value ?? '';
        const meaning = m?.meaning ?? '';
        if (v === '' && meaning === '') return '';
        return `${v}→${meaning}`;
      })
      .filter((s: string) => s !== '');

    const displayName = name
      || (startBit && endBit ? `位域(${startBit}-${endBit})` : '')
      || '未命名字段';

    const displayType = type
      || (startBit || endBit || bitLen ? 'Bitfield' : '')
      || '-';

    const displayByteLength = byteLen
      ? `${byteLen} 字节`
      : (startBit && endBit ? `${startBit}-${endBit} bit` : (bitLen ? `${bitLen} bit` : '-'));

    const displayDescription = desc
      || (mapsPreview.length > 0 ? `映射：${mapsPreview.join(', ')}${maps.length > 5 ? ' ...' : ''}` : '')
      || (maps.length > 0 ? `映射：共 ${maps.length} 项` : '')
      || '-';

    return {
      displayName,
      displayType,
      displayByteLength,
      displayDescription,
    };
  };

  const makeKey = (node: any, level: number, path: string, caseKey?: string) => {
    const idPart = node?.id ? String(node.id) : '';
    const namePart = String(node?.field_name || '');
    const typePart = String(node?.type || '');
    const casePart = caseKey ? `case:${caseKey}` : '';
    return `${path}|${level}|${casePart}|${idPart}|${typePart}|${namePart}`;
  };

  const collect = (node: any, level: number, path: string) => {
    if (!node || typeof node !== 'object') return;

    const children: Array<{ child: any; caseKey?: string }> = [];

    if (Array.isArray(node.fields)) {
      for (const c of node.fields) children.push({ child: c });
    }
    if (Array.isArray(node.sub_fields)) {
      for (const c of node.sub_fields) children.push({ child: c });
    }
    if (node.element && typeof node.element === 'object') {
      children.push({ child: node.element });
    }
    if (node.cases && typeof node.cases === 'object') {
      for (const k of Object.keys(node.cases).sort()) {
        children.push({ child: (node.cases as any)[k], caseKey: k });
      }
    }

    for (let i = 0; i < children.length; i++) {
      const { child, caseKey } = children[i];
      if (!child || typeof child !== 'object') continue;
      const childPath = `${path}.${i}`;
      const key = makeKey(child, level, childPath, caseKey);
      if (visited.has(key)) continue;
      visited.add(key);
      const display = normalizeDisplay(child);
      const isAllEmpty = display.displayName === '未命名字段'
        && display.displayType === '-'
        && display.displayByteLength === '-'
        && display.displayDescription === '-';
      const debugKeys = isAllEmpty ? Object.keys(child).slice(0, 12).join(', ') : undefined;

      out.push({
        key,
        level,
        caseKey,
        field: child,
        ...display,
        debugKeys,
      });
      collect(child, level + 1, childPath);
    }
  };

  collect(root, 0, 'root');
  return out;
});

const hasSubFields = computed(() => flattenedSubFields.value.length > 0);
const subFieldsCount = computed(() => flattenedSubFields.value.length);

// 有效性条件相关
const hasValidWhen = computed(() => {
  const validWhen = field.value?.valid_when;
  if (!validWhen) return false;
  const condField = (validWhen as any).field || (validWhen as any).fields;
  return !!condField;
});

// 算法配置相关
const hasAlgorithm = computed(() => !!field.value?.algorithm);

// 其他属性分组
const otherGroup = computed<DisplayItem[]>(() => {
  const f = field.value;
  if (!f) return [];

  const otherKeys = Object.keys(f).filter((k) => {
    if (excludedKeys.has(k)) return false;
    if (numericKeys.has(k)) return false;
    return hasMeaningfulValue(f[k]);
  });

  return otherKeys.map((k) => ({
    key: k,
    label: labelMap[k] || k,
    value: formatValue(f[k], k),
  }));
});
</script>

<style lang="scss" src="./index.scss"></style>
