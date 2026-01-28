<template>
  <el-dialog
    :model-value="visible"
    :title="`接口连接配置 - ${compOptions.interfaceName}`"
    width="680px"
    destroy-on-close
    @update:model-value="(val) => emit('update:visible', val)"
    @opened="loadConfig"
  >
    <div class="connection-config-form">
      <!-- 接口名称 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="form-required">
              *
            </span>
            接口名称
          </label>

          <input
            v-model="connectionConfig.name"
            type="text"
            class="form-control"
            placeholder="请输入接口名称"
          />
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="form-required">
              *
            </span>
            连接方式
          </label>

          <el-select
            v-model="connectionConfig.type"
            placeholder="请选择连接方式"
            class="form-control-select"
            @change="handleConnectionTypeChange"
          >
            <el-option
              v-for="item in connectionTypeOptionList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 方向选择（DDS 不需要，因为同一个 Participant 可以同时发布和订阅） -->
      <div v-if="connectionConfig.type !== 'DDS'" class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="form-required">
              *
            </span>
            数据方向
          </label>

          <el-radio-group v-model="connectionConfig.role" class="form-radio-group">
            <el-radio value="input">
              接收 (Input)
            </el-radio>

            <el-radio value="output">
              发送 (Output)
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- TCP 配置 -->
      <template v-if="connectionConfig.type === 'TCP'">
        <div class="form-section-title">
          TCP 配置
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              {{ connectionConfig.role === 'input' ? '监听地址' : '目标地址' }}
            </label>

            <input
              v-model="connectionConfig.host"
              type="text"
              class="form-control"
              :placeholder="connectionConfig.role === 'input' ? '0.0.0.0 表示所有网卡' : '请输入目标IP'"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ connectionConfig.role === 'input' ? '监听端口' : '目标端口' }}
            </label>

            <el-input-number
              v-model="connectionConfig.port"
              :min="1"
              :max="65535"
              controls-position="right"
              placeholder="端口号"
              style="width: 100%"
            />
          </div>
        </div>

        <div v-if="connectionConfig.role === 'output'" class="form-row">
          <div class="form-group">
            <label class="form-label">
              超时时间 (ms)
            </label>

            <el-input-number
              v-model="connectionConfig.timeout"
              :min="0"
              :max="300000"
              :step="1000"
              controls-position="right"
              placeholder="连接超时"
              style="width: 100%"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              数据编码
            </label>

            <el-select v-model="connectionConfig.encoding" class="form-control-select">
              <el-option label="UTF-8" value="utf8" />

              <el-option label="ASCII" value="ascii" />

              <el-option label="HEX" value="hex" />

              <el-option label="Base64" value="base64" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- UDP 配置 -->
      <template v-if="connectionConfig.type === 'UDP'">
        <div class="form-section-title">
          UDP 配置
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              {{ connectionConfig.role === 'input' ? '监听地址' : '目标地址' }}
            </label>

            <input
              v-model="connectionConfig.host"
              type="text"
              class="form-control"
              :placeholder="connectionConfig.role === 'input' ? '0.0.0.0 表示所有网卡' : '请输入目标IP'"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ connectionConfig.role === 'input' ? '监听端口' : '目标端口' }}
            </label>

            <el-input-number
              v-model="connectionConfig.port"
              :min="1"
              :max="65535"
              controls-position="right"
              placeholder="端口号"
              style="width: 100%"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              组播地址 (可选)
            </label>

            <input
              v-model="connectionConfig.multicastGroup"
              type="text"
              class="form-control"
              placeholder="例如: 239.1.1.100"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              数据编码
            </label>

            <el-select v-model="connectionConfig.encoding" class="form-control-select">
              <el-option label="UTF-8" value="utf8" />

              <el-option label="ASCII" value="ascii" />

              <el-option label="HEX" value="hex" />

              <el-option label="Base64" value="base64" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- Serial 配置 -->
      <template v-if="connectionConfig.type === 'Serial'">
        <div class="form-section-title">
          串口配置
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              串口名称
            </label>

            <input
              v-model="connectionConfig.portName"
              type="text"
              class="form-control"
              placeholder="例如: /dev/ttyS0 或 COM1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              波特率
            </label>

            <el-select v-model="connectionConfig.baudRate" class="form-control-select">
              <el-option :label="9600" :value="9600" />

              <el-option :label="19200" :value="19200" />

              <el-option :label="38400" :value="38400" />

              <el-option :label="57600" :value="57600" />

              <el-option :label="115200" :value="115200" />

              <el-option :label="230400" :value="230400" />

              <el-option :label="460800" :value="460800" />

              <el-option :label="921600" :value="921600" />
            </el-select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              数据位
            </label>

            <el-select v-model="connectionConfig.dataBits" class="form-control-select">
              <el-option :label="7" :value="7" />

              <el-option :label="8" :value="8" />
            </el-select>
          </div>

          <div class="form-group">
            <label class="form-label">
              停止位
            </label>

            <el-select v-model="connectionConfig.stopBits" class="form-control-select">
              <el-option :label="1" :value="1" />

              <el-option :label="2" :value="2" />
            </el-select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              校验位
            </label>

            <el-select v-model="connectionConfig.parity" class="form-control-select">
              <el-option label="无" value="none" />

              <el-option label="奇校验" value="odd" />

              <el-option label="偶校验" value="even" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- CAN 配置 -->
      <template v-if="connectionConfig.type === 'CAN'">
        <div class="form-section-title">
          CAN 配置
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              CAN 通道
            </label>

            <input
              v-model="connectionConfig.canChannel"
              type="text"
              class="form-control"
              placeholder="例如: can0"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              波特率
            </label>

            <el-select v-model="connectionConfig.canBitrate" class="form-control-select">
              <el-option label="125 kbps" :value="125000" />

              <el-option label="250 kbps" :value="250000" />

              <el-option label="500 kbps" :value="500000" />

              <el-option label="1 Mbps" :value="1000000" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- DDS 配置 -->
      <template v-if="connectionConfig.type === 'DDS'">
        <div class="form-section-title">
          DDS 配置
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              <span class="form-required">*</span>
              Domain ID
            </label>

            <el-input-number
              v-model="connectionConfig.domainId"
              :min="0"
              :max="232"
              controls-position="right"
              placeholder="0-232"
              style="width: 100%"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              Participant 名称
            </label>

            <input
              v-model="connectionConfig.participantName"
              type="text"
              class="form-control"
              placeholder="可选，用于标识"
            />
          </div>
        </div>

        <!-- DDS 高级配置（可折叠） -->
        <div class="form-advanced-section">
          <div
            class="form-advanced-header"
            @click="ddsAdvancedExpanded = !ddsAdvancedExpanded"
          >
            <el-icon><component :is="ddsAdvancedExpanded ? ArrowDown : ArrowRight" /></el-icon>
            <span>高级配置</span>
          </div>

          <div v-show="ddsAdvancedExpanded" class="form-advanced-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  发现协议
                </label>

                <el-select v-model="connectionConfig.discoveryProtocol" class="form-control-select">
                  <el-option label="Simple (SPDP)" value="simple" />
                  <el-option label="Discovery Server" value="server" />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">
                  传输层
                </label>

                <el-select v-model="connectionConfig.transport" class="form-control-select">
                  <el-option label="UDP" value="udp" />
                  <el-option label="TCP" value="tcp" />
                  <el-option label="共享内存 (SHM)" value="shm" />
                </el-select>
              </div>
            </div>

            <div v-if="connectionConfig.discoveryProtocol === 'server'" class="form-row">
              <div class="form-group">
                <label class="form-label">
                  Discovery Server 地址
                </label>

                <input
                  v-model="connectionConfig.discoveryServer"
                  type="text"
                  class="form-control"
                  placeholder="例如: 192.168.1.100:11811"
                />
              </div>

              <div class="form-group" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  网络接口
                </label>

                <input
                  v-model="connectionConfig.networkInterface"
                  type="text"
                  class="form-control"
                  placeholder="留空使用所有接口"
                />
              </div>

              <div class="form-group" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('update:visible', false)">
          取消
        </el-button>

        <el-button type="primary" :loading="saving" @click="handleSave">
          <el-icon><Select /></el-icon>
          保存连接配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, ArrowRight, Select } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { communicationNodeApi } from '@/api/communicationNode';
