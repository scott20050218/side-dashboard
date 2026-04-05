# 门店经营看板（Dashboard）

多门店收支流水、经营概览、营收报表与审批（事务、收支修正申请）的 Web 应用。仓库为 **npm workspaces** 单体仓库：React 前端 + Express API + SQLite。

| 目录 | 说明 |
|------|------|
| [`front-end/`](front-end/) | Vite 6、React 19、Tailwind CSS 4、Recharts |
| [`server/`](server/) | Express 4、JWT、`better-sqlite3` |
| [`doc/`](doc/) | 权限与规划等补充文档 |

## 环境要求

- **Node.js** 建议当前 LTS（与 lockfile 一致即可）
- 本机需能编译 **better-sqlite3**（一般 macOS / Linux 开箱可用）

## 本地开发

在仓库根目录安装依赖并同时启动前后端：

```bash
npm install
npm run dev
```

- 前端：<http://localhost:3000>（开发模式下 `/api` 由 Vite 代理到后端）
- 后端：默认 <http://127.0.0.1:4000>，健康检查：<http://127.0.0.1:4000/health>

仅启动其一：

```bash
npm run dev:client    # 同 npm run dev -w front-end
npm run dev:server    # 同 npm run dev -w server
```

### 环境变量

**后端**（复制 [`server/.env.example`](server/.env.example) 为 `server/.env`）：

| 变量 | 说明 |
|------|------|
| `PORT` | 监听端口，默认 `4000` |
| `JWT_SECRET` | 签发 token 的密钥；未设置时使用不安全的开发默认值（控制台会警告） |
| `DATABASE_PATH` | SQLite 文件路径，相对路径相对于 `server/`；默认 `data/app.db` |
| `CORS_ORIGIN` | 允许的浏览器 Origin，逗号分隔；留空则开发时常用「反射请求 Origin」行为 |

**前端**（可选，复制 [`front-end/.env.example`](front-end/.env.example) 为 `front-end/.env`）：

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 生产构建后浏览器请求 API 的根地址；留空则使用与页面同源的 `/api` |
| `VITE_API_PROXY_TARGET` | 仅开发：Vite 将 `/api` 代理到的后端地址，默认 `http://127.0.0.1:4000` |

### 首次启动与演示账号

首次启动且数据库为空时，会写入种子角色、用户、门店与示例流水。**默认可登录**：`admin` / `123456`。种子里的 `cashier` 用户为 `inactive`，无法登录。

## 构建

```bash
npm run build          # 仅构建前端 → front-end/dist
npm run build:server   # 构建后端 → server/dist
```

生产环境前端若与 API 不同源，构建前请设置 `VITE_API_BASE_URL` 为完整 API 根地址（含协议与端口，无尾部斜杠问题由客户端拼接路径处理）。

## 部署与 CI

GitHub Actions（需配置 Secret `SSH_PRIVATE_KEY`）：

- [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml)：变更 `front-end/**` 或根 `package-lock.json` 时构建并 rsync `front-end/dist/` 到服务器目录（如 `/home/ubuntu/node/`）。
- [`.github/workflows/deploy-server.yml`](.github/workflows/deploy-server.yml)：变更 `server/**` 或根 `package-lock.json` 时 rsync `server/` 到如 `/home/ubuntu/server/`，远端 `npm ci --omit=dev` 并以 **pm2** 进程名 **`dashboard-server`** 启动或重载。

生产服务器在部署目录放置 `.env`（务必设置强随机 `JWT_SECRET`），勿提交仓库。数据库文件位于 `server/data/*.db`，已被 `.gitignore` 忽略。

### Nginx 示例

静态资源指向前端构建目录，API 反代到 Node：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 更多文档

- [`doc/user-guide.md`](doc/user-guide.md) — 终端用户使用手册（登录、门店、角色、各模块说明）
- [`doc/deploy-and-maintenance.md`](doc/deploy-and-maintenance.md) — 生产部署、CI、Nginx、pm2 与故障排查
- [`doc/store-boss-permissions.md`](doc/store-boss-permissions.md) — 门店老板 / 成员权限与数据隔离说明
- [`doc/plan.md`](doc/plan.md) — 产品与技术规划摘录
