#!/bin/sh
# 开发环境启动脚本 - 同时启动前端和后端

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  启动 CSSC Node-View 开发环境${NC}"
echo -e "${BLUE}========================================${NC}"

# 创建必要的目录
mkdir -p /AlphaCoda/server/data
mkdir -p /AlphaCoda/logs

# 禁用浏览器自动打开
export BROWSER=none

# 启动后端
echo -e "${GREEN}[*] 启动后端服务...${NC}"
cd /AlphaCoda/server && pnpm dev &
SERVER_PID=$!

# 等待后端启动
sleep 3

# 启动前端（禁用自动打开浏览器）
echo -e "${GREEN}[*] 启动前端服务...${NC}"
cd /AlphaCoda/client && pnpm dev -- --host 0.0.0.0 &
CLIENT_PID=$!

echo -e "${GREEN}[*] 服务已启动${NC}"
echo -e "${GREEN}[*] 前端: http://localhost:9300${NC}"
echo -e "${GREEN}[*] 后端: http://localhost:9200/api${NC}"
echo -e "${GREEN}[*] 文档: http://localhost:9200/api-docs${NC}"

# 等待进程（忽略前端退出）
wait $SERVER_PID 2>/dev/null || true
wait $CLIENT_PID 2>/dev/null || true
