/**
 * 生产版服务器 - 单文件可执行程序入口
 *
 * 功能：
 * - 启动后端 API 服务
 * - 提供前端静态页面
 * - 使用 SQLite 嵌入式数据库（better-sqlite3 原生实现）
 * - 数据存储在用户目录 ~/.cssc-node-view/
 *
 * 使用方法：
 * 1. 双击运行或命令行运行
 * 2. 浏览器访问显示的地址
 */

// ============================================
// 0. 初始化 pkg 环境和 code_gen 拦截器
// ============================================
const path = require('path');
const os = require('os');
const fs = require('fs');

// ============================================
// 0.1 加载并校验环境变量（必需，缺失则报错）
// ============================================
// 加载 .env.prod 文件（从可执行文件所在目录加载）
const dotenv = require('dotenv');
const envPath = path.join(path.dirname(process.execPath), '.env.prod');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// 校验必需的环境变量
const { validateRequiredEnv } = require('./server/utils/validate-env');
validateRequiredEnv(process.env, [
    'VITE_API_HOST',
    'VITE_API_PORT',
    'VITE_API_BASE_URL',
    'VITE_WS_HOST',
    'VITE_WS_PORT',
    'VITE_WS_URL',
    'VITE_FRONTEND_PORT',
    'NODE_ENV',
    'JWT_SECRET'
], '.env.prod', '生产环境启动');

// ============================================
// 0.2 初始化 pkg 环境和 code_gen 拦截器
// ============================================
if (process.pkg && typeof process.pkg.entrypoint === 'string') {
    const execDir = path.dirname(process.execPath);
    // code_gen 可执行文件名：code_gen.bin (Linux/mac) 或 code_gen.bin.exe (Windows)
    const codeGenExe = process.platform === 'win32' ? 'code_gen.bin.exe' : 'code_gen.bin';
    global.__CODE_GEN_EXEC_PATH__ = path.join(execDir, codeGenExe);
    global.__IS_PKG_ENV__ = true;
    console.log(`[pkg环境] code_gen路径: ${global.__CODE_GEN_EXEC_PATH__}`);
}

// ============================================
// 1. 数据目录设置（固定在用户目录）
// ============================================
const HOME_DIR = os.homedir();
const APP_DIR = path.join(HOME_DIR, '.cssc-node-view');
const DATA_DIR = path.join(APP_DIR, 'data');
const LOG_DIR = path.join(APP_DIR, 'logs');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

// 确保目录存在
[APP_DIR, DATA_DIR, LOG_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 设置运行时环境变量
process.env.NODE_ENV = 'production';
process.env.DATABASE_PATH = DB_PATH;
process.env.LOG_DIR = LOG_DIR;
process.env.DATA_DIR = DATA_DIR;

// ============================================
// 2. 基础依赖加载
// ============================================
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const favicon = require('serve-favicon');
const log4js = require("./server/middleware/log4jsPlus");

// 配置日志输出到固定目录
const logger = log4js.getLogger();

logger.info('========================================');
logger.info('通信监控网络规划系统 - 生产版');
logger.info('========================================');
logger.info(`数据目录: ${APP_DIR}`);
logger.info(`数据库: ${DB_PATH}`);
logger.info(`日志目录: ${LOG_DIR}`);
logger.info(`pkg环境: ${!!process.pkg}`);
logger.info('========================================');

// ============================================
// 创建运行时配置注入脚本
// ============================================
function createRuntimeConfigScript() {
    const config = {
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ,
        VITE_WS_URL: process.env.VITE_WS_URL ,
        VITE_API_HOST: process.env.VITE_API_HOST ,
        VITE_API_PORT: process.env.VITE_API_PORT ,
        VITE_WS_HOST: process.env.VITE_WS_HOST ,
        VITE_WS_PORT: process.env.VITE_WS_PORT ,
        VITE_FRONTEND_PORT: process.env.VITE_FRONTEND_PORT ,
    };
    const jsonString = JSON.stringify(config).replace(/</g, '\\x3c').replace(/>/g, '\\x3e');
    return `<script>window.__RUNTIME_CONFIG__=${jsonString};</script>`;
}

// ============================================
// 创建前端静态文件服务器（支持运行时配置注入）
// ============================================
function createFrontendServer(staticDir, port, host) {
    const http = require('http');
    const fs = require('fs');
    const path = require('path');

    const runtimeConfigScript = createRuntimeConfigScript();

    const frontendServer = http.createServer((req, res) => {
        // 解析 URL
        let filePath = path.join(staticDir, req.url === '/' ? 'index.html' : req.url);

        // 检查文件是否存在
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // 文件不存在，返回 index.html（SPA 路由支持）
                filePath = path.join(staticDir, 'index.html');
            }

            // 获取文件扩展名
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.ttf': 'font/ttf',
                '.eot': 'application/vnd.ms-fontobject',
            };

            const contentType = mimeTypes[ext] || 'application/octet-stream';

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - Not Found</h1>');
                    return;
                }

                // 如果是 index.html，注入运行时配置
                if (path.basename(filePath) === 'index.html') {
                    let htmlContent = data.toString('utf-8');
                    // 在 <head> 标签后插入运行时配置脚本
                    htmlContent = htmlContent.replace(
                        /<head>/i,
                        `<head>${runtimeConfigScript}`
                    );
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(htmlContent, 'utf-8');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                }
            });
        });
    });

    return frontendServer;
}

