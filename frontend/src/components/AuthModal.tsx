import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthModalProps } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Loader2 } from 'lucide-react';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode, onClose, onSwitchMode, onSuccess }) => {
  const { login, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', code: '' });
  const [loginMethod, setLoginMethod] = useState<'password' | 'sms'>('sms');
  const [registerMethod, setRegisterMethod] = useState<'none' | 'phone' | 'email'>('none');
  const [localError, setLocalError] = useState('');
  const [localHint, setLocalHint] = useState('');
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', password: '', phone: '', code: '' });
      setLocalError('');
      setLocalHint('');
      setLoginMethod('sms');
      setRegisterMethod('none');
      setCodeCooldown(0);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setInterval(() => {
      setCodeCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeCooldown]);

  useEffect(() => {
    if (mode === 'register') {
      setCodeCooldown(0);
      setLocalHint('');
      setLocalError('');
    }
  }, [registerMethod, mode]);

  const handleSendCode = async () => {
    try {
      setLocalError('');

      if (mode === 'login') {
        if (loginMethod !== 'sms') {
          setLocalError('当前登录方式无需验证码');
          return;
        }
        if (!formData.phone.trim()) {
          setLocalError('请输入手机号');
          return;
        }
        const result = await api.auth.sendSms(formData.phone.trim());
        setLocalHint(result.code ? `验证码已发送（演示：${result.code}）` : '验证码已发送');
        setCodeCooldown(result.cooldown || 60);
        return;
      }

      if (registerMethod === 'none') {
        setLocalError('当前注册方式无需验证码');
        return;
      }

      if (registerMethod === 'phone') {
        if (!formData.phone.trim()) {
          setLocalError('请输入手机号');
          return;
        }
        const result = await api.auth.sendSms(formData.phone.trim());
        setLocalHint(result.code ? `验证码已发送（演示：${result.code}）` : '验证码已发送');
        setCodeCooldown(result.cooldown || 60);
        return;
      }

      if (registerMethod === 'email') {
        if (!formData.email.trim()) {
          setLocalError('请输入邮箱');
          return;
        }
        const result = await api.auth.sendEmail(formData.email.trim());
        setLocalHint(result.code ? `验证码已发送至邮箱（演示：${result.code}）` : '验证码已发送至邮箱');
        setCodeCooldown(result.cooldown || 60);
        return;
      }
    } catch (err: any) {
      setLocalError(err.message || '发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    let completed = false;

    try {
      if (mode === 'login') {
        if (loginMethod === 'password') {
          if (!formData.email.trim() || !formData.password.trim()) {
            setLocalError('请输入邮箱和密码');
            return;
          }
          await login({ method: 'password', email: formData.email.trim(), password: formData.password.trim() });
          completed = true;
        } else {
          if (!formData.phone.trim() || !formData.code.trim()) {
            setLocalError('请输入手机号和验证码');
            return;
          }
          await login({ method: 'sms', phone: formData.phone.trim(), code: formData.code.trim() });
          completed = true;
        }
      } else {
        const name = formData.name.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();
        const code = formData.code.trim();
        const password = formData.password.trim();

        if (!name) {
          setLocalError('请填写名字');
          return;
        }

        if (registerMethod === 'none') {
          if (email || phone) {
            setLocalError('如需绑定邮箱或手机号，请选择对应验证方式');
            return;
          }
          await register({ name, password: password || undefined });
          setLocalHint('已创建账号，无需验证');
          completed = true;
          
        }

        if (registerMethod === 'phone') {
          if (!phone || !code) {
            setLocalError('请输入手机号和验证码');
            return;
          }
          await register({
            name,
            phone,
            code,
            password: password || undefined,
          });
          completed = true;
          
        }

        if (registerMethod === 'email') {
          if (!email || !code) {
            setLocalError('请输入邮箱和验证码');
            return;
          }
          await register({
            name,
            email,
            code,
            password: password || undefined,
          });
          completed = true;
        }
      }
      if (completed && onSuccess) onSuccess();
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
              <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">{mode === 'login' ? '欢迎回来' : '创建账户'}</h2>
              <p className="text-secondary text-sm mb-8 text-center px-4">{mode === 'login' ? '登录以管理你的作品与收藏。' : '加入 Lumina，与全球视觉创作者同行。'}</p>

              {mode === 'login' && (
                <div className="w-full mb-6">
                  <div className="bg-black/30 border border-white/10 rounded-full p-1 grid grid-cols-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('sms')}
                      className={`py-2 rounded-full transition-colors ${loginMethod === 'sms' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
                    >
                      手机验证码
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className={`py-2 rounded-full transition-colors ${loginMethod === 'password' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
                    >
                      邮箱密码
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="w-full mb-6">
                  <div className="bg-black/30 border border-white/10 rounded-full p-1 grid grid-cols-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setRegisterMethod('none')}
                      className={`py-2 rounded-full transition-colors ${registerMethod === 'none' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
                    >
                      无验证
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterMethod('email')}
                      className={`py-2 rounded-full transition-colors ${registerMethod === 'email' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
                    >
                      邮箱验证码
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterMethod('phone')}
                      className={`py-2 rounded-full transition-colors ${registerMethod === 'phone' ? 'bg-white text-black' : 'text-secondary hover:text-white'}`}
                    >
                      手机验证码
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-5">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder="名字"
                    />
                  </div>
                )}

                {((mode === 'login' && loginMethod === 'sms') || (mode === 'register' && registerMethod === 'phone')) && (
                  <div className="space-y-1.5">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder="手机号"
                    />
                  </div>
                )}

                {((mode === 'login' && loginMethod === 'sms') || (mode === 'register' && registerMethod !== 'none')) && (
                  <div className="space-y-1.5">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="flex-1 bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                        placeholder={mode === 'register' && registerMethod === 'email' ? '邮箱验证码' : '验证码'}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={codeCooldown > 0}
                        className="px-4 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码'}
                      </button>
                    </div>
                  </div>
                )}

                {((mode === 'login' && loginMethod === 'password') || (mode === 'register' && registerMethod === 'email')) && (
                  <div className="space-y-1.5">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder="电子邮箱（可选）"
                    />
                  </div>
                )}

                {(mode === 'login' ? loginMethod === 'password' : true) && (
                  <div className="space-y-1.5">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3.5 text-white placeholder-secondary/50 focus:ring-2 focus:ring-accent/50 outline-none transition-all text-[15px]"
                      placeholder={mode === 'register' ? '设置密码（可选，用于密码登录）' : '密码'}
                    />
                  </div>
                )}

                {localHint && <p className="text-emerald-400 text-xs text-center">{localHint}</p>}
                {localError && <p className="text-red-400 text-xs text-center">{localError}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent text-white py-3.5 rounded-lg font-medium hover:bg-accent/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[15px]"
                >
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : mode === 'login' ? '登录' : '注册'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button onClick={onSwitchMode} className="text-accent text-sm hover:text-accent/80 transition-colors font-medium">
                  {mode === 'login' ? '没有账户？点击注册' : '已有账户？返回登录'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
