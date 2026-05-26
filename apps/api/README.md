# @studyzone/api

NestJS + Prisma + PostgreSQL.

## 启动

```bash
# 在仓库根目录
pnpm install
pnpm docker:up        # 启动 Postgres / Redis / MinIO
cp .env.example .env
pnpm db:migrate       # 运行 Prisma 迁移
pnpm db:seed          # 写入种子数据
pnpm dev:api          # 启动 API（端口 4000）
```

## 模块

| 模块 | 路径 | 说明 |
|---|---|---|
| Auth | `src/modules/auth` | 注册 / 登录 / 刷新令牌，JWT + Argon2 |
| Account | `src/modules/account` | `GET/PATCH /api/v1/me` |
| Curriculum | `src/modules/curriculum` | 学科 / 课程 / 选课 / 技能树 |
| Learning | `src/modules/learning` | 开始关卡、提交单题、结算 |
| Gamification | `src/modules/gamification` | 每日任务、监听 `learning.lesson.completed` |
| Social | `src/modules/social` | 好友、周联赛 |

## 接口文档

启动后访问 http://localhost:4000/docs （Swagger UI）。

## 关键设计

- **题目用 JSONB**：`Exercise.prompt` / `answer` 字段是 JSONB，结构由 `type` 字段约束，`packages/shared-types/src/exercise.ts` 是 TS 类型源。
- **判分纯函数**：`packages/shared-logic/src/judge.ts` 同时被服务端权威判分和前端预览复用。
- **事件解耦**：`learning.lesson.completed` 由学习模块发布，游戏化模块订阅，未来推送 / 数据分析等模块都可挂载，不改主链路。
- **SRS**：SM-2 变体，每次作答更新对应 `SrsCard`，未来加上 Worker 即可在 due 时间推送复习。
