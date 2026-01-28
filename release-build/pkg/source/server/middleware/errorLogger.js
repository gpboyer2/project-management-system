const log4js = require("./log4jsPlus");

const errLogger = log4js.getLogger('error');
const logger = log4js.getLogger();

// 错误处理中间件函数
const errorHandler = (err, req, res, next) => {
    errLogger.error(err.stack);
    logger.info(err.stack);
    res.status(500).send('Internal Server Error');
};

module.exports = errorHandler