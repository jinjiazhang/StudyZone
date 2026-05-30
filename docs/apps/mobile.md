# apps/mobile — 移动端

> React Native 0.81 + Expo SDK 54 + Expo Router。学习者的主战场（碎片时间答题）。
>
> 目录：[`apps/mobile/`](../../apps/mobile/)

---

## 一、启动

```bash
pnpm dev:mobile           # 启动 Expo Dev Server（Metro + 二维码）
# 或：
pnpm --filter @studyzone/mobile dev:tunnel    # 隧道模式，跨网络扫码
pnpm --filter @studyzone/mobile ios           # iOS 模拟器
pnpm --filter @studyzone/mobile android       # Android 模拟器
pnpm --filter @studyzone/mobile web           # 跑在浏览器（用于调试 RN-Web）
```

> 真机调试：手机装 [Expo Go](https://expo.dev/client)，扫终端二维码。

---

## 二、技术栈

| 组件 | 选型 | 用途 |
|---|---|---|
| 框架 | React Native 0.81 + Expo SDK 54 | |
| 路由 | Expo Router | 与 Next.js 心智一致（基于文件系统） |
| 状态 | TanStack Query + Zustand | |
| 动画 | Reanimated 4 + Gesture Handler | 高性能跨线程动画 |
| 媒体 | Expo AV | 听力题音频 |
| 持久化 | Expo Secure Store | 安全存 access / refresh token |
| 字体 | @expo-google-fonts/nunito | |
| WebView | react-native-webview | |
| 图标 | lucide-react-native | |

---

## 三、目录结构

```
apps/mobile/src/
├─ app/             # Expo Router 文件路由（_layout.tsx / (tabs)/...）
├─ components/      # 业务组件 + 题型渲染
└─ lib/             # api-client 封装、token store
```

资源：[`apps/mobile/assets/`](../../apps/mobile/assets/)。

应用配置：[`apps/mobile/app.json`](../../apps/mobile/app.json)。

---

## 四、与后端的协作

- 网络层使用 `@studyzone/api-client`，token 存放在 Expo Secure Store，自动刷新。
- 题目类型 / DTO 复用 `@studyzone/shared-types`。
- 业务规则（XP / Streak 预测）调用 `@studyzone/shared-logic`，与后端权威结果保持一致。

> `EXPO_PUBLIC_ASSET_BASE_URL` 控制媒体资源（题目音频、头像）的根 URL。

---

## 五、构建与发布

当前没有接入 EAS Build；待商业化前会接入：

- `pnpm --filter @studyzone/mobile dlx eas build --platform ios|android`
- `dlx eas submit` 上架商店

> Expo Updates（OTA）后续会用于热更新非二进制改动。

---

## 六、常见问题

- **Metro 报 "Unable to resolve module @studyzone/...":** workspace 链接没生效，根目录跑 `pnpm install` 后重启 Metro（按 `r`）。
- **iOS 模拟器卡在白屏:** 删除 `.expo/` 缓存重启。
- **真机扫不到码:** 用 `--tunnel` 或确保手机和电脑在同一局域网。

---

## 七、相关文档

- [架构总览](../architecture/01-overview.md)
- [API 规范](../architecture/03-api.md)
- [shared-logic](../packages/shared-logic.md)
