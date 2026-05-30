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

- **联赛结算（League settle）**：每周一 UTC `00:01` 扫描 `LeagueGroup.status='active' && weekStart < now()`，按规则升 / 留 / 降，写 `LeagueHistory`，把 group 标记 `settled`，发奖励。
- **SRS 调度（计划）**：每天扫 `SrsCard` 中 `dueAt <= now`，推送复习提醒，并在用户开关时优先抽这些题。
- **推送（计划）**：发送 APNs / FCM 通知。
- **心数恢复（计划）**：每 X 分钟回 1 颗，直到 `maxHearts`。

---

## 三、目录结构

```
apps/worker/src/
├─ main.ts              # 入口，启动 BullMQ workers
├─ worker.module.ts
└─ settle-now.ts        # 单次执行：手动触发联赛结算（用于回滚 / 调试）
```

---

## 四、常用命令

```bash
# 启动后台 worker
pnpm --filter @studyzone/worker start

# 立刻结算一次联赛（不等定时）
pnpm --filter @studyzone/worker settle:now
```

---

## 五、生产部署

仓库目前未为 worker 提供 systemd 模板，但可参考 API 模板自定义：

```ini
# /etc/systemd/system/studyzone-worker.service
[Unit]
Description=StudyZone Worker
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/studyzone/apps/worker
EnvironmentFile=/opt/studyzone/.env
ExecStart=/usr/local/bin/pnpm --filter @studyzone/worker start
Restart=always
RestartSec=5
StandardOutput=append:/opt/studyzone/.studyzone-prod/logs/worker.log
StandardError=append:/opt/studyzone/.studyzone-prod/logs/worker.log

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now studyzone-worker
journalctl -u studyzone-worker -f
```

---

## 六、相关文档

- [架构总览](../architecture/01-overview.md)
- [游戏化机制（联赛部分）](../architecture/05-gamification.md)
