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
      MAIL_HOST: 'smtp.qq.com',
      MAIL_PORT: 587,
      MAIL_SECURE: false,
      MAIL_USER: '1291473409@qq.com',
      MAIL_PASS: 'ehopbymgbdsdbagg',
      MAIL_FROM_ADDRESS: '1291473409@qq.com',
      MAIL_FROM_NAME: 'Lumina',
      MAIL_BRAND_NAME: 'Lumina'
    }
  }]
};



