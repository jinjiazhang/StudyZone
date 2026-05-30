# apps/api — 后端

> NestJS 10 + Prisma 5 + PostgreSQL + Redis。整个 StudyZone 的业务核心。
>
> 目录：[`apps/api/`](../../apps/api/)
> Swagger UI：[`http://localhost:4000/docs`](http://localhost:4000/docs)

---

## 一、启动

```bash
# 仓库根目录
pnpm docker:up
pnpm db:migrate
pnpm db:import
pnpm dev:api      # → http://localhost:4000
```

> 子目录运行：`pnpm --filter @studyzone/api dev`。注意 dev 脚本会通过 `scripts/with-root-env.mjs` 注入根目录 `.env`。

---

## 二、技术栈

| 组件 | 版本 |
|---|---|
| NestJS | 10 |
| Prisma | 5 |
| Passport + JWT | passport-jwt 4 |
| 哈希 | argon2 |
| 校验 | class-validator + class-transformer |
| 文档 | @nestjs/swagger |
| 任务 | @nestjs/event-emitter（进程内事件总线）+ BullMQ（跨进程） |
| 限流 | @nestjs/throttler |
| 测试 | Vitest |

---

## 三、目录结构

```
apps/api/src/
├─ main.ts              # bootstrap：CORS、全局 ValidationPipe、Swagger
├─ app.module.ts
├─ common/              # 全局过滤器 / 拦截器 / 装饰器
├─ infra/               # PrismaService、Redis、Config 封装
└─ modules/
   ├─ auth/             # 注册 / 登录 / 刷新令牌（JWT + Argon2）
   ├─ account/          # /me 接口
   ├─ content/          # 学科 / 课程 / 单元 / 关卡 / 题目
   ├─ learning/         # 关卡运行：组卷 / 判分 / 结算
   ├─ rewards/          # XP / Gem / 钱包写入唯一入口
   ├─ quests/           # 每日任务，订阅 lesson.completed
   ├─ social/           # 好友
   ├─ league/           # 周联赛分组、积分、加入
   └─ admin/            # 后台运营接口
└─ prisma/
   ├─ schema.prisma     # 数据模型唯一来源
   ├─ migrations/       # 已发布迁移
   ├─ import-data.ts    # 课程内容导入脚本
   └─ lesson-data/      # 课程源数据（subject/grade/unit/lesson 树）
```

---

## 四、关键设计

### 4.1 模块化单体（Modular Monolith）

每个 `modules/<domain>` 对应一个 Bounded Context，互不直接 import 数据库实现，统一通过 service 暴露接口。理由见 [`架构总览`](../architecture/01-overview.md#四系统总体架构)。

### 4.2 共享业务逻辑

XP 计算、判分、SRS、Streak、联赛升降级 —— 全部在 [`packages/shared-logic/`](../../packages/shared-logic/)，**前后端复用同一段纯函数**。

### 4.3 事件总线

跨模块解耦使用 NestJS `EventEmitter2`：

```ts
// learning.service.ts
this.eventEmitter.emit('learning.lesson.completed', {
  userId, lessonId, sessionId, xp, isPerfect,
});
```

| 事件 | 谁发 | 谁收 |
|---|---|---|
| `learning.lesson.completed` | Learning | Quests / Rewards / League |
| `auth.user.registered` | Auth | （初始化 Wallet / Streak / Quests）|

> Payload 类型在 `packages/shared-types/src/events.ts`。

### 4.4 题目存储

`Exercise.prompt` / `answer` 是 JSONB；TS 类型由 `Exercise.type` discriminator 决定（见 `packages/shared-types/src/exercise.ts`）。

---

## 五、常用命令

```bash
# 开发
pnpm dev:api

# 构建
pnpm --filter @studyzone/api build      # 输出到 apps/api/dist
pnpm --filter @studyzone/api start      # 跑构建产物

# 测试
pnpm --filter @studyzone/api test
pnpm --filter @studyzone/api typecheck
pnpm --filter @studyzone/api lint

# Prisma
pnpm db:migrate                          # 开发：生成并应用迁移
pnpm --filter @studyzone/api prisma generate
pnpm --filter @studyzone/api prisma migrate deploy   # 生产：仅应用
pnpm db:studio
```

---

## 六、Swagger

启动后访问 `/docs`：

- 顶部 "Authorize" 输入 Access Token 即可在线调试。
- 所有 controller 用 `@ApiTags` / `@ApiOperation` 注解维护描述。
- DTO 用 `class-validator` 装饰器自动生成 schema。

> 生产环境如果不想暴露 `/docs`，在 Nginx 层屏蔽即可，无需改代码。

---

## 七、相关文档

- [架构总览](../architecture/01-overview.md)
- [数据模型](../architecture/02-data-model.md)
- [API 规范](../architecture/03-api.md)
- [学习引擎](../architecture/04-learning-engine.md)
