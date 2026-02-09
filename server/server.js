var path = require('path');

// 加载环境变量（必须在所有其他 require 之前）
// 根据 NODE_ENV 加载对应的 .env 文件
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = nodeEnv === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.join(__dirname, `../${envFile}`) });

// 生产环境不需要 Babel 转译，Node.js 22 已支持现代 JavaScript 特性
if (nodeEnv !== 'production') {
    require("@babel/register");
}
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors")
const favicon = require('serve-favicon');
const { exec } = require("child_process");
const log4js = require("./middleware/log4jsPlus");
const logger = log4js.getLogger();

/**
 * 清理指定端口上占用的进程
 * @param {number} port - 需要清理的端口号
 * @returns {Promise<void>} 异步完成清理操作
 */
function killPortProcess(port) {
    return new Promise((resolve) => {
        exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, (error, stdout, stderr) => {
            if (stdout || error) {
                logger.warn(`已清理端口 ${port} 上的占用进程`);
            }
            resolve();
        });
    });
}

/**
 * 启动服务器前检查并清理端口（容器环境中跳过）
 * @param {number} port - 需要检查和清理的端口号
 * @returns {Promise<void>} 异步完成端口可用性检查
 */
async function ensurePortAvailable(port) {
    // 容器环境中不需要检查端口占用
    if (process.env.CONTAINER_MODE === 'true') {
        return;
    }
    await killPortProcess(port);
    // 等待一小段时间确保端口释放完成
    await new Promise(resolve => setTimeout(resolve, 100));
}

// 初始化数据库
const { testConnection, syncDatabase } = require("./database/sequelize");
require("./database/models"); // 加载模型定义
const { runSeed: runUserSeed } = require("./database/seeds/userSeed");
const { runSeed: runProcessNodeTypeSeed } = require("./database/seeds/processNodeTypeSeed");
const { runSeed: runRequirementSeed } = require("./database/seeds/requirementSeed");
const { runSeed: runRequirementTypeSeed } = require("./database/seeds/requirementTypeSeed");
const { runSeed: runRequirementStatusSeed } = require("./database/seeds/requirementStatusSeed");

const swaggerUi = require("swagger-ui-express")
const swaggerJsDoc = require('swagger-jsdoc');

const accessHandler = require("./middleware/accessLogger")
const errorHandler = require("./middleware/errorLogger")
const responseFormatMiddleware = require("./middleware/response")
const { cleanExpiredSessions } = require("./middleware/auth")

const { getRandomValue } = require("./utils/util")
const app = express();

// CORS 配置：允许所有来源
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: false
}));
app.use(favicon(path.join(__dirname, 'favicon.ico')));

// HTTP 服务器（用于 API）
const httpServer = require("http").Server(app);

// WebSocket 服务器（独立端口，使用公共模块）
const { createWebSocketServer, getWebSocketServer } = require('./websocket');

const {
    VITE_API_HOST,
    VITE_API_PORT,
    VITE_WS_HOST,
    VITE_WS_PORT
} = require("./etc/config")

const apiPrefix = "/api";

