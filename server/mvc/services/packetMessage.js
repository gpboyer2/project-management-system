/**
 * @file       packetMessage.js
 * @brief      报文配置服务，处理报文的增删改查和字段管理的相关业务逻辑
 * @date       2025-11-28
 * @copyright  Copyright (c) 2025
 */
const PacketMessageModel = require("../models/packetMessage");
const logger = require('../../middleware/log4jsPlus').getLogger();
const { PacketMessage } = require('../../database/models');
const { sequelize } = require('../../database/sequelize');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

// 环境变量配置
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';

// 加载种子数据（仅开发模式）
const seedPacketList = isDev ? require('../../data/mock-packet-list.json') : [];

// 种子数据初始化状态
let seedInitialized = false;

// 字段名常量
const HIERARCHY_NODE_ID_FIELD = 'hierarchy_node_id';

class PacketMessageService {
  /**
   * 用于"发布前差异校验"的规范化（忽略发布过程会变化/与业务无关的字段）
   * - 目标：仅当草稿与最新已发布版本在业务语义上完全一致时，判定为"无改动"
   */
  static _canonicalizeForPublishCompare(rowLike) {
    const raw = rowLike && typeof rowLike.toJSON === 'function' ? rowLike.toJSON() : (rowLike || {});

    const TRANSIENT_KEYS = new Set([
      // 字段内部 ID 属于实现细节（可能因导入/重建而变化），不视为"业务改动"
      'id',
      // UI/临时字段（前端编辑态可能带上）
      'expanded',
      'level',
      'parentId',
      'parent_id',
      'children',
      'isPlaceholder',
      // 通用临时/调试字段
      '__debug',
      '__meta',
    ]);

    function stripTransient(value) {
      if (Array.isArray(value)) return value.map(stripTransient);
      if (!value || typeof value !== 'object') return value;
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (TRANSIENT_KEYS.has(k)) continue;
        if (v === undefined) continue;
        out[k] = stripTransient(v);
      }
      return out;
    }

    // 只纳入"任何修改都算"的业务字段；忽略版本号、发布时间、latest_key 等发布过程会变化的字段
    const fieldsRaw = raw.fields ?? [];
    const fields = stripTransient(fieldsRaw);

