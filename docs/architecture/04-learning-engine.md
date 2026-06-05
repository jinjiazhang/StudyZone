# 04 — 学习引擎

> 学习引擎是 StudyZone 的核心业务模块，负责 **组卷 → 判分 → 结算 → 复习** 的完整循环。
>
> 涉及代码：
> - 服务端：`apps/api/src/modules/learning/`
> - 纯函数：`packages/shared-logic/src/{judge,xp,srs,streak}.ts`
> - 题目类型：`packages/shared-types/src/exercise.ts`

---

## 一、核心流程

```
[ 用户点击关卡 ]
        │
        ▼
POST /api/v1/lessons/:id/start
  ├─ 校验：是否已选课、是否解锁、心数是否足够
  ├─ 组卷：从 LessonExercise 抽题 + 错题/SRS 加权
  ├─ 创建 LearningSession（写入 exerciseQueue）
  └─ 返回：sessionId + 题目数组（含 prompt，答案不下发）
        │
        ▼
[ 客户端逐题答题 ]
        │
        ▼
POST /api/v1/lessons/:id/start
  ├─ 校验：心数是否 > 0（耗尽则 out_of_hearts 拒绝开关）
  └─ ……（组卷见下）
        │
        ▼
POST /api/v1/sessions/:id/attempts  (循环)
  ├─ 服务端用 shared-logic/judge.ts 判分（权威）
  ├─ 写入 ExerciseAttempt（同一题可多次提交，用于错题重做）
  ├─ 答错扣 1 颗心；扣到 0 则当场锁关：标记 finishedAt + outcome=fail
  ├─ 更新 SrsCard（更新 ease / interval / dueAt）
  └─ 返回：{ correct, canonicalAnswer, heartLost, heartsRemaining, lessonFailed }
        │
        ▼
POST /api/v1/sessions/:id/complete
  ├─ 校验错题重做：所有题目都必须"最近一次提交正确"，否则返回 redo_required
  ├─ 计算 XP（基础分必给 + 按首次正确数算加成）、streak
  ├─ 写入 UserLessonProgress（completed=true, bestScore）
  ├─ 经 RewardsService 增量 UserWallet（xp/gems）+ XPLedger；单独更新 streakFreezes
  ├─ 发布事件 learning.lesson.completed
  └─ 返回结算面板数据
```

> **错题重做（redo）**：每道题可重复提交，`complete` 时会按 `exerciseQueue` 逐题取「最近一次提交结果」，只要还有题目最近一次不正确，就以 `redo_required` 拒绝结算并返回 `pendingExerciseIds`，由客户端把这些题重新插入答题队列。正常走完（最终全对）的关卡 `outcome = pass`。
>
> **心数耗尽锁关**：每答错一题扣 1 颗心（心数为钱包全局资源），扣到 0 的那次提交会立即把会话标记 `finishedAt + outcome=fail`、`lessonFailed=true`，本关失败、无奖励；后续 `attempts` / `complete` 因 `session_finished` 被拒。客户端据 `lessonFailed` 跳失败页。心数耗尽时 `start` 也会以 `out_of_hearts` 拒绝开新关。
>
> **结算计分口径**：基础 XP 在关卡完成（最终全对）时**必给**；满分加成只看**每题首次提交**是否全对（`firstPassCorrectCount`），重做不补加成。详见 §五。

---

## 二、题型（Exercise Type）

题型由 `Exercise.type`（字符串）+ JSONB `prompt` / `answer` 表达。所有 TS 类型在 [`packages/shared-types/src/exercise.ts`](../../packages/shared-types/src/exercise.ts)，使用 discriminated union。

| 类型 | code | 说明 | 客户端组件位置（示例） |
|---|---|---|---|
| 翻译选择 | `TRANSLATE_CHOICE` | 给源句子，4 选 1 翻译 | Web/Mobile 学习页 |
| 翻译输入 | `TRANSLATE_INPUT` | 给源句子，输入翻译；支持 Levenshtein 容错 | |
| 听力输入 | `LISTEN_INPUT` | 听音频写出原文；提供慢速回放 | |
| 配对 | `MATCH_PAIRS` | 左右两列单词配对 | |
| 看图选词 | `IMAGE_CHOICE` | 词与四张图片 | |
| 词块组句 | `WORD_BANK` | 拖拽词块组成正确句子 | |
| 数字输入 | `NUMERIC_INPUT` | 数学答案输入，支持 tolerance | |

