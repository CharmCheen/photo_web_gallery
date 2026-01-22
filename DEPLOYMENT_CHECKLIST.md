# 远程部署配置清单

## 📋 你的服务器信息

- **服务器 IP**：`114.116.225.151`
- **访问地址**：`http://114.116.225.151`
- **协议**：HTTP（暂无 HTTPS，因为使用 IP 地址）

---

## 🔧 已配置完成的文件

所有配置文件已经使用你的 IP 地址更新完毕，无需再手动修改：

✅ `frontend/.env.production` → `http://114.116.225.151`  
✅ `backend/ecosystem.config.js` → `http://114.116.225.151`  
✅ `backend/.env.example` → `http://114.116.225.151`


## 📦 部署前必须修改的配置

### 1. 前端配置

#### 文件：`frontend/.env.production`（已配置）

```env
# ✅ 已配置为你的服务器 IP
VITE_API_BASE_URL=http://114.116.225.151
```

**作用**：告诉前端去哪里请求后端 API

#### 完整的前端环境文件说明

项目使用三种前端环境配置文件，根据场景选择：

1. **`frontend/.env.local`**（开发 + 生产通用）
  - 当前配置：`VITE_API_BASE_URL=http://114.116.225.151`
  - 用途：本地开发或紧急测试
  - 优先级：最高（覆盖其他配置）
  - ⚠️ 注意：不要提交到 Git，已添加到 .gitignore

2. **`frontend/.env.development`**（开发环境）
  - 预期配置：`VITE_API_BASE_URL=http://localhost:4000`
  - 用途：本地 npm run dev 开发
  - 在 `frontend/.env.local` 不存在时使用

3. **`frontend/.env.production`**（生产环境）
  - 预期配置：`VITE_API_BASE_URL=http://114.116.225.151`
  - 用途：运行 npm run build 构建时使用
  - 在 `frontend/.env.local` 不存在时使用

**优先级顺序**（从高到低）：`.env.local` > `.env.development/.env.production` > 代码默认值

---

### 2. 后端配置

#### 方式 A：使用 PM2 配置文件（推荐，已配置）

文件：`backend/ecosystem.config.js`

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
      
      // ✅ 已配置为你的服务器 IP
      FRONTEND_ORIGIN: 'http://114.116.225.151',
      
      UPLOAD_DIR: '/var/www/lumina/uploads',
      
      // ✅ 已配置为你的服务器 IP
      FILE_URL_PREFIX: 'http://114.116.225.151/uploads'
    }
  }]
};
```

#### 方式 B：使用 .env 文件（已配置示例）

文件：`backend/.env.example`（复制为 `.env` 使用）

```env
PORT=4000

# ✅ 已配置为你的服务器 IP
FRONTEND_ORIGIN=http://114.116.225.151

NODE_ENV=production

UPLOAD_DIR=/var/www/lumina/uploads

