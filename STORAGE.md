# 数据存储方案说明

## 📦 当前存储架构

### 1. 用户信息 → MongoDB 数据库

**存储位置**：MongoDB 数据库 `lumina.users` 集合

**存储内容**：
- 用户 ID（自动生成）
- 用户名
- 手机号（唯一索引）
- 邮箱（唯一索引，可选）
- 密码（可选，实际应加密）
- 头像 URL
- 个人简介
- 创建时间、更新时间

**数据模型**：[backend/src/models.ts](backend/src/models.ts) - `UserSchema`

---

### 2. 照片元数据 → MongoDB 数据库

**存储位置**：MongoDB 数据库 `lumina.photos` 集合

**存储内容**：
- 照片 ID（自动生成）
- 照片 URL（指向文件存储位置）
- 宽度、高度
- 作者名称、作者 ID
- 点赞数
- 描述
- 标签数组
- 创建时间、更新时间

**数据模型**：[backend/src/models.ts](backend/src/models.ts) - `PhotoSchema`

---

### 3. 照片文件 → 本地磁盘存储

**存储位置**：`/var/www/lumina/uploads/` 目录

**文件命名**：`photo-{timestamp}-{random}.{ext}`  
例如：`photo-1737456789012-123456789.jpg`

**访问方式**：通过 Nginx 静态文件服务  
URL：`http://114.116.225.151/uploads/photo-xxx.jpg`

