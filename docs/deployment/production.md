# 生产部署

> 目标：在一台 Linux 主机上部署 StudyZone，对外通过 HTTPS 提供 Web、Admin、API。
>
> 部署形态：**systemd 管理 Node 进程 + Nginx 反向代理 + 静态 Admin**。Postgres / Redis 既可装在同机也可使用云数据库。

如果你是部署运维人员，**这一篇 + `nginx.md` + `systemd.md` 就够了**。

---

## 一、目标拓扑

```
                Internet (HTTPS)
                       │
                       ▼
                [   Nginx   ]
            (TLS 终结 / 反向代理 / 静态资源)
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   /api/ /docs    /admin/ (静态)       / (其它)
       │               │                │
       ▼               ▼                ▼
  studyzone-api   /var/www/admin     studyzone-web
  (systemd)       (Vite build 产物)  (systemd, Next.js)
       │
       └─────► PostgreSQL · Redis · S3/OSS
```

---

## 二、前置准备

### 服务器

- Linux（Ubuntu 22.04 / Debian 12 / CentOS 8 均可），至少 2C 4G。
- 已安装：
  - Node.js ≥ 20、pnpm ≥ 9（推荐 corepack）
  - systemd（系统自带）
  - Nginx
  - Docker（如果 Postgres/Redis 跑在本机）
  - Git

### 数据库

- PostgreSQL 16，账号已创建，`DATABASE_URL` 可写。
- Redis 7，可被本机访问。
- 对象存储（S3 / OSS / MinIO），bucket 已创建。

### 域名 + 证书

