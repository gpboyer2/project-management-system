<template>
  <div class="editor-aside-wrapper">
    <div v-if="field" class="editor-aside-detail">
      <div class="panel-header">
        <h3 class="panel-title">
          字段属性
        </h3>

        <button class="close-btn" @click="$emit('close')">
          <i class="ri-close-line" />
        </button>
      </div>

      <div class="panel-content" data-key="editor-aside-panel-content">
        <form class="protocol-content-form">
          <!-- 只读模式：禁用整个表单，确保字段属性不可修改 -->
          <fieldset class="protocol-content-fieldset" :disabled="!!props.readonly">
          <div class="form-section">
            <div class="form-section-title">
              基本信息
            </div>

            <div class="form-group">
              <label class="form-label">
                字段名称
              </label>

              <input
                type="text"
                class="form-control"
                :value="field.fieldName || ''"
                placeholder="请输入字段名称"
                @input="
                  update({
                    path: '',
                    property: 'fieldName',
                    value: ($event.target as HTMLInputElement).value,
                  })
                "
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                字段类型
              </label>

              <div class="field-type-display">
                {{ getFieldTypeLabel(field.type || "") }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                类型属性
              </label>

              <div class="field-type-display">
                {{ getFieldTypeAttr(field.type || "") }}
              </div>
            </div>
          </div>

          <template
            v-if="
              field.type === 'SignedInt' ||
                field.type === 'UnsignedInt'
            "
          >
            <div class="form-section">
              <div class="form-section-title">
                数值类型属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  单位
                </label>

                <input
                  type="text"
                  class="form-control"
                  :value="field.unit"
                  placeholder="例如：km、kg 等"
                  @input="
                    update({
                      path: '',
                      property: 'unit',
                      value: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  取值范围
                </label>

                <div class="value-range-list">
                  <div
                    v-for="(range, idx) in field.valueRange || []"
                    :key="idx"
                    class="value-range-item"
                  >
                    <input
                      v-model.number="range.min"
                      type="number"
                      class="form-control form-control-inline"
                      placeholder="最小值"
                    />

                    <span class="range-separator">~</span>

                    <input
                      v-model.number="range.max"
                      type="number"
                      class="form-control form-control-inline"
                      placeholder="最大值"
                    />

                    <button
                      class="btn-remove"
                      type="button"
                      @click="remove({ path: 'valueRange', index: idx })"
                    >
                      <i class="ri-close-line" />
                    </button>
                  </div>

                  <button
                    class="btn-add"
                    type="button"
                    @click="
                      add({
                        path: 'valueRange',
                        item: { min: 0, max: 0 },
                      })
                    "
                  >
                    + 添加范围
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  默认值
                </label>

                <input
                  v-model.number="field.defaultValue"
                  type="number"
                  class="form-control"
                  placeholder="请输入默认值"
                />
              </div>
            </div>
          </template>

          <template v-if="field.type === 'MessageId'">
            <div class="form-section">
              <div class="form-section-title">
                报文标识属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  标识字段的数据类型
                </label>

                <el-select
                  v-model="field.valueType"
                  placeholder="请选择结构体字节对齐"
                  style="width: 150px"
                  @change="onValuetype"
                >
                  <el-option
                    v-for="item in valueTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  报文标识值
                </label>

                <input
                  v-model.number="field.messageIdValue"
                  type="number"
                  class="form-control"
                  placeholder="请输入报文标识值"
                  @change="onChangeMessageIdValue"
                />
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Float'">
            <div class="form-section">
              <div class="form-section-title">
                浮点型属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  数据精度
                </label>

                <el-select
                  v-model="field.precision"
                  placeholder="请选择数据精度"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in precisionOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  单位
                </label>

                <input
                  type="text"
                  class="form-control"
                  :value="field.unit"
                  placeholder="例如：km、kg 等"
                  @input="
                    update({
                      path: '',
                      property: 'unit',
                      value: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  默认值
                </label>

                <input
                  v-model.number="field.defaultValue"
                  type="number"
                  step="any"
                  class="form-control"
                  placeholder="请输入默认值"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  取值范围
                </label>

                <div class="value-range-list">
                  <div
                    v-for="(range, idx) in field.valueRange || []"
                    :key="idx"
                    class="value-range-item"
                  >
                    <input
                      v-model.number="range.min"
                      type="number"
                      step="any"
                      class="form-control form-control-inline"
                      placeholder="最小值"
                    />

                    <span class="range-separator">~</span>

                    <input
                      v-model.number="range.max"
                      type="number"
                      step="any"
                      class="form-control form-control-inline"
                      placeholder="最大值"
                    />

                    <button
                      class="btn-remove"
                      type="button"
                      @click="remove({ path: 'valueRange', index: idx })"
                    >
                      <i class="ri-close-line" />
                    </button>
                  </div>

                  <button
                    class="btn-add"
                    type="button"
                    @click="
                      add({
                        path: 'valueRange',
                        item: { min: 0.0, max: 0.0 },
                      })
                    "
                  >
                    + 添加范围
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Encode'">
            <div class="form-section">
              <div class="form-section-title">
                编码属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  类型
                </label>

                <el-select
                  v-model="field.baseType"
                  placeholder="请选择类型"
                  style="width: 100%"
                  @change="onValuetype"
                >
                  <el-option
                    v-for="item in valueTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  取值及含义
                </label>

                <div class="value-mapping-list">
                  <div
                    v-for="(mapping, idx) in field.maps || []"
                    :key="idx"
                    class="value-mapping-item"
                  >
                    <input
                      v-model.number="mapping.value"
                      type="number"
                      class="form-control form-control-inline"
                      placeholder="取值"
                    />

                    <input
                      v-model="mapping.meaning"
                      type="text"
                      class="form-control form-control-inline"
                      placeholder="含义"
                    />

                    <button
                      class="btn-remove"
                      type="button"
                      @click="remove({ path: 'maps', index: idx })"
                    >
                      <i class="ri-close-line" />
                    </button>
                  </div>

                  <button
                    class="btn-add"
                    type="button"
                    @click="
                      add({
                        path: 'maps',
                        item: { value: 0, meaning: '' },
                      })
                    "
                  >
                    + 添加取值
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Bcd'">
            <div class="form-section">
              <div class="form-section-title">
                BCD码属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  默认值
                </label>

                <input
                  v-model="field.defaultValue"
                  type="text"
                  class="form-control"
                  placeholder="请输入默认值(字符串)"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  取值范围
                </label>

                <div class="value-range-list">
                  <div
                    v-for="(range, idx) in field.valueRange || []"
                    :key="idx"
                    class="value-range-item"
                  >
                    <input
                      :value="range.min"
                      type="text"
                      class="form-control form-control-inline"
                      placeholder="最小值"
                      @input="
                        update({
                          path: 'valueRange.' + idx,
                          property: 'min',
                          value: ($event.target as HTMLInputElement).value,
                        })
                      "
                    />

                    <span class="range-separator">~</span>

                    <input
                      :value="range.max"
                      type="text"
                      class="form-control form-control-inline"
                      placeholder="最大值"
                      @input="
                        update({
                          path: 'valueRange.' + idx,
                          property: 'max',
                          value: ($event.target as HTMLInputElement).value,
                        })
                      "
                    />

                    <button
                      class="btn-remove"
                      type="button"
                      @click="remove({ path: 'valueRange', index: idx })"
                    >
                      <i class="ri-close-line" />
                    </button>
                  </div>

                  <button
                    class="btn-add"
                    type="button"
                    @click="
                      add({
                        path: 'valueRange',
                        item: { min: '', max: '' },
                      })
                    "
                  >
                    + 添加范围
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Timestamp'">
            <div class="form-section">
              <div class="form-section-title">
                时间戳属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  时间单位
                </label>

                <el-select
                  v-model="field.unit"
                  placeholder="请选择时间单位"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in timeOption"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Bitfield'">
            <div class="form-section">
              <div class="form-section-title">
                位域属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  字段名称及比特位起止位置
                </label>

                <div class="bitfield-list">
                  <div
                    v-for="(bitField, idx) in field.subFields || []"
                    :key="idx"
                    class="bitfield-item"
                  >
                    <div class="bitfield-header">
                      <input
                        :value="bitField.name"
                        type="text"
                        class="form-control form-control-inline"
                        placeholder="字段名称"
                        @input="
                          update({
                            path: 'subFields.' + idx,
                            property: 'name',
                            value: ($event.target as HTMLInputElement).value,
                          })
                        "
                      />

                      <input
                        v-model.number="bitField.startBit"
                        type="number"
                        class="form-control form-control-inline form-control-small"
                        placeholder="起始位"
                      />

                      <span>-</span>

                      <input
                        v-model.number="bitField.endBit"
                        type="number"
                        class="form-control form-control-inline form-control-small"
                        placeholder="结束位"
                      />

                      <button
                        class="btn-remove"
                        @click="remove({ path: 'subFields', index: idx })"
                      >
                        <i class="ri-close-line" />
                      </button>
                    </div>

                    <div class="bitfield-mapping">
                      <div
                        v-for="(mapping, mIdx) in bitField.maps || []"
                        :key="mIdx"
                        class="value-mapping-item"
                      >
                        <input
                          v-model.number="mapping.value"
                          type="number"
                          class="form-control form-control-inline"
                          placeholder="取值"
                        />

                        <input
                          v-model="mapping.meaning"
                          type="text"
                          class="form-control form-control-inline"
                          placeholder="含义"
                        />

                        <button
                          class="btn-remove"
                          type="button"
                          @click="
                            remove({
                              path: 'subFields.' + idx + '.maps',
                              index: mIdx,
                            })
                          "
                        >
                          <i class="ri-close-line" />
                        </button>
                      </div>

                      <button
                        class="btn-add btn-add-small"
                        type="button"
                        @click="
                          add({
                            path: 'subFields.' + idx + '.maps',
                            item: { value: 0, meaning: '' },
                          })
                        "
                      >
                        + 添加取值
                      </button>
                    </div>
                  </div>

                  <button
                    class="btn-add"
                    type="button"
                    @click="
                      add({
                        path: 'subFields',
                        item: { name: '', startBit: 0, endBit: 0 },
                      })
                    "
                  >
                    + 添加位域字段
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'String'">
            <div class="form-section">
              <div class="form-section-title">
                字符串属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  字符编码
                </label>

                <el-select
                  :model-value="field.encoding"
                  placeholder="请选择"
                  style="width: 100%"
                  @update:model-value="
                    (value) =>
                      update({ path: '', property: 'encoding', value: value })
                  "
                >
                  <el-option label="UTF-8(UTF-8)" value="utf8" />

                  <el-option label="国标扩展(GBK)" value="gbk" />

                  <el-option label="美国标准(ASCII)" value="ascii" />

                  <el-option label="国标(GB2312)" value="gb2312" />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  默认值
                </label>

                <input
                  type="text"
                  class="form-control"
                  :value="field.defaultValue"
                  placeholder="请输入默认值"
                  @input="
                    update({
                      path: '',
                      property: 'defaultValue',
                      value: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
              </div>
            </div>
          </template>



          <template v-if="field.type === 'Array'">
            <div class="form-section">
              <div class="form-section-title">
                数组属性
              </div>

              <div class="array-length-options">
                <div class="array-length-hint">
                  <i class="ri-information-line" />
                  以下三个属性只能选择其中之一
                </div>

                <div class="form-group">
                  <label class="form-label">
                    固定元素个数
                  </label>

                  <input
                    v-model.number="field.count"
                    type="number"
                    :disabled="isCountDisabled"
                    class="form-control"
                    placeholder="请输入元素个数"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    动态关联长度
                  </label>

                  <el-select
                    :model-value="field.countFromField"
                    placeholder="请选择引用字段名称"
                    :disabled="isCountFromFieldDisabled"
                    clearable
                    style="width: 100%"
                    @update:model-value="
                      (val) =>
                      update({
                        path: '',
                        property: 'countFromField',
                          value: val || undefined,
                      })
                    "
                  >
                    <el-option
                      v-for="item in fieldsBeforeArray"
                      :key="item.fieldName"
                      :label="item.displayName || item.fieldName"
                      :value="item.fieldName"
                    >
                      <span :style="{ paddingLeft: (item.fieldName.split('.').length - 1) * 15 + 'px' }">
                        {{ item.displayName || item.fieldName }}
                      </span>
                    </el-option>
                  </el-select>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    贪婪读取模式
                  </label>

                  <input
                    v-model.number="field.bytesInTrailer"
                    type="number"
                    class="form-control"
                    :disabled="isBytesInTrailerDisabled"
                    placeholder="请输入尾部保留字节数"
                  />
                </div>
              </div>


            </div>
          </template>

          <template v-if="field.type === 'Command'">
            <div class="form-section">
              <div class="form-section-title">
                命令字属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  基础类型
                </label>

                <el-select
                  v-model="field.baseType"
                  placeholder="请选择基础类型"
                  style="width: 100%"
                  @change="
                    update({
                      path: '',
                      property: 'baseType',
                      value: field.baseType,
                    })
                  "
                >
                  <el-option
                    label="无符号整数"
                    value="unsigned"
                  />
                  <el-option
                    label="有符号整数"
                    value="signed"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  基础长度
                </label>

                <el-select
                  v-model="field.byteLength"
                  placeholder="请选择字节长度"
                  style="width: 100%"
                  @change="
                    update({
                      path: '',
                      property: 'byteLength',
                      value: field.byteLength,
                    })
                  "
                >
                  <el-option
                    label="1字节"
                    :value="1"
                  />
                  <el-option
                    label="2字节"
                    :value="2"
                  />
                  <el-option
                    label="4字节"
                    :value="4"
                  />
                  <el-option
                    label="8字节"
                    :value="8"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  命令分支列表
                  <span class="form-label-tip">（双击命令值进行修改）</span>
                </label>

                <div class="command-cases-list">
                  <!-- 表头 -->
                  <div v-if="field.cases && Object.keys(field.cases).length > 0" class="command-cases-header">
                    <span class="command-cases-col">
                      命令值
                    </span>

                    <span class="command-cases-col">
                      子字段名称
                    </span>
                  </div>
                  <!-- 命令分支列表（根据 cases 自动生成） -->
                  <div
                    v-for="(caseField, caseKey) in field.cases || {}"
                    :key="caseKey"
                    class="command-cases-item"
                  >
                    <span 
                      class="command-cases-value"
                      :class="{ 'is-editing': editingCommandKey === caseKey }"
                      @dblclick="startEditingCommand(caseKey as string)"
                    >
                      <template v-if="editingCommandKey === caseKey">
                    <input
                      type="text"
                      class="form-control form-control-small"
                      :value="caseKey"
                      placeholder="命令值"
                          :ref="(el) => setCommandInputRef(el, caseKey as string)"
                          @blur="stopEditingCommand"
                          @keyup.enter="stopEditingCommand"
                      @change="updateCommandCaseKey(caseKey as string, ($event.target as HTMLInputElement).value)"
                    />
                      </template>
                      <template v-else>
                        <span class="command-value-text" title="双击可编辑">
                          {{ caseKey }}
                        </span>
                      </template>
                    </span>

                    <span class="command-cases-name">
                      {{ (caseField as any).fieldName || '未命名' }}
                    </span>
                  </div>
                  <!-- 无命令分支时的提示 -->
                  <div v-if="!field.cases || Object.keys(field.cases).length === 0" class="command-cases-empty">
                    暂无命令分支，请在协议列表中点击命令字的 ➕ 按钮添加
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-if="field.type === 'Checksum'">
            <div class="form-section">
              <div class="form-section-title">
                校验位属性
              </div>

              <div class="form-group">
                <label class="form-label">
                  校验算法
                </label>

                <el-select
                  v-model="field.algorithm"
                  placeholder="请选择校验算法"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in checksumAlgorithmOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  校验范围起始引用
                </label>

                <el-select
                  v-model="field.rangeStartRef"
                  placeholder="请选择起始字段（留空表示起始位置）"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in fieldsBeforeChecksum"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  校验范围结束引用
                </label>

                <el-select
                  v-model="field.rangeEndRef"
                  placeholder="请选择结束字段（留空表示本字段之前）"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in fieldsBeforeChecksum"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>

              <!-- 算法参数配置 -->
              <div v-if="currentAlgorithmParams.length > 0" class="form-group">
                <label class="form-label">
                  算法参数
                  <span class="form-label-tip">（双击参数值进行修改）</span>
                </label>

                <div class="algorithm-params-table">
                  <div class="algorithm-params-header">
                    <span class="params-col-name">
                      参数名称
                    </span>

                    <span class="params-col-value">
                      参数值
                    </span>
                  </div>

                  <div
                    v-for="param in currentAlgorithmParams"
                    :key="param.name"
                    class="algorithm-params-row"
                  >
                    <span class="params-col-name" :title="param.description">
                      {{ param.label }}
                    </span>

                    <span 
                      class="params-col-value"
                      :class="{ 'is-editing': editingParamName === param.name }"
                      @dblclick="startEditing(param.name)"
                    >
                      <template v-if="editingParamName === param.name">
                      <!-- 布尔类型：开关 -->
                      <template v-if="param.type === 'boolean'">
                          <el-select
                            :model-value="getParamValue(param.name, param.defaultValue)"
                            size="small"
                            style="width: 100%"
                            :ref="(el) => setParamInputRef(el, param.name)"
                            @update:model-value="(val) => { setParamValue(param.name, val); stopEditing(); }"
                            @blur="stopEditing"
                          >
                            <el-option :value="true" label="是" />
                            <el-option :value="false" label="否" />
                          </el-select>
                      </template>
                      <!-- 选择类型：下拉框 -->
                      <template v-else-if="param.type === 'select'">
                        <el-select
                          :model-value="getParamValue(param.name, param.defaultValue)"
                          placeholder="请选择"
                          size="small"
                          style="width: 100%"
                            :ref="(el) => setParamInputRef(el, param.name)"
                            @update:model-value="(val) => { setParamValue(param.name, val); stopEditing(); }"
                            @blur="stopEditing"
                        >
                          <el-option
                            v-for="opt in param.options"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                          />
                        </el-select>
                      </template>
                      <!-- 数字类型：数字输入框 -->
                      <template v-else-if="param.type === 'number'">
                        <input
                          type="number"
                          class="form-control form-control-small"
                          :value="getParamValue(param.name, param.defaultValue)"
                          :placeholder="param.placeholder || ''"
                            :ref="(el) => setParamInputRef(el, param.name)"
                            @blur="stopEditing"
                            @keyup.enter="stopEditing"
                          @input="setParamValue(param.name, parseFloat(($event.target as HTMLInputElement).value) || 0)"
                        />
                      </template>
                      <!-- 字符串类型：文本输入框 -->
                      <template v-else>
                        <input
                          type="text"
                          class="form-control form-control-small"
                          :value="getParamValue(param.name, param.defaultValue)"
                          :placeholder="param.placeholder || ''"
                            :ref="(el) => setParamInputRef(el, param.name)"
                            @blur="stopEditing"
                            @keyup.enter="stopEditing"
                          @input="setParamValue(param.name, ($event.target as HTMLInputElement).value)"
                        />
                        </template>
                      </template>
                      <template v-else>
                        <span class="param-value-text" title="双击可编辑">
                          {{ getParamDisplayValue(param) }}
                        </span>
                      </template>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 有效性条件区段 - 通用区段，多种字段类型共用 -->
          <template v-if="supportsValidWhen">
            <div class="form-section">
              <div class="form-section-title">
                有效性条件设置
              </div>

              <div class="form-group">
                <label class="form-label">
                  有效性条件
                </label>

                <label class="form-checkbox-label">
                  <input
                    :disabled="
                      props.fieldList && props.fieldList[0]?.fieldType ===
                        props.selectedField?.type
                        ? true
                        : false
                    "
                    type="checkbox"
                    :checked="checked"
                    @change="handleChangeData(checked)"
                  />是
                </label>
              </div>

              <div class="form-group">
                <label class="form-label">
                  引用字段名称
                </label>

                <el-select
                  :model-value="field.validWhen?.field"
                  placeholder="请选择字段名称"
                  :disabled="checked === true ? false : true"
                  style="width: 100%"
                  @change="onChangeValue"
                >
                  <el-option
                    v-for="item in fieldOptionsData"
                    :key="item.fieldName"
                    :label="item.displayName || item.fieldName"
                    :value="item.fieldName"
                  >
                    <span :style="{ paddingLeft: (item.fieldName.split('.').length - 1) * 15 + 'px' }">
                      {{ item.displayName || item.fieldName }}
                    </span>
                  </el-option>
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  引用字段值
                </label>

                <input
                  :value="field.validWhen?.value"
                  :disabled="checked === true ? false : true"
                  type="number"
                  class="form-control"
                  placeholder="请输入引用字段值"
                  @input="
                    update({
                      path: 'validWhen',
                      property: 'value',
                      value: ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value),
                    })
                  "
                />
              </div>
            </div>
          </template>

          <div class="form-section">
            <div class="form-section-title">
              描述
            </div>

            <div class="form-group">
              <textarea
                class="form-control form-control-textarea"
                rows="2"
                :value="field.description"
                placeholder="请输入字段描述"
                @input="
                  update({
                    path: '',
                    property: 'description',
                    value: ($event.target as HTMLTextAreaElement).value,
                  })
                "
              />
            </div>
          </div>
          </fieldset>
        </form>
      </div>
    </div>

    <div v-else class="editor-aside-empty">
      <div class="panel-header">
        <h3 class="panel-title">
          字段属性
        </h3>

        <button class="close-btn" @click="$emit('close')">
          <i class="ri-close-line" />
        </button>
      </div>
      
      <div class="panel-content panel-content-empty">
        <p>请点击左侧字段查看详细信息</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { ElSelect } from "element-plus";
import { fieldOptions } from "@/stores/packet-field-options";
import { usePacketConfigStore } from "@/stores/packet-config";
import { ElMessage } from "element-plus";
import { getAlgorithmParams, type AlgorithmParamDef } from "@/config/checksum-algorithm-params";

const packetStore = usePacketConfigStore();

const emit = defineEmits(["close", "update"]);

const props = defineProps<{
  selectedField?: any;
  fieldList?: any[];
  fieldIndex?: number | null;
  packetIndex: number | null;
  readonly?: boolean;
}>();
interface ByteLengthOptionData {
  fieldName: string;
  byteLength: number;
}

// 数组长度属性的禁用逻辑 - 基于当前字段的实际值
const isCountDisabled = computed(() => {
  return !!(field.value?.countFromField || field.value?.bytesInTrailer);
});
const isCountFromFieldDisabled = computed(() => {
  return !!(field.value?.count || field.value?.bytesInTrailer);
});
const isBytesInTrailerDisabled = computed(() => {
  return !!(field.value?.count || field.value?.countFromField);
});

const fieldName = ref<string>("");
const onChangeValue = (selectedFieldName: string) => {
  if (props.readonly) return;
  fieldName.value = selectedFieldName;
  if (field.value) {
    // 确保 validWhen 对象存在
    if (!field.value.validWhen) {
      field.value.validWhen = { field: '', value: null };
    }
    field.value.validWhen.field = selectedFieldName;
  }
};

// 字节长度选项
const byteLengthOptions = ref<ByteLengthOptionData[]>([
  { label: "1字节", value: 1 },
  { label: "2字节", value: 2 },
  { label: "4字节", value: 4 },
  { label: "8字节", value: 8 },
]);

interface typeOptionData {
  label: string;
  value: string;
}
const valueTypeOptions = ref<typeOptionData[]>([
  { label: "无符号整数", value: "UnsignedInt" },
  { label: "有符号整数", value: "SignedInt" },
]);

const precisionOptions = ref<typeOptionData[]>([
  { label: "4字节", value: "float" },
  { label: "8字节", value: "double" },
]);
const timeOption = ref([
  {
    label: "毫秒",
    value: "milliseconds",
  },
  {
    label: "秒",
    value: "seconds",
  },
  {
    label: "纳秒",
    value: "microseconds",
  },
  {
    label: "4字节当天毫秒数",
    value: "day-milliseconds",
  },
  {
    label: "微秒",
    value: "nanoseconds",
  },
  {
    label: "4字节当天毫秒数乘10",
    value: "day-0.1milliseconds",
  },
]);

// 校验算法选项
const checksumAlgorithmOptions = ref([
  { label: "CRC16-MODBUS", value: "crc16-modbus" },
  { label: "CRC32", value: "crc32" },
  { label: "CRC16-CCITT", value: "crc16-ccitt" },
  { label: "CRC16-XMODEM", value: "crc16-xmodem" },
  { label: "SUM8 (8位累加和)", value: "sum8" },
  { label: "SUM16 (16位累加和)", value: "sum16" },
  { label: "XOR (异或校验)", value: "xor" },
  { label: "自定义", value: "custom" },
]);

const onChangeMessageIdValue = (e) => {
  const val = e.target.value;

  const rules = {
    UnsignedInt: {
      reg: /^[1-9]\d*$/,
      msg: "请输入正整数",
    },
    SignedInt: {
      reg: /^-\d+$/,
      msg: "请输入负整数",
    },
  };

  const rule = rules[valueTypeData.value];
  if (rule && !rule.reg.test(val)) {
    ElMessage({
      type: "error",
      message: rule.msg,
    });
  }
};
const valueTypeData = ref<string>("");
const onValuetype = (value: string) => {
  valueTypeData.value = value;
};
const checked = ref<boolean>(false);

// 收集当前字段之前的所有字段（包括嵌套字段）
function getFieldsBeforeCurrent(fieldList: any[], currentFieldId: string): any[] {
  if (!Array.isArray(fieldList) || !currentFieldId) return [];

  const result: any[] = [];
  let foundCurrent = false;

  // 递归遍历字段树，收集当前字段之前的所有字段
  const traverse = (fields: any[], prefix: string = ''): boolean => {
    for (const field of fields) {
      // 如果找到了当前字段，停止收集
      if (field.id === currentFieldId) {
        foundCurrent = true;
        return true;
      }

      // 构建字段的完整路径名称
      const fullName = prefix ? `${prefix}.${field.fieldName}` : field.fieldName;

      // 添加当前字段（带完整路径）
      result.push({
        ...field,
        fieldName: fullName,
        displayName: fullName
      });

      // 递归处理嵌套字段
      if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
        // 遍历子字段
        const found = traverse(field.fields, fullName);
        if (found) return true;
      }

      // 处理数组元素
      if (field.element && field.type === 'Array') {
        const found = traverse([field.element], fullName);
        if (found) return true;
      }
    }

    return false;
  };

  traverse(fieldList);
  return result;
}

const handleChangeData = (event: boolean) => {
  if (checked.value === true) {
    // 取消勾选：禁用有效性条件
    checked.value = false;
    fieldOptionsData.value = [];
  } else {
    // 勾选：启用有效性条件
    checked.value = true;

    // 确保当前字段的 validWhen 对象存在
    if (field.value && !field.value.validWhen) {
      field.value.validWhen = { field: '', value: null };
    }

    // 获取当前字段之前的所有可引用字段（包括嵌套字段）
    if (props.fieldList && props.selectedField && props.selectedField.id) {
      const result = getFieldsBeforeCurrent(props.fieldList, props.selectedField.id);
      fieldOptionsData.value = result;
    }
  }
};

interface optionsData {
  fieldName: string;
  type: string;
  [key: string]: any;
}
const fieldOptionsData = ref<optionsData[]>([]);
const field = computed<any>(() => {
  // 优先使用直接传入的字段对象
  if (props.selectedField) {
    // 尝试找到原始对象以支持响应式修改
    if (props.selectedField.id && props.fieldList) {
      const findFieldRecursive = (fields: any[], id: string): any => {
        if (!Array.isArray(fields)) return null;
        for (const item of fields) {
          if (item.id === id) return item;
          if (item.fields && Array.isArray(item.fields)) {
            const found = findFieldRecursive(item.fields, id);
            if (found) return found;
          }
        }
        return null;
      };
      const originalField = findFieldRecursive(props.fieldList, props.selectedField.id);
      if (originalField) return originalField;
    }
    return props.selectedField;
  }

  // 向后兼容：使用索引方式
  if (props.packetIndex === null || props.packetIndex === undefined)
    return null;
  if (props.fieldIndex === null || props.fieldIndex === undefined) return null;
  const packet = packetStore.packetList?.[props.packetIndex];
  if (!packet || !Array.isArray(packet.fields)) return null;
  return packet.fields[props.fieldIndex];
});

// 监听字段变化，同步更新有效性条件的启用状态
watch(field, (newField: any) => {
  if (!newField) {
    checked.value = false;
    fieldOptionsData.value = [];
    return;
  }

  // 检查字段是否配置了有效性条件
  if (newField.validWhen && newField.validWhen.field) {
    // 如果当前字段有有效的 validWhen 配置，设置为启用状态
    checked.value = true;
    // 同时更新可引用的字段列表
    if (props.fieldList && newField.id) {
      const result = getFieldsBeforeCurrent(props.fieldList, newField.id);
      fieldOptionsData.value = result;
    }
  } else {
    // 否则设置为禁用状态
    checked.value = false;
    fieldOptionsData.value = [];
  }
}, { immediate: true });

// 获取数组字段之前的所有字段（用于动态关联长度选择）
const fieldsBeforeArray = computed(() => {
  if (!props.fieldList || !props.selectedField) return [];
  
  // 复用 getFieldsBeforeCurrent 函数获取当前字段之前的所有字段
  return getFieldsBeforeCurrent(props.fieldList, props.selectedField.id);
});

// 获取校验位之前的所有字段（用于校验范围选择）
const fieldsBeforeChecksum = computed(() => {
  if (!props.fieldList || !props.selectedField) return [];
  
  // 递归扁平化字段列表，收集所有字段的路径
  const flattenFields = (fieldList: any[], parentPath: string = ''): { label: string; value: string }[] => {
    const result: { label: string; value: string }[] = [];
    
    for (const item of fieldList) {
      // 如果遇到当前校验位字段，停止收集
      if (item.id === props.selectedField?.id) {
        break;
      }
      
      const currentPath = parentPath ? `${parentPath}.${item.fieldName}` : item.fieldName;
      
      // 添加当前字段
      result.push({
        label: parentPath ? `${currentPath} (${item.fieldName})` : item.fieldName,
        value: currentPath
      });
      
      // 如果有子字段，递归处理
      if (item.fields && Array.isArray(item.fields) && item.fields.length > 0) {
        result.push(...flattenFields(item.fields, currentPath));
      }
    }
    
    return result;
  };
  
  return flattenFields(props.fieldList);
});

// 支持有效性条件的字段类型列表
const fieldTypesSupportingValidWhen = [
  'SignedInt',
  'UnsignedInt',
  'Float',
  'Bcd',
  'Bitfield',
  'Encode',
  'String',
  'Struct',
  'Array',
  'Command'
];

// 判断当前字段类型是否支持有效性条件
const supportsValidWhen = computed(() => {
  if (!field.value || !field.value.type) return false;
  return fieldTypesSupportingValidWhen.includes(field.value.type);
});

// 获取当前选中算法的参数配置
const currentAlgorithmParams = computed<AlgorithmParamDef[]>(() => {
  if (!field.value || field.value.type !== 'Checksum' || !field.value.algorithm) {
    return [];
  }
  return getAlgorithmParams(field.value.algorithm);
});

// 获取算法参数值
function getParamValue(paramName: string, defaultValue: string | number | boolean): string | number | boolean {
  if (!field.value || !field.value.parameters) {
    return defaultValue;
  }
  const value = field.value.parameters[paramName];
  return value !== undefined ? value : defaultValue;
}

// 设置算法参数值
function setParamValue(paramName: string, value: string | number | boolean) {
  if (props.readonly) return;
  if (!field.value) return;
  
  // 初始化 parameters 对象
  if (!field.value.parameters || typeof field.value.parameters !== 'object') {
    field.value.parameters = {};
  }
  
  // 设置参数值
  field.value.parameters[paramName] = value;
}

function update(operation: { path: string; property: string; value: any }) {
  if (props.readonly) return;
  if (!field.value) return;

  // 如果 path 为空，直接修改根对象
  if (!operation.path) {
    field.value[operation.property] = operation.value;
    return;
  }

  const parts = operation.path.split(".");
  let target: any = field.value;

  const isArrayIndex = (val: string) => /^\d+$/.test(val);

  // 先根据 path 定位到目标对象（可能是数组元素，也可能是对象属性）
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (isArrayIndex(part)) {
      const idx = Number(part);
      if (!Array.isArray(target)) return; // 路径错误：期望数组
      if (!target[idx]) target[idx] = {};
      target = target[idx];
      continue;
    }

    // 对象 key：如果不存在，按下一层预测创建数组或对象
    if (target[part] === undefined || target[part] === null) {
      const next = parts[i + 1];
      target[part] = next && isArrayIndex(next) ? [] : {};
    }
    target = target[part];
  }

  // 最后在目标对象上写入属性（兼容 path 以数组索引结尾的场景）
  if (target && typeof target === "object") {
    target[operation.property] = operation.value;
  }
}

function add(operation: { path: string; item?: any }) {
  if (props.readonly) return;
  if (!field.value) return;

  const parts = operation.path.split(".");
  let target: any = field.value;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const isArrayIndex = !isNaN(parseInt(nextKey));

    // 数字 key 是数组索引
    if (!isNaN(parseInt(key))) {
      const idx = parseInt(key);
      if (!Array.isArray(target)) return;

      if (!target[idx]) target[idx] = {};
      target = target[idx];
    } else {
      // 对象 key
      if (!target[key]) {
        // 预测下一层结构：数字 → 数组；否则对象
        target[key] = isArrayIndex ? [] : {};
      }
      target = target[key];
    }
  }

  const lastKey = parts[parts.length - 1];

  if (!target[lastKey]) target[lastKey] = [];
  target[lastKey].push(operation.item || {});
}

function remove(operation: { path: string; index: number }) {
  if (props.readonly) return;
  if (!field.value) return;
  const parts = operation.path.split(".");
  let target: any = field.value;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const idx = parseInt(part);

    if (!isNaN(idx)) {
      // 数组索引
      target = target[idx];
    } else {
      // 对象 key
      if (!target[part]) return; // 没有这个 key，直接返回
      target = target[part];
    }

    if (!target) return;
  }

  const last = parts[parts.length - 1];
  if (!target[last] || !Array.isArray(target[last])) return;

  // 删除指定索引
  target[last].splice(operation.index, 1);
}

function getFieldTypeLabel(type: string): string {
  return fieldOptions[type]?.fieldName || type;
}

function getFieldTypeAttr(type: string): string {
  return fieldOptions[type]?.attr || "";
}

// 更新命令分支的命令值
function updateCommandCaseKey(oldKey: string, newKey: string) {
  if (!field.value || !field.value.cases) return;
  
  // 去除首尾空格
  const trimmedNewKey = newKey.trim();
  
  // 如果新旧键值相同，不做处理
  if (oldKey === trimmedNewKey) return;
  
  // 检查新的命令值是否为空
  if (!trimmedNewKey) {
    ElMessage.warning('命令值不能为空');
    return;
  }
  
  // 检查新的命令值是否已存在
  if (field.value.cases[trimmedNewKey]) {
    ElMessage.warning(`命令值 ${trimmedNewKey} 已存在`);
    return;
  }
  
  // 获取旧的分支数据
  const caseData = field.value.cases[oldKey];
  
  // 删除旧的 key，添加新的 key
  delete field.value.cases[oldKey];
  field.value.cases[trimmedNewKey] = caseData;
  
  // 更新 fields 数组用于 UI 显示
  field.value.fields = Object.entries(field.value.cases).map(([key, value]) => ({
    ...(value as any),
    fieldName: `[${key}] ${((value as any).fieldName || '').replace(/^\[.*?\]\s*/, '')}`.trim()
  }));
  
  ElMessage.success(`命令值已从 ${oldKey} 修改为 ${trimmedNewKey}`);
}

// 算法参数表格编辑状态管理
const editingParamName = ref<string | null>(null);
const paramInputRefs = ref<Record<string, any>>({});
const editingCommandKey = ref<string | null>(null);
const commandInputRefs = ref<Record<string, any>>({});

const setParamInputRef = (el: any, name: string) => {
  if (el) {
    paramInputRefs.value[name] = el;
  }
};

const setCommandInputRef = (el: any, key: string) => {
  if (el) {
    commandInputRefs.value[key] = el;
  }
};

const startEditing = (paramName: string) => {
  editingParamName.value = paramName;
  nextTick(() => {
    const el = paramInputRefs.value[paramName];
    if (el) {
      if (typeof el.focus === 'function') {
        el.focus();
      }
    }
  });
};

const startEditingCommand = (key: string) => {
  editingCommandKey.value = key;
  nextTick(() => {
    const el = commandInputRefs.value[key];
    if (el) {
      el.focus();
    }
  });
};

const stopEditing = () => {
  editingParamName.value = null;
};

const stopEditingCommand = () => {
  editingCommandKey.value = null;
};

const getParamDisplayValue = (param: AlgorithmParamDef) => {
  const val = getParamValue(param.name, param.defaultValue);
  if (param.type === 'boolean') {
    return val ? '是' : '否';
  }
  if (param.type === 'select') {
    const option = param.options?.find((opt) => opt.value === val);
    return option ? option.label : val;
  }
  return val;
};
</script>

<style scoped lang="scss" src="./editor-aside.scss"></style>
