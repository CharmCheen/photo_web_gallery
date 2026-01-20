# Lumina Backend

与前端对齐的最小可用后端服务（短信验证码 + 登录/注册 + 作品列表/上传）。

## 启动

- 开发：`npm run dev`
- 构建：`npm run build`
- 运行：`npm run start`

默认端口：`4000`

## 接口

- `POST /api/auth/sms/send`
  - body: `{ phone: string }`
  - response: `{ message, cooldown, code? }`

- `POST /api/auth/login`
  - body (密码): `{ method: "password", email, password }`
  - body (短信): `{ method: "sms", phone, code }`
  - response: `User`

- `POST /api/auth/register`
  - body: `{ name, phone, code, email?, password? }`
  - response: `User`

- `POST /api/auth/logout`

- `GET /api/photos?page=&limit=`
  - response: `Photo[]`

- `POST /api/photos/upload` (multipart/form-data)
  - fields: `title?`, `description?`, `tags?`, `url?`, `file?`
  - response: `Photo`

- `GET /api/user/:id`
  - response: `User`

## 说明

- 验证码演示环境会返回 `code` 字段，便于前端联调。
- 生产环境可通过 `NODE_ENV=production` 隐藏验证码。