// 路由配置表：路径前缀、路由模块、描述
const routeConfigList = [
    { prefix: "/health", router: require("./routes/healthRouter"), desc: "健康检查接口" },
    { prefix: "/auth", router: require("./routes/authRouter"), desc: "认证接口" },
    { prefix: "/user", router: require("./routes/userRouter"), desc: "用户接口" },
    { prefix: "/roles", router: require("./routes/roleRouter"), desc: "角色接口" },
    { prefix: "/permissions", router: require("./routes/permissionRouter"), desc: "权限接口" },
    { prefix: "/hierarchy", router: require("./routes/hierarchyRouter"), desc: "层级配置接口" },
    { prefix: "/system-level-design-tree", router: require("./routes/systemLevelDesignTreeRouter"), desc: "体系配置树节点接口" },
    { prefix: "/flowcharts", router: require("./routes/flowchartRouter"), desc: "流程图接口" },
    { prefix: "/packet-messages", router: require("./routes/packetMessageRouter"), desc: "报文配置管理接口" },
    { prefix: "/packet-message-categories", router: require("./routes/packetMessageCategoryRouter"), desc: "报文分类管理接口" },
    { prefix: "/topology", router: require("./routes/topologyRouter"), desc: "拓扑展示接口" },
    { prefix: "/database", router: require("./routes/databaseRouter"), desc: "数据库管理接口" },
    { prefix: "/build", router: require("./routes/buildRouter"), desc: "构建管理接口" },
    { prefix: "/communication-nodes", router: require("./routes/communicationNodeRouter"), desc: "通信节点接口" },
    { prefix: "/ide", router: require("./routes/dataImportExportRouter"), desc: "IDE 数据导入导出接口" },
    { prefix: "/logs", router: require("./routes/logRouter"), desc: "前端日志接口" },
    { prefix: "/projects", router: require("./routes/projectRouter"), desc: "项目管理接口" },
    { prefix: "/reviews", router: require("./routes/reviewRouter"), desc: "评审管理接口" },
    { prefix: "/requirements", router: require("./routes/requirementRouter"), desc: "需求管理接口" },
    { prefix: "/tasks", router: require("./routes/taskRouter"), desc: "任务管理接口" },
    { prefix: "/process-node-types", router: require("./routes/processNodeTypeRouter"), desc: "流程节点类型管理接口" },
    { prefix: "/requirement-types", router: require("./routes/requirementTypeRouter"), desc: "需求类型管理接口" },
    { prefix: "/requirement-statuses", router: require("./routes/requirementStatusRouter"), desc: "需求状态管理接口" },
    { prefix: "/review-templates", router: require("./routes/reviewTemplateRouter"), desc: "评审流程模板管理接口" },
];

// 提前注册需要处理文件上传的路由（在 bodyParser 之前，避免 FormData 被错误解析）
const dataImportExportRouter = require("./routes/dataImportExportRouter");
app.use(apiPrefix + "/ide", responseFormatMiddleware, accessHandler, dataImportExportRouter);

// 全局中间件（用于其他路由）
app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb', parameterLimit: 1000000 }));
// 设置字符编码为 UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // 确保响应数据使用 UTF-8 编码
  const originalJson = res.json;
  res.json = function(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    res.setHeader('Content-Length', Buffer.byteLength(jsonStr, 'utf8'));
    return res.send(Buffer.from(jsonStr, 'utf8'));
  };
  next();
});
app.use(responseFormatMiddleware);
app.use(accessHandler);

// 注册其他路由（排除已在上面注册的 ide）
const otherRoutes = routeConfigList.filter(r => r.prefix !== "/ide");
otherRoutes.forEach(({ prefix, router }) => {
    app.use(apiPrefix + prefix, router);
});

// 错误处理中间件（放在最后，捕获所有路由的错误）
app.use(errorHandler);

// 动态过滤 Swagger 文档
const swaggerDocument = swaggerJsDoc(require('./swagger'));

/**
 * 动态过滤 Swagger 文档，根据查询参数返回指定模块的文档
 * @param {object} req - Express 请求对象
 * @returns {object} 过滤后的 Swagger 文档对象
 */
const getDoc = (req) => {
    const k = req.query.module || req.query.model;
    if (!k) return swaggerDocument;
    const doc = { ...swaggerDocument };
    doc.paths = Object.entries(doc.paths).reduce((a, [p, c]) => (p.includes(k) ? { ...a, [p]: c } : a), {});
    return doc;
};

app.get('/api-json', (req, res) => res.json(getDoc(req)));
app.use('/api-docs', swaggerUi.serve, (req, res, n) => swaggerUi.setup(getDoc(req))(req, res, n));

