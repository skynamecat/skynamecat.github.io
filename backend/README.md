# TestProject 后台部署

该目录包含 Spring Boot 后台。主站仍是 `/www/wwwroot/testProject` 下的静态文件；后台部署在 `/opt/testproject/backend`，避免源代码出现在网站根目录。Nginx 只将 `/manage/` 和 `/api/` 转发给监听在 `127.0.0.1:8080` 的后台。

## 路由

| 地址 | 服务 |
| --- | --- |
| `http://47.239.74.87:21114/` | 静态主站 |
| `http://47.239.74.87:21114/manage/` | Thymeleaf + HTMX 管理后台 |
| `http://47.239.74.87:21114/api/` | 对话 API |

## 首次准备

以下命令需要在服务器上执行。真实密码只保存在服务器，不要放进 Git：

```bash
install -d -m 700 /etc/testproject
install -m 600 /opt/testproject/deploy/backend.env.example \
  /etc/testproject/backend.env
nano /etc/testproject/backend.env
```

必须替换 `DB_PASSWORD` 和 `MANAGE_PASSWORD`。管理密码建议使用密码管理器生成至少 24 位的随机值。数据库仍通过 `127.0.0.1:5432` 访问，不需要开放 PostgreSQL 公网端口。

## 启动与更新

在确认 `/etc/testproject/backend.env` 权限为 `600` 后运行：

```bash
cd /opt/testproject
bash deploy/deploy-backend.sh
```

脚本会构建 Java 21 镜像、启动 Compose 服务并等待健康检查通过。容器使用 host network 访问只监听本机的 PostgreSQL，但 Spring Boot 自身也被强制绑定到 `127.0.0.1:8080`，公网只能通过 Nginx 分流访问。

## Nginx 分流

参考 [`deploy/nginx-testproject.conf.example`](../deploy/nginx-testproject.conf.example) 合并宝塔生成的站点配置。不要直接覆盖证书验证 include。修改后先检查再平滑重载：

```bash
nginx -t
systemctl reload nginx
```

## 验证与排错

```bash
PUBLIC_ORIGIN=http://47.239.74.87:21114 bash deploy/verify-deployment.sh
cd backend && docker compose ps
cd backend && docker compose logs --tail=120 backend
```

如果后台不可用，静态主站仍由 Nginx 独立提供；只有 `/manage/` 和 `/api/` 会受影响。
