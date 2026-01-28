<template>
  <div class="page-packet-config" tabindex="0">
    <div class="packet-config-content">
      <!-- 报文列表视图 -->
      <PacketList
        v-show="!showDetailView"
        v-model:filter-info="filterInfo"
        v-model:selected-info="selectedInfo"
        v-model:page-info="pageInfo"
        @edit-packet="editPacket"
      />
      <!-- 报文详情视图 -->
      <div v-show="showDetailView" class="packet-detail-view">
        <div class="editor-toolbar">
          <div class="toolbar-left">
            <span class="editor-mode-label" />
          </div>

          <div class="toolbar-right">
            <button
              class="toolbar-btn"
              title="保存"
              @click="savePacket"
            >
              <span class="btn-icon">
                <i class="ri-save-line" />
              </span>

              <span class="btn-text">
                保存
              </span>
            </button>

            <!-- <button
              class="toolbar-btn toolbar-btn-danger"
              title="删除"
              @click="deleteCurrentPacket"
            >
              <span class="btn-icon">
                🗑️
              </span>

              <span class="btn-text">
                删除
              </span>
            </button> -->

            <button class="toolbar-btn" title="返回" @click="cancelEdit">
              <span class="btn-icon">
                <i class="ri-arrow-left-line" />
              </span>

              <span class="btn-text">
                返回
              </span>
            </button>

            <!-- 生成代码按钮 -->
            <button
              class="toolbar-btn"
              title="代码"
              @click="handleGenerateCode"
            >
              <span class="btn-icon">
                <i class="ri-code-line" />
              </span>
              <span class="btn-text">
                代码
              </span>
            </button>

            <!-- 报文仿真按钮 -->
            <button
              class="toolbar-btn"
              title="仿真"
              @click="showSimulator"
            >
              <span class="btn-icon">
                <i class="ri-play-circle-line" />
              </span>
              <span class="btn-text">
                仿真
              </span>
            </button>

            <!-- 发布按钮 -->
            <button
              class="toolbar-btn toolbar-btn-primary"
              title="发布"
              @click="handlePublish"
            >
              <span class="btn-icon">
                <i class="ri-send-plane-line" />
              </span>
              <span class="btn-text">
                发布
              </span>
            </button>
          </div>
        </div>

        <div class="editor-container">
          <!-- 左侧面板 - 字段结构树 -->
          <div class="editor-sidebar editor-sidebar-left">
            <div class="sidebar-header">
              <h3 class="sidebar-title">
                字段结构
              </h3>
            </div>

            <div class="sidebar-content">
              <div id="field-tree" class="field-tree">
                <VueDraggable
                  :model-value="fieldTypeList"
                  :group="{ name: 'fields', pull: 'clone', put: false }"
                  :sort="false"
                  :clone="cloneFieldType"
                  class="draggable-field-tree"
                  @update:model-value="() => {}"
                >
                  <div
                    v-for="fieldType in fieldTypeList"
                    :key="fieldType.fieldType"
                    class="field-tree-item"
                    draggable="true"
                    @dblclick="addFieldToEnd(fieldType)"
                  >
                    <div
                      class="field-icon"
                      :style="{
                        color: fieldType.iconColor,
                      }"
                    >
                      <i :class="fieldType.icon" />
                    </div>

                    <div class="field-info">
                      <span class="field-name">
                        {{ fieldType.fieldName }}
                      </span>

                      <span class="field-type">
                        {{ fieldType.fieldType }}
                      </span>
                    </div>

                    <button
                      class="field-add-btn"
                      :title="`快速添加${fieldType.fieldName}到末尾`"
                      @click.stop="addFieldToEnd(fieldType)"
                    >
                      <i class="ri-add-line" />
                    </button>
                  </div>
                </VueDraggable>

                <div v-if="fieldTypeList.length === 0" class="field-tree-empty">
                  <p>暂无字段类型</p>

                  <p class="field-tree-empty-hint">
                    请检查字段配置
                  </p>
                </div>
              </div>
            </div>
          </div>
          <!-- 中间面板 - 协议内容表格 -->
          <div class="editor-main">
            <div
              v-if="currentPacket"
              class="editor-panel"
              :class="{ 'panel-collapsed': !panels.basicInfo.expanded }"
            >
              <div
                class="panel-header"
                @click="panels.basicInfo.expanded = !panels.basicInfo.expanded"
              >
                <h3 class="panel-title">
                  <i class="ri-file-info-line panel-icon" />
                  基本信息
                </h3>

                <div class="panel-header-right">
                  <!-- 收起时显示关键信息摘要 -->
                  <span v-if="!panels.basicInfo.expanded" class="panel-summary">
                    {{ currentPacket.name }} <span class="version-tag">
                      v{{ currentPacket.version }}
                    </span>
                  </span>

                  <span
                    class="panel-toggle"
                    :class="{
                      'panel-toggle-expanded': panels.basicInfo.expanded,
                    }"
                  >
                    <i class="toggle-icon">
                      {{ panels.basicInfo.expanded ? "▼" : "▶" }}
                    </i>
                  </span>
                </div>
              </div>

              <div v-show="panels.basicInfo.expanded" class="panel-content">
                <!-- 第一行：报文名称 + 协议版本 -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="packet-name">
                      报文名称
                    </label>

                    <input
                      id="packet-name"
                      v-model="currentPacket.name"
                      type="text"
                      class="form-control"
                      placeholder="请输入报文名称"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="packet-version">
                      协议版本
                    </label>

                    <input
                      id="packet-version"
                      v-model="currentPacket.version"
                      type="text"
                      class="form-control"
                      placeholder="请输入协议版本"
                      readonly
                    />
                  </div>
                </div>

                <!-- 第二行：默认字节序 + 结构体字节对齐 -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" for="packet-byte-order">
                      默认字节序
                    </label>

                    <el-select
                      id="packet-byte-order"
                      v-model="currentPacket.default_byte_order"
                      placeholder="请选择默认字节序"
                      class="form-control-select"
                    >
                      <el-option
                        v-for="item in defaultByteOrderOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="packet-alignment">
                      结构体字节对齐
                    </label>

                    <el-select
                      id="packet-alignment"
                      v-model="currentPacket.struct_alignment"
                      placeholder="请选择结构体字节对齐"
                      class="form-control-select"
                    >
                      <el-option
                        v-for="item in structAlignmentOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </div>
                </div>

                <!-- 第三行：描述 - 单独一行 -->
                <div class="form-group">
                  <label class="form-label" for="packet-description">
                    描述
                  </label>

                  <textarea
                    id="packet-description"
                    v-model="currentPacket.description"
                    class="form-control form-control-textarea"
                    rows="3"
                    placeholder="请输入报文描述"
                  />
                </div>
              </div>
            </div>

            <div
              class="editor-panel"
              :class="{ 'panel-collapsed': !panels.protocolContent.expanded }"
            >
              <div
                class="panel-header"
                @click="
                  panels.protocolContent.expanded =
                    !panels.protocolContent.expanded
                "
              >
                <h3 class="panel-title">
                  <i class="ri-table-line panel-icon" />
                  报文协议
                </h3>

                <div class="panel-header-right">
                  <span v-if="currentPacket?.fields" class="field-count">
                    共 {{ currentPacket.fields.length }} 个字段
                  </span>

                  <span
                    class="panel-toggle"
                    :class="{
                      'panel-toggle-expanded': panels.protocolContent.expanded,
                    }"
                  >
                    <i class="toggle-icon">
                      {{ panels.protocolContent.expanded ? "▼" : "▶" }}
                    </i>
                  </span>
                </div>
              </div>

              <div
                v-show="panels.protocolContent.expanded"
                class="panel-content"
              >
                <div
                  v-if="
                    currentPacket &&
                      currentPacket.fields &&
                      currentPacket.fields.length === 0
                  "
                  class="protocol-drop-zone-empty"
                >
                  <VueDraggable
                    :model-value="currentPacket.fields"
                    group="fields"
                    :animation="200"
                    ghost-class="field-ghost"
                    chosen-class="field-chosen"
                    drag-class="field-dragging"
                    class="empty-drop-zone"
                    @update:model-value="() => {}"
                    @add="handleFieldAdd"
                  >
                    <div class="drop-zone-hint">
                      <span class="drop-zone-icon">
                        📋
                      </span>

                      <p>从左侧拖拽字段到此处</p>

                      <p class="drop-zone-subhint">
                        支持拖拽调整字段顺序
                      </p>
                    </div>
                  </VueDraggable>
                </div>

                <div
                  v-else-if="
                    currentPacket &&
                      currentPacket.fields &&
                      currentPacket.fields.length > 0
                  "
                  class="protocol-content-list"
                >
                  <div class="list-item list-header">
                    <div class="list-cell header-cell drag-handle-cell" />

                    <div class="list-cell header-cell">
                      名称
                    </div>

                    <div class="list-cell header-cell">
                      类型
                    </div>

                    <div class="list-cell header-cell">
                      字节长度
                    </div>

                    <div class="list-cell header-cell action-cell">
                      操作
                    </div>
                  </div>

                  <VueDraggable
                    :model-value="flattenedFields"
                    group="fields"
                    :animation="200"
                    handle=".field-drag-handle"
                    ghost-class="field-ghost"
                    chosen-class="field-chosen"
                    drag-class="field-dragging"
                    class="field-list-draggable"
                    @update:model-value="handleFieldReorder"
                    @add="handleFieldAdd"
                  >
                    <template
                      v-for="(field, index) in flattenedFields"
                      :key="field.id || index"
                    >
                      <!-- 占位符渲染 - 极简风格，支持点击添加 -->
                      <div
                        v-if="(field as any).isPlaceholder"
                        class="placeholder-row"
                        :style="{ paddingLeft: `${((field as any).level || 0) * 20 + 40}px` }"
                        @click="showAddFieldMenu($event, (field as any).parentId)"
                      >
                        <div class="placeholder-line">
                          <span class="placeholder-icon" title="点击添加字段">
                            +
                          </span>
                        </div>
                      </div>

                      <!-- 普通字段渲染 -->
                      <div
                        v-else
                        :class="[
                          'list-item',
                          'field-item',
                          {
                            'list-item-selected': selectedFieldIndex === index,
                          },
                        ]"
                        :style="{ paddingLeft: `${(field.level || 0) * 20}px` }"
                        @click="selectField(index)"
                        @dblclick="handleFieldDoubleClick(index)"
                      >
                        <div class="list-cell drag-handle-cell">
                          <span
                            v-if="canHaveChildren(field.type)"
                            class="field-expand-toggle"
                            :class="{ expanded: field.expanded }"
                            @click.stop="toggleFieldExpanded(field.id!)"
                          >
                            {{ field.expanded ? "▼" : "▶" }}
                          </span>

                          <span class="field-drag-handle">
                            ⋮⋮
                          </span>
                        </div>

                        <div class="list-cell editable-cell name-cell" @dblclick="startEditCell(field, 'name', $event)">
                          <template v-if="editingCell?.fieldId === field.id && editingCell?.column === 'name'">
                            <input
                              v-model="editingValue"
                              type="text"
                              class="cell-input"
                              @blur="saveEditCell"
                              @keydown="handleEditKeydown"
                            />
                          </template>

                          <template v-else>
                            <span class="field-name-text">
                              {{
                                field.fieldName ||
                                  fieldOptions[field.type || ""]?.fieldName ||
                                  "未命名"
                              }}
                            </span>
                          </template>
                        </div>

                        <div class="list-cell">
                          <span
                            class="type-tag"
                            :style="{
                              backgroundColor:
                                fieldOptions[field.type || '']
                                  ?.iconBgColor || '#f5f5f5',
                              color:
                                fieldOptions[field.type || '']
                                  ?.iconColor || '#666',
                            }"
                          >
                            <i
                              :class="
                                fieldOptions[field.type || '']?.icon ||
                                  'ri-question-line'
                              "
                            />
                            {{
                              fieldOptions[field.type || ""]?.fieldName ||
                                field.type ||
                                ""
                            }}
                          </span>
                        </div>

                        <div class="list-cell length-cell">
                          <!-- Command 类型：字节长度在右侧配置，不在中间表格显示 -->
                          <template v-if="!showByteLengthInTable(field.type)">
                            <span class="field-byte-length">-</span>
                          </template>
                          <!-- 字符串类型：显示 length 输入框 -->
                          <template v-else-if="needsLengthField(field.type)">
                            <input
                              :value="getRealFieldLength(field.id)"
                              type="number"
                              min="0"
                              class="cell-input"
                              placeholder="0=变长"
                              title="请输入字符串长度，0表示变长字符串"
                              @input="handleRealFieldLengthInput(field.id, $event)"
                            />
                          </template>
                          <!-- 需要输入框的类型（任意正整数）：位域、校验位、Padding、Reserved -->
                          <template v-else-if="getByteLengthOptions(field.type) === null">
                            <input
                              :value="getRealFieldByteLength(field.id)"
                              type="number"
                              min="1"
                              class="cell-input"
                              placeholder="字节数"
                              @input="handleRealFieldByteLengthInput(field.id, $event)"
                            />
                          </template>
                          <!-- 需要下拉选择的类型 -->
                          <template v-else-if="getByteLengthOptions(field.type)?.length">
                            <el-select
                              :model-value="getRealFieldByteLength(field.id)"
                              size="small"
                              style="width: 80px"
                              placeholder="-"
                              @update:model-value="handleRealFieldByteLengthSelect(field.id, $event)"
                            >
                              <el-option
                                v-for="opt in getByteLengthOptions(field.type) || []"
                                :key="opt"
                                :label="opt"
                                :value="opt"
                              />
                            </el-select>
                          </template>
                          <!-- 其他类型不显示 -->
                          <template v-else>
                            <span class="field-byte-length">-</span>
                          </template>
                        </div>

                        <div class="list-cell action-cell">
                          <el-tooltip content="删除字段" placement="top">
                            <el-button
                              link
                              type="danger"
                              :icon="Delete"
                              @click.stop="removeFieldByFlatIndex(index)"
                            />
                          </el-tooltip>
                        </div>
                      </div>
                    </template>
                  </VueDraggable>
                </div>
              </div>
            </div>
          </div>

          <!-- 可拖动分隔条 (仅在右侧面板可见时显示) -->
          <div
            v-if="asideVisible"
            class="resizer"
            @mousedown="startResize"
          />

          <!-- 右侧面板 - 详细信息 -->
          <div
            ref="asideRef"
            class="editor-aside editor-sidebar-right"
            :class="{ 'aside-collapsed': !asideVisible }"
            :style="{ width: asideVisible ? `${asideWidth}px` : '0' }"
          >
            <EditorAside
              v-if="(selectedField || asideVisible) && currentPacket"
              :selected-field="selectedField"
              :field-list="currentPacket.fields"
              :packet-index="null"
              @close="closeAside"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 代码生成预览弹窗 -->
  <el-dialog
    v-model="codePreviewVisible"
    title="代码预览"
    width="80%"
    top="5vh"
    custom-class="code-preview-dialog"
    destroy-on-close
  >
    <div v-loading="isGeneratingCode" class="code-preview-content">
      <div v-if="generatedFiles.length > 0" class="code-viewer">
        <div class="file-list">
          <div
            v-for="(file, index) in generatedFiles"
            :key="index"
            class="file-item"
            :class="{ active: currentFileIndex === index }"
            @click="currentFileIndex = index"
          >
            <i class="ri-file-code-line"></i>
            {{ file.name }}
          </div>
        </div>
        <div class="code-content">
          <div class="code-header">
            <span>{{ generatedFiles[currentFileIndex]?.relativePath }}</span>
            <button class="copy-btn" @click="copyCode(generatedFiles[currentFileIndex]?.content)">
              <i class="ri-file-copy-line"></i> 复制
            </button>
          </div>
          <pre><code class="hljs language-cpp" v-html="highlightedCode"></code></pre>
        </div>
      </div>
      <div v-else-if="!isGeneratingCode" class="empty-state">
        暂无代码生成
      </div>
    </div>
  </el-dialog>

  <!-- 发布预览弹窗 -->
  <el-dialog
    v-model="publishDialogVisible"
    title=""
    width="80%"
    top="5vh"
    custom-class="publish-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="publish-dialog-header">
        <span class="version-info">版本: {{ currentVersion }} → {{ nextVersion }}</span>
      </div>
    </template>

    <div class="publish-dialog-content">
      <!-- 标签页 -->
      <div class="publish-tabs">
        <button
          class="publish-tab"
          :class="{ active: publishActiveTab === 'text' }"
          @click="publishActiveTab = 'text'"
        >
          文字
        </button>

        <button
          class="publish-tab"
          :class="{ active: publishActiveTab === 'topology' }"
          @click="publishActiveTab = 'topology'"
        >
          拓扑
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="publish-tab-content">
        <!-- 文字版影响分析 -->
        <div v-show="publishActiveTab === 'text'" class="impact-text-view">
          <div class="impact-section">
            <h3 class="impact-title">协议变更影响分析</h3>

            <div class="impact-list">
              <div v-for="(impact, index) in impactAnalysisList" :key="index" class="impact-item">
                <div class="impact-item-header">
                  <span class="impact-icon" :class="impact.type">
                    <i :class="impact.icon" />
                  </span>

                  <span class="impact-name">{{ impact.name }}</span>

                  <span class="impact-badge" :class="impact.level">{{ impact.levelText }}</span>
                </div>

                <div class="impact-item-desc">
                  {{ impact.description }}
                </div>

                <div v-if="impact.affectedList.length > 0" class="impact-affected">
                  <span class="affected-label">受影响组件：</span>

                  <span v-for="(item, idx) in impact.affectedList" :key="idx" class="affected-tag">
                    {{ item }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 拓扑图视图 -->
        <div v-if="publishActiveTab === 'topology'" class="impact-topology-view">
          <!-- 内嵌的拓扑图 -->
          <div ref="publishTopologyRef" class="publish-topology-canvas">
            <!-- 导航条 -->
            <div class="publish-navbar">
              <div class="publish-nav-item" @click="publishShowLevel0">
                体系全景
              </div>

              <template v-if="publishCurrentView === 'l2'">
                <div class="publish-nav-arrow">
                  &gt;
                </div>

                <div class="publish-nav-item">
                  智能汽车 (内部交互)
                </div>
              </template>
            </div>

            <!-- SVG连线层 -->
            <svg ref="publishSvgLayerRef" class="publish-svg-layer" />

            <!-- 节点层 -->
            <div class="publish-node-layer">
              <!-- Level 0 视图 -->
              <template v-if="publishCurrentView === 'l0'">
                <div
                  v-for="node in publishL0Nodes"
                  :id="'publish-' + node.id"
                  :key="node.id"
                  class="publish-node publish-l0-system"
                  :class="{ 'publish-affected': publishAffectedNodeList.includes(node.id) }"
                  :style="{ left: (node.x - 70) + 'px', top: (node.y - 40) + 'px' }"
                  @dblclick="node.id === 'sys_car' ? publishShowLevel2() : null"
                >
                  <div>{{ node.name }}</div>

                  <div class="publish-node-hint">
                    [双击钻取]
                  </div>
                </div>
              </template>

              <!-- Level 2 视图 -->
              <template v-if="publishCurrentView === 'l2'">
                <!-- 外部上下文节点 -->
                <div
                  v-for="node in publishL2Context"
                  :id="'publish-' + node.id"
                  :key="node.id"
                  class="publish-node publish-context-node"
                  :class="{ 'publish-affected': publishAffectedNodeList.includes(node.id) }"
                  :style="{ left: (node.x - 50) + 'px', top: (node.y - 30) + 'px' }"
                >
                  <div class="publish-context-label">
                    外部系统
                  </div>

                  <div>{{ node.name }}</div>
                </div>

                <!-- 系统边界框 -->
                <div class="publish-system-boundary">
                  <div class="publish-boundary-label">
                    智能汽车 (System Boundary)
                  </div>
                </div>

                <!-- 内部硬件节点 -->
                <div
                  v-for="hw in publishL2Hardware"
                  :id="'publish-' + hw.id"
                  :key="hw.id"
                  class="publish-node publish-internal-hardware"
                  :class="{ 'publish-affected': publishAffectedNodeList.includes(hw.id) }"
                  :style="{ left: hw.x + 'px', top: hw.y + 'px' }"
                >
                  <div class="publish-hw-header">
                    {{ hw.name }}
                  </div>

                  <!-- 内部软件 -->
                  <div
                    v-for="sw in getPublishSoftwareByHardware(hw.id)"
                    :id="'publish-' + sw.id"
                    :key="sw.id"
                    class="publish-internal-software"
                    :class="{ 'publish-affected': publishAffectedNodeList.includes(sw.id) }"
                  >
                    {{ sw.name }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="publish-dialog-footer">
        <button class="btn btn-secondary" @click="publishDialogVisible = false">
          取消
        </button>

        <button class="btn btn-primary" @click="confirmPublish">
          确认发布
        </button>
      </div>
    </template>
  </el-dialog>

  <!-- 报文仿真弹窗 -->
  <PacketSimulator
    v-model="simulatorVisible"
    :packet="currentPacket"
  />

  <!-- 添加字段菜单 -->
  <Teleport to="body">
    <div
      v-if="addFieldMenuVisible"
      class="add-field-menu-overlay"
      @click="hideAddFieldMenu"
    >
      <div
        class="add-field-menu"
        :style="{ left: addFieldMenuPosition.x + 'px', top: addFieldMenuPosition.y + 'px' }"
        @click.stop
      >
        <div class="add-field-menu-header">
          选择字段类型
        </div>

        <div class="add-field-menu-list">
          <div
            v-for="fieldType in fieldTypeList"
            :key="fieldType.fieldType"
            class="add-field-menu-item"
            @click="addFieldFromMenu(fieldType.fieldType)"
          >
            <i 
              :class="fieldType.icon" 
              :style="{ 
                color: fieldType.iconColor,
                backgroundColor: fieldType.iconBgColor 
              }"
            />

            <div class="menu-item-content">
              <span class="menu-item-title">
                {{ fieldType.fieldName }}
              </span>

              <span class="menu-item-desc">
                {{ fieldType.attr.split('，')[0] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, provide, nextTick, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import 'highlight.js/styles/vs.css';

// 注册 C++ 语言支持
hljs.registerLanguage('cpp', cpp);

import {
  usePacketConfigStore,
  type Packet,
  type PacketField,
} from "@/stores/packet-config";
import { fieldOptions } from "@/stores/packet-field-options";
import { getDefaultParams } from "@/config/checksum-algorithm-params";
import EditorAside from "./packet-detail-editor/editor-aside.vue";
import PacketList from "./packet-list/index.vue";
import PacketSimulator from "./packet-simulator/index.vue";
import { VueDraggable } from "vue-draggable-plus";
import { postMessageCreate, getMessageDetail, putMessageUpdate, generateMessageCode } from "@/api/messageManagement";

const route = useRoute();
const router = useRouter();
const packetStore = usePacketConfigStore();

// 字段类型显示顺序（高频优先）
const ORDERED_FIELD_TYPES = [
  // 1. 基础数据类型
  'UnsignedInt', 'SignedInt', 'Float',
  // 2. 复杂/特定类型
  'String', 'Bcd', 'Timestamp', 'Bitfield', 'Encode',
  // 3. 结构化类型
  'Array', 'Struct',
  // 4. 特殊控制字段
  'MessageId', 'Command', 'Checksum', 'Padding', 'Reserved'
];

const fieldTypeList = computed(() => {
  const options = Object.values(fieldOptions);
  return options.sort((a, b) => {
    const indexA = ORDERED_FIELD_TYPES.indexOf(a.fieldType);
    const indexB = ORDERED_FIELD_TYPES.indexOf(b.fieldType);
    
    // 如果都在列表中，按列表顺序
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // 如果a在列表中，a排前
    if (indexA !== -1) return -1;
    // 如果b在列表中，b排前
    if (indexB !== -1) return 1;
    // 都不在列表中，按名称排序（保底）
    return a.fieldName.localeCompare(b.fieldName);
  });
});

const showDetailView = ref(false);
const currentPacket = ref<Packet | null>(null);
const selectedFieldIndex = ref<number | null>(null);
const hasUnsavedChanges = ref(false); // 追踪是否有未保存的更改
const lastSavedPacket = ref<string>(''); // 保存最后一次保存的报文状态
const asideVisible = ref(true); // 右边栏是否可见(默认开启)
const asideWidth = ref(420); // 右侧面板宽度 (默认420px)
const asideRef = ref<HTMLElement | null>(null); // 右侧面板的DOM引用
const isResizing = ref(false); // 是否正在拖动调整大小

// 代码预览相关
const codePreviewVisible = ref(false);
const isGeneratingCode = ref(false);
const generatedFiles = ref<Array<{ name: string; relativePath: string; content: string }>>([]);
const currentFileIndex = ref(0);

// 报文仿真相关
const simulatorVisible = ref(false);

function showSimulator() {
  if (!currentPacket.value) {
    ElMessage.warning('请先选择或创建一个报文');
    return;
  }
  simulatorVisible.value = true;
}

// ========== 发布对话框相关 ==========
const publishDialogVisible = ref(false);
const publishActiveTab = ref<'text' | 'topology'>('text');
const publishCurrentView = ref<'l0' | 'l2'>('l0');
const publishAffectedNodeList = ref<string[]>([]);
const publishTopologyRef = ref<HTMLElement>();
const publishSvgLayerRef = ref<SVGSVGElement>();

// 版本信息
const currentVersion = ref('0.1');
const nextVersion = ref('0.2');

// 拓扑数据
const publishL0Nodes = ref([
  { id: 'sys_car', name: '智能汽车', x: 400, y: 250 },
  { id: 'sys_cloud', name: '车企云平台', x: 400, y: 80 },
  { id: 'sys_app', name: '手机 App', x: 650, y: 250 }
]);

const publishL2Context = ref([
  { id: 'ctx_cloud', name: '车企云平台', x: 400, y: 40 },
  { id: 'ctx_app', name: '手机 App', x: 700, y: 220 }
]);

const publishL2Hardware = ref([
  { id: 'hw_cockpit', name: '座舱域控制器 (8295)', x: 120, y: 150 },
  { id: 'hw_adas', name: '智驾域控制器 (Orin)', x: 120, y: 320 },
  { id: 'hw_gateway', name: '中央网关 (NXP)', x: 400, y: 150 }
]);

const publishL2Software = ref([
  { id: 'sw_hmi', name: 'HMI 交互界面', parent: 'hw_cockpit' },
  { id: 'sw_nav', name: '导航引擎', parent: 'hw_cockpit' },
  { id: 'sw_plan', name: '规划控制算法', parent: 'hw_adas' },
  { id: 'sw_percept', name: '视觉感知', parent: 'hw_adas' },
  { id: 'sw_tbox', name: 'T-Box 通信服务', parent: 'hw_gateway' },
  { id: 'sw_route', name: '路由转发', parent: 'hw_gateway' }
]);

const publishEdgeList = ref([
  { source: 'sys_car', target: 'sys_cloud', label: 'MQTT/4G', proto: 'mqtt', view: 'l0' },
  { source: 'sys_app', target: 'sys_cloud', label: 'HTTPS', proto: 'https', view: 'l0' },
  { source: 'sw_hmi', target: 'sw_route', label: 'SOME/IP', proto: 'someip', view: 'l2' },
  { source: 'sw_plan', target: 'sw_route', label: 'SOME/IP', proto: 'someip', view: 'l2' },
  { source: 'sw_tbox', target: 'ctx_cloud', label: 'MQTT (遥测)', proto: 'mqtt', view: 'l2' },
  { source: 'ctx_app', target: 'ctx_cloud', label: 'HTTPS', proto: 'https', view: 'l2' }
]);

// 影响分析列表
const impactAnalysisList = computed(() => {
  return [
    {
      type: 'protocol',
      icon: 'ri-exchange-line',
      name: 'MQTT 协议变更',
      level: 'high',
      levelText: '高影响',
      description: '车云通信协议升级，影响遥测数据传输和远程控制功能。',
      affectedList: ['T-Box 通信服务', '车企云平台', '智能汽车']
    },
    {
      type: 'hardware',
      icon: 'ri-cpu-line',
      name: '中央网关 (NXP)',
      level: 'medium',
      levelText: '中影响',
      description: '网关固件需要同步更新以支持新的协议版本。',
      affectedList: ['路由转发', 'T-Box 通信服务']
    },
    {
      type: 'software',
      icon: 'ri-code-s-slash-line',
      name: 'HMI 交互界面',
      level: 'low',
      levelText: '低影响',
      description: '界面需要更新状态显示逻辑以反映新协议状态。',
      affectedList: ['导航引擎']
    }
  ];
});

// 根据硬件ID获取软件列表
function getPublishSoftwareByHardware(hardwareId: string) {
  return publishL2Software.value.filter(sw => sw.parent === hardwareId);
}

// 显示 Level 0 视图
function publishShowLevel0() {
  publishCurrentView.value = 'l0';
  nextTick(() => {
    renderPublishEdges();
  });
}

// 显示 Level 2 视图
function publishShowLevel2() {
  publishCurrentView.value = 'l2';
  // 进入 L2 时自动高亮受影响的节点
  publishAffectedNodeList.value = ['sw_tbox', 'ctx_cloud', 'hw_gateway'];
  nextTick(() => {
    renderPublishEdges();
  });
}

// 渲染发布对话框中的连线
function renderPublishEdges() {
  const svg = publishSvgLayerRef.value;
  const canvas = publishTopologyRef.value;
  if (!svg || !canvas) return;

  svg.innerHTML = '';
  const canvasRect = canvas.getBoundingClientRect();

  const currentEdgeList = publishEdgeList.value.filter(e => e.view === publishCurrentView.value);

  currentEdgeList.forEach(edge => {
    const sourceEl = document.getElementById('publish-' + edge.source);
    const targetEl = document.getElementById('publish-' + edge.target);

    if (sourceEl && targetEl) {
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
      const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
      const x2 = targetRect.left + targetRect.width / 2 - canvasRect.left;
      const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;

      // 判断是否受影响（MQTT协议）
      const isAffected = edge.proto === 'mqtt';

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('class', isAffected ? 'edge affected-edge' : 'edge');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String((x1 + x2) / 2));
      text.setAttribute('y', String((y1 + y2) / 2 - 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', isAffected ? 'edge-label affected-text' : 'edge-label');
      text.textContent = edge.label;
      svg.appendChild(text);
    }
  });
}

// 发布报文
async function handlePublish() {
  if (!currentPacket.value || !currentPacket.value.id) {
    ElMessage.warning('请先保存报文');
    return;
  }

  // 如果有未保存的更改，提示先保存
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的更改，发布前需要保存，是否保存？', '提示', {
        confirmButtonText: '保存并发布',
        cancelButtonText: '取消',
        type: 'warning',
        icon: h('i', { class: 'ri-error-warning-line', style: { fontSize: '22px', color: '#faad14' } }),
      });
      await savePacket();
    } catch {
      return;
    }
  }

  // 显示发布对话框
  publishDialogVisible.value = true;
  publishActiveTab.value = 'text';
  publishCurrentView.value = 'l0';
  publishAffectedNodeList.value = ['sys_car', 'sys_cloud'];
  
  nextTick(() => {
    setTimeout(() => {
      renderPublishEdges();
    }, 100);
  });
}

