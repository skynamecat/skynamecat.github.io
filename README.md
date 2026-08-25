# skynamecat 个人站

这是 skynamecat 的长期维护单仓库：极简/标准双模式前台、庞菠菠 3D 数字宠物、Spring Boot 对话服务与管理后台。

## 目录

```text
frontend/                 Next.js 静态前台
  app/                    页面与交互组件
  public/pangbobo/        线上使用的模型、贴图与精灵图
  tests/                  前端构建产物测试
backend/                  Spring Boot + PostgreSQL
  src/main/java/          API、对话规则、管理后台、请求追踪
  src/main/resources/     Thymeleaf 页面与 Flyway 数据库迁移
deploy/                   服务端发布、Nginx 和环境变量示例
assets/source/pangbobo-reference/
                          不直接上线的庞菠菠原始参考图、多视图素材
tools/pangbobo/           Blender/模型转换与动作制作脚本
docs/                     架构与维护文档
```

## 本地运行

前端：

```powershell
cd frontend
npm ci
npm run dev
```

后端使用 Java 21；本机 JDK 优先从 `C:\Users\skynamecat\.jdks` 查找：

```powershell
$env:JAVA_HOME='C:\Users\skynamecat\.jdks\corretto-21.0.7'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
cd backend
mvn spring-boot:run
```

数据库和管理员账号通过环境变量配置，参见 `deploy/backend.env.example`，不要把密码提交到 Git。

## 验证

```powershell
cd frontend
npm test

cd ..\backend
mvn test package
```

## 线上结构

- `/`：Nginx 直接提供 `frontend/out` 静态文件。
- `/api/`：反向代理到 Spring Boot。
- `/manage/`：对话和运行管理后台。
- `/manage/requests`：最近 200 次 API/后台用户操作；每次请求带 `X-Request-Id`，聊天请求可继续查看用户问题、回答、命中意图和置信度。

请求日志不保存 Cookie、密码、授权信息或 URL 查询参数，只记录链路编号、会话编号、方法、路径、状态、耗时、来源 IP、浏览器标识和时间。

## 发布

- GitHub Pages：推送 `snc-master` 后由 `.github/workflows/deploy-pages.yml` 构建 `frontend/`。
- 自有服务器：后端执行 `deploy/deploy-backend.sh`；前端使用 `deploy/deploy-frontend.ps1`。
