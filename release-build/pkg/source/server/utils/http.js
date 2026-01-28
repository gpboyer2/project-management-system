/**
 * HTTP工具函数
 * @fileoverview 封装HTTP GET和POST请求方法，简化HTTP调用
 * @author CSSC Node View
 * @version 1.0.0
 * @since 2025-11-28
 */

const http = require('http')
const log4js = require("../middleware/log4jsPlus")
const httpApiLogger = log4js.getLogger("httpApi")

const get = (url, cb, errCb, encoding = 'utf8') => {
    http.get(url, (res) => {
        const { status_code } = res
        res.setEncoding(encoding)
        let rawData = ''
        res.on('data', chunk => rawData += chunk)
        res.on('end', () => cb(status_code, rawData, res))
        res.on('error', (e) => errCb(e))
    })
}

const post = (host, port, path, data, options, cb) => {
    try {
        if (!options) {
            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        }
    
        const postData = JSON.stringify(data)
        
        options.hostname = host
        options.port = port
        options.path = path
        options.headers['Content-Length'] = postData.length
        
        const req = http.request(options, (res) => {
            let recStr = ''
            res.on('data', (chunk) => {
                recStr += chunk
            })
            res.on('end', () => {
                cb(res.status_code, recStr, res)
            })
        })
          
        req.write(postData)
        req.end()
    } catch(error) {
        httpApiLogger.error(`发送 post 发生错误`, error.message)
    }

}

module.exports = {
    get, 
    post
}

