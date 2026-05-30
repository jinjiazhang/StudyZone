# 05 — 游戏化机制

> 游戏化把 StudyZone 从"刷题工具"变成"想每天打开的应用"。本章覆盖：钱包、XP、Streak、任务、成就、联赛。
>
> 核心代码：
> - 服务端模块：`apps/api/src/modules/{rewards,quests,league}/`
> - 纯函数：`packages/shared-logic/src/{xp,streak,league,level}.ts`

---

## 一、奖励经济总览

```
        ┌──────── XP ─────────┐
        │  ledger 不可变流水  │
        ▼                      ▼
   等级 / 自我进度       周联赛榜单（weeklyXp）
                              │
                              ▼
                         升 / 留 / 降
                              │
                              ▼
                     LeagueHistory 快照

        ┌─────── 宝石 (Gems) ───────┐
        │  虚拟货币，可买道具/会员    │
        └────────────────────────────┘

        ┌─────── 心数 (Hearts) ─────┐
        │  错题扣，恢复时间限制      │
        └────────────────────────────┘
```

所有写操作必须经 `RewardsService`（位于 `apps/api/src/modules/rewards/`），确保 `UserWallet` 与 `XPLedger` 保持一致。

---

## 二、XP 与等级

### XP
- 来源：完成关卡、完成每日任务、联赛奖励、成就奖励。
- 持久化：写入 `XPLedger`（不可变）+ 同步增量到 `UserWallet.xpTotal`。
- 不能减（不存在"扣 XP"业务），异常情况下用相反方向 ledger 行修正。

### 等级（Level）
[`packages/shared-logic/src/level.ts`](../../packages/shared-logic/src/level.ts)：

```ts
levelFromXp(xp): { level, xpInLevel, xpToNextLevel }
```

- 等级曲线偏前期奖励：前 5 级累计 250 XP，第 30 级累计约 5w XP。
- 客户端用它渲染进度条和升级动画（升级判定 = 当前 ledger 与上一条 ledger 对比 `level` 是否变了）。

---

## 三、Streak（连胜）

### 规则
- 当日完成"满足 streak 资格"的学习活动即记录今日 → `currentStreak++`。
- "satisfy" 当前定义：完成至少 1 关（未来可调整为达到 dailyGoalMinutes）。
- 漏一天：先消耗 `UserWallet.streakFreezes`，否则 `currentStreak = 0`。
- `longestStreak` 不会回退。

### 时区
日切按 `User.timezone`，存 `StreakRecord.lastActiveLocalDate = "YYYY-MM-DD"`。所有判断用本地日期字符串比较，避开 UTC 边界 bug。

### 道具：Streak Freeze
- 商店里用宝石购买，最多持有 N 个（默认 2）。
- 漏一天时由后端**自动消耗**，无需用户主动点击。

实现：[`packages/shared-logic/src/streak.ts`](../../packages/shared-logic/src/streak.ts)

---

## 四、宝石与心数

### 宝石（Gems）
- 来源：成就奖励、联赛奖励、活动、内购。
- 用途：买心数、买 streak freeze、解锁高级关卡、订阅会员折抵（待）。
- 同样过 `RewardsService.grantGems` 单点写入。

### 心数（Hearts）
- 默认上限 5。
- 错题扣 1，扣到 0 关卡 fail。
- 恢复：每 X 分钟回 1 颗（Worker 周期任务）；订阅会员无限心数。

---

## 五、每日任务（Daily Quest）

### 模型
- `DailyQuest`：平台模板（`完成 N 关`、`获得 N XP`、`完美完成 1 关`...）。
- `UserQuestProgress`：主键 `(userId, questId, date)`，记录今天进度与完成时间。

### 任务流转
1. 每日 `0:00`（用户时区，由 Worker 触发；或首次访问时懒生成）为活跃用户初始化今日任务。
2. 监听 `learning.lesson.completed`：`QuestsService` 给所有未完成的今日任务 `+1`。
3. 任意一个任务达成阈值时：
   - 标记 `completedAt`
   - 调 `RewardsService.grantXp / grantGems` 发奖励
   - 推送站内通知

> 实现：`apps/api/src/modules/quests/`

---

## 六、成就（Achievement）

- 平台预配置成就模板（连续 7 天打卡、获得 1000 XP、完成第一节课……）。
- `UserAchievement` 记录用户已领取。
- 触发时机：监听对应事件 + 比对阈值，达成立即写表 + 发奖励。
- 当前先以 "可见进度" 为目标，后续接入炫酷动效。

---

## 七、周联赛（Weekly League）

是当前最复杂、最有差异化的游戏化机制。

### 七.1 规则

- 每周一 UTC `00:00` 是新一周的开始（`weekStart`）。
- 所有有"本周 XP"的用户被分到一个 `LeagueGroup`（30 人/组）。
- 组内按 `weeklyXp` 排序，结算时：
  - 前 N 名 **晋级（promoted）**
  - 中段 **保留（stayed）**
  - 末 N 名 **降级（demoted）**
- 阶梯：青铜 → 白银 → 黄金 → 蓝宝石 → 红宝石 → 钻石 → 大师 → 传奇（具体由 `shared-logic/league.ts` 决定）。

### 七.2 数据模型

| 表 | 角色 |
|---|---|
| `LeagueGroup` | 一周一档一组（`weekStart, tier`），30 人 |
| `LeaderboardEntry` | 用户在该 group 的当前 `weeklyXp` 与 `rank` |
| `LeagueHistory` | **每用户每周一行**的最终快照，是用户当前 tier 的真相来源 |

### 七.3 加入新一周

`LeagueService.joinIfNeeded(userId)`：

1. 查 `LeagueHistory` 找上周 `nextTier`（没有则给 `bronze`）。
2. 查当前周 + 该 tier 的 `LeagueGroup`：
   - 找一个未满 30 人的塞进去；
   - 都满则新建一组。
3. 写 `LeaderboardEntry(userId, groupId)`，初始 `weeklyXp = 0`。

由用户本周第一次产出 XP 时触发（在 `learning.lesson.completed` 事件链路里）。

### 七.4 结算

由 Worker 进程定时触发（生产周一 UTC 0:01）或手动 `pnpm --filter @studyzone/worker settle:now` 触发：

```
对每个 status=active 且 weekStart 已过的 LeagueGroup：
  按 weeklyXp 排序，写 rank
  按规则计算 result + nextTier + gemsAwarded
  写 LeagueHistory
  group.status = settled
  推送站内通知
```

> 设计要点：
> - **幂等**：通过 `LeagueHistory.unique(userId, weekStart)` 防重复结算。
> - **可回放**：失败时单组重跑而不影响他人。
> - **可手动**：`settle-now.ts` 允许在任意时间点结算（开发 / 灾备）。

实现：[`apps/worker/src/`](../../apps/worker/src/) + [`packages/shared-logic/src/league.ts`](../../packages/shared-logic/src/league.ts)

---

## 八、相关测试

`packages/shared-logic` 中每个机制都有对应单测：

```bash
pnpm --filter @studyzone/shared-logic test
# xp.test.ts
# streak.test.ts
# srs.test.ts
# judge.test.ts
# league.test.ts
```

游戏化机制的算法务必先以纯函数 + 单测形式实现，然后在服务里调用，避免逻辑分散。

---

## 九、相关文档

- [01 - 架构总览](./01-overview.md)
- [02 - 数据模型](./02-data-model.md)
- [04 - 学习引擎](./04-learning-engine.md)
