#!/bin/sh
# 生产环境启动脚本 - 后端 API + 前端静态服务

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  启动 CSSC Node-View 生产环境${NC}"
echo -e "${BLUE}========================================${NC}"

# 创建必要的目录
mkdir -p /app/server/data
mkdir -p /app/logs

# 禁用浏览器自动打开
export BROWSER=none
export NODE_ENV=production
export BYPASS_AUTH=false

# 校验必需的环境变量
validate_required_env() {
    required_vars="$1"
    missing_vars=""

    for var in $required_vars; do
        eval "value=\$$var"
        if [ -z "$value" ]; then
            missing_vars="$missing_vars  - $var\n"
        fi
    done

    if [ -n "$missing_vars" ]; then
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}错误：Docker 容器缺少必需的环境变量${NC}"
        echo -e "${YELLOW}========================================${NC}"
        echo -e "${YELLOW}请确保配置以下变量：${NC}"
        printf "${YELLOW}%s${NC}" "$missing_vars"
        echo -e "${YELLOW}解决方法：${NC}"
        echo -e "${YELLOW}  通过 docker run -e 或 docker-compose.yml 设置${NC}"
        echo -e "${YELLOW}========================================${NC}"
        exit 1
    fi
}

# 执行校验
validate_required_env "VITE_API_BASE_URL VITE_FRONTEND_PORT"

# JWT_SECRET 校验：如果使用默认值则警告
if [ "$JWT_SECRET" = "CHANGE_ME_IN_PRODUCTION" ] || [ -z "$JWT_SECRET" ]; then
  echo -e "${YELLOW}[!] 警告：JWT_SECRET 使用默认值或未设置，请修改！${NC}"
fi

echo -e "${YELLOW}[*] 运行时配置：${NC}"
echo -e "${YELLOW}    VITE_API_BASE_URL=${VITE_API_BASE_URL}${NC}"
echo -e "${YELLOW}    VITE_WS_PORT=${VITE_WS_PORT}${NC}"
echo -e "${YELLOW}    VITE_WS_URL=${VITE_WS_URL}${NC}"
echo -e "${YELLOW}    VITE_FRONTEND_PORT=${VITE_FRONTEND_PORT}${NC}"

# 启动后端 API
echo -e "${GREEN}[*] 启动后端 API 服务...${NC}"
cd /app/server && NODE_ENV=production CONTAINER_MODE=true node server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "[*] 后端 PID: $SERVER_PID"

# 等待后端启动
sleep 3

# 启动前端静态服务（使用 http-server）
echo -e "${GREEN}[*] 启动前端静态服务...${NC}"
npx http-server /app/client/dist -p $VITE_FRONTEND_PORT --silent &
CLIENT_PID=$!

echo -e "${GREEN}[*] 服务已启动${NC}"
echo -e "${GREEN}[*] 前端: http://localhost:$VITE_FRONTEND_PORT${NC}"
echo -e "${GREEN}[*] 后端: http://localhost:9200/api${NC}"
echo -e "${GREEN}[*] 文档: http://localhost:9200/api-docs${NC}"

# 等待任意进程退出后，也退出另一个进程
shutdown() {
    echo "[*] 接收到关闭信号，正在停止服务..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

trap shutdown SIGTERM SIGINT

# 持续监控进程状态，如果有一个退出，则退出容器
while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "[*] 后端服务已停止，退出码: $(wait $SERVER_PID 2>/dev/null; echo $?)"
        echo "[*] 后端日志:"
        cat /tmp/server.log 2>/dev/null || true
        kill $CLIENT_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        echo "[*] 前端服务已停止"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done
