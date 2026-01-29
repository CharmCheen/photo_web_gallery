import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Photo } from '../types';
import { api } from '../services/api';
import { Download, X, Heart, Share2, Trash2, Loader2 } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onDownload: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ photo, onClose, onDownload, onDelete }) => {
  const { user } = useAuth();
  const [currentPhoto, setCurrentPhoto] = useState(photo);
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 判断是否是作者本人
  const isOwner = user && currentPhoto.authorId === user.id;

  // 检查用户是否已点赞
  useEffect(() => {
    if (!user) return;
    const checkLikeStatus = async () => {
      try {
        const result = await api.photos.checkLikes(user.id, [currentPhoto.id]);
        setIsLiked(result.likes[currentPhoto.id] || false);
      } catch (error) {
        console.error('获取点赞状态失败:', error);
      }
    };
    checkLikeStatus();
  }, [user, currentPhoto.id]);

  const handleLike = async () => {
    if (isLiking || !user) return;
    setIsLiking(true);
    try {
      const result = await api.photos.like(currentPhoto.id, user.id);
      setCurrentPhoto(prev => ({ ...prev, likes: result.likes }));
      setIsLiked(result.liked);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!user || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.photos.delete(currentPhoto.id, user.id);
      onDelete?.(currentPhoto.id);
      onClose();
    } catch (error) {
      console.error('删除失败:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.origin + '/?photo=' + currentPhoto.id;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.description || '精彩照片',
          text: `来自 ${currentPhoto.author} 的作品`,
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('链接已复制到剪贴板');
    }).catch(() => {
      alert('分享链接：' + text);
    });
  };

  const handleDownload = () => {
    // 创建一个隐藏的 a 标签来触发下载
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `lumina-${currentPhoto.id}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownload(currentPhoto);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
      onClick={onClose}
    >
        {/* Close Button */}
        <div className="absolute top-6 right-6 z-50">
           <button 
             onClick={onClose}
             className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1c1c1e]/40 hover:bg-[#1c1c1e] text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/5"
           >
             <X size={20} />
           </button>
        </div>

      <motion.div
        layoutId={`card-container-${photo.id}`}
        className="relative w-full h-full md:h-[92vh] md:w-[92vw] max-w-[1600px] md:rounded-[24px] bg-[#000000] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Image Area */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-0 md:p-8">
           <motion.img
            layoutId={`image-${currentPhoto.id}`}
            src={currentPhoto.url}
            alt={currentPhoto.description}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="w-full md:w-[400px] bg-[#1c1c1e]/80 backdrop-blur-2xl flex flex-col border-l border-white/5"
        >
          <div className="flex-1 overflow-y-auto p-10">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-medium text-xl shadow-lg">
                    {currentPhoto.author[0]}
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg tracking-tight">{currentPhoto.author}</h3>
                    <p className="text-secondary text-sm font-medium">独立摄影师</p>
                </div>
            </div>

            <div className="h-px bg-white/5 w-full mb-8" />

            {/* Description */}
            <div className="space-y-8">
                <div>
                   <h4 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 opacity-60">作品描述</h4>
                   <p className="text-primary text-[15px] leading-7 font-normal text-justify">
                    {currentPhoto.description || "这个作品没有添加描述"}
                   </p>
                </div>

                <div>
                   <h4 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 opacity-60">标签</h4>
                   <div className="flex flex-wrap gap-2">
                      {currentPhoto.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 text-primary/80 text-xs font-medium hover:bg-white/10 transition-colors cursor-default border border-white/5">
                              #{tag}
                          </span>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                        <span className="block text-secondary text-xs mb-1.5 opacity-60 font-bold uppercase tracking-wider">尺寸</span>
                        <span className="text-primary font-mono text-sm">{currentPhoto.width} × {currentPhoto.height}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-8 border-t border-white/5 space-y-3 bg-[#1c1c1e]/40">
             <button 
                onClick={handleDownload}
                className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:bg-[#f5f5f7] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] shadow-lg shadow-white/5"
            >
                <Download size={18} />
                <span>下载原图</span>
             </button>
             
             <div className="flex space-x-3">
                 <button 
                    onClick={handleLike}
                    disabled={isLiking || !user}
                    title={!user ? '请先登录' : isLiked ? '取消点赞' : '点赞'}
                    className={`flex-1 py-4 rounded-2xl font-medium transition-all flex items-center justify-center space-x-2 border disabled:opacity-50 ${
                      isLiked 
                        ? 'bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30' 
                        : 'bg-white/5 text-white/90 border-white/5 hover:bg-white/10'
                    }`}
                 >
                    <Heart size={18} className={`${isLiking ? 'animate-pulse' : ''} ${isLiked ? 'fill-current' : ''}`} />
                    <span>{currentPhoto.likes}</span>
                 </button>
                 <button 
                    onClick={handleShare}
                    className="flex-1 bg-white/5 text-white/90 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"
                 >
                    <Share2 size={18} />
                 </button>
                 {isOwner && (
                   <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="flex-1 bg-red-500/10 text-red-400 py-4 rounded-2xl font-medium hover:bg-red-500/20 transition-all flex items-center justify-center border border-red-500/20 disabled:opacity-50"
                   >
                      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                   </button>
                 )}
             </div>

             {/* 删除确认对话框 */}
             {showDeleteConfirm && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
               >
                 <p className="text-red-400 text-sm mb-3 text-center">确定要删除这张照片吗？此操作不可撤销。</p>
                 <div className="flex space-x-2">
                   <button
                     onClick={() => setShowDeleteConfirm(false)}
                     className="flex-1 py-2 rounded-lg bg-white/5 text-white/70 text-sm hover:bg-white/10"
                   >
                     取消
                   </button>
                   <button
                     onClick={handleDelete}
                     disabled={isDeleting}
                     className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center"
                   >
                     {isDeleting ? <Loader2 size={14} className="animate-spin" /> : '确认删除'}
                   </button>
                 </div>
               </motion.div>
             )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
