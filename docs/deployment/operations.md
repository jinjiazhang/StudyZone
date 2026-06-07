# 服务部署 / 更新 / 导入数据命令

> 这是一份面向运维执行的简洁命令清单。默认在服务器仓库根目录执行，例如 `/opt/studyzone`。

## 0. 前置约定

- 生产服务由 `systemd` 管理：`studyzone-api`、`studyzone-web`、`studyzone-worker`
- 对外入口由 Nginx 管理，Admin 构建产物发布到 `ADMIN_DIST_DIR`，默认 `/var/www/studyzone-admin`
- `.env` 放在仓库根目录，至少配置数据库、Redis、JWT、S3、公开访问域名

```bash
cd /opt/studyzone
cp .env.production.example .env
vi .env
```

必要字段：

```bash
PUBLIC_ORIGIN=https://study.example.com
DATABASE_URL=postgresql://user:password@host:5432/studyzone?schema=public
REDIS_URL=redis://host:6379
JWT_ACCESS_SECRET=<openssl-rand-hex-32>
JWT_REFRESH_SECRET=<openssl-rand-hex-32>
NEXT_PUBLIC_API_URL=https://study.example.com
VITE_API_URL=https://study.example.com
S3_ENDPOINT=<s3-endpoint>
S3_BUCKET=<bucket>
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
```

生成密钥：

```bash
openssl rand -hex 32
```

## 1. 首次部署

### 1.1 拉代码

```bash
sudo mkdir -p /opt/studyzone
sudo chown "$USER" /opt/studyzone
git clone <repo-url> /opt/studyzone
cd /opt/studyzone
```

### 1.2 安装依赖

```bash
corepack enable
pnpm install --frozen-lockfile
```

### 1.3 初始化数据库结构

```bash
pnpm --filter @studyzone/api prisma migrate deploy
```

### 1.4 导入课程数据

```bash
pnpm db:import
```

导入脚本会从 `apps/api/prisma/lesson-data` 更新课程、单元、课时和练习，并保留已有学习进度、报名、Session、Attempt、SRS 等用户状态；同时会创建或更新演示账号：

```text
tiantianzh@qq.com / 00000000
```

### 1.5 构建并发布

```bash
pnpm build
node scripts/deploy/publish-admin.mjs
```

也可以直接使用一键脚本：

```bash
pnpm deploy:prod --skip-restart
```

> 首次部署时服务和 Nginx 可能还没安装，所以建议先加 `--skip-restart`。

### 1.6 安装并启动 systemd 服务

```bash
sudo node scripts/deploy/install-systemd.mjs --restart
```

检查状态：

```bash
systemctl status studyzone-api
systemctl status studyzone-web
systemctl status studyzone-worker
```

### 1.7 安装并重载 Nginx

```bash
sudo node scripts/deploy/install-nginx.mjs \
  --domain=study.example.com \
  --ssl-cert=/etc/letsencrypt/live/study.example.com/fullchain.pem \
  --ssl-key=/etc/letsencrypt/live/study.example.com/privkey.pem \
  --reload
```

检查配置：

```bash
nginx -t
systemctl status nginx
```

### 1.8 验证

```bash
curl -I https://study.example.com/health
curl -I https://study.example.com/
curl -I https://study.example.com/admin/
curl -I https://study.example.com/docs
```

## 2. 日常更新

常规更新：

```bash
cd /opt/studyzone
git pull
pnpm --filter @studyzone/api prisma migrate deploy
pnpm deploy:prod
```

如果本次只是代码更新，不需要重新导入课程数据：

```bash
cd /opt/studyzone
git pull
pnpm --filter @studyzone/api prisma migrate deploy
pnpm deploy:prod --skip-db
```

如果只想构建发布，暂不重启服务：

```bash
pnpm deploy:prod --skip-db --skip-restart
```

手动重启：

```bash
sudo systemctl restart studyzone-api studyzone-web studyzone-worker
sudo systemctl reload nginx
```

## 3. 单独导入数据

课程数据修改后，只导入数据：

```bash
cd /opt/studyzone
pnpm db:import
sudo systemctl restart studyzone-api studyzone-web studyzone-worker
```

本地开发环境从零重置基础设施和课程数据：

```bash
docker compose -f infra/docker/docker-compose.yml down -v
pnpm docker:up
pnpm db:migrate
pnpm db:import
```

## 4. 常用查看命令

## 4. Expo / Mobile 开发服务

Expo Dev Server 用于移动端本地调试，不属于生产 `systemd + Nginx` 部署链路；生产发布移动端时后续走 EAS Build / App Store / 应用商店。

启动前先确保 API 可被手机访问：

```bash
pnpm services:start
```

同一局域网真机或模拟器：

```bash
pnpm dev:mobile
```

跨网络或扫码连接不稳定时：

```bash
pnpm --filter @studyzone/mobile dev:tunnel
```

iOS / Android 模拟器：

```bash
pnpm --filter @studyzone/mobile ios
pnpm --filter @studyzone/mobile android
```

浏览器调试 RN-Web：

```bash
pnpm --filter @studyzone/mobile web
```

常用操作：

```text
r  reload
i  open iOS simulator
a  open Android emulator
w  open web
q  quit
```

> 手机访问本机 API 时，`NEXT_PUBLIC_API_URL` / `VITE_API_URL` 可继续指向 `localhost`，但移动端需要使用手机可访问的地址。必要时把 `.env` 中 `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_ASSET_BASE_URL` 改成电脑局域网 IP 或 HTTPS 域名。

## 5. 常用查看命令

查看服务状态：

```bash
systemctl status studyzone-api
systemctl status studyzone-web
systemctl status studyzone-worker
systemctl status nginx
```

查看日志：

```bash
journalctl -u studyzone-api -f
journalctl -u studyzone-web -f
journalctl -u studyzone-worker -f
journalctl -u nginx -f
```

查看端口：

```bash
ss -lntp | grep -E ':3000|:4000|:80|:443'
```

查看 Docker 基础设施：

```bash
pnpm docker:logs
docker ps
```

## 6. 回滚

代码回滚到上一个稳定提交：

```bash
cd /opt/studyzone
git log --oneline -n 20
git checkout <commit-sha>
pnpm --filter @studyzone/api prisma migrate deploy
pnpm deploy:prod --skip-db
```

如果需要恢复课程内容到旧版本，切回对应提交后重新导入：

```bash
pnpm db:import
sudo systemctl restart studyzone-api studyzone-web studyzone-worker
```

## 7. 相关详细文档

- `docs/deployment/production.md`：完整生产部署说明
- `docs/deployment/systemd.md`：systemd 服务模板和参数
- `docs/deployment/nginx.md`：Nginx 与 HTTPS 配置
- `docs/deployment/docker.md`：本地 Postgres / Redis / MinIO
- `docs/apps/mobile.md`：Expo 移动端启动、调试、构建说明
- `apps/api/prisma/lesson-data/README.md`：课程数据目录结构
