# 01 — 架构总览

> 版本：v1.1 ｜ 更新日期：2026-05-30
> 这是 StudyZone 的顶层架构文档，所有其他设计文档都从这里展开。

---

## 一、产品定位与目标

**一句话定义**：StudyZone 是一款以"短时高频 + 游戏化激励"为核心交互的多学科学习平台，用户每天通过 5–15 分钟的关卡式练习持续积累技能。

**核心价值主张**

1. **低门槛高粘性**：把学习内容拆解为 30 秒一题的小步骤，配合连胜（Streak）、经验值（XP）、宝石（Gem）等机制提升留存。
2. **多学科可扩展**：底层"课程 → 单元 → 关卡 → 题目"框架与具体内容解耦，初期上线英语 / 中文 / 数学，后续按相同模型扩展。
3. **社交驱动**：好友、周联赛（League）、好友 PK 让学习从单机变成有竞争感的社区行为。
4. **全平台一致**：Web 端用于桌面学习与课程编辑，移动端聚焦碎片时间练习，数据与进度全平台同步。

**北极星指标**：DAU × 日均完成关卡数 × 7 日留存率。

**非目标（v1 不做）**：直播课、1v1 真人辅导、UGC 课程市场、本地缓存离线学习。

---

## 二、用户角色与核心闭环

| 角色 | 描述 | 关键场景 |
|---|---|---|
| 学习者（C 端核心） | 普通用户，注册后选择课程开始学习 | 每日打卡、闯关、复习、好友 PK、加入联赛 |
| 内容编辑（B 端） | 内部教研，制作课程内容 | 在 CMS 后台编辑课程、关卡、题目 |
| 运营 / 增长 | 运营人员 | 推送通知、活动配置、数据看板 |
| 管理员 | 平台管理者 | 用户管理、权限、风控、内容审核 |

**学习者核心闭环**

```
注册/登录 → 选择课程 → 进入学习地图（单元/关卡）
       ↓
   选择当前关卡 → 进入答题流 → 完成关卡获得 XP/宝石
       ↓
   更新连胜 → 触发周联赛排名变化 → 推送好友动态
       ↓
   次日推送提醒 → 回到 App 继续学习
```

---

## 三、领域模块（Bounded Context）

代码层面 `apps/api/src/modules/<domain>` 一个目录对应一个 Bounded Context：

| 模块 | 目录 | 职责 |
|---|---|---|
| **Auth** | `auth/` | 注册 / 登录 / 刷新令牌，JWT + Argon2 |
| **Account** | `account/` | `GET/PATCH /me`，账户基本信息 |
| **Content** | `content/` | 学科 / 课程 / 选课 / 单元 / 关卡 / 题目 |
| **Learning** | `learning/` | 关卡运行时、组卷、判分、结算 |
| **Rewards** | `rewards/` | XP / 宝石 / 钱包发放（被 Quests / Learning 复用） |
| **Quests** | `quests/` | 每日任务、监听 `learning.lesson.completed` |
| **Social** | `social/` | 好友、好友动态 |
| **League** | `league/` | 周联赛分组、积分、升降级 |
| **Admin** | `admin/` | 后台运营接口 |

> 当前阶段所有模块跑在同一个 NestJS 进程里（**模块化单体**）；未来按流量切分为微服务时，模块边界已经预留好。

---

## 四、系统总体架构

整体采用 **「模块化单体 → 渐进微服务」** 演进策略。

### 4.1 逻辑分层