// 确认发布
function confirmPublish() {
  publishDialogVisible.value = false;
  ElMessage.success('发布成功');
}

// 监听发布标签页切换
watch(publishActiveTab, (newVal) => {
  if (newVal === 'topology') {
    nextTick(() => {
      setTimeout(() => {
        renderPublishEdges();
      }, 50);
    });
  }
});

// 计算高亮后的代码
const highlightedCode = computed(() => {
  const content = generatedFiles.value[currentFileIndex.value]?.content;
  if (!content) return '';
  try {
    return hljs.highlight(content, { language: 'cpp' }).value;
  } catch {
    return content;
  }
});

// 列内联编辑状态管理
const editingCell = ref<{ fieldId: string; column: 'name' | 'byteLength' } | null>(null);
const editingValue = ref<string | number>('');

// 字段添加菜单状态
const addFieldMenuVisible = ref(false);
const addFieldMenuPosition = ref({ x: 0, y: 0 });
const addFieldTargetParentId = ref<string | null>(null);

const selectedPacketIndex = computed(() => {
  if (!currentPacket.value) return null;
  const idx = packetStore.packetList.findIndex(
    (p) => p.id === currentPacket.value!.id
  );

  return idx > -1 ? idx : null;
});
const panels = reactive({
  basicInfo: { expanded: false },  // 根据新建/编辑状态动态设置
  protocolContent: { expanded: true },
});

