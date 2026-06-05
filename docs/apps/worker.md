# apps/worker — 后台任务进程

> NestJS 独立进程 + BullMQ。负责联赛结算、推送、SRS 调度等异步任务。
>
> 目录：[`apps/worker/`](../../apps/worker/)

---

## 一、启动

```bash
pnpm --filter @studyzone/worker dev      # tsx watch
pnpm --filter @studyzone/worker start    # 生产模式（直接 tsx）
```

> Worker 与 API 共用同一份 `.env`（通过 `scripts/with-root-env.mjs` 注入），所以读到同一份 `DATABASE_URL` / `REDIS_URL`。

---

## 二、职责

- **联赛结算（League settle）**：每周一 UTC `00:05`（cron `5 0 * * 1`，可用 `LEAGUE_SETTLE_CRON` 覆盖）扫描 `LeagueGroup.status='active' && weekStart < now()`，按规则升 / 留 / 降，写 `LeagueHistory`，把 group 标记 `settled`，发奖励。
- **心数恢复（Hearts recover）**：周期任务（cron `HEART_RECOVERY_CRON`，默认 `*/5 * * * *`）调用 `RewardsService.recoverAllHearts()`，对 `hearts < maxHearts` 的钱包按 `recoverHearts` 纯函数补算（每 `HEART_RECOVERY_MINUTES` 分钟回 1 颗，默认 3）。API 侧读取时也会惰性补算（`syncHearts`），cron 仅兜底防止久挂。
- **SRS 调度（计划）**：每天扫 `SrsCard` 中 `dueAt <= now`，推送复习提醒，并在用户开关时优先抽这些题。
- **推送（计划）**：发送 APNs / FCM 通知。

---

## 三、目录结构

```
apps/worker/src/
├─ main.ts                 # 入口，注册并消费 BullMQ 重复任务
├─ worker.module.ts
├─ settle-now.ts           # 单次执行：手动触发联赛结算（回滚 / 调试）
└─ recover-hearts-now.ts   # 单次执行：手动触发一次心数恢复扫描
```

> **不是系统 crontab**：`main.ts` 里的 cron 表达式是 BullMQ `repeat.pattern`，由这个常驻进程内部按 Redis 中的 schedule 触发。进程必须长期运行，且依赖 Redis（`REDIS_URL`）与 Postgres（`DATABASE_URL`）。

---

## 四、常用命令

```bash
# 本地：worker 已纳入一键启动（随 api/web/admin + docker 一起后台运行）
pnpm services:start
# 单独前台启动（热重载）
pnpm dev:worker
# 单独后台普通启动
pnpm --filter @studyzone/worker start

# 一次性手动触发（不等定时）
pnpm --filter @studyzone/worker settle:now            # 立刻结算上周联赛
pnpm --filter @studyzone/worker recover-hearts:now    # 立刻跑一次心数恢复
```

> 心数日常无需手动触发：API 读取（`GET /me` / `startLesson`）会惰性补算，worker 周期任务兜底。

---

## 五、生产部署

systemd 模板已随仓库提供：[`deploy/studyzone-worker.service.template`](../../deploy/studyzone-worker.service.template)，与 api / web 一同由 `pnpm deploy:install-systemd` 渲染并 `enable`：

```bash
pnpm deploy:install-systemd            # 写入 /etc/systemd/system 并 enable 三个服务
pnpm deploy:install-systemd --restart  # 顺带重启

# 或手动管理
sudo systemctl enable --now studyzone-worker
journalctl -u studyzone-worker -f
```

> ⚠️ **调度器只跑单实例**：重复任务用稳定 `jobId`（`settle-weekly` / `recover-hearts`）去重，但仍应只运行一个 worker 实例承担调度。将来要扩并发，应拆为「1 个调度器 + N 个纯 processor」。

---

## 六、相关文档

- [架构总览](../architecture/01-overview.md)
- [游戏化机制（联赛部分）](../architecture/05-gamification.md)
