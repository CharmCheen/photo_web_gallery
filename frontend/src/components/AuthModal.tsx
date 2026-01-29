import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModalProps } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Loader2, Mail, Lock, User } from 'lucide-react';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode, onSuccess }) => {
  const { login, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', code: '' });
  const [localError, setLocalError] = useState('');
  const [localHint, setLocalHint] = useState('');
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', password: '', code: '' });
      setLocalError('');
      setLocalHint('');
      setCodeCooldown(0);
    }
  }, [isOpen, mode]);

  // 倒计时
  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setInterval(() => {
      setCodeCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeCooldown]);

  // 发送验证码
  const handleSendCode = async () => {
    const email = formData.email.trim();
    if (!email) {
      setLocalError('请输入邮箱');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    setLocalError('');
    setCodeSending(true);

    try {
      const purpose = mode === 'login' ? 'login' : 'register';
      const result = await api.auth.sendCode(email, purpose);
      setLocalHint(result.code ? `验证码已发送（演示：${result.code}）` : '验证码已发送至邮箱');
      setCodeCooldown(result.cooldown || 60);
    } catch (err: any) {
      setLocalError(err.message || '发送失败');
    } finally {
      setCodeSending(false);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const email = formData.email.trim();
    const code = formData.code.trim();
    const name = formData.name.trim();
    const password = formData.password.trim();

    if (!email) {
      setLocalError('请输入邮箱');
      return;
    }

    if (!code) {
      setLocalError('请输入验证码');
      return;
    }

    if (code.length !== 6) {
      setLocalError('验证码为6位数字');
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email, code });
      } else {
        if (!name) {
          setLocalError('请输入名字');
          return;
        }
        await register({ name, email, code, password: password || undefined });
      }
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || '认证失败');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-[#1c1c1e] rounded-[20px] p-8 shadow-2xl border border-white/5 relative overflow-hidden"
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-5 right-5 text-secondary hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              {/* Header */}
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                {mode === 'login' ? '欢迎回来' : '创建账户'}
              </h2>
              <p className="text-secondary text-sm mb-8 text-center px-4">
                {mode === 'login' 
                  ? '使用邮箱验证码登录你的账户' 
                  : '加入 Lumina，与全球视觉创作者同行'}
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Name (register only) */}
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg pl-12 pr-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder="你的名字"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#2c2c2e] border-none rounded-lg pl-12 pr-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                    placeholder="电子邮箱"
                  />
                </div>

                {/* Verification Code */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                    className="flex-1 bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px] tracking-widest"
                    placeholder="6位验证码"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={codeCooldown > 0 || codeSending}
                    className="px-5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {codeSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : codeCooldown > 0 ? (
                      `${codeCooldown}s`
                    ) : (
                      '发送验证码'
                    )}
                  </button>
                </div>

                {/* Password (register only, optional) */}
                {mode === 'register' && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg pl-12 pr-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder="设置密码（可选，至少6位）"
                    />
                  </div>
                )}

                {/* Hints & Errors */}
                {localHint && (
                  <p className="text-emerald-400 text-xs text-center bg-emerald-400/10 py-2 px-3 rounded-lg">
                    {localHint}
                  </p>
                )}
                {localError && (
                  <p className="text-red-400 text-xs text-center bg-red-400/10 py-2 px-3 rounded-lg">
                    {localError}
                  </p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent text-white py-3.5 rounded-lg font-medium hover:bg-accent/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[15px] mt-2"
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : mode === 'login' ? '登录' : '注册'}
                </button>
              </form>

              {/* Switch Mode */}
              <div className="mt-6 text-center">
                <button onClick={onSwitchMode} className="text-accent text-sm hover:text-accent/80 transition-colors font-medium">
                  {mode === 'login' ? '没有账户？点击注册' : '已有账户？返回登录'}
                </button>
              </div>

              {/* Footer */}
              <p className="mt-6 text-secondary/50 text-xs text-center">
                登录即表示你同意我们的服务条款和隐私政策
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
