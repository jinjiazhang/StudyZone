# systemd 服务管理

> 生产环境使用 systemd 管理 `studyzone-api` 与 `studyzone-web` 两个常驻进程。

---

## 一、模板文件

仓库保存了两个模板：

- [`deploy/studyzone-api.service.template`](../../deploy/studyzone-api.service.template)
- [`deploy/studyzone-web.service.template`](../../deploy/studyzone-web.service.template)

模板使用 `{{KEY}}` 占位，由 [`scripts/deploy/install-systemd.mjs`](../../scripts/deploy/install-systemd.mjs) 渲染并写入 `/etc/systemd/system/`。

---

## 二、安装

```bash
sudo node scripts/deploy/install-systemd.mjs --restart
```

参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `--systemd-dir` | `/etc/systemd/system` | 写入位置 |
| `--pnpm` | `which pnpm` 的输出 | pnpm 可执行路径（API 服务用） |
| `--web-port` | `.env` 的 `WEB_PORT` 或 `3000` | Next.js 监听端口 |
| `--restart` | （默认不带） | 写完模板后自动 `restart` |

完成后会自动：

```
systemctl daemon-reload
systemctl enable studyzone-api studyzone-web
```

---

## 三、渲染后的 unit（示意）

`studyzone-api.service`：

```ini
[Unit]
Description=StudyZone API
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/studyzone/apps/api
EnvironmentFile=/opt/studyzone/.env
ExecStart=/usr/local/bin/pnpm --filter @studyzone/api start
Restart=always
RestartSec=5
StandardOutput=append:/opt/studyzone/.studyzone-prod/logs/api.log
StandardError=append:/opt/studyzone/.studyzone-prod/logs/api.log

[Install]
WantedBy=multi-user.target
```

`studyzone-web.service`：

```ini
[Unit]
Description=StudyZone Web
After=network.target studyzone-api.service
Wants=studyzone-api.service

[Service]
Type=simple
WorkingDirectory=/opt/studyzone/apps/web
EnvironmentFile=/opt/studyzone/.env
ExecStart=/opt/studyzone/apps/web/node_modules/.bin/next start -p 3000 -H 127.0.0.1
Restart=always
RestartSec=5
StandardOutput=append:/opt/studyzone/.studyzone-prod/logs/web.log
StandardError=append:/opt/studyzone/.studyzone-prod/logs/web.log

[Install]
WantedBy=multi-user.target
```

---

## 四、日常运维

```bash
# 启停
sudo systemctl start    studyzone-api studyzone-web
sudo systemctl stop     studyzone-api studyzone-web
sudo systemctl restart  studyzone-api studyzone-web
sudo systemctl reload-or-restart  studyzone-api studyzone-web

# 状态
systemctl status studyzone-api
systemctl status studyzone-web

# 日志（systemd journal）
journalctl -u studyzone-api -f
journalctl -u studyzone-api --since "1 hour ago"

# 文件日志（项目自带）
tail -f /opt/studyzone/.studyzone-prod/logs/api.log
tail -f /opt/studyzone/.studyzone-prod/logs/web.log
```

---

## 五、注意事项

- **`Requires=docker.service`** 在 API unit 里：是因为本地开发常把数据库放 docker；如果你的生产 Postgres 不依赖本机 docker，可以手动改 unit 删掉这行。
- **`EnvironmentFile=/opt/studyzone/.env`**：systemd 直接从 `.env` 加载变量；不要在文件中放注释、空行以外的 shell 语法（不支持）。
- **日志路径** `.studyzone-prod/logs/` 必须存在。`install-systemd.mjs` 会自动创建。
- **重启策略** `Restart=always` + `RestartSec=5`：进程异常 5 秒后自动重启，配合健康监控避免雪崩。

---

## 六、添加 Worker 服务（可选）

仓库目前没有为 worker 提供模板，但很简单。复制 `studyzone-api.service.template` 改两处：

```ini
Description=StudyZone Worker
ExecStart={{PNPM_BIN}} --filter @studyzone/worker start
WorkingDirectory={{ROOT_DIR}}/apps/worker
StandardOutput=append:{{ROOT_DIR}}/.studyzone-prod/logs/worker.log
StandardError=append:{{ROOT_DIR}}/.studyzone-prod/logs/worker.log
```

放到 `/etc/systemd/system/studyzone-worker.service`，然后：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now studyzone-worker
```

---

## 七、相关文档

- [生产部署](./production.md)
- [Nginx 反向代理](./nginx.md)
