# 庞菠菠管理端

独立的 React + Three.js 管理前端。它只通过 `/api/admin/**` 与 Spring Boot 通信，不包含数据库连接或业务密钥。

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
