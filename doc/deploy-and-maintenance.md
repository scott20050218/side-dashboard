# 部署与维护手册

本文说明门店看板（Dashboard）在 **生产环境** 的架构约定、首次上线步骤、GitHub Actions 自动部署、日常维护与常见问题。与 [`README.md`](../README.md) 中的开发说明互补。

---

## 1. 架构与目录约定

| 组件 | 说明 |
|------|------|
| 前端 | Vite 构建产物静态文件，部署目录示例：`/home/ubuntu/node/` |
| 后端 | Node.js + Express，监听默认 **`PORT`（如 4000）**，工作目录示例：`/home/ubuntu/server/` |
| 数据库 | **SQLite** 单文件，路径由 `DATABASE_PATH` 指定（相对路径相对于 `server/` 根目录） |
| 反向代理 | **Nginx**：静态资源直出，`/api/` 反代到本机 Node |

当前 CI 工作流中写死的部署目标为 **`ubuntu@51.20.192.16`**；更换服务器 IP 或用户时，需同步修改 [`.github/workflows/deploy-server.yml`](../.github/workflows/deploy-server.yml) 与 [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)。

---

## 2. 服务器首次准备

### 2.1 软件与环境

- **Node.js**：建议与 CI 一致（工作流使用 **Node 22**），便于排查与本地行为一致。
- **pm2**：用于托管 `dashboard-server` 进程（工作流依赖 `pm2 reload` / `pm2 start`）。
- **Nginx**（推荐）：TLS、静态站点、`/api` 反代。
- **编译工具链**：`better-sqlite3` 为原生模块，若 `npm install` 需本机编译，请安装对应 build 依赖（如 `build-essential`、`python3` 等，视发行版而定）。

### 2.2 目录

```bash
sudo mkdir -p /home/ubuntu/node /home/ubuntu/server
sudo chown -R ubuntu:ubuntu /home/ubuntu/node /home/ubuntu/server
```

首次部署后，前端文件出现在 `node/`，后端代码与 `dist/` 出现在 `server/`。

### 2.3 后端环境变量

在 **`/home/ubuntu/server/.env`** 创建配置（**勿提交 Git**；rsync 会 **排除 `.env`**，避免覆盖服务器配置）。

模板见 [`server/.env.example`](../server/.env.example)：

| 变量 | 说明 |
|------|------|
| `PORT` | HTTP 监听端口，默认 `4000` |
| `JWT_SECRET` | **生产必须**设为足够长的随机串；未设置时进程会警告并使用不安全默认值 |
| `DATABASE_PATH` | 如 `./data/app.db`，数据库文件位于 `server/data/` 下（进程启动时会创建目录） |
| `CORS_ORIGIN` | 浏览器跨域：多个 Origin 用英文逗号分隔；留空时行为与 `cors` 包默认一致（开发友好，生产可按域名收紧） |

应用会从 **`server` 部署目录** 解析 `.env`（与进程 `cwd` 无关），见 `server/src/index.ts` 中的 `dotenv.config`。

### 2.4 GitHub Actions

在仓库 **Settings → Secrets and variables → Actions** 中配置：

- **`SSH_PRIVATE_KEY`**：可 SSH 登录部署用户的 **私钥**（对应服务器 `~/.ssh/authorized_keys` 中的公钥）。

推送至 `main` 且满足路径过滤时才会触发部署（见下文）；也可在 Actions 界面 **手动运行** workflow。

### 2.5 Nginx（前端 + API）

前端 **`root`** 指向静态目录（如 `/home/ubuntu/node`），**`/api/`** 反代到 Node：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /home/ubuntu/node;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**同域部署**时，前端构建可 **不设置** `VITE_API_BASE_URL`，由浏览器请求相对路径 `/api/...`，经 Nginx 转到后端。  
**前后端不同域**时，构建前需设置 `VITE_API_BASE_URL` 为 API 根地址（见 [`front-end/.env.example`](../front-end/.env.example)）。

配置检查与重载：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2.6 首次启动后端（可选手动验证）

```bash
cd /home/ubuntu/server
# 依赖安装见第 4 节说明
node dist/index.js
```

正常应打印 `API listening on http://127.0.0.1:4000`。确认无误后再交给 pm2：

```bash
cd /home/ubuntu/server
pm2 start dist/index.js --name dashboard-server --cwd /home/ubuntu/server
pm2 save
```

---

## 3. 自动部署（GitHub Actions）

### 3.1 触发条件

均需推送到 **`main`**：

| Workflow | 路径过滤 | 说明 |
|----------|-----------|------|
| [Deploy frontend](../.github/workflows/deploy-frontend.yml) | `front-end/**` 或根目录 `package-lock.json` | 根目录 `npm ci` + `npm run build -w front-end`，将 `front-end/dist/` **rsync** 到 `/home/ubuntu/node/`（`--delete`） |
| [Deploy server](../.github/workflows/deploy-server.yml) | `server/**` 或根目录 `package-lock.json` | 根目录构建 `server`，将 `./server/` rsync 到 `/home/ubuntu/server/`，SSH 远端执行 `npm ci --omit=dev` 与 pm2 |