**配置文件**：
- Multer 配置：[backend/src/server.ts](backend/src/server.ts#L36-L46)
- Nginx 配置：`/etc/nginx/sites-available/lumina`

---

### 4. 短信验证码 → MongoDB 数据库（临时）

**存储位置**：MongoDB 数据库 `lumina.smscodes` 集合

**存储内容**：
- 手机号
- 验证码（6位数字）
- 过期时间（5分钟后自动删除）

**TTL 索引**：自动删除过期数据，无需手动清理

---

## 🚀 数据持久化保证

### ✅ 已实现的持久化

1. **用户注册信息**：永久保存在 MongoDB
2. **用户登录信息**：查询 MongoDB，无需重复注册
3. **上传的照片**：
   - 文件保存在服务器磁盘
   - 元数据保存在 MongoDB
4. **短信验证码**：临时存储，5分钟后自动失效

### ❌ 之前的问题（已解决）

**旧方案**：使用内存 Map 存储
- ❌ 服务器重启后数据丢失
- ❌ 无法持久化用户信息
- ❌ 照片只是临时数据

**新方案**：MongoDB + 磁盘存储
- ✅ 数据永久保存
- ✅ 服务器重启后数据保留
- ✅ 支持数据备份和恢复

---

## 📊 数据库连接配置

### MongoDB 连接字符串

```env
# 本地 MongoDB
MONGODB_URI=mongodb://localhost:27017/lumina

# 远程 MongoDB（如果使用云数据库）
# MONGODB_URI=mongodb://username:password@host:port/lumina
```

**配置文件位置**：
- [backend/.env.example](backend/.env.example)
- [backend/ecosystem.config.js](backend/ecosystem.config.js)

---

## 🔧 数据管理命令

### 查看 MongoDB 数据

```bash
# 连接 MongoDB
mongosh

# 切换到 lumina 数据库
use lumina

# 查看所有用户
db.users.find().pretty()

# 查看所有照片
db.photos.find().pretty()

# 查看验证码（包含过期的）
db.smscodes.find().pretty()

# 统计数据
db.users.countDocuments()
db.photos.countDocuments()
```

### 备份 MongoDB 数据

```bash
# 备份整个数据库
mongodump --db lumina --out /backup/lumina-$(date +%Y%m%d)

# 恢复数据库
mongorestore --db lumina /backup/lumina-20260121/lumina
```

### 清理照片文件

```bash
# 查看上传文件大小
du -sh /var/www/lumina/uploads

# 列出所有照片文件
ls -lh /var/www/lumina/uploads

# 删除所有照片（慎用）
# rm -rf /var/www/lumina/uploads/*
```

---

## 🌩️ 云存储升级方案（可选）

### 为什么升级到云存储？

当前方案使用**本地磁盘存储**，适合小规模使用。如果用户量增大或需要更高可用性，建议升级到云存储：

#### 本地存储的限制：
- ❌ 服务器磁盘空间有限（256GB）
- ❌ 无法自动扩容
- ❌ 单点故障风险
- ❌ 带宽受服务器限制

#### 云存储的优势：
- ✅ 无限存储空间（按需付费）
- ✅ CDN 加速，全球访问快
- ✅ 高可用性（99.9%+）
- ✅ 自动备份和容灾

---

### 推荐云存储方案

#### 1. 阿里云 OSS（对象存储）

**价格**：约 ¥0.12/GB/月（标准存储）

**适用场景**：国内用户访问

**集成步骤**：
```bash
# 安装 SDK
npm install ali-oss

# 配置环境变量
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your-key
OSS_ACCESS_KEY_SECRET=your-secret
OSS_BUCKET=lumina-photos
```

---

#### 2. 腾讯云 COS（对象存储）

**价格**：约 ¥0.10/GB/月（标准存储）

**适用场景**：国内用户访问

**集成步骤**：
```bash
# 安装 SDK
npm install cos-nodejs-sdk-v5

# 配置环境变量
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_BUCKET=lumina-photos
COS_REGION=ap-guangzhou
```

---

#### 3. AWS S3（国际方案）

**价格**：约 $0.023/GB/月（标准存储）

**适用场景**：全球用户访问

**集成步骤**：
```bash
# 安装 SDK
npm install @aws-sdk/client-s3

# 配置环境变量
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=lumina-photos
```

---

## 📈 存储容量估算

### 示例计算（1000个活跃用户）

假设每个用户每月上传 10 张照片，每张照片平均 2MB：

```
照片数量/月 = 1000用户 × 10张 = 10,000张
存储空间/月 = 10,000张 × 2MB = 20GB

一年累计：
- 照片数量：120,000张
- 存储空间：240GB
- 本地磁盘：接近满载（256GB总容量）
- 云存储成本：约 ¥30/月（阿里云OSS）
```

---

## ✅ 当前方案总结

| 数据类型 | 存储方式 | 存储位置 | 持久化 | 备份 |
|---------|---------|---------|-------|------|
| 用户信息 | MongoDB | 数据库 | ✅ 是 | ✅ mongodump |
| 照片元数据 | MongoDB | 数据库 | ✅ 是 | ✅ mongodump |
| 照片文件 | 本地磁盘 | /var/www/lumina/uploads | ✅ 是 | ⚠️ 需手动备份 |
| 短信验证码 | MongoDB | 数据库 | ⏰ 5分钟 | ❌ 自动过期 |

---

## 🔒 安全建议

1. **密码加密**：当前密码明文存储，建议使用 bcrypt 加密
   ```bash
   npm install bcrypt
   ```

2. **数据库访问控制**：配置 MongoDB 用户认证
   ```bash
   # 创建管理员用户
   use admin
   db.createUser({
     user: "admin",
     pwd: "strong-password",
     roles: ["root"]
   })
   ```

3. **定期备份**：设置自动备份任务
   ```bash
   # 添加到 crontab
   0 2 * * * mongodump --db lumina --out /backup/$(date +\%Y\%m\%d)
   ```

4. **照片文件权限**：确保上传目录权限正确
   ```bash
   sudo chmod 755 /var/www/lumina/uploads
   sudo chown -R www-data:www-data /var/www/lumina/uploads
   ```

---

## 📞 需要升级到云存储？

如果需要我帮你实现云存储集成（阿里云 OSS / 腾讯云 COS），请告诉我你选择哪个云服务商，我会帮你完成代码修改和配置！
