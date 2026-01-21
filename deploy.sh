#!/bin/bash
# Lumina 自动部署脚本（服务器端执行）
# 服务器 IP: 114.116.225.151

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  Lumina 自动部署脚本"
echo "  服务器: 114.116.225.151"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 1. 安装系统依赖
echo "📦 步骤 1/9: 安装系统依赖..."
sudo apt update
sudo apt install -y nginx gnupg curl

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

# 检查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo "📦 安装 MongoDB 7.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
       sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

echo "✅ 系统依赖安装完成"
echo ""

# 2. 创建上传目录
echo "📁 步骤 2/9: 创建上传目录..."
sudo mkdir -p /var/www/lumina/uploads
sudo mkdir -p /var/www/lumina/www
sudo chown -R $USER:$USER /var/www/lumina
sudo chmod 755 /var/www/lumina/uploads
echo "✅ 目录创建完成"
echo ""

# 3. 部署后端
echo "🔧 步骤 3/9: 部署后端..."
cd backend
echo "  → 安装依赖..."
npm install
echo "  → 构建项目..."
npm run build
echo "  → 启动 PM2..."
pm2 delete lumina-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "✅ 后端部署完成"
echo ""

# 4. 部署前端
echo "🎨 步骤 4/9: 部署前端..."
cd ../frontend
echo "  → 安装依赖..."
npm install
echo "  → 构建项目..."
npm run build
echo "  → 复制文件到 Nginx 目录..."
sudo cp -r dist/* /var/www/lumina/www/
sudo chown -R www-data:www-data /var/www/lumina/www
echo "✅ 前端部署完成"
echo ""

# 5. 配置 Nginx
echo "🌐 步骤 5/9: 配置 Nginx..."
sudo tee /etc/nginx/sites-available/lumina > /dev/null <<'EOF'
server {
    listen 80;
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
EOF

# 启用站点
sudo ln -sf /etc/nginx/sites-available/lumina /etc/nginx/sites-enabled/
echo "✅ Nginx 配置完成"
echo ""

# 6. 测试 Nginx 配置
echo "🔍 步骤 6/9: 测试 Nginx 配置..."
sudo nginx -t
echo "✅ Nginx 配置测试通过"
echo ""

# 7. 重载 Nginx
echo "🔄 步骤 7/9: 重载 Nginx..."
sudo systemctl reload nginx
echo "✅ Nginx 重载完成"
echo ""

# 8. 配置 PM2 开机自启
echo "⚙️  步骤 8/9: 配置 PM2 开机自启..."
pm2 startup | tail -n 1 | sudo bash || true
pm2 save
echo "✅ PM2 开机自启配置完成"
echo ""

# 最终检查
echo "=========================================="
echo "  部署完成！正在进行最终检查..."
echo "=========================================="
echo ""

echo "📊 PM2 状态："
pm2 status

echo ""
echo "🗄️  MongoDB 状态："
sudo systemctl status mongod --no-pager | head -n 3

echo ""
echo "🌐 Nginx 状态："
sudo systemctl status nginx --no-pager | head -n 3

echo ""
echo "🔍 后端健康检查："
sleep 2
curl -s http://localhost:4000/api/health || echo "⚠️  后端可能需要几秒启动时间"

echo ""
echo "=========================================="
echo "  ✅ 部署成功！"
echo "=========================================="
echo ""
echo "🌍 访问地址："
echo "   http://114.116.225.151"
echo ""
echo "📝 常用命令："
echo "   查看后端日志: pm2 logs lumina-backend"
echo "   重启后端: pm2 restart lumina-backend"
echo "   查看后端状态: pm2 status"
echo "   MongoDB 状态: sudo systemctl status mongod"
echo "   重载 Nginx: sudo systemctl reload nginx"
echo "   查看 Nginx 日志: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "⚠️  注意：使用 IP 地址访问时，浏览器可能显示'不安全'警告，这是正常的。"
echo ""
