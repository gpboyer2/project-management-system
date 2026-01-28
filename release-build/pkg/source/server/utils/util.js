
const log4js = require("../middleware/log4jsPlus")
const debugLogger = log4js.getLogger("debug")/**
 * 通用工具函数集合
 * @fileoverview 提供网络、时间、编码、计算等各类通用工具函数
 * @author CSSC Node View
 * @version 1.0.0
 * @since 2025-11-28
 */

const { networkInterfaces } = require('os');

/**
 * 获取本地IP地址
 * @returns 
 */
function getLocalIP() {
    const interfaces = networkInterfaces();
    let localIP = '';

    Object.keys(interfaces).forEach((name) => {
        interfaces[name].forEach((iface) => {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
            }
        });
    });

    return localIP;
}

/**
 * 获取当前时间数组  7位
 * 2023年9月2日 12:23:56 ->[20,23,09,02,12,23,56]
 * @returns [20,23,09,02,12,23,56]
 */
function parseTimeStampToArray() {
    const now = new Date();

    const year = now.getFullYear();

    const yearFirstDigit = String(Math.floor(year / 100));
    const yearSecondDigit = String(year % 100).padStart(2, '0');

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getDay()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedTime = [yearFirstDigit, yearSecondDigit, month, day, hours, minutes, seconds];
    return formattedTime;
}
/**
 * 获取当前时间数组  7个字段，占8位 2023 占两位
 * 2023年9月2日 12:23:56 23 ->[2023,09,02,12,23,56,0]
 * @returns [20,23,09,02,12,23,56]
 */
function parseTimeStampToArray1() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getDay()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedTime = [year, month, day, hours, minutes, seconds, "0"];
    return formattedTime;
}
/**
 * 数组转为日期
 * [2023,09,02,12,23,56,0]-> 2023年9月2日 12:23:56
 * @param {*} timeArray 
 * @returns 
 */
function parseToTimestamp1(timeArray) {
    const [year, month, day, hours, minutes, seconds] = timeArray;


    // 创建一个 Date 对象来表示指定的时间
    const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));

    // 获取该时间对应的时间戳（单位为毫秒）
    const timestamp = date.toLocaleString();

    return timestamp;
}
/**
 * 数组转为日期
 * [20,23,09,02,12,23,56] -> 2023年9月2日 12:23:56
 * @param {*} timeArray 
 * @returns 
 */
function parseToTimestamp(timeArray) {
    const [yearFirstDigit, yearSecondDigit, month, day, hours, minutes, seconds] = timeArray;
    // 将年份的两个数字合并成一个四位数
    const year = parseInt(yearFirstDigit + yearSecondDigit, 10);
    // 创建一个 Date 对象来表示指定的时间
    const date = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10), parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds, 10));
    // 获取该时间对应的时间戳（单位为毫秒）
    const timestamp = date.getTime();

    return timestamp;
}


/**
 * 转化时间 12:08:10 -> [12,08,10,00]
 * @param {*} time 时间字符串 122334 12:23:34
 * @returns 
 */
function parseTimeArray(timeString) {
    const timeArray = timeString.split(':').map(item => item.padStart(2, '0'));
    timeArray.push("00");

    return timeArray;
}

/**
 * 转化时间 [12,08,10,00] -> 12:08:10  去掉00，拼接字符串:‘:’
 * @param {*} time [12,08,10,00] 
 * @returns 
 */
function parseTimeString(timeArray) {
    const newArr = timeArray.slice(0, 3);

    return newArr.join(':');
}

/**
 * 度分秒数值转为数组 
 * 115.8657  -> [115,51,27,50]
 * @param {*} dms 
 * @returns [度、分、秒，毫秒]
 */
function parseDegrees(dms) {
    const degrees = Math.floor(dms);
    const minutes = Math.floor((dms - degrees) * 60);
    const seconds = Math.floor((dms - degrees - minutes / 60) * 3600).toFixed(2);
    const secondsInt = Math.floor(seconds);
    const secondsDecimal = Math.round((seconds - secondsInt) * 100);

    return [degrees, minutes, secondsInt, secondsDecimal];
}

/**
 * [度、分、秒，毫秒]转经纬度数值
 * [115,51,27,50] -> 115.8657
 * @param {*} degrees 
 * @param {*} minutes 
 * @param {*} secondsInt 
 * @param {*} secondsDecimal 
 * @returns 
 */
function parseDegreesArray(dms) {

    const degrees = dms[0];
    const minutes = dms[1];
    const secondsInt = dms[2];
    const secondsDecimal = dms[3];

    const totalSeconds = secondsInt + secondsDecimal / 100;
    const totalMinutes = minutes + totalSeconds / 60;
    const totalDegrees = degrees + totalMinutes / 60;
    return totalDegrees;
}
/**
 * 117°51′27″ -> [度、分、秒，毫秒]
 * 度分秒转为数组
 * @param {*} dms 
 */
