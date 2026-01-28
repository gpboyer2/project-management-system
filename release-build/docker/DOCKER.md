# Docker 部署说明

## 目录结构

```
release-build/docker/
├── Dockerfile.dev              # 开发环境镜像
├── Dockerfile.prod             # 生产环境镜像
├── docker-compose.dev.yml      # 开发环境编排
├── docker-compose.prod.yml     # 生产环境编排
└── DOCKER.md                   # 本文档
```

## 快速开始

### 开发环境

```bash
# 启动开发环境（支持热重载）
docker-compose -f release-build/docker/docker-compose.dev.yml up -d

# 查看日志
docker logs -f cssc-node-view-dev

# 停止服务
docker-compose -f release-build/docker/docker-compose.dev.yml down
```

开发环境特点：
- 源码挂载到容器，修改代码自动重载
- 包含所有开发依赖
- 数据存储在 Docker Volume 中

### 生产环境

```bash
# 构建并启动生产环境
docker-compose -f release-build/docker/docker-compose.prod.yml up -d

# 查看日志
docker logs -f cssc-node-view-prod

# 停止服务
docker-compose -f release-build/docker/docker-compose.prod.yml down
```

生产环境特点：
- 使用 pkg 打包后端为独立可执行文件
- 前端构建产物直接复制
- 镜像体积小，启动快
- 包含健康检查

## 手动构建镜像

### 开发镜像

```bash
docker build -f release-build/docker/Dockerfile.dev -t cssc-node-view:dev .
```

### 生产镜像

```bash
# 构建当前代码
docker build -f release-build/docker/Dockerfile.prod -t cssc-node-view:latest .

# 构建指定 tag
docker build -f release-build/docker/Dockerfile.prod --build-arg GIT_TAG=v1.0.0 -t cssc-node-view:v1.0.0 .

# 构建指定 commit
docker build -f release-build/docker/Dockerfile.prod --build-arg GIT_COMMIT=abc123 -t cssc-node-view:abc123 .
```

## 运行容器

### 开发容器

```bash
docker run -d \
  --name cssc-node-view-dev \
  -p 9300:9300 \
  -p 9200:9200 \
  -p 9210:9210 \
  -v $(pwd)/client:/AlphaCoda/client \
  -v $(pwd)/server:/AlphaCoda/server \
  -v cssc-data:/AlphaCoda/server/data \
  -e NODE_ENV=development \
  cssc-node-view:dev
```

### 生产容器

```bash
docker run -d \
  --name cssc-node-view-prod \
  -p 9300:9300 \
  -p 9200:9200 \
  -p 9210:9210 \
  -v cssc-data:/AlphaCoda/server/data \
  -e NODE_ENV=production \
  --restart always \
  cssc-node-view:latest
```

## 端口说明

| 端口 | 服务 |
|------|------|
| 9300 | 前端 |
| 9200 | 后端 API |
| 9210 | WebSocket |

## 数据持久化

数据存储在 Docker Volume 中：

```bash
# 查看 volume
docker volume ls | grep cssc

# 备份数据
docker run --rm -v cssc-data:/data -v $(pwd):/backup alpine tar czf /backup/cssc-data-backup.tar.gz /data

# 恢复数据
docker run --rm -v cssc-data:/data -v $(pwd):/backup alpine tar xzf /backup/cssc-data-backup.tar.gz -C /
```

## 常用命令

```bash
# 查看运行中的容器
docker ps

# 进入容器
docker exec -it cssc-node-view-prod sh

# 查看容器日志
docker logs -f cssc-node-view-prod

# 重启容器
docker restart cssc-node-view-prod

# 删除容器
docker rm -f cssc-node-view-prod

# 删除镜像
docker rmi cssc-node-view:latest
```

## 镜像加速（国内用户推荐）

### npm 镜像加速

Dockerfile 已默认使用 npmmirror（淘宝）镜像源加速依赖下载。

如需更换其他镜像源：

```bash
# 使用淘宝镜像（默认）
docker build -f release-build/docker/Dockerfile.prod -t cssc-node-view:latest .

# 使用腾讯云镜像
docker build -f release-build/docker/Dockerfile.prod --build-arg MIRROR_URL=https://mirrors.cloud.tencent.com/npm/ -t cssc-node-view:latest .

# 使用华为云镜像
docker build -f release-build/docker/Dockerfile.prod --build-arg MIRROR_URL=https://repo.huaweicloud.com/repository/npm/ -t cssc-node-view:latest .
```

### Docker Hub 镜像加速

由于 node:22 基础镜像从 Docker Hub 拉取，建议配置 Docker Hub 镜像加速器。

**macOS / Windows（Docker Desktop）**：

1. 打开 Docker Desktop
2. 进入 Settings / Preferences
3. 选择 Docker Engine
4. 添加以下配置：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

5. 点击 Apply & Restart

**Linux（systemd）**：

编辑 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

然后重启 Docker：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

验证配置：

```bash
docker info | grep -A 5 "Registry Mirrors"
```

## GitHub Actions 自动构建

项目已配置 GitHub Actions 自动构建 Docker 镜像。

### 触发条件

| 事件 | 触发条件 | 是否推送 |
|------|----------|----------|
| 推送 tag | `v*.*.*` 格式（如 v1.0.0） | 是 |
| 推送分支 | master / main | 是 |
| Pull Request | 目标为 master / main | 否（仅测试构建） |
| 手动触发 | 在 GitHub Actions 页面点击运行 | 是 |

### 镜像地址

构建完成后，镜像推送到 GitHub Container Registry：

```
ghcr.io/你的用户名/cssc-node-view:latest
ghcr.io/你的用户名/cssc-node-view:v1.0.0
```

### 使用 GitHub 构建的镜像

**首次拉取需要登录**：

```bash
# 登录到 GitHub Container Registry
echo "你的GitHub_PAT" | docker login ghcr.io -u 你的用户名 --password-stdin

# 或使用 GitHub Token（需要在 GitHub Settings → Developer settings → Personal access tokens 生成）
```

**拉取并运行镜像**：

```bash
# 拉取镜像
docker pull ghcr.io/你的用户名/cssc-node-view:latest

# 运行容器
docker run -d \
  --name cssc-node-view-prod \
  -p 9300:9300 \
  -p 9200:9200 \
  -p 9210:9210 \
  -v cssc-data:/AlphaCoda/server/data \
  ghcr.io/你的用户名/cssc-node-view:latest
```

### 发布新版本

```bash
# 打 tag 并推送，自动触发构建
git tag v1.0.0
git push origin v1.0.0
```

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs cssc-node-view-prod

# 检查端口占用
netstat -tulpn | grep -E '9300|9200|9210'
```

### 数据问题

```bash
# 进入数据目录
docker run --rm -v cssc-data:/data -it alpine sh

# 检查数据库文件
ls -la /AlphaCoda/server/data/
```

### 健康检查失败

生产镜像包含健康检查，可以通过以下命令查看健康状态：

```bash
docker inspect --format='{{.State.Health.Status}}' cssc-node-view-prod
```
