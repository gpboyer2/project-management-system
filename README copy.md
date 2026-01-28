# CSSC Node View

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 9300 | Vite 开发服务器 |
| 后端 API | 9200 | 开发环境 / 9558 测试环境 |
| WebSocket | 9210 | 实时通信 |
| Chrome 调试 | 9222 | 开发调试 |

## 启动命令

### 前端 (client 目录)
```bash
npm run dev
# 访问: http://localhost:9300
```

### 后端 (server 目录)
```bash
# 开发环境
npm run dev
# API: http://localhost:9200

# 测试环境
NODE_ENV=test npm run dev
# API: http://localhost:9558

# 自定义端口
VITE_API_PORT=3000 npm run dev
# API: http://localhost:3000
```