```
┌────────────────────────────────────────────────────────────────────┐
│  客户端层                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐              │
│  │ Web (Next.js)│  │ Mobile (RN)  │  │ Admin CMS  │              │
│  └──────────────┘  └──────────────┘  └────────────┘              │
└────────────────────────────────────────────────────────────────────┘
                              │ HTTPS / WSS
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  接入层                                                            │
│   Nginx (反向代理 + TLS 终结 + 静态资源)                            │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  应用层（NestJS 模块化单体；可拆分为以下子域服务）                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ Auth/Acct│ │ Content  │ │ Learning │ │ Rewards  │ │ Quests │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │  Social  │ │  League  │ │  Admin   │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
└────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────┬───────┼────────┬──────────────┐
        ▼             ▼       ▼        ▼              ▼
┌──────────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Redis  │ │ MinIO/S3 │ │ BullMQ   │ │ Worker 进程  │
│ (主业务库)   │ │(缓存/  │ │(媒体)    │ │(任务队列)│ │(联赛/SRS/推送)│
│              │ │ 队列)  │ │          │ │          │ │              │
└──────────────┘ └────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### 4.2 关键架构决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 后端形态 | 模块化单体（NestJS Monorepo） | MVP 快、易维护；DDD 分包让未来拆分零成本 |
| Web 前端 | Next.js 14（App Router + RSC） | 营销页 SEO + 应用端共用一个 Repo |
| App 端 | React Native + Expo SDK 54 | 同一套 React 心智模型，业务逻辑可复用 `packages/shared-logic` |
| 后台 | Vite + React | 内部使用，无 SEO 需求，构建最简单 |
| ORM | Prisma | 类型安全，迁移工具好，与 `shared-types` 互补 |
| 数据库 | PostgreSQL 16 + Redis 7 | Postgres JSONB 支撑题目结构灵活性，Redis 兼做缓存/队列 |
| 异步任务 | BullMQ | 联赛结算、推送、SRS 调度，Redis 单依赖 |
| 鉴权 | JWT (Access) + Refresh Token | 行业标准，移动端友好 |
| 部署 | Linux + systemd + Nginx | 直接、可控、零额外依赖；本地用 Docker Compose |
| 多端代码共享 | pnpm + Turborepo | 类型与逻辑端到端复用 |

### 4.3 部署拓扑

**生产环境（单机示意 — 可水平扩展）**

```
   用户
    │
    ▼
[ Cloudflare / 云 WAF + CDN ]
    │
    ▼
┌──────────────────────────────────────────────────┐
│  云主机 (Linux)                                  │
│                                                  │
│  Nginx :443  ─── /api/  ──▶ studyzone-api:4000  │
│              │                (systemd)          │
│              ├── /admin/ ──▶ /var/www/admin/     │
│              │                (静态)             │
│              └── /     ───▶ studyzone-web:3000   │
│                              (systemd Next.js)   │
│                                                  │
│  Worker 进程 (systemd)  ── BullMQ ──▶ Redis      │
│                                                  │
│  PostgreSQL  Redis  MinIO  (本机或 RDS / Cloud) │
└──────────────────────────────────────────────────┘
```

详见 [`deployment/production.md`](../deployment/production.md)。

---

## 五、技术栈选型

### 5.1 客户端

**Web — Next.js 14**
- App Router + Server Components
- TanStack Query（服务端状态）
- Zustand（轻量客户端状态）
- Tailwind CSS
- Framer Motion（升级、连胜动画）
- Hanzi Writer（汉字描红动画）

**Mobile — React Native + Expo**
- Expo Router（与 Next.js 心智一致）
- React Native Reanimated 4 + Gesture Handler
- Expo Secure Store（token 持久化）
- Expo AV（题目音频播放）

**Admin — Vite + React**
- React Router 6
- TanStack Query
- 复用 `@studyzone/api-client`

### 5.2 服务端

| 组件 | 选型 | 说明 |
|---|---|---|
| 后端框架 | NestJS 10（TypeScript） | DDD 模块化，依赖注入 |
| ORM | Prisma 5 | 类型安全，迁移工具好 |
| API 风格 | REST + Swagger（自动文档） | 简单直接，适合移动端 |
| 鉴权 | passport-jwt + JWT + Refresh Token | 标准实践 |
| 校验 | class-validator + class-transformer | 与 NestJS Pipe 集成 |
| 任务队列 | BullMQ（Redis 驱动） | 联赛结算、推送、SRS |
| 事件总线 | NestJS EventEmitter（进程内） | 跨模块解耦，如 `learning.lesson.completed` |
| 限流 | @nestjs/throttler | API 级别限流 |
| 测试 | Vitest | 单测 + 模块测试 |

### 5.3 基础设施

| 类别 | 本地 | 生产 |
|---|---|---|
| 主数据库 | Postgres 16 (Docker) | RDS / 自管 Postgres 16 |
| 缓存 / 队列 | Redis 7 (Docker) | ElastiCache / 自管 Redis 7 |
| 对象存储 | MinIO (Docker) | AWS S3 / 阿里云 OSS |
| 反向代理 | 不需要 | Nginx |
| 进程管理 | `pnpm services:start`（裸进程） | systemd |
| TLS | 不需要 | Let's Encrypt / 云证书 |

---

## 六、数据流与生命周期

### 6.1 一次关卡的完整生命周期

```
Client                            API (NestJS)              EventBus
  │  GET /api/v1/lessons/:id/start │                            │
  │ ───────────────────────────────▶                            │
  │   Learning 模块组卷:                                        │
  │   · 抽题（按 SRS 权重 + 关卡顺序）                          │
  │   · 创建 LearningSession                                    │
  │ ◀── exercises + sessionId ─── │                            │
  │                                                              │
  │  POST /api/v1/sessions/:id/attempts (循环每题)              │
  │ ───────────────────────────────▶                            │
  │   shared-logic/judge.ts 判分                                │
  │   写入 ExerciseAttempt + 更新 SrsCard                       │
  │ ◀── { isCorrect, feedback } ── │                            │
  │                                                              │
  │  POST /api/v1/sessions/:id/complete                         │
  │ ───────────────────────────────▶                            │
  │   结算 XP / hearts / streak                                 │
  │   ───── emit ────▶ learning.lesson.completed ─────▶│
  │ ◀── 奖励 + 升级动画 payload ── │                            │
  │                                            ┌──消费──▶ Quests│
  │                                            │  · 任务进度+1 │
  │                                            ├──消费──▶ Reward│
  │                                            │  · 钱包记账   │
  │                                            └──消费──▶ League│
  │                                              · weekly_xp +=│
