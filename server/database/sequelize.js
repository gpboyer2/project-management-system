/**
 * Sequelize ORM 配置和管理
 *
 * 基于 Sequelize ORM 的数据库操作层，提供：
 * - 数据库连接配置和初始化
 * - 开发/生产环境差异化处理
 * - 数据表同步策略管理
 *
 * 支持开发环境表结构动态更新（alter 模式）
 * 生产环境严格校验表结构一致性
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
// 直接使用 log4js，避免循环依赖（log4jsPlus.js 依赖 FrontendLog model）
const log4js = require('log4js');
const defaultLogger = log4js.getLogger("default");

// 环境变量配置
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV !== 'production';
const isTest = NODE_ENV === 'test';

// 数据库路径配置
// pkg 环境下，process.env.DATABASE_PATH 由 app.js 设置，指向用户目录
// 开发环境，使用 server/data 目录
let dbPath;
if (process.env.DATABASE_PATH) {
  // pkg 环境：使用 app.js 设置的路径（用户目录）
  dbPath = process.env.DATABASE_PATH;
} else {
  // 开发环境：使用 server/data 目录
  const dbFileName = isTest ? 'cssc-node-view-test.db' : 'cssc-node-view.db';
  dbPath = path.join(__dirname, '../data', dbFileName);
}

// 初始化 Sequelize（使用 sqlite3）
// pkg 环境下使用 sqlite3 需要正确打包原生模块
const sequelizeConfig = {
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  define: {
    timestamps: false,
    freezeTableName: true
  }
};

const sequelize = new Sequelize(sequelizeConfig);

/**
 * 版本系统 schema 补齐（生产环境不 alter，因此在启动阶段做增量 DDL）
 * - 新增列：message_id / publish_status / draft_key / latest_key / published_at
 * - 新增索引/唯一索引
 * - 存量回填：message_id 全量 UUID；并将存量视为“最新已发布”
 *
 * 注意：
 * - SQLite 支持 ADD COLUMN，但不支持复杂 ALTER；因此这里只做“新增列/新增索引”
 * - UNIQUE 索引对 NULL 不冲突，利用 draft_key/latest_key 实现“一协议一草稿/一协议一最新发布”
 */
/**
 * 版本系统 schema 补齐（生产环境不 alter，因此在启动阶段做增量 DDL）
 * - 新增列：message_id / publish_status / draft_key / latest_key / published_at
 * - 新增索引/唯一索引
 * - 存量回填：message_id 全量 UUID；并将存量视为"最新已发布"
 *
 * 注意：
 * - SQLite 支持 ADD COLUMN，但不支持复杂 ALTER；因此这里只做"新增列/新增索引"
 * - UNIQUE 索引对 NULL 不冲突，利用 draft_key/latest_key 实现"一协议一草稿/一协议一最新发布"
 * @returns {Promise<void>}
 */
