<template>
  <div class="packet-list-view">
    <!-- 搜索和筛选区域 -->
    <div class="packet-search-filter">
      <div class="filter-left">
        <el-input
          v-model="filterInfo.keyword"
          class="filter-item search-input"
          placeholder="搜索报文名称..."
          prefix-icon="Search"
          clearable
          @input="handleSearch"
        />

        <el-select
          v-model="filterInfo.device"
          placeholder="所有设备"
          class="filter-item device-select"
          clearable
          @change="handleFilter"
        >
          <el-option
            v-for="device in deviceList?.()"
            :key="device"
            :label="device"
            :value="device"
          />
        </el-select>

        <el-select
          v-model="filterInfo.status"
          placeholder="所有状态"
          class="filter-item status-select"
          clearable
          @change="handleFilter"
        >
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>
      </div>

      <div class="filter-right">
        <el-button icon="Upload" @click="handleImportPacket">
          导入报文
        </el-button>
        <el-button type="primary" icon="Plus" @click="handleAddPacket">
          新增报文
        </el-button>
      </div>
    </div>

    <!-- 批量操作栏 (仅当有选中项时显示) -->
    <div v-if="selectedInfo.ids.length > 0" class="batch-actions-bar">
      <div class="selected-count">
        已选择 <span>{{ selectedInfo.ids.length }}</span> 项
      </div>
      <div class="actions">
        <el-button plain size="small" @click="handleImportPacket">导入</el-button>
        <el-button plain size="small" @click="handleBatchExport">导出</el-button>
        <el-button type="success" plain size="small" @click="handleBatchEnable">批量启用</el-button>
        <el-button type="warning" plain size="small" @click="handleBatchDisable">批量禁用</el-button>
        <el-button type="danger" plain size="small" @click="handleBatchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="packet-table-container">
      <el-table
        ref="tableRef"
        :data="filteredPacketList"
        style="width: 100%"
        highlight-current-row
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="报文名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="packet-name-cell" @click="handleEditPacket(row)">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="device" label="关联设备" width="150" show-overflow-tooltip />

        <el-table-column prop="field_count" label="字段数量" width="100" align="center" />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : 'info'"
              effect="plain"
              round
              size="small"
            >
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="最后修改" width="180" align="center">
          <template #default="{ row }">
            {{ row.updated_at ? new Date(row.updated_at).toLocaleDateString('zh-CN') : "-" }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-tooltip content="编辑" placement="top">
                <el-button link type="primary" icon="Edit" @click="emit('editPacket', row)" />
              </el-tooltip>
              
              <el-tooltip content="复制" placement="top">
                <el-button link type="primary" icon="CopyDocument" @click="handleCopyPacket(row)" />
              </el-tooltip>
              
              <el-tooltip content="导出JSON" placement="top">
                <el-button link type="primary" icon="Download" @click="handleExportPacket(row)" />
              </el-tooltip>
              
              <el-tooltip content="删除" placement="top">
                <el-button link type="danger" icon="Delete" @click="handleDeletePacket(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页区域 -->
    <div class="packet-pagination">
      <span>
        显示第
        <span id="page-start">
          {{ pageInfo.total === 0 ? 0 : (pageInfo.currentPage - 1) * pageInfo.pageSize + 1 }}
        </span>
        -
        <span id="page-end">
          {{ pageInfo.total === 0 ? 0 : Math.min(pageInfo.currentPage * pageInfo.pageSize, pageInfo.total) }}
        </span>
        项，共
        <span id="total-count">
          {{ pageInfo.total }}
        </span> 项
      </span>

      <div class="pagination-controls">
        <button
          id="prev-page"
          class="pagination-btn"
          :disabled="pageInfo.currentPage === 1"
          @click="handlePageChange(pageInfo.currentPage - 1)"
        >
          上一页
        </button>

        <el-select v-model="pageInfo.pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option :label="10" :value="10" />
          <el-option :label="20" :value="20" />
          <el-option :label="50" :value="50" />
          <el-option :label="100" :value="100" />
        </el-select>

        <button
          id="next-page"
          class="pagination-btn"
          :disabled="pageInfo.currentPage >= Math.ceil(pageInfo.total / pageInfo.pageSize || 1)"
          @click="handlePageChange(pageInfo.currentPage + 1)"
        >
          下一页
        </button>
      </div>

      <!-- 保留原有分页组件：用于回退/对照；避免直接删除现存代码 -->
      <el-pagination
        v-show="false"
        v-model:current-page="pageInfo.currentPage"
        v-model:page-size="pageInfo.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pageInfo.total"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, inject, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import {
  getMessageList,
  getMessageDetail,
  deleteMessage,
  postMessageDuplicate,
  postMessageBatchDelete,
  postMessageBatchEnable,
  postMessageBatchDisable,
  postMessageCreate,
} from "@/api/messageManagement";

interface Packet {
  id: number;
  name: string;
  description?: string;
  device: string;
  protocol: string;
  field_count: number;
  status: number;
  updated_at?: number;
  fields?: PacketField[];
  version?: string;
  default_byte_order?: string;
  struct_alignment?: number | null;
}

interface FilterInfo {
  keyword: string;
  device: string;
  status: string;
}

interface SelectedInfo {
  ids: string[];
  selectAll: boolean;
}

interface PageInfo {
  currentPage: number;
  pageSize: number;
  total: number;
}

// 将大写字段改为全小写
interface PacketField {
  id?: string;
  name: string;
  type: string;
  description?: string;
  length?: number;
  displayFormat?: string;
  defaultValue?: string | number;
  isRequired?: boolean;
  unit?: string;
  valueMapping?: Record<string, string>;
  bitFields?: PacketField[];
  children?: PacketField[];
  fields?: PacketField[];
  element?: PacketField;
  level?: number;
  parentId?: string;
  expanded?: boolean;
}

const router = useRouter();

const filterInfo = defineModel<FilterInfo>("filterInfo", { required: true });
const selectedInfo = defineModel<SelectedInfo>("selectedInfo", {
  required: true,
});
const pageInfo = defineModel<PageInfo>("pageInfo", { required: true });

const packetList = inject<() => Packet[]>("packetList");
const deviceList = inject<() => string[]>("deviceList");

const emit = defineEmits<{
  (e: "editPacket", packet: Packet): void;
}>();

const tableRef = ref<InstanceType<typeof ElTable>>();
const filteredPacketList = ref<Packet[]>([]);

// 初始化报文列表
const getInfo = async () => {
  try {
    const response = await getMessageList({
      currentPage: pageInfo.value.currentPage,
      pageSize: pageInfo.value.pageSize,
      keyword: filterInfo.value?.keyword || undefined,
      device: filterInfo.value?.device || undefined,
      status: filterInfo.value?.status || undefined
    });
    // response 结构是 { list: [...], pagination: {...} }
    filteredPacketList.value = response?.list || [];
    pageInfo.value.currentPage = response?.pagination?.currentPage || 1;
    pageInfo.value.pageSize = response?.pagination?.pageSize || 10;
    pageInfo.value.total = response?.pagination?.total || 0;
  } catch (error) {
    console.error("获取报文列表失败:", error);
  }
};

onMounted(() => {
  getInfo();
});

function handleSearch() {
  pageInfo.value.currentPage = 1;
  getInfo();
}

function handleFilter() {
  pageInfo.value.currentPage = 1;
  getInfo();
}

function handlePageChange(currentPage?: number) {
  if (typeof currentPage === "number" && Number.isFinite(currentPage)) {
    pageInfo.value.currentPage = currentPage;
  }
  getInfo();
}

function handlePageSizeChange(pageSize?: number) {
  if (typeof pageSize === "number" && Number.isFinite(pageSize)) {
    pageInfo.value.pageSize = pageSize;
  }
  pageInfo.value.currentPage = 1;
  getInfo();
}

function handleSelectionChange(selection: Packet[]) {
  selectedInfo.value.ids = selection.map(p => String(p.id));
  selectedInfo.value.selectAll = selection.length === filteredPacketList.value.length && selection.length > 0;
}

// 表格行class：用于“勾选选中行”的高亮（设计方案：#e6f4ff）
function getRowClassName({ row }: { row: Packet }) {
  if (!selectedInfo.value || !Array.isArray(selectedInfo.value.ids)) return "";
  return selectedInfo.value.ids.includes(String(row.id)) ? "packet-row-selected" : "";
}

// 内部事件处理函数
function handleEditPacket(packet: Packet) {
  console.log('[packet-list] handleEditPacket 被调用，packet:', packet);
  emit('editPacket', packet);
}

function handleAddPacket() {
  router.push({ path: "/packet-config", query: { mode: "add" } });
}

async function handleCopyPacket(packet: Packet) {
  try {
    // 生成复制后的名称：原名称_Copy_N
    const baseName = packet.name;
    let copyIndex = 1;
    let newName = `${baseName}_Copy_${copyIndex}`;
    
    // 检查当前列表中是否存在同名报文，如果存在则递增序号
    const existingNameList = filteredPacketList.value.map(p => p.name);
    while (existingNameList.includes(newName)) {
      copyIndex++;
      newName = `${baseName}_Copy_${copyIndex}`;
    }
    
    await postMessageDuplicate(packet.id, { name: newName });
    ElMessage.success(`报文"${packet.name}"已复制为"${newName}"`);
    getInfo();
  } catch (error) {
    console.error("复制报文失败:", error);
  }
}

function handleDeletePacket(packet: Packet) {
  ElMessageBox.confirm(`确定要删除报文"${packet.name}"吗？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    icon: h('i', { class: 'ri-error-warning-line', style: { fontSize: '22px', color: '#faad14' } }),
  })
    .then(async () => {
      try {
        await deleteMessage(packet.id);
        ElMessage.success(`报文"${packet.name}"已删除`);
        getInfo();
      } catch (error) {
        console.error("删除报文失败:", error);
        ElMessageBox.alert(`删除报文"${packet.name}"失败：${error instanceof Error ? error.message : '未知错误'}`, "删除失败", {
          confirmButtonText: "确定",
          type: "error",
          icon: h('i', { class: 'ri-close-circle-line', style: { fontSize: '22px', color: '#ff4d4f' } }),
        });
      }
    })
    .catch(() => {});
}

async function handleBatchEnable() {
  if (!selectedInfo.value || selectedInfo.value.ids.length === 0) return;
  
  try {
    await postMessageBatchEnable({ ids: selectedInfo.value.ids.map(Number) });
    ElMessage.success(`成功启用 ${selectedInfo.value.ids.length} 个报文`);
    // 操作完成后，清空选择（可选）
    // tableRef.value?.clearSelection();
    getInfo();
  } catch (error) {
    console.error("批量启用失败:", error);
  }
}

async function handleBatchDisable() {
  if (!selectedInfo.value || selectedInfo.value.ids.length === 0) return;

  try {
    await postMessageBatchDisable({ ids: selectedInfo.value.ids.map(Number) });
    ElMessage.success(`成功禁用 ${selectedInfo.value.ids.length} 个报文`);
    getInfo();
  } catch (error) {
    console.error("批量禁用失败:", error);
  }
}

const handleBatchDelete = async () => {
  if (!selectedInfo.value || selectedInfo.value.ids.length === 0) return;

  const deleteCount = selectedInfo.value.ids.length;
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${deleteCount} 个报文吗？`,
    "批量删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      icon: h('i', { class: 'ri-error-warning-line', style: { fontSize: '22px', color: '#faad14' } }),
    }
  )
    .then(async () => {
      try {
        await postMessageBatchDelete({ ids: selectedInfo.value.ids.map(Number) });
        ElMessage.success(`已删除 ${deleteCount} 个报文`);
        tableRef.value?.clearSelection();
        getInfo();
      } catch (error) {
        console.error("批量删除失败:", error);
        ElMessageBox.alert(`批量删除失败：${error instanceof Error ? error.message : '未知错误'}`, "删除失败", {
          confirmButtonText: "确定",
          type: "error",
          icon: h('i', { class: 'ri-close-circle-line', style: { fontSize: '22px', color: '#ff4d4f' } }),
        });
      }
    })
    .catch(() => {});
};

