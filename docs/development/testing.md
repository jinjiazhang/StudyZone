# 测试指南

> 测试覆盖三个层次：纯函数单测（最厚实）、模块测试（中等）、端到端测试（少量、高价值）。

---

## 一、测试栈

| 层 | 工具 | 位置 |
|---|---|---|
| 纯函数单测 | [Vitest](https://vitest.dev/) | `packages/shared-logic/**/*.test.ts` |
| 后端模块测试 | Vitest + 手工 mock Prisma | `apps/api/src/modules/**/*.test.ts` |
| 后端端到端 | Vitest + 测试数据库（计划中） | `apps/api/test/e2e/` |
| Web E2E | Playwright（计划中） | `apps/web/test/` |

---

## 二、运行测试

```bash
# 全量
pnpm test

# 单个包
pnpm --filter @studyzone/shared-logic test
pnpm --filter @studyzone/api test

# Watch 模式
pnpm --filter @studyzone/shared-logic test -- --watch

# 跑单个文件
pnpm --filter @studyzone/shared-logic test xp.test.ts
```

> `turbo` 会缓存上次成功的测试结果；不想用缓存加 `--force`。

---

## 三、写测试的原则

### 3.1 优先用纯函数单测

任何"输入 → 输出"明确的逻辑都先在 `packages/shared-logic` 里写：

```ts
// packages/shared-logic/src/xp.test.ts
import { describe, it, expect } from 'vitest';
import { computeLessonXp } from './xp';

describe('computeLessonXp', () => {
  it('给满分加成', () => {
    const xp = computeLessonXp({ correct: 10, total: 10, avgMs: 4000, streak: 0 });
    expect(xp).toBeGreaterThan(10);
  });
});
```

理由：

- 跑得快（毫秒级），可以穷举边界。
- 同一份逻辑被服务端和客户端共享，单测就是契约测试。

### 3.2 服务层测试

服务层测试关注"怎么编排数据库与 shared-logic"：

```ts
// 简化示例
const prisma = makeFakePrisma();
const service = new LearningService(prisma, ...);
const result = await service.completeSession({ sessionId: 'abc' });
expect(prisma.xPLedger.create).toHaveBeenCalledWith(...);
```

不必为每个 controller 都写测试，重点覆盖**算法 + 写库次序**。

### 3.3 端到端测试（计划）

未来在 `apps/api/test/e2e/`：

- 启动一个干净的测试库（独立 `DATABASE_URL`）。
- 注册 → 选课 → 完成关卡 → 校验 wallet / streak / quest 全链路。

---

## 四、Mock 策略

### Prisma

由于 Prisma 客户端是大对象，团队约定用一个轻量手动 fake：

```ts
function makeFakePrisma() {
  return {
    user: { findUnique: vi.fn(), create: vi.fn() },
    learningSession: { findUnique: vi.fn(), update: vi.fn() },
    // ... 仅 mock 用到的方法
  } as unknown as PrismaClient;
}
```

> 不依赖第三方 mock 库；保持显式。

### 时间

涉及日期 / 时区的逻辑（streak / 联赛 / SRS）：用 Vitest 自带的 `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-05-30T00:00:00Z'))`。

---

## 五、CI

> 当前 CI 主流程（GitHub Actions）会跑：
>
> ```
> pnpm install --frozen-lockfile
> pnpm lint
> pnpm typecheck
> pnpm test
> pnpm build
> ```
>
> PR 上未通过的检查会被标红；合并到 `main` 自动部署到预览环境（待接入）。

本地提交前请确保 `pnpm test` 通过。

---

## 六、相关文档

- [开发工作流](./workflow.md)
- [架构 / 学习引擎](../architecture/04-learning-engine.md)