// PacketList 组件需要的数据结构
const filterInfo = ref({
  keyword: "",
  device: "",
  status: "",
});

const selectedInfo = ref({
  ids: [] as string[],
  selectAll: false,
});

const pageInfo = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0,
});

interface defaultOptionsData {
  value: string;
  label: string;
}
interface structOptionsData {
  value: number;
  label: string;
}

const defaultByteOrderOptions = ref<defaultOptionsData[]>([
  { value: "big", label: "大端" },
  { value: "little", label: "小端" },
]);

const structAlignmentOptions = ref<structOptionsData[]>([
  { value: 1, label: "1字节对齐" },
  { value: 2, label: "2字节对齐" },
  { value: 4, label: "4字节对齐" },
  { value: 8, label: "8字节对齐" },
]);

const packetList = computed(() => packetStore.packetList);
// const deviceList = computed(() => packetStore.deviceList);
// 设备列表
const deviceList = ref<string[]>([
  "卫星平台",
  "电机驱动器",
  "环境监测站",
  "测试设备",
]);

// 生成代码
const handleGenerateCode = async () => {
  if (!currentPacket.value || !currentPacket.value.id) {
    ElMessage.warning('请先保存报文');
    return;
  }

  // 如果有未保存的更改，提示先保存
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的更改，生成代码前需要保存，是否保存？', '提示', {
        confirmButtonText: '保存并生成',
        cancelButtonText: '取消',
        type: 'warning',
        icon: h('i', { class: 'ri-error-warning-line', style: { fontSize: '22px', color: '#faad14' } }),
      });
      await savePacket();
    } catch (e) {
      return;
    }
  }

  codePreviewVisible.value = true;
  isGeneratingCode.value = true;
  generatedFiles.value = [];
  currentFileIndex.value = 0;

  try {
    const res = await generateMessageCode(currentPacket.value.id);
    if (res && res.files) {
      generatedFiles.value = res.files;
    } else {
      ElMessage.warning('未生成任何代码文件');
    }
  } catch (error: any) {
    console.error('生成代码失败:', error);
    // 检查是否有结构化的错误列表
    const errorList = error?.response?.data?.data?.errorList;
    if (errorList && errorList.length > 0) {
      codePreviewVisible.value = false; // 关闭预览弹窗，显示错误弹窗
      const errorHtml = `
        <div style="max-height: 400px; overflow-y: auto;">
          <p style="margin-bottom: 12px; color: #606266;">请修复以下配置问题后重试：</p>
          <ol style="padding-left: 20px; margin: 0;">
            ${errorList.map((err: any) => `
              <li style="margin-bottom: 8px; line-height: 1.5;">
                <span style="color: #303133;">${err.message}</span>
                <div style="font-size: 12px; color: #909399;">位置: ${err.fieldPath}</div>
              </li>
            `).join('')}
          </ol>
        </div>
      `;
      ElMessageBox.alert(errorHtml, '生成失败', {
        dangerouslyUseHTMLString: true,
        type: 'warning',
        confirmButtonText: '我知道了',
        customClass: 'validation-error-dialog',
        icon: h('i', { class: 'ri-error-warning-line', style: { fontSize: '22px', color: '#faad14' } }),
      });
    } else {
      ElMessage.error(error.message || '生成代码失败');
    }
  } finally {
    isGeneratingCode.value = false;
  }
};

