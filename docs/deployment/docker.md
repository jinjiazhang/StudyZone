# Docker 与本地基础设施

> 仅用于**开发环境**：用 Docker Compose 起 Postgres / Redis / MinIO，避免每个工程师手动装一遍。生产建议用云数据库或专用机器，不要用这套 Compose。

---

## 一、Compose 文件

入口：[`infra/docker/docker-compose.yml`](../../infra/docker/docker-compose.yml)。

| 服务 | 镜像 | 端口（容器 → 宿主） |
|---|---|---|
| `studyzone-postgres` | `postgres:16-alpine` | 5432 |
| `studyzone-redis` | `redis:7-alpine` | 6379 |
| `studyzone-minio` | `minio/minio:latest` | 9000 (S3 API) / 9001 (Console) |

数据卷：`postgres-data`、`redis-data`、`minio-data`，容器删除不影响数据。

---

## 二、常用命令

```bash
pnpm docker:up         # 后台启动所有服务
pnpm docker:down       # 关闭（保留数据卷）
pnpm docker:logs       # 跟随日志
```

清空数据从零开始：

```bash
docker compose -f infra/docker/docker-compose.yml down -v
pnpm docker:up
pnpm db:migrate
pnpm db:import
```

---

## 三、默认凭据

| 服务 | 凭据 |
|---|---|
| PostgreSQL | `studyzone / studyzone_dev`，DB `studyzone` |
| Redis | 无密码 |
| MinIO | `minioadmin / minioadmin`（Web Console http://localhost:9001） |

> 这些是开发默认值；任何对外可访问的环境**必须**改掉。

---

## 四、健康检查

Compose 配置了：

- Postgres：`pg_isready -U studyzone`
- Redis：`redis-cli ping`
- MinIO：`/minio/health/live`

可用 `docker ps` 查看 STATUS 列是否 `healthy`。

---

## 五、连接到容器

```bash
# 进入 Postgres
docker exec -it studyzone-postgres psql -U studyzone -d studyzone

# 进入 Redis
docker exec -it studyzone-redis redis-cli

# 进入 MinIO（mc 命令行）
docker run --rm --network host minio/mc \
  alias set local http://localhost:9000 minioadmin minioadmin
```

---

## 六、能不能用现有的 Postgres / Redis？

可以。把 `.env` 中 `DATABASE_URL` / `REDIS_URL` 指向已有实例，然后 `pnpm services:start --no-docker` 跳过启动 docker。

> 注意 schema 名称：默认连接串末尾 `?schema=public`；如果你的库用了不同 schema，请同步修改。

---

## 七、与 services:start 的关系

[`pnpm services:start`](../../scripts/start-services.mjs) 默认会先 `docker compose up -d`，再后台起 api / web / admin。
不想被它启 docker：`pnpm services:start --no-docker`（你需要自己保证 Postgres / Redis / MinIO 已就绪）。

---

## 八、相关文档

- [本地开发上手](../development/getting-started.md)
- [生产部署](./production.md)
