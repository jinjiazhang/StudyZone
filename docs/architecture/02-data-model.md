# 02 — 数据模型

> 数据模型源代码：[`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma)
>
> 当出现冲突时，**Prisma schema 是唯一真实来源**，本文档负责给出领域分组与设计意图。

---

## 一、领域全景

```
┌──────────────────────────────────────────────────────────────┐
│ Account / Auth                                               │
│   User · AuthIdentity · Device · RefreshToken                │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────────────────────────────────────────────┐
│ Content                                                      │
│   Subject → Course → Unit → Lesson ↔ LessonExercise ↔ Exercise│
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────────────────────────────────────────────┐
│ Learning State (per-user)                                    │
│   Enrollment · UserLessonProgress                            │
│   LearningSession → ExerciseAttempt                          │
│   SrsCard                                                     │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────────────────────────────────────────────┐
│ Gamification                                                 │
│   UserWallet · StreakRecord · XPLedger                       │
│   Achievement · UserAchievement                              │
│   DailyQuest · UserQuestProgress                             │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────────────────────────────────────────────┐
│ Social & League                                              │
│   Friendship                                                 │
│   LeagueGroup → LeaderboardEntry                             │
│   LeagueHistory                                              │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────────────────────────────────────────────┐
│ Billing & Notification                                       │
│   Subscription · Notification                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、Account / Auth

### `User`
平台账户主体。所有外键最终都指向这里。

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `cuid` | 主键 |
| `email` | `unique String` | 登录凭据 |
| `passwordHash` | `String` | Argon2 哈希 |
| `nickname` / `avatarUrl` | | 公开资料 |
| `locale` | `String` | UI 语言（默认 `zh-CN`） |
| `timezone` | `String` | 用户时区，决定 streak 日切（默认 `Asia/Shanghai`） |
| `dailyGoalMinutes` | `Int` | 每日目标 |
| `status` | `enum-like` | `active` \| `suspended` \| `deleted` |

### 相关联表
- `AuthIdentity`：第三方登录绑定（Google / Apple / WeChat / GitHub）。
- `Device`：APP 推送 Token 和最近活跃记录。
- `RefreshToken`：哈希后的 refresh token，撤销时打 `revokedAt`。

> JWT Access Token 不入库，只在 Redis 维护吊销集合（待实现）。

---

## 三、Content（课程内容）

层级：`Subject → Course → Unit → Lesson ⇄ Exercise`

### 关键设计

- **多对多 `LessonExercise`**：同一题目可被多关复用（错题回炉、综合关卡）。
- **JSONB 题目**：`Exercise.prompt` / `answer` 是 JSONB；TS 类型在 [`packages/shared-types/src/exercise.ts`](../../packages/shared-types/src/exercise.ts)，由 `Exercise.type` 字段判别（discriminated union）。
- **课程唯一键**：`(subjectId, fromLocale, toLocale)`，防止重复发布同一组合。
- **Locale 含义**：
  - `fromLocale` = 用户母语（UI 文案语言）
  - `toLocale` = 学习目标语言；对数学等非语言学科，约定 `toLocale = "math"`（自描述）
- **删除级联**：`Course → Unit → Lesson` 全 `onDelete: Cascade`，重新导入课程时不会留下孤儿。

### 内容数据来源

- 源数据存放在 [`apps/api/prisma/lesson-data/`](../../apps/api/prisma/lesson-data/)，按 `subject/grade/unit/lesson` 分目录。
- 通过 `pnpm db:import` 重新导入；该命令会清空 Content + 学习相关状态（Session / Attempt / SrsCard / Progress / Enrollment）但**保留账户 / 钱包 / 任务 / XP 流水**。

---

## 四、Learning State（学习状态，按用户）

### `Enrollment`
联合主键 `(userId, courseId)`。记录用户当前在课程中的位置（`currentUnitId` / `currentLessonId`）和课内总 XP。

### `UserLessonProgress`
联合主键 `(userId, lessonId)`。记录某关卡是否完成、最佳得分。

### `LearningSession`
一次完整的「打开关卡 → 完成关卡」生命周期。

| 字段 | 含义 |
|---|---|
| `exerciseQueue` | JSON 数组，按顺序保存本次抽到的 `exerciseId` |
| `correctCount / totalCount` | 实时累加 |
| `xpGained` | 关卡完成时按 [`shared-logic/xp.ts`](../../packages/shared-logic/src/xp.ts) 计算 |
| `heartsUsed` | 错题扣心数 |
| `outcome` | `pass` \| `fail` \| `abandoned` |

### `ExerciseAttempt`
单题作答记录，是 SRS / 错题分析的原始数据。

### `SrsCard`
联合主键 `(userId, exerciseId)`，使用 SM-2 变体（`intervalDays` / `ease` / `streakOk` / `dueAt`）。详见 [`04-learning-engine.md`](./04-learning-engine.md)。

---

## 五、Gamification

### `UserWallet`
单行钱包：宝石 / 心数 / 心数上限 / 连胜冻结 / 总 XP。`xpTotal` 是冗余字段，便于排行榜直接 ORDER BY；写入由 `RewardsService` 统一负责，不允许其他模块直接修改。

### `StreakRecord`
- `lastActiveLocalDate` 是 `YYYY-MM-DD` 字符串，按用户时区切日，和服务器 UTC 解耦。
- 每日完成第一次有效学习时由 [`shared-logic/streak.ts`](../../packages/shared-logic/src/streak.ts) 计算下一个状态。

### `XPLedger`
**不可变流水**。每次 XP 变动都写一条；`reason` 是离散值（`lesson_complete` \| `quest_complete` \| `league_reward` \| ...）；`refId` 关联具体业务实体。`UserWallet.xpTotal` 必须等于该用户所有 ledger 之和（数据库可加触发器/对账任务）。

### Achievement / DailyQuest
- `Achievement` 是平台级配置（不可变模板），`UserAchievement` 是用户领取记录。
- `DailyQuest` 是每日任务模板；`UserQuestProgress` 主键 `(userId, questId, date)`，按日切。

---

## 六、Social & League

### `Friendship`
双向存储，主键 `(userId, friendId)`。状态 `pending` \| `accepted` \| `blocked`。当 A 向 B 发起：先写一条 `(A, B, pending)`，B 接受后追加 `(B, A, accepted)`。

### `LeagueGroup`
- 一组 30 人，`weekStart`（UTC 周一 00:00）+ `tier`（青铜→...）唯一定位。
- 状态 `active` → `settled`。结算后下周首次活跃时把用户迁入下一周的 group。

### `LeaderboardEntry`
联合主键 `(groupId, userId)`，是 group 内的实时积分行。`weeklyXp` 在每次产出 XP 时增量更新；`rank` 由 Worker 周期性计算或在结算时一次性算。

### `LeagueHistory`
**每用户每周一行的快照**。这是用户联赛历史的唯一真实来源；`tier` / `nextTier` / `result` (`promoted` \| `stayed` \| `demoted`) 决定下周分配到哪一档。

---

## 七、Billing & Notification

### `Subscription`
| 字段 | 取值 |
|---|---|
| `plan` | `monthly` \| `yearly` \| `family` |
| `provider` | `stripe` \| `apple_iap` \| `google_play` \| `wechat` \| `alipay` |
| `status` | `active` \| `trialing` \| `past_due` \| `canceled` |

只记录会员订阅；一次性消费（宝石包）后续接入 `Order / OrderItem`（待建表）。

### `Notification`
站内通知。`type` 决定客户端如何展示；`data` JSONB 存额外 payload；`readAt` 为 `null` 表示未读。

---

## 八、索引策略

| 表 | 索引 | 用途 |
|---|---|---|
| `User` | `(status)`、`(createdAt)` | 后台分页 / 风控筛选 |
| `RefreshToken` | `(userId)`、`(expiresAt)` | 清理过期 / 用户登出全设备 |
| `LearningSession` | `(userId)`、`(startedAt)` | 用户学习历史 |
| `XPLedger` | `(userId, createdAt)` | 流水分页 |
| `LeaderboardEntry` | `(groupId, weeklyXp)` | 联赛榜单排序 |
| `SrsCard` | `(userId, dueAt)` | Worker 扫到期卡 |
| `LeagueHistory` | `unique(userId, weekStart)` | 防重复结算 |

---

## 九、迁移管理

- 迁移目录：[`apps/api/prisma/migrations/`](../../apps/api/prisma/migrations/)
- 当前迁移：
  1. `20260526082635_init` — 初始 schema
  2. `20260528000000_add_course_cover_image_url`
  3. `20260529000000_league_settlement` — 联赛结算字段
  4. `20260529050745_sync_current_schema`

**约定**

- 开发时用 `pnpm db:migrate` 自动生成新迁移；不要手改已经合入主干的迁移。
- 删除字段需走两步迁移（先停止写入，下一版本再 drop），避免回滚困难。
- Schema 变化必须同步更新 `packages/shared-types`（DTO 层）。

---

## 十、相关文档

- [01 - 架构总览](./01-overview.md)
- [03 - API 规范](./03-api.md)
- [04 - 学习引擎](./04-learning-engine.md)
- [05 - 游戏化机制](./05-gamification.md)