const copyCode = (content: string) => {
  if (!content) return;
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('代码已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function editPacket(packet: any) {
  console.log('[editPacket] 被调用，packet:', packet);
  router.push({
    path: "/packet-config",
    query: { mode: "edit", id: packet.id },
  });
}

function backToList() {
  router.push({ path: "/packet-config" });
}

function cancelEdit() {
  // 如果没有未保存的更改，直接返回
  if (!hasUnsavedChanges.value) {
    backToList();
    return;
  }
  
  // 有未保存的更改，弹出确认框
  ElMessageBox.confirm("当前修改尚未保存，确定放弃？", "放弃更改", {
    confirmButtonText: "继续",
    cancelButtonText: "放弃",
    type: "warning",
    customClass: "confirm-dialog-brand",
    icon: h('i', { class: 'ri-error-warning-line', style: 'font-size: 22px; color: #faad14;' }),
  }).catch(() => backToList());
}

// 将小写字段改为全大写
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 字段名映射表：从后端大写格式到前端驼峰格式
const fieldNameMap: Record<string, string> = {
  'ID': 'id',
  'TYPE': 'type',  // 字段类型
  'FIELDTYPE': 'type',  // 兼容：后端可能返回 FIELDTYPE
  'FIELDNAME': 'fieldName',
  'DESCRIPTION': 'description',
  'ISREQUIRED': 'isRequired',
  'FIELDS': 'fields',
  'BYTELENGTH': 'byteLength',
  'DEFAULTVALUE': 'defaultValue',
  'DEFAULTBYTEORDER': 'defaultByteOrder',
  'DISPLAYFORMAT': 'displayFormat',
  'LEVEL': 'level',
  'PARENTID': 'parentId',
  'EXPANDED': 'expanded',
  'VALUETYPE': 'valueType',
  'MESSAGEIDVALUE': 'messageIdValue',
  'COUNT': 'count',
  'ELEMENT': 'element',
  'SUBFIELDS': 'subFields',
  'NAME': 'name',
  'STARTBIT': 'startBit',
  'ENDBIT': 'endBit',
  'FILLVALUE': 'fillValue',
  'BYTESINTRAILER': 'bytesInTrailer',
  'ALGORITHM': 'algorithm',
  'RANGESTARTREF': 'rangeStartRef',
  'RANGEENDREF': 'rangeEndRef',
  'PARAMETERS': 'parameters',
  'BYTEORDER': 'byteOrder',
  'PRECISION': 'precision',
  'VALIDWHEN': 'validWhen',  // 添加：有效性条件（驼峰命名）
  'VALUERANGE': 'valueRange',  // 添加：取值范围（驼峰命名）
  'BASETYPE': 'baseType',  // 添加：基础类型（驼峰命名）
  'UNIT': 'unit',  // 添加：单位
  'LENGTH': 'length',  // 添加：长度
  'MAPS': 'maps',  // 添加：映射
  'COUNTFROMFIELD': 'countFromField',  // 修正：应该是 countFromField 而不是 contFromField
  'CONTFROMFIELD': 'countFromField',  // 兼容旧的拼写错误
  'FIELD': 'field',  // 添加：字段
  'VALUE': 'value',  // 添加：值
  'MIN': 'min',  // 添加：最小值
  'MAX': 'max',  // 添加：最大值
  'ENCODING': 'encoding',  // 添加：编码格式
  'CASES': 'cases',  // 添加：命令字分支
  'BITLENGTH': 'bitLength',  // 添加：位长度
  'MEANING': 'meaning'  // 添加：含义（用于 maps）
};

// 创建反向映射：从前端驼峰格式到后端大写格式
// 手动指定优先使用的映射，避免冲突
const reverseFieldNameMap: Record<string, string> = {
  'id': 'ID',
  'type': 'TYPE',
  'fieldName': 'FIELDNAME',
  'description': 'DESCRIPTION',
  'isRequired': 'ISREQUIRED',
  'fields': 'FIELDS',
  'byteLength': 'BYTELENGTH',
  'defaultValue': 'DEFAULTVALUE',
  'defaultByteOrder': 'DEFAULTBYTEORDER',
  'displayFormat': 'DISPLAYFORMAT',
  'level': 'LEVEL',
  'parentId': 'PARENTID',
  'expanded': 'EXPANDED',
  'valueType': 'VALUETYPE',
  'messageIdValue': 'MESSAGEIDVALUE',
  'count': 'COUNT',
  'element': 'ELEMENT',
  'subFields': 'SUBFIELDS',
  'name': 'NAME',
  'startBit': 'STARTBIT',
  'endBit': 'ENDBIT',
  'fillValue': 'FILLVALUE',
  'bytesInTrailer': 'BYTESINTRAILER',
  'algorithm': 'ALGORITHM',
  'rangeStartRef': 'RANGESTARTREF',
  'rangeEndRef': 'RANGEENDREF',
  'parameters': 'PARAMETERS',
  'byteOrder': 'BYTEORDER',
  'precision': 'PRECISION',
  'validWhen': 'VALIDWHEN',
  'valueRange': 'VALUERANGE',
  'baseType': 'BASETYPE',
  'unit': 'UNIT',
  'length': 'LENGTH',
  'maps': 'MAPS',
  'countFromField': 'COUNTFROMFIELD',
  'field': 'FIELD',
  'value': 'VALUE',
  'min': 'MIN',
  'max': 'MAX',
  'encoding': 'ENCODING',
  'cases': 'CASES',
  'bitLength': 'BITLENGTH',
  'meaning': 'MEANING'
};

/**
 * 根据JSON规范定义的字段白名单
 * 每种字段类型只保留规范中定义的字段
 */
const fieldWhitelist: Record<string, string[]> = {
  SignedInt: ['fieldName', 'description', 'byteLength', 'validWhen', 'defaultValue', 'valueRange', 'unit'],
  UnsignedInt: ['fieldName', 'description', 'byteLength', 'validWhen', 'defaultValue', 'valueRange', 'unit'],
  MessageId: ['fieldName', 'description', 'byteLength', 'valueType', 'messageIdValue', 'valueRange'],
  Float: ['fieldName', 'description', 'validWhen', 'precision', 'defaultValue', 'valueRange', 'unit'],
  Bcd: ['fieldName', 'description', 'byteLength', 'validWhen', 'defaultValue', 'valueRange'],
  Timestamp: ['fieldName', 'description', 'byteLength', 'unit'],
  String: ['fieldName', 'description', 'length', 'encoding', 'validWhen', 'defaultValue'],
  Bitfield: ['fieldName', 'description', 'byteLength', 'validWhen', 'subFields'],
  Encode: ['fieldName', 'description', 'baseType', 'byteLength', 'validWhen', 'maps'],
  Struct: ['fieldName', 'description', 'validWhen', 'fields'],
  Array: ['fieldName', 'description', 'validWhen', 'count', 'countFromField', 'bytesInTrailer', 'element'],
  Command: ['fieldName', 'description', 'baseType', 'byteLength', 'validWhen', 'cases'],
  Padding: ['fieldName', 'description', 'byteLength', 'bitLength', 'fillValue'],
  Reserved: ['fieldName', 'description', 'byteLength', 'bitLength', 'fillValue'],
  Checksum: ['fieldName', 'description', 'algorithm', 'byteLength', 'rangeStartRef', 'rangeEndRef', 'parameters']
};

/**
 * 字段过滤和转换工具
 * 1. 根据字段类型过滤掉废弃字段
 * 2. 将 maxValue/minValue 转换为 valueRange 格式
 */
const filterAndTransformField = (field: any): any => {
  if (!field || typeof field !== 'object') {
    return field;
  }

  const fieldType = field.type;
  if (!fieldType || !fieldWhitelist[fieldType]) {
    // 字段类型不存在于白名单,返回原始字段
    return field;
  }

  const whitelist = fieldWhitelist[fieldType];
  const filteredField: any = {};

  // 必须保留的核心字段
  filteredField.type = fieldType;

  // 保留前端内部管理字段（用于UI状态管理）
  if (field.id !== undefined) filteredField.id = field.id;
  if (field.level !== undefined) filteredField.level = field.level;
  if (field.parentId !== undefined) filteredField.parentId = field.parentId;
  if (field.expanded !== undefined) filteredField.expanded = field.expanded;

  // 只保留白名单中的字段
  for (const key of whitelist) {
    if (key in field) {
      filteredField[key] = field[key];
    }
  }

  // 特殊处理: 将 maxValue/minValue 转换为 valueRange
  if ((fieldType === 'SignedInt' || fieldType === 'UnsignedInt' || fieldType === 'Float' || fieldType === 'Bcd') &&
      (field.maxValue !== undefined || field.minValue !== undefined) &&
      !filteredField.valueRange) {
    const hasValidRange = (field.minValue !== undefined && field.minValue !== null && field.minValue !== '') ||
                          (field.maxValue !== undefined && field.maxValue !== null && field.maxValue !== '');
    if (hasValidRange) {
      filteredField.valueRange = [{
        min: field.minValue ?? (fieldType === 'Float' ? -Infinity : Number.MIN_SAFE_INTEGER),
        max: field.maxValue ?? (fieldType === 'Float' ? Infinity : Number.MAX_SAFE_INTEGER)
      }];
    }
  }

  // 特殊处理：数组类型需要将 fields 转换为 element
  if (fieldType === 'Array') {
    // 如果数组有 fields 数组，取第一个元素作为 element
    if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
      filteredField.element = filterAndTransformField(field.fields[0]);
    } else if (field.element) {
      filteredField.element = filterAndTransformField(field.element);
    }
    // 删除 fields 属性（数组类型不应该有 fields）
    delete filteredField.fields;
  } else if (fieldType === 'Command') {
    // 特殊处理：命令字类型需要确保 cases 对象正确
    // 如果有 fields 数组（UI显示用的），需要保留原始的 cases 对象
    if (filteredField.cases && typeof filteredField.cases === 'object') {
      const transformedCases: any = {};
      for (const [key, value] of Object.entries(filteredField.cases)) {
        transformedCases[key] = filterAndTransformField(value);
      }
      filteredField.cases = transformedCases;
    }
    // 删除 fields 属性（命令字类型不应该有 fields）
    delete filteredField.fields;
  } else {
    // 其他类型：正常处理嵌套字段
    if (filteredField.fields && Array.isArray(filteredField.fields)) {
      filteredField.fields = filteredField.fields.map(filterAndTransformField);
    }
    
    // 递归处理数组元素（如果有）
    if (filteredField.element) {
      filteredField.element = filterAndTransformField(filteredField.element);
    }
  }

  return filteredField;
};

/**
 * 将加载的数据转换为UI格式
 * 主要处理：
 * 1. 将数组的 element 转换为 fields 数组以便UI显示
 * 2. 将命令字的 cases 对象转换为 fields 数组以便UI显示
 */
/**
 * 规范化字段数据类型
 * 确保从后端加载的数据中，数字类型字段是正确的类型而不是字符串
 */
const normalizeFieldTypes = (fields: PacketField[]): PacketField[] => {
  if (!Array.isArray(fields)) return fields;

  return fields.map((field) => {
    const normalized = { ...field };

    // 处理通用 byteLength 的整型转换（避免下拉选项值类型不匹配）
    if (typeof (field as any).byteLength === 'string') {
      const parsed = parseInt((field as any).byteLength, 10);
      if (!Number.isNaN(parsed)) {
        (normalized as any).byteLength = parsed;
      }
    }

    // 处理 Bitfield 类型的 subFields
    if (field.type === 'Bitfield' && Array.isArray(field.subFields)) {
      normalized.subFields = field.subFields.map(subField => {
        const normalizedSubField = {
          ...subField,
          startBit: typeof subField.startBit === 'string' ? parseInt(subField.startBit) : subField.startBit,
          endBit: typeof subField.endBit === 'string' ? parseInt(subField.endBit) : subField.endBit
        };
        // 处理 subFields.maps.value 的整型转换
        if (Array.isArray(subField.maps)) {
          normalizedSubField.maps = subField.maps.map((m: any) => ({
            ...m,
            value: typeof m.value === 'string' ? parseInt(m.value) : m.value
          }));
        }
        return normalizedSubField;
      });
    }

    // 处理 Array 类型的数字字段
    if (field.type === 'Array') {
      if (typeof field.count === 'string') {
        normalized.count = parseInt(field.count) || undefined;
      }
      if (typeof field.bytesInTrailer === 'string') {
        normalized.bytesInTrailer = parseInt(field.bytesInTrailer) || undefined;
      }
      // 递归处理 element
      if (field.element) {
        normalized.element = normalizeFieldTypes([field.element])[0];
      }
    }

    // 处理 Encode 类型的 maps.value 整型转换
    if (field.type === 'Encode' && Array.isArray(field.maps)) {
      normalized.maps = field.maps.map((m: any) => ({
        ...m,
        value: typeof m.value === 'string' ? parseInt(m.value) : m.value
      }));
    }

    // 处理 String 类型的 length 整型转换
    if (field.type === 'String' && typeof field.length === 'string') {
      normalized.length = parseInt(field.length) || 0;
    }

    // 处理 MessageId 类型的 messageIdValue 整型转换
    if (field.type === 'MessageId' && typeof field.messageIdValue === 'string') {
      normalized.messageIdValue = parseInt(field.messageIdValue);
    }

    // 处理 validWhen.value 的整型转换
    if (field.validWhen && typeof field.validWhen.value === 'string') {
      normalized.validWhen = {
        ...field.validWhen,
        value: parseInt(field.validWhen.value)
      };
    }

    // 处理 valueRange 的数字类型
    if (field.valueRange && Array.isArray(field.valueRange)) {
      normalized.valueRange = field.valueRange.map(range => {
        const normalizedRange = { ...range };
        // 对于数字类型的字段，确保 min 和 max 是数字
        if (field.type === 'SignedInt' || field.type === 'UnsignedInt' || field.type === 'Float') {
          if (typeof range.min === 'string') {
            normalizedRange.min = parseFloat(range.min);
          }
          if (typeof range.max === 'string') {
            normalizedRange.max = parseFloat(range.max);
          }
        }
        return normalizedRange;
      });
    }

    // 递归处理嵌套字段（Struct 等）
    if (field.fields && Array.isArray(field.fields)) {
      normalized.fields = normalizeFieldTypes(field.fields);
    }

    // 处理 Command 类型的 cases
    if (field.type === 'Command' && field.cases) {
      normalized.cases = {};
      Object.keys(field.cases).forEach(caseKey => {
        normalized.cases![caseKey] = normalizeFieldTypes([field.cases![caseKey]])[0];
      });
    }

    return normalized;
  });
};

