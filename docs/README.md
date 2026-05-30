# StudyZone 文档

> 本目录是 StudyZone 项目的完整设计 / 开发 / 部署文档库。
> 顶层 [`README.md`](../README.md) 提供项目概览与快速上手；本目录包含所有详细资料。

## 目录结构

```
docs/
├─ README.md                       # 你正在阅读的文档索引
│
├─ architecture/                   # 架构与设计
│  ├─ 01-overview.md               # 整体架构 / 模块边界 / 技术选型 / NFR
│  ├─ 02-data-model.md             # Prisma schema 总览与领域分组
│  ├─ 03-api.md                    # REST / WebSocket / 事件总线规范
│  ├─ 04-learning-engine.md        # 题型 schema / 判分 / SRS 算法
│  └─ 05-gamification.md           # XP / Streak / 联赛 / 任务 / 钱包
│
├─ development/                    # 本地开发与协作
│  ├─ getting-started.md           # 第一次跑起来项目
│  ├─ environment.md               # .env 字段说明
│  ├─ workflow.md                  # Monorepo / Turbo / 提交规范
│  └─ testing.md                   # 单测与端到端测试
│
├─ deployment/                     # 部署与运维
│  ├─ production.md                # 生产环境一键部署流程
│  ├─ docker.md                    # 本地基础设施容器
│  ├─ systemd.md                   # studyzone-api / studyzone-web 服务管理
│  └─ nginx.md                     # 反向代理与 HTTPS
│
├─ apps/                           # 各应用文档
│  ├─ api.md                       # NestJS 后端
│  ├─ web.md                       # Next.js Web
│  ├─ mobile.md                    # React Native + Expo
│  ├─ admin.md                     # Vite 管理后台
│  └─ worker.md                    # BullMQ Worker
│
└─ packages/                       # 共享包文档
   ├─ shared-types.md
   ├─ shared-logic.md
   └─ api-client.md
```

## 阅读建议

- **新人入职**：`development/getting-started.md` → `architecture/01-overview.md` → 选择负责的 `apps/<x>.md`。
- **后端开发**：`architecture/02-data-model.md` + `architecture/04-learning-engine.md` + `apps/api.md`。
- **前端开发**：`apps/web.md` 或 `apps/mobile.md` + `architecture/03-api.md`。
- **运维上线**：`deployment/production.md` 一篇就够，需要时再翻 `systemd.md` / `nginx.md`。

## 文档约定

- 文档使用中文编写，技术术语保留英文。
- 涉及代码路径请用反引号：`apps/api/src/modules/learning/`。
- 涉及命令请用代码块，并标注是仓库根目录还是子目录执行。
- 架构图优先 ASCII，复杂图表可外链 `excalidraw` 或 `mermaid`。
