import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { connectDatabase } from './database.js';
import { UserModel, VerificationCodeModel, PhotoModel, LikeModel } from './models.js';
import { sendVerificationEmail } from './emailService.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);
const CODE_TTL_MS = 5 * 60 * 1000; // 验证码有效期5分钟
const CODE_COOLDOWN_SECONDS = 60; // 发送冷却时间60秒

// 配置文件上传目录
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const THUMBNAIL_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const FILE_URL_PREFIX = process.env.FILE_URL_PREFIX || `http://localhost:${port}/uploads`;

// 缩略图配置
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 80;

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(THUMBNAIL_DIR)) {
  fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
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

// 发送验证码（仅邮箱）
const issueVerificationCode = async (email: string, purpose: 'login' | 'register' | 'reset' = 'login') => {
  const code = randomCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // 删除该邮箱的旧验证码
  await VerificationCodeModel.deleteMany({ email, purpose });
  await VerificationCodeModel.create({ email, code, purpose, expiresAt });

  // 发送邮件
  await sendVerificationEmail(email, code);

  return code;
};

// 验证验证码
const verifyCode = async (email: string, code: string, purpose: 'login' | 'register' | 'reset' = 'login') => {
  const record = await VerificationCodeModel.findOneAndDelete({
    email,
    code,
    purpose,
    expiresAt: { $gt: new Date() },
  });

  return Boolean(record);
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// 发送验证码（登录/注册通用）
app.post('/api/auth/code/send', async (req: Request, res: Response) => {
  const schema = z.object({ 
    email: z.string().email(),
    purpose: z.enum(['login', 'register', 'reset']).optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请输入有效邮箱' });
    return;
  }

  const { email, purpose = 'login' } = result.data;

  try {
    // 注册时检查邮箱是否已存在
    if (purpose === 'register') {
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: '该邮箱已注册，请直接登录' });
        return;
      }
    }

    // 登录时检查用户是否存在
    if (purpose === 'login') {
      const existingUser = await UserModel.findOne({ email });
      if (!existingUser) {
        res.status(404).json({ message: '该邮箱尚未注册' });
        return;
      }
    }

    const code = await issueVerificationCode(email, purpose);

    res.json({
      message: '验证码已发送至邮箱',
      cooldown: CODE_COOLDOWN_SECONDS,
      code: process.env.NODE_ENV === 'production' ? undefined : code,
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ message: '验证码发送失败，请稍后重试' });
  }
});

// 登录（邮箱+验证码）
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请输入邮箱和验证码' });
    return;
  }

  const { email, code } = result.data;

  // 验证验证码
  const isValid = await verifyCode(email, code, 'login');
  if (!isValid) {
    res.status(401).json({ message: '验证码错误或已过期' });
    return;
  }

  // 查找用户
  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(404).json({ message: '用户不存在，请先注册' });
    return;
  }

  // 更新邮箱验证状态
  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
  });
});

// 注册（邮箱+验证码+名字）
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1, '请输入名字').max(50, '名字过长'),
    email: z.string().email('请输入有效邮箱'),
    code: z.string().length(6, '验证码为6位数字'),
    password: z.string().min(6, '密码至少6位').optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.errors[0]?.message || '请填写必要信息';
    res.status(400).json({ message: firstError });
    return;
  }

  const { name, email, code, password } = result.data;

  // 检查邮箱是否已注册
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: '该邮箱已注册' });
    return;
  }

  // 验证验证码
  const isValid = await verifyCode(email, code, 'register');
  if (!isValid) {
    res.status(401).json({ message: '验证码错误或已过期' });
    return;
  }

  // 创建用户
  const user = await UserModel.create({
    name,
    email,
    password, // 实际应用中应该加密
    emailVerified: true,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    bio: '新晋视觉创作者。',
  });

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.status(204).send();
});