async function ensurePacketMessagesVersioningSchema() {
  try {
    // 仅当表存在时执行（首次启动可能还未 sync 创建）
    const [tableList] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='packet_messages';"
    );
    if (!Array.isArray(tableList) || tableList.length === 0) return;

    const [columnList] = await sequelize.query("PRAGMA table_info('packet_messages');");
    const columnNameSet = new Set((Array.isArray(columnList) ? columnList : []).map((c) => c.name));

    const addColumnIfMissing = async (columnName, columnDefSql) => {
      if (columnNameSet.has(columnName)) return;
      await sequelize.query(`ALTER TABLE packet_messages ADD COLUMN ${columnDefSql};`);
      columnNameSet.add(columnName);
      defaultLogger.info(`[DB] packet_messages 新增列: ${columnName}`);
    };

    // 新增列（尽量允许 NULL，避免存量数据阻塞）
    await addColumnIfMissing('publish_status', "publish_status INTEGER DEFAULT 1");
    await addColumnIfMissing('draft_key', "draft_key TEXT");
    await addColumnIfMissing('latest_key', "latest_key TEXT");
    await addColumnIfMissing('published_at', "published_at INTEGER");

    // message_id 列已存在于现有模型中，但为了兼容旧库，这里也做一次兜底
    await addColumnIfMissing('message_id', "message_id TEXT");

    /**
     * 存量回填（只对“旧数据”执行一次）：
     * - 将非 UUID 的 message_id 统一迁移为 UUID（按原 message_id 分组，确保同组保持同一个新 UUID）
     * - 对缺失 message_id 的行按行生成 UUID
     * - 将存量视为“已发布”，并为每个 message_id 选出一条 latest_key
     *
     * 重要：绝对不能在每次启动时重置 message_id，否则会破坏版本追溯。
     */
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const [rowList] = await sequelize.query("SELECT id, message_id, updated_at, created_at FROM packet_messages;");
    if (Array.isArray(rowList) && rowList.length > 0) {
      const now = Date.now();

      // 1) 迁移/补齐 message_id（分组迁移，保证同组一致）
      const oldMessageIdToNewUuidMap = new Map();
      for (const row of rowList) {
        const rawMessageId = row.message_id;
        const messageId = (typeof rawMessageId === 'string' ? rawMessageId.trim() : '');

        // 已是 UUID：不处理
        if (messageId && uuidV4Pattern.test(messageId)) continue;

        // 为空：按行生成
        if (!messageId) {
          const newUuid = uuidv4();
          await sequelize.query(
            "UPDATE packet_messages SET message_id = ? WHERE id = ?;",
            { replacements: [newUuid, row.id] }
          );
          continue;
        }

        // 非 UUID：按原 message_id 分组生成同一个 UUID
        if (!oldMessageIdToNewUuidMap.has(messageId)) {
          oldMessageIdToNewUuidMap.set(messageId, uuidv4());
        }
      }

      if (oldMessageIdToNewUuidMap.size > 0) {
        for (const [oldMessageId, newUuid] of oldMessageIdToNewUuidMap.entries()) {
          await sequelize.query(
            "UPDATE packet_messages SET message_id = ? WHERE message_id = ?;",
            { replacements: [newUuid, oldMessageId] }
          );
        }
      }

      // 2) 统一将存量视为已发布（不覆盖已有值）
      await sequelize.query(
        "UPDATE packet_messages SET publish_status = 1 WHERE publish_status IS NULL;"
      );

      // 3) 补齐空版本号为 1.0（仅对已发布兜底，不改变非空版本；草稿版本号应由发布时生成）
      await sequelize.query(
        "UPDATE packet_messages SET version = '1.0' WHERE publish_status = 1 AND (version IS NULL OR version = '');"
      );

      // 4) latest_key：先清空，再为每个 message_id 选一条作为“最新已发布”
      await sequelize.query("UPDATE packet_messages SET latest_key = NULL WHERE latest_key IS NOT NULL;");

      // 取每个 message_id 最大 id 的那条作为最新（简单且可预测）
      const [latestRowList] = await sequelize.query(
        "SELECT message_id, MAX(id) AS max_id FROM packet_messages WHERE publish_status = 1 GROUP BY message_id;"
      );
      if (Array.isArray(latestRowList) && latestRowList.length > 0) {
        for (const latestRow of latestRowList) {
          if (!latestRow.message_id) continue;
          await sequelize.query(
            "UPDATE packet_messages SET latest_key = ?, published_at = COALESCE(published_at, ?) WHERE id = ?;",
            { replacements: [latestRow.message_id, now, latestRow.max_id] }
          );
        }
      }

      defaultLogger.info('[DB] packet_messages 存量回填完成：message_id(UUID) / publish_status / latest_key / version');
    }
  } catch (error) {
    defaultLogger.error('[DB] ensurePacketMessagesVersioningSchema 失败:', error.message);
    throw error;
  }
}

/**
 * 构建任务 schema 补齐（启动时增量 DDL）
 * - 创建 build_tasks 表（若不存在）
 * - 通过 PRAGMA table_info 检测并补齐缺失列（仅新增列，避免破坏存量）
 * - 创建必要索引
 *
 * 说明：
 * - 采用 SQLite 兼容的方式：CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN
 * - 不定义外键，保持与当前项目一致的“无外键约束”风格
 */
/**
 * 构建任务 schema 补齐（启动时增量 DDL）
 * - 创建 build_tasks 表（若不存在）
 * - 通过 PRAGMA table_info 检测并补齐缺失列（仅新增列，避免破坏存量）
 * - 创建必要索引
 *
 * 说明：
 * - 采用 SQLite 兼容的方式：CREATE TABLE IF NOT EXISTS + ALTER TABLE ADD COLUMN
 * - 不定义外键，保持与当前项目一致的"无外键约束"风格
 * @returns {Promise<void>}
 */
