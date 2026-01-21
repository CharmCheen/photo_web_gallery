import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { connectDatabase } from './database.js';
import { UserModel, SmsCodeModel, PhotoModel } from './models.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

// 配置文件上传目录
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const FILE_URL_PREFIX = process.env.FILE_URL_PREFIX || `http://localhost:${port}/uploads`;

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 连接数据库
connectDatabase();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

// 静态文件服务 - 提供上传的文件访问
app.use('/uploads', express.static(UPLOAD_DIR));

// 配置 multer 存储到磁盘
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持上传图片文件 (JPEG, PNG, GIF, WebP)'));
    }
  }
});

const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/sms/send', async (req: Request, res: Response) => {
  const schema = z.object({ phone: z.string().min(6) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请输入手机号' });
    return;
  }

  const code = randomCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  // 删除旧验证码
  await SmsCodeModel.deleteMany({ phone: result.data.phone });
  
  // 保存新验证码
  await SmsCodeModel.create({
    phone: result.data.phone,
    code,
    expiresAt,
  });

  res.json({
    message: '验证码已发送',
    cooldown: 60,
    code: process.env.NODE_ENV === 'production' ? undefined : code,
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const schema = z.object({
    method: z.enum(['password', 'sms']),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    phone: z.string().min(6).optional(),
    code: z.string().length(6).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请求参数不正确' });
    return;
  }

  const payload = result.data;
  let user;

  if (payload.method === 'password') {
    if (!payload.email || !payload.password) {
      res.status(400).json({ message: '请输入邮箱和密码' });
      return;
    }
    
    // 查找用户（简化版，实际需要密码加密）
    user = await UserModel.findOne({ email: payload.email });
    if (!user) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }
  } else {
    if (!payload.phone || !payload.code) {
      res.status(400).json({ message: '请输入手机号和验证码' });
      return;
    }
    
    // 验证验证码
    const smsCode = await SmsCodeModel.findOne({ 
      phone: payload.phone,
      code: payload.code,
      expiresAt: { $gt: new Date() }
    });
    
    if (!smsCode) {
      res.status(401).json({ message: '验证码错误或已过期' });
      return;
    }
    
    // 查找或创建用户
    user = await UserModel.findOne({ phone: payload.phone });
    if (!user) {
      res.status(404).json({ message: '用户不存在，请先注册' });
      return;
    }
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    phone: z.string().min(6),
    code: z.string().length(6),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请填写姓名、手机号和验证码' });
    return;
  }

  // 验证验证码
  const smsCode = await SmsCodeModel.findOne({
    phone: result.data.phone,
    code: result.data.code,
    expiresAt: { $gt: new Date() }
  });
  
  if (!smsCode) {
    res.status(401).json({ message: '验证码错误或已过期' });
    return;
  }

  // 检查用户是否已存在
  const existingUser = await UserModel.findOne({ phone: result.data.phone });
  if (existingUser) {
    res.status(400).json({ message: '该手机号已注册' });
    return;
  }

  // 创建新用户
  const user = await UserModel.create({
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    password: result.data.password, // 实际应该加密
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.data.name)}`,
    bio: '新晋视觉创作者。',
  });

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.status(204).send();
});

app.get('/api/photos', async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 24);
  
  const photos = await PhotoModel.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  res.json(photos.map(photo => ({
    id: photo._id.toString(),
    url: photo.url,
    width: photo.width,
    height: photo.height,
    author: photo.author,
    likes: photo.likes,
    description: photo.description,
    tags: photo.tags,
  })));
});

app.post('/api/photos/upload', upload.single('file'), async (req: Request, res: Response) => {
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(),
    authorId: z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '上传信息不完整' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: '请选择要上传的图片' });
    return;
  }

  const { description, tags, authorId } = result.data;
  const fileUrl = `${FILE_URL_PREFIX}/${req.file.filename}`;
  
  // 获取作者信息
  let authorName = '匿名用户';
  if (authorId) {
    const user = await UserModel.findById(authorId);
    if (user) {
      authorName = user.name;
    }
  }
  
  // 保存到数据库
  const photo = await PhotoModel.create({
    url: fileUrl,
    width: 1200,
    height: 900,
    author: authorName,
    authorId: authorId || undefined,
    likes: 0,
    description: description || '未命名作品',
    tags: tags ? tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean) : ['精选'],
  });

  res.json({
    id: photo._id.toString(),
    url: photo.url,
    width: photo.width,
    height: photo.height,
    author: photo.author,
    likes: photo.likes,
    description: photo.description,
    tags: photo.tags,
  });
});

app.get('/api/user/:id', async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: '用户不存在' });
    return;
  }
  
  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    bio: user.bio,
  });
});

// 点赞照片
app.post('/api/photos/:id/like', async (req: Request, res: Response) => {
  try {
    const photo = await PhotoModel.findById(req.params.id);
    if (!photo) {
      res.status(404).json({ message: '照片不存在' });
      return;
    }
    
    photo.likes += 1;
    await photo.save();
    
    res.json({ likes: photo.likes });
  } catch (error) {
    res.status(500).json({ message: '点赞失败' });
  }
});

app.listen(port, () => {
  console.log(`Lumina backend running on http://localhost:${port}`);
});
