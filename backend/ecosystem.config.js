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
      UPLOAD_DIR: '/var/www/lumina/uploads',
      FILE_URL_PREFIX: 'http://114.116.225.151/uploads'
    }
  }]
};