import { useDialogEnterKey } from '@/utils/useDialogEnterKey';
import { buildEndpointDescription, loadFromEndpointDescription } from '@/utils/connectionUtils';

/**
 * 连接配置对话框选项
 */
interface ConnectionConfigDialogOptions {
  interfaceId: string;
  interfaceName: string;
  nodeId: string;
}

const props = defineProps<{
  visible: boolean;
  compOptions: ConnectionConfigDialogOptions;
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'saved'): void
}>();

// 直接从 URL 读取参数
const route = useRoute();
const systemNodeId = computed(() => route.query.systemNodeId as string || '');
const interfaceId = computed(() => route.query.interfaceId as string || '');

const saving = ref(false);

// 弹窗回车确认：按回车触发保存
const dialogVisible = computed(() => props.visible);
useDialogEnterKey(dialogVisible, handleSave);

// 连接方式选项
const connectionTypeOptionList = [
  { value: 'TCP', label: 'TCP' },
  { value: 'UDP', label: 'UDP' },
  { value: 'DDS', label: 'DDS' },
  { value: 'Serial', label: '串口 (Serial)' },
  { value: 'CAN', label: 'CAN 总线' }
];

// 连接配置数据
const connectionConfig = reactive({
  // 基础信息
  name: '',
  type: 'TCP' as string,
  // 注意：该字段仅用于“连接方式”选择时推导 type（TCP Server/Client 等），不落库到 endpoint_description
  role: 'input' as 'input' | 'output',
  
  // TCP/UDP 通用
  host: '0.0.0.0',
  port: 8080,
  timeout: 30000,
  encoding: 'utf8',
  
  // UDP 组播
  multicastGroup: '',

  // Serial
  portName: '',
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  
  // CAN
  canChannel: '',
  canBitrate: 500000,

  // DDS
  domainId: 0,
  participantName: '',
  discoveryProtocol: 'simple' as 'simple' | 'server',
  discoveryServer: '',
  transport: 'udp' as 'udp' | 'tcp' | 'shm',
  networkInterface: ''
});

