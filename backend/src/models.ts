import mongoose, { Schema, Document } from 'mongoose';

// 用户接口
export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户 Schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  avatar: { type: String },
  bio: { type: String, default: '新晋视觉创作者。' },
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
});

// 验证码接口（支持短信和邮箱）
export interface IVerificationCode extends Document {
  channel: 'sms' | 'email';
  phone?: string;
  email?: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

// 验证码 Schema
const VerificationCodeSchema = new Schema<IVerificationCode>({
  channel: { type: String, enum: ['sms', 'email'], required: true },
  phone: { type: String, index: true },
  email: { type: String, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// 自动删除过期验证码
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 照片接口
export interface IPhoto extends Document {
  url: string;
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
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  author: { type: String, required: true },
  authorId: { type: String },
  likes: { type: Number, default: 0 },
  description: { type: String, default: '' },
  tags: { type: [String], default: [] },
}, {
  timestamps: true,
});

// 导出模型
export const UserModel = mongoose.model<IUser>('User', UserSchema);
export const VerificationCodeModel = mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
export const SmsCodeModel = VerificationCodeModel; // 兼容旧命名
export const PhotoModel = mongoose.model<IPhoto>('Photo', PhotoSchema);