# ✅ 已配置为你的服务器 IP
FILE_URL_PREFIX=http://114.116.225.151/uploads
```

---

### 3. Nginx 配置

编辑 `/etc/nginx/sites-available/lumina`：

```nginx
server {
    listen 80;
    
    # ✅ 使用你的服务器 IP
    server_name 114.116.225.151;

    root /var/www/lumina/www;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

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

    location /uploads/ {
        alias /var/www/lumina/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
```

---

## 🔍 配置验证

### 1. 本地验证（部署前）

#### 检查前端环境变量：

```bash
cd frontend
cat .env.production
# 确认 VITE_API_BASE_URL 已修改
```

#### 检查后端配置：

```bash
cd backend
cat ecosystem.config.js
# 确认 FRONTEND_ORIGIN 和 FILE_URL_PREFIX 已修改
```

---

### 2. 服务器验证（部署后）

#### 检查后端是否运行：

```bash
curl http://localhost:4000/api/health
# 应返回：{"status":"ok"}
```

#### 检查前端文件是否部署：

```bash
ls -la /var/www/lumina/www
# 应看到 index.html 和 assets 目录
```

#### 检查 Nginx 配置：

```bash
sudo nginx -t
# 应返回：syntax is ok
```

#### 检查 PM2 状态：

```bash
pm2 status
# 应看到 lumina-backend 状态为 online
```

---

## ⚠️ 常见错误

### 错误 1：CORS 跨域错误

**现象**：浏览器控制台显示 `Access-Control-Allow-Origin` 错误

**原因**：后端 `FRONTEND_ORIGIN` 配置不正确

**解决**：
```bash
# 修改 ecosystem.config.js 中的 FRONTEND_ORIGIN
pm2 restart lumina-backend --update-env
```

---

### 错误 2：API 请求 404

**现象**：前端显示"请求失败"，后端返回 404

**原因**：前端 API 地址配置错误

**解决**：
1. 检查 `frontend/.env.production` 中的 `VITE_API_BASE_URL`
2. 确保使用了正确的协议（http/https）
3. 重新构建前端：`npm run build`

---

### 错误 3：上传文件失败

**现象**：上传照片时报错

**原因**：上传目录权限不足

**解决**：
```bash
sudo mkdir -p /var/www/lumina/uploads
sudo chown -R $USER:$USER /var/www/lumina/uploads
sudo chmod 755 /var/www/lumina/uploads
```

---

### 错误 4：Nginx 启动失败

**现象**：`nginx -t` 报错

**原因**：配置文件语法错误

**解决**：
```bash
# 检查配置
sudo nginx -t

# 查看详细错误
sudo journalctl -xe -u nginx

# 恢复默认配置
sudo rm /etc/nginx/sites-enabled/lumina
sudo systemctl reload nginx
```

---

## 📝 部署步骤快速参考（针对 114.116.225.151）

```bash
# 1. 在服务器创建目录
sudo mkdir -p /var/www/lumina

# 2. 上传代码到服务器（选择以下方式之一）

#### 方式 A：使用 PowerShell（Windows）

创建或使用 `upload.ps1` 脚本（已预置）：

```powershell
# 在项目根目录执行此命令
.\upload.ps1
```

#### 方式 B：使用 SCP（Windows 或 Mac/Linux）

```bash
scp -r d:\CODE_WORLD\photo_establish root@114.116.225.151:/var/www/lumina
```

#### 方式 C：使用 Git Clone（推荐）

先将项目推送到 Git 仓库，然后在服务器执行：

```bash
cd /var/www
git clone https://your-repo.git lumina
cd lumina
```

#### ⚠️ 上传前清单

**不需要上传的文件/目录**（会自动生成或已在 .gitignore 中排除）：
- ❌ `node_modules/` - npm 会在服务器重新安装
- ❌ `dist/` - 构建产物，服务器会重新构建
- ❌ `.env.local` - 本地开发配置
- ❌ `.git/` - 仅使用 Git Clone 方式时包含

**必须上传的文件**：
- ✅ 源代码目录（`backend/src/`, `frontend/src/`）
- ✅ 配置文件（package.json, tsconfig.json, vite.config.ts）
- ✅ 环境示例（.env.example）
- ✅ 部署脚本（deploy.sh, ecosystem.config.js）
- ✅ 文档文件（DEPLOYMENT.md, README.md）

# 3. 配置文件已自动配置完成（无需手动修改）
# ✅ frontend/.env.production → http://114.116.225.151
# ✅ backend/ecosystem.config.js → http://114.116.225.151

# 4. 部署后端
cd /var/www/lumina/backend
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 5. 部署前端
cd /var/www/lumina/frontend
npm install
npm run build
sudo mkdir -p /var/www/lumina/www
sudo cp -r dist/* /var/www/lumina/www/

# 6. 配置 Nginx（需手动创建配置文件）
sudo nano /etc/nginx/sites-available/lumina
# 粘贴 Nginx 配置（见上方第 3 节）

sudo ln -s /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. 创建上传目录
sudo mkdir -p /var/www/lumina/uploads
sudo chown -R $USER:$USER /var/www/lumina/uploads
sudo chmod 755 /var/www/lumina/uploads
```

---

## 🎯 你的配置（IP 地址模式）

✅ **已自动配置完成**：

```env
# frontend/.env.production
VITE_API_BASE_URL=http://114.116.225.151

# backend/ecosystem.config.js
FRONTEND_ORIGIN: 'http://114.116.225.151'
FILE_URL_PREFIX: 'http://114.116.225.151/uploads'
```

⚠️ **注意**：使用 IP 地址时：
- ✅ 无需购买域名，直接部署
- ⚠️ 无法配置 HTTPS（需要域名才能申请证书）
- ⚠️ 浏览器可能显示"不安全"警告（这是正常的）
- ⚠️ 某些浏览器功能可能受限（如地理定位、摄像头等）
- 💡 未来如购买域名，只需修改配置文件即可升级到 HTTPS

---

## ✅ 完整测试检查

1. **访问首页**：`http://114.116.225.151` 能否正常打开
2. **注册功能**：发送短信验证码 → 注册成功
3. **登录功能**：使用手机号验证码登录
4. **上传照片**：选择照片 → 填写描述 → 上传成功
5. **浏览照片**：能看到刚上传的照片
6. **查看大图**：点击照片能打开 Lightbox

全部通过后，部署成功！🎉
