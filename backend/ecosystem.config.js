// PM2 配置文件
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
      MONGODB_URI: 'mongodb://localhost:27017/lumina',
      UPLOAD_DIR: '/var/www/lumina/uploads',
      FILE_URL_PREFIX: 'http://114.116.225.151/uploads',
      // 邮件服务配置（使用你的 SMTP 服务）
      MAIL_HOST: 'smtp.example.com',       // SMTP 服务器地址
      MAIL_PORT: '587',                     // SMTP 端口
      MAIL_SECURE: 'false',                 // 是否使用 SSL（465 端口设为 true）
      MAIL_USER: 'your-email@example.com',  // 发件邮箱账号
      MAIL_PASS: 'your-email-password',     // 邮箱密码或授权码
      MAIL_FROM_ADDRESS: 'noreply@example.com', // 发件人地址
      MAIL_FROM_NAME: 'Lumina',             // 发件人名称
      MAIL_BRAND_NAME: 'Lumina'             // 邮件中显示的品牌名
    }
  }]
};