- DNS 已指向服务器公网 IP。
- TLS 证书路径已知（建议 [Let's Encrypt + certbot](https://certbot.eff.org/) 或云证书）。

---

## 三、部署流程总览

```
1. 拉代码到服务器                          git clone / pull
2. 准备 .env                               cp .env.production.example .env && vi .env
3. 安装依赖 + 跑迁移 + 构建 + 发布静态     pnpm deploy:prod
4. 安装 systemd 服务                       pnpm deploy:install-systemd
5. 安装 Nginx 配置                         pnpm deploy:install-nginx
6. 启动并验证                              systemctl start ...
```

下面逐步展开。

---

## 四、首次部署

### 4.1 拉代码

```bash
# 推荐放 /opt/studyzone
sudo mkdir -p /opt/studyzone && sudo chown $USER /opt/studyzone
git clone <repo-url> /opt/studyzone
cd /opt/studyzone
```

### 4.2 配置 `.env`

```bash
cp .env.production.example .env
vi .env
```

至少修改：

- `PUBLIC_ORIGIN=https://study.example.com`
- `DATABASE_URL` 指向真实 Postgres
- `REDIS_URL` 指向真实 Redis
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` —— 用 `openssl rand -hex 32` 生成
- `S3_*` 指向真实存储
- `NEXT_PUBLIC_API_URL=https://study.example.com`
- `VITE_API_URL=https://study.example.com`

更详细字段说明见 [`development/environment.md`](../development/environment.md)。

### 4.3 安装 / 构建 / 导入数据

```bash
pnpm deploy:prod
```

这条脚本会：

1. `pnpm install --frozen-lockfile`
2. `pnpm db:import`（首次运行；如果已经导过想跳过：加 `--skip-db`）
3. `pnpm build`（API + Web + Admin 全量）
4. `node scripts/deploy/publish-admin.mjs`（把 Admin 静态文件复制到 `ADMIN_DIST_DIR`，默认 `/var/www/studyzone-admin`）
5. （首次部署）`systemctl restart studyzone-api studyzone-web && systemctl reload nginx` —— 还没装服务时会失败，可加 `--skip-restart` 跳过。

> 推荐**首次**这样跑：`pnpm deploy:prod --skip-restart`，把服务装好后再正式启动。

### 4.4 安装 systemd 服务

```bash
sudo node scripts/deploy/install-systemd.mjs --restart
```

这会从 `deploy/*.template` 渲染并写入：

```
/etc/systemd/system/studyzone-api.service
/etc/systemd/system/studyzone-web.service
```

并执行：

```
systemctl daemon-reload
systemctl enable studyzone-api studyzone-web
systemctl restart studyzone-api studyzone-web   # --restart 才执行
```

可选参数：

- `--systemd-dir=/etc/systemd/system`
- `--pnpm=/usr/local/bin/pnpm`
- `--web-port=3000`

详见 [`systemd.md`](./systemd.md)。

### 4.5 安装 Nginx 配置

```bash
sudo node scripts/deploy/install-nginx.mjs \
  --domain=study.example.com \
  --ssl-cert=/etc/letsencrypt/live/study.example.com/fullchain.pem \
  --ssl-key=/etc/letsencrypt/live/study.example.com/privkey.pem \
  --reload
```

这会从 `deploy/nginx.studyzone.conf.template` 渲染并写入：

```
/etc/nginx/sites-available/studyzone
/etc/nginx/sites-enabled/studyzone   # 软链
```

并执行：

```
nginx -t                  # 校验配置
systemctl reload nginx    # --reload 才执行
```

可选参数：

- `--site-name=studyzone`
- `--admin-base=/admin`
- `--admin-dist-dir=/var/www/studyzone-admin`
- `--api-port=4000`、`--web-port=3000`
- `--disable-default`（删掉 nginx 默认 site）

详见 [`nginx.md`](./nginx.md)。

### 4.6 验证

```bash
curl -I https://study.example.com/health        # 200
curl -I https://study.example.com/              # Web SSR
curl -I https://study.example.com/admin/        # Admin SPA
curl -I https://study.example.com/api/v1/...    # API
```

systemd 状态：

```bash
systemctl status studyzone-api
systemctl status studyzone-web
journalctl -u studyzone-api -f
```

---

## 五、日常更新部署

```bash
cd /opt/studyzone
git pull
pnpm deploy:prod
```

`pnpm deploy:prod` 默认会跑迁移、build、发布 admin、重启服务、reload Nginx。

跳过某些步骤：

```bash
pnpm deploy:prod --skip-db        # 不导入数据
pnpm deploy:prod --skip-restart   # 只 build 不重启
```

> `db:import` 会清空课程内容并重新导入，不会清用户数据。生产改库结构时优先用 Prisma migration（`pnpm db:migrate deploy`），而不是 `db:import`。

---

## 六、回滚

### 代码回滚

```bash
git log --oneline -n 20            # 找到上一个 commit
git checkout <prev-commit>
pnpm deploy:prod --skip-db
```

### 数据库回滚

依赖 Prisma migration history：

```bash
pnpm --filter @studyzone/api prisma migrate resolve --rolled-back <migration_name>
```

> 风险大，强烈建议生产前在 staging 演练；破坏性改动请走两步迁移。

---

## 七、Worker（后台进程）

`apps/worker` 负责联赛结算 / 推送 / SRS 调度：

- 当前 `deploy:prod` 不会自动启动 worker；需要时手动加一个 systemd 服务（参考 `studyzone-api.service` 模板，把 `ExecStart` 改成 `pnpm --filter @studyzone/worker start`）。
- 手动结算联赛：`pnpm --filter @studyzone/worker settle:now`（用 `node scripts/with-root-env.mjs` 注入 env 自动完成）。

---

## 八、监控与日志

- API / Web 的 stdout / stderr 通过 systemd 写到：

  ```
  /opt/studyzone/.studyzone-prod/logs/api.log
  /opt/studyzone/.studyzone-prod/logs/web.log
  ```

- Nginx 在 `/var/log/nginx/{access,error}.log`。
- 推荐接入：
  - **Sentry** —— 前 / 后端异常
  - **Prometheus + Grafana** —— Postgres / Redis / Node 指标
  - **Loki** 或云日志服务 —— 集中检索

> 当前阶段先靠 systemd 自带日志即可；规模化后再上日志聚合。

---

## 九、常见问题

**Q: `systemctl start studyzone-api` 失败？**
看日志：`journalctl -u studyzone-api -n 200`。最常见是 `.env` 中 `DATABASE_URL` 不通；或 `pnpm` 路径不对（修 `--pnpm=...`）。

**Q: Nginx 报 `502`？**
说明上游（API 或 Web）没起来或绑错地址。检查 `API_HOST=127.0.0.1`、`WEB_PORT=3000`。

**Q: Admin 打开是 404？**
确认 `/var/www/studyzone-admin` 下有 `index.html`；如果发布路径变了，重跑 `node scripts/deploy/publish-admin.mjs`。

**Q: 部署后 token 全部失效？**
说明 `JWT_*_SECRET` 改了；这是预期行为。不要在不告知用户的情况下随意更改 secret。

---

## 十、相关文档

- [Docker 与本地基础设施](./docker.md)
- [systemd 服务管理](./systemd.md)
- [Nginx 反向代理](./nginx.md)
- [环境变量说明](../development/environment.md)
