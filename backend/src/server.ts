import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage() });

type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
};

type Photo = {
  id: string;
  url: string;
  width: number;
  height: number;
  author: string;
  likes: number;
  description: string;
  tags: string[];
};

const users = new Map<string, User>();
const smsCodes = new Map<string, { code: string; expiresAt: number }>();

const randomId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const CHINESE_BIOS = [
  '用镜头记录感动的瞬间',
  '数码游民 / 视觉设计师',
  '胶片摄影爱好者',
  '寻找城市角落里的光',
  '独立摄影师，接约拍',
  '生活在别处',
  '黑白摄影师',
  '色彩管理专家',
];

const TAGS_POOL = ['风景', '人像', '黑白', '夜景', '城市', '自然', '胶片', '极简'];

const listPhotos = (page = 1, limit = 24): Photo[] => {
  return Array.from({ length: limit }).map((_, i) => {
    const id = (page - 1) * limit + i;
    const width = 600;
    const height = Math.floor(Math.random() * (900 - 400 + 1) + 400);
    return {
      id: `photo-${id}`,
      url: `https://picsum.photos/${width}/${height}?random=${id + 100}`,
      width,
      height,
      author: `摄影师 ${Math.floor(Math.random() * 10) + 1}`,
      likes: Math.floor(Math.random() * 1000) + 50,
      description: CHINESE_BIOS[Math.floor(Math.random() * CHINESE_BIOS.length)],
      tags: TAGS_POOL.sort(() => 0.5 - Math.random()).slice(0, 3),
    };
  });
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/sms/send', (req: Request, res: Response) => {
  const schema = z.object({ phone: z.string().min(6) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '请输入手机号' });
    return;
  }

  const code = randomCode();
  smsCodes.set(result.data.phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

  res.json({
    message: '验证码已发送',
    cooldown: 60,
    code: process.env.NODE_ENV === 'production' ? undefined : code,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
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

  if (payload.method === 'password') {
    if (!payload.email || !payload.password) {
      res.status(400).json({ message: '请输入邮箱和密码' });
      return;
    }
    if (payload.email === 'fail@test.com') {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }
  } else {
    if (!payload.phone || !payload.code) {
      res.status(400).json({ message: '请输入手机号和验证码' });
      return;
    }
    const cached = smsCodes.get(payload.phone);
    if (!cached || cached.code !== payload.code || cached.expiresAt < Date.now()) {
      res.status(401).json({ message: '验证码错误或已过期' });
      return;
    }
  }

  const user: User = {
    id: 'user-1',
    name: '演示用户',
    email: payload.email,
    phone: payload.phone,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    bio: '探索未知的视觉边界。',
  };

  users.set(user.id, user);
  res.json(user);
});

app.post('/api/auth/register', (req: Request, res: Response) => {
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

  const cached = smsCodes.get(result.data.phone);
  if (!cached || cached.code !== result.data.code || cached.expiresAt < Date.now()) {
    res.status(401).json({ message: '验证码错误或已过期' });
    return;
  }

  const user: User = {
    id: randomId('user'),
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(result.data.name)}`,
    bio: '新晋视觉创作者。',
  };

  users.set(user.id, user);
  res.json(user);
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.status(204).send();
});

app.get('/api/photos', (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 24);
  res.json(listPhotos(page, limit));
});

app.post('/api/photos/upload', upload.single('file'), (req: Request, res: Response) => {
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(),
    url: z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: '上传信息不完整' });
    return;
  }

  const { description, tags, url } = result.data;
  const photo: Photo = {
    id: randomId('photo'),
    url: url || 'https://picsum.photos/1200/900?random=999',
    width: 1200,
    height: 900,
    author: '你',
    likes: 0,
    description: description || '未命名作品',
    tags: tags ? tags.split(/[,，]/).map((t: string) => t.trim()).filter(Boolean) : ['精选'],
  };

  res.json(photo);
});

app.get('/api/user/:id', (req: Request, res: Response) => {
  const user = users.get(req.params.id);
  if (!user) {
    res.json({
      id: req.params.id,
      name: '演示用户',
      email: 'demo@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      bio: '热爱生活，热爱摄影。',
    });
    return;
  }
  res.json(user);
});

app.listen(port, () => {
  console.log(`Lumina backend running on http://localhost:${port}`);
});
