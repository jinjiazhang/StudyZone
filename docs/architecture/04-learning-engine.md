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
POST /api/v1/sessions/:id/attempts  (循环)
  ├─ 服务端用 shared-logic/judge.ts 判分（权威）
  ├─ 写入 ExerciseAttempt
  ├─ 更新 SrsCard（更新 ease / interval / dueAt）
  └─ 返回：{ isCorrect, feedback }
        │
        ▼
POST /api/v1/sessions/:id/complete
  ├─ 计算 XP、心数消耗、streak
  ├─ 写入 UserLessonProgress（completed=true, bestScore）
  ├─ 通过 RewardsService 写入钱包 + XPLedger
  ├─ 发布事件 learning.lesson.completed
  └─ 返回结算面板数据
```

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

`learning.service.ts` 的 `pickExercises(lessonId, userId)`：

1. **基础题集**：从 `LessonExercise` 按 `orderIndex` 取 `Lesson.exerciseCount` 道。
2. **SRS 加权**：查询 `SrsCard` 中 `dueAt <= now` 且对应 exercise 属于当前课程的卡片，按权重抽样替换。
3. **错题强化**：如该用户最近一次同关卡 session `outcome = fail`，提升其错题权重。
4. **新手保护**：用户首次开关该 lesson，不混入 SRS，让基础题先建立信心。
5. **写入 `LearningSession.exerciseQueue`**：保证整条会话顺序固定（断线重连可恢复）。

> 当前实现以「顺序抽题 + 错题加权」为主，正式 SRS 排程在 Worker 模块完整接入后开放。

---

## 四、判分（Judge）

`packages/shared-logic/src/judge.ts` 是判分的唯一入口（**前后端共用**）：

```ts
import { judgeExercise } from '@studyzone/shared-logic';

const result = judgeExercise({
  type: ExerciseType.TRANSLATE_INPUT,
  prompt: { ... },
  answer: { ... },
  userAnswer: { text: 'I like apples.' }
});
// → { isCorrect: true, normalizedAnswer: 'I like apples.', feedback?: ... }
```

设计原则：

- **纯函数**：无副作用、无 IO，方便测试 + 端到端复用。
- **服务端权威**：客户端可以预判用于动效，但 `attempts` 接口的 `isCorrect` **以服务端结果为准**。
- **容错**：
  - 输入题：忽略大小写、首尾空格、标点，按 `tolerance` 计算 Levenshtein 距离。
  - 数字题：`abs(user - expected) <= tolerance`。
- **渐进容错**：未来对 `LISTEN_INPUT` 引入语音相近字符替换、对 `WORD_BANK` 接受多种合法语序。

---

## 五、XP 计算

`packages/shared-logic/src/xp.ts`：

| 加分项 | 公式 |
|---|---|
| 基础 XP | `Lesson.exerciseCount * 1` |
| 满分加成 | `correct == total → +5` |
| 速度加成 | `平均响应 < 5s → +3` |
| Streak 加成 | `currentStreak ≥ 7 → ×1.1`，`≥ 30 → ×1.2` |
| 任务奖励 | 完成每日任务时由 Quests 模块单独发放 |

写入路径：
1. `LearningService.completeSession` 算出 `xpGained`，写入 `LearningSession`。
2. 调 `RewardsService.grantXp({ userId, delta, reason: 'lesson_complete', refId: sessionId })`，由它落 `XPLedger` 并增量 `UserWallet.xpTotal`。
3. 发出 `learning.lesson.completed` 事件，League 模块同步增加 `LeaderboardEntry.weeklyXp`。

---

## 六、心数（Hearts）

- 每次答错扣 1 颗心，扣到 0 关卡判 `outcome = fail`。
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
| `learning.lesson.completed` | `LearningService` | Rewards / Quests / League / Notification | 主结算事件 |
| `learning.attempt.failed` | `LearningService` | （预留）数据分析 | 错题分析 |

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