app.get('/api/photos', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
  const authorId = req.query.authorId as string | undefined;
  const tag = req.query.tag as string | undefined;
  const search = req.query.search as string | undefined;

  // 构建查询条件
  const query: any = {};
  if (authorId) {
    query.authorId = authorId;
  }
  if (tag) {
    query.tags = tag;
  }
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ];
  }

  const [photos, total] = await Promise.all([
    PhotoModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PhotoModel.countDocuments(query),
  ]);

  const hasMore = page * limit < total;
  
  res.json({
    photos: photos.map(photo => ({
      id: photo._id.toString(),
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl || photo.url, // 兼容旧数据
      width: photo.width,
      height: photo.height,
      author: photo.author,
      authorId: photo.authorId,
      likes: photo.likes,
      description: photo.description,
      tags: photo.tags,
    })),
    pagination: {
      page,
      limit,
      total,
      hasMore,
      totalPages: Math.ceil(total / limit),
    },
  });
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
  
  try {
    // 读取图片元数据获取真实尺寸
    const imagePath = req.file.path;
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 900;

    // 生成缩略图文件名
    const thumbnailFilename = `thumb-${req.file.filename}`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);

    // 生成缩略图（保持比例，宽度最大400px）
    await sharp(imagePath)
      .resize(THUMBNAIL_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbnailPath);

    const fileUrl = `${FILE_URL_PREFIX}/${req.file.filename}`;
    const thumbnailUrl = `${FILE_URL_PREFIX}/thumbnails/${thumbnailFilename}`;
    
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
      thumbnailUrl: thumbnailUrl,
      width,
      height,
      author: authorName,
      authorId: authorId || undefined,
      likes: 0,
      description: description || '未命名作品',
      tags: tags ? tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean) : ['精选'],
    });

    res.json({
      id: photo._id.toString(),
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      width: photo.width,
      height: photo.height,
      author: photo.author,
      authorId: photo.authorId,
      likes: photo.likes,
      description: photo.description,
      tags: photo.tags,
    });
  } catch (error) {
    console.error('图片处理失败:', error);
    // 清理已上传的文件
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: '图片处理失败，请重试' });
  }
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

// 点赞/取消点赞照片
app.post('/api/photos/:id/like', async (req: Request, res: Response) => {
  const schema = z.object({
    userId: z.string(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请先登录' });
    return;
  }

  const { userId } = result.data;
  const photoId = req.params.id;

  try {
    const photo = await PhotoModel.findById(photoId);
    if (!photo) {
      res.status(404).json({ message: '照片不存在' });
      return;
    }

    // 检查是否已点赞
    const existingLike = await LikeModel.findOne({ userId, photoId });

    if (existingLike) {
      // 取消点赞
      await LikeModel.deleteOne({ userId, photoId });
      photo.likes = Math.max(0, photo.likes - 1);
      await photo.save();
      res.json({ likes: photo.likes, liked: false });
    } else {
      // 添加点赞
      await LikeModel.create({ userId, photoId });
      photo.likes += 1;
      await photo.save();
      res.json({ likes: photo.likes, liked: true });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ message: '操作失败' });
  }
});

// 检查用户对某些照片的点赞状态
app.get('/api/photos/likes', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const photoIds = (req.query.photoIds as string)?.split(',').filter(Boolean);

  if (!userId || !photoIds?.length) {
    res.json({ likes: {} });
    return;
  }

  try {
    const likes = await LikeModel.find({ userId, photoId: { $in: photoIds } });
    const likeMap: Record<string, boolean> = {};
    photoIds.forEach((id: string) => { likeMap[id] = false; });
    likes.forEach((like: { photoId: string }) => { likeMap[like.photoId] = true; });
    res.json({ likes: likeMap });
  } catch (error) {
    res.status(500).json({ message: '查询失败' });
  }
});

// 获取热门标签
app.get('/api/tags/popular', async (_req: Request, res: Response) => {
  try {
    const result = await PhotoModel.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json({
      tags: result.map((item: { _id: string; count: number }) => ({ name: item._id, count: item.count })),
    });
  } catch (error) {
    res.status(500).json({ message: '获取标签失败' });
  }
});

// 删除照片
app.delete('/api/photos/:id', async (req: Request, res: Response) => {
  const { authorId } = req.query;

  if (!authorId) {
    res.status(401).json({ message: '请先登录' });
    return;
  }

  try {
    const photo = await PhotoModel.findById(req.params.id);
    if (!photo) {
      res.status(404).json({ message: '照片不存在' });
      return;
    }

    // 验证是否为作者本人
    if (photo.authorId !== authorId) {
      res.status(403).json({ message: '只能删除自己上传的照片' });
      return;
    }

    // 删除原图文件
    const filename = photo.url.split('/').pop();
    if (filename) {
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 删除缩略图文件
    if (photo.thumbnailUrl) {
      const thumbFilename = photo.thumbnailUrl.split('/').pop();
      if (thumbFilename) {
        const thumbPath = path.join(THUMBNAIL_DIR, thumbFilename);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    }

    // 从数据库删除
    await PhotoModel.findByIdAndDelete(req.params.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({ message: '删除失败' });
  }
});

app.listen(port, () => {
  console.log(`Lumina backend running on http://localhost:${port}`);
});
