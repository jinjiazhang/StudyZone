# apps/web — Web 端

> Next.js 14 (App Router) + React 18 + Tailwind + TanStack Query + Zustand + Framer Motion。
>
> 目录：[`apps/web/`](../../apps/web/) ｜ 端口：`3000`

---

## 一、启动

```bash
pnpm dev:web         # → http://localhost:3000
```

依赖 API 在 `4000` 端口运行（参见 `.env` 中 `NEXT_PUBLIC_API_URL`）。

---

## 二、技术栈

| 组件 | 选型 | 用途 |
|---|---|---|
| 框架 | Next.js 14 App Router | SSR / RSC / 静态导出灵活 |
| UI | React 18 | |
| 样式 | Tailwind CSS | 设计 token + 工具类 |
| 状态 | TanStack Query 5（服务端） + Zustand（客户端） | |
| 动画 | Framer Motion | XP / 升级 / 连胜动画 |
| 图标 | lucide-react | |
| 字符 | hanzi-writer | 中文学习时的笔画动画 |

---

## 三、目录结构

```
apps/web/src/
├─ app/                # Next.js App Router
│  ├─ (marketing)/     # 营销 / 落地页
│  ├─ (app)/           # 登录后学习者主流程
│  └─ api/             # 仅极少量 BFF 路由（如客户端日志收集）
├─ components/         # 业务组件
└─ lib/                # 客户端工具：api-client 实例、store、hooks
```

> 大多数页面在 RSC 中获取数据，交互组件用 `'use client'` 标记。

---

## 四、与 API 的协作

- 共用 `@studyzone/api-client`：自动注入 `Authorization`，token 失效时自动 refresh。
- 共用 `@studyzone/shared-types`：DTO / 枚举 / 题目类型与后端一致。
- 共用 `@studyzone/shared-logic`：XP 预测 / 判分预览（动效用，权威结果以服务端为准）。

---

## 五、常用命令

```bash
pnpm dev:web                                # next dev
pnpm --filter @studyzone/web build          # 生产 build → .next/
pnpm --filter @studyzone/web start          # next start（生产）
pnpm --filter @studyzone/web lint
pnpm --filter @studyzone/web typecheck
```

---

## 六、生产部署

由 `studyzone-web.service` 用 `next start` 守护，监听 `127.0.0.1:WEB_PORT`，由 Nginx 反代。详见 [`部署文档`](../deployment/production.md)。

---

## 七、相关文档

- [API 规范](../architecture/03-api.md)
- [api-client](../packages/api-client.md)
- [shared-types](../packages/shared-types.md)