// DDS 高级配置展开状态
const ddsAdvancedExpanded = ref(false);

/**
 * 连接方式变更处理
 * @returns {void} 无返回值
 */
function handleConnectionTypeChange() {
  // 重置特定类型的默认值
  switch (connectionConfig.type) {
    case 'TCP':
    case 'UDP':
      connectionConfig.host = connectionConfig.role === 'input' ? '0.0.0.0' : '';
      connectionConfig.port = 8080;
      break;
    case 'Serial':
      connectionConfig.baudRate = 115200;
      connectionConfig.dataBits = 8;
      connectionConfig.stopBits = 1;
      connectionConfig.parity = 'none';
      break;
    case 'CAN':
      connectionConfig.canBitrate = 500000;
      break;
    case 'DDS':
      connectionConfig.domainId = 0;
      connectionConfig.participantName = '';
      connectionConfig.discoveryProtocol = 'simple';
      connectionConfig.discoveryServer = '';
      connectionConfig.transport = 'udp';
      connectionConfig.networkInterface = '';
      ddsAdvancedExpanded.value = false;
      break;
  }
}

// 连接配置函数已抽离到 @/utils/connectionUtils

/**
 * 加载接口连接配置
 * @returns {Promise<void>} 无返回值
 */
async function loadConfig() {
  // 新建模式：使用默认值
  if (props.compOptions.interfaceId === 'new') {
    connectionConfig.name = props.compOptions.interfaceName;
    return;
  }

  // 编辑模式：从后端加载现有配置（从节点容器行的 endpoint_description 数组中读取）
  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '确保节点接口容器失败');
    }
    const container = ensureRes.datum as any;
    const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];
    const endpoint = endpointList.find((e: any) => String(e?.interface_id || '').trim() === props.compOptions.interfaceId);
    connectionConfig.name = String(endpoint?.name || '').trim() || props.compOptions.interfaceName;
    if (endpoint) {
      loadFromEndpointDescription(endpoint, connectionConfig);
    }
  } catch (error) {
    // 如果获取失败（可能节点不存在），使用接口名称作为默认值
    connectionConfig.name = props.compOptions.interfaceName;
    console.warn('加载接口连接配置失败，使用默认值:', error);
  }
}