async function handleBatchExport() {
  if (!selectedInfo.value || selectedInfo.value.ids.length === 0) return;
  const allPackets = packetList?.() || [];
  // 注意：filteredPacketList 可能只包含当前页，如果 packetList 是全量数据则从那里取，
  // 或者尝试从 filteredPacketList 中查找（如果支持全选跨页，逻辑会更复杂，这里假设当前页）
  // 简单起见，从 filteredPacketList 中查找
  const selectedPackets = filteredPacketList.value.filter((p) =>
    selectedInfo.value?.ids.includes(String(p.id))
  );
  
  if (selectedPackets.length === 0) return;

  // 顺序导出，避免并发触发多次下载/弹框导致体验不稳定
  for (const packet of selectedPackets) {
    await handleExportPacket(packet);
  }
}

// 导入报文函数：选择 JSON 文件，调用后端接口创建新报文
function handleImportPacket() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      // 验证 JSON 数据格式
      if (!jsonData.name) {
        throw new Error("无效的报文JSON格式：缺少 name 字段");
      }

      console.log("[packet-list] 导入报文：解析 JSON 成功", {
        name: jsonData.name,
        fieldsLength: Array.isArray(jsonData.fields) ? jsonData.fields.length : 0,
        firstField: Array.isArray(jsonData.fields) && jsonData.fields.length > 0 
          ? JSON.stringify(jsonData.fields[0]) 
          : null,
      });

      // 生成导入后的名称：原名称_Copy_N（与复制报文的命名逻辑一致）
      const baseName = jsonData.name;
      let copyIndex = 1;
      let newName = `${baseName}_Copy_${copyIndex}`;
      
      // 检查当前列表中是否存在同名报文，如果存在则递增序号
      const existingNameList = filteredPacketList.value.map(p => p.name);
      while (existingNameList.includes(newName)) {
        copyIndex++;
        newName = `${baseName}_Copy_${copyIndex}`;
      }

      // 构建后端需要的创建数据（字段名与后端兼容）
      const createData = {
        name: newName,
        description: jsonData.description || "",
        device: jsonData.device || "未知设备",
        protocol: jsonData.protocol || "tcp",
        version: "1.0",
        default_byte_order: jsonData.defaultByteOrder || jsonData.default_byte_order || "big",
        struct_alignment: jsonData.structAlignment ?? jsonData.struct_alignment ?? null,
        status: typeof jsonData.status === "number" ? jsonData.status : 1,
        field_count: Array.isArray(jsonData.fields) ? jsonData.fields.length : 0,
        fields: Array.isArray(jsonData.fields) ? jsonData.fields : [],
      };

      // 调用后端接口创建新报文
      console.log("[packet-list] 导入报文：发送给后端的 createData", createData);
      console.log("[packet-list] 导入报文：createData.fields[0]", 
        createData.fields.length > 0 ? JSON.stringify(createData.fields[0], null, 2) : "无字段");
      await postMessageCreate(createData);
      ElMessage.success(`成功导入报文"${newName}"`);

      // 刷新列表
      getInfo();
    } catch (error: unknown) {
      console.error("[packet-list] 导入报文失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "未知错误";
      ElMessageBox.alert(`导入失败：${errorMessage}`, "错误", {
        confirmButtonText: "确定",
        type: "error",
        icon: h('i', { class: 'ri-close-circle-line', style: { fontSize: '22px', color: '#ff4d4f' } }),
      });
    }
  };
  input.click();
}