async function ensureBuildTasksSchema() {
  try {
    // 1) 创建表（首次启动）
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS build_tasks (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        context_type TEXT NOT NULL,
        context_id TEXT NOT NULL,
        context_name TEXT,
        options_json TEXT,
        target_list_json TEXT,
        result_list_json TEXT,
        zip_file_name TEXT,
        zip_file_path TEXT,
        zip_size INTEGER,
        error_message TEXT,
        created_by INTEGER,
        created_at INTEGER,
        started_at INTEGER,
        finished_at INTEGER,
        updated_at INTEGER
      );
    `);

    // 2) 补齐缺失列（兼容历史库结构演进）
    const [columnList] = await sequelize.query("PRAGMA table_info('build_tasks');");
    const columnNameSet = new Set((Array.isArray(columnList) ? columnList : []).map((c) => c.name));

    const addColumnIfMissing = async (columnName, columnDefSql) => {
      if (columnNameSet.has(columnName)) return;
      await sequelize.query(`ALTER TABLE build_tasks ADD COLUMN ${columnDefSql};`);
      columnNameSet.add(columnName);
      defaultLogger.info(`[DB] build_tasks 新增列: ${columnName}`);
    };

    // 允许后续逐步扩展：新增列时优先允许 NULL，避免旧库阻塞
    await addColumnIfMissing('context_name', "context_name TEXT");
    await addColumnIfMissing('options_json', "options_json TEXT");
    await addColumnIfMissing('target_list_json', "target_list_json TEXT");
    await addColumnIfMissing('result_list_json', "result_list_json TEXT");
    await addColumnIfMissing('zip_file_name', "zip_file_name TEXT");
    await addColumnIfMissing('zip_file_path', "zip_file_path TEXT");
    await addColumnIfMissing('zip_size', "zip_size INTEGER");
    await addColumnIfMissing('error_message', "error_message TEXT");
    await addColumnIfMissing('created_by', "created_by INTEGER");
    await addColumnIfMissing('created_at', "created_at INTEGER");
    await addColumnIfMissing('started_at', "started_at INTEGER");
    await addColumnIfMissing('finished_at', "finished_at INTEGER");
    await addColumnIfMissing('updated_at', "updated_at INTEGER");

  } catch (error) {
    defaultLogger.error('[DB] ensureBuildTasksSchema 失败:', error.message);
    throw error;
  }
}

/**
 * 测试数据库连接
 * 验证 Sequelize 是否能成功连接到数据库
 * @returns {Promise<void>} 连接成功时 resolve，失败时 reject
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    defaultLogger.info('Sequelize 数据库连接成功');
  } catch (error) {
    defaultLogger.error('Sequelize 数据库连接失败:', error.message);
    throw error;
  }
}

/**
 * 导出表数据到文件（重建表前备份）
 * 将指定表的所有数据导出为 JSON 文件
 * @param {string} tableName - 要导出的表名
 * @returns {Promise<string|null>} 导出文件的绝对路径，表为空时返回 null
 */
async function exportTableData(tableName) {
  try {
    const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\`;`);
    if (rows.length === 0) return null;
    
    // 生成导出目录和文件名
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const exportDir = path.join(__dirname, '../data/exports');
    const exportFile = path.join(exportDir, `${tableName}_${timestamp}.json`);
    
    // 确保目录存在
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(exportFile, JSON.stringify(rows, null, 2), 'utf8');
    defaultLogger.info(`表 ${tableName} 数据已导出: ${exportFile}`);
    return exportFile;
  } catch (error) {
    defaultLogger.warn(`导出表 ${tableName} 失败:`, error.message);
    return null;
  }
}

/**
 * 同步数据库表结构
 * 开发环境使用 alter 模式动态更新表结构，生产环境严格校验表结构一致性
 * 自动处理数据库文件权限问题，并在失败时提供降级策略
 * @returns {Promise<void>}
 */
