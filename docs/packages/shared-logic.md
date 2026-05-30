# packages/shared-logic

> 端到端共享的纯函数业务逻辑。**前后端共用同一段代码**。
>
> 目录：[`packages/shared-logic/`](../../packages/shared-logic/) ｜ 包名：`@studyzone/shared-logic`

---

## 一、为什么存在

凡是"前端要预测、后端要权威"的逻辑（典型：判分、XP 计算、Streak、SRS、联赛升降级），如果各端各写一份，迟早分叉、bug 不收敛。把这些抽成纯函数放在共享包，是 StudyZone 架构的核心约束。

---

## 二、模块清单

| 文件 | 函数 | 说明 |
|---|---|---|
| `xp.ts` | `computeLessonXp(...)` | 关卡完成时的 XP 计算（基础 + 满分加成 + 速度加成 + streak 加成） |
| `streak.ts` | `computeNextStreak(...)` | 给定上次打卡日期 / 今日日期 / 时区 / 冻结道具，返回新的 streak 状态 |
| `srs.ts` | `updateSrsCard(...)` | SM-2 变体；输入当前 card + 答对/错，返回新的 `interval` / `ease` / `dueAt` |
| `judge.ts` | `judgeExercise(...)` | 各题型判分；服务端权威，客户端可复用做即时反馈 |
| `level.ts` | `levelFromXp(...)` | XP 总数 → 等级 + 当前级内进度 |
| `league.ts` | `settleLeagueGroup(...)` | 联赛分组结算：排序 + 升 / 留 / 降 / 奖励 |

入口：[`packages/shared-logic/src/index.ts`](../../packages/shared-logic/src/index.ts) 统一 re-export。

---

## 三、使用示例

```ts
import { judgeExercise, computeLessonXp } from '@studyzone/shared-logic';
import { ExerciseType } from '@studyzone/shared-types';

// 客户端：题目作答即时反馈
const result = judgeExercise({
  type: ExerciseType.TRANSLATE_INPUT,
  prompt,
  answer,
  userAnswer: { text: input },
});

// 服务端：关卡完成时计算 XP
const xp = computeLessonXp({
  correct: 9,
  total: 10,
  avgMs: 4500,
  streak: 12,
});
```

---

## 四、约束

- **纯函数**：无 IO，无随机源除非显式注入，无 `Date.now()` 副作用 —— 必要时把"当前时间"作为参数传入，便于测试。
- **不依赖 Prisma / NestJS / React**：只依赖 `@studyzone/shared-types` 和 ts 标准库。
- **每个函数都必须有单测**：见 `*.test.ts`，使用 Vitest。
- **服务端是权威**：客户端用 `judgeExercise` 做即时反馈是合法的，但提交后必须以服务端结果为准。

---

## 五、运行测试

```bash
pnpm --filter @studyzone/shared-logic test
pnpm --filter @studyzone/shared-logic test --watch
```

---

## 六、相关

- [学习引擎](../architecture/04-learning-engine.md)
- [游戏化机制](../architecture/05-gamification.md)
- [shared-types](./shared-types.md)