// 导出报文函数
async function handleExportPacket(packet: Packet) {
  try {
    // 说明：
    // - 列表接口使用 raw 查询时，fields 可能是 JSON 字符串（会绕过模型 getter），直接导出会变成空数组
    // - 因此导出时优先尝试解析列表 fields；若仍拿不到数组，则走详情接口补全
    let exportPacket: any = packet;
    let fieldsForExport: unknown = (packet as any).fields;

    console.log("[packet-list] 开始导出报文", {
      id: packet.id,
      name: packet.name,
      fieldsType: typeof fieldsForExport,
      fieldsIsArray: Array.isArray(fieldsForExport),
      fieldsStringLength:
        typeof fieldsForExport === "string" ? fieldsForExport.length : undefined,
    });

    // 列表 fields 是 JSON 字符串时先尝试解析
    if (typeof fieldsForExport === "string") {
      try {
        fieldsForExport = JSON.parse(fieldsForExport);
      } catch (e) {
        console.warn(
          "[packet-list] 导出报文：列表 fields JSON 解析失败，将改用详情接口补全",
          e
        );
        fieldsForExport = undefined;
      }
    }

    // 列表拿不到有效 fields，则走详情接口拿完整报文（fields 会被模型 getter 正确解析为数组）
    if (!Array.isArray(fieldsForExport) || fieldsForExport.length === 0) {
      const detail = await getMessageDetail(packet.id);
      if (detail) {
        exportPacket = detail as any;
        fieldsForExport = (detail as any).fields;
      }
      console.log("[packet-list] 导出报文：已通过详情接口补全", {
        id: packet.id,
        detailFieldsIsArray: Array.isArray(fieldsForExport),
        detailFieldsLength: Array.isArray(fieldsForExport)
          ? fieldsForExport.length
          : undefined,
      });
    }

    // 直接从报文数据中获取报文数据，转换为标准JSON格式
    const exportData = {
      name: exportPacket.name || packet.name,
      description: exportPacket.description || packet.description || "",
      version: exportPacket.version || "1.0",
      defaultByteOrder:
        exportPacket.default_byte_order || exportPacket.defaultByteOrder || "big",
      // 按标准 JSON 设计方案：structAlignment 可选，不需要时让其为 undefined（JSON.stringify 会自动忽略）
      structAlignment:
        typeof exportPacket.struct_alignment === "number"
          ? exportPacket.struct_alignment
          : undefined,
      device: exportPacket.device || packet.device,
      protocol: exportPacket.protocol || packet.protocol,
      status:
        exportPacket.status !== undefined ? exportPacket.status : packet.status,
      fields: convertInternalFieldsToStandardJson(
        Array.isArray(fieldsForExport) ? (fieldsForExport as any) : []
      ),
    };

    // 创建下载链接
    const jsonText = JSON.stringify(exportData, null, 2);
    console.log("[packet-list] 导出报文：JSON长度", {
      id: packet.id,
      jsonLength: typeof jsonText === "string" ? jsonText.length : undefined,
    });

    // 说明：部分浏览器在短时间内多次触发 Blob URL 下载时，可能出现第二次下载 0 字节的问题。
    // 这里改为 data URI 方式导出，避免 createObjectURL/revokeObjectURL 的时序问题。
    // （流程图页面导出 JSON 也是这种方式）
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(jsonText);

    const a = document.createElement("a");
    a.href = dataUri;
    // 注意：部分环境下，如果文件名完全相同，连续导出可能出现第二次文件 0 字节的问题
    // 这里在文件名中追加时间戳，确保每次导出文件名唯一
    const safePacketName = (packet.name || "").replace(/[^\w\s-]/g, "").trim();
    a.download = `${safePacketName || "packet"}_${packet.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    // 说明：点击触发下载是异步过程，立即移除节点在部分环境下可能导致下载内容异常
    window.setTimeout(() => {
      document.body.removeChild(a);
    }, 0);

    // 旧实现（Blob + createObjectURL）保留思路说明：
    // const blob = new Blob([jsonText], { type: "application/json" });
    // const url = URL.createObjectURL(blob);
    // a.href = url;
    // window.setTimeout(() => URL.revokeObjectURL(url), 1500);

    ElMessage.success(`成功导出报文"${packet.name}"`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    ElMessageBox.alert(`导出失败：${errorMessage}`, "错误", {
      confirmButtonText: "确定",
      type: "error",
      icon: h('i', { class: 'ri-close-circle-line', style: { fontSize: '22px', color: '#ff4d4f' } }),
    });
  }
}

// 转换标准JSON字段为内部格式（数据结构已统一，只需添加id）
function convertStandardJsonToInternalFields(
  jsonFields: PacketField[]
): PacketField[] {
  return jsonFields.map((field) => {
    const internalField: PacketField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...field,
    };

    // 递归处理嵌套字段
    if (field.fields) {
      internalField.fields = convertStandardJsonToInternalFields(field.fields);
      internalField.expanded = false;
    }

    if (field.element) {
      internalField.element = convertStandardJsonToInternalFields([
        field.element,
      ])[0];
      internalField.expanded = false;
    }

    return internalField;
  });
}

// 转换内部字段为标准JSON格式（数据结构已统一，只需移除id和内部字段）
function convertInternalFieldsToStandardJson(
  internalFields: PacketField[]
): Omit<PacketField, "id" | "level" | "parentId" | "expanded">[] {
  // 确保internalFields是数组
  if (!Array.isArray(internalFields)) {
    return [];
  }

  return internalFields.map((field) => {
    const {
      id: _id,
      level: _level,
      parentId: _parentId,
      expanded: _expanded,
      ...jsonField
    } = field;

    // 递归处理嵌套字段
    if (field.fields && Array.isArray(field.fields)) {
      jsonField.fields = convertInternalFieldsToStandardJson(field.fields);
    }

    if (field.element) {
      jsonField.element = convertInternalFieldsToStandardJson([
        field.element,
      ])[0];
    }

    return jsonField;
  });
}
</script>
<style lang="scss" scoped src="./index.scss"></style>