
const {
    VITE_API_HOST,
    VITE_API_PORT,
    VITE_WS_HOST,
    VITE_WS_PORT
} = require("./etc/config")


const options = {
    definition: {
        openapi: '3.0.2',
        info: {
            title: 'API文档',
            version: '1.0.0'
        },
        servers: [
            {
                url: 'http://localhost:9200', // 本地服务
            },{
                url: `http://${VITE_API_HOST}:${VITE_API_PORT}`, // 服务
            }
        ]
    },
    apis: ['./routes/*.js'] // 包含所有定义的接口文件
};

module.exports = options;