```

### 6.2 联赛周期（Worker）

- **加入**：用户首次产出 weekly XP 时，由 `LeagueService` 找到 / 创建合适分组（30 人一组）。
- **结算**：每周一 UTC 00:00，Worker 触发 `settle.ts`，将 `LeagueGroup` 标为 settled，写入 `LeagueHistory`，按规则升 / 降 / 留；下周首次加入时迁移。
- **手动结算**：`pnpm --filter @studyzone/worker settle:now`（开发与回滚用）。

详见 [`05-gamification.md`](./05-gamification.md)。

---

## 七、Monorepo 结构

```
studyzone/
├─ apps/
│  ├─ web/        # Next.js
│  ├─ mobile/     # RN + Expo
│  ├─ admin/      # Vite + React
│  ├─ api/        # NestJS（含 prisma/）
│  └─ worker/     # NestJS Standalone + BullMQ
│
├─ packages/
│  ├─ shared-types/   # DTO / 事件 / 枚举 / 题目结构（无 runtime）
│  ├─ shared-logic/   # XP / Streak / SRS / 判分 / 联赛（纯函数）
│  └─ api-client/     # HTTP 客户端 SDK（Web + Mobile + Admin 共用）
│
├─ infra/docker/      # 本地 Postgres / Redis / MinIO
├─ deploy/            # systemd unit + nginx vhost 模板
├─ scripts/           # 开发与部署脚本
└─ docs/              # 你正在读的文档
```

后端 `apps/api/src` 按模块再细分：

```
apps/api/src/
├─ main.ts              # 入口，挂 Swagger
├─ app.module.ts
├─ common/              # 全局过滤器 / 拦截器 / 装饰器
├─ infra/               # Prisma / Redis / 配置封装
└─ modules/
   ├─ auth/             ├─ controller / service / dto / guard
   ├─ account/
   ├─ content/
   ├─ learning/
   ├─ rewards/
   ├─ quests/
   ├─ social/
   ├─ league/
   └─ admin/
```

---

## 八、非功能性需求（NFR）

| 维度 | 目标 |
|---|---|
| 性能 | 关卡接口 P95 < 300ms；首屏 LCP < 2.5s（Web） |
| 可用性 | 99.9%（年度停机 < 9h） |
| 安全 | OWASP Top 10；HTTPS only；密码 Argon2；JWT 短期 + Refresh |
| 合规 | GDPR / 个保法预留；未成年人保护；内容审核 |
| 可观测 | 关键业务事件 + 请求级日志；后续接入 Prometheus / Sentry |
| 扩展性 | 服务无状态可水平扩展；Postgres 读写分离预留 |
| 国际化 | 文案 / 时区（用户级）/ 货币 多版本 |

---

## 九、演进路线图

按"先跑通主链路，再加深"的原则分四期。当前进度参见后续文档。

- **Phase 0** ✅ 基础设施搭建（Monorepo + Docker 本地栈 + CI 雏形）
- **Phase 1** ✅ MVP 主干：账户 / 课程 / 4 种题型 / 学习引擎 / XP / Streak / Web + Mobile 双端打通
- **Phase 2** 🟢 进行中：SRS / 好友 / 周联赛 / 推送 / 数据埋点
- **Phase 3** ⏳ 计划：订阅会员 / 宝石商店 / 第二个学科 / CMS / A/B 实验
- **Phase 4** ⏳ 规模化：微服务拆分 / 多区域 / AI 助教 / 离线模式

---

## 十、相关文档

- [02 - 数据模型](./02-data-model.md)
- [03 - API 规范](./03-api.md)
- [04 - 学习引擎](./04-learning-engine.md)
- [05 - 游戏化机制](./05-gamification.md)