const convertLoadedDataToUIFormat = (fields: PacketField[]): PacketField[] => {
  if (!Array.isArray(fields)) return fields;

  // 先进行类型规范化
  const normalizedFields = normalizeFieldTypes(fields);

  return normalizedFields.map((field) => {
    const convertedField = { ...field };

    // 如果字段没有 id，自动分配一个唯一 id（导入的 JSON 或旧数据可能没有 id）
    if (!convertedField.id) {
      convertedField.id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 如果是数组类型且有 element，将其转换为 fields 数组
    if (field.type === 'Array' && field.element) {
      convertedField.fields = [convertLoadedDataToUIFormat([field.element])[0]];
      // 保留 element，但主要用 fields 显示
    }

    // 如果是命令字类型且有 cases，将其转换为 fields 数组
    if (field.type === 'Command' && field.cases && typeof field.cases === 'object') {
      convertedField.fields = Object.entries(field.cases).map(([key, value]) => {
        const caseField = convertLoadedDataToUIFormat([value as PacketField])[0];
        // 如果字段名不是以 case_ 开头，说明是旧数据，需要添加前缀以便UI识别
        // 新数据已经在保存时设置了 case_ 前缀，直接使用即可
        return {
          ...caseField,
          // 保持原有字段名，不再添加 [key] 前缀
          fieldName: caseField.fieldName || `case_${key.replace(/[^a-zA-Z0-9]/g, '_')}`
        };
      });
      // 保留 cases，但主要用 fields 显示
    }

    // 递归处理结构体的嵌套字段
    if (field.type === 'Struct' && field.fields && Array.isArray(field.fields)) {
      convertedField.fields = convertLoadedDataToUIFormat(field.fields);
    }

    return convertedField;
  });
};

/**
 * 过滤整个报文数据
 */
const filterPacketFields = (packet: any): any => {
  if (!packet) return packet;

  const filteredPacket = { ...packet };

  // 过滤字段列表
  if (filteredPacket.fields && Array.isArray(filteredPacket.fields)) {
    filteredPacket.fields = filteredPacket.fields.map(filterAndTransformField);
  }

  return filteredPacket;
};

// 将字段名转换为大写格式（用于与后端接口对接）
// fields 字段内部保持原样（小写），因为它是 JSON 存储，代码生成器期望小写
const keysToUpperCase = (obj: any, isInsideFields = false): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => keysToUpperCase(item, isInsideFields));
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        // fields 数组内部的所有属性保持小写
        if (isInsideFields) {
          // 递归处理嵌套对象，保持在 fields 内部
          return [key, keysToUpperCase(value, true)];
        }
        // 当前键是 'fields' 时，其值保持原样（小写）
        if (key === 'fields') {
          return ['FIELDS', keysToUpperCase(value, true)];
        }
        // 其他字段正常转大写
        return [
          reverseFieldNameMap[key] || key.toUpperCase(),
          keysToUpperCase(value, false),
        ];
      })
    );
  }
  return obj;
};

// 将大写字段名转换为小写驼峰命名
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const keysToLowerCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(keysToLowerCamelCase);
  } else if (obj && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      let mappedKey;
      
      // 1. 优先使用映射表（处理全大写字段名）
      if (fieldNameMap[key]) {
        mappedKey = fieldNameMap[key];
      }
      // 2. 处理已经是驼峰命名的字段，保持驼峰命名不变
      else if (key !== key.toUpperCase() && key !== key.toLowerCase()) {
        // 如果字段名既不是全大写也不是全小写，说明是驼峰命名
        // 保持不变
        mappedKey = key;
      }
      // 3. 处理下划线命名
      else if (key.includes('_')) {
        mappedKey = key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      }
      // 4. 默认转为小写
      else {
        mappedKey = key.toLowerCase();
      }
      
      newObj[mappedKey] = keysToLowerCamelCase(value);
    }
    return newObj;
  }
  return obj;
};

// 将部分字段改为下划线的拼接方式
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renameKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(renameKeys);
  } else if (obj && typeof obj === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      let newKey = key;
      // 指定 key 的映射
      if (key === "FIELD_COUNT") newKey = "FIELD_COUNT";
      if (key === "UPDATED_AT") newKey = "UPDATED_AT";
      if (key === "DEFAULT_BYTE_ORDER") newKey = "DEFAULT_BYTE_ORDER";
      if (key === "STRUCT_ALIGNMENT") newKey = "STRUCT_ALIGNMENT";
      // 递归处理子对象
      newObj[newKey] = renameKeys(value);
    }
    return newObj;
  }
  return obj;
}

// 前端直接使用后端字段名（小写加下划线），不做任何转换

/**
 * 校验字段必填项
 * 根据协议规范检查每个字段的必填属性是否已填写
 */
interface ValidationError {
  fieldName: string;
  fieldType: string;
  missingFields: string[];
  path: string;
}

const validateFields = (fields: PacketField[], parentPath: string = ''): ValidationError[] => {
  const errorList: ValidationError[] = [];
  
  if (!Array.isArray(fields)) return errorList;
  
  fields.forEach((field, index) => {
    const currentPath = parentPath ? `${parentPath}.${field.fieldName || `[${index}]`}` : (field.fieldName || `[${index}]`);
    const missingFields: string[] = [];
    
    // 通用必填项：fieldName（除了 Padding/Reserved）
    if (!['Padding', 'Reserved'].includes(field.type) && !field.fieldName) {
      missingFields.push('字段名称(fieldName)');
    }
    
    // 根据字段类型检查特定必填项
    switch (field.type) {
      case 'SignedInt':
      case 'UnsignedInt':
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '' && typeof field.defaultValue !== 'number') {
          missingFields.push('默认值必须为数字');
        }
        break;
        
      case 'MessageId':
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (!field.valueType) {
          missingFields.push('数据类型(valueType)');
        }
        if (field.messageIdValue === undefined || field.messageIdValue === null) {
          missingFields.push('报文标识值(messageIdValue)');
        }
        break;
        
      case 'Float':
        if (!field.precision) {
          missingFields.push('数据精度(precision)');
        }
        if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '' && typeof field.defaultValue !== 'number') {
          missingFields.push('默认值必须为数字');
        }
        break;
        
      case 'Bcd':
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (field.defaultValue !== undefined && field.defaultValue !== null && typeof field.defaultValue !== 'string') {
          missingFields.push('默认值必须为字符串');
        }
        break;
        
      case 'Timestamp':
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (!field.unit) {
          missingFields.push('时间单位(unit)');
        }
        break;
        
      case 'String':
        if (field.length === undefined || field.length === null) {
          missingFields.push('字段长度(length)');
        }
        break;
        
      case 'Bitfield':
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (!field.subFields || !Array.isArray(field.subFields) || field.subFields.length === 0) {
          missingFields.push('子字段(subFields)');
        } else {
          // 校验每个子字段
          field.subFields.forEach((subField: any, subIdx: number) => {
            const subMissing: string[] = [];
            if (!subField.name) subMissing.push('name');
            if (subField.startBit === undefined || subField.startBit === null) subMissing.push('startBit');
            if (subField.endBit === undefined || subField.endBit === null) subMissing.push('endBit');
            if (subMissing.length > 0) {
              errorList.push({
                fieldName: subField.name || `subFields[${subIdx}]`,
                fieldType: 'Bitfield.subField',
                missingFields: subMissing,
                path: `${currentPath}.subFields[${subIdx}]`
              });
            }
          });
        }
        break;
        
      case 'Encode':
        if (!field.baseType) {
          missingFields.push('基础类型(baseType)');
        }
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (!field.maps || !Array.isArray(field.maps) || field.maps.length === 0) {
          missingFields.push('值映射表(maps)');
        }
        break;
        
      case 'Struct':
        if (!field.fields || !Array.isArray(field.fields) || field.fields.length === 0) {
          missingFields.push('子字段(fields)');
        } else {
          // 递归校验子字段
          const childErrors = validateFields(field.fields, currentPath);
          errorList.push(...childErrors);
        }
        break;
        
      case 'Array':
        // 长度定义三选一，且只能选择一个
        const hasCount = field.count !== undefined && field.count !== null;
        const hasCountFromField = !!field.countFromField;
        const hasBytesInTrailer = field.bytesInTrailer !== undefined && field.bytesInTrailer !== null;
        const selectedCount = [hasCount, hasCountFromField, hasBytesInTrailer].filter(Boolean).length;
        if (selectedCount === 0) {
          missingFields.push('长度定义(count/countFromField/bytesInTrailer 必须选择一个)');
        } else if (selectedCount > 1) {
          missingFields.push('长度定义冲突(count/countFromField/bytesInTrailer 只能选择一个)');
        }
        if (!field.element && (!field.fields || field.fields.length === 0)) {
          missingFields.push('元素定义(element)');
        }
        // 递归校验数组元素
        if (field.fields && Array.isArray(field.fields) && field.fields.length > 0) {
          const childErrors = validateFields(field.fields, `${currentPath}.element`);
          errorList.push(...childErrors);
        }
        break;
        
      case 'Command':
        if (!field.baseType) {
          missingFields.push('基础类型(baseType)');
        }
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        if (!field.cases || Object.keys(field.cases).length === 0) {
          missingFields.push('分支定义(cases)');
        } else {
          // 递归校验 cases 中的字段
          Object.entries(field.cases).forEach(([caseKey, caseValue]: [string, any]) => {
            if (caseValue && caseValue.fields) {
              const childErrors = validateFields(caseValue.fields, `${currentPath}.cases[${caseKey}]`);
              errorList.push(...childErrors);
            }
          });
        }
        break;
        
      case 'Padding':
      case 'Reserved':
        // byteLength 和 bitLength 二选一
        const hasByteLength = field.byteLength !== undefined && field.byteLength !== null;
        const hasBitLength = field.bitLength !== undefined && field.bitLength !== null;
        if (!hasByteLength && !hasBitLength) {
          missingFields.push('长度定义(byteLength/bitLength 二选一)');
        }
        break;
        
      case 'Checksum':
        if (!field.algorithm) {
          missingFields.push('校验算法(algorithm)');
        }
        if (field.byteLength === undefined || field.byteLength === null) {
          missingFields.push('字节长度(byteLength)');
        }
        break;
    }
    
    // 验证有效性条件：如果启用了有效性条件（validWhen.field 不为空），则引用字段名称和引用字段值都必须填写
    if (field.validWhen) {
      const fieldRef = field.validWhen.field;
      const valueRef = field.validWhen.value;
      const hasField = typeof fieldRef === 'string' && fieldRef.trim() !== '';
      // 检查 value 是否有效：排除 undefined、null、空字符串、NaN
      const hasValue = valueRef !== undefined && valueRef !== null && valueRef !== '' && 
        !(typeof valueRef === 'number' && Number.isNaN(valueRef));
      
      // 如果 field 已填写（说明用户启用了有效性条件），则 value 也必须填写
      if (hasField && !hasValue) {
        missingFields.push('有效性条件的引用字段值(validWhen.value)');
      }
      // 如果 value 已填写但 field 未填写，也是无效的
      if (hasValue && !hasField) {
        missingFields.push('有效性条件的引用字段名称(validWhen.field)');
      }
    }
    
    // 如果有缺失的必填项，添加到错误列表
    if (missingFields.length > 0) {
      errorList.push({
        fieldName: field.fieldName || `[${index}]`,
        fieldType: field.type,
        missingFields,
        path: currentPath
      });
    }
  });
  
  return errorList;
};

/**
 * 格式化校验错误信息
 */
const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  
  const lines = errors.map(err => {
    const location = err.path || err.fieldName;
    return `• ${location} (${err.fieldType}): 缺少 ${err.missingFields.join(', ')}`;
  });
  
  return lines.join('\n');
};

const savePacket = async () => {
  if (!currentPacket.value) return;
  // 确保 fields 是数组
  if (!Array.isArray(currentPacket.value.fields)) {
    currentPacket.value.fields = [];
  }
  
  // 校验字段必填项
  const validationErrors = validateFields(currentPacket.value.fields);
  if (validationErrors.length > 0) {
    const errorMessage = formatValidationErrors(validationErrors);
    console.warn('字段校验失败:', validationErrors);
    ElMessageBox.alert(
      `<div style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${errorMessage}</div>`,
      '字段校验失败',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '知道了',
        type: 'warning',
        icon: h('i', { class: 'ri-error-warning-line', style: 'font-size: 22px; color: #faad14;' }),
      }
    );
    return;
  }
  
  // 保存到本地store
  packetStore.savePacket(currentPacket.value);
  
  try {
    console.log('========== 保存报文 ==========');
    console.log('当前报文数据:', JSON.stringify(currentPacket.value, null, 2));

    // 1. 过滤废弃字段并转换格式
    const filteredPacket = filterPacketFields(currentPacket.value);
    console.log('过滤废弃字段后:', JSON.stringify(filteredPacket, null, 2));

    // 2. 转换为大写格式
    const result = keysToUpperCase(filteredPacket);
    console.log('转大写后:', JSON.stringify(result, null, 2));

    // 3. 重命名特定字段
    const newResult = renameKeys(result);
    console.log('重命名后:', JSON.stringify(newResult, null, 2));
    
    const isAddMode = route.query.mode === "add";
    console.log('是否新建模式:', isAddMode);
    
    if (isAddMode) {
      // 新建模式：调用创建接口
      // API 返回的 response 直接就是报文数据（ApiClient.request 已解包）
      const response = await postMessageCreate(newResult);
      console.log('创建报文成功，response:', response);
      
      // 使用后端返回的完整报文数据（包含真实的id）
      if (response && response.id) {
        currentPacket.value = response as Packet;
        // 更新最后保存状态
        lastSavedPacket.value = JSON.stringify(currentPacket.value);
        hasUnsavedChanges.value = false;
        
        // 切换到编辑模式，使用真实的id（数据库主键）
        await router.replace({
          path: "/packet-config",
          query: { mode: "edit", id: currentPacket.value.id }
        });
      }
    } else {
      // 编辑模式：调用更新接口
      const response = await putMessageUpdate(currentPacket.value.id, newResult);
      console.log(response, "更新报文成功");
      
      // 保存成功后重新加载当前报文数据，确保字段已保存
      try {
        // API 返回的 detailResponse 直接就是报文数据（ApiClient.request 已解包）
        const detailResponse = await getMessageDetail(currentPacket.value.id);
        if (detailResponse && detailResponse.id) {
          const reloadedData = detailResponse;
          // 转换fields字段名
          if (reloadedData.fields && Array.isArray(reloadedData.fields) && reloadedData.fields.length > 0) {
            reloadedData.fields = keysToLowerCamelCase(reloadedData.fields);
            // 将数组的 element 转换为 fields 以便UI显示
            reloadedData.fields = convertLoadedDataToUIFormat(reloadedData.fields);
          }
          currentPacket.value = reloadedData as Packet;
          // 更新最后保存状态
          lastSavedPacket.value = JSON.stringify(currentPacket.value);
          hasUnsavedChanges.value = false;
        }
      } catch (error) {
        console.error("重新加载报文详情失败:", error);
      }
    }
    
    ElMessage.success({ message: '保存成功', plain: true });
  } catch (err: any) {
    console.error("保存报文失败:", err);
    ElMessage.error({ message: '保存失败: ' + (err.response?.data?.message || err.message || '未知错误'), plain: true });
  }
};

