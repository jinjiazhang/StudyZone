# apps/admin — 管理后台

> Vite 5 + React 18 + React Router 6。仅供内部使用，纯 SPA。
>
> 目录：[`apps/admin/`](../../apps/admin/) ｜ 端口：`3001`

---

## 一、启动

```bash
pnpm dev:admin          # → http://localhost:3001
```

> 依赖 API 在 `4000` 端口运行（`VITE_API_URL`）。

---

## 二、技术栈

| 组件 | 选型 |
|---|---|
| 构建 | Vite 5 |
| UI | React 18 + 自有组件（待引入设计系统） |
| 路由 | React Router 6 |
| 状态 | TanStack Query + Zustand |
| 网络 | `@studyzone/api-client` |

---

## 三、目录结构

```
apps/admin/
├─ index.html
├─ vite.config.ts
└─ src/
   ├─ main.tsx
   ├─ pages/         # 页面（按业务模块分目录）
   └─ state.ts       # Zustand store（admin token / 当前用户 / 权限）
```

---

## 四、构建产物

```bash
pnpm --filter @studyzone/admin build       # 输出到 apps/admin/dist/
pnpm --filter @studyzone/admin preview     # 本地起静态服务器预览
```

`dist/` 即生产静态资源。生产部署用 [`scripts/deploy/publish-admin.mjs`](../../scripts/deploy/publish-admin.mjs) 复制到 `ADMIN_DIST_DIR`（默认 `/var/www/studyzone-admin`），由 Nginx 直接提供。

---

## 五、URL 子路径

Admin 默认部署在 `/admin`（由 `VITE_ADMIN_BASE` 控制）。改子路径需要：

1. 修改 `.env`：`VITE_ADMIN_BASE=/manage`。
2. 重新 `pnpm --filter @studyzone/admin build`。
3. 重发布：`node scripts/deploy/publish-admin.mjs`。
4. 重装 Nginx：`sudo node scripts/deploy/install-nginx.mjs --admin-base=/manage --reload`。

> Vite 的 `base` 选项会被 `VITE_ADMIN_BASE` 注入到 `vite.config.ts`，确保静态资源路径正确。

---

## 六、相关文档

- [API 规范](../architecture/03-api.md)
- [Nginx 反向代理](../deployment/nginx.md)