新增题型的步骤：

1. 在 `enums.ts` 加 `ExerciseType.<NEW>`；
2. 在 `exercise.ts` 定义 `<New>Prompt` / `<New>Answer` / `<New>Attempt`；
3. 在 `judge.ts` 加分支；并补 `judge.test.ts`；
4. 客户端 Web / Mobile 加渲染组件（`apps/web/src/components/exercises/` 与 `apps/mobile/src/components/exercises/`）；
5. CMS 加题目编辑表单（`apps/admin/src/pages/...`）。

---

## 三、组卷算法

**当前实现**（`learning.service.ts` 的 `startLesson(userId, lessonId)`）：

1. 取该 lesson 的全部 `LessonExercise`（按 `orderIndex` 加载）作为候选池。
2. `pickAndShuffle(pool, Lesson.exerciseCount)`：Fisher–Yates 随机洗牌后取前 `exerciseCount` 道。
3. 写入 `LearningSession.exerciseQueue`，保证整条会话顺序固定（断线重连可恢复）。

> 现状即「随机抽题」，**尚未**接入下面的 SRS 加权 / 错题强化 / 新手保护——这些仍是规划项。注意：虽然每次 `attempts` 都会更新 `SrsCard`（见 §八），但 `startLesson` 目前并不读取 `SrsCard` 来影响选题。

**规划中的加权策略**（待 Worker / SRS 完整接入后开放）：

- **SRS 加权**：查询 `SrsCard` 中 `dueAt <= now` 且属于当前课程的卡片，按权重抽样替换。
- **错题强化**：提升该用户历史答错题目的权重。
- **新手保护**：用户首次开该 lesson 时不混入 SRS，让基础题先建立信心。

---

## 四、判分（Judge）

`packages/shared-logic/src/judge.ts` 是判分的唯一入口（**前后端共用**）：

```ts
import { judge } from '@studyzone/shared-logic';

const result = judge(
  prompt,   // ExercisePrompt（含 type 判别字段）
  answer,   // ExerciseAnswer
  payload,  // UserAttemptPayload，如 { text: 'I like apples.' }
);
// → { correct: true, canonicalAnswer?: 'I like apples.' }
```

设计原则：

- **纯函数**：无副作用、无 IO，方便测试 + 端到端复用。
- **服务端权威**：客户端可以预判用于动效，但 `attempts` 接口的 `correct` **以服务端结果为准**。
- **容错**：
  - 输入题：忽略大小写、首尾空格、标点，按 `tolerance` 计算 Levenshtein 距离。
  - 数字题：`abs(user - expected) <= tolerance`。
- **渐进容错**：未来对 `LISTEN_INPUT` 引入语音相近字符替换、对 `WORD_BANK` 接受多种合法语序。

---

## 五、XP 计算

`packages/shared-logic/src/xp.ts` 的 `calculateLessonScore({ totalExercises, correctCount, timeSpentMs, currentStreak, isSubscriber })`：

| 项 | 规则（常量见 `xp.ts`） |
|---|---|
| 基础 XP | 固定 `10`（`BASE_XP_PER_LESSON`），关卡完成（最终全对）必给 |
| 满分加成 | 首次提交即全对 `correctCount == totalExercises → +5` |
| 速度加成 | 整局耗时 `timeSpentMs ≤ 90s → +5` |
| Streak 加成 | `floor(currentStreak / 7) * 2`（每满 7 天连胜 +2） |
| 订阅加成 | `isSubscriber → 总 XP ×1.2`（四舍五入） |
| Gems | 基础 `1`，满分再 `+2` |
| 任务奖励 | 完成每日任务时由 Quests 模块单独发放 |

