#!/bin/bash
echo ""

# 输出当前时间
date --date='0 days ago' "+%Y-%m-%d %H:%M:%S"
echo "Start ====="

# Node.js 和 npm 的绝对路径
NODE="/root/.nvm/versions/node/v20.18.0/bin/node"
NPM="/root/.nvm/versions/node/v20.18.0/bin/npm"
PNPM="/usr/local/bin/pnpm"
GIT="/usr/bin/git"
PM2="/usr/local/bin/pm2"

# git分支名称
branch="master"

# 项目路径
projectPath="/www/wwwroot/cssc-node-view"

# 设置 Git 安全目录
$GIT config --global --add safe.directory $projectPath
$GIT config --global --add safe.directory '*'

# git 仓库地址
gitHttp="https://gitee.com/alphasinger/cssc-node-view.git"

# 获得超级权限
sudo su -
cd $projectPath
chown -R root:root .

## fatal: $HOME not set
## 设置 HOME 环境变量
# export HOME="/home/ubuntu"
export HOME="/root"
echo "HOME: $HOME" 2>&1

echo "当前用户是: $(whoami)" 2>&1
echo "当前用户信息: $(id)" 2>&1

## 宝塔webhook自动化打包Vue项目时，npm不生效
## https://www.bt.cn/bbs/thread-43734-1-1.html
## 命令 which npm 查看安装路径
## 还不行就为单独用户单独安装nvm/node/npm
# export NPM="/home/ubuntu/.nvm/versions/node/v16.16.0/bin/"
# PATH=$PATH:$NPM
# export $PATH
echo $NPM 2>&1

# 打印 NodeJs PATH 
# nvm -v 2>&1
# node -v 2>&1
# npm -v 2>&1
# pnpm -v 2>&1

echo "当前目录: $(pwd)"
echo "拉取最新的项目文件 $gitHttp"
$GIT reset --hard origin/$branch 2>&1
$GIT pull 2>&1

# 执行构建脚本
cd $projectPath
./prepare-dev.sh 2>&1
# npm run prepare:prod 2>&1
# npm run pm2:prod 2>&1

# 重启 PM2 进程
$PM2 restart cssc-node-view 2>&1
# pm2 list 2>&1
# NODE_ENV=production pm2 start server/server.js --name cssc-node-view 2>&1

date --date='0 days ago' "+%Y-%m-%d %H:%M:%S"
echo "End"

exit 0
