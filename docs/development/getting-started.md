# 本地开发上手

> 第一次拉下仓库的工程师按这一篇就能跑起来。

---

## 一、前置条件

| 工具 | 最低版本 | 安装提示 |
|---|---|---|
| Node.js | ≥ 20 | 推荐 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 管理多版本 |
| pnpm | ≥ 9 | `corepack enable && corepack prepare pnpm@9.0.0 --activate` |
| Docker | 最新版 | macOS / Windows 用 Docker Desktop；Linux 用 Docker Engine |
| Git | 任意 | |
| （可选）Expo CLI | | 跑 mobile 时通过 `pnpm dev:mobile` 自动调起 |

> macOS：建议把 `~/.nvm` / `~/.fnm` 加入 PATH；Apple Silicon 用 Docker Desktop 时无需特殊设置。

---

## 二、克隆与安装

```bash
git clone <repo-url> StudyZone
cd StudyZone
pnpm install
```

`pnpm install` 会基于 `pnpm-workspace.yaml` 安装所有 `apps/*` 与 `packages/*` 的依赖。

> 第一次安装较慢（~3 分钟），后续基于 pnpm 的硬链接会非常快。

---

## 三、配置环境变量

```bash
cp .env.example .env
```

至少检查：

- `DATABASE_URL` 默认指向本地 docker Postgres（无需修改）。
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` 在团队共享开发库时建议改成随机长串。
- `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_ASSET_BASE_URL` / `VITE_API_URL` 已默认指向 `http://localhost:4000`。

> 完整字段说明详见 [`environment.md`](./environment.md)。

---

## 四、启动基础设施

本地的 Postgres / Redis / MinIO 都跑在 Docker：

```bash
pnpm docker:up      # 后台启动
pnpm docker:logs    # 看日志
pnpm docker:down    # 关闭
```

| 服务 | 端口 | 默认凭据 |
|---|---|---|
| PostgreSQL | 5432 | `studyzone / studyzone_dev` |
| Redis | 6379 | 无密码 |
| MinIO | 9000 (API) / 9001 (UI) | `minioadmin / minioadmin` |

数据卷在 Docker Volume 中，重启容器不会丢数据；用 `docker:down` 不删卷，要清空时 `docker compose -f infra/docker/docker-compose.yml down -v`。

---

## 五、初始化数据库

第一次 / schema 变更后：

```bash
pnpm db:migrate     # 运行 Prisma migrations（开发模式）
pnpm db:import      # 导入课程内容（lesson-data/）
```

> `db:import` 会清空内容相关表（Subject/Course/Unit/Lesson/Exercise/SrsCard/Session/...），但**保留**用户、钱包、任务、XP 流水。可以反复执行。

可视化查看数据库：

```bash
pnpm db:studio      # 打开 Prisma Studio（默认 http://localhost:5555）
```

---

## 六、启动应用

### 选项 A：一键后台启动（推荐）

```bash
pnpm services:start          # 后台启动 docker + api + web + admin
pnpm services:stop           # 关闭（同时关 docker）
pnpm services:stop --keep-docker
```

启动后日志在 `.studyzone-dev/logs/{api,web,admin}.log`，PID 文件在 `.studyzone-dev/services.json`。

### 选项 B：逐个前台启动（调试单个服务用）

```bash
pnpm dev:api     # NestJS API @ :4000
pnpm dev:web     # Next.js Web @ :3000
pnpm dev:admin   # Vite Admin @ :3001
pnpm dev:mobile  # Expo Dev Server（自动起 Metro）
```

或一次性并行起所有 dev：

```bash
pnpm dev         # 注意：占据当前 shell，且 mobile dev server 会要求交互
```

### 选项 C：只跑某些 app

```bash
pnpm --filter @studyzone/api dev
pnpm --filter @studyzone/web... build      # 包含依赖一起 build
```

---

## 七、可访问的 URL

| 服务 | URL | 用途 |
|---|---|---|
| Web | http://localhost:3000 | 学习者前台 |
| Admin | http://localhost:3001 | 内部 CMS |
| API | http://localhost:4000 | 后端 |
| Swagger | http://localhost:4000/docs | 接口文档 |
| Health | http://localhost:4000/health | 健康检查 |
| MinIO | http://localhost:9001 | 对象存储后台（凭据见上） |
| Prisma Studio | http://localhost:5555 | 数据库浏览（运行 `pnpm db:studio`） |

---

## 八、常用工作流

### 每次拉新代码

```bash
git pull
pnpm install              # 同步依赖
pnpm db:migrate           # 应用新的迁移（如果有）
pnpm services:start
```

### 修改 Prisma schema

```bash
# 1. 改 apps/api/prisma/schema.prisma
pnpm --filter @studyzone/api prisma migrate dev --name <change_name>
# 2. 同步更新 packages/shared-types DTO
# 3. 必要时修改服务层代码 + 写测试
```

### 新增题型 / 业务

参考 [`../architecture/04-learning-engine.md`](../architecture/04-learning-engine.md) 第二节"新增题型的步骤"。

### 重置开发环境

```bash
pnpm services:stop
docker compose -f infra/docker/docker-compose.yml down -v   # 删数据
pnpm docker:up
pnpm db:migrate
pnpm db:import
```

---

## 九、常见问题（FAQ）

**Q: `pnpm dev:api` 报错 `P1001: Can't reach database`?**
检查 Docker 是否在跑：`pnpm docker:logs`；端口 5432 是否被本机其它 Postgres 占用。

**Q: Web 访问 API 跨域 / 401?**
确认 `.env` 中 `NEXT_PUBLIC_API_URL=http://localhost:4000`；后端启动时 `cors: true`，不应有跨域问题；401 多半是 token 过期，重新登录即可。

**Q: `pnpm install` 卡在 native 模块编译（如 argon2）?**
确保 Node.js 版本 ≥ 20；macOS 需要 Xcode Command Line Tools (`xcode-select --install`)；Apple Silicon 偶尔需 `pnpm rebuild`。

**Q: 端口被占了怎么办？**
`pnpm services:stop` 会自动杀掉占用 3000 / 3001 / 4000 的本仓库进程；如仍有外部进程占用：`lsof -iTCP:3000 -sTCP:LISTEN`。

**Q: 移动端跑不起来？**
`pnpm dev:mobile`（即 `expo start`）需要在终端交互；若手机扫不到二维码，使用 `expo start --tunnel`。

---

## 十、下一步

- 想深入业务模块：[`架构总览`](../architecture/01-overview.md)
- 想了解项目结构与提交规范：[`workflow.md`](./workflow.md)
- 想跑测试：[`testing.md`](./testing.md)
- 想部署到服务器：[`部署文档`](../deployment/production.md)
