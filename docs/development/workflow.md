# 开发工作流

> 这一篇覆盖 Monorepo 怎么协作、怎么分支、怎么提交、怎么发版。

---

## 一、Monorepo 与依赖

### 1.1 工具

- **pnpm** 9 — 包管理器；workspace 由 `pnpm-workspace.yaml` 声明。
- **Turborepo** 2 — 任务编排；`turbo.json` 描述 dev / build / test / lint / typecheck。

### 1.2 内部包引用

```jsonc
// apps/web/package.json
{
  "dependencies": {
    "@studyzone/shared-types": "workspace:*",
    "@studyzone/shared-logic": "workspace:*",
    "@studyzone/api-client": "workspace:*"
  }
}
```

`workspace:*` 表示走 monorepo 内部链接；改了 `packages/shared-logic`，所有依赖它的 app 都立即生效，无需 build。

### 1.3 添加 / 升级依赖

```bash
# 给 apps/web 加依赖
pnpm --filter @studyzone/web add lucide-react

# 给整个 monorepo 加 dev 依赖
pnpm add -D -w prettier

# 升级所有包
pnpm -r update
```

> ⚠️ **只在需要的 app 里加依赖**，避免 Web 里塞进 Node.js 专属库（反之亦然）。

### 1.4 Turbo 任务

```bash
pnpm dev        # 并行启动所有 dev (turbo run dev --parallel)
pnpm build      # 全量 build，按依赖图顺序
pnpm lint
pnpm typecheck
pnpm test
```

`turbo` 会缓存任务输出（`.turbo/`），未改动的包二次执行近乎瞬间。

---

## 二、目录习惯

### 2.1 后端模块

```
apps/api/src/modules/<domain>/
├─ <domain>.module.ts        # NestJS Module
├─ <domain>.controller.ts    # HTTP 路由
├─ <domain>.service.ts       # 业务逻辑（依赖 PrismaService）
├─ <domain>.dto.ts           # class-validator DTO
└─ <domain>.service.test.ts  # 模块内单测（Vitest）
```

### 2.2 共享代码归属

| 内容 | 应该放哪 | 例子 |
|---|---|---|
| 跨端 TS 类型 | `packages/shared-types` | DTO、枚举、事件 payload |
| 跨端纯函数业务规则 | `packages/shared-logic` | XP 计算、判分、SRS、联赛升降级 |
| HTTP 客户端 | `packages/api-client` | 统一 fetch 封装 |
| 仅 API 内部用的常量 / 工具 | `apps/api/src/common/` | HTTP 异常 filter、装饰器 |
| UI 组件 | 各 app 自有 `components/`（暂未抽共享 UI 包） | |

> 凡是"前端要预测、后端要权威"的逻辑（典型的 judge / xp / streak），必须放 `shared-logic` —— 否则迟早分叉。

---

## 三、分支与提交

### 3.1 分支

- `main`：永远可发布。
- 特性分支：`feat/<short-desc>`，从 `main` 切出。
- 修复分支：`fix/<short-desc>`。
- 长周期重构：`refactor/<topic>`。

不直接 push `main`；走 PR + Code Review。

### 3.2 Commit Message

推荐 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(learning): 支持词块组句题型
fix(auth): refresh token 撤销后未清缓存
refactor(shared-logic): 抽离 league 升降级规则
docs: 完善 README 与 docs 目录
chore(deps): bump prisma to 5.13
```

类型：`feat` / `fix` / `refactor` / `docs` / `chore` / `test` / `perf`。

### 3.3 提交前自检

```bash
pnpm lint
pnpm typecheck
pnpm test
```

> 配置 git pre-commit 钩子（待接入 husky）；目前请人工确保通过。

### 3.4 PR 模板（建议）

```
## 改了什么
- ...

## 为什么改
- ...

## 怎么验证
- 跑 `pnpm test`
- 本地访问 http://localhost:3000 ...

## 风险点
- ...
```

---

## 四、代码风格

- **TypeScript strict**：禁止 `any` 漏过；明确导出类型。
- **Prettier** 主导格式化（`.prettierrc`），保存时自动格式化。
- **ESLint** 抓常见错误；NestJS 与 Next.js 各自带配置。
- **命名**：
  - 文件 `kebab-case.ts` / `PascalCase.tsx`（React 组件）。
  - DTO 后缀 `*.dto.ts`，Module 后缀 `*.module.ts`，Service 后缀 `*.service.ts`，Test 后缀 `*.test.ts`。
- **导入顺序**：node 内置 → 第三方 → `@studyzone/*` → 本地相对路径。
- **错误处理**：尽量抛 NestJS 自带 `HttpException`（带 code）；客户端拿到结构化 `{ code, message, details }`。

---

## 五、数据库变更工作流

```bash
# 1. 编辑 apps/api/prisma/schema.prisma
# 2. 生成迁移
pnpm --filter @studyzone/api prisma migrate dev --name <change_name>

# 3. 同步类型（自动）
#    Prisma client 重新生成；TS 立即感知

# 4. 修改 packages/shared-types 中相关 DTO（如果对外字段变了）
# 5. 改服务层 + 写测试
# 6. 提交：包含 schema、migration 文件、shared-types 变更
```

⚠️ **不要修改已合入主干的 migration 文件**；如改错了，新建一个迁移修复。

---

## 六、文档与设计同步

- 改了核心算法（XP、判分、SRS、联赛）→ 更新 `docs/architecture/04-learning-engine.md` 或 `05-gamification.md`。
- 新增 / 重命名接口 → Swagger 自动反映；如有重大破坏性更改，在 PR 里专门标注。
- 改了部署流程 → 更新 `docs/deployment/`。

---

## 七、相关文档

- [本地开发上手](./getting-started.md)
- [测试指南](./testing.md)
- [架构总览](../architecture/01-overview.md)
