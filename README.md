# Dashboard monorepo

- **`front-end/`** — Vite + React 看板
- **`server/`** — Express + SQLite + JWT API

## 本地开发

根目录安装并并行启动前后端：

```bash
npm install
npm run dev
```

- 前端：<http://localhost:3000>（`/api` 会代理到后端）
- 后端：默认 <http://127.0.0.1:4000>

后端环境变量见 [`server/.env.example`](server/.env.example)。首次启动会在 SQLite 中写入种子数据；默认登录 **`admin` / `123456`**（`cashier` 用户为 `inactive`，无法登录）。

前端可选：复制 [`front-end/.env.example`](front-end/.env.example) 为 `.env`，生产构建时设置 `VITE_API_BASE_URL` 指向 API 同源或绝对地址。

## 单独运行

```bash
npm run dev -w front-end
npm run dev -w server
```

## 构建

```bash
npm run build -w front-end
npm run build -w server   # 输出 server/dist
```

## GitHub Actions

- **`deploy-frontend.yml`**：`front-end/**` 或根 `package-lock.json` 变更时构建并 rsync `front-end/dist/` → 服务器 `/home/ubuntu/node/`
- **`deploy-server.yml`**：`server/**` 或根 `package-lock.json` 变更时构建并 rsync `server/` → `/home/ubuntu/server/`，远端执行 `npm ci --omit=dev` 并用 **pm2** 进程名 **`dashboard-server`** 启动或重载

需配置 Secret：`SSH_PRIVATE_KEY`。

生产服务器请在 `/home/ubuntu/server` 放置 `.env`（含 `JWT_SECRET` 等），勿提交仓库。数据库文件在 `server/data/*.db`，已被 `.gitignore` 忽略。

## Nginx 建议

静态站点指向 `/home/ubuntu/node`，API 反代到 Node 端口，例如：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
