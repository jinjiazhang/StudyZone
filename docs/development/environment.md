# 环境变量说明

> 仓库通过单一根目录 `.env` 文件维护配置，所有 app 在 dev / prod 模式下统一从这里读取。
>
> 模板：[`.env.example`](../../.env.example)（开发） / [`.env.production.example`](../../.env.production.example)（生产）。

---

## 一、加载机制

- 服务端（API / Worker）：通过 `scripts/with-root-env.mjs` 注入到子进程的环境，再由 NestJS `ConfigService` 读取。注意：**只设置仓库根 `.env`，不在 app 子目录维护单独 env**。
- Web（Next.js）：仅 `NEXT_PUBLIC_*` 前缀的变量会被打包进客户端代码。
- Mobile（Expo）：仅 `EXPO_PUBLIC_*` 前缀的变量在 client 可见。
- Admin（Vite）：仅 `VITE_*` 前缀变量在 client 可见。

> 客户端只能感知"以特定前缀公开的"环境变量，确保 secrets 不会被打包进 bundle。

---

## 二、字段一览

### 数据库

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串（带 schema 参数） | `postgresql://studyzone:studyzone_dev@localhost:5432/studyzone?schema=public` |

> 生产建议用专用账号 + 独立 schema；可加 `?connection_limit=10&pool_timeout=10` 调整连接池。

### Redis

| 变量 | 说明 | 默认值 |
|---|---|---|
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |

### JWT

| 变量 | 说明 |
|---|---|
| `JWT_ACCESS_SECRET` | Access Token 签名密钥（≥ 32 字节随机） |
| `JWT_REFRESH_SECRET` | Refresh Token 签名密钥（与 access 不同） |
| `JWT_ACCESS_TTL` | Access Token 秒数（默认 900 = 15 分钟） |
| `JWT_REFRESH_TTL` | Refresh Token 秒数（默认 2592000 = 30 天） |

> 生产环境**必须**改成随机长串。生成：`openssl rand -hex 32`。

### API

| 变量 | 说明 | 默认值 |
|---|---|---|
| `API_PORT` | NestJS 监听端口 | `4000` |
| `API_HOST` | 监听地址（生产请用 `127.0.0.1`，由 Nginx 反代） | `0.0.0.0` |
| `API_PUBLIC_URL` | 公网可访问 URL（用于回调 / 邮件链接） | `http://localhost:4000` |

### 客户端公开变量

| 变量 | 应用 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Web | 浏览器请求的 API base URL |
| `EXPO_PUBLIC_ASSET_BASE_URL` | Mobile | 题目 / 头像等媒体的根 URL |
| `VITE_API_URL` | Admin | Admin 后台请求的 API base URL |
| `VITE_ADMIN_BASE` | Admin | Admin 静态资源 path（默认 `/admin`） |

### 对象存储（S3 兼容，本地用 MinIO）

| 变量 | 默认值（开发） |
|---|---|
| `S3_ENDPOINT` | `http://localhost:9000` |
| `S3_REGION` | `us-east-1` |
| `S3_BUCKET` | `studyzone` |
| `S3_ACCESS_KEY` | `minioadmin` |
| `S3_SECRET_KEY` | `minioadmin` |

> 生产指向真实 S3 / OSS，凭证由 IAM / RAM 子账号管理。

### OAuth（可选）

| 变量 | 说明 |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登录 |

> 待接入：`APPLE_*`、`WECHAT_*` 等。

### 部署专用（仅 production）

| 变量 | 说明 |
|---|---|
| `PUBLIC_ORIGIN` | 公网入口 URL，例如 `https://study.example.com` |
| `WEB_PORT` | Next.js 监听端口（默认 3000） |
| `ADMIN_DIST_DIR` | Admin 静态文件路径（Nginx alias 指向，默认 `/var/www/studyzone-admin`） |
| `SSL_CERTIFICATE` / `SSL_CERTIFICATE_KEY` | TLS 证书路径（也可通过 CLI 参数传） |

---

## 三、开发 vs 生产差异（速查）

| 维度 | 开发 | 生产 |
|---|---|---|
| `API_HOST` | `0.0.0.0` | `127.0.0.1` |
| `API_PUBLIC_URL` | `http://localhost:4000` | `https://study.example.com` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://study.example.com`（同 origin，Nginx 代理 `/api/`） |
| `S3_ENDPOINT` | `http://localhost:9000` | 云对象存储 endpoint |
| `JWT_*_SECRET` | 任意 | 必须随机长串 |

---

## 四、安全约定

- `.env` **不进入 Git**（已在 `.gitignore`）。
- 共享给同事时通过密管系统 / 1Password / 加密压缩，**不要发到群里**。
- 任何 secret 泄露：重新生成、撤销 refresh token（或清空 `RefreshToken` 表）。
- 生产环境 secrets 推荐用云厂商的 KMS 或 Vault 注入，而非明文 `.env`。

---

## 五、相关文档

- [本地开发上手](./getting-started.md)
- [生产部署](../deployment/production.md)