/**
 * 保存配置
 * @returns {Promise<void>} 无返回值
 */
async function handleSave() {
  // 校验必填字段
  if (!connectionConfig.name) {
    ElMessage.warning('请输入接口名称');
    return;
  }

  if (!systemNodeId.value) {
    ElMessage.warning('缺少节点ID，无法保存');
    return;
  }

  saving.value = true;

  try {
    const ensureRes = await communicationNodeApi.ensureNodeInterfaceContainer(systemNodeId.value);
    if (ensureRes.status !== 'success' || !ensureRes.datum?.id) {
      throw new Error(ensureRes.message || '确保节点接口容器失败');
    }

    const container = ensureRes.datum as any;
    const containerId = String(container.id);
    const endpointList = Array.isArray(container.endpoint_description) ? container.endpoint_description : [];

    const endpointDescription = buildEndpointDescription(connectionConfig) as any;
    // 调试日志：验证构建的 endpoint_description
    console.log('[handleSave] Built endpointDescription:', JSON.stringify(endpointDescription, null, 2));
    // 设置 interface_id：新建生成，编辑复用
    const newInterfaceId =
      props.compOptions.interfaceId === 'new'
        ? (globalThis.crypto && 'randomUUID' in globalThis.crypto ? (globalThis.crypto as any).randomUUID() : `iface-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
        : props.compOptions.interfaceId;

    endpointDescription.interface_id = newInterfaceId;
    endpointDescription.name = connectionConfig.name;

    // 编辑时保留 packet_ref_list（避免覆盖掉接口-报文关联）
    const oldIndex = endpointList.findIndex((e: any) => String(e?.interface_id || '').trim() === newInterfaceId);
    if (oldIndex >= 0) {
      const oldEndpoint = endpointList[oldIndex];
      if (Array.isArray(oldEndpoint?.packet_ref_list)) {
        endpointDescription.packet_ref_list = oldEndpoint.packet_ref_list;
      }
    }
    if (!Array.isArray(endpointDescription.packet_ref_list)) {
      endpointDescription.packet_ref_list = [];
    }

    const newEndpointList = [...endpointList];
    if (oldIndex >= 0) {
      newEndpointList.splice(oldIndex, 1, endpointDescription);
    } else {
      newEndpointList.push(endpointDescription);
    }

    // 调试日志：验证最终保存的数据
    console.log('[handleSave] Final endpointList to save:', JSON.stringify(newEndpointList, null, 2));

    const updateEndpointsResponse = await communicationNodeApi.updateEndpoints(containerId, newEndpointList);
    if (updateEndpointsResponse.status !== 'success') {
      throw new Error(updateEndpointsResponse.message || '保存接口配置失败');
    }

    ElMessage.success(props.compOptions.interfaceId === 'new' ? '接口创建成功' : '接口连接配置保存成功');
    emit('saved');
    emit('update:visible', false);
  } catch (error: any) {
    console.error('保存接口连接配置失败:', error);
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

// 监听 visible 变化，当打开对话框时加载配置
watch(
  () => props.visible,
  async (newVal) => {
    if (newVal) {
      await nextTick();
      await loadConfig();
    }
  }
);
</script>

<style lang="scss" src="./index.scss"></style>