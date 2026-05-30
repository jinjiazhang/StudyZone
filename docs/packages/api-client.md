# packages/api-client

> 共享 HTTP 客户端 SDK。Web / Mobile / Admin 三端的网络层。
>
> 目录：[`packages/api-client/`](../../packages/api-client/) ｜ 包名：`@studyzone/api-client`

---

## 一、定位

直接以 TS 源码形式 export（`main: ./src/index.ts`），不打包，不发布到 npm。三端通过 pnpm workspace 直接 import。

---

## 二、提供的能力

- 统一 `fetch` 封装（`baseUrl` / 默认 headers / JSON 解析 / 错误反序列化）。
- **自动注入 `Authorization: Bearer <token>`**：从外部传入的 token 提供器读取。
- **Token 自动刷新**：当返回 401 / `TOKEN_EXPIRED` 时自动调用 `/auth/refresh` 拿新 token，重放原请求；refresh 失败则触发外部"未登录"回调。
- **错误标准化**：把 `{ code, message, details }` 抛成结构化 Error，调用方按 `error.code` 处理。
- **类型安全**：所有请求 / 响应类型来自 `@studyzone/shared-types`，端到端不再手写。

---

## 三、与 shared-types 的关系

```
shared-types         shared-logic
   ▲                     ▲
   │ 类型                │ 纯函数
   │                     │
api-client ─── HTTP ──▶ apps/api
   ▲
   │ import
   │
Web / Mobile / Admin
```

api-client 不写算法、也不存状态；它只是把 shared-types 的 DTO 接到 HTTP。

---

## 四、目录

```
packages/api-client/
├─ package.json
└─ src/
   └─ index.ts        # 客户端构造器 + 各 resource 的方法
```

> 当前实现较薄，未来可考虑用 OpenAPI 自动生成；不过手写的好处是逻辑更可控、错误处理更统一。

---

## 五、使用示例

```ts
import { createApiClient } from '@studyzone/api-client';

const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  getToken: () => localStorage.getItem('access_token'),
  onUnauthorized: () => router.push('/login'),
});

const profile = await api.me.get();
const tree = await api.courses.tree(courseId);
```

每个端的 token 存放方式不同：

- Web：localStorage / cookie
- Mobile：Expo Secure Store
- Admin：localStorage

只要传符合签名的 `getToken` / `setTokens` / `onUnauthorized` 即可。

---

## 六、相关

- [API 规范](../architecture/03-api.md)
- [shared-types](./shared-types.md)