function deleteCurrentPacket() {
  if (!currentPacket.value) return;
  ElMessageBox.confirm(
    `确定要删除报文"${currentPacket.value.name}"吗？`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      icon: h('i', { class: 'ri-error-warning-line', style: 'font-size: 22px; color: #faad14;' }),
    }
  )
    .then(() => {
      if (packetStore.deletePacket(currentPacket.value!.id)) backToList();
    })
    .catch(() => {});
}

// 字段类型到英文名称前缀的映射
const fieldTypeToEnglishName: Record<string, string> = {
  SignedInt: 'signedInt',
  UnsignedInt: 'unsignedInt',
  MessageId: 'messageId',
  Float: 'float',
  Bcd: 'bcd',
  Timestamp: 'timestamp',
  String: 'string',
  Bitfield: 'bitfield',
  Encode: 'encode',
  Struct: 'struct',
  Array: 'array',
  Command: 'command',
  Padding: 'padding',
  Reserved: 'reserved',
  Checksum: 'checksum'
};

// 递归收集所有字段名（包括嵌套字段）
function collectAllFieldNames(fields: PacketField[]): Set<string> {
  const names = new Set<string>();

  const collectFromFields = (fieldList: PacketField[]) => {
    for (const field of fieldList) {
      if (field.fieldName) {
        names.add(field.fieldName);
      }
      // 递归处理嵌套字段
      if (field.fields && Array.isArray(field.fields)) {
        collectFromFields(field.fields);
      }
      // 处理数组元素
      if (field.element) {
        collectFromFields([field.element]);
      }
      // 处理命令字分支
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

// 根据字段类型获取可选的字节长度列表
// 返回空数组表示该类型不需要设置字节长度
// 返回 null 表示该类型需要使用输入框（任意正整数）
function getByteLengthOptions(fieldType: string): number[] | null {
  switch (fieldType) {
    case 'SignedInt':
    case 'UnsignedInt':
    case 'MessageId':
    case 'Bcd':
    case 'Encode':
    case 'Command':
      return [1, 2, 4, 8];
    case 'Timestamp':
      return [4, 8];
    case 'Bitfield':
    case 'Checksum':
    case 'Padding':
    case 'Reserved':
      // 这些类型可以是任意正整数，使用输入框
      return null;
    case 'String':
      // 字符串使用 length 字段，不使用 byteLength
      return [];
    default:
      // Float、Struct、Array 等类型不需要直接设置 byteLength
      return [];
  }
}

// 判断字段类型是否需要显示 length 字段（字符串长度）
function needsLengthField(fieldType: string): boolean {
  return fieldType === 'String';
}

// 判断字段类型是否需要在中间表格显示字节长度
function showByteLengthInTable(fieldType: string): boolean {
  // Command 类型的字节长度在右侧属性面板中配置
  return fieldType !== 'Command';
}

// 根据字段 id 读写真实字段对象（避免扁平化列表的浅拷贝导致 v-model 失效）
function getRealFieldById(fieldId?: string): PacketField | null {
  if (!fieldId || !currentPacket.value?.fields) return null;
  return findFieldById(currentPacket.value.fields, fieldId);
}

function getRealFieldByteLength(fieldId?: string): number | undefined {
  const field = getRealFieldById(fieldId);
  const raw = field ? (field as any).byteLength : undefined;
  if (raw === null || raw === undefined) return undefined;
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function getRealFieldLength(fieldId?: string): number | undefined {
  const field = getRealFieldById(fieldId);
  const raw = field ? (field as any).length : undefined;
  if (raw === null || raw === undefined) return undefined;
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function setRealFieldByteLength(fieldId: string | undefined, value: unknown) {
  const field = getRealFieldById(fieldId);
  if (!field) return;

  const numValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numValue)) return;
  if (numValue < 0) return;

  field.byteLength = numValue;
  console.log('[packet-config] byteLength 已更新:', { fieldId, byteLength: numValue });
}

function setRealFieldLength(fieldId: string | undefined, value: unknown) {
  const field = getRealFieldById(fieldId);
  if (!field) return;

  const numValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numValue)) return;
  if (numValue < 0) return;

  (field as any).length = numValue;
  console.log('[packet-config] length 已更新:', { fieldId, length: numValue });
}

function handleRealFieldByteLengthInput(fieldId: string | undefined, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  setRealFieldByteLength(fieldId, target.value);
}

function handleRealFieldLengthInput(fieldId: string | undefined, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  setRealFieldLength(fieldId, target.value);
}

function handleRealFieldByteLengthSelect(fieldId: string | undefined, value: unknown) {
  setRealFieldByteLength(fieldId, value);
}

// 生成唯一的英文字段名
function generateUniqueFieldName(fieldType: string): string {
  if (!currentPacket.value?.fields) {
    // 如果没有当前报文，使用默认名称
    const baseName = fieldTypeToEnglishName[fieldType] || 'field';
    return baseName + '1';
  }

  // 收集所有已存在的字段名
  const existingNames = collectAllFieldNames(currentPacket.value.fields);

  // 基础名称（小驼峰命名）
  const baseName = fieldTypeToEnglishName[fieldType] || 'field';

  // 从1开始编号，不直接使用类型名称
  let counter = 1;
  let newName = `${baseName}${counter}`;

  while (existingNames.has(newName)) {
    counter++;
    newName = `${baseName}${counter}`;
  }

  return newName;
}

function cloneFieldType(fieldType: any): PacketField {
  const isContainer = fieldType.fieldType === 'Struct' ||
                      fieldType.fieldType === 'Array' ||
                      fieldType.fieldType === 'Command';

  // 生成唯一的英文字段名
  const uniqueFieldName = generateUniqueFieldName(fieldType.fieldType);

  // 基础字段配置
  const baseField: PacketField = {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fieldName: uniqueFieldName,
    type: fieldType.fieldType,
    description: "",
    byteLength: 1,
    defaultValue: 0,
    displayFormat: "decimal",
    isRequired: true,
    validWhen: {
      field: "",
      value: null,
    },
    messageIdValue: null,
    valueType: "",
    precision: null,
    unit: "",
    valueRange: [],
    length: null,
    subFields: [],
    baseType: "",
    maps: [],
    count: null,
    contFromField: "",
    bytesInTrailer: "",
    algorithm: "",
    parameters: {},
    expanded: isContainer,
  };

  // 根据字段类型设置默认值（包括字节长度）
  switch (fieldType.fieldType) {
    case 'SignedInt':
    case 'UnsignedInt':
      // 整数：4字节（32位）最常用
      baseField.byteLength = 4;
      break;

    case 'MessageId':
      // 报文标识：2字节通常足够，类型默认无符号整型
      baseField.byteLength = 2;
      baseField.valueType = 'UnsignedInt';
      break;

    case 'Float':
      // 浮点数：数据精度默认是 float（4字节）
      baseField.precision = 'float';
      break;

    case 'Bcd':
      // BCD码：4字节常用于时间等场景，默认值为空字符串
      baseField.byteLength = 4;
      baseField.defaultValue = '';
      break;

    case 'Timestamp':
      // 时间戳：4字节当天毫秒数
      baseField.byteLength = 4;
      baseField.unit = 'day-milliseconds';
      break;

    case 'String':
      // 字符串：默认0字节长度，UTF-8编码，默认值为空字符串
      baseField.length = 0;
      baseField.encoding = 'utf8';
      baseField.defaultValue = '';
      break;

    case 'Bitfield':
      // 位域：1字节（8位状态标志）常用
      baseField.byteLength = 1;
      break;

    case 'Encode':
      // 编码：1字节枚举值常用，类型默认无符号整数
      baseField.byteLength = 1;
      baseField.baseType = 'UnsignedInt';
      break;

    case 'Command':
      // 命令字：1字节命令码常用
      baseField.byteLength = 1;
      baseField.baseType = 'unsigned';
      break;

    case 'Checksum':
      // 校验位：2字节（CRC16等），默认CRC16-MODBUS算法
      baseField.byteLength = 2;
      baseField.algorithm = 'crc16-modbus';
      baseField.parameters = getDefaultParams('crc16-modbus');
      break;

    case 'Padding':
    case 'Reserved':
      // 填充/保留：1字节
      baseField.byteLength = 1;
      break;
  }

  return baseField;
}

// 快速添加字段到末尾
function addFieldToEnd(fieldType: any) {
  if (!currentPacket.value) return;

  // 使用现有的克隆函数创建新字段
  const newField = cloneFieldType(fieldType);

  // 添加到字段列表末尾
  if (!currentPacket.value.fields) {
    currentPacket.value.fields = [];
  }
  currentPacket.value.fields.push(newField);

  // 更新字段计数
  currentPacket.value.field_count = currentPacket.value.fields.length;

  // 自动选中新添加的字段
  selectedFieldIndex.value = currentPacket.value.fields.length - 1;

  // 显示提示（可选）
  // ElMessage.success({ message: `已添加 ${fieldType.fieldName} 到字段列表`, plain: true });
}

// 递归查找字段对象
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

// 显示添加字段菜单
function showAddFieldMenu(event: MouseEvent, parentId: string) {
  event.stopPropagation();
  
  // 计算菜单位置，确保不超出屏幕边界
  const menuWidth = 260;
  const menuHeight = 420;
  const padding = 10;
  
  let x = event.clientX;
  let y = event.clientY;
  
  // 检查右边界
  if (x + menuWidth > window.innerWidth - padding) {
    x = window.innerWidth - menuWidth - padding;
  }
  
  // 检查下边界
  if (y + menuHeight > window.innerHeight - padding) {
    y = window.innerHeight - menuHeight - padding;
  }
  
  // 确保不小于 0
  x = Math.max(padding, x);
  y = Math.max(padding, y);
  
  addFieldMenuPosition.value = { x, y };
  addFieldTargetParentId.value = parentId;
  addFieldMenuVisible.value = true;
}

// 隐藏添加字段菜单
function hideAddFieldMenu() {
  addFieldMenuVisible.value = false;
  addFieldTargetParentId.value = null;
}

// 从菜单中选择字段类型添加
async function addFieldFromMenu(fieldType: string) {
  // 先保存 parentId，再隐藏菜单（隐藏时会清空 parentId）
  const parentId = addFieldTargetParentId.value;
  hideAddFieldMenu();
  
  if (!currentPacket.value?.fields || !parentId) return;
  
  const parentField = findFieldById(currentPacket.value.fields, parentId);
  if (!parentField) return;
  
  const newField = cloneFieldType(fieldOptions[fieldType]);
  await addFieldToContainer(parentField, newField);
}

// 向容器中添加子字段
async function addFieldToContainer(parentField: PacketField, newField: PacketField) {
  if (parentField.type === 'Command') {
    // 命令字类型需要输入命令值
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
      // 不要强制修改字段名，保持 cloneFieldType 生成的名称（如 signedInt1）
      // newField.fieldName = `case_${cmdValue.replace(/[^a-zA-Z0-9]/g, '_')}`;

      parentField.cases[cmdValue] = newField;

      // 直接使用 cases 中的对象引用，确保在列表中修改时能同步到 cases
      parentField.fields = Object.values(parentField.cases);

      // ElMessage.success({ message: `命令分支 ${cmdValue} 已添加`, plain: true });
    } catch (error) {
      return;
    }
  } else if (parentField.type === 'Array') {
    // 数组只能有一个元素定义
    if (parentField.element || (parentField.fields && parentField.fields.length > 0)) {
      ElMessage.warning({ message: '数组已有元素定义，请直接编辑', plain: true });
      return;
    }
    newField.level = (parentField.level || 0) + 1;
    newField.parentId = parentField.id;
    parentField.element = newField;
    parentField.fields = [newField];
    // ElMessage.success({ message: '数组元素已添加', plain: true });
  } else {
    // 结构体
    if (!parentField.fields) parentField.fields = [];
    newField.level = (parentField.level || 0) + 1;
    newField.parentId = parentField.id;
    parentField.fields.push(newField);
    // ElMessage.success({ message: '字段已添加到结构体中', plain: true });
  }
}

