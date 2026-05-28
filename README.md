# StudyZone · 学习园地

一个游戏化、多学科的学习平台，灵感来自多邻国式的关卡 + XP + 连胜机制，原创实现。
当前仓库包含 Web、移动端、Admin CMS 与后端 API 的完整骨架，开箱即可跑通"注册 → 选课 → 闯关 → 获得 XP → 上联赛榜"的完整闭环。

> 配套设计文档：[`01-架构设计.md`](./01-架构设计.md)

---

## 仓库形态

pnpm + Turborepo Monorepo：

```
studyzone/
├─ apps/
│  ├─ api/      NestJS + Prisma 后端（PostgreSQL）
│  ├─ web/      Next.js 14 (App Router) Web 端
│  ├─ mobile/   Expo + React Native 移动端
│  ├─ admin/    Vite + React Admin CMS
│  └─ worker/   预留 BullMQ Worker
├─ packages/
│  ├─ shared-types/    端到端 TypeScript 类型
│  ├─ shared-logic/    XP / SRS / 连胜 / 题目判分 纯函数
│  ├─ api-client/      Typed API SDK
│  └─ config/          共享配置（占位）
├─ infra/docker/       本地 Postgres + Redis + MinIO
└─ docs/               扩展文档（占位）
```

---

## 准备环境

需要：

- Node.js ≥ 20
- pnpm ≥ 9（`npm i -g pnpm@9`）
- Docker Desktop（用于本地 Postgres / Redis / MinIO）

可选：

- iOS / Android 模拟器（运行移动端）

---

## 一键启动（推荐）

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地基础设施
pnpm docker:up

# 3. 复制环境变量
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local

# 4. 初始化数据库 + 导入课程数据（英语 + 数学 + 语文，含示例账号）
pnpm db:migrate
pnpm db:import

# 5. 启动全部应用（API + Web + Admin）
pnpm dev
```

启动后：

| 服务 | URL | 说明 |
|---|---|---|
| Web 学习者端 | http://localhost:3000 | 主应用 |
| Admin CMS | http://localhost:3001 | 课程管理 |
| API | http://localhost:4000 | NestJS |
| API 文档 | http://localhost:4000/docs | Swagger |
| Postgres | localhost:5432 | studyzone / studyzone_dev |
| Redis | localhost:6379 | |
| MinIO 控制台 | http://localhost:9001 | minioadmin / minioadmin |

**示例账号**：`demo@studyzone.dev` / `studyzone`（已自动选课英语 + 数学 + 语文）。

---

## 单独启动某个应用

```bash
pnpm dev:api      # 仅后端
pnpm dev:web      # 仅 Web
pnpm dev:admin    # 仅 Admin
pnpm dev:mobile   # 仅移动端（Expo Dev Tools）
```

移动端额外步骤（在真机上测试时）：

```bash
cp apps/mobile/.env.local.example apps/mobile/.env.local
# 把 EXPO_PUBLIC_API_URL 改成你电脑的局域网 IP，例如 http://192.168.1.10:4000
# （macOS: ipconfig getifaddr en0；Linux: hostname -I）
```

模拟器跑可直接用默认的 `localhost`，无需改任何东西。

## 后台起停本地服务

```bash
pnpm services:start   # 后台启动 Docker 基础设施 + API + Web + Admin
pnpm services:stop    # 停止后台服务，并关闭 Docker compose
```

日志与 pid 会写入 `.studyzone-dev/`。如果只想保留 Docker 基础设施，可用
`pnpm services:stop -- --keep-docker`。

---

## 数据库工作流

```bash
pnpm db:migrate          # 应用 migrations
pnpm db:import           # 清空课程内容和学习状态后重新导入仓库课程数据
pnpm db:studio           # 打开 Prisma Studio 可视化数据库
```

修改 `apps/api/prisma/schema.prisma` 后：

```bash
pnpm --filter @studyzone/api prisma migrate dev --name your_change
```

---

## 主要功能闭环

完成 MVP 路径（按场景验证）：

1. **注册 / 登录** — `apps/web/src/app/(login|register)/page.tsx` → `POST /api/v1/auth/register`
2. **选课** — `/learn` 列表 → `POST /api/v1/courses/:id/enroll`
3. **技能树** — `/learn/courses/:id` → `GET /api/v1/courses/:id/tree`
4. **关卡** — `/learn/lessons/:id` → `POST /api/v1/lessons/:id/start` + `POST /sessions/:id/attempts`
5. **结算** — `/learn/lessons/:id/complete` → `POST /api/v1/sessions/:id/complete`
   - 同步：XP / 宝石写入钱包、连胜更新、SRS 卡更新、`learning.lesson.completed` 事件
   - 异步监听：`GamificationListener` 推动每日任务进度、联赛周榜
6. **联赛** — `/league` → `GET /api/v1/leagues/me`
7. **个人主页** — `/profile` → `GET /api/v1/me` + `GET /api/v1/quests/daily`

---

## 测试

```bash
pnpm test             # 跨包测试
pnpm typecheck        # TS 类型检查
pnpm lint             # ESLint
```

`packages/shared-logic` 是首要的测试目标（XP / 连胜 / SRS 等纯函数）。建议补：
- `xp.test.ts`
- `streak.test.ts`
- `judge.test.ts`

---

## 部署（推荐生产架构）

- API + Worker：容器化部署到 Kubernetes（EKS / ACK），数据库用托管 Postgres
- Web：Vercel 或自托管 Next.js
- 移动端：EAS Build → 上架 App Store / Google Play
- Admin：可与 Web 同源部署在 `admin.studyzone.app`

详见 `01-架构设计.md` 第 4 章「系统总体架构」。

### 单机 Nginx 部署

仓库内提供了单机部署模板，适合一台 Ubuntu 服务器上运行 Docker 基础设施、API、Next.js Web，并由 Nginx 统一提供 HTTPS 入口。

1. 准备服务器环境：Node.js 20、pnpm 9、Docker、Nginx。
2. 复制 `.env.production.example` 为 `.env`，填写域名、JWT secret、数据库、Redis 和公开访问地址。
3. 启动基础设施并初始化数据：

```bash
pnpm docker:up
pnpm db:migrate
pnpm db:import
```

4. 安装 systemd 服务：

```bash
pnpm deploy:install-systemd -- --restart
```

5. 安装 Nginx 站点配置：

```bash
pnpm deploy:install-nginx -- \
  --domain=study.example.com \
  --ssl-cert=/etc/nginx/ssl/study.example.com/fullchain.crt \
  --ssl-key=/etc/nginx/ssl/study.example.com/private.key \
  --disable-default \
  --reload
```

6. 后续更新代码后运行：

```bash
pnpm deploy:prod
```

默认约定：

- API 只监听 `127.0.0.1:4000`
- Web 只监听 `127.0.0.1:3000`
- Nginx 监听 `80/443`
- Admin 发布到 `/var/www/studyzone-admin` 并通过 `/admin/` 访问

---

## 路线图

| 阶段 | 工作 |
|---|---|
| Phase 0 ✅ | Monorepo、基础设施、共享包 |
| Phase 1 ✅ | API 主链路 + 双学科种子 + Web/移动/Admin 骨架 |
| Phase 2 | 听力题音频、推送通知、好友 PK、Worker 间隔复习推送 |
| Phase 3 | 订阅会员、宝石商店、多语言 i18n |
| Phase 4 | 微服务拆分、AI 助教、离线模式 |

---

## 协议

MIT (本仓库代码) — 课程文案与素材请自行原创或合规授权后再公开发行。