// ============================================
// 3. 主启动函数
// ============================================
async function main() {
    // ============================================
    // 3.1 数据库初始化
    // ============================================
    logger.info('开始初始化数据库...');

    // 加载模型（Sequelize 会自动使用 better-sqlite3）
    logger.info('开始加载模型...');
    require("./server/database/models");
    logger.info('模型加载完成');

    logger.info('加载 userSeed...');
    const { runSeed } = require("./server/database/seeds/userSeed");
    logger.info('userSeed 加载完成');

    // ============================================
    // 3.2 Express 应用配置
    // ============================================
    const app = express();

    // CORS 配置
    app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        credentials: false
    }));

    // ============================================
    // 3.2 HTTP 服务器（仅用于后端 API）
    // ============================================
    const httpServer = require("http").Server(app);

    // WebSocket 使用公共模块（来自 server/websocket.js）
    const { createWebSocketServer, getWebSocketServer } = require('./server/websocket');

    // ============================================
    // 3.4 应用 code_gen 调用的 Monkey Patch
    // ============================================
    if (global.__IS_PKG_ENV__) {
        try {
            // 在加载路由之前，先加载 codegenUtils 并进行 patch
            const codegenUtils = require('./server/utils/codegenUtils');
            const { spawn } = require('child_process');
            const { v4: uuidv4 } = require('uuid');
            const path = require('path');
            const fs = require('fs');

            // 保存原始函数
            const originalRunCodeGenerator = codegenUtils.runCodeGenerator;

            // 替换 runCodeGenerator 函数
            codegenUtils.runCodeGenerator = function patchedRunCodeGenerator(softwareConfig) {
                const logger = require('./server/middleware/log4jsPlus').getLogger();

                return new Promise((resolve, reject) => {
                    const baseOutputDir = path.resolve(__dirname, '../../generated_code');
                    const tempDir = path.resolve(__dirname, '../../generated_code/temp');

                    const buildId = uuidv4();
                    const outputDir = path.join(baseOutputDir, buildId);

                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }

                    const tempConfigPath = path.join(tempDir, `config_${Date.now()}.json`);
                    fs.writeFileSync(tempConfigPath, JSON.stringify(softwareConfig, null, 2), 'utf-8');
                    logger.info(`[codegenUtils-patch] 配置文件已写入: ${tempConfigPath}`);
                    logger.info(`[codegenUtils-patch] 输出目录: ${outputDir}`);
                    logger.info(`[codegenUtils-patch] code_gen可执行文件: ${global.__CODE_GEN_EXEC_PATH__}`);

                    const logFilePath = path.join(tempDir, `gencode_${Date.now()}.log`);

                    if (!fs.existsSync(global.__CODE_GEN_EXEC_PATH__)) {
                        reject(new Error(`code_gen可执行文件不存在: ${global.__CODE_GEN_EXEC_PATH__}`));
                        return;
                    }

                    const child = spawn(global.__CODE_GEN_EXEC_PATH__, [
                        tempConfigPath,
                        '-o', outputDir,
                        '-v',
                        '--log-output', 'file',
                        '--log-level', 'debug',
                        '--log-file', logFilePath
                    ], {
                        cwd: path.dirname(global.__CODE_GEN_EXEC_PATH__)
                    });

                    let stdout = '';
                    let stderr = '';

                    child.stdout.on('data', (data) => {
                        stdout += data.toString();
                        logger.info(`[codegenUtils-patch] ${data.toString()}`);
                    });

                    child.stderr.on('data', (data) => {
                        stderr += data.toString();
                        logger.error(`[codegenUtils-patch Error] ${data.toString()}`);
                    });

                    child.on('close', async (code) => {
                        try {
                            fs.unlinkSync(tempConfigPath);
                        } catch (e) {
                            // ignore
                        }

                        if (code === 0) {
                            try {
                                const now = new Date();
                                const timeStamp = [
                                    now.getFullYear(),
                                    String(now.getMonth() + 1).padStart(2, '0'),
                                    String(now.getDate()).padStart(2, '0'),
                                    '_',
                                    String(now.getHours()).padStart(2, '0'),
                                    '_',
                                    String(now.getMinutes()).padStart(2, '0'),
                                    '_',
                                    String(now.getSeconds()).padStart(2, '0'),
                                    '_',
                                    String(now.getMilliseconds()).padStart(3, '0')
                                ].join('');
                                const zipFileName = `${softwareConfig.softwareName}_${timeStamp}.zip`;
                                const zipFilePath = path.join(baseOutputDir, zipFileName);

                                await codegenUtils.zipDirectory(outputDir, zipFilePath);
                                logger.info(`[codegenUtils-patch] 代码已打包: ${zipFilePath}`);

                                resolve({
                                    outputDir,
                                    buildId,
                                    zipFileName,
                                    zipFilePath,
                                    generatedFiles: stdout,
                                    message: '代码生成成功'
                                });
                            } catch (zipError) {
                                logger.error(`[codegenUtils-patch] 打包失败: ${zipError.message}`);
                                reject(new Error(`代码生成成功，但打包失败: ${zipError.message}`));
                            }
                        } else {
                            reject(new Error(`代码生成失败 (exit code: ${code}): ${stderr || stdout}`));
                        }
                    });

                    child.on('error', (error) => {
                        try {
                            fs.unlinkSync(tempConfigPath);
                        } catch (e) {
                            // ignore
                        }
                        reject(new Error(`无法启动代码生成器: ${error.message}`));
                    });
                });
            };

            console.log('[monkey-patch] codegenUtils.runCodeGenerator 已替换');
        } catch (e) {
            console.error('[monkey-patch] 应用 patch 失败:', e.message);
        }
    }

    // ============================================
    // 3.5 Patch build.js 中的 code_gen 调用
    // ============================================
    if (global.__IS_PKG_ENV__) {
        try {
            // 在加载 buildRouter 之前，先加载并 patch build.js
            const buildService = require('./server/mvc/services/build');
            const { spawn } = require('child_process');
            const path = require('path');
            const fs = require('fs');
            const logger = require('./server/middleware/log4jsPlus').getLogger();

            // 保存原始的 runNodegen 函数
            const originalRunNodegen = buildService.runNodegen;

            // 替换 runNodegen 函数
            buildService.runNodegen = async function patchedRunNodegen(config, outputDir, logFilePath) {
                logger.info(`[build.js-patch] 使用打包后的 code_gen: ${global.__CODE_GEN_EXEC_PATH__}`);

                if (!fs.existsSync(global.__CODE_GEN_EXEC_PATH__)) {
                    throw new Error(`code_gen可执行文件不存在: ${global.__CODE_GEN_EXEC_PATH__}`);
                }

                const args = [
                    config,
                    '-o', outputDir,
                    '-v',
                    '--log-output', 'both',
                    '--log-level', 'info',
                    '--log-file', logFilePath
                ];

                const child = spawn(global.__CODE_GEN_EXEC_PATH__, args, {
                    cwd: path.dirname(global.__CODE_GEN_EXEC_PATH__),
                    windowsHide: true,
                });

                return child;
            };

            console.log('[monkey-patch] buildService.runNodegen 已替换');
        } catch (e) {
            console.error('[monkey-patch] 应用 build.js patch 失败:', e.message);
        }
    }

    // ============================================
    // 3.6 API 路由配置
    // ============================================
    const apiPrefix = "/api";

    // 中间件
    const accessHandler = require("./server/middleware/accessLogger");
    const errorHandler = require("./server/middleware/errorLogger");
    const responseFormatMiddleware = require("./server/middleware/response");

    // 路由配置表
    const routeConfigList = [
        { prefix: "/health", router: require("./server/routes/healthRouter"), desc: "健康检查接口" },
        { prefix: "/auth", router: require("./server/routes/authRouter"), desc: "认证接口" },
        { prefix: "/user", router: require("./server/routes/userRouter"), desc: "用户接口" },
        { prefix: "/roles", router: require("./server/routes/roleRouter"), desc: "角色接口" },
        { prefix: "/permissions", router: require("./server/routes/permissionRouter"), desc: "权限接口" },
        { prefix: "/hierarchy", router: require("./server/routes/hierarchyRouter"), desc: "层级配置接口" },
        { prefix: "/system-level-design-tree", router: require("./server/routes/systemLevelDesignTreeRouter"), desc: "体系配置树节点接口" },
        { prefix: "/flowcharts", router: require("./server/routes/flowchartRouter"), desc: "流程图接口" },
        { prefix: "/packet-messages", router: require("./server/routes/packetMessageRouter"), desc: "报文配置管理接口" },
        { prefix: "/packet-message-categories", router: require("./server/routes/packetMessageCategoryRouter"), desc: "报文分类管理接口" },
        { prefix: "/topology", router: require("./server/routes/topologyRouter"), desc: "拓扑展示接口" },
        { prefix: "/database", router: require("./server/routes/databaseRouter"), desc: "数据库管理接口" },
        { prefix: "/build", router: require("./server/routes/buildRouter"), desc: "构建管理接口" },
        { prefix: "/communication-nodes", router: require("./server/routes/communicationNodeRouter"), desc: "通信节点接口" },
        { prefix: "/ide", router: require("./server/routes/dataImportExportRouter"), desc: "IDE 数据导入导出接口" },
        { prefix: "/logs", router: require("./server/routes/logRouter"), desc: "前端日志接口" },
    ];

    // 提前注册需要处理文件上传的路由
    const dataImportExportRouter = require("./server/routes/dataImportExportRouter");
    app.use(apiPrefix + "/ide", responseFormatMiddleware, accessHandler, dataImportExportRouter);

    // 其他路由
    app.use(bodyParser.json());
    app.use(responseFormatMiddleware);
    app.use(accessHandler);

    const otherRoutes = routeConfigList.filter(r => r.prefix !== "/ide");
    otherRoutes.forEach(({ prefix, router }) => {
        app.use(apiPrefix + prefix, router);
    });

    app.use(errorHandler);

    // Swagger API 文档
    const swaggerUi = require("swagger-ui-express");
    const swaggerJsDoc = require('swagger-jsdoc');
    const swaggerDocument = swaggerJsDoc(require('./server/swagger'));

    const getDoc = (req) => {
        const k = req.query.module || req.query.model;
        if (!k) return swaggerDocument;
        const doc = { ...swaggerDocument };
        doc.paths = Object.entries(doc.paths).reduce((a, [p, c]) => (p.includes(k) ? { ...a, [p]: c } : a), {});
        return doc;
    };

    app.get('/api-json', (req, res) => res.json(getDoc(req)));
    app.use('/api-docs', swaggerUi.serve, (req, res, n) => swaggerUi.setup(getDoc(req))(req, res, n));

    // ============================================
    // 3.7 清理占用端口的进程
    // ============================================
    const { execSync } = require('child_process');

    function killProcessOnPort(port) {
        const platform = process.platform;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            try {
                let pidList = [];

                if (platform === 'darwin' || platform === 'linux') {
                    // macOS/Linux: 使用 lsof 查找所有占用端口的进程
                    try {
                        const result = execSync(`lsof -ti :${port}`, { encoding: 'utf-8' }).trim();
                        pidList = result.split('\n').filter(p => p);
                    } catch (e) {
                        // 端口未被占用，成功
                        return true;
                    }

                    if (pidList.length > 0) {
                        for (const pid of pidList) {
                            try {
                                execSync(`kill -9 ${pid}`, { encoding: 'utf-8' });
                                logger.info(`已终止占用端口 ${port} 的进程 (PID: ${pid})`);
                            } catch (e) {
                                // 进程可能已经结束
                            }
                        }

                        // 等待端口释放
                        execSync('sleep 1', { encoding: 'utf-8' });

                        // 再次检查是否还有进程占用
                        try {
                            execSync(`lsof -ti :${port}`, { encoding: 'utf-8' });
                            // 还有进程占用，继续重试
                            continue;
                        } catch (e) {
                            // 端口已释放
                            return true;
                        }
                    }
                } else if (platform === 'win32') {
                    // Windows: 使用 netstat 和 taskkill
                    try {
                        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' }).trim();
                        const lines = result.split('\n');
                        for (const line of lines) {
                            const match = line.match(/LISTENING\s+(\d+)/);
                            if (match) {
                                const pid = match[1];
                                try {
                                    execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
                                    logger.info(`已终止占用端口 ${port} 的进程 (PID: ${pid})`);
                                } catch (e) {
                                    // 进程可能已经结束
                                }
                            }
                        }

                        // 等待端口释放
                        execSync('timeout /t 1 > nul', { encoding: 'utf-8', shell: true });
                        return true;
                    } catch (e) {
                        // 端口未被占用
                        return true;
                    }
                }
            } catch (error) {
                // 继续重试
            }
        }

        logger.warn(`端口 ${port} 可能仍被占用，将尝试启动...`);
        return false;
    }

    // ============================================
    // 3.8 启动服务器
    // ============================================
    const VITE_API_PORT = parseInt(process.env.VITE_API_PORT, 10);
    const VITE_API_HOST = process.env.VITE_API_HOST;
    const VITE_WS_PORT = parseInt(process.env.VITE_WS_PORT, 10);
    const VITE_WS_HOST = process.env.VITE_WS_HOST;
    const VITE_FRONTEND_PORT = parseInt(process.env.VITE_FRONTEND_PORT, 10);

    try {
        // 清理占用端口的进程
        logger.info(`检查端口 ${VITE_API_PORT} 是否被占用...`);
        killProcessOnPort(VITE_API_PORT);
        killProcessOnPort(VITE_WS_PORT);
        killProcessOnPort(VITE_FRONTEND_PORT);

        // 数据库初始化
        logger.info('开始数据库初始化...');

        // 使用 better-sqlite3 进行数据库同步
        const { syncDatabase } = require('./server/database/sequelize');
        await syncDatabase();
        logger.info('数据库同步完成');

        // 执行种子数据
        await runSeed();
        logger.info('种子数据加载完成');

        // 获取前端静态文件目录
        let staticDir;
        if (process.pkg) {
            const execDir = path.dirname(process.execPath);
            const externalDir = path.join(execDir, 'public');
            const internalDir = path.join(__dirname, 'client', 'dist');
            if (fs.existsSync(externalDir)) {
                staticDir = externalDir;
                logger.info(`使用外部静态文件目录: ${externalDir}`);
            } else {
                staticDir = internalDir;
                logger.info(`使用虚拟文件系统静态目录: ${internalDir}`);
            }
        } else {
            staticDir = path.join(__dirname, 'client', 'dist');
        }

        // 启动 WebSocket 服务器（独立端口 9210，使用公共模块）
        createWebSocketServer(VITE_WS_PORT, VITE_WS_HOST);

        // 启动前端静态文件服务器（独立端口 9300）
        const frontendServer = createFrontendServer(staticDir, VITE_FRONTEND_PORT, VITE_API_HOST);
        frontendServer.listen(VITE_FRONTEND_PORT, VITE_API_HOST, function () {
            logger.info(`前端静态服务启动: http://${VITE_API_HOST}:${VITE_FRONTEND_PORT}`);
        });

        // 启动后端 API 服务器
        httpServer.listen(VITE_API_PORT, VITE_API_HOST, function () {
            logger.info(`后端 API 服务启动: http://${VITE_API_HOST}:${VITE_API_PORT}/api`);
        });

        // 定时清理过期会话
        const { cleanExpiredSessions } = require("./server/middleware/auth");
        const sessionCleanupInterval = setInterval(async () => {
            try {
                await cleanExpiredSessions();
                logger.info('过期会话清理完成');
            } catch (error) {
                logger.error('清理过期会话失败:', error);
            }
        }, 60 * 60 * 1000);

        // 优雅关闭
        const gracefulShutdown = (signal) => {
            logger.info(`收到 ${signal} 信号，正在关闭...`);
            clearInterval(sessionCleanupInterval);
            const { wsServer } = getWebSocketServer();
            if (wsServer) {
                wsServer.close(() => {
                    logger.info('WebSocket 服务器已关闭');
                });
            }
            frontendServer.close(() => {
                logger.info('前端静态服务器已关闭');
            });
            httpServer.close(() => {
                logger.info('后端 API 服务器已关闭');
                try {
                    // 保存数据库
                    const { sequelize } = require('./server/database/sequelize');
                    const data = sequelize.connectionManager.connections.get('default').instance.lib;
                    if (data && data.close) {
                        data.close();
                    }
                } catch (e) {
                    // 忽略
                }
                process.exit(0);
            });
            setTimeout(() => {
                logger.error('强制退出');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // ============================================
        // 3.8 显示启动信息
        // ============================================
        setTimeout(() => {
            const localIP = getLocalIP();
            console.log('');
            console.log('');
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                                                               ║');
            console.log('║        通信监控网络规划系统 - 服务器启动成功                    ║');
            console.log('║                                                               ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log('  前端页面:');
            console.log('  ┌─────────────────────────────────────────────────────────────┐');
            console.log(`  │  本机访问:   http://${VITE_API_HOST}:${VITE_FRONTEND_PORT}       │`);
            if (localIP) {
                console.log(`  │  局域网访问: http://${localIP}:${VITE_FRONTEND_PORT}    │`);
            }
            console.log('  └─────────────────────────────────────────────────────────────┘');
            console.log('');
            console.log('  后端 API:');
            console.log('  ┌─────────────────────────────────────────────────────────────┐');
            console.log(`  │  API 地址:   http://${VITE_API_HOST}:${VITE_API_PORT}/api       │`);
            console.log(`  │  WebSocket:  ws://${VITE_API_HOST}:${VITE_WS_PORT}       │`);
            console.log('  └─────────────────────────────────────────────────────────────┘');
            console.log('');
            console.log('  数据存储:');
            console.log('  ┌─────────────────────────────────────────────────────────────┐');
            console.log(`  │  数据目录:   ${APP_DIR} │`);
            console.log(`  │  数据库:     ${DB_PATH}       │`);
            console.log('  └─────────────────────────────────────────────────────────────┘');
            console.log('');
            console.log('  按下 Ctrl+C 停止服务器');
            console.log('');
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                                                               ║');
            console.log('║        请在浏览器中打开上面的地址开始使用                        ║');
            console.log('║                                                               ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝');
            console.log('');
            console.log('');
        }, 1500);

    } catch (error) {
        logger.error('服务器启动失败:', error);
        console.error('');
        console.error('╔═══════════════════════════════════════════════════════════════╗');
        console.error('║                                                               ║');
        console.error('║                 服务器启动失败，请查看错误信息                   ║');
        console.error('║                                                               ║');
        console.error('╚═══════════════════════════════════════════════════════════════╝');
        console.error('');
        process.exit(1);
    }
}

// 获取本机局域网 IP 地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

// 启动应用
main().catch(error => {
    console.error('应用启动失败:', error);
    process.exit(1);
});