// 初始化 Sequelize 并启动服务器
(async () => {
    try {
        // 安全检查：检测是否使用默认的 JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';
        if (jwtSecret === 'your-secret-key-here') {
            logger.warn('========================================');
            logger.warn('警告: 正在使用默认的 JWT_SECRET');
            logger.warn('生产环境请务必修改 .env 文件中的 JWT_SECRET');
            logger.warn('========================================');
        }

        await testConnection();
        await syncDatabase();
        // 初始化用户管理模块种子数据 - 同步加载确保数据准备好
        await runUserSeed();
        await runProcessNodeTypeSeed();
        await runRequirementSeed();
        await runRequirementTypeSeed();
        await runRequirementStatusSeed();
        logger.info('种子数据初始化完成');

        // 种子数据加载完成后，启动服务器
        // 启动前清理可能占用的端口
        await ensurePortAvailable(VITE_API_PORT);
        await ensurePortAvailable(VITE_WS_PORT);

        // WebSocket 服务（独立端口）
        createWebSocketServer(VITE_WS_PORT, VITE_WS_HOST);

        // HTTP API 服务
        httpServer.listen(VITE_API_PORT, VITE_API_HOST, function () {
            const nodeEnv = process.env.NODE_ENV || 'development';
            const envDisplay = nodeEnv === 'test' ? '*** 测试环境 (TEST) ***' : nodeEnv;
            logger.info(`========================================`)
            logger.info(`运行环境: ${envDisplay}`)
            logger.info(`========================================`)
            logger.info(`Http 服务(${VITE_API_HOST}:${VITE_API_PORT}) 启动成功`)
        })

        // 定时清理过期会话（每小时执行一次）
        const sessionCleanupInterval = setInterval(async () => {
            try {
                await cleanExpiredSessions();
                logger.info('过期会话清理完成');
            } catch (error) {
                logger.error('清理过期会话失败:', error);
            }
        }, 60 * 60 * 1000); // 1小时

        // 优雅关闭处理
        /**
         * 优雅关闭处理函数
         * @param {string} signal - 接收到的信号名称（SIGTERM 或 SIGINT）
         * @returns {void} 无返回值，触发服务器关闭流程
         */
        const gracefulShutdown = (signal) => {
            logger.info(`收到 ${signal} 信号，开始优雅关闭...`);

            // 清除定时器
            clearInterval(sessionCleanupInterval);

            // 关闭 HTTP 服务器
            httpServer.close(() => {
                logger.info('HTTP 服务器已关闭');
            });

            // 关闭数据库连接
            const { sequelize } = require('./database/sequelize');
            sequelize.close().then(() => {
                logger.info('数据库连接已关闭');
                process.exit(0);
            }).catch((err) => {
                logger.error('关闭数据库连接失败:', err);
                process.exit(1);
            });

            // 强制退出超时（10秒后强制退出）
            setTimeout(() => {
                logger.error('优雅关闭超时，强制退出');
                process.exit(1);
            }, 10000);
        };

        // 监听进程退出信号
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // 延迟输出服务信息
        setTimeout(() => {
            logger.info('========================================')
            logger.info('🚀 服务器启动完成')
            logger.info('========================================')
            logger.info(`📡 HTTP API 服务: http://localhost:${VITE_API_PORT}`)
            logger.info(`📚 API 文档地址: http://localhost:${VITE_API_PORT}/api-docs`)
            logger.info(`   (支持过滤: ?module=system-level-design-tree)`)
            logger.info(`📄 API JSON数据: http://localhost:${VITE_API_PORT}/api-json`)
            logger.info(`   (支持过滤: ?module=system-level-design-tree)`)
            logger.info(`🔌 WebSocket 服务: ws://${VITE_WS_HOST}:${VITE_WS_PORT}`)
            logger.info('========================================')
            logger.info('📋 可用接口路由:')
            // 动态输出路由配置
            const maxPrefixLen = Math.max(...routeConfigList.map(r => r.prefix.length));
            routeConfigList.forEach(({ prefix, desc }) => {
                logger.info(`   ${prefix.padEnd(maxPrefixLen + 2)} - ${desc}`);
            });
            logger.info('========================================')
            logger.info('💡 提示: 访问 API 文档查看详细接口说明')
            logger.info('========================================')
        }, 2000)

    } catch (error) {
        logger.error('服务器初始化失败:', error);
        process.exit(1);
    }
})();

/// ------------------------测试随机数------------------------
// for(i=0;i<100;i++){
//     let temp = getRandomValue(40,50);
//     logger.info(`${i} 温度计算随机数：${temp}  !!!!`)
//     let temp2 = getRandomValue(3.5,4.5);
//     logger.info(`${i} ----带宽------：${temp2} !!!!`)
//     let temp3 = getRandomValue(1,3);
//     logger.info(`${i} ----CPU-------：${temp3} !!!!`)
//
//     let temp4 = getRandomValue(9,10);
//     logger.info(`${i} ----信噪比----：${temp4} !!!!`)
// }
/// ------------------------测试随机数------------------------