async function handleFieldAdd(evt: any) {
  if (!currentPacket.value?.fields) return;

  const sourceItem = evt.item;
  if (!sourceItem) return;

  const targetFlatIndex = evt.newIndex;
  if (targetFlatIndex === undefined) return;

  const fieldTypeElement = sourceItem.querySelector(".field-type");
  const fieldType = fieldTypeElement?.textContent?.trim();
  if (!fieldType || !fieldOptions[fieldType]) return;

  const newField = cloneFieldType(fieldOptions[fieldType]);

  // 获取当前 UI 显示列表中目标位置的项
  const targetItem = flattenedFields.value[targetFlatIndex];

  // 情况1: 拖到了占位符上 -> 插入到该占位符所属的父容器内部
  if (targetItem && (targetItem as any).isPlaceholder) {
    const parentId = (targetItem as any).parentId;
    if (!parentId) return;
    
    const parentField = findFieldById(currentPacket.value.fields, parentId);
    if (!parentField) return;

    await addFieldToContainer(parentField, newField);
    return;
  }

  // 情况2: 拖到了现有字段位置
  if (targetItem && targetItem.id) {
    // 检查该字段的父容器是否为 Command
    const parentInfo = findFieldParentInfo(currentPacket.value.fields, targetItem.id);
    if (parentInfo && parentInfo.parent.type === 'Command') {
      // 父字段是命令字，当作新增分支处理
      await addFieldToContainer(parentInfo.parent, newField);
      return;
    }
  }

  // 情况3: 普通位置插入
  insertFieldAtFlatIndex(currentPacket.value.fields, newField, targetFlatIndex);
}

// 将字段插入到扁平化索引对应的嵌套位置
function insertFieldAtFlatIndex(
  fields: PacketField[],
  fieldToInsert: PacketField,
  flatIndex: number
) {
  // 使用 UI 显示的扁平化列表（包含占位符），确保索引一致
  const flatList = flattenedFields.value;

  if (flatIndex >= flatList.length) {
    // 追加到末尾
    fields.push(fieldToInsert);
    return;
  }

  const targetItem = flatList[flatIndex];
  if (!targetItem) {
    fields.push(fieldToInsert);
    return;
  }

  // 如果目标是占位符，跳过（占位符已在 handleFieldAdd 中处理）
  if ((targetItem as any).isPlaceholder) {
    fields.push(fieldToInsert);
    return;
  }

  const targetField = targetItem as PacketField;

  // 查找目标字段在原始结构中的位置
  const parentInfo = findFieldParentInfo(fields, targetField.id!);

  if (!parentInfo) {
    // 目标字段是根级字段，找到它的索引并在其前面插入
    const rootIndex = fields.findIndex((f) => f.id === targetField.id);
    if (rootIndex !== -1) {
      fields.splice(rootIndex, 0, fieldToInsert);
    } else {
      fields.push(fieldToInsert);
    }
  } else {
    // 目标字段是嵌套字段，在其父字段的 fields 中找到位置
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

// 查找字段的父字段信息
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
    if (item.element && item.element.id === fieldId) {
      return { parent: item };
    }
  }
  return null;
}

// 根据扁平化索引查找该位置的父字段
function findParentFieldAtFlatIndex(
  fields: PacketField[],
  flatIndex: number
): PacketField | null {
  const flatList = packetStore.getFlattenedFields(fields);
  
  if (flatIndex >= flatList.length) {
    // 追加到末尾，没有父字段
    return null;
  }
  
  const targetField = flatList[flatIndex];
  if (!targetField) {
    return null;
  }
  
  // 查找目标字段的父字段
  const parentInfo = findFieldParentInfo(fields, targetField.id!);
  return parentInfo ? parentInfo.parent : null;
}

function selectField(flatIndex: number) {
  const fields = flattenedFields.value;
  if (flatIndex < 0 || flatIndex >= fields.length) return;

  // 使用 nextTick 避免Vue更新冲突
  nextTick(() => {
    selectedFieldIndex.value = flatIndex;
    // 点击字段时,如果右边栏已关闭,则重新打开
    if (!asideVisible.value) {
      asideVisible.value = true;
    }
  });
}

// 开始编辑单元格
function startEditCell(field: PacketField, column: 'name' | 'byteLength', event: MouseEvent) {
  event.stopPropagation();
  if (!field.id) return;

  editingCell.value = { fieldId: field.id, column };
  editingValue.value = column === 'name' ? field.fieldName || '' : field.byteLength || 0;

  // 下一帧自动聚焦到输入框
  nextTick(() => {
    const input = (event.target as HTMLElement).querySelector('input') ||
                  (event.target as HTMLElement).closest('.list-cell')?.querySelector('input');
    if (input) {
      (input as HTMLInputElement).focus();
      (input as HTMLInputElement).select();
    }
  });
}

// 保存单元格编辑
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

    // 检查是否为空
    if (!newName) {
      ElMessage.warning({ message: '字段名称不能为空', plain: true });
      return;
    }

    // 检查是否为英文（允许字母、数字、下划线，必须以字母开头）
    const englishNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!englishNameRegex.test(newName)) {
      ElMessage.warning({ message: '字段名称必须是英文，以字母开头，只能包含字母、数字和下划线', plain: true });
      return;
    }

    // 检查唯一性（排除当前字段）
    const existingNames = collectAllFieldNames(currentPacket.value.fields);
    existingNames.delete(field.fieldName || ''); // 移除当前字段的旧名称

    if (existingNames.has(newName)) {
      ElMessage.warning({ message: `字段名称 "${newName}" 已存在，请使用其他名称`, plain: true });
      return;
    }

    field.fieldName = newName;
  } else if (column === 'byteLength') {
    const numValue = Number(editingValue.value);
    if (!isNaN(numValue) && numValue >= 0) {
      field.byteLength = numValue;
    }
  }

  // 特殊处理：如果是命令字的子字段，同步更新父字段的 cases 对象
  const parentInfo = findFieldParentInfo(currentPacket.value.fields, fieldId);
  if (parentInfo && parentInfo.parent.type === 'Command' && parentInfo.parent.cases) {
    const parentField = parentInfo.parent;
    for (const key in parentField.cases) {
      if (parentField.cases[key].id === field.id) {
        if (column === 'name') {
          parentField.cases[key].fieldName = field.fieldName;
        } else if (column === 'byteLength') {
          parentField.cases[key].byteLength = field.byteLength;
        }
        break;
      }
    }
  }

  editingCell.value = null;
  editingValue.value = '';
}

// 取消单元格编辑
function cancelEditCell() {
  editingCell.value = null;
  editingValue.value = '';
}

// 处理编辑输入框的按键事件
function handleEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveEditCell();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEditCell();
  }
}

function handleFieldDoubleClick(index: number) {
  selectField(index);
}

// 基于扁平化索引删除字段
function removeFieldByFlatIndex(flatIndex: number) {
  console.log('=== removeFieldByFlatIndex called ===', { flatIndex });
  const fields = flattenedFields.value;
  console.log('flattenedFields:', fields);
  
  if (flatIndex < 0 || flatIndex >= fields.length) {
    console.log('Invalid flatIndex');
    return;
  }

  const fieldToDelete = fields[flatIndex];
  console.log('fieldToDelete:', fieldToDelete);
  
  if (!fieldToDelete.id) {
    console.log('No field ID');
    return;
  }

  ElMessageBox.confirm("确定要删除这个字段吗？", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    icon: h('i', { class: 'ri-error-warning-line', style: 'font-size: 22px; color: #faad14;' }),
  })
    .then(() => {
      console.log('Confirm delete, currentPacket:', currentPacket.value);
      if (!currentPacket.value?.fields) {
        console.log('No fields in currentPacket');
        return;
      }

      console.log('Before delete, fields:', JSON.parse(JSON.stringify(currentPacket.value.fields)));
      
      // 直接从 currentPacket.value.fields 中删除字段
      const success = removeFieldById(currentPacket.value.fields, fieldToDelete.id!);

      console.log('After delete, success:', success);
      console.log('After delete, fields:', JSON.parse(JSON.stringify(currentPacket.value.fields)));

      if (success) {
        // 清空选中状态
        if (selectedFieldIndex.value === flatIndex) {
          selectedFieldIndex.value = null;
        } else if (
          selectedFieldIndex.value !== null &&
          selectedFieldIndex.value > flatIndex
        ) {
          selectedFieldIndex.value--;
        }
        
        // ElMessage.success({ message: "字段已删除", plain: true });
      } else {
        ElMessage.error({ message: "删除字段失败", plain: true });
      }
    })
    .catch(() => {
      console.log('Cancel delete');
    });
}

// 递归删除字段（根据字段ID）
function removeFieldById(fieldList: PacketField[], fieldId: string): boolean {
  // 在当前层级查找
  const index = fieldList.findIndex((f) => f.id === fieldId);
  if (index !== -1) {
    fieldList.splice(index, 1);
    return true;
  }

  // 在嵌套字段中查找
  for (const field of fieldList) {
    if (field.fields && removeFieldById(field.fields, fieldId)) {
      return true;
    }
  }

  return false;
}

// 处理字段重新排序
function handleFieldReorder(newFlattenedFields: any[]) {
  console.log('=== handleFieldReorder called ===', { newFlattenedFields });
  if (!currentPacket.value?.fields) return;

  // 过滤掉占位符
  const realFields = newFlattenedFields.filter(f => !f.isPlaceholder);

  // 检查字段数量是否发生变化（如果增加了，说明是从外部拖入，由 handleFieldAdd 处理）
  const currentRealFieldCount = flattenedFields.value.filter(f => !f.isPlaceholder).length;
  if (realFields.length !== currentRealFieldCount) {
    // 字段数量变化了，说明是添加或删除操作，不是重排序
    return;
  }

  console.log('=== handleFieldReorder DEBUG ===');
  console.log('newFlattenedFields:', newFlattenedFields.map((f, idx) => ({
    index: idx,
    fieldName: f.isPlaceholder ? '[PLACEHOLDER]' : f.fieldName,
    type: f.type,
    level: f.level,
    parentId: f.parentId,
    isPlaceholder: f.isPlaceholder
  })));

  // 重新计算每个字段的 level
  // 策略：使用 DFS 重放逻辑，通过维护 currentLevel 来计算
  const fieldsWithUpdatedLevel: any[] = [];
  let currentLevel = 0;

  for (const item of newFlattenedFields) {
    // 1. 设置当前项的层级
    const updatedItem = {
      ...item,
      level: currentLevel
    };
    fieldsWithUpdatedLevel.push(updatedItem);

    // 2. 根据节点类型调整后续节点的层级
    if (item.isPlaceholder) {
      // 遇到占位符，意味着一个容器结束了，层级减一
      currentLevel--;
      if (currentLevel < 0) currentLevel = 0;
    } else if (item.expanded && canHaveChildren(item.type)) {
      // 遇到已展开的容器，意味着进入了容器内部，层级加一
      currentLevel++;
    }
  }

  // 过滤掉占位符，只保留真实字段用于重建树
  const realFieldsWithLevel = fieldsWithUpdatedLevel.filter(f => !f.isPlaceholder);

  console.log('fieldsWithUpdatedLevel:', realFieldsWithLevel.map(f => ({
    fieldName: f.fieldName,
    level: f.level
  })));

  // 重建层级结构
  const rebuildHierarchy = (flatList: any[]): PacketField[] => {
    const result: PacketField[] = [];
    const stack: { field: PacketField; level: number }[] = [];

    for (const item of flatList) {
      const level = item.level || 0;

      // 创建字段副本（移除扁平化用的临时属性）
      // 注意：不要复制 fields 数组，让它在重建过程中自然形成
      const field: PacketField = {
        id: item.id,
        fieldName: item.fieldName,
        type: item.type,
        description: item.description,
        byteLength: item.byteLength,
        defaultValue: item.defaultValue,
        displayFormat: item.displayFormat,
        isRequired: item.isRequired,
        validWhen: item.validWhen,
        messageIdValue: item.messageIdValue,
        valueType: item.valueType,
        precision: item.precision,
        unit: item.unit,
        valueRange: item.valueRange,
        length: item.length,
        subFields: item.subFields,
        baseType: item.baseType,
        maps: item.maps,
        count: item.count,
        countFromField: item.countFromField,
        bytesInTrailer: item.bytesInTrailer,
        expanded: item.expanded,
        // 不复制 fields、element、cases，让它们在重建过程中形成
        encoding: item.encoding,
        algorithm: item.algorithm,
        rangeStartRef: item.rangeStartRef,
        rangeEndRef: item.rangeEndRef,
        parameters: item.parameters,
      };

      // 弹出栈直到找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // 顶层字段
        result.push(field);
      } else {
        // 子字段
        const parent = stack[stack.length - 1].field;
        if (!parent.fields) {
          parent.fields = [];
        }
        parent.fields.push(field);
      }

      // 如果字段可以包含子字段，将其入栈
      if (canHaveChildren(field.type)) {
        stack.push({ field, level });
      }
    }

    return result;
  };

  // 重建字段层级结构
  currentPacket.value.fields = rebuildHierarchy(realFieldsWithLevel);
}

