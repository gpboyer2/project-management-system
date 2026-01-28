# Gitee Go 流水线配置说明

## 文件说明

- `MasterPipeline.yml` - 主分支流水线配置，推送到 master/main 分支时触发
- `BranchPipeline.yml` - 其他分支流水线配置（可选）
- `PRPipeline.yml` - PR 流水线配置（可选）

## 配置步骤

### 1. 开通 Gitee Go

1. 访问你的 Gitee 仓库页面
2. 点击"流水线"或"Gitee Go"菜单
3. 选择"开通流水线"
4. 选择"自定义流水线"或"从模版创建"

### 2. 配置镜像构建任务

Gitee Go 主要通过**网页端**配置，YAML 文件仅作参考。

在网页端添加以下任务：

#### 任务1：镜像构建

| 配置项 | 值 |
|--------|-----|
| 任务名称 | docker-build |
| 任务类型 | 镜像构建 |
| 仓库地址 | registry.cn-hangzhou.aliyuncs.com （或其他镜像仓库） |
| 仓库用户名 | 你的镜像仓库用户名 |
| 仓库密码 | 你的镜像仓库密码 |
| 镜像 Tag | ${GITEE_PIPELINE_BUILD_NUMBER} |
| Dockerfile 路径 | release-build/docker/Dockerfile.prod |
| Context | . |
| 构建参数 | NODE_VERSION=22 MIRROR_URL=https://registry.npmmirror.com |
| Docker 缓存 | 开启 |

### 3. 常用镜像仓库

| 仓库 | 地址 |
|------|------|
| 阿里云（杭州） | registry.cn-hangzhou.aliyuncs.com |
| 阿里云（北京） | registry.cn-beijing.aliyuncs.com |
| 阿里云（上海） | registry.cn-shanghai.aliyuncs.com |
| 阿里云（广州） | registry.cn-guangzhou.aliyuncs.com |
| 腾讯云 | ccr.ccs.tencentyun.com |
| Docker Hub | docker.io |

### 4. 使用本地构建脚本

如果不使用 Gitee Go，可以使用以下脚本本地构建：

```bash
# 本地构建（不推送）
./scripts/release-docker-local.sh

# 本地构建并推送到阿里云
./scripts/release-docker-local.sh -v 1.0.0 -r registry.cn-hangzhou.aliyuncs.com/你的命名空间 --push

# Gitee 仓库发布
./scripts/release-docker-gitee.sh -v 1.0.0 --push-tag
```

## 参考文档

- [Gitee Go 官方文档](https://help.gitee.com/gitee-go/get-started-in-3-steps)
- [镜像构建配置](https://help.gitee.com/enterprise/pipeline/plugin/image-compile)
