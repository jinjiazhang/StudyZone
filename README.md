# StudyZone（学习园地）

> 一款多邻国式的多学科游戏化学习平台 —— Web + 移动端 + 后台管理一体化。
>
> 核心理念：把学习拆成 30 秒一题的小步骤，用 XP / 连胜 / 联赛把学习变成日常游戏。

[![Node](https://img.shields.io/badge/node-%3E=20-brightgreen)](https://nodejs.org/) [![pnpm](https://img.shields.io/badge/pnpm-%3E=9-orange)](https://pnpm.io/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

---

## 项目一览

| 方向 | 描述 |
|---|---|
| 产品形态 | Web（学习者 + 营销页） / 移动端（iOS、Android） / 管理后台 / 后端 API / Worker |
| 技术栈 | Next.js 14 · React Native (Expo) · NestJS 10 · Prisma · PostgreSQL · Redis · BullMQ |
| 仓库形态 | pnpm + Turborepo Monorepo |
| 部署形态 | systemd + Nginx（默认） / Docker Compose（本地开发） |

> 想直接看完整架构？请阅读 [`docs/architecture/01-overview.md`](docs/architecture/01-overview.md)。

---

## 仓库结构

```
StudyZone/
├─ apps/
│  ├─ api/        # NestJS 后端主服务（端口 4000）
│  ├─ web/        # Next.js 14 Web 端（端口 3000）
│  ├─ mobile/     # React Native + Expo 移动端
│  ├─ admin/      # Vite + React 管理后台（端口 3001）
│  └─ worker/     # BullMQ Worker（联赛结算、推送、SRS 调度）
│
├─ packages/
│  ├─ shared-types/   # 端到端共享 TS 类型（DTO / 事件 / 枚举 / 题目结构）
│  ├─ shared-logic/   # 纯函数业务逻辑（XP / Streak / SRS / 判分 / 联赛升降级）
│  └─ api-client/     # 共享 HTTP 客户端 SDK
│
├─ infra/docker/      # 本地基础设施 Docker Compose（Postgres / Redis / MinIO）
├─ deploy/            # 生产部署模板（systemd unit / Nginx vhost）
├─ scripts/           # 开发与部署脚本（services:start, deploy:prod 等）
└─ docs/              # 完整设计 / 开发 / 部署文档（见下方索引）
```

---

## 快速开始

### 环境要求

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Docker Desktop**（用于本地 Postgres / Redis / MinIO）

### 一键启动

```bash
# 1. 克隆 & 安装依赖
git clone <repo-url> StudyZone && cd StudyZone
pnpm install

# 2. 配置环境变量
cp .env.example .env

# 3. 启动基础设施 + 初始化数据库
pnpm docker:up
pnpm db:migrate
pnpm db:import          # 导入课程内容

# 4. 启动所有服务（API + Web + Admin）
pnpm services:start
```

启动后可访问：

| 服务 | URL |
|---|---|
| Web 学习端 | http://localhost:3000 |
| Admin CMS | http://localhost:3001 |
| API 服务 | http://localhost:4000 |
| Swagger API 文档 | http://localhost:4000/docs |
| MinIO 控制台 | http://localhost:9001 （`minioadmin/minioadmin`）|

停止服务：

```bash
pnpm services:stop      # 同时关闭 docker
pnpm services:stop --keep-docker
```

> 完整的本地开发指南、环境变量说明与常见问题排查参见 [`docs/development/getting-started.md`](docs/development/getting-started.md)。

---

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 并行启动所有 app 的 dev 模式（前台） |
| `pnpm dev:api` / `dev:web` / `dev:mobile` / `dev:admin` | 单独启动某个 app |
| `pnpm services:start` | 后台启动 docker + api + web + admin（推荐） |
| `pnpm services:stop` | 关闭后台服务 |
| `pnpm build` | 全量构建 |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | 全量校验 |
| `pnpm db:migrate` | 运行 Prisma 迁移（开发） |
| `pnpm db:import` | 重新导入课程内容（保留用户数据） |
| `pnpm db:studio` | 启动 Prisma Studio |
| `pnpm docker:up` / `docker:down` / `docker:logs` | 控制本地基础设施容器 |
| `pnpm deploy:prod` | 生产环境一键部署（详见部署文档） |

---

## 文档导航

完整文档位于 [`docs/`](docs/) 目录：

### 架构与设计
- 📐 [架构总览](docs/architecture/01-overview.md) —— 模块划分、技术选型、部署拓扑
- 🗃️ [数据模型](docs/architecture/02-data-model.md) —— Prisma schema 总览与领域分组
- 🔌 [API 规范](docs/architecture/03-api.md) —— REST 资源、约定、错误码
- 🎯 [学习引擎](docs/architecture/04-learning-engine.md) —— 题型、判分、SRS
- 🎮 [游戏化机制](docs/architecture/05-gamification.md) —— XP / Streak / 联赛 / 任务

### 开发指南
- 🚀 [本地开发上手](docs/development/getting-started.md)
- 🔐 [环境变量说明](docs/development/environment.md)
- 🛠️ [开发工作流](docs/development/workflow.md) —— Monorepo / Turborepo / 提交规范
- 🧪 [测试指南](docs/development/testing.md)

### 部署运维
- 🚢 [生产部署](docs/deployment/production.md) —— systemd + Nginx 一键部署
- 🐳 [Docker 与本地基础设施](docs/deployment/docker.md)
- ⚙️ [systemd 服务管理](docs/deployment/systemd.md)
- 🌐 [Nginx 反向代理配置](docs/deployment/nginx.md)

### 应用与包
- [`apps/api`](docs/apps/api.md) · [`apps/web`](docs/apps/web.md) · [`apps/mobile`](docs/apps/mobile.md) · [`apps/admin`](docs/apps/admin.md) · [`apps/worker`](docs/apps/worker.md)
- [`packages/shared-types`](docs/packages/shared-types.md) · [`packages/shared-logic`](docs/packages/shared-logic.md) · [`packages/api-client`](docs/packages/api-client.md)

---

## 技术栈速查

| 层 | 技术 |
|---|---|
| Web | Next.js 14（App Router）· React 18 · Tailwind · TanStack Query · Zustand · Framer Motion |
| Mobile | React Native 0.81 · Expo SDK 54 · Expo Router · Reanimated · TanStack Query |
| Admin | Vite 5 · React 18 · React Router |
| API | NestJS 10 · Prisma 5 · class-validator · Argon2 · JWT (passport) · Swagger · BullMQ |
| Worker | NestJS · BullMQ · ioredis |
| Data | PostgreSQL 16 · Redis 7 · S3-兼容对象存储（MinIO 本地） |
| 共享 | pnpm Workspace · Turborepo · TypeScript 5.4 · ESLint · Prettier · Vitest |

---

## 贡献

1. 新功能必走特性分支 + PR；提交前请运行 `pnpm lint && pnpm typecheck && pnpm test`。
2. 涉及数据库的改动请生成 Prisma migration；不要直接改已发布的 migration 文件。
3. 跨模块逻辑（XP、Streak、判分、SRS）请放进 `packages/shared-logic`，确保前后端复用同一段纯函数。
4. 题目类型新增请同步更新 `packages/shared-types/src/exercise.ts` 与 `packages/shared-logic/src/judge.ts`。

---

## 许可

私有项目，仅供本仓库授权人员使用。