// 判断字段类型是否可以包含子字段
function canHaveChildren(fieldType?: string): boolean {
  return fieldType === "Struct" || fieldType === "Array" || fieldType === "Command";
}

// 获取扁平化的字段列表用于显示（包含虚拟占位符）
function getFlattenedFieldsForDisplay(): any[] {
  if (!currentPacket.value?.fields) return [];
  
  // 本地递归扁平化函数，不依赖store
  const flattenFields = (fields: PacketField[], level = 0): any[] => {
    const result: any[] = [];
    for (const field of fields) {
      result.push({ ...field, level });
      
      // 如果字段已展开且是容器类型
      if (field.expanded && canHaveChildren(field.type)) {
        // 先添加已有的子字段
        if (field.fields && field.fields.length > 0) {
          result.push(...flattenFields(field.fields, level + 1));
        }
        // 始终在容器末尾添加占位符，方便继续添加子字段
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

// 使用computed缓存扁平化字段列表，避免重复计算
const flattenedFields = computed(() => getFlattenedFieldsForDisplay());

// 使用computed获取当前选中的字段
const selectedField = computed(() => {
  if (selectedFieldIndex.value === null) return null;
  const fields = flattenedFields.value;
  if (selectedFieldIndex.value < 0 || selectedFieldIndex.value >= fields.length) return null;
  return fields[selectedFieldIndex.value];
});

// 切换字段展开状态
function toggleFieldExpanded(fieldId: string) {
  if (!currentPacket.value?.fields) return;
  
  // 本地递归查找并切换字段的展开状态
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

// 关闭右侧属性面板
function closeAside() {
  // 关闭右边栏,但保留选中状态
  nextTick(() => {
    asideVisible.value = false;
  });
}

async function handleRouteChange() {
  const mode = route.query.mode as string | undefined;
  const id = route.query.id as string | undefined;

  if (!mode) {
    showDetailView.value = false;
    currentPacket.value = null;
    selectedFieldIndex.value = null;
    asideVisible.value = true; // 重置右边栏状态
    return;
  }

  if (mode === "add") {
    const np: Packet = {
      id: 0,  // 新增时由后端生成，暂时设为0
      name: "NewMessage",  // 默认英文名称
      description: "",
      device: deviceList.value[0] || "",
      protocol: "tcp",
      status: 1,
      version: "1.0",  // 默认版本号1.0
      default_byte_order: "big",  // 默认大端序(网络字节序标准)
      struct_alignment: 1,  // 默认1字节对齐(通信报文紧凑打包)
      field_count: 0,
      updated_at: Date.now(),
      fields: [],
    };
    currentPacket.value = np;
    // 新建模式下，初始化为未保存状态
    lastSavedPacket.value = '';
    hasUnsavedChanges.value = false;
    showDetailView.value = true;
    selectedFieldIndex.value = null;
    asideVisible.value = true; // 新建时默认打开右边栏
    // 新建时基本信息面板默认展开
    panels.basicInfo.expanded = true;
    return;
  }

  if (!id) {
    showDetailView.value = false;
    currentPacket.value = null;
    selectedFieldIndex.value = null;
    asideVisible.value = true; // 重置右边栏状态
    return;
  }

  // 通过 API 获取报文详情（支持数字ID和字符串ID）
  try {
    const response = await getMessageDetail(id);
    console.log('[handleRouteChange] getMessageDetail response:', response);
    // response 已经是 data 层的数据
    const data = response?.data || response;
    if (!data) {
      router.replace({ path: "/packet-config" });
      return;
    }
    
    // 确保fields字段正确解析
    if (typeof data.fields === 'string') {
      try {
        data.fields = JSON.parse(data.fields);
      } catch (e) {
        console.error('解析fields字段失败:', e);
        data.fields = [];
      }
    }
    if (!Array.isArray(data.fields)) {
      data.fields = [];
    }
    
    // 转换fields字段名从大写转为小写驼峰命名
    if (data.fields.length > 0) {
      console.log('转换前fields[0]:', JSON.stringify(data.fields[0], null, 2));
      data.fields = keysToLowerCamelCase(data.fields);
      console.log('转换后fields[0]:', JSON.stringify(data.fields[0], null, 2));
      // 将数组的 element 转换为 fields 以便UI显示
      data.fields = convertLoadedDataToUIFormat(data.fields);
    }
    
    currentPacket.value = data as Packet;
    // 保存初始状态
    lastSavedPacket.value = JSON.stringify(currentPacket.value);
    hasUnsavedChanges.value = false;
    // 编辑模式下基本信息面板默认折叠
    panels.basicInfo.expanded = false;
  } catch (error) {
    console.error("获取报文详情失败:", error);
    router.replace({ path: "/packet-config" });
    return;
  }
  showDetailView.value = true;
  selectedFieldIndex.value = null;
  asideVisible.value = true; // 编辑模式下默认打开右边栏
}

watch(() => route.query, handleRouteChange, { immediate: true });

// 监听报文数据变化，标记为未保存
watch(
  () => currentPacket.value,
  (newVal) => {
    if (newVal && lastSavedPacket.value) {
      const currentState = JSON.stringify(newVal);
      hasUnsavedChanges.value = currentState !== lastSavedPacket.value;
    }
  },
  { deep: true }
);

// 拖动调整右侧面板宽度的功能
function startResize(e: MouseEvent) {
  isResizing.value = true;
  const startX = e.clientX;
  const startWidth = asideWidth.value;

  function onMouseMove(moveEvent: MouseEvent) {
    if (!isResizing.value) return;

    // 计算新宽度 (从右向左拖动，所以是减法)
    const deltaX = startX - moveEvent.clientX;
    const newWidth = startWidth + deltaX;

    // 限制宽度范围: 最小320px, 最大窗口宽度的60%
    const minWidth = 320;
    const maxWidth = window.innerWidth * 0.6;
    asideWidth.value = Math.min(Math.max(newWidth, minWidth), maxWidth);
  }

  function onMouseUp() {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // 移除body的user-select禁用
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  // 禁用文本选择，优化拖动体验
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

onMounted(() => {
  pageInfo.value.total = packetStore.packetCount;
});

provide("packetList", () => packetList.value);
provide("deviceList", () => deviceList.value);
</script>

<style lang="scss" scoped src="./index.scss"></style>

<!-- 全局样式：用于覆盖 Element Plus 弹窗组件 -->
<style lang="scss">
// 品牌色弹窗样式
.confirm-dialog-brand {
  border-radius: 4px;

  .el-message-box__header {
    padding-bottom: 12px;
  }

  .el-message-box__title {
    font-weight: 600;
    color: #262626;
  }

  .el-message-box__content {
    color: #595959;
  }

  .el-message-box__btns {
    .el-button--primary {
      background-color: #2f54eb;
      border-color: #2f54eb;
      border-radius: 2px;

      &:hover,
      &:focus {
        background-color: #3d63f4;
        border-color: #3d63f4;
      }
    }

    .el-button--default {
      border-radius: 2px;
    }
  }
}

// 代码预览弹窗样式 (全局)
/* 发布对话框样式 */
.publish-dialog {
  display: flex;
  flex-direction: column;
  margin-top: 5vh !important;
}

.publish-dialog .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.publish-dialog .el-dialog__body {
  padding: 0;
  height: 65vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.publish-dialog .el-dialog__footer {
  padding: 12px 20px;
  border-top: 1px solid #e8e8e8;
}

.publish-dialog-header .version-info {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.publish-dialog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.publish-dialog-content .publish-tabs {
  display: flex;
  gap: 0;
  padding: 0;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
}

.publish-dialog-content .publish-tabs .publish-tab {
  padding: 12px 24px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.publish-dialog-content .publish-tabs .publish-tab:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.publish-dialog-content .publish-tabs .publish-tab.active {
  color: #1890ff;
  background: #fff;
  border-bottom-color: #1890ff;
}

.publish-dialog-content .publish-tab-content {
  flex: 1;
  overflow: auto;
  background: #fff;
}

/* 文字版影响分析 */
.publish-dialog-content .publish-tab-content .impact-text-view {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-icon.protocol {
  background: #e6f7ff;
  color: #1890ff;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-icon.hardware {
  background: #fff7e6;
  color: #fa8c16;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-icon.software {
  background: #f6ffed;
  color: #52c41a;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-badge.high {
  background: #fff1f0;
  color: #f5222d;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-badge.medium {
  background: #fff7e6;
  color: #fa8c16;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-header .impact-badge.low {
  background: #f6ffed;
  color: #52c41a;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-item-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-affected {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-affected .affected-label {
  font-size: 12px;
  color: #999;
}

.publish-dialog-content .publish-tab-content .impact-text-view .impact-section .impact-list .impact-item .impact-affected .affected-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  color: #666;
}

/* 拓扑图视图 */
.impact-topology-view {
  height: 100%;
  min-height: 450px;
  padding: 16px;
  box-sizing: border-box;
}

.publish-topology-canvas {
  width: 100%;
  height: 100%;
  min-height: 420px;
  position: relative;
  background-color: #fdfdfd;
  background-image: radial-gradient(#dfe6e9 1px, transparent 1px);
  background-size: 20px 20px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

/* 拓扑图导航条 */
.publish-navbar {
  position: absolute;
  top: 12px;
  left: 12px;
  background: white;
  padding: 6px 12px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.publish-nav-item {
  cursor: pointer;
  color: #0984e3;
  font-weight: bold;
}

.publish-nav-item:hover {
  text-decoration: underline;
}

.publish-nav-arrow {
  color: #999;
}

/* SVG连线层 */
.publish-svg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 节点层 */
.publish-node-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 节点通用样式 */
.publish-node {
  position: absolute;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 2;
}

/* L0系统节点 */
.publish-l0-system {
  width: 140px;
  height: 80px;
  background: #0984e3;
  color: white;
  cursor: pointer;
  font-size: 13px;
}

.publish-l0-system:hover {
  transform: scale(1.05);
}

.publish-node-hint {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 4px;
}

/* 外部上下文节点 */
.publish-context-node {
  width: 100px;
  height: 60px;
  background: #b2bec3;
  color: white;
  border: 2px dashed #fff;
  z-index: 1;
  font-size: 12px;
}

.publish-context-label {
  font-size: 9px;
  text-transform: uppercase;
  margin-bottom: 2px;
  opacity: 0.8;
}

/* 系统边界框 */
.publish-system-boundary {
  position: absolute;
  border: 2px dashed #0984e3;
  background: rgba(9, 132, 227, 0.03);
  border-radius: 8px;
  z-index: 0;
  pointer-events: none;
  left: 80px;
  top: 100px;
  width: 550px;
  height: 300px;
}

.publish-boundary-label {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #0984e3;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
}

/* 内部硬件节点 */
.publish-internal-hardware {
  background: white;
  border: 2px solid #636e72;
  color: #333;
  width: 160px;
  padding: 8px;
  align-items: stretch !important;
  justify-content: flex-start !important;
}

.publish-hw-header {
  background: #636e72;
  color: white;
  font-size: 10px;
  padding: 3px;
  margin: -8px -8px 8px -8px;
  text-align: center;
  border-radius: 4px 4px 0 0;
}

/* 内部软件 */
.publish-internal-software {
  background: #00cec9;
  color: white;
  padding: 6px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  text-align: center;
}

.publish-internal-software:last-child {
  margin-bottom: 0;
}

/* 受影响高亮 */
.publish-affected {
  box-shadow: 0 0 0 3px rgba(214, 48, 49, 0.4) !important;
  border-color: #d63031 !important;
}

.publish-internal-software.publish-affected {
  box-shadow: 0 0 0 2px rgba(214, 48, 49, 0.6) !important;
}

/* SVG连线样式 */
.publish-svg-layer .edge {
  stroke: #999;
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 5, 5;
}

.publish-svg-layer .edge-label {
  font-size: 10px;
  fill: #666;
}

.publish-svg-layer .affected-edge {
  stroke: #d63031;
  stroke-width: 3;
  stroke-dasharray: none;
}

.publish-svg-layer .affected-text {
  fill: #d63031;
  font-weight: bold;
  font-size: 11px;
}

/* 发布对话框底部按钮 */
.publish-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.publish-dialog-footer .btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.publish-dialog-footer .btn.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.publish-dialog-footer .btn.btn-secondary:hover {
  background: #e0e0e0;
}

.publish-dialog-footer .btn.btn-primary {
  background: #00b894;
  color: white;
}

.publish-dialog-footer .btn.btn-primary:hover {
  background: #00a383;
}

.code-preview-dialog {
  display: flex;
  flex-direction: column;
  margin-top: 5vh !important; // 覆盖默认 top 属性

  .el-dialog__body {
    padding: 0;
    height: 70vh; // 固定高度
    overflow: hidden; // 隐藏 body 滚动条，让内部内容滚动
    display: flex;
    flex-direction: column;
  }
}
</style>