    return {
      message_id: raw.message_id ?? null,
      name: raw.name ?? '',
      description: raw.description ?? '',
      hierarchy_node_id: raw.hierarchy_node_id ?? '',
      protocol: raw.protocol ?? '',
      category_id: raw.category_id ?? null,
      default_byte_order: raw.default_byte_order ?? '',
      struct_alignment: raw.struct_alignment ?? null,
      status: raw.status ?? null,
      // field_count 属于派生字段：历史数据可能与 fields.length 不一致
      // 对比"业务语义一致"时以 fields.length 为准，避免误判为"有改动"
      field_count: Array.isArray(fields) ? fields.length : 0,
      fields,
    };
  }

  /**
   * 计算下一个发布版本号（仅支持 N.0 形式，N 为非负整数）
   * - 首次发布：1.0
   * - 后续发布：N.0 -> (N+1).0
   */
  static _calcNextPublishVersion(latestVersion) {
    if (!latestVersion) return '1.0';
    const match = String(latestVersion).trim().match(/^(\d+)\.0$/);
    if (!match) {
      throw new Error(`当前最新版本号格式不合法: ${latestVersion}，期望格式为 N.0`);
    }
    const major = parseInt(match[1], 10);
    if (Number.isNaN(major)) {
      throw new Error(`当前最新版本号解析失败: ${latestVersion}`);
    }
    return `${major + 1}.0`;
  }

  // 初始化种子数据（仅开发模式，数据库为空时注入）
  static async initSeedData() {
    if (seedInitialized || !isDev) return;
    try {
      const result = await PacketMessageModel.findAll(1, 1);
      if (result.pagination.total === 0 && seedPacketList.length > 0) {
        logger.info('[PacketMessage] 数据库为空，开始注入种子数据...');
        for (const packet of seedPacketList) {
          // 种子数据按"已发布最新版本"写入：message_id 使用 UUID
          const message_id = uuidv4();
          await PacketMessage.create({
            message_id,
            publish_status: 1,
            latest_key: message_id,
            draft_key: null,
            published_at: Date.now(),
            name: packet.name,
            description: packet.description || '',
            hierarchy_node_id: packet.hierarchy_node_id || '',
            protocol: packet.protocol || '',
            status: packet.status === 'enabled' ? 1 : 0,
            field_count: packet.fieldCount || 0,
            fields: packet.fields || [],
            version: packet.version || '1.0',
            default_byte_order: packet.defaultByteOrder || packet.default_byte_order || 'big',
            struct_alignment: packet.structAlignment || packet.struct_alignment || 1,
            created_at: Date.now(),
            updated_at: Date.now()
          });
        }
        logger.info(`[PacketMessage] 种子数据注入完成，共 ${seedPacketList.length} 条`);
      }
      seedInitialized = true;
    } catch (error) {
      logger.error('[PacketMessage] 种子数据初始化失败:', error.message);
    }
  }

  // 获取报文列表
  static async list(current_page, page_size, keyword, hierarchy_node_id, protocol, status, field_count, updated_at, id, fields, category_id) {
    try {
      // 首次访问时初始化种子数据
      await this.initSeedData();
      return await PacketMessageModel.findAll(current_page, page_size, id, updated_at, field_count, keyword, hierarchy_node_id, protocol, status, fields, category_id);
    } catch (error) {
      throw error;
    }
  }

  // 获取报文详情（允许查询任何已发布版本，不限于最新版本）
  static async detail(id) {
    try {
      return await PacketMessageModel.findPublishedById(parseInt(id));
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取"已发布"的指定版本报文详情（按 packet_messages.id）
   * - 不受 latest_key 限制，允许读取历史已发布版本
   */
  static async publishedDetail(id) {
    const id_number = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (Number.isNaN(id_number)) {
      throw new Error('报文ID不合法');
    }
    const message = await PacketMessageModel.findPublishedById(id_number);
    return message;
  }

  /**
   * 创建未发布修订（草稿态）
   * - 返回草稿行（包含草稿行 id 与 message_id）
   */
  static async draftCreate(data) {
    if (!data.name) {
      throw new Error("报文名称不能为空");
    }

    const hierarchyNodeId = data.hierarchy_node_id || '';
    const now = Date.now();
    const message_id = uuidv4();
    const fields = data.fields || [];

    const draft = await PacketMessage.create({
      message_id,
      publish_status: 0,
      draft_key: message_id,
      latest_key: null,
      published_at: null,
      category_id: data.category_id || null,
      name: data.name,
      description: data.description || '',
      hierarchy_node_id: hierarchyNodeId,
      protocol: data.protocol || '',
      // 草稿态也必须有版本号：新建草稿默认从 1.0 开始
      // 说明：是否为草稿由 publish_status 标识，而不是通过 version 为空来区分
      version: '1.0',
      default_byte_order: data.default_byte_order || '',
      struct_alignment: data.struct_alignment,
      status: data.status !== undefined ? parseInt(data.status) : 1,
      field_count: data.field_count || 0,
      fields,
      created_at: now,
      updated_at: now
    });

    return draft.toJSON();
  }

  /**
   * 保存未发布修订（草稿态）
   */
  static async draftUpdate(draftId, updateData) {
    // 诊断日志（可开关）：保存草稿前后打印 packet_messages 全表快照
    const shouldDump = String(process.env.PACKET_MESSAGE_DEBUG_DUMP || '').trim() === '1';
    const dumpAllPacketMessages = async (stage) => {
      if (!shouldDump) return;
      try {
        const [rowList] = await sequelize.query("SELECT * FROM packet_messages ORDER BY id ASC;");
        logger.info(`[PacketMessage][draftUpdate][${stage}] packet_messages 全表快照: ${JSON.stringify(rowList)}`);
      } catch (e) {
        logger.warn(`[PacketMessage][draftUpdate][${stage}] 读取 packet_messages 全表快照失败: ${e?.message || e}`);
      }
    };

    await dumpAllPacketMessages('保存前');

    const draft = await PacketMessage.findByPk(parseInt(draftId));
    if (!draft) throw new Error('草稿不存在');
    if (draft.publish_status !== 0) throw new Error('仅允许保存未发布草稿');

    const hierarchyNodeId = updateData.hierarchy_node_id;
    const now = Date.now();
    const fields = updateData.fields;

    // 草稿态禁止修改版本号：无论前端传什么都忽略
    const normalizedData = {
      category_id: updateData.category_id,
      name: updateData.name,
      description: updateData.description,
      hierarchy_node_id: hierarchyNodeId,
      protocol: updateData.protocol,
      default_byte_order: updateData.default_byte_order,
      struct_alignment: updateData.struct_alignment,
      status: updateData.status !== undefined ? parseInt(updateData.status) : undefined,
      field_count: updateData.field_count,
      updated_at: now
    };
    if (fields !== undefined) {
      normalizedData.fields = fields;
    }

    await draft.update(normalizedData);

    await dumpAllPacketMessages('保存后');
    return draft.toJSON();
  }

  /**
   * 获取草稿详情
   */
  static async draftDetail(draftId) {
    // 验证 ID 是否为有效数字
    const id = parseInt(draftId);
    if (Number.isNaN(id)) {
      return null;
    }
    const draft = await PacketMessage.findByPk(id);
    if (!draft) return null;
    if (draft.publish_status !== 0) return null;
    return draft.toJSON();
  }

  /**
   * 检查草稿是否存在（根据 message_id）
   * 返回：{ hasDraft: boolean, draft: object | null }
   */
  static async checkDraft(message_id) {
    const messageId = typeof message_id === 'string' ? message_id.trim() : '';
    if (!messageId) {
      return { hasDraft: false, draft: null };
    }

    const draft = await PacketMessage.findOne({
      where: { message_id: messageId, publish_status: 0, draft_key: messageId }
    });

    if (!draft) {
      return { hasDraft: false, draft: null };
    }

    return {
      hasDraft: true,
      draft: draft.toJSON()
    };
  }

  /**
   * 批量检查草稿是否存在（入参为数组，天然支持批量）
   * 入参：message_ids - 字符串数组
   * 返回：{ [message_id: string]: { hasDraft: boolean, draft: object | null } }
   */
  static async checkDraftByIds(message_ids) {
    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return {};
    }

    // 过滤有效的 message_id
    const validIds = message_ids
      .map(id => typeof id === 'string' ? id.trim() : String(id).trim())
      .filter(id => id);

    if (validIds.length === 0) {
      return {};
    }

    // 批量查询草稿
    const drafts = await PacketMessage.findAll({
      where: {
        message_id: validIds,
        publish_status: 0,
        draft_key: validIds
      }
    });

    // 构建结果映射
    const result = {};
    const draftMap = {};
    for (const draft of drafts) {
      const json = draft.toJSON();
      draftMap[json.message_id] = { hasDraft: true, draft: json };
    }

    // 确保所有输入的 message_id 都有结果
    for (const messageId of validIds) {
      result[messageId] = draftMap[messageId] || { hasDraft: false, draft: null };
    }

    return result;
  }

  /**
   * 确保存在草稿：若已存在则返回；否则从最新已发布复制一份草稿
   */
  static async draftEnsure(message_id) {
    const messageId = typeof message_id === 'string' ? message_id.trim() : '';
    if (!messageId) throw new Error('缺少参数 message_id');

    const existingDraft = await PacketMessage.findOne({
      where: { message_id: messageId, publish_status: 0, draft_key: messageId }
    });
    if (existingDraft) return existingDraft.toJSON();

    const latestPublished = await PacketMessage.findOne({
      where: { message_id: messageId, publish_status: 1, latest_key: messageId }
    });
    if (!latestPublished) throw new Error('未找到该协议的最新已发布版本');

    const now = Date.now();
    const latest = latestPublished.toJSON();
    const draft = await PacketMessage.create({
      message_id: messageId,
      publish_status: 0,
      draft_key: messageId,
      latest_key: null,
      published_at: null,
      category_id: latest.category_id || null,
      name: latest.name,
      description: latest.description || '',
      hierarchy_node_id: latest.hierarchy_node_id || '',
      protocol: latest.protocol || '',
      // 修订草稿：版本号应保持为"当前最新已发布版本号"
      // 说明：草稿/已发布通过 publish_status 区分，不通过 version 是否为空区分
      version: latest.version || '1.0',
      default_byte_order: latest.default_byte_order || '',
      struct_alignment: latest.struct_alignment,
      status: latest.status ?? 1,
      field_count: latest.field_count || 0,
      fields: latest.fields || [],
      created_at: now,
      updated_at: now
    });

    return draft.toJSON();
  }

  /**
   * 发布草稿（自动 +1.0），生成一条新的"最新已发布"记录，并保留历史版本
   * - 草稿行默认保留（仍为 publish_status=0），便于继续编辑；公共视角不会看到草稿
   */
  static async draftPublish(draftId) {
    const draftRowId = parseInt(draftId);
    if (Number.isNaN(draftRowId)) throw new Error('草稿ID不合法');

    // 诊断日志（可开关）：发布前后打印 packet_messages 全表快照
    const shouldDump = String(process.env.PACKET_MESSAGE_DEBUG_DUMP || '').trim() === '1';
    const dumpAllPacketMessages = async (stage, transaction) => {
      if (!shouldDump) return;
      try {
        const [rowList] = await sequelize.query(
          "SELECT * FROM packet_messages ORDER BY id ASC;",
          transaction ? { transaction } : undefined
        );
        logger.info(`[PacketMessage][draftPublish][${stage}] packet_messages 全表快照: ${JSON.stringify(rowList)}`);
      } catch (e) {
        logger.warn(`[PacketMessage][draftPublish][${stage}] 读取 packet_messages 全表快照失败: ${e?.message || e}`);
      }
    };

    await dumpAllPacketMessages('发布前', null);

    const published = await sequelize.transaction(async (t) => {
      await dumpAllPacketMessages('发布前-事务内', t);
      const draft = await PacketMessage.findByPk(draftRowId, { transaction: t });
      if (!draft) throw new Error('草稿不存在');
      if (draft.publish_status !== 0) throw new Error('仅允许发布未发布草稿');

      const messageId = draft.message_id;
      if (!messageId) throw new Error('草稿缺少 message_id');

      // 发布前校验：草稿若与"最新已发布版本"完全一致，则禁止发布新版本
      const latestPublished = await PacketMessage.findOne({
        where: { message_id: messageId, publish_status: 1, latest_key: messageId },
        transaction: t
      });
      if (latestPublished) {
        const draftCanonical = this._canonicalizeForPublishCompare(draft);
        const latestCanonical = this._canonicalizeForPublishCompare(latestPublished);
        if (_.isEqual(draftCanonical, latestCanonical)) {
          throw new Error('没有任何改动，无法发布新版本');
        }
      }

      // 计算新版本号：以"所有已发布版本"的最大版本为准（避免 latest_key 状态异常导致版本回退/冲突）
      const published_version_list = await PacketMessage.findAll({
        where: { message_id: messageId, publish_status: 1 },
        attributes: ['version'],
        transaction: t,
        raw: true
      });

      let max_major = 0;
      for (const row of (published_version_list || [])) {
        const version_text = String((row && row.version) || '').trim();
        if (!version_text) continue;
        const match = version_text.match(/^(\d+)\.0$/);
        if (!match) {
          throw new Error(`当前已发布版本号格式不合法: ${version_text}，期望格式为 N.0`);
        }
        const major = parseInt(match[1], 10);
        if (!Number.isNaN(major) && major > max_major) {
          max_major = major;
        }
      }
      const newVersion = max_major > 0 ? `${max_major + 1}.0` : '1.0';
      const now = Date.now();

      // 旧最新版本转历史（先清空 latest_key，避免 UNIQUE(latest_key) 冲突）
      // 注意：为容错起见，不依赖 publish_status=1 条件；只要 latest_key=messageId 就清空
      const latestRow = await PacketMessage.findOne({
        where: { latest_key: messageId },
        transaction: t
      });
      if (latestRow) {
        await latestRow.update({ latest_key: null, updated_at: now }, { transaction: t });
      }

      // 方案B：草稿原地升级为"最新已发布"（发布后不保留草稿）
      await draft.update(
        {
          publish_status: 1,
          draft_key: null,
          latest_key: messageId,
          published_at: now,
          version: newVersion,
          status: 1,
          updated_at: now
        },
        { transaction: t }
      );

      await dumpAllPacketMessages('发布后-事务内', t);
      return draft.toJSON();
    });

    await dumpAllPacketMessages('发布后', null);
    return published;
  }

  /**
   * 获取版本列表（仅已发布）
   */
  static async versionList(message_id) {
    const messageId = typeof message_id === 'string' ? message_id.trim() : '';
    if (!messageId) throw new Error('缺少参数 message_id');

    const list = await PacketMessage.findAll({
      where: { message_id: messageId, publish_status: 1 },
      order: [['published_at', 'DESC'], ['id', 'DESC']],
      raw: true
    });
    return list;
  }

  /**
   * 管理端列表（packet-config 使用）：包含
   * - 未发布草稿（publish_status=0）
   * - 最新已发布（publish_status=1 且 latest_key 非空）
   * 不返回历史已发布版本（公共视角只看最新；历史通过 versions 接口查看）
   */
  static async manageList(query) {
    const {
      current_page = 1,
      page_size = 10,
      keyword = '',
      hierarchy_node_id = '',
      protocol = '',
      status = '',
      category_id = ''
    } = query || {};

    const { Op } = require('sequelize');

    const where = {
      [Op.or]: [
        { publish_status: 0 },
        { publish_status: 1, latest_key: { [Op.not]: null } }
      ]
    };

    if (keyword) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ]
      });
    }
    if (hierarchy_node_id) where.hierarchy_node_id = hierarchy_node_id;
    if (protocol) where.protocol = protocol;
    if (category_id) where.category_id = category_id;

    // status 兼容：enabled/disabled/0/1
    const rawStatus = String(status || '').trim();
    if (rawStatus) {
      let normalized;
      if (rawStatus === 'enabled') normalized = 1;
      else if (rawStatus === 'disabled') normalized = 0;
      else {
        const n = parseInt(rawStatus, 10);
        normalized = Number.isNaN(n) ? undefined : n;
      }
      if (normalized !== undefined) where.status = normalized;
    }

    const page = parseInt(current_page);
    const size = parseInt(page_size);

    const { count, rows } = await PacketMessage.findAndCountAll({
      where,
      order: [['publish_status', 'ASC'], ['updated_at', 'DESC']],
      limit: size,
      offset: (page - 1) * size
    });

    return {
      list: rows.map(r => r.toJSON()),
      pagination: { current_page: page, page_size: size, total: count }
    };
  }

  /**
   * 草稿复制：从某条报文（可为已发布最新或草稿）复制为一个新的协议草稿
   */
  static async draftDuplicate(sourceId, newName) {
    const sourceRowId = parseInt(sourceId);
    if (Number.isNaN(sourceRowId)) throw new Error('source_id 不合法');
    if (!newName) throw new Error('新报文名称不能为空');

    const sourceRow = await PacketMessage.findByPk(sourceRowId);
    if (!sourceRow) throw new Error('源报文不存在');

    const source = sourceRow.toJSON();
    const now = Date.now();
    const message_id = uuidv4();
    const fields = source.fields || [];

    const draft = await PacketMessage.create({
      message_id,
      publish_status: 0,
      draft_key: message_id,
      latest_key: null,
      published_at: null,
      category_id: source.category_id || null,
      name: newName,
      description: source.description || '',
      hierarchy_node_id: source.hierarchy_node_id || '',
      protocol: source.protocol || '',
      // 草稿复制：新的协议链从 1.0 起步；草稿/已发布通过 publish_status 区分
      version: '1.0',
      default_byte_order: source.default_byte_order || '',
      struct_alignment: source.struct_alignment,
      status: source.status ?? 1,
      field_count: source.field_count || 0,
      fields,
      created_at: now,
      updated_at: now
    });

    return draft.toJSON();
  }

  // 创建报文
  static async create(data) {
    try {
      if (!data.name) {
        throw new Error("报文名称不能为空");
      }

      const hierarchyNodeId = data.hierarchy_node_id || '';
      const fields = data.fields || [];

      return await PacketMessageModel.create({
        name: data.name,
        description: data.description || '',
        hierarchy_node_id: hierarchyNodeId,
        protocol: data.protocol || '',
        version: data.version || '',
        default_byte_order: data.default_byte_order || '',
        struct_alignment: data.struct_alignment,
        status: data.status !== undefined ? parseInt(data.status) : 1,
        field_count: data.field_count || 0,
        fields
      });
    } catch (error) {
      throw error;
    }
  }

  // 更新报文
  static async update(id, updateData) {
    try {
      const message = await PacketMessageModel.findById(parseInt(id));
      if (!message) {
        throw new Error("报文不存在");
      }

      const hierarchyNodeId = updateData.hierarchy_node_id;
      const fields = updateData.fields;

      const normalizedData = {
        name: updateData.name,
        description: updateData.description,
        hierarchy_node_id: hierarchyNodeId,
        protocol: updateData.protocol,
        version: updateData.version,
        default_byte_order: updateData.default_byte_order,
        struct_alignment: updateData.struct_alignment,
        status: updateData.status !== undefined ? parseInt(updateData.status) : undefined,
        field_count: updateData.field_count,
      };
      if (fields !== undefined) {
        normalizedData.fields = fields;
      }

      return await PacketMessageModel.update(parseInt(id), normalizedData);
    } catch (error) {
      throw error;
    }
  }

  // 删除报文
  static async delete(id) {
    try {
      const message = await PacketMessageModel.findById(parseInt(id));
      if (!message) {
        throw new Error("报文不存在");
      }

      return await PacketMessageModel.delete(parseInt(id));
    } catch (error) {
      throw error;
    }
  }

  // 复制报文
  static async duplicate(messageId, newName) {
    try {
      if (!newName) {
        throw new Error("新报文名称不能为空");
      }

      // 兼容旧逻辑：复制行为调整为"创建一个新的协议草稿"
      return await this.draftDuplicate(messageId, newName);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 启用报文（支持批量）
   * @param {Array} messageIds 报文ID数组
   */
  static async enable(messageIds) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("请选择要启用的报文");
      }

      return await PacketMessageModel.updateList(messageIds, { status: 1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 禁用报文（支持批量）
   * @param {Array} messageIds 报文ID数组
   */
  static async disable(messageIds) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("请选择要禁用的报文");
      }

      return await PacketMessageModel.updateList(messageIds, { status: 0 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * 删除报文（支持批量）
   * @param {Array} messageIds 报文ID数组
   */
  static async deleteList(messageIds) {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("请选择要删除的报文");
      }

      return await PacketMessageModel.deleteList(messageIds);
    } catch (error) {
      throw error;
    }
  }

  // 字段管理
  static async addField(messageId, fieldData) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      // 验证必填字段
      if (!fieldData.field_type || !fieldData.field_name) {
        throw new Error("字段类型和字段名称不能为空");
      }

      // 获取字段序号
      const fields = await PacketMessageModel.getFieldsByMessageId(messageId);
      const fieldOrder = fieldData.field_order || (fields.length + 1);

      return await PacketMessageModel.createField({
        message_id: messageId,
        field_type: fieldData.field_type,
        field_name: fieldData.field_name,
        description: fieldData.description || '',
        field_order: fieldOrder,
        parent_field_id: fieldData.parent_field_id || null,
        is_expanded: fieldData.is_expanded || 0,
        field_config: fieldData.field_config || null
      });
    } catch (error) {
      throw error;
    }
  }

  static async updateField(messageId, fieldId, fieldData) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      // 处理字段配置
      // 模型 setter 已自动处理 JSON 序列化

      return await PacketMessageModel.updateField(fieldId, fieldData);
    } catch (error) {
      throw error;
    }
  }

  static async deleteField(messageId, fieldId) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      return await PacketMessageModel.deleteField(fieldId);
    } catch (error) {
      throw error;
    }
  }

  static async addNestedField(messageId, parentId, fieldData) {
    try {
      // 验证父字段是否存在
      const parentFields = await PacketMessageModel.getFieldsByMessageId(messageId);
      const parentExists = parentFields.some(field => field.id === parseInt(parentId));
      if (!parentExists) {
        throw new Error("父字段不存在");
      }

      // 验证父字段类型是否支持嵌套（Struct或Array）
      const parentField = parentFields.find(field => field.id === parseInt(parentId));
      if (!['Struct', 'Array'].includes(parentField.field_type)) {
        throw new Error("只有Struct和Array类型字段才能添加子字段");
      }

      // 验证必填字段
      if (!fieldData.field_type || !fieldData.field_name) {
        throw new Error("字段类型和字段名称不能为空");
      }

      // 获取兄弟字段数量，确定序号
      const siblingFields = parentFields.filter(field => field.parent_field_id === parseInt(parentId));
      const fieldOrder = siblingFields.length + 1;

      return await PacketMessageModel.createField({
        message_id: messageId,
        field_type: fieldData.field_type,
        field_name: fieldData.field_name,
        description: fieldData.description || '',
        field_order: fieldOrder,
        parent_field_id: parseInt(parentId),
        is_expanded: fieldData.is_expanded || 0,
        field_config: fieldData.field_config || null
      });
    } catch (error) {
      throw error;
    }
  }

  static async getFlattenedFields(messageId) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      return await PacketMessageModel.getFlattenedFields(messageId);
    } catch (error) {
      throw error;
    }
  }

  static async toggleFieldExpanded(messageId, fieldId) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      // 获取字段当前状态
      const fields = await PacketMessageModel.getFieldsByMessageId(messageId);
      const field = fields.find(f => f.id === parseInt(fieldId));
      if (!field) {
        throw new Error("字段不存在");
      }

      // 切换展开状态
      const newExpanded = field.is_expanded ? 0 : 1;
      return await PacketMessageModel.updateField(fieldId, { is_expanded: newExpanded });
    } catch (error) {
      throw error;
    }
  }

  static async reorderFields(messageId, fieldIds) {
    try {
      // 验证报文是否存在
      const message = await PacketMessageModel.findById(messageId);
      if (!message) {
        throw new Error("报文不存在");
      }

      if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
        throw new Error("字段ID列表不能为空");
      }

      return await PacketMessageModel.reorderFields(messageId, fieldIds);
    } catch (error) {
      throw error;
    }
  }

  // 生成代码（预览）
  static async generateCode(messageId) {
    try {
      // 1. 获取报文详情
      // 说明：代码预览用于 packet-config 编辑场景，允许使用草稿内容进行预校验与预览
      const messageRow = await PacketMessage.findByPk(parseInt(messageId));
      const message = messageRow ? messageRow.toJSON() : null;
      if (!message) {
        throw new Error("报文不存在");
      }

      // 2. 构造 SoftwareConfig (模拟单协议节点)
      const {
        sanitizeName,
        normalizeSoftwareConfig,
        validateSoftwareConfig,
        convertSnakeToCamelDeep,
        runCodeGenerator,
      } = require('../../utils/codegenUtils');

      const packetName = sanitizeName(message.name, String(message.id));

      // 构造字段列表，模型 getter 已自动解析
      const fields = message.fields || [];

      const softwareConfigRaw = {
        softwareName: packetName,
        description: message.description || '',
        commNodeList: [
          {
            id: 'comm_node_preview',
            name: 'PreviewNode',
            type: message.protocol || 'TCP',
            nodeList: [
              {
                id: 'node_preview',
                protocolName: packetName,
                description: 'Preview Protocol',
                dispatch: {
                  mode: 'single',
                  field: 'messageId', // Default
                  type: 'UnsignedInt',
                  byteOrder: 'big',
                  offset: 0,
                  size: 2
                },
                messages: {
                  '0x01': {
                    name: packetName,
                    defaultByteOrder: message.default_byte_order || 'big', // 注意字段名可能不同
                    fields: fields || []
                  }
                }
              }
            ]
          }
        ]
      };

      // 3. 规范化和校验
      normalizeSoftwareConfig(softwareConfigRaw);
      const validationErrors = validateSoftwareConfig(softwareConfigRaw);
      if (validationErrors.length > 0) {
        const error = new Error('报文配置校验失败');
        error.validationErrorList = validationErrors;
        throw error;
      }

      // 4. 适配 nodegen 输入：snake_case -> camelCase
      const softwareConfig = convertSnakeToCamelDeep(softwareConfigRaw);

      // 4. 生成代码
      const result = await runCodeGenerator(softwareConfig);

      // 5. 读取生成的文件内容
      const fs = require('fs');
      const path = require('path');

      const readFiles = (dir) => {
        let results = [];
        if (!fs.existsSync(dir)) return results;

        const list = fs.readdirSync(dir);
        list.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(readFiles(filePath));
          } else {
            // 只读取 .h 和 .cpp 文件
            if (file.endsWith('.h') || file.endsWith('.cpp') || file.endsWith('.hpp') || file.endsWith('.c')) {
                results.push({
                    name: file,
                    path: filePath, // 绝对路径，前端可能不需要，但为了唯一性保留
                    relativePath: path.relative(result.outputDir, filePath), // 相对路径
                    content: fs.readFileSync(filePath, 'utf-8')
                });
            }
          }
        });
        return results;
      };

      const files = readFiles(result.outputDir);

      // 清理临时目录 (可选，result.outputDir 是生成的目录)
      // SystemLevelDesignTreeService._runCodeGenerator 里已经打包了zip，但原始目录还在
      // 我们可以保留一段时间或者立即删除。这里为了简单不删除，由系统定期清理或下一次覆盖。
      // 其实 uuid 目录不会覆盖。

      return {
        files
      };

    } catch (error) {
      throw error;
    }
  }

  // 获取层级节点列表
  static async getHierarchyNodeList() {
    try {
      return await PacketMessageModel.getHierarchyNodeList();
    } catch (error) {
      throw error;
    }
  }

  // 获取协议列表
  static async getProtocolList() {
    try {
      return await PacketMessageModel.getProtocolList();
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取报文的引用关系列表
   * 查询所有节点接口中引用了指定报文的记录
   * @param {number|string} packetId 报文ID
   * @returns {Promise<object>} 引用关系数据
   */
  static async getPacketReferences(packetId) {
    const packet_id = parseInt(String(packetId), 10);
    if (Number.isNaN(packet_id)) {
      throw new Error('报文ID不合法');
    }

    // 获取报文详情
    const packet = await PacketMessage.findByPk(packet_id);
    if (!packet) {
      throw new Error('报文不存在');
    }
    const packet_data = packet.toJSON();
    const message_id = typeof packet_data.message_id === 'string' ? packet_data.message_id.trim() : '';
    if (!message_id) {
      throw new Error('报文缺少 message_id');
    }

    // 以 message_id 作为"协议身份"，收集该协议链路下所有已发布版本（packet_messages.id）
    const related_packet_list = await PacketMessage.findAll({
      where: { message_id, publish_status: 1 },
      attributes: ['id', 'version'],
      raw: true
    });

    const packet_id_to_version_map = new Map();
    for (const row of (related_packet_list || [])) {
      const rid = parseInt(String(row.id), 10);
      if (Number.isNaN(rid)) continue;
      packet_id_to_version_map.set(rid, String(row.version || '').trim() || '1.0');
    }
    const related_packet_id_set = new Set(packet_id_to_version_map.keys());

    // 获取最新版本号（以 latest_key=message_id 的"最新已发布"行为准）
    let latest_version = String(packet_data.version || '').trim() || '1.0';
    try {
      const latest_row = await PacketMessage.findOne({
        where: { latest_key: message_id, publish_status: 1 },
        attributes: ['version'],
        raw: true
      });
      const v = latest_row && latest_row.version ? String(latest_row.version).trim() : '';
      if (v) latest_version = v;
    } catch (e) {
      // 降级：保持 packet_data.version
      logger.warn('[PacketMessage] 获取最新版本号失败（降级使用当前版本）:', e.message);
    }

    // 查询所有通信节点，并过滤出真正的节点接口容器
    const CommunicationNodeModel = require('../models/communicationNode');
    const SystemLevelDesignTreeModel = require('../models/systemLevelDesignTree');

    const all_comm_nodes = await CommunicationNodeModel.findAll();

    // 只保留"节点接口容器"类型的记录（config.is_node_interface_container === true）
    const comm_node_list = all_comm_nodes.filter((node) => {
      const cfg = node?.config;
      return cfg && typeof cfg === 'object' && cfg.is_node_interface_container === true;
    });

    const reference_list = [];

    // 遍历节点接口容器，查找引用了目标报文的接口
    for (const comm_node of comm_node_list) {
      const endpoint_list = comm_node.endpoint_description || [];
      if (!Array.isArray(endpoint_list)) continue;

      for (const endpoint of endpoint_list) {
        const packet_ref_list = endpoint.packet_ref_list || [];
        if (!Array.isArray(packet_ref_list)) continue;

        // 遍历该接口引用的所有报文版本：只要属于同一 message_id 版本链，就认为"引用了该协议"
        for (const ref_item of packet_ref_list) {
          const ref_packet_id = parseInt(String(ref_item && ref_item.packet_id), 10);
          if (Number.isNaN(ref_packet_id)) continue;
          if (!related_packet_id_set.has(ref_packet_id)) continue;

          // 获取层级节点信息
          let node_name = '未知节点';
          try {
            const arch_node = await SystemLevelDesignTreeModel.findById(comm_node.node_id);
            if (arch_node) {
              const props = arch_node.properties;
              const name_from_props =
                props && typeof props === 'object'
                  ? (props.名称 || props.name)
                  : '';
              node_name = String(name_from_props || arch_node.id || node_name);
            }
          } catch (e) {
            logger.warn('[PacketMessage] 获取层级节点信息失败:', e.message);
          }

          // 确定角色：input=接收方(Sub)，output=发送方(Pub)
          const direction = String(ref_item.direction || '').toLowerCase();
          const role = direction === 'output' ? 'Pub' : 'Sub';

          // 获取本地版本：由 packet_ref_list 引用的 packet_id 对应 packet_messages.version 决定
          const local_version = packet_id_to_version_map.get(ref_packet_id) || latest_version;

          // 计算同步状态
          const status = local_version === latest_version ? 'Sync' : 'Outdated';

          reference_list.push({
            nodeId: comm_node.node_id,
            nodeName: node_name,
            interfaceId: endpoint.interface_id || '',
            interfaceName: endpoint.name || '',
            role,
            refPacketId: ref_packet_id, // 引用的具体版本ID
            localVersion: local_version,
            latestVersion: latest_version,
            status
          });
        }
      }
    }

    // fields 在部分场景下可能是数组，也可能是对象（数字 key）
    let field_count = 0;
    if (Array.isArray(packet_data.fields)) {
      field_count = packet_data.fields.length;
    } else if (packet_data.fields && typeof packet_data.fields === 'object') {
      field_count = Object.keys(packet_data.fields).length;
    }

    return {
      packetId: packet_id,
      packetName: packet_data.name || '',
      latestVersion: latest_version,
      fieldCount: field_count,
      referenceList: reference_list
    };
  }
}

module.exports = PacketMessageService;
