# 庞菠菠盲盒管理端

独立的 React + Vite + Three.js 管理前端。包含系列与款式编辑、权重概率模拟、素材管理、动作 QA、发布历史与回滚。它只通过 `/api/admin/blindbox/**` 与 Spring Boot 通信，不包含数据库连接或业务密钥。

```powershell
npm install
npm run dev
```

开发地址为 `http://localhost:4173/manage-app/`。Vite 会把 `/api` 和 `/manage` 代理到 `http://127.0.0.1:8080`，把 `/pangbobo` 代理到公开前端的 `http://127.0.0.1:3000`。

生产构建：

```powershell
npm run build
```

将 `dist/` 部署到网站的 `/manage-app/`，并把 `/api/` 反向代理到 Spring Boot。

## 安全与接口

- 所有请求携带 `credentials: include`，沿用 Spring Security 管理员 Session。
- 写请求先访问 `/api/admin/blindbox/session` 建立 CSRF Cookie，再将 `XSRF-TOKEN` 写入 `X-XSRF-TOKEN` 请求头。
- 收到 `401/403` 自动跳转 `/manage/login`，不会在浏览器保存管理员密码。
- 完整后端接口契约见 [API_CONTRACT.md](./API_CONTRACT.md)。
