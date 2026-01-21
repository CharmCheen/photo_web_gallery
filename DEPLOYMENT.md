# 部署指南（远程服务器部署）

本文档用于指导项目部署到远程 Linux 服务器。前端使用 Vite + React，后端使用 Node.js + Express。

---

## 1. 部署前准备

### 1.1 修改前端配置

创建生产环境配置文件 `frontend/.env.production`：

```env
# 替换为你的服务器域名或 IP
VITE_API_BASE_URL=https://your-domain.com
```

### 1.2 修改后端配置

复制并修改环境变量文件：

```bash
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
PORT=4000
FRONTEND_ORIGIN=http://114.116.225.151
NODE_ENV=production
UPLOAD_DIR=/var/www/lumina/uploads
FILE_URL_PREFIX=http://114.116.225.151/uploads
```

或使用 PM2 配置文件 `backend/ecosystem.config.js`（已创建）：

```javascript
module.exports = {
  apps: [{
    name: 'lumina-backend',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      FRONTEND_ORIGIN: 'http://114.116.225.151',
      UPLOAD_DIR: '/var/www/lumina/uploads',
      FILE_URL_PREFIX: 'http://114.116.225.151/uploads'
    }
  }]
};
```

---

## 2. 上传代码到服务器

### 方式 A：使用 Git（推荐）

```bash
# 在服务器上
cd /var/www
git clone https://your-repo-url.git lumina
cd lumina
```

### 方式 B：使用 SCP/SFTP

```bash
# 在本地
scp -r ./photo_establish root@114.116.225.151:/var/www/lumina
```

---

## 3. 服务器环境配置

### 3.1 安装基础依赖

```bash
# 更新包管理器
sudo apt update

# 安装 Nginx
sudo apt install -y nginx

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2
```

---

## 4. 部署后端

### 4.1 构建后端

```bash
cd /var/www/lumina/backend
npm install
npm run build
```

### 4.2 创建上传目录

```bash
sudo mkdir -p /var/www/lumina/uploads
sudo chown -R $USER:$USER /var/www/lumina/uploads
sudo chmod 755 /var/www/lumina/uploads
```

### 4.3 启动后端服务

使用 PM2 配置文件启动：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

或直接启动（需先设置环境变量）：

```bash
pm2 start dist/server.js --name lumina-backend \
  --env NODE_ENV=production \
  --env PORT=4000 \
  --env FRONTEND_ORIGIN=https://your-domain.com \
  --env UPLOAD_DIR=/var/www/lumina/uploads \
  --env FILE_URL_PREFIX=https://your-domain.com/uploads

pm2 save
pm2 startup
```

验证后端运行：

```bash
curl http://localhost:4000/api/health
# 应返回: {"status":"ok"}
```

---

## 5. 部署前端

### 5.1 构建前端

```bash
cd /var/www/lumina/frontend
npm install
npm run build
```

### 5.2 部署静态文件

```bash
sudo mkdir -p /var/www/lumina/www
sudo cp -r dist/* /var/www/lumina/www/
sudo chown -R www-data:www-data /var/www/lumina/www
```

---

## 6. Nginx 配置

### 6.1 创建 Nginx 站点配置

```bash
sudo nano /etc/nginx/sites-available/lumina
```

### 6.2 HTTP 配置（基础版）

```nginx
server {
    listen 80;
    server_name 114.116.225.151;

    # 前端静态文件
    root /var/www/lumina/www;
    index index.html;

    # 前端路由
    location / {
        try_files $uri /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传文件访问
    location /uploads/ {
        alias /var/www/lumina/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 客户端最大上传文件大小
    client_max_body_size 10M;
}
```

### 6.3 启用站点

```bash
sudo ln -s /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. HTTPS 配置（可选 - 需要域名）

⚠️ **注意**：由于使用 IP 地址访问，无法配置 HTTPS。如果未来购买域名，可以按以下步骤配置：

### 7.1 安装 Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 申请 SSL 证书（需要域名）

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 8. 验证部署

### 8.1 检查后端运行状态

```bash
pm2 status
# 应看到 lumina-backend 状态为 online

curl http://localhost:4000/api/health
# 应返回：{"status":"ok"}
```

### 8.2 检查 Nginx 配置

```bash
sudo nginx -t
# 应返回：syntax is ok

sudo systemctl status nginx
# 应显示 active (running)
```

### 8.3 访问网站

浏览器打开：`http://114.116.225.151`

---

## 9. 常见问题

### 9.1 CORS 错误

确保后端 `FRONTEND_ORIGIN` 配置正确：

```bash
pm2 restart lumina-backend --update-env
```

### 9.2 上传文件失败

检查上传目录权限：

```bash
sudo chmod 755 /var/www/lumina/uploads
sudo chown -R $USER:$USER /var/www/lumina/uploads
```

### 9.3 API 404 错误

确认 Nginx 配置中 `proxy_pass` 路径正确：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;  # 注意末尾的 /api/
}
```

---

## 10. 环境变量说明

### 10.1 前端环境变量

| 变量名 | 示例 | 说明 |
|---|---|---|
| VITE_API_BASE_URL | https://your-domain.com | 后端 API 地址 |

### 10.2 后端环境变量

| 变量名 | 示例 | 说明 |
|---|---|---|
| PORT | 4000 | 后端监听端口 |
| FRONTEND_ORIGIN | http://114.116.225.151 | 允许的前端域名（多个用逗号分隔） |
| NODE_ENV | production | 生产环境（不返回短信验证码明文） |
| UPLOAD_DIR | /var/www/lumina/uploads | 文件上传存储目录 |
| FILE_URL_PREFIX | http://114.116.225.151/uploads | 文件访问 URL 前缀 |

---

## 11. 本地验证（可选）

### 11.1 后端本地运行

```bash
cd backend
npm install
npm run dev
```

默认：`http://localhost:4000`

### 11.2 前端本地运行

创建 `frontend/.env.development`：

```env
VITE_API_BASE_URL=http://localhost:4000
```

启动：

```bash
cd frontend
npm install
npm run dev
```

默认：`http://localhost:3000`

---

## 12. 完整部署检查清单

- [ ] 修改 `frontend/.env.production` 中的 API 地址
- [ ] 修改 `backend/ecosystem.config.js` 中的环境变量
- [ ] 上传代码到服务器
- [ ] 安装 Nginx + Node.js + PM2
- [ ] 构建并启动后端（PM2）
- [ ] 创建上传目录并设置权限
- [ ] 构建并部署前端静态文件
- [ ] 配置 Nginx 反向代理
- [ ] 申请 SSL 证书（HTTPS）
- [ ] 测试所有功能（注册、登录、上传、浏览）

---

完成以上步骤后，访问 `http://114.116.225.151` 即可使用完整功能。

⚠️ **注意**：由于使用 IP 地址 + HTTP （非 HTTPS），浏览器可能会显示“不安全”警告，这是正常现象。如果未来购买域名，可以配置 HTTPS 证书。

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
| VITE_API_BASE_URL | http://114.116.225.151 | 后端 API 地址 |
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