async function syncDatabase() {
  try {
    // 检查并修复数据库文件权限（只读问题）
    // 注意：chmod 仅在 Unix-like 系统上有效，Windows 不需要
    if (fs.existsSync(dbPath) && process.platform !== 'win32') {
      try {
        // 尝试写入测试
        fs.accessSync(dbPath, fs.constants.W_OK);
      } catch (accessError) {
        defaultLogger.warn('检测到数据库文件只读，尝试修复权限...');
        try {
          // 添加写权限
          // eslint-disable-next-line sonarjs/file-permissions -- 修复数据库文件只读问题，使用安全的 644 权限
          fs.chmodSync(dbPath, 0o644);
          defaultLogger.info('数据库文件权限已修复');
        } catch (chmodError) {
          defaultLogger.error('无法修复数据库文件权限，请手动执行: chmod 644', dbPath);
          throw new Error('数据库文件只读，无法同步');
        }
      }
    }

    if (isDev || isTest) {
      // 开发环境或测试环境：禁用外键检查，避免外键约束失败
      await sequelize.query('PRAGMA foreign_keys = OFF;');

      if (isDev) {
        // 开发环境：使用 alter 只修改有变化的表结构（保留数据）
        // 2. 版本系统 schema 补齐（增量 DDL + 存量回填）
        await ensurePacketMessagesVersioningSchema();

        // 2.1 构建任务 schema 补齐（增量 DDL）
        await ensureBuildTasksSchema();

        /**
         * 3. 同步表结构
         *
         * 注意：
         * - SQLite 下 `sync({ alter: true })` 可能触发重建表/索引校验异常（Sequelize 官方也不推荐在生产使用）。
         * - 本项目 `start-mac.sh` 启动服务端使用 `pnpm start`（非 nodemon），如果这里 `process.exit(0)` 会导致后端直接退出，
         *   进而前端 Vite 代理出现 ECONNREFUSED，并且如果做了“删库重建”会造成数据丢失。
         *
         * 处理策略：
         * - `pnpm dev`（nodemon 场景）允许使用 alter，便于开发迭代；
         * - `pnpm start`（常用本地一键启动）跳过 alter，使用普通 sync() 创建缺失表，避免破坏现有数据。
         */
        const lifecycleEvent = typeof process.env.npm_lifecycle_event === 'string' ? process.env.npm_lifecycle_event : '';
        const enableAlterInDev = lifecycleEvent === 'dev';

        if (enableAlterInDev) {
          try {
            await sequelize.sync({ alter: true });
            defaultLogger.info('开发环境：数据库表同步完成（alter=true）');
          } catch (alterError) {
            /**
             * SQLite 的 alter 会走“创建 *_backup 表 -> 复制数据 -> 重建”的流程，
             * 一旦遇到 UNIQUE/NOT NULL 等约束冲突会直接失败并留下 *_backup 表。
             * 这里采用“降级策略”：记录错误并降级为普通 sync()，确保服务能启动。
             */
            defaultLogger.warn(`开发环境：数据库表同步失败（alter=true），将降级为 sync() 以保证服务可用，详细错误: ${JSON.stringify(alterError)}`);

            try {
              // 清理失败的 alter 可能遗留的 *_backup 表，避免后续反复失败或污染库结构
              const [backupTableList] = await sequelize.query(
                "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%\\_backup' ESCAPE '\\';"
              );
              if (Array.isArray(backupTableList) && backupTableList.length > 0) {
                for (const t of backupTableList) {
                  if (!t || !t.name) continue;
                  await sequelize.query(`DROP TABLE IF EXISTS \`${t.name}\`;`);
                  defaultLogger.warn(`[DB] 已清理残留备份表: ${t.name}`);
                }
              }
            } catch (cleanupError) {
              defaultLogger.warn('清理 *_backup 表失败（可忽略）:', cleanupError.message);
            }

            await sequelize.sync();
            defaultLogger.info('开发环境：已降级为 sync()，请注意：本次不会自动迁移表结构差异');
          }
        } else {
          await sequelize.sync();
          defaultLogger.info('开发环境：已跳过 alter 同步（非 dev 启动），仅执行 sync() 创建缺失表');
        }
      } else {
        // 测试环境：直接同步表结构
        await ensurePacketMessagesVersioningSchema();
        await ensureBuildTasksSchema();
        await sequelize.sync();
        defaultLogger.info('测试环境：数据库表同步成功');
      }

      // 所有环境都禁用外键约束，符合项目数据库设计要求
      await sequelize.query('PRAGMA foreign_keys = OFF;');
      defaultLogger.info('外键约束已全局禁用');
    } else {
      // 生产环境：不自动修改表结构，有问题直接报错
      await ensurePacketMessagesVersioningSchema();
      await ensureBuildTasksSchema();
      await sequelize.sync();
      defaultLogger.info('生产环境：数据库表同步成功');
    }
  } catch (error) {
    defaultLogger.error('数据库表同步失败:', error.message);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
