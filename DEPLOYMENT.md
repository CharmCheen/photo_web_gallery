# 部署指南（本地验证 → 上云）

本文档用于指导本项目在本地验证并部署到云端。前端使用 Vite + React，后端使用 Node.js + Express。

---

## 1. 本地验证

### 1.1 后端（API）

> 建议使用 **CMD** 或 **PowerShell（已放开执行策略）** 运行 npm 脚本。

```bash
cd backend
npm install
npm run dev
```

默认端口：`http://localhost:4000`

健康检查：
- `GET http://localhost:4000/api/health`

## 3. 方案 A：同机部署（Nginx + PM2）

### 3.1 安装基础依赖

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 3.2 部署后端（PM2）

```bash
cd /var/www/lumina/backend
npm install
npm run build
```

设置环境变量（示例）：

```bash
export PORT=4000
export FRONTEND_ORIGIN=https://your-domain.com
export NODE_ENV=production
```

启动并守护：

```bash
pm2 start dist/server.js --name lumina-api
pm2 save
pm2 startup
```

### 3.3 部署前端（Nginx 静态站点）

```bash
cd /var/www/lumina/frontend
npm install
npm run build
```

将构建产物发布到 Nginx 站点目录（示例）：

```bash
sudo mkdir -p /var/www/lumina/www
sudo cp -r dist/* /var/www/lumina/www/
```

### 3.4 Nginx 配置（同域反向代理）

编辑 Nginx 站点配置：

```bash
sudo nano /etc/nginx/sites-available/lumina
```

示例配置：

```nginx
server {
   listen 80;
   server_name your-domain.com;

   root /var/www/lumina/www;
   index index.html;

   location / {
      try_files $uri /index.html;
   }

   location /api/ {
      proxy_pass http://127.0.0.1:4000/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
   }
}
```

启用站点并重载：

```bash
sudo ln -s /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/lumina
sudo nginx -t
sudo systemctl reload nginx
```

> 若启用 HTTPS，请使用 Certbot（可选）。如需我补充 SSL 配置，我可以继续完善。

---

## 4. 方案 B：前端在本地临时部署（后端上云）

### 4.1 后端同上（PM2）

保持后端部署不变，仅确保 `FRONTEND_ORIGIN` 包含你本地访问域名或 IP。

### 4.2 前端本地运行

本地 `.env.local` 指向云端后端：

```env
VITE_API_BASE_URL=https://your-domain.com
```

本地启动：

```bash
cd frontend
npm run dev
```

---
## 5. 其他可选项

- Docker 化部署（如需我可补充 Dockerfile 与 docker-compose）
- HTTPS（Certbot）自动续期
| 变量名 | 示例 | 说明 |
|---|---|---|
| VITE_API_BASE_URL | https://api.your-domain.com | 后端 API 地址 |
## 6. 常见问题
### 2.2 后端（Express）

| 变量名 | 示例 | 说明 |
|---|---|---|
| PORT | 4000 | 后端监听端口 |
| FRONTEND_ORIGIN | https://your-domain.com | 允许的前端域名（逗号分隔） |
| NODE_ENV | production | 生产环境下不返回短信验证码 |

---

## 3. 部署前端（静态站点）

### 方式 A：Vercel / Netlify

1. 构建命令：
   ```bash
   npm run build
   ```
2. 输出目录：`frontend/dist`
3. 配置环境变量：
   - `VITE_API_BASE_URL = https://你的后端域名`

### 方式 B：Nginx / 静态服务器

在本地构建：
```bash
cd frontend
npm run build
```

将 `frontend/dist` 上传至服务器并配置 Nginx 指向该目录。

---

## 4. 部署后端（Node.js）

### 方式 A：PM2（推荐）

```bash
cd backend
npm install
npm run build
pm2 start dist/server.js --name lumina-api
```

配置环境变量（示例）：
```bash
export PORT=4000
export FRONTEND_ORIGIN=https://your-domain.com
export NODE_ENV=production
```

### 方式 B：Docker（可选）

> 如需 Docker 化，我可以继续补充 Dockerfile 与 docker-compose。

---

## 5. 常见问题

### 5.1 前端请求失败 / CORS 报错

检查后端环境变量 `FRONTEND_ORIGIN` 是否包含前端域名。例如：
```
FRONTEND_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

### 5.2 短信验证码演示

- 本地环境会返回 `code` 字段用于联调。
- 生产环境会隐藏验证码（`NODE_ENV=production`）。

---

## 7. 部署检查清单

- [ ] 后端 API 已启动并可访问
- [ ] 前端 `VITE_API_BASE_URL` 指向后端
- [ ] 后端 CORS 允许前端域名
- [ ] 前端构建输出已部署

---

如需我继续提供 **Docker 化部署** 或 **CI/CD 工作流（GitHub Actions）**，直接告诉我即可。