function parseDMS(dms) {
    // 使用正则表达式提取度、分、秒的数值部分
    var result = longitude.match(/(\d+)°(\d+)′(\d+)″/);

    // 将数值部分转换为整数
    var degrees = parseInt(result[1]);
    var minutes = parseInt(result[2]);
    var seconds = parseInt(result[3]);

    // 计算秒钟的小数部分，并转换为两位整数
    var secondsDecimal = Math.round((seconds / 60) * 100);

    // 输出结果
    return [degrees, minutes, seconds, secondsDecimal];
}

/**
 * 度分秒转为数组
 *[度、分、秒，毫秒] -> 117°51′27″
 * @param {*} longitude 
 */
function parseDMSArray(longitude) {
    longitude = [117, 51, 27, 45];

    // 将度、分、秒整数部分和秒小数部分取两位整数进行拆解
    var degrees = longitude[0];
    var minutes = longitude[1];
    var seconds = longitude[2];
    var secondsDecimal = longitude[3];

    // 计算度分秒表示法中的秒钟部分
    // 先将秒的小数部分转换为小数形式
    var secondsFraction = secondsDecimal / 100;
    // 再将秒和秒的小数部分相加得到完整的秒钟部分
    seconds += secondsFraction;

    return degrees + '°' + minutes + '′' + seconds + '″';
}

/**
 * 将字符串转为16进制数组
 * @param {*} str 
 * @returns 
 */
function parseStringToHexArray(str) {
    const hexArray = [];

    for (let i = 0; i < str.length; i++) {
        const hex = str.charCodeAt(i).toString(16);
        hexArray.push(hex);
    }

    return hexArray;
}
/**
 * 将16进制数组转为字符串 如$YXB
 * 
 * @param {*} hexArray 
 * @returns 
 */
function parseHexArrayToString(hexArray) {
    let str = "";

    for (let i = 0; i < hexArray.length; i++) {
        const charCode = parseInt(hexArray[i], 16);
        const char = String.fromCharCode(charCode);
        str += char;
    }

    return str;
}

/**
 * 计算校验和
 * @param {*} data 
 * @returns 
 */
function calculateChecksum(data) {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
        checksum ^= data[i]; // 使用按位异或运算符进行累计计算
    }
    return checksum;
}

/**
 * 判断汉字是否合法
 * @param {*} str 
 * @returns 
 */
function isAllChineseCharacters(str) {
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code < 0x4E00 || code > 0x9FFF) {
            return false;
        }
    }
    return true;
}

/**
 * 求模值 根据数值，模数
 * @param {*} iValue  数值
 * @param {*} modInverse 模数 默认2000
 * @returns 
 */
function calculateMod(iValue, modInverse = 2000) {
    const modValue = iValue % modInverse;
    return modValue;
}

/**
 * 求数值，根据模值，模数
 * @param {*} modValue  模值
 * @param {*} modInverse 模数
 */
function calculateValueByMod(modValue, modInverse = 2000) {
    let year = null;

    for (let i = 0; i < modInverse; i++) {
        if ((i % modInverse) === modValue) {
            year = i;
            break;
        }
    }

    debugLogger.debug(year);
}


/**
 * 生成全局唯一的 INFO_UNIT_SEQUENCE_NUMBER
 */
function generateSequenceNumber() {

    const currentDate = new Date();

    let year = currentDate.getFullYear() - 2000;
    let month = currentDate.getMonth() + 1;
    let day = currentDate.getDate();
    let hour = currentDate.getDay();
    let minute = currentDate.getMinutes();
    let second = currentDate.getSeconds();

    let encoded = 0;
    encoded |= (year & 0x3F) << 26;
    encoded |= (month & 0x0F) << 22;
    encoded |= (day & 0x1F) << 17;
    encoded |= (hour & 0x1F) << 12;
    encoded |= (minute & 0x3F) << 6;
    encoded |= second & 0x3F;

    return encoded;

}

/**基于值随机浮动 */
function getRandomData(baseValue){
    let data= baseValue*(1-Math.random());
    return data;
}

/**
 * 返回随机值
 * @param {*} min 最小值 
 * @param {*} max 最大值
 * @returns 
 */
function getRandomValue(min,max){
    return Math.floor(Math.random()*(max- min + 1) +min); 
}

module.exports = {
    getLocalIP,
    parseTimeStampToArray,
    parseToTimestamp,
    parseTimeStampToArray1,
    parseToTimestamp1,
    parseTimeArray,
    parseTimeString,
    isAllChineseCharacters,
    parseDegrees,
    parseDegreesArray,
    parseDMS,
    parseDMSArray,
    calculateChecksum,
    calculateMod,
    calculateValueByMod,
    generateSequenceNumber,
    getRandomData,
    getRandomValue
}