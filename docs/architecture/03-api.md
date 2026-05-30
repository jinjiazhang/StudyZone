# 03 — API 规范

> 后端运行时入口：`apps/api`，端口 `4000`。
> 启动后访问 [`http://localhost:4000/docs`](http://localhost:4000/docs) 查看 Swagger 自动文档（这是最权威的接口列表）。

本文档约定通用规范、稳定的资源命名、错误码、约定字段，**不**逐一描述每个端点（请以 Swagger / 源码为准）。

---

## 一、版本与基地址

| 环境 | Base URL |
|---|---|
| 本地 | `http://localhost:4000` |
| 生产 | `https://study.example.com`（由 Nginx 反代到内网 4000） |

所有业务接口都以 `/api/v1` 前缀。

```
GET  https://study.example.com/api/v1/me
```

健康检查：

```
GET  /health           # 后端是否就绪
```

Swagger UI：`/docs`（开发与内网环境开放，生产可在 Nginx 层屏蔽）。

---

## 二、约定

### 2.1 数据格式
- 所有 body 与响应均为 JSON（`Content-Type: application/json`）。
- 时间一律 ISO 8601 + UTC，例如 `2026-05-30T10:00:00.000Z`。
- 客户端展示由各端按 `User.timezone` 自行格式化。

### 2.2 鉴权

```
Authorization: Bearer <accessToken>
```

- Access Token 有效期由 `JWT_ACCESS_TTL`（默认 900 秒）决定。
- 过期后用 Refresh Token 调用 `POST /api/v1/auth/refresh` 换新。
- Swagger UI 顶部有 "Authorize" 按钮可直接粘贴 Access Token 调试。

### 2.3 分页

游标分页（推荐，避免深分页性能问题）：

```
GET /api/v1/.../list?cursor=<id>&limit=20
→ { items: [...], nextCursor: "abc" | null }
```

### 2.4 幂等

写操作（特别是支付、提交关卡）建议带 `Idempotency-Key` 头；服务端在该值过期前对相同 key 直接返回首次响应。

### 2.5 错误结构

```jsonc
{
  "code": "VALIDATION_FAILED",
  "message": "email must be a valid email address",
  "details": [
    { "field": "email", "constraint": "isEmail" }
  ]
}
```

| HTTP | 业务含义 |
|---|---|
| 400 | 请求参数 / 校验失败 |
| 401 | 未认证 / Token 失效 |
| 403 | 已认证但无权访问 |
| 404 | 资源不存在 |
| 409 | 业务冲突（如重复注册、并发写） |
| 422 | 业务规则不允许（如心数不足） |
| 429 | 触发限流（@nestjs/throttler） |
| 500 | 服务端异常 |

错误码（`code`）由各模块定义，统一以大写下划线，常见示例：

```
EMAIL_ALREADY_REGISTERED
INVALID_CREDENTIALS
TOKEN_EXPIRED
LESSON_LOCKED
NOT_ENOUGH_HEARTS
NOT_ENROLLED_IN_COURSE
```

> 全量错误码表会跟随接口 Swagger 自动维护，本文档不重复列出。

### 2.6 限流

- 默认全局策略：由 `@nestjs/throttler` 控制，不同路由可单独覆盖。
- 触发限流响应：HTTP 429 + `{ code: "RATE_LIMITED" }`。

---

## 三、核心资源（节选）

> 完整接口请看 Swagger。以下仅列出最稳定的契约，方便初次接入。

### 3.1 Auth

```
POST   /api/v1/auth/register          → 注册
POST   /api/v1/auth/login             → 登录
POST   /api/v1/auth/refresh           → 用 refreshToken 换新 access
POST   /api/v1/auth/logout            → 撤销当前 refreshToken
```

### 3.2 Account

```
GET    /api/v1/me                     → UserProfile
PATCH  /api/v1/me                     → 更新昵称 / 头像 / dailyGoalMinutes / 时区
```

### 3.3 Content

```
GET    /api/v1/subjects                       → 全部学科
GET    /api/v1/courses                        → 课程列表（按 fromLocale 过滤）
POST   /api/v1/courses/:id/enroll             → 选课
GET    /api/v1/courses/:id/tree               → 用户视角的单元/关卡地图
```

### 3.4 Learning

```
POST   /api/v1/lessons/:id/start              → 创建 LearningSession，返回题目队列
POST   /api/v1/sessions/:id/attempts          → 提交单题作答（可流式）
POST   /api/v1/sessions/:id/complete          → 关卡结算，返回 XP / streak / 升级动画
GET    /api/v1/sessions/:id                   → 查询会话状态（用于断线重连）
```

### 3.5 Rewards / Quests

```
GET    /api/v1/me/wallet                      → UserWallet
GET    /api/v1/me/xp/ledger                   → XP 流水
GET    /api/v1/me/quests/today                → 今日任务进度
```

### 3.6 Social / League

```
GET    /api/v1/friends                        → 好友列表
POST   /api/v1/friends/requests               → 发起好友请求
PATCH  /api/v1/friends/requests/:id           → 接受 / 拒绝

GET    /api/v1/leagues/me                     → 当前联赛分组 + 排名
GET    /api/v1/leagues/me/history             → LeagueHistory
```

---

## 四、共享 DTO

所有公开 DTO 与枚举集中维护在：

- [`packages/shared-types/src/dto.ts`](../../packages/shared-types/src/dto.ts) — 请求 / 响应 DTO
- [`packages/shared-types/src/enums.ts`](../../packages/shared-types/src/enums.ts) — 离散值枚举
- [`packages/shared-types/src/exercise.ts`](../../packages/shared-types/src/exercise.ts) — 题目 prompt / answer 结构（discriminated union）
- [`packages/shared-types/src/events.ts`](../../packages/shared-types/src/events.ts) — 内部事件总线 payload
- [`packages/shared-types/src/selectors.ts`](../../packages/shared-types/src/selectors.ts) — Prisma `select` 复用

> Web / Mobile / Admin 都通过 `@studyzone/shared-types` 引用同一份类型，**禁止在客户端重复定义业务接口的字段**。

---

## 五、客户端 SDK

`packages/api-client` 是一层薄薄的 fetch 封装：

- 自动注入 `Authorization` 头
- Refresh Token 失效时自动调用 `/auth/refresh`
- 错误响应自动抛出带 `code` 的错误对象
- 与 `@studyzone/shared-types` 共用 DTO，端到端类型安全

Web / Mobile / Admin 的网络层都基于它。

---

## 六、事件总线（内部）

后端跨模块解耦使用 NestJS `EventEmitter2`，事件名约定 `<domain>.<entity>.<action>`：

| 事件 | Payload | 消费者 |
|---|---|---|
| `learning.lesson.completed` | `{ userId, lessonId, sessionId, xp, isPerfect, ... }` | Quests（进度+1）/ Rewards（钱包记账）/ League（weeklyXp）/ 未来 Notification |
| `auth.user.registered` | `{ userId }` | 初始化 Wallet / Streak / Quests |
| `social.friendship.accepted` | `{ userId, friendId }` | 通知模块（待） |

> Payload 类型定义在 `shared-types/src/events.ts`，发布与订阅必须用相同 TS 类型。

---

## 七、WebSocket（计划中）

```
WSS /ws         鉴权握手（query 中带 access token 或首条消息 auth）
事件：
  league.rank.updated     联赛排名变化
  notification.new        新通知
  pk.invite / pk.move     好友 PK
```

> 当前版本未启用；规划中会在 League 与 Notification 模块上线时实装。

---

## 八、相关文档

- [01 - 架构总览](./01-overview.md)
- [02 - 数据模型](./02-data-model.md)
- [04 - 学习引擎](./04-learning-engine.md)
