# Nginx 反向代理

> 生产环境用 Nginx 终结 TLS、分发到 API / Web，并直接服务 Admin 静态文件。

---

## 一、模板文件

入口：[`deploy/nginx.studyzone.conf.template`](../../deploy/nginx.studyzone.conf.template)。

由 [`scripts/deploy/install-nginx.mjs`](../../scripts/deploy/install-nginx.mjs) 渲染并写入：

```
/etc/nginx/sites-available/studyzone
/etc/nginx/sites-enabled/studyzone   # 软链
```

---

## 二、路由策略

| Path | 上游 / 行为 |
|---|---|
| `/api/...` | 反代 `127.0.0.1:{{API_PORT}}` |
| `/health` | 反代到 API（用于探活） |
| `/docs` | 反代到 API（Swagger） |
| `/admin` | 301 → `/admin/` |
| `/admin/...` | `alias` 到 `{{ADMIN_DIST_DIR}}`（Vite 静态产物），`try_files` 落到 `index.html`（SPA fallback） |
| `/` | 反代 `127.0.0.1:{{WEB_PORT}}`（Next.js） |

附带：

- `client_max_body_size 20m`（上传题目音频 / 头像用）
- WebSocket 头：`Upgrade` / `Connection upgrade`（为未来 `/ws` 做准备）
- 80 → 443 强制重定向

---

## 三、安装

```bash
sudo node scripts/deploy/install-nginx.mjs \
  --domain=study.example.com \
  --ssl-cert=/etc/letsencrypt/live/study.example.com/fullchain.pem \
  --ssl-key=/etc/letsencrypt/live/study.example.com/privkey.pem \
  --reload
```

参数：

| 参数 | 默认 | 说明 |
|---|---|---|
| `--domain` | 从 `PUBLIC_ORIGIN` 自动提取 | 站点域名 |
| `--ssl-cert` / `--ssl-key` | 必填 | 证书路径 |
| `--site-name` | `studyzone` | 写入文件名 |
| `--api-port` | `.env` 的 `API_PORT` 或 4000 | 上游 API 端口 |
| `--web-port` | `.env` 的 `WEB_PORT` 或 3000 | 上游 Web 端口 |
| `--admin-base` | `.env` 的 `VITE_ADMIN_BASE` 或 `/admin` | Admin URL 前缀 |
| `--admin-dist-dir` | `/var/www/studyzone-admin` | Admin 静态文件目录 |
| `--sites-available` | `/etc/nginx/sites-available` | |
| `--sites-enabled` | `/etc/nginx/sites-enabled` | |
| `--disable-default` | （flag） | 删除 Nginx 默认 site |
| `--reload` | （flag） | 写完后自动 `nginx -t && systemctl reload nginx` |

> 不传 `--reload` 时只会写文件并跑 `nginx -t`，便于先 review 再 reload。

---

## 四、TLS 证书

### Let's Encrypt（推荐）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d study.example.com
```

证书路径默认在 `/etc/letsencrypt/live/<domain>/`，自动续签由 `certbot.timer` 处理。

### 已有证书

把 `fullchain.pem` 与 `privkey.pem` 放到任意位置，传给 install 脚本即可。

---

## 五、自定义 / 进阶

### 5.1 多站点

把 `--site-name=studyzone-staging` 即可在同一台机器上挂多套环境。注意 Admin 静态目录、各端口也要分开。

### 5.2 子路径部署 Admin

如果不想用 `/admin`：

```bash
# 修改 .env
VITE_ADMIN_BASE=/manage

# 重新构建并发布
pnpm --filter @studyzone/admin build
node scripts/deploy/publish-admin.mjs

# 重新装 nginx
sudo node scripts/deploy/install-nginx.mjs --admin-base=/manage --reload
```

### 5.3 自定义 header / 安全策略

在 [`deploy/nginx.studyzone.conf.template`](../../deploy/nginx.studyzone.conf.template) 中加：

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

修改后重新 install 即可。

### 5.4 关掉生产环境 Swagger

模板默认放行 `/docs`。如果不想对外暴露：

```nginx
location /docs {
    return 404;        # 或加 IP 白名单
}
```

---

## 六、调试

```bash
sudo nginx -t                           # 配置语法检查
sudo systemctl reload nginx             # 配置生效
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

返回 502 → 上游不通；返回 504 → 上游慢或挂了；返回 413 → body 超过 `client_max_body_size`。

---

## 七、相关文档

- [生产部署](./production.md)
- [systemd 服务管理](./systemd.md)
