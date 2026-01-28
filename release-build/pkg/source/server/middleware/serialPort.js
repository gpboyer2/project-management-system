const SerialPort = require('serialport');
const log4js = require("../middleware/log4jsPlus");
const logger = log4js.getLogger("default");

function createSerialPort(path, baudRate) {
    const port = new SerialPort.SerialPort({ path,baudRate });

    port.on('open', () => {
        logger.info(`串口 ${path} 已打开，正在监听数据...`);
    });

    port.on('error', (err) => {
        logger.error(`${path} 串口发生错误:`, err.message);
    });

    port.on('data', (data) => {
        logger.info(`从 ${path} 串口收到数据:`, data.toString());
    });

    return port;
}

function serialPortMiddleware(options) {
    const { ports } = options;
    

    const serialPorts = [];

    // 创建串口实例并存储到数组中
    ports.forEach(port => {
        const { path, baudRate } = port;
        logger.info(port);
        const serialPort = createSerialPort(path, baudRate);
        serialPorts.push(serialPort);
    });

    return (req, res, next) => {
        req.serialPorts = serialPorts;
        next();
    };
}
function serialPortList() {
    SerialPort.SerialPort.list().then(ports => {
        logger.info("输出当前设备所有串口：",ports.length===0?'无串口':ports);
    }).catch(error => {
        logger.error(error)
    });
}

module.exports = {serialPortMiddleware,serialPortList};