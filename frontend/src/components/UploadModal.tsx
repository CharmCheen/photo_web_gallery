import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadModalProps, Photo } from '../types';
import { api } from '../services/api';
import { Upload, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, onError }) => {
    const [step, setStep] = useState<'drop' | 'details' | 'uploading' | 'success'>('drop');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [metadata, setMetadata] = useState({ title: '', description: '', tags: '' });
    const [progress, setProgress] = useState(0);
    const [localError, setLocalError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('drop');
            setFile(null);
            setPreviewUrl('');
            setMetadata({ title: '', description: '', tags: '' });
            setProgress(0);
            setLocalError('');
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileSelect = (selectedFile: File) => {
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setStep('details');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleUploadStart = async () => {
        if (!file) {
            return;
        }
        setStep('uploading');
        setLocalError('');
        let current = 0;
        const interval = setInterval(() => {
            current = Math.min(current + Math.random() * 8, 90);
            setProgress(current);
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', metadata.title);
            formData.append('description', metadata.description);
            formData.append('tags', metadata.tags);

            const uploaded = await api.photos.upload(formData);
            setProgress(100);
            setStep('success');

            setTimeout(() => {
                onUpload(uploaded);
                onClose();
            }, 1200);
        } catch (err: any) {
            const message = err?.message || '上传失败，请稍后重试';
            setStep('details');
            setProgress(0);
            setLocalError(message);
            onError?.(message);
        } finally {
            clearInterval(interval);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xl"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1c1c1e] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row rounded-[24px] border border-white/5"
                        style={{ minHeight: '500px' }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-20 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                        >
                            <X size={20} />
                        </button>

                        {/* Left Side: Visual/Preview */}
                        <div className="w-full md:w-1/2 bg-black/50 border-b md:border-b-0 md:border-r border-white/5 flex items-center justify-center p-8 relative overflow-hidden">
                            {previewUrl ? (
                                <motion.img
                                    layoutId="upload-preview"
                                    src={previewUrl}
                                    className="max-w-full max-h-[300px] object-contain rounded-lg shadow-2xl"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                />
                            ) : (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className="w-full h-full min-h-[300px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 hover:border-accent/50 hover:bg-white/5 transition-all cursor-pointer group"
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="text-white/50 group-hover:text-accent" size={28} />
                                    </div>
                                    <h3 className="text-white font-medium mb-2">点击或拖拽上传</h3>
                                    <p className="text-secondary text-xs">支持 JPG, PNG 高清格式</p>
                                    <input
                                        type="file"
                                        ref={inputRef}
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Side: Form / Status */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-[#1c1c1e]">
                            <AnimatePresence mode="wait">
                                {step === 'drop' && (
                                    <motion.div
                                        key="intro"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center md:text-left"
                                    >
                                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent">
                                            <ImageIcon size={24} />
                                        </div>
                                        <h2 className="text-2xl font-semibold text-white mb-3">分享您的<br />视觉故事</h2>
                                        <p className="text-secondary text-sm leading-relaxed">
                                            上传您的摄影作品，加入全球视觉创作者社区。无论是胶片、数码还是生成艺术，这里是您的展示舞台。
                                        </p>
                                    </motion.div>
                                )}

                                {step === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <h3 className="text-lg font-medium text-white">作品详情</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium">标题</label>
                                                <input
                                                    type="text"
                                                    value={metadata.title}
                                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                                    className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3 text-white text-sm placeholder-secondary/50 focus:ring-1 focus:ring-accent outline-none"
                                                    placeholder="未命名作品"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium">描述</label>
                                                <textarea
                                                    value={metadata.description}
                                                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                                                    className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3 text-white text-sm placeholder-secondary/50 focus:ring-1 focus:ring-accent outline-none h-24 resize-none"
                                                    placeholder="讲述这张照片背后的故事..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-secondary mb-2 font-medium">标签</label>
                                                <input
                                                    type="text"
                                                    value={metadata.tags}
                                                    onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                                                    className="w-full bg-[#2c2c2e] border-none rounded-lg px-4 py-3 text-white text-sm placeholder-secondary/50 focus:ring-1 focus:ring-accent outline-none"
                                                    placeholder="风景, 人像, 黑白 (用逗号分隔)"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleUploadStart}
                                            className="w-full bg-accent text-white py-3.5 rounded-xl font-medium hover:bg-accent/90 transition-all active:scale-[0.98] text-sm mt-4"
                                        >
                                            发布作品
                                        </button>
                                                        {localError && (
                                                            <p className="text-red-400 text-xs text-center mt-3">{localError}</p>
                                                        )}
                                    </motion.div>
                                )}

                                {step === 'uploading' && (
                                    <motion.div
                                        key="uploading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center text-center space-y-6"
                                    >
                                        <div className="relative w-20 h-20">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="36" stroke="#333" strokeWidth="4" fill="none" />
                                                <circle cx="40" cy="40" r="36" stroke="#2997ff" strokeWidth="4" fill="none" strokeDasharray="226" strokeDashoffset={226 - (226 * progress) / 100} className="transition-all duration-300 ease-linear" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-sm">
                                                {Math.round(progress)}%
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium mb-1">正在上传...</h3>
                                            <p className="text-secondary text-xs">正在处理图像并生成预览</p>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center justify-center text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium text-lg">发布成功</h3>
                                            <p className="text-secondary text-sm">您的作品现已上线</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