二者均支持 **`workflow_dispatch`**：在 GitHub **Actions** 中选择对应 workflow **Run workflow**。

### 3.2 服务端 rsync 排除项（后端）

后端同步时 **不会覆盖**：

- `node_modules`
- **`.env`**
- **`*.db`**（SQLite 数据文件）

因此生产数据库与密钥仅保留在服务器上。

### 3.3 查看部署结果

在仓库 **Actions** 打开最近一次运行，展开各 Step 日志；失败时常见为 SSH、rsync、远端 `npm ci` 或 pm2 不可用。

---

## 4. `npm ci` 与 monorepo lockfile

**`npm ci`** 要求当前目录存在与 `package.json` 一致的 **`package-lock.json`**。

本仓库 **仅在根目录** 有 `package-lock.json`（npm workspaces），**`server/` 目录内默认没有独立 lockfile**。若远端 `/home/ubuntu/server` 下 **`npm ci --omit=dev` 报错**，可临时：

```bash
cd /home/ubuntu/server
npm install --omit=dev
pm2 reload dashboard-server --update-env
```

长期可在 CI 中增加一步：将根目录 `package-lock.json` 一并 rsync 到服务器 `server/` 目录（或改为在服务器上克隆整仓再安装），以便严格使用 `npm ci`。

---

## 5. 日常维护

### 5.1 进程与日志

```bash
pm2 list
pm2 logs dashboard-server --lines 100
pm2 reload dashboard-server --update-env   # 改 .env 或新 dist 后
```

### 5.2 健康检查

```bash
curl -s http://127.0.0.1:4000/health
```

预期返回 JSON：`{"ok":true}`。

### 5.3 数据库备份与恢复

- 备份：定期复制 **`DATABASE_PATH`** 指向的文件（部署在默认配置下多为 `server/data/app.db`）。备份前可减少写入风险：短暂停服务或使用 SQLite 在线备份工具（按运维规范执行）。
- 恢复：停进程 → 覆盖 `.db` 文件 → 启动进程。注意文件权限与用户。

### 5.4 变更 `JWT_SECRET`

修改 `.env` 后执行 `pm2 reload dashboard-server --update-env`。**已有用户**的 token 将失效，需重新登录。

### 5.5 迁移与升级

SQLite 表结构迁移在 **进程启动、打开数据库时** 执行（见 `server/src/db.ts`）。升级后 **重启** `dashboard-server` 即可；若文档另有要求（如完全停库），以文档为准。

---

## 6. 故障排查

| 现象 | 可能原因 | 处理方向 |
|------|-----------|----------|
| 4000 端口无监听 / 反复重启 | 启动期抛错（依赖、SQLite、种子数据逻辑等） | `pm2 logs dashboard-server`；在 `server` 目录执行 `node dist/index.js` 看完整栈 |
| 日志出现 `JWT_SECRET is not set` | `.env` 未生效或未配置 | 确认 `/home/ubuntu/server/.env` 存在且含 `JWT_SECRET=`；重启 pm2 |
| `UNIQUE constraint failed: roles.name` | 旧版本在「仅有角色、无用户」等边界下种子与迁移冲突 | 使用已修复的 `server` 代码重新部署（种子对角色使用 `INSERT OR IGNORE`） |
| 前端能开、接口 404 或跨域 | Nginx 未反代 `/api` 或 `VITE_API_BASE_URL` 与线上域名不一致 | 检查 Nginx `location /api/`；同域部署时构建勿误设 API 基址 |
| CI 成功但站点未更新 | 看错环境或 CDN/浏览器缓存 | 确认域名指向当前机器；前端 rsync 使用 `--delete`，可强刷或清缓存 |

权限与门店数据隔离的业务说明见 [`store-boss-permissions.md`](store-boss-permissions.md)。

---

## 7. 安全清单（生产）

- [ ] `JWT_SECRET` 为强随机串，且仅存在于服务器 `.env`
- [ ] `.env`、`.db` 未进入版本库（已在 `.gitignore` 中忽略常见路径）
- [ ] SSH 使用密钥，限制登录用户与 `authorized_keys`
- [ ] Nginx 启用 **HTTPS**（Let’s Encrypt 等）
- [ ] 按需收紧 `CORS_ORIGIN`，避免误配为过于宽松的生产策略
- [ ] 定期备份 SQLite，并验证恢复流程

---

## 8. 相关文件索引

- [README.md](../README.md) — 本地开发、环境变量总览
- [`server/.env.example`](../server/.env.example)
- [`front-end/.env.example`](../front-end/.env.example)
- [`.github/workflows/deploy-server.yml`](../.github/workflows/deploy-server.yml)
- [`.github/workflows/deploy-frontend.yml`](../.github/workflows/deploy-frontend.yml)
