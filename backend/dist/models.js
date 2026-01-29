import mongoose, { Schema } from 'mongoose';
// 用户 Schema
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    avatar: { type: String },
    bio: { type: String, default: '新晋视觉创作者。' },
    emailVerified: { type: Boolean, default: false },
    phone: { type: String },
}, {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
});
// 验证码 Schema
const VerificationCodeSchema = new Schema({
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ['login', 'register', 'reset'], default: 'login' },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// 自动删除过期验证码
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// 照片 Schema
const PhotoSchema = new Schema({
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
// 点赞记录 Schema
const LikeSchema = new Schema({
    userId: { type: String, required: true, index: true },
    photoId: { type: String, required: true, index: true },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
// 复合索引确保一个用户对一张照片只能点赞一次
LikeSchema.index({ userId: 1, photoId: 1 }, { unique: true });
// 导出模型
export const UserModel = mongoose.model('User', UserSchema);
export const VerificationCodeModel = mongoose.model('VerificationCode', VerificationCodeSchema);
export const PhotoModel = mongoose.model('Photo', PhotoSchema);
export const LikeModel = mongoose.model('Like', LikeSchema);
