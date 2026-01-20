import React from 'react';
import { motion } from 'framer-motion';
import { Photo } from '../types';
import { Download, X, Heart, Share2 } from 'lucide-react'; 

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onDownload: (photo: Photo) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ photo, onClose, onDownload }) => {
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
            layoutId={`image-${photo.id}`}
            src={photo.url}
            alt={photo.description}
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
                    {photo.author[0]}
                </div>
                <div>
                    <h3 className="text-white font-semibold text-lg tracking-tight">{photo.author}</h3>
                    <p className="text-secondary text-sm font-medium">视觉与影像</p>
                </div>
            </div>

            <div className="h-px bg-white/5 w-full mb-8" />

            {/* Description */}
            <div className="space-y-8">
                <div>
                   <h4 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 opacity-60">作品诠释</h4>
                   <p className="text-primary text-[15px] leading-7 font-normal text-justify">
                    {photo.description || "该作品暂无艺术家描述。"}
                   </p>
                </div>

                <div>
                   <h4 className="text-secondary text-xs font-bold uppercase tracking-widest mb-3 opacity-60">标签</h4>
                   <div className="flex flex-wrap gap-2">
                      {photo.tags.map(tag => (
                          <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 text-primary/80 text-xs font-medium hover:bg-white/10 transition-colors cursor-default border border-white/5">
                              #{tag}
                          </span>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                        <span className="block text-secondary text-xs mb-1.5 opacity-60 font-bold uppercase tracking-wider">尺寸</span>
                        <span className="text-primary font-mono text-sm">{photo.width}  {photo.height}</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-8 border-t border-white/5 space-y-3 bg-[#1c1c1e]/40">
             <button 
                onClick={() => onDownload(photo)}
                className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:bg-[#f5f5f7] transition-all flex items-center justify-center space-x-2 active:scale-[0.98] shadow-lg shadow-white/5"
            >
                <Download size={18} />
                <span>下载原图</span>
             </button>
             
             <div className="flex space-x-3">
                 <button className="flex-1 bg-white/5 text-white/90 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all flex items-center justify-center space-x-2 border border-white/5">
                    <Heart size={18} />
                    <span>{photo.likes}</span>
                 </button>
                 <button className="flex-1 bg-white/5 text-white/90 py-4 rounded-2xl font-medium hover:bg-white/10 transition-all flex items-center justify-center border border-white/5">
                    <Share2 size={18} />
                 </button>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
