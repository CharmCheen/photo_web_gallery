import mongoose, { Schema, Document } from 'mongoose';

// 用户接口
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 用户 Schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String },
  bio: { type: String, default: '新晋视觉创作者。' },
  emailVerified: { type: Boolean, default: false },
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
});

// 验证码接口（仅邮箱）
export interface IVerificationCode extends Document {
  email: string;
  code: string;
  purpose: 'login' | 'register' | 'reset';
  expiresAt: Date;
  createdAt: Date;
}

// 验证码 Schema
const VerificationCodeSchema = new Schema<IVerificationCode>({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'register', 'reset'], default: 'login' },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// 自动删除过期验证码
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 照片接口
export interface IPhoto extends Document {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  author: string;
  authorId?: string;
  likes: number;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 照片 Schema
const PhotoSchema = new Schema<IPhoto>({
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  author: { type: String, required: true },
  authorId: { type: String, index: true },
  likes: { type: Number, default: 0 },
  description: { type: String, default: '' },
  tags: { type: [String], default: [], index: true },
}, {
  timestamps: true,
});

// 点赞记录接口
export interface ILike extends Document {
  userId: string;
  photoId: string;
  createdAt: Date;
}

// 点赞记录 Schema
const LikeSchema = new Schema<ILike>({
  userId: { type: String, required: true, index: true },
  photoId: { type: String, required: true, index: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// 复合索引确保一个用户对一张照片只能点赞一次
LikeSchema.index({ userId: 1, photoId: 1 }, { unique: true });

// 导出模型
export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const VerificationCodeModel = mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
export const PhotoModel = mongoose.model<IPhoto>('Photo', PhotoSchema);
export const LikeModel = mongoose.model<ILike>('Like', LikeSchema);