> `correctCount` 传入的是**首次提交正确数**（`firstPassCorrectCount`）。由于错题必须重做到对才能结算（最终全对），基础 XP 一定发放；首次正确率只影响满分加成与 Gems。失败（心数耗尽）的关卡走 §一 的锁关分支，不会进入计分，零奖励。

写入路径：
1. `LearningService.completeSession` 调 `calculateLessonScore` 算出 `score`，把 `xpGained` 写入 `LearningSession`。
2. 在同一事务内调用 `RewardsService.awardXpAndGemsWithClient(tx, …)` 增量 `UserWallet.xpTotal` / `gems` 并写入不可变的 `XPLedger`（`reason: 'lesson_completed'`, `refId: sessionId`）；`streakFreezes` 在同事务内单独更新。
3. 发出 `learning.lesson.completed` 事件，League 模块同步增加 `LeaderboardEntry.weeklyXp`。

> 钱包的 xp/gems 写入已统一收口到 `RewardsService`，与 Quests / League 结算共用同一入口，保证 `UserWallet` 与 `XPLedger` 一致。

---

## 六、心数（Hearts）

- 心数是 `UserWallet.hearts` 上的**全局**资源（跨关卡共享），默认上限 5。
- 每次答错扣 1 颗心（`heartsRemaining` 在 attempts 响应里回传），最低扣到 0。
- **耗尽锁关（硬约束，已启用）**：扣到 0 的那次提交立即把会话标记 `finishedAt + outcome=fail`，返回 `lessonFailed=true`，本关失败、无奖励；之后该会话的 `attempts` / `complete` 都因 `session_finished` 被拒。`startLesson` 在 `hearts <= 0` 时以 `out_of_hearts` 拒绝开新关。
- 每 X 分钟回 1 颗心（待 Worker 接入），上限 `maxHearts`（默认 5）。
- 未来：宝石可购买无限心数（订阅会员默认开启）。

---

## 七、Streak（连胜）

`packages/shared-logic/src/streak.ts`：

- 用户每日完成至少一关（或满足"日学习目标"）即 +1。
- 跨日判定按 `User.timezone` 切日，落入 `StreakRecord.lastActiveLocalDate`。
- 漏一天：`currentStreak` 重置为 0，但 `longestStreak` 保留历史。
- **Streak Freeze 道具**：用户若有 `streakFreezes > 0`，漏一天时自动消耗一个并保留连胜。

---

## 八、SRS（间隔复习）

`packages/shared-logic/src/srs.ts` 实现 SM-2 变体：

```
对：interval = previous * ease；ease 略升；streakOk++
错：interval = 1；ease 下降（min 1.3）；streakOk = 0
dueAt = now + interval days
```

- 每次 `ExerciseAttempt` 写入后同步更新对应 `SrsCard`。
- Worker（计划）每天扫 `dueAt <= now` 的卡，推送复习提醒；并在用户下次开关卡时优先抽这些题。

---

## 九、关键事件

| 事件 | 谁发 | 谁收 | 作用 |
|---|---|---|---|
| `learning.lesson.completed` | `LearningService` | Rewards / Quests / League / Notification | 主结算事件（关卡通过） |
| `learning.lesson.failed` | `LearningService` | （数据分析） | 心数耗尽锁关时发出，`reason='out_of_hearts'`；不触发奖励/任务/联赛 |

> Payload 类型在 `packages/shared-types/src/events.ts`。

---

## 十、测试策略

- 纯函数（`judge` / `xp` / `streak` / `srs` / `league`）：Vitest 全覆盖，跑得很快。
- `LearningService`：模块内单测 + 用 `vitest` mock Prisma。
- 端到端（计划）：`apps/api/test/e2e/` 用一个干净的测试库跑完整 `start → attempts → complete` 流程。

```bash
pnpm --filter @studyzone/shared-logic test
pnpm --filter @studyzone/api test
```

---

## 十一、相关文档

- [02 - 数据模型](./02-data-model.md)
- [03 - API 规范](./03-api.md)
- [05 - 游戏化机制](./05-gamification.md)